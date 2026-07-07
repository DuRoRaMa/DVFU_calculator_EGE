from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status


class AccountsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='user',
            password='password123',
        )

        self.admin = User.objects.create_user(
            username='admin',
            password='password123',
            is_staff=True,
        )

    def test_login_returns_tokens_and_user(self):
        response = self.client.post(
            reverse('token-obtain-pair'),
            {
                'username': 'user',
                'password': 'password123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'user')

    def test_me_requires_auth(self):
        response = self.client.get(reverse('current-user'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('current-user'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'user')
        self.assertEqual(response.data['role'], 'user')

    def test_admin_users_forbidden_for_regular_user(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('admin-user-list'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_users_allowed_for_admin(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(reverse('admin-user-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)