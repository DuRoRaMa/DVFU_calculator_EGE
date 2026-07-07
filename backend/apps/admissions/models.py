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