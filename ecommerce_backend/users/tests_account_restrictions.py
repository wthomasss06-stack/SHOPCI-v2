import json
import tempfile
from datetime import timedelta
from pathlib import Path

from django.test import TestCase, override_settings

LEGACY_ON = override_settings(LEGACY_PASSWORD_AUTH_ENABLED=True)
from django.utils import timezone
from rest_framework.test import APIClient

from .account_restrictions import (
    _log_path,
    is_cooldown_over,
    log_account_action,
    resolve_restricted_account,
)
from .models import User


@LEGACY_ON
class AccountRestrictionsTests(TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.settings_override = override_settings(
            ACCOUNT_STATUS_LOG_DIR=Path(self.tmp.name),
            ACCOUNT_COOLDOWN_DAYS=1,
        )
        self.settings_override.enable()
        self.user = User.objects.create_user(
            username='bob',
            email='bob@example.com',
            password='StrongPass123!',
        )
        self.client = APIClient()

    def tearDown(self):
        self.settings_override.disable()
        self.tmp.cleanup()

    def test_suspend_and_delete_are_logged_in_json(self):
        log_account_action(self.user, 'suspended')
        self.user.suspend_account()
        log_account_action(self.user, 'deleted')
        self.user.soft_delete()

        entries = json.loads(_log_path().read_text(encoding='utf-8'))
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]['action'], 'suspended')
        self.assertEqual(entries[1]['action'], 'deleted')
        self.assertIn('eligible_at', entries[1])

    def test_deleted_account_blocked_before_cooldown(self):
        self.user.soft_delete()
        log_account_action(self.user, 'deleted')

        ok, error = resolve_restricted_account(self.user)
        self.assertFalse(ok)
        self.assertEqual(error['code'], 'account_cooldown')

    def test_deleted_account_reactivated_after_cooldown(self):
        self.user.soft_delete()
        self.user.deleted_at = timezone.now() - timedelta(days=2)
        self.user.save(update_fields=['deleted_at'])

        ok, error = resolve_restricted_account(self.user)
        self.assertTrue(ok)
        self.assertIsNone(error)

        self.user.refresh_from_db()
        self.assertEqual(self.user.account_status, 'active')
        self.assertFalse(self.user.onboarding_completed)

    def test_login_blocked_for_recently_deleted_account(self):
        self.user.soft_delete()
        log_account_action(self.user, 'deleted')

        response = self.client.post(
            '/api/users/login/',
            {'username': 'bob', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['code'], 'account_cooldown')

    def test_login_works_after_cooldown_for_deleted_account(self):
        self.user.soft_delete()
        self.user.deleted_at = timezone.now() - timedelta(days=2)
        self.user.save(update_fields=['deleted_at'])

        response = self.client.post(
            '/api/users/login/',
            {'username': 'bob', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.account_status, 'active')

    def test_is_cooldown_over_without_restriction_date(self):
        self.assertTrue(is_cooldown_over(self.user))
