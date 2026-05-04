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
    message='Шифр УГСН должен быть в формате xx.xx.xx (например, 09.03.04).',
)


class Subjects(models.Model):
    name = models.CharField('Название предмета', max_length=255, unique=True)
    code = models.CharField('Код предмета', max_length=50, unique=True)

    class Meta:
        verbose_name = 'Предмет ЕГЭ'
        verbose_name_plural = 'Предметы ЕГЭ'

    def __str__(self):
        return self.name


class EducationPrograms(models.Model):
    class StudyForm(models.TextChoices):
        FULL_TIME = 'очная', 'Очное'
        PART_TIME = 'очно-заочная', 'Очно-заочное'
        EXTRAMURAL = 'заочная', 'Заочное'

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
        'Шифр УГСН',
        max_length=8,
        unique=True,
        validators=[ugsn_code_validator],
        help_text='Формат: xx.xx.xx (например, 09.03.04)',
    )
    study_form = models.CharField(
        'Форма обучения',
        max_length=30,
        choices=StudyForm.choices,
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
        max_length=50,
        default='Активно',
    )
    subjects = models.ManyToManyField(
        Subjects,
        through='ProgramSubjectRequirements',
        verbose_name='Требования по предметам',
    )

    class Meta:
        verbose_name = 'Направления подготовки'
        verbose_name_plural = 'Направления подготовки'

    def __str__(self):
        return f'{self.code} {self.name}'


class ProgramSubjectRequirements(models.Model):
    program_id = models.ForeignKey(
        EducationPrograms,
        on_delete=models.CASCADE,
        verbose_name='Направление',
    )
    subject_id = models.ForeignKey(
        Subjects,
        on_delete=models.CASCADE,
        verbose_name='Предмет',
    )
    min_score = models.PositiveIntegerField('Минимальный балл')
    year = models.PositiveIntegerField(
        'Год действия',
        choices=year_choices(),
    )
    is_optional = models.BooleanField(
        'Предмет по выбору',
        default=False,
        help_text="Если включено — предмет не обязательный, учитывается как 'по выбору'.",
    )

    class Meta:
        verbose_name = 'Требования по предмету'
        verbose_name_plural = 'Требования по предметам'
        unique_together = ('program_id', 'subject_id', 'year')

    def __str__(self):
        return f'{self.program_id.code} -> {self.subject_id.name} ({self.year})'


class ImportSettings(models.Model):
    update_interval_minutes = models.PositiveIntegerField(
        'Интервал обновления в минутах',
        default=30,
    )
    is_enabled = models.BooleanField(
        'Автоматическое обновление включено',
        default=True,
    )

    class Meta:
        verbose_name = 'Настройки импорта'
        verbose_name_plural = 'Настройки импорта'

    def __str__(self):
        return f'Обновление каждые {self.update_interval_minutes} минут'


class DataImport(models.Model):
    class Status(models.TextChoices):
        RUNNING = 'running', 'Идет обновление'
        SUCCESS = 'success', 'Успешно'
        FAILED = 'failed', 'Ошибка'

    status = models.CharField(
        'Статус',
        max_length=20,
        choices=Status.choices,
        default=Status.RUNNING,
    )
    started_at = models.DateTimeField('Начало обновления')
    finished_at = models.DateTimeField(
        'Окончание обновления',
        null=True,
        blank=True,
    )
    total_loaded = models.PositiveIntegerField(
        'Загружено записей',
        default=0,
    )
    error_message = models.TextField(
        'Текст ошибки',
        blank=True,
    )

    class Meta:
        verbose_name = 'Импорт данных'
        verbose_name_plural = 'Импорты данных'
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.get_status_display()} — {self.started_at}'


class ApplicantApplication(models.Model):
    student_id = models.CharField(
        'ID студента',
        max_length=64,
        db_index=True,
    )
    student_name = models.CharField(
        'ФИО студента',
        max_length=255,
    )

    direction_code = models.CharField(
        'Код направления',
        max_length=32,
        db_index=True,
    )
    direction_name = models.CharField(
        'Направление',
        max_length=255,
    )

    avg_score = models.FloatField('Средний балл')
    sum_score = models.PositiveIntegerField(
        'Сумма баллов',
        default=0,
    )
    no_exams = models.BooleanField(
        'БВИ / без экзаменов',
        default=False,
    )

    approval = models.BooleanField(
        'Подано согласие',
        default=False,
    )
    high_priority_no_original = models.BooleanField(
        'ВПР без оригинала',
        default=False,
    )
    top_priority = models.BooleanField(
        'Высший приоритет',
        default=False,
    )

    status_vuz = models.CharField(
        'Статус ВУЗ',
        max_length=255,
        blank=True,
    )
    category = models.CharField(
        'Категория',
        max_length=255,
        blank=True,
    )
    level_education = models.CharField(
        'Уровень образования',
        max_length=255,
        blank=True,
    )

    actual = models.BooleanField(
        'Актуальная запись',
        default=True,
    )
    imported_at = models.DateTimeField(
        'Дата импорта',
        auto_now=True,
    )

    class Meta:
        verbose_name = 'Заявление абитуриента'
        verbose_name_plural = 'Заявления абитуриентов'
        indexes = [
            models.Index(fields=['direction_code']),
            models.Index(fields=['actual']),
            models.Index(fields=['top_priority']),
        ]

    def __str__(self):
        return f'{self.student_name} — {self.direction_code}'
