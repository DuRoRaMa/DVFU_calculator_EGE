from django.db import models


class ApplicantApplication(models.Model):
    student_id = models.CharField(
        'ID абитуриента',
        max_length=64,
        db_index=True,
    )

    student_name = models.CharField(
        'ФИО абитуриента',
        max_length=255,
        blank=True,
    )

    direction_code = models.CharField(
        'Код направления',
        max_length=32,
        db_index=True,
    )

    direction_name = models.CharField(
        'Направление',
        max_length=255,
        blank=True,
    )

    avg_score = models.FloatField(
        'Средний балл',
    )

    sum_score = models.PositiveIntegerField(
        'Сумма баллов',
        default=0,
    )

    no_exams = models.BooleanField(
        'БВИ / без экзаменов',
        default=False,
        db_index=True,
    )

    approval = models.BooleanField(
        'Подано согласие',
        default=False,
        db_index=True,
    )

    high_priority_no_original = models.BooleanField(
        'Высший приоритет без оригинала',
        default=False,
    )

    top_priority = models.BooleanField(
        'Высший приоритет',
        default=False,
        db_index=True,
    )

    status_vuz = models.CharField(
        'Статус заявления',
        max_length=255,
        blank=True,
        db_index=True,
    )

    category = models.CharField(
        'Категория конкурса',
        max_length=255,
        blank=True,
        db_index=True,
    )

    level_education = models.CharField(
        'Уровень образования',
        max_length=255,
        blank=True,
        db_index=True,
    )

    actual = models.BooleanField(
        'Актуальная запись',
        default=True,
        db_index=True,
    )

    imported_at = models.DateTimeField(
        'Дата импорта',
        auto_now=True,
    )

    class Meta:
        verbose_name = 'Заявление абитуриента'
        verbose_name_plural = 'Заявления абитуриентов'
        ordering = [
            'direction_code',
            '-avg_score',
            '-sum_score',
            'student_name',
        ]
        indexes = [
            models.Index(fields=['direction_code']),
            models.Index(fields=['student_id']),
            models.Index(fields=['direction_code', '-avg_score']),
            models.Index(fields=['direction_code', 'approval']),
            models.Index(fields=['direction_code', 'top_priority']),
            models.Index(fields=['category']),
            models.Index(fields=['level_education']),
            models.Index(fields=['actual']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['student_id', 'direction_code'],
                name='unique_applicant_application_by_direction',
            )
        ]

    def __str__(self):
        return f'{self.student_id} — {self.direction_code} — {self.avg_score}'

class VppAverageScoreSnapshot(models.Model):
    class Scope(models.TextChoices):
        UNIVERSITY = 'university', 'Университет'
        DIRECTION = 'direction', 'Направление'

    import_log = models.ForeignKey(
        'imports.DataImport',
        on_delete=models.CASCADE,
        related_name='vpp_average_score_snapshots',
        verbose_name='Импорт',
    )

    scope = models.CharField(
        'Область расчёта',
        max_length=20,
        choices=Scope.choices,
    )

    direction_code = models.CharField(
        'Код направления',
        max_length=50,
        blank=True,
        default='',
    )

    direction_name = models.CharField(
        'Название направления',
        max_length=500,
        blank=True,
        default='',
    )

    average_score_by_plan = models.FloatField(
        'Средний по плану',
        null=True,
        blank=True,
    )

    average_score_by_vpp_count = models.FloatField(
        'Средний по ВПП',
        null=True,
        blank=True,
    )

    plan_score_sum = models.FloatField(
        'Сумма средних баллов ВПП',
        default=0.0,
    )

    admission_plan = models.PositiveIntegerField(
        'План набора',
        default=0,
    )

    plan_applications_count = models.PositiveIntegerField(
        'ВПП в плане',
        default=0,
    )

    plan_missing_count = models.PositiveIntegerField(
        'Не хватает ВПП',
        default=0,
    )

    plan_fill_percent = models.FloatField(
        'Заполнение плана, %',
        default=0.0,
    )

    total_applications = models.PositiveIntegerField(
        'Всего заявлений',
        default=0,
    )

    approvals_count = models.PositiveIntegerField(
        'Согласий',
        default=0,
    )

    top_priority_count = models.PositiveIntegerField(
        'ВПП всего',
        default=0,
    )

    imported_at = models.DateTimeField(
        'Дата импорта',
    )

    created_at = models.DateTimeField(
        'Дата создания снимка',
        auto_now_add=True,
    )

    class Meta:
        verbose_name = 'Снимок среднего балла по ВПП'
        verbose_name_plural = 'Снимки среднего балла по ВПП'
        ordering = ['-imported_at', 'scope', 'direction_code']
        constraints = [
            models.UniqueConstraint(
                fields=['import_log', 'scope', 'direction_code'],
                name='unique_vpp_average_snapshot_per_import_scope_direction',
            ),
        ]

    def __str__(self):
        if self.scope == self.Scope.UNIVERSITY:
            return f'Динамика ВПП по университету — {self.imported_at:%d.%m.%Y %H:%M}'

        return f'{self.direction_code} — {self.imported_at:%d.%m.%Y %H:%M}'
