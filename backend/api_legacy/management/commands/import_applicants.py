from django.core.management.base import BaseCommand

from api.services.import_service import import_applicants


class Command(BaseCommand):
    help = 'Импорт абитуриентов из источника данных приемной кампании'

    def handle(self, *args, **options):
        result = import_applicants()

        self.stdout.write(
            self.style.SUCCESS(
                f'Импорт завершен. '
                f'Статус: {result.get("status")}. '
                f'Загружено: {result.get("loaded", 0)}. '
                f'План приема обновлен у направлений: '
                f'{result.get("admission_plans_updated", 0)}'
            )
        )
