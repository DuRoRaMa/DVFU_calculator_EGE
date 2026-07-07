from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.programs.models import (
    EducationProgram,
    ProgramSubjectRequirement,
    Subject,
)


class ProgramsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='user',
            password='password123',
        )

        self.subject_russian = Subject.objects.create(
            name='Русский язык',
            code='russian',
        )

        self.subject_math = Subject.objects.create(
            name='Математика',
            code='math',
        )

        self.program = EducationProgram.objects.create(
            school='1',
            name='Программная инженерия',
            code='09.03.04',
            education_level=EducationProgram.EducationLevel.BACHELOR_SPECIALIST,
            study_form=EducationProgram.StudyForm.FULL_TIME,
            admission_plan=25,
            target_avg_score=77.0,
            status=EducationProgram.Status.ACTIVE,
        )

        ProgramSubjectRequirement.objects.create(
            program=self.program,
            subject=self.subject_russian,
            min_score=40,
            year=2026,
            is_optional=False,
        )

        ProgramSubjectRequirement.objects.create(
            program=self.program,
            subject=self.subject_math,
            min_score=39,
            year=2026,
            is_optional=False,
        )

    def test_program_list_requires_auth(self):
        response = self.client.get(reverse('program-list'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_program_list_allowed_for_authenticated_user(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('program-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['code'], '09.03.04')

    def test_program_detail_returns_requirements(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            reverse(
                'program-detail',
                kwargs={'pk': self.program.id},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], '09.03.04')
        self.assertEqual(len(response.data['subject_requirements']), 2)

    def test_program_by_code(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            reverse(
                'program-by-code',
                kwargs={'code': '09.03.04'},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Программная инженерия')

    def test_subject_list(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('subject-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_archived_program_not_in_program_list(self):
        EducationProgram.objects.create(
            school='1',
            name='Архивная программа',
            code='10.03.01',
            education_level=EducationProgram.EducationLevel.BACHELOR_SPECIALIST,
            study_form=EducationProgram.StudyForm.FULL_TIME,
            admission_plan=10,
            target_avg_score=70.0,
            status=EducationProgram.Status.ARCHIVED,
        )

        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('program-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)