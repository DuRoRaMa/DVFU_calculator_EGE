from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.core.utils import (
    get_text,
    is_value_in_normalized_list,
    normalize_text,
    to_bool,
    to_float,
    to_int,
    unique_preserve_order,
)


class CoreUtilsTests(APITestCase):
    def test_get_text(self):
        self.assertEqual(get_text(None), '')
        self.assertEqual(get_text('  test  '), 'test')
        self.assertEqual(get_text(123), '123')

    def test_normalize_text(self):
        self.assertEqual(
            normalize_text('  ОБЩИЙ   конкурс '),
            'общий конкурс',
        )

    def test_to_bool(self):
        self.assertTrue(to_bool(True))
        self.assertTrue(to_bool('true'))
        self.assertTrue(to_bool('1'))
        self.assertTrue(to_bool('да'))
        self.assertFalse(to_bool(False))
        self.assertFalse(to_bool('нет'))
        self.assertFalse(to_bool(None))

    def test_to_int(self):
        self.assertEqual(to_int('10'), 10)
        self.assertEqual(to_int('10.0'), 10)
        self.assertEqual(to_int(None), 0)
        self.assertEqual(to_int('bad', default=-1), -1)

    def test_to_float(self):
        self.assertEqual(to_float('10.5'), 10.5)
        self.assertEqual(to_float(None), 0.0)
        self.assertEqual(to_float('bad', default=-1.0), -1.0)

    def test_unique_preserve_order(self):
        self.assertEqual(
            unique_preserve_order([1, 2, 2, 3, 1]),
            [1, 2, 3],
        )

    def test_is_value_in_normalized_list(self):
        self.assertTrue(
            is_value_in_normalized_list(
                ' общий  конкурс ',
                ['Общий конкурс'],
            )
        )


class HealthCheckTests(APITestCase):
    def test_health_check_available_without_auth(self):
        response = self.client.get(reverse('health-check'))

        self.assertIn(
            response.status_code,
            [
                status.HTTP_200_OK,
                status.HTTP_503_SERVICE_UNAVAILABLE,
            ],
        )