from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()
FORT = 'Sel-Mer-2026-solide'


class ComptesTests(APITestCase):
    """Team login accounts: managed by administrators only, never locking the team out."""

    def setUp(self):
        self.admin = User.objects.create_superuser('patron', 'patron@3lm.tn', FORT)
        self.membre = User.objects.create_user('membre', 'membre@3lm.tn', FORT)
        self.client.force_authenticate(self.admin)

    def test_admin_creates_an_account_that_can_log_in(self):
        r = self.client.post('/api/comptes/', {
            'username': 'sarra', 'first_name': 'Sarra', 'email': 'Sarra@3LM.tn',
            'password': FORT, 'is_superuser': False,
        })
        self.assertEqual(r.status_code, 201, r.data)
        self.assertNotIn('password', r.data)
        u = User.objects.get(username='sarra')
        self.assertEqual(u.email, 'sarra@3lm.tn')
        self.assertFalse(u.is_staff)
        self.client.force_authenticate(None)
        login = self.client.post('/api/auth/token/', {'username': 'sarra', 'password': FORT})
        self.assertEqual(login.status_code, 200, login.data)

    def test_new_administrator_gets_back_office_access(self):
        self.client.post('/api/comptes/', {'username': 'chef', 'password': FORT, 'is_superuser': True})
        self.assertTrue(User.objects.get(username='chef').is_staff)

    def test_weak_password_and_duplicate_username_are_refused(self):
        r = self.client.post('/api/comptes/', {'username': 'x1', 'password': '123'})
        self.assertEqual(r.status_code, 400)
        self.assertIn('password', r.data)
        r = self.client.post('/api/comptes/', {'username': 'MEMBRE', 'password': FORT})
        self.assertEqual(r.status_code, 400)
        self.assertIn('username', r.data)

    def test_non_admin_cannot_manage_accounts_but_can_read_itself(self):
        self.client.force_authenticate(self.membre)
        self.assertEqual(self.client.get('/api/comptes/').status_code, 403)
        self.assertEqual(self.client.post('/api/comptes/', {'username': 'y', 'password': FORT}).status_code, 403)
        moi = self.client.get('/api/comptes/moi/')
        self.assertEqual(moi.status_code, 200)
        self.assertFalse(moi.data['is_superuser'])

    def test_anonymous_has_no_access(self):
        self.client.force_authenticate(None)
        self.assertIn(self.client.get('/api/comptes/').status_code, (401, 403))

    def test_admin_cannot_lock_themselves_out(self):
        url = f'/api/comptes/{self.admin.id}/'
        self.assertEqual(self.client.patch(url, {'is_active': False}).status_code, 400)
        self.assertEqual(self.client.patch(url, {'is_superuser': False}).status_code, 400)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active and self.admin.is_superuser)

    def test_deactivating_or_new_password_ends_sessions(self):
        Token.objects.create(user=self.membre)
        r = self.client.patch(f'/api/comptes/{self.membre.id}/', {'password': 'Autre-Mot-2026-solide'})
        self.assertEqual(r.status_code, 200, r.data)
        self.assertFalse(Token.objects.filter(user=self.membre).exists())
        Token.objects.create(user=self.membre)
        self.client.patch(f'/api/comptes/{self.membre.id}/', {'is_active': False})
        self.assertFalse(Token.objects.filter(user=self.membre).exists())

    def test_accounts_are_never_deleted(self):
        self.assertEqual(self.client.delete(f'/api/comptes/{self.membre.id}/').status_code, 405)
