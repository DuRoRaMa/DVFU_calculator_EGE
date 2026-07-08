from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.admissions.models import ApplicantApplication
from apps.core.constants import (
    GENERAL_COMPETITION_CATEGORY,
    NO_EXAMS_AVERAGE_SCORE,
)


class AdmissionsApiTests(APITestCase):
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

        ApplicantApplication.objects.create(
            student_id='1001',
            student_name='Иванов Иван',
            direction_code='09.03.04',
            direction_name='Программная инженерия',
            avg_score=87.33,
            sum_score=262,
            no_exams=False,
            approval=True,
            high_priority_no_original=False,
            top_priority=True,
            status_vuz='Принято',
            category=GENERAL_COMPETITION_CATEGORY,
            level_education='Бакалавриат/Специалитет',
            actual=True,
        )

        ApplicantApplication.objects.create(
            student_id='1002',
            student_name='Петров Петр',
            direction_code='54.03.01',
            direction_name='Дизайн',
            avg_score=NO_EXAMS_AVERAGE_SCORE,
            sum_score=300,
            no_exams=True,
            approval=False,
            high_priority_no_original=False,
            top_priority=False,
            status_vuz='Принято',
            category=GENERAL_COMPETITION_CATEGORY,
            level_education='Бакалавриат/Специалитет',
            actual=True,
        )

    def test_direction_stats_forbidden_for_regular_user(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('direction-stats'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_direction_stats_allowed_for_admin(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(reverse('direction-stats'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_direction_applicants_allowed_for_admin(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            reverse(
                'direction-applicants',
                kwargs={'direction_code': '09.03.04'},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student_id'], '1001')

    def test_university_stats_allowed_for_admin(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(reverse('university-stats'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_applications'], 2)
        self.assertEqual(response.data['unique_applicants'], 2)

    def test_no_exams_application_has_100_average_score(self):
        application = ApplicantApplication.objects.get(student_id='1002')

        self.assertEqual(application.avg_score, NO_EXAMS_AVERAGE_SCORE)
