import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Offre

MEDIA = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA, EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
                   DEFAULT_FROM_EMAIL='contact@test.tn')
class ClotureArchivageTests(APITestCase):
    """Closed offers stay public but refuse applications; archived offers disappear from the site."""

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        self.admin = get_user_model().objects.create_user('rh', password='x')
        self.offre = Offre.objects.create(titre='Dev web', type_offre='emploi', description='d')

    def postuler(self, email='a@x.tn'):
        return self.client.post('/api/candidature/', {
            'nom': 'Test', 'email': email, 'telephone': '20 000 000', 'consentement': True,
            'offre': self.offre.id,
        }, format='multipart')

    def test_closing_records_the_date_and_reopening_clears_it(self):
        self.client.force_authenticate(self.admin)
        r = self.client.patch(f'/api/offres/{self.offre.slug}/', {'cloturee': True}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data['cloturee'])
        self.assertIsNotNone(r.data['cloturee_le'])
        r = self.client.patch(f'/api/offres/{self.offre.slug}/', {'cloturee': False}, format='json')
        self.assertIsNone(r.data['cloturee_le'])

    def test_closed_offer_is_still_public_but_refuses_applications(self):
        self.offre.cloturee = True
        self.offre.save()
        detail = self.client.get(f'/api/offres/{self.offre.slug}/')
        self.assertEqual(detail.status_code, 200)
        self.assertTrue(detail.data['cloturee'])
        r = self.postuler()
        self.assertEqual(r.status_code, 400)
        self.assertIn('clôturée', str(r.data['offre']))

    def test_open_offer_accepts_applications(self):
        self.assertEqual(self.postuler().status_code, 201)

    def test_archived_offer_is_hidden_publicly_but_kept_for_the_team(self):
        self.offre.actif = False
        self.offre.save()
        self.assertEqual(self.client.get('/api/offres/').data, [])
        self.assertEqual(self.client.get(f'/api/offres/{self.offre.slug}/').status_code, 404)
        self.client.force_authenticate(self.admin)
        self.assertEqual(len(self.client.get('/api/offres/').data), 1)
