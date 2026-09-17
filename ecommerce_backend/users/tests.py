from django.test import TestCase
from rest_framework.test import APIClient

from .models import User


class OnboardingFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='alice',
            email='alice@example.com',
            password='StrongPass123!',
            first_name='Alice',
            last_name='Doe',
            user_type='acheteur',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_onboarding_requires_cgu_acceptance(self):
        response = self.client.post(
            '/api/users/onboarding/',
            {
                'first_name': 'Alice',
                'last_name': 'Doe',
                'user_type': 'vendeur',
                'cgu_accepted': False,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('cgu_accepted', response.data)

    def test_onboarding_sets_profile_and_marks_completion(self):
        response = self.client.post(
            '/api/users/onboarding/',
            {
                'first_name': 'Alice',
                'last_name': 'Martin',
                'user_type': 'vendeur',
                'cgu_accepted': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Alice')
        self.assertEqual(self.user.last_name, 'Martin')
        self.assertEqual(self.user.user_type, 'vendeur')
        self.assertTrue(self.user.cgu_accepted)
        self.assertTrue(self.user.onboarding_completed)
        self.assertTrue(response.data['user']['onboarding_completed'])
