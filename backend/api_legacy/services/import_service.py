from django.db import transaction
from django.utils import timezone

from api.constants import (
    GENERAL_COMPETITION_CATEGORY,
    ALLOWED_LEVEL_EDUCATION,
    SPECIAL_DIRECTIONS_KEYWORDS,
    EXCLUDED_STATUS_VUZ,
)
from api.models import ApplicantApplication, DataImport, EducationPrograms
from api.services.admission_source import get_admission_source


def _to_int(value, default=0):
    try:
        if value is None or value == '':
            return default

        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value, default=0.0):
    try:
        if value is None or value == '':
            return default

        return float(value)
    except (TypeError, ValueError):
        return default


def _to_bool(value):
    return value is True or value == 'true' or value == 'True' or value == 1 or value == '1'


def _get_text(value):
    if value is None:
        return ''

    return str(value).strip()


def _is_special_direction(training_direction):
    normalized_direction = _get_text(training_direction).lower()

    return any(
        _get_text(keyword).lower() in normalized_direction
        for keyword in SPECIAL_DIRECTIONS_KEYWORDS
    )


def _is_allowed_item(item):
    """
    Проверяет, должен ли абитуриент попадать в мониторинг.
    """
    actual = _to_bool(item.get('Actual'))

    if not actual:
        return False

    status_vuz = _get_text(item.get('StatusVUZ'))

    if status_vuz in EXCLUDED_STATUS_VUZ:
        return False

    category = _get_text(item.get('Category'))

    if category != GENERAL_COMPETITION_CATEGORY:
        return False

    level_education = _get_text(item.get('LevelEducation'))

    if level_education not in ALLOWED_LEVEL_EDUCATION:
        return False

    spec_code = _get_text(item.get('SpecCode'))

    if not spec_code:
        return False

    student_id = _get_text(item.get('ID_Student')) or _get_text(item.get('Student'))

    if not student_id:
        return False

    return True


def _calculate_average_score(item):
    """
    Считает средний балл самостоятельно.

    Для обычных направлений учитываются только экзамены с формой ЕГЭ.
    Для специальных направлений из SPECIAL_DIRECTIONS_KEYWORDS дополнительно учитывается ДВИ.
    Для БВИ / NoExams средний балл считаем как 100.
    """
    if _to_bool(item.get('NoExams')):
        return 100.0

    training_direction = _get_text(item.get('TrainingDirection'))
    is_special_direction = _is_special_direction(training_direction)

    scores = []

    for index in range(1, 6):
        score = _to_float(item.get(f'Test{index}Score'), default=0.0)
        exam_form = _get_text(item.get(f'Test{index}Form')).upper()

        if score <= 0:
            continue

        if exam_form == 'ЕГЭ':
            scores.append(score)
            continue

        if is_special_direction and exam_form == 'ДВИ':
            scores.append(score)

    if not scores:
        return 0.0

    return round(sum(scores) / len(scores), 2)


def _get_student_id(item):
    return _get_text(item.get('ID_Student')) or _get_text(item.get('Student'))


def _build_applicant_from_item(item):
    return ApplicantApplication(
        student_id=_get_student_id(item),
        student_name=_get_text(item.get('Name')),

        direction_code=_get_text(item.get('SpecCode')),
        direction_name=_get_text(item.get('TrainingDirection')),

        avg_score=_calculate_average_score(item),
        sum_score=_to_int(item.get('SumScore')),
        no_exams=_to_bool(item.get('NoExams')),

        approval=_to_bool(item.get('Approval')),
        high_priority_no_original=_to_bool(item.get('HightPriorityNoOriginal')),
        top_priority=_to_bool(item.get('TopPriority')),

        status_vuz=_get_text(item.get('StatusVUZ')),
        category=_get_text(item.get('Category')),
        level_education=_get_text(item.get('LevelEducation')),

        actual=_to_bool(item.get('Actual')),
    )


def sync_admission_plans_from_raw_items(raw_items):
    """
    Обновляет план приема направлений по BudgetQuotaCount.

    Логика:
    - SpecCode из JSON сопоставляется с EducationPrograms.code;
    - BudgetQuotaCount становится новым EducationPrograms.admission_plan;
    - если по одному направлению встретилось несколько BudgetQuotaCount,
      берем максимальное значение, чтобы случайно не занизить план приема.
    """
    quota_by_code = {}

    for item in raw_items:
        program_code = _get_text(item.get('SpecCode'))
        budget_quota_count = _to_int(item.get('BudgetQuotaCount'), default=None)

        if not program_code:
            continue

        if budget_quota_count is None:
            continue

        if budget_quota_count < 0:
            continue

        if program_code not in quota_by_code:
            quota_by_code[program_code] = budget_quota_count
        else:
            quota_by_code[program_code] = max(
                quota_by_code[program_code],
                budget_quota_count,
            )

    if not quota_by_code:
        return 0

    programs = EducationPrograms.objects.filter(
        code__in=quota_by_code.keys()
    )

    programs_to_update = []

    for program in programs:
        new_admission_plan = quota_by_code.get(program.code)

        if new_admission_plan is None:
            continue

        if program.admission_plan != new_admission_plan:
            program.admission_plan = new_admission_plan
            programs_to_update.append(program)

    if programs_to_update:
        EducationPrograms.objects.bulk_update(
            programs_to_update,
            ['admission_plan'],
        )

    return len(programs_to_update)


def import_applicants():
    """
    Основная функция импорта.

    Сейчас источник данных может быть локальным JSON-файлом,
    позже вместо него можно подставить SOAP-адаптер.
    """
    import_log = DataImport.objects.create(
        status=DataImport.Status.RUNNING,
        started_at=timezone.now(),
    )

    try:
        source = get_admission_source()
        raw_items = source.fetch()

        total_count = len(raw_items)
        applicants_by_student_and_direction = {}

        for item in raw_items:
            if not _is_allowed_item(item):
                continue

            applicant = _build_applicant_from_item(item)

            unique_key = (
                applicant.student_id,
                applicant.direction_code,
            )

            applicants_by_student_and_direction[unique_key] = applicant

        applicants = list(applicants_by_student_and_direction.values())

        with transaction.atomic():
            admission_plans_updated = sync_admission_plans_from_raw_items(raw_items)

            ApplicantApplication.objects.all().delete()

            ApplicantApplication.objects.bulk_create(
                applicants,
                batch_size=1000,
            )

            import_log.status = DataImport.Status.SUCCESS
            import_log.finished_at = timezone.now()
            import_log.total_loaded = len(applicants)
            import_log.error_message = ''
            import_log.save(
                update_fields=[
                    'status',
                    'finished_at',
                    'total_loaded',
                    'error_message',
                ]
            )

        return {
            'status': DataImport.Status.SUCCESS,
            'loaded': len(applicants),
            'total': total_count,
            'admission_plans_updated': admission_plans_updated,
            'message': (
                f'Импорт успешно завершен. '
                f'Всего записей в источнике: {total_count}. '
                f'Загружено абитуриентов: {len(applicants)}. '
                f'Обновлено планов приема: {admission_plans_updated}.'
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
