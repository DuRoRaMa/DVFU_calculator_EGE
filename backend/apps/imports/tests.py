from django.test import TestCase

from apps.core.constants import (
    GENERAL_COMPETITION_CATEGORY,
    NO_EXAMS_AVERAGE_SCORE,
)
from apps.imports.services.filters import is_allowed_applicant_item
from apps.imports.services.score_calculator import calculate_average_score


class ImportFiltersTests(TestCase):
    def get_valid_item(self):
        return {
            'Actual': True,
            'StatusVUZ': 'Принято',
            'Category': GENERAL_COMPETITION_CATEGORY,
            'LevelEducation': 'Бакалавриат/Специалитет',
            'SpecCode': '09.03.04',
            'ID_Student': '1001',
        }

    def test_valid_item_allowed(self):
        item = self.get_valid_item()

        self.assertTrue(is_allowed_applicant_item(item))

    def test_not_actual_item_denied(self):
        item = self.get_valid_item()
        item['Actual'] = False

        self.assertFalse(is_allowed_applicant_item(item))

    def test_not_general_competition_denied(self):
        item = self.get_valid_item()
        item['Category'] = 'Целевая квота'

        self.assertFalse(is_allowed_applicant_item(item))

    def test_excluded_status_denied(self):
        item = self.get_valid_item()
        item['StatusVUZ'] = 'Отклонено'

        self.assertFalse(is_allowed_applicant_item(item))

    def test_wrong_level_denied(self):
        item = self.get_valid_item()
        item['LevelEducation'] = 'Магистратура'

        self.assertFalse(is_allowed_applicant_item(item))


class ScoreCalculatorTests(TestCase):
    def test_no_exams_returns_100(self):
        item = {
            'NoExams': True,
            'TrainingDirection': 'Программная инженерия',
        }

        self.assertEqual(
            calculate_average_score(item),
            NO_EXAMS_AVERAGE_SCORE,
        )

    def test_regular_direction_counts_only_ege(self):
        item = {
            'NoExams': False,
            'TrainingDirection': 'Программная инженерия',
            'Test1Score': 80,
            'Test1Form': 'ЕГЭ',
            'Test2Score': 90,
            'Test2Form': 'ЕГЭ',
            'Test3Score': 100,
            'Test3Form': 'ДВИ',
        }

        self.assertEqual(calculate_average_score(item), 85.0)

    def test_special_direction_counts_ege_and_dvi(self):
        item = {
            'NoExams': False,
            'TrainingDirection': 'Дизайн',
            'Test1Score': 80,
            'Test1Form': 'ЕГЭ',
            'Test2Score': 90,
            'Test2Form': 'ЕГЭ',
            'Test3Score': 100,
            'Test3Form': 'ДВИ',
        }

        self.assertEqual(calculate_average_score(item), 90.0)

    def test_special_direction_counts_vi_alias(self):
        item = {
            'NoExams': False,
            'TrainingDirection': 'Архитектура',
            'Test1Score': 80,
            'Test1Form': 'ЕГЭ',
            'Test2Score': 100,
            'Test2Form': 'ВИ',
        }

        self.assertEqual(calculate_average_score(item), 90.0)