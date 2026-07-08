from datetime import timedelta

from celery import shared_task
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.core.constants import ALLOWED_IMPORT_INTERVALS
from apps.imports.models import DataImport, ImportSettings
from apps.imports.services.import_service import execute_import


def get_current_slot_start(now, interval_minutes):
    """
    Слот считается от 00:00 серверного времени.

    30 минут: 00:00, 00:30, 01:00
    1 час:    00:00, 01:00, 02:00
    3 часа:   00:00, 03:00, 06:00
    сутки:    00:00
    """
    local_now = timezone.localtime(now)

    midnight = local_now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    minutes_from_midnight = int((local_now - midnight).total_seconds() // 60)
    slot_minutes = (minutes_from_midnight // interval_minutes) * interval_minutes

    return midnight + timedelta(minutes=slot_minutes)


def has_active_import() -> bool:
    return DataImport.objects.filter(
        status__in=[
            DataImport.Status.PENDING,
            DataImport.Status.RUNNING,
        ]
    ).exists()


@shared_task(
    bind=True,
    name='apps.imports.tasks.run_import_task',
    autoretry_for=(TimeoutError,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 2},
)
def run_import_task(self, import_log_id: int):
    try:
        import_log = DataImport.objects.get(id=import_log_id)
    except DataImport.DoesNotExist:
        return {
            'status': 'missing',
            'message': f'Лог импорта {import_log_id} не найден',
        }

    import_log.celery_task_id = self.request.id
    import_log.save(update_fields=['celery_task_id'])

    return execute_import(import_log)


@shared_task(
    name='apps.imports.tasks.enqueue_due_import_task',
)
def enqueue_due_import_task():
    """
    Запускается каждую минуту Celery Beat.
    Если наступил новый слот от 00:00 — ставит импорт в очередь.
    """
    settings_obj, _ = ImportSettings.objects.get_or_create(id=1)

    if not settings_obj.is_enabled:
        return {
            'queued': False,
            'reason': 'Автоимпорт выключен',
        }

    interval_minutes = settings_obj.update_interval_minutes

    if interval_minutes not in ALLOWED_IMPORT_INTERVALS:
        return {
            'queued': False,
            'reason': f'Некорректный интервал: {interval_minutes}',
        }

    slot_start = get_current_slot_start(
        timezone.now(),
        interval_minutes,
    )

    with transaction.atomic():
        ImportSettings.objects.select_for_update().get(id=settings_obj.id)

        if has_active_import():
            return {
                'queued': False,
                'reason': 'Уже есть активный импорт',
            }

        try:
            import_log = DataImport.objects.create(
                status=DataImport.Status.PENDING,
                trigger=DataImport.Trigger.SCHEDULED,
                scheduled_for=slot_start,
            )
        except IntegrityError:
            return {
                'queued': False,
                'reason': 'Слот уже обработан или поставлен в очередь',
                'scheduled_for': slot_start.isoformat(),
            }

    async_result = run_import_task.apply_async(
        args=[import_log.id],
        queue='imports',
    )

    import_log.celery_task_id = async_result.id
    import_log.save(update_fields=['celery_task_id'])

    return {
        'queued': True,
        'import_log_id': import_log.id,
        'task_id': async_result.id,
        'scheduled_for': slot_start.isoformat(),
    }


def enqueue_manual_import():
    """
    Ручной запуск из админ-панели.
    """
    with transaction.atomic():
        ImportSettings.objects.select_for_update().get_or_create(id=1)

        if has_active_import():
            return None, 'Уже есть активный импорт'

        import_log = DataImport.objects.create(
            status=DataImport.Status.PENDING,
            trigger=DataImport.Trigger.MANUAL,
        )

    async_result = run_import_task.apply_async(
        args=[import_log.id],
        queue='imports',
    )

    import_log.celery_task_id = async_result.id
    import_log.save(update_fields=['celery_task_id'])

    return import_log, None
