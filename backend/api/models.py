from django.db import models
from django.core.validators import RegexValidator
import datetime


def year_choices():
    current = datetime.date.today().year
    # например: текущий год и +5 лет вперед, и -1 год назад
    years = range(current - 1, current + 6)
    return [(y, str(y)) for y in years]

SCHOOL_CHOICES = [
    ('1', 'ИМКТ'),
    ('2', 'ШЭМ'),
    ('3', 'ШМиНЖ'),
    ('4', 'ИТПМ'),
    ('5', 'ИФКС'),
    ('6', 'ЮШ'),
    ('7', 'ШИГН'),
    ('8', 'ПИШ'),
    ('9', 'ШП'),
    ('10', 'ВИ'),
    ('11', 'ИМО'),
    ('12', 'ПИ'),

]


ugsn_code_validator = RegexValidator(
    regex=r'^\d{2}\.\d{2}\.\d{2}$',
    message='Шифр УГСН должен быть в формате xx.xx.xx (например, 09.03.04).'
)
# Create your models here.
"""Таблица Subjects
Хранит список всех возможных предметов.

id - Уникальный номер предмета
name - Название предмета (например, “Информатика и ИКТ”)
code - Короткий код (например, “INF”)
"""
class Subjects (models.Model):
    name = models.CharField('Название предмета', max_length=255, unique=True)
    code = models.CharField('Код предмета', max_length=50, unique=True)

    class Meta:
        verbose_name = 'Предмет ЕГЭ'
        verbose_name_plural = 'Предметы ЕГЭ'

    def __str__(self):
        return self.name
    
"""Таблица EducationPrograms (Направления подготовки)
Хранит список всех направлений, куда идет прием.

id - Уникальный номер направления
name - Название (например, “Программная инженерия”)
code - Шифр (например, “09.03.04”)
study_form - Форма обучения (например, “Очная”)
admission_plan - План набора (сколько мест)
target_avg_score - Целевой средний балл
status - Статус (например, “активно” или “архив”)
"""


class EducationPrograms(models.Model):
    class StudyForm(models.TextChoices):
        FULL_TIME = "очная", "Очное"
        PART_TIME = "очно-заочная", "Очно-заочное"
        EXTRAMURAL = "заочная", "Заочное"
    school = models.CharField('Институт', choices=SCHOOL_CHOICES)

    name = models.CharField('Название направления подготовки', max_length=255)
    code = models.CharField('Шифр УГСН', max_length=8, unique=True, validators=[ugsn_code_validator], help_text="Формат: xx.xx.xx (например, 09.03.04)")
    study_form = models.CharField('Форма обучения', max_length=30, choices=StudyForm.choices)
    admission_plan = models.PositiveIntegerField('План приема', default=0)
    target_avg_score = models.FloatField('Целевой средний балл', default=0.0)
    status = models.CharField('Статус', max_length=50, default='Активно')
    subjects = models.ManyToManyField(Subjects,
                                      through='ProgramSubjectRequirements',
                                      verbose_name='Требования по предметам')

    class Meta:
        verbose_name = 'Направления подготовки'
        verbose_name_plural = 'Направления подготовки'

    def __str__(self):
        return f'{self.code} {self.name}'

"""ProgramSubjectRequirements 
Самая главная таблица. Связывает направления с предметами и устанавливает правила.

id - Уникальный номер самого правила
program_id - Ссылка на направление (к какому направлению относится правило)
subject_id - Ссылка на предмет (о каком предмете идет речь)
min_score - Минимальный балл по этому предмету
year - Год, когда это правило действует (например, 2025)"""

class ProgramSubjectRequirements(models.Model):
    program_id = models.ForeignKey(EducationPrograms, on_delete=models.CASCADE, verbose_name='Направление') 
    subject_id = models.ForeignKey(Subjects, on_delete=models.CASCADE, verbose_name='Предмет')
    min_score = models.PositiveIntegerField('Минимальный балл')
    year = models.PositiveIntegerField('Год действия', choices=year_choices())
    is_optional = models.BooleanField(
        "Предмет по выбору",
        default=False,
        help_text="Если включено — предмет не обязательный, учитывается как 'по выбору'."
    )
    class Meta:
        verbose_name = 'Требования по предмету'
        verbose_name_plural = "Требования по предметам"
        unique_together = ('program_id', 'subject_id', 'year')
    
    def __str__(self):
        return f"{self.program_id.code} -> {self.subject_id.name} ({self.year})"
