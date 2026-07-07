from django.db import transaction
from django.utils import timezone

from apps.admissions.models import ApplicantApplication
from apps.core.utils import get_text, to_bool, to_int
from apps.imports.models import DataImport, ImportSettings
from apps.imports.services.admission_source import get_admission_source
from apps.imports.services.filters import (
    get_student_id,
    is_allowed_applicant_item,
)
from apps.imports.services.score_calculator import calculate_average_score
from apps.programs.models import EducationProgram


def build_applicant_from_item(item: dict) -> ApplicantApplication:
    return ApplicantApplication(
        student_id=get_student_id(item),
        student_name=get_text(item.get('Name')),
        direction_code=get_text(item.get('SpecCode')),
        direction_name=get_text(item.get('TrainingDirection')),
        avg_score=calculate_average_score(item),
        sum_score=to_int(item.get('SumScore')),
        no_exams=to_bool(item.get('NoExams')),
        approval=to_bool(item.get('Approval')),
        high_priority_no_original=to_bool(item.get('HightPriorityNoOriginal')),
        top_priority=to_bool(item.get('TopPriority')),
        status_vuz=get_text(item.get('StatusVUZ')),
        category=get_text(item.get('Category')),
        level_education=get_text(item.get('LevelEducation')),
        actual=to_bool(item.get('Actual')),
    )


def sync_admission_plans_from_raw_items(raw_items: list[dict]) -> int:
    quota_by_code = {}

    for item in raw_items:
        program_code = get_text(item.get('SpecCode'))
        budget_quota_count = to_int(item.get('BudgetQuotaCount'), default=None)

        if not program_code:
            continue

        if budget_quota_count is None:
            continue

        if budget_quota_count < 0:
            continue

        quota_by_code[program_code] = max(
            quota_by_code.get(program_code, 0),
            budget_quota_count,
        )

    programs_to_update = []

    for program in EducationProgram.objects.filter(code__in=quota_by_code.keys()):
        new_plan = quota_by_code.get(program.code)

        if new_plan is None:
            continue

        if program.admission_plan == new_plan:
            continue

        program.admission_plan = new_plan
        programs_to_update.append(program)

    if programs_to_update:
        EducationProgram.objects.bulk_update(
            programs_to_update,
            ['admission_plan'],
        )

    return len(programs_to_update)


def execute_import(import_log: DataImport) -> dict:
    settings_obj, _ = ImportSettings.objects.get_or_create(id=1)

    import_log.status = DataImport.Status.RUNNING
    import_log.started_at = timezone.now()
    import_log.error_message = ''
    import_log.save(
        update_fields=[
            'status',
            'started_at',
            'error_message',
        ]
    )

    try:
        source = get_admission_source(settings_obj)
        raw_items = source.fetch()

        applicants_by_key = {}

        for item in raw_items:
            if not is_allowed_applicant_item(item):
                continue

            applicant = build_applicant_from_item(item)

            key = (
                applicant.student_id,
                applicant.direction_code,
            )

            applicants_by_key[key] = applicant

        applicants = list(applicants_by_key.values())

        with transaction.atomic():
            plans_updated = sync_admission_plans_from_raw_items(raw_items)

            ApplicantApplication.objects.all().delete()
            ApplicantApplication.objects.bulk_create(
                applicants,
                batch_size=1000,
            )

        import_log.status = DataImport.Status.SUCCESS
        import_log.finished_at = timezone.now()
        import_log.total_received = len(raw_items)
        import_log.total_loaded = len(applicants)
        import_log.error_message = ''
        import_log.save(
            update_fields=[
                'status',
                'finished_at',
                'total_received',
                'total_loaded',
                'error_message',
            ]
        )

        return {
            'status': DataImport.Status.SUCCESS,
            'loaded': len(applicants),
            'total': len(raw_items),
            'admission_plans_updated': plans_updated,
            'message': (
                f'Импорт успешно завершен. '
                f'Получено записей: {len(raw_items)}. '
                f'Загружено подходящих заявлений: {len(applicants)}. '
                f'Обновлено планов приема: {plans_updated}.'
            ),
        }

    except Exception as error:
        import_log.status = DataImport.Status.FAILED
        import_log.finished_at = timezone.now()
        import_log.error_message = str(error)
        import_log.save(
            update_fields=[
                'status',
                'finished_at',
                'error_message',
            ]
        )
        raise