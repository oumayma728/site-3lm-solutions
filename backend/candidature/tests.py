import shutil
import tempfile
from datetime import date
from unittest.mock import MagicMock, patch

import requests
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from offres.models import Offre
from .models import Candidature

MEDIA = tempfile.mkdtemp()


def crm_response(status, body=None):
    resp = MagicMock()
    resp.status_code = status
    resp.json.return_value = body if body is not None else {}
    return resp


@override_settings(MEDIA_ROOT=MEDIA, CRM_API_URL='http://crm.test/', CRM_API_KEY='secret-key')
class AccepterCandidatureTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def setUp(self):
        self.admin = get_user_model().objects.create_user('admin', password='x')
        self.offre = Offre.objects.create(titre='Internship AI', type_offre='stage', programme='pfe', description='d')
        self.c = Candidature.objects.create(
            nom='Sami Ben Ali', email='Sami@Example.com', telephone='+216 20 000 000',
            ecole='ESPRIT', niveau_etude='Cycle ingénieur 2', linkedin_url='https://linkedin.com/in/sami',
            message='Passionné par l’IA', offre=self.offre, type_stage='pfe',
            disponible_du=date(2027, 2, 1), disponible_au=date(2027, 7, 31),
            cv=SimpleUploadedFile('cv.pdf', b'%PDF-1.4 test', content_type='application/pdf'),
            cv_nom_original='MonCV.pdf',
        )
        self.url = f'/api/candidature/{self.c.id}/accepter/'

    def accept(self):
        self.client.force_authenticate(self.admin)
        return self.client.post(self.url)

    def test_anonymous_cannot_accept(self):
        self.assertIn(self.client.post(self.url).status_code, (401, 403))
        self.c.refresh_from_db()
        self.assertEqual(self.c.statut, 'nouvelle')

    @patch('candidature.crm.requests.post')
    def test_accept_sends_the_candidature_to_the_crm(self, post):
        post.return_value = crm_response(201)
        r = self.accept()
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data['crm_ok'])
        self.c.refresh_from_db()
        self.assertEqual(self.c.statut, 'preselectionnee')
        self.assertIsNotNone(self.c.crm_envoye_le)
        self.assertEqual((self.c.crm_tentatives, self.c.crm_erreur), (1, ''))

        args, kwargs = post.call_args
        self.assertEqual(args[0], 'http://crm.test/candidates/')   # trailing slash of the setting is handled
        self.assertEqual(kwargs['headers'], {'X-API-Key': 'secret-key'})
        data = kwargs['data']
        self.assertEqual(data['source_id'], self.c.id)
        self.assertEqual(data['email'], 'sami@example.com')
        self.assertEqual((data['school'], data['study_level'], data['internship_type']), ('ESPRIT', 'Cycle ingénieur 2', 'pfe'))
        self.assertEqual((data['start_date'], data['end_date']), ('2027-02-01', '2027-07-31'))
        self.assertEqual((data['offer_title'], data['offer_id']), ('Internship AI', self.offre.id))
        self.assertEqual(kwargs['files']['cv'][0], 'MonCV.pdf')

    @patch('candidature.crm.requests.post')
    def test_empty_fields_are_not_sent(self, post):
        post.return_value = crm_response(201)
        spontanee = Candidature.objects.create(nom='X', email='x@x.tn', telephone='20000000', reference='Candidature spontanée')
        self.client.force_authenticate(self.admin)
        self.client.post(f'/api/candidature/{spontanee.id}/accepter/')
        data = post.call_args.kwargs['data']
        for absent in ('school', 'start_date', 'end_date', 'internship_type', 'offer_id', 'linkedin_url', 'consent_date'):
            self.assertNotIn(absent, data)
        self.assertEqual(data['offer_title'], 'Candidature spontanée')   # falls back to the free-text reference
        self.assertIsNone(post.call_args.kwargs['files'])                # no CV: nothing attached

    @patch('candidature.crm.requests.post')
    def test_crm_failure_keeps_the_preselection_and_records_the_error(self, post):
        post.return_value = crm_response(401)
        r = self.accept()
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data['crm_ok'])
        self.assertIn('clé API', r.data['message'])
        self.c.refresh_from_db()
        self.assertEqual(self.c.statut, 'preselectionnee')
        self.assertIsNone(self.c.crm_envoye_le)
        self.assertIn('clé API', self.c.crm_erreur)

    @patch('candidature.crm.requests.post', side_effect=requests.ConnectionError('boom'))
    def test_unreachable_crm_does_not_crash(self, post):
        r = self.accept()
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data['crm_ok'])
        self.assertIn('injoignable', r.data['message'])

    @patch('candidature.crm.requests.post')
    def test_crm_validation_message_is_shown(self, post):
        post.return_value = crm_response(422, {'detail': 'Email invalide'})
        r = self.accept()
        self.assertIn('Email invalide', r.data['message'])

    @patch('candidature.crm.requests.post')
    def test_retry_after_failure_clears_the_error(self, post):
        post.return_value = crm_response(503)
        self.accept()
        post.return_value = crm_response(200)   # the CRM updated the existing candidate
        r = self.accept()
        self.assertTrue(r.data['crm_ok'])
        self.c.refresh_from_db()
        self.assertEqual((self.c.crm_tentatives, self.c.crm_erreur), (2, ''))
        self.assertIsNotNone(self.c.crm_envoye_le)

    @override_settings(CRM_API_URL='', CRM_API_KEY='')
    @patch('candidature.crm.requests.post')
    def test_missing_configuration_is_explained_and_nothing_is_sent(self, post):
        r = self.accept()
        self.assertFalse(r.data['crm_ok'])
        self.assertIn('non configurée', r.data['message'])
        post.assert_not_called()

    @patch('candidature.crm.requests.post')
    def test_missing_cv_file_is_reported(self, post):
        self.c.cv.storage.delete(self.c.cv.name)
        r = self.accept()
        self.assertFalse(r.data['crm_ok'])
        self.assertIn('introuvable', r.data['message'])
        post.assert_not_called()

    def test_public_form_cannot_pre_select_itself(self):
        r = self.client.post('/api/candidature/', {
            'nom': 'Hacker', 'email': 'h@x.tn', 'telephone': '20 000 000', 'consentement': True,
            'statut': 'preselectionnee', 'crm_envoye_le': '2026-01-01T00:00:00Z',
        }, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        created = Candidature.objects.get(email='h@x.tn')
        self.assertEqual(created.statut, 'nouvelle')
        self.assertIsNone(created.crm_envoye_le)
