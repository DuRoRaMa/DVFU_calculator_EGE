from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.admissions.models import ApplicantApplication
from apps.core.constants import GENERAL_COMPETITION_CATEGORY
from apps.programs.models import EducationProgram


class CalculationsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='user',
            password='password123',
        )

        self.program = EducationProgram.objects.create(
            school='1',
            name='Программная инженерия',
            code='09.03.04',
            study_form='очная',
            admission_plan=3,
            target_avg_score=80.0,
            status='Активно',
        )

        self.application_1 = ApplicantApplication.objects.create(
            student_id='1001',
            student_name='Иванов Иван',
            direction_code='09.03.04',
            direction_name='Программная инженерия',
            avg_score=90.0,
            sum_score=270,
            no_exams=False,
            approval=True,
            high_priority_no_original=False,
            top_priority=True,
            status_vuz='Принято',
            category=GENERAL_COMPETITION_CATEGORY,
            level_education='Бакалавриат/Специалитет',
            actual=True,
        )

        self.application_2 = ApplicantApplication.objects.create(
            student_id='1002',
            student_name='Петров Петр',
            direction_code='09.03.04',
            direction_name='Программная инженерия',
            avg_score=80.0,
            sum_score=240,
            no_exams=False,
            approval=False,
            high_priority_no_original=False,
            top_priority=False,
            status_vuz='Принято',
            category=GENERAL_COMPETITION_CATEGORY,
            level_education='Бакалавриат/Специалитет',
            actual=True,
        )

    def test_calculate_requires_auth(self):
        response = self.client.post(
            reverse('calculate'),
            {
                'direction_code': '09.03.04',
                'application_ids': [self.application_1.id],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_calculate_selection(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('calculate'),
            {
                'direction_code': '09.03.04',
                'application_ids': [
                    self.application_1.id,
                    self.application_2.id,
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['selected_count'], 2)
        self.assertEqual(response.data['average_score'], 85.0)
        self.assertEqual(response.data['is_target_reached'], True)
        self.assertEqual(response.data['remaining_places'], 1)

    def test_calculate_selection_removes_duplicate_ids(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('calculate'),
            {
                'direction_code': '09.03.04',
                'application_ids': [
                    self.application_1.id,
                    self.application_1.id,
                    self.application_2.id,
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['selected_count'], 2)
        self.assertEqual(response.data['average_score'], 85.0)

    def test_validate_selection_warns_when_plan_not_filled(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('validate-selection'),
            {
                'direction_code': '09.03.04',
                'application_ids': [self.application_1.id],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['is_valid'], True)
        self.assertTrue(len(response.data['warnings']) > 0)

    def test_scenario_add_application(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('calculate-scenario'),
            {
                'direction_code': '09.03.04',
                'base_application_ids': [self.application_1.id],
                'add_application_ids': [self.application_2.id],
                'remove_application_ids': [],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['selected_count'], 2)
        self.assertEqual(response.data['average_score'], 85.0)

    def test_scenario_remove_application(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('calculate-scenario'),
            {
                'direction_code': '09.03.04',
                'base_application_ids': [
                    self.application_1.id,
                    self.application_2.id,
                ],
                'add_application_ids': [],
                'remove_application_ids': [self.application_2.id],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['selected_count'], 1)
        self.assertEqual(response.data['average_score'], 90.0)