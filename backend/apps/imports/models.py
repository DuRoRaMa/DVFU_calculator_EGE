from django.db import models


class ImportSettings(models.Model):
    class SourceType(models.TextChoices):
        LOCAL_JSON = 'local_json', 'Локальный JSON'
        SOAP = 'soap', 'SOAP-сервис'

    INTERVAL_CHOICES = [
        (30, 'Раз в 30 минут'),
        (60, 'Раз в 1 час'),
        (180, 'Раз в 3 часа'),
        (1440, 'Раз в сутки'),
    ]

    source_type = models.CharField(
        'Источник данных',
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.SOAP,
    )

    service_url = models.CharField(
        'Адрес SOAP-сервиса',
        max_length=1000,
        blank=True,
    )

    soap_action = models.CharField(
        'SOAPAction',
        max_length=255,
        blank=True,
    )

    service_login = models.CharField(
        'Логин SOAP-сервиса',
        max_length=255,
        blank=True,
    )

    service_password = models.CharField(
        'Пароль SOAP-сервиса',
        max_length=255,
        blank=True,
    )

    soap_timeout_seconds = models.PositiveIntegerField(
        'Таймаут SOAP-запроса, секунд',
        default=60,
    )

    verify_ssl = models.BooleanField(
        'Проверять SSL-сертификат',
        default=True,
    )

    update_interval_minutes = models.PositiveIntegerField(
        'Интервал обновления',
        choices=INTERVAL_CHOICES,
        default=30,
    )

    is_enabled = models.BooleanField(
        'Автоматическое обновление включено',
        default=False,
    )

    updated_at = models.DateTimeField(
        'Дата изменения настроек',
        auto_now=True,
    )

    class Meta:
        verbose_name = 'Настройки импорта'
        verbose_name_plural = 'Настройки импорта'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.get_source_type_display()} — {self.get_update_interval_minutes_display()}'


class DataImport(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'В очереди'
        RUNNING = 'running', 'Идет обновление'
        SUCCESS = 'success', 'Успешно'
        FAILED = 'failed', 'Ошибка'
        SKIPPED = 'skipped', 'Пропущено'

    class Trigger(models.TextChoices):
        MANUAL = 'manual', 'Ручной запуск'
        SCHEDULED = 'scheduled', 'Автоматический запуск'

    status = models.CharField(
        'Статус',
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    trigger = models.CharField(
        'Тип запуска',
        max_length=20,
        choices=Trigger.choices,
        default=Trigger.MANUAL,
    )

    scheduled_for = models.DateTimeField(
        'Плановое время запуска',
        null=True,
        blank=True,
        db_index=True,
    )

    celery_task_id = models.CharField(
        'ID Celery-задачи',
        max_length=255,
        blank=True,
        db_index=True,
    )

    started_at = models.DateTimeField(
        'Начало обновления',
        null=True,
        blank=True,
    )

    finished_at = models.DateTimeField(
        'Окончание обновления',
        null=True,
        blank=True,
    )

    total_received = models.PositiveIntegerField(
        'Получено записей из источника',
        default=0,
    )

    total_loaded = models.PositiveIntegerField(
        'Загружено подходящих записей',
        default=0,
    )

    error_message = models.TextField(
        'Текст ошибки',
        blank=True,
    )

    created_at = models.DateTimeField(
        'Дата создания',
        auto_now_add=True,
    )

    class Meta:
        verbose_name = 'Импорт данных'
        verbose_name_plural = 'Импорты данных'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['trigger']),
            models.Index(fields=['scheduled_for']),
            models.Index(fields=['celery_task_id']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['trigger', 'scheduled_for'],
                name='unique_scheduled_import_slot',
            ),
        ]

    def __str__(self):
        return f'{self.get_status_display()} — {self.created_at}'
