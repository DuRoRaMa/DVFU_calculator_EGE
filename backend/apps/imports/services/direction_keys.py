from apps.core.utils import get_text
from apps.programs.services.program_flags import is_op_admission_direction


def normalize_direction_name(value: str) -> str:
    return ' '.join(get_text(value).lower().split())


def get_item_student_id(item: dict) -> str:
    return get_text(
        item.get('ID_Student')
        or item.get('StudentID')
        or item.get('student_id')
    )


def get_item_direction_code(item: dict) -> str:
    return get_text(item.get('SpecCode'))


def get_item_direction_name(item: dict) -> str:
    return get_text(
        item.get('TrainingDirection')
        or item.get('SpecName')
        or item.get('DirectionName')
    )


def get_application_dedup_key(
    item: dict,
    program_flags_by_code: dict[str, dict],
) -> tuple:
    """
    Ключ уникальности заявления при импорте.

    Обычные направления:
        student_id + direction_code

    Направления с приёмом на ОП:
        student_id + direction_code + direction_name
    """

    student_id = get_item_student_id(item)
    direction_code = get_item_direction_code(item)
    direction_name = get_item_direction_name(item)

    if is_op_admission_direction(direction_code, program_flags_by_code):
        return (
            student_id,
            direction_code,
            normalize_direction_name(direction_name),
        )

    return (
        student_id,
        direction_code,
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

    Это нужно, чтобы план приёма по разным ОП под одним кодом
    не перетирался, а суммировался.
    """

    direction_code = get_item_direction_code(item)
    direction_name = get_item_direction_name(item)

    if is_op_admission_direction(direction_code, program_flags_by_code):
        return (
            direction_code,
            normalize_direction_name(direction_name),
        )

    return (
        direction_code,
        '',
    )