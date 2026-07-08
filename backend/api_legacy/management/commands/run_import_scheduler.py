import time
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import DataImport, ImportSettings
from api.services.import_service import import_applicants


class Command(BaseCommand):
    help = 'Периодически обновляет данные абитуриентов'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Планировщик обновления данных запущен'))

        while True:
            settings_obj, _ = ImportSettings.objects.get_or_create(id=1)

            if not settings_obj.is_enabled:
                self.stdout.write('Автообновление выключено')
                time.sleep(30)
                continue

            last_import = DataImport.objects.order_by('-started_at').first()

            should_run = False

            if last_import is None:
                should_run = True
            elif last_import.status == DataImport.Status.RUNNING:
                should_run = False
            else:
                next_run_at = last_import.started_at + timedelta(
                    minutes=settings_obj.update_interval_minutes
                )
                should_run = timezone.now() >= next_run_at

            if should_run:
                self.stdout.write('Запуск обновления данных')

                try:
                    result = import_applicants()

                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Импорт завершен. '
                            f'Загружено записей: {result.get("loaded", 0)}. '
                            f'План приема обновлен у направлений: '
                            f'{result.get("admission_plans_updated", 0)}'
                        )
                    )
                except Exception as error:
                    self.stdout.write(
                        self.style.ERROR(f'Ошибка импорта: {error}')
                    )

            time.sleep(15)
