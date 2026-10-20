import shutil
import tempfile
from datetime import date, timedelta
from io import StringIO
from unittest.mock import MagicMock, patch

import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.signals import request_finished
from django.db import close_old_connections, connections
from django.test import TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from offres.models import Offre
from . import scheduler
from .models import Candidature
from .retention import RETENTION_DAYS, delete_orphan_cv_files, orphan_cv_files, purge_candidatures

MEDIA = tempfile.mkdtemp()


def close_response_file(response):
    """Release the file a FileResponse holds. response.close() would also send request_finished,
    which closes the test's database connection: so silence that handler while closing."""
    request_finished.disconnect(close_old_connections)
    try:
        response.close()
    finally:
        request_finished.connect(close_old_connections)


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

    def test_crm_still_receives_the_original_cv_name(self):
        # the stored file has a random name, the CRM gets the one the candidate uploaded
        self.assertNotIn('cv.pdf', self.c.cv.name)
        with patch('candidature.crm.requests.post', return_value=crm_response(201)) as post:
            self.accept()
        self.assertEqual(post.call_args.kwargs['files']['cv'][0], 'MonCV.pdf')

    def test_public_form_cannot_pre_select_itself(self):
        r = self.client.post('/api/candidature/', {
            'nom': 'Hacker', 'email': 'h@x.tn', 'telephone': '20 000 000', 'consentement': True,
            'statut': 'preselectionnee', 'crm_envoye_le': '2026-01-01T00:00:00Z',
        }, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        created = Candidature.objects.get(email='h@x.tn')
        self.assertEqual(created.statut, 'nouvelle')
        self.assertIsNone(created.crm_envoye_le)


@override_settings(MEDIA_ROOT=MEDIA, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
                   DEFAULT_FROM_EMAIL='contact@test.tn')
class CvProtectionTests(APITestCase):
    """CVs are personal data: never exposed by URL, only downloadable by logged-in staff."""

    def setUp(self):
        self.admin = get_user_model().objects.create_user('admin-cv', password='x')
        self.c = Candidature.objects.create(
            nom='Amira', email='amira@example.com', telephone='+216 20 000 000',
            cv=SimpleUploadedFile('CV Amira Trabelsi.pdf', b'%PDF-1.4 amira', content_type='application/pdf'),
            cv_nom_original='CV Amira Trabelsi.pdf',
        )
        self.cv_url = f'/api/candidature/{self.c.id}/cv/'

    def test_stored_file_name_is_random(self):
        self.assertRegex(self.c.cv.name, r'^cvs/[0-9a-f]{32}\.pdf$')

    def test_api_never_returns_the_file_url(self):
        self.client.force_authenticate(self.admin)
        row = self.client.get(f'/api/candidature/{self.c.id}/').data
        self.assertNotIn('cv', row)
        self.assertTrue(row['has_cv'])
        self.assertEqual(row['cv_nom_original'], 'CV Amira Trabelsi.pdf')

    def test_anonymous_cannot_download(self):
        self.assertIn(self.client.get(self.cv_url).status_code, (401, 403))

    def test_staff_downloads_with_the_original_name(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get(self.cv_url)
        self.addCleanup(close_response_file, r)   # Windows cannot delete a file that is still open
        self.assertEqual(r.status_code, 200)
        self.assertEqual(b''.join(r.streaming_content), b'%PDF-1.4 amira')
        self.assertIn('attachment', r['Content-Disposition'])
        self.assertIn('CV Amira Trabelsi.pdf', r['Content-Disposition'])

    def test_media_folder_is_not_served(self):
        self.assertEqual(self.client.get(f'/media/{self.c.cv.name}').status_code, 404)

    def test_no_cv_and_missing_file_give_404(self):
        self.client.force_authenticate(self.admin)
        sans_cv = Candidature.objects.create(nom='X', email='x@x.tn', telephone='20000000')
        self.assertEqual(self.client.get(f'/api/candidature/{sans_cv.id}/cv/').status_code, 404)
        self.c.cv.storage.delete(self.c.cv.name)
        self.assertEqual(self.client.get(self.cv_url).status_code, 404)

    def test_public_upload_gets_a_random_name_and_keeps_the_original(self):
        r = self.client.post('/api/candidature/', {
            'nom': 'Sami', 'email': 'sami@x.tn', 'telephone': '20 000 000', 'consentement': True,
            'cv': SimpleUploadedFile('Mon CV.pdf', b'%PDF-1.4 sami', content_type='application/pdf'),
        }, format='multipart')
        self.assertEqual(r.status_code, 201, r.data)
        self.assertNotIn('cv', r.data)
        created = Candidature.objects.get(email='sami@x.tn')
        self.assertRegex(created.cv.name, r'^cvs/[0-9a-f]{32}\.pdf$')
        self.assertEqual(created.cv_nom_original, 'Mon CV.pdf')
        # the team's notification email still attaches it under its real name
        from django.core import mail
        self.assertEqual(mail.outbox[-1].attachments[0][0], 'Mon CV.pdf')


@override_settings(MEDIA_ROOT=MEDIA, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
                   DEFAULT_FROM_EMAIL='contact@test.tn', CANDIDATURES_PAR_OFFRE_MAX=2)
class LimiteParOffreTests(APITestCase):
    """One IP cannot flood an offer by changing the email; only successful applications count."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        self.addCleanup(cache.clear)
        self.offre = Offre.objects.create(titre='Dev web', type_offre='emploi', description='d')
        self.autre = Offre.objects.create(titre='Dev mobile', type_offre='emploi', description='d')

    def postuler(self, email, offre=None, **extra):
        data = {'nom': 'Test', 'email': email, 'telephone': '20 000 000', 'consentement': True,
                'offre': (offre or self.offre).id, **extra}
        return self.client.post('/api/candidature/', data, format='multipart')

    def test_third_application_to_the_same_offer_is_refused(self):
        self.assertEqual(self.postuler('a@x.tn').status_code, 201)
        self.assertEqual(self.postuler('b@x.tn').status_code, 201)
        r = self.postuler('c@x.tn')
        self.assertEqual(r.status_code, 429)
        self.assertIn('cette offre', r.data['detail'])
        self.assertIn('Retry-After', r)
        self.assertEqual(Candidature.objects.filter(offre=self.offre).count(), 2)

    def test_other_offers_are_not_affected(self):
        self.postuler('a@x.tn')
        self.postuler('b@x.tn')
        self.assertEqual(self.postuler('c@x.tn', offre=self.autre).status_code, 201)

    def test_failed_submissions_do_not_count(self):
        for _ in range(3):
            self.assertEqual(self.postuler('a@x.tn', consentement=False).status_code, 400)
        self.assertEqual(self.postuler('a@x.tn').status_code, 201)

    def test_mail_failure_does_not_fail_the_application(self):
        with patch('django.core.mail.EmailMessage.send', side_effect=OSError('smtp down')):
            r = self.postuler('a@x.tn')
        self.assertEqual(r.status_code, 201)
        self.assertTrue(Candidature.objects.filter(email='a@x.tn').exists())


RETENTION_MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=RETENTION_MEDIA)
class RetentionTests(APITestCase):
    """Privacy policy: applications and their CV are deleted after 6 months, and a CV never outlives its application."""

    def setUp(self):
        # every test starts with an empty CV folder, so "orphan" really means orphan
        shutil.rmtree(RETENTION_MEDIA, ignore_errors=True)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(RETENTION_MEDIA, ignore_errors=True)

    def make(self, nom, days_ago=0, with_cv=True):
        c = Candidature.objects.create(
            nom=nom, email=f'{nom.lower()}@x.tn', telephone='20000000',
            cv=SimpleUploadedFile('cv.pdf', b'%PDF-1.4', content_type='application/pdf') if with_cv else None,
        )
        if days_ago:
            Candidature.objects.filter(pk=c.pk).update(created_at=timezone.now() - timedelta(days=days_ago))
        return c

    def file_exists(self, c):
        return c.cv.storage.exists(c.cv.name)

    def test_purge_deletes_old_applications_and_their_cv_only(self):
        old = self.make('Old', days_ago=RETENTION_DAYS + 1)
        recent = self.make('Recent', days_ago=RETENTION_DAYS - 1)
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(purge_candidatures(), 1)
        self.assertEqual(list(Candidature.objects.values_list('nom', flat=True)), ['Recent'])
        self.assertFalse(self.file_exists(old))
        self.assertTrue(self.file_exists(recent))

    def test_dry_run_deletes_nothing(self):
        old = self.make('Old', days_ago=RETENTION_DAYS + 30)
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(purge_candidatures(dry_run=True), 1)
        self.assertTrue(Candidature.objects.filter(pk=old.pk).exists())
        self.assertTrue(self.file_exists(old))

    def test_deleting_from_the_admin_removes_the_cv_file(self):
        c = self.make('Amira')
        self.client.force_authenticate(get_user_model().objects.create_user('admin-ret', password='x'))
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(self.client.delete(f'/api/candidature/{c.id}/').status_code, 204)
        self.assertFalse(self.file_exists(c))

    def test_replacing_a_cv_removes_the_old_file(self):
        c = self.make('Sami')
        old_name = c.cv.name
        with self.captureOnCommitCallbacks(execute=True):
            c.cv = SimpleUploadedFile('new.pdf', b'%PDF-1.4 new', content_type='application/pdf')
            c.save()
        self.assertFalse(c.cv.storage.exists(old_name))
        self.assertTrue(self.file_exists(c))

    def test_orphan_files_are_found_and_removed(self):
        kept = self.make('Kept')
        orphan = default_storage.save('cvs/orphan-from-an-old-delete.pdf', ContentFile(b'x'))
        self.assertEqual(orphan_cv_files(), [orphan])
        self.assertEqual(delete_orphan_cv_files(), 1)
        self.assertFalse(default_storage.exists(orphan))
        self.assertTrue(self.file_exists(kept))

    def test_one_undeletable_file_does_not_stop_the_cleanup(self):
        a = default_storage.save('cvs/a.pdf', ContentFile(b'x'))
        b = default_storage.save('cvs/b.pdf', ContentFile(b'x'))
        real_delete = default_storage.delete

        def flaky_delete(name):
            if name == a:
                raise PermissionError('locked')
            real_delete(name)

        with patch.object(default_storage, 'delete', side_effect=flaky_delete):
            self.assertEqual(delete_orphan_cv_files(), 1)
        self.assertFalse(default_storage.exists(b))

    def test_command(self):
        self.make('Old', days_ago=RETENTION_DAYS + 1, with_cv=False)
        out = StringIO()
        call_command('purge_candidatures', '--dry-run', '--orphans', stdout=out)
        self.assertIn('seraient supprimés : 1', out.getvalue())
        self.assertEqual(Candidature.objects.count(), 1)
        call_command('purge_candidatures', stdout=StringIO())
        self.assertEqual(Candidature.objects.count(), 0)


@override_settings(MEDIA_ROOT=RETENTION_MEDIA)
class SchedulerTests(TransactionTestCase):
    """The daily job really purges, and the PostgreSQL lock lets only one worker run it at a time."""

    def setUp(self):
        shutil.rmtree(RETENTION_MEDIA, ignore_errors=True)

    def test_run_once_purges(self):
        c = Candidature.objects.create(nom='Old', email='old@x.tn', telephone='20000000')
        Candidature.objects.filter(pk=c.pk).update(created_at=timezone.now() - timedelta(days=RETENTION_DAYS + 1))
        scheduler.run_once()
        self.assertFalse(Candidature.objects.exists())

    def test_skips_when_another_worker_holds_the_lock(self):
        c = Candidature.objects.create(nom='Old', email='old@x.tn', telephone='20000000')
        Candidature.objects.filter(pk=c.pk).update(created_at=timezone.now() - timedelta(days=RETENTION_DAYS + 1))
        other = connections.create_connection('default')   # plays the role of another worker
        try:
            with other.cursor() as cur:
                cur.execute('SELECT pg_advisory_lock(%s)', [scheduler.LOCK_ID])
            scheduler.run_once()
            self.assertTrue(Candidature.objects.exists())     # skipped: nothing deleted
        finally:
            other.close()                                     # releases the lock
        scheduler.run_once()
        self.assertFalse(Candidature.objects.exists())

    def test_disabled_unless_enabled_by_the_variable(self):
        with patch.dict('os.environ', {'PURGE_SCHEDULER': 'false'}), patch.object(scheduler, '_started', False), \
                patch('candidature.scheduler.threading.Thread') as thread:
            scheduler.start()
            thread.assert_not_called()
        with patch.dict('os.environ', {'PURGE_SCHEDULER': 'true'}), patch.object(scheduler, '_started', False), \
                patch('candidature.scheduler.threading.Thread') as thread:
            scheduler.start()
            thread.assert_called_once()
