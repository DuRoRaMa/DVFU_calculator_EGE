from collections import defaultdict

from django.db import transaction
from django.utils import timezone

from apps.admissions.models import ApplicantApplication
from apps.admissions.services.vpp_dynamics import create_vpp_average_score_snapshots
from apps.core.utils import get_text, to_bool, to_int
from apps.imports.models import DataImport, ImportSettings
from apps.imports.services.admission_source import get_admission_source
from apps.imports.services.filters import (
    get_student_id,
    is_allowed_applicant_item,
)
from apps.imports.services.score_calculator import (
    calculate_average_score,
    calculate_sum_score_without_individual_achievements,
)
from apps.programs.models import EducationProgram


def normalize_direction_name(value: str) -> str:
    """
    Нормализует название направления / ОП для сравнения.

    Нужно, чтобы строки с лишними пробелами не считались разными ОП.
    """

    return ' '.join(get_text(value).lower().split())


def get_program_flags_by_code() -> dict[str, dict]:
    """
    Загружает признаки направлений из БД.

    Используется при импорте, чтобы не зашивать в код:
    - какие направления являются приёмом на ОП;
    - какие направления приоритетные.

    В этом файле используется только is_op_admission.
    """

    rows = EducationProgram.objects.values(
        'code',
        'is_op_admission',
        'is_priority_2030',
    )

    return {
        get_text(row['code']): {
            'is_op_admission': bool(row.get('is_op_admission')),
            'is_priority_2030': bool(row.get('is_priority_2030')),
        }
        for row in rows
    }


def is_op_admission_direction(
    direction_code: str,
    program_flags_by_code: dict[str, dict],
) -> bool:
    """
    Проверяет, включена ли у направления галочка 'Приём на ОП'.
    """

    flags = program_flags_by_code.get(get_text(direction_code), {})

    return bool(flags.get('is_op_admission'))


def get_item_direction_code(item: dict) -> str:
    return get_text(item.get('SpecCode'))


def get_item_direction_name(item: dict) -> str:
    return get_text(
        item.get('TrainingDirection')
        or item.get('SpecName')
        or item.get('DirectionName')
    )


def get_application_dedup_key(
    applicant: ApplicantApplication,
    program_flags_by_code: dict[str, dict],
) -> tuple:
    """
    Ключ уникальности заявления при импорте.

    Обычные направления:
        student_id + direction_code

    Направления с приёмом на ОП:
        student_id + direction_code + direction_name

    Это нужно, чтобы заявления под одним кодом, но на разные ОП,
    не схлопывались в одну запись.
    """

    if is_op_admission_direction(
        applicant.direction_code,
        program_flags_by_code,
    ):
        return (
            applicant.student_id,
            applicant.direction_code,
            normalize_direction_name(applicant.direction_name),
        )

    return (
        applicant.student_id,
        applicant.direction_code,
    )


def get_plan_variant_key(
    item: dict,
    program_flags_by_code: dict[str, dict],
) -> tuple:
    """
    Ключ варианта плана приёма.

    Обычные направления:
        direction_code

    Направления с приёмом на ОП:
        direction_code + direction_name

    Это нужно, чтобы план по разным ОП под одним кодом
    не перетирался, а суммировался.
    """

    direction_code = get_item_direction_code(item)
    direction_name = get_item_direction_name(item)

    if is_op_admission_direction(
        direction_code,
        program_flags_by_code,
    ):
        return (
            direction_code,
            normalize_direction_name(direction_name),
        )

    return (
        direction_code,
        '',
    )


def build_applicant_from_item(item: dict) -> ApplicantApplication:
    avg_score = calculate_average_score(item)
    sum_score_without_id = calculate_sum_score_without_individual_achievements(item)

    return ApplicantApplication(
        student_id=get_student_id(item),
        student_name=get_text(item.get('Name')),
        direction_code=get_text(item.get('SpecCode')),
        direction_name=get_text(item.get('TrainingDirection')),

        avg_score=avg_score,
        sum_score=sum_score_without_id,

        no_exams=to_bool(item.get('NoExams')),
        approval=to_bool(item.get('Approval')),
        high_priority_no_original=to_bool(item.get('HightPriorityNoOriginal')),
        top_priority=to_bool(item.get('TopPriority')),
        status_vuz=get_text(item.get('StatusVUZ')),
        category=get_text(item.get('Category')),
        level_education=get_text(item.get('LevelEducation')),
        actual=to_bool(item.get('Actual')),
    )


def sync_admission_plans_from_raw_items(
    raw_items: list[dict],
    program_flags_by_code: dict[str, dict],
) -> int:
    """
    Синхронизирует план приёма из 1С.

    Для обычных направлений:
        берём максимальный BudgetQuotaCount по коду направления.

    Для направлений с галочкой 'Приём на ОП':
        1. выделяем разные ОП по названию;
        2. для каждой ОП берём максимальный BudgetQuotaCount;
        3. суммируем планы всех ОП в общий admission_plan по коду.

    Пример:
        44.03.05 + ОП 1 = 25
        44.03.05 + ОП 2 = 20
        44.03.05 + ОП 3 = 15

        Итоговый план 44.03.05 = 60
    """

    variant_quota_by_key = {}

    for item in raw_items:
        program_code = get_item_direction_code(item)
        budget_quota_count = to_int(item.get('BudgetQuotaCount'), default=None)

        if not program_code:
            continue

        if budget_quota_count is None:
            continue

        if budget_quota_count < 0:
            continue

        variant_key = get_plan_variant_key(
            item,
            program_flags_by_code=program_flags_by_code,
        )

        variant_quota_by_key[variant_key] = max(
            variant_quota_by_key.get(variant_key, 0),
            budget_quota_count,
        )

    quota_by_code = defaultdict(int)

    for variant_key, quota in variant_quota_by_key.items():
        program_code = variant_key[0]
        quota_by_code[program_code] += quota

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

        if not raw_items:
            raise ValueError(
                'Источник импорта вернул пустой список. '
                'Перезапись заявлений отменена, чтобы не очистить базу случайно.'
            )

        program_flags_by_code = get_program_flags_by_code()

        applicants_by_key = {}

        for item in raw_items:
            if not is_allowed_applicant_item(item):
                continue

            applicant = build_applicant_from_item(item)

            key = get_application_dedup_key(
                applicant,
                program_flags_by_code=program_flags_by_code,
            )

            applicants_by_key[key] = applicant

        applicants = list(applicants_by_key.values())

        if not applicants:
            raise ValueError(
                'После фильтрации не осталось подходящих заявлений. '
                'Перезапись заявлений отменена. Проверьте Category, '
                'LevelEducation, StatusVUZ, Actual и SpecCode.'
            )

        with transaction.atomic():
            plans_updated = sync_admission_plans_from_raw_items(
                raw_items,
                program_flags_by_code=program_flags_by_code,
            )

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

        snapshots_created = create_vpp_average_score_snapshots(import_log)

        return {
            'status': DataImport.Status.SUCCESS,
            'loaded': len(applicants),
            'total': len(raw_items),
            'admission_plans_updated': plans_updated,
            'vpp_average_snapshots_created': snapshots_created,
            'message': (
                f'Импорт успешно завершен. '
                f'Получено записей: {len(raw_items)}. '
                f'Загружено подходящих заявлений: {len(applicants)}. '
                f'Обновлено планов приема: {plans_updated}. '
                f'Создано снимков динамики ВПП: {snapshots_created}.'
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
