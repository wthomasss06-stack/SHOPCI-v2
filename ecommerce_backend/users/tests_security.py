import io
import tempfile
from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from .models import User


def _make_jpeg(name='test.jpg'):
    buf = io.BytesIO()
    Image.new('RGB', (8, 8), color='red').save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/jpeg')


@override_settings(LEGACY_PASSWORD_AUTH_ENABLED=True)
class SecurityHardeningTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor = User.objects.create_user(
            username='vendor1',
            email='vendor1@example.com',
            password='StrongPass123!',
            user_type='vendeur',
        )
        self.buyer = User.objects.create_user(
            username='buyer1',
            email='buyer1@example.com',
            password='StrongPass123!',
            user_type='acheteur',
        )

    def test_buyer_cannot_create_product(self):
        self.client.force_authenticate(user=self.buyer)
        response = self.client.post(
            '/api/products/',
            {'name': 'Test', 'description': 'x', 'price': '1000', 'stock': 1},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_vendor_can_create_product(self):
        self.client.force_authenticate(user=self.vendor)
        response = self.client.post(
            '/api/products/',
            {'name': 'Test', 'description': 'x', 'price': '1000', 'stock': 1},
            format='json',
        )
        self.assertEqual(response.status_code, 201)

    def test_legacy_auth_disabled_blocks_login(self):
        with override_settings(LEGACY_PASSWORD_AUTH_ENABLED=False):
            response = self.client.post(
                '/api/users/login/',
                {'username': 'buyer1', 'password': 'StrongPass123!'},
                format='json',
            )
            self.assertEqual(response.status_code, 403)
            self.assertEqual(response.data['code'], 'legacy_auth_disabled')

    def test_profile_rejects_invalid_upload_type(self):
        self.client.force_authenticate(user=self.buyer)
        bad = SimpleUploadedFile('x.txt', b'not-an-image', content_type='text/plain')
        response = self.client.patch(
            '/api/users/profile/',
            {'profile_photo': bad},
            format='multipart',
        )
        self.assertEqual(response.status_code, 400)


@override_settings(LEGACY_PASSWORD_AUTH_ENABLED=True)
class AccountRestrictionsWithLegacyAuthTests(TestCase):
    """Réutilise le flux login pour les tests de délai compte."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.log_override = override_settings(
            ACCOUNT_STATUS_LOG_DIR=Path(self.tmp.name),
            ACCOUNT_COOLDOWN_DAYS=1,
        )
        self.log_override.enable()
        self.user = User.objects.create_user(
            username='bob',
            email='bob@example.com',
            password='StrongPass123!',
        )
        self.client = APIClient()

    def tearDown(self):
        self.log_override.disable()
        self.tmp.cleanup()

    def test_login_blocked_for_recently_deleted_account(self):
        self.user.soft_delete()
        response = self.client.post(
            '/api/users/login/',
            {'username': 'bob', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['code'], 'account_cooldown')
