from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class RecommendationsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='user',
            password='password123',
        )

    def test_recommendations_requires_auth(self):
        response = self.client.post(
            reverse('recommendations'),
            {
                'direction_code': '09.03.04',
                'application_ids': [1, 2, 3],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_recommendations_stub_returns_disabled_response(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('recommendations'),
            {
                'direction_code': '09.03.04',
                'application_ids': [1, 2, 3],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['enabled'], False)
        self.assertEqual(response.data['recommendations'], [])
        self.assertIn('Режим рекомендаций временно отключён', response.data['message'])