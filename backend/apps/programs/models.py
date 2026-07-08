import datetime

from django.core.validators import RegexValidator
from django.db import models


def year_choices():
    current = datetime.date.today().year
    years = range(current - 1, current + 6)

    return [(year, str(year)) for year in years]


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
    message='Шифр УГСН должен быть в формате xx.xx.xx, например 09.03.04.',
)


class Subject(models.Model):
    name = models.CharField(
        'Название предмета',
        max_length=255,
        unique=True,
    )

    code = models.CharField(
        'Код предмета',
        max_length=50,
        unique=True,
    )

    class Meta:
        verbose_name = 'Предмет'
        verbose_name_plural = 'Предметы'
        ordering = ['name']

    def __str__(self):
        return self.name


class EducationProgram(models.Model):
    class StudyForm(models.TextChoices):
        FULL_TIME = 'очная', 'Очная'
        PART_TIME = 'очно-заочная', 'Очно-заочная'
        EXTRAMURAL = 'заочная', 'Заочная'

    class EducationLevel(models.TextChoices):
        BACHELOR_SPECIALIST = 'bachelor_specialist', 'Бакалавриат/Специалитет'
        BACHELOR = 'bachelor', 'Бакалавриат'
        SPECIALIST = 'specialist', 'Специалитет'
        BVO = 'bvo', 'БВО'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Активно'
        ARCHIVED = 'archived', 'Архив'
        HIDDEN = 'hidden', 'Скрыто'

    school = models.CharField(
        'Институт',
        max_length=10,
        choices=SCHOOL_CHOICES,
    )

    name = models.CharField(
        'Название направления подготовки',
        max_length=255,
    )

    code = models.CharField(
        'Шифр направления',
        max_length=16,
        unique=True,
        validators=[ugsn_code_validator],
        db_index=True,
        help_text='Формат: xx.xx.xx, например 09.03.04.',
    )

    education_level = models.CharField(
        'Уровень образования',
        max_length=50,
        choices=EducationLevel.choices,
        default=EducationLevel.BACHELOR_SPECIALIST,
    )

    study_form = models.CharField(
        'Форма обучения',
        max_length=30,
        choices=StudyForm.choices,
        default=StudyForm.FULL_TIME,
    )

    admission_plan = models.PositiveIntegerField(
        'План приема',
        default=0,
    )

    target_avg_score = models.FloatField(
        'Целевой средний балл',
        default=0.0,
    )

    status = models.CharField(
        'Статус',
        max_length=30,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )

    subjects = models.ManyToManyField(
        Subject,
        through='ProgramSubjectRequirement',
        verbose_name='Требования по предметам',
    )

    created_at = models.DateTimeField(
        'Дата создания',
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        'Дата обновления',
        auto_now=True,
    )

    class Meta:
        verbose_name = 'Образовательная программа'
        verbose_name_plural = 'Образовательные программы'
        ordering = ['code', 'name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status']),
            models.Index(fields=['school']),
            models.Index(fields=['education_level']),
            models.Index(fields=['study_form']),
        ]

    def __str__(self):
        return f'{self.code} — {self.name}'


class ProgramSubjectRequirement(models.Model):
    program = models.ForeignKey(
        EducationProgram,
        on_delete=models.CASCADE,
        related_name='subject_requirements',
        verbose_name='Направление',
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='program_requirements',
        verbose_name='Предмет',
    )

    min_score = models.PositiveIntegerField(
        'Минимальный балл',
    )

    year = models.PositiveIntegerField(
        'Год действия',
        choices=year_choices(),
    )

    is_optional = models.BooleanField(
        'Предмет по выбору',
        default=False,
        help_text='Если включено, предмет учитывается как предмет по выбору.',
    )

    class Meta:
        verbose_name = 'Требование по предмету'
        verbose_name_plural = 'Требования по предметам'
        ordering = ['program__code', 'subject__name']
        constraints = [
            models.UniqueConstraint(
                fields=['program', 'subject', 'year'],
                name='unique_program_subject_requirement_by_year',
            )
        ]

    def __str__(self):
        optional_label = 'по выбору' if self.is_optional else 'обязательный'

        return (
            f'{self.program.code} — {self.subject.name} '
            f'({self.year}, {optional_label})'
        )