from apps.core.utils import get_text
from apps.programs.models import EducationProgram


def get_program_flags_by_code() -> dict[str, dict]:
    """
    Загружает признаки направлений из БД.

    Используется во время импорта и расчёта статистики,
    чтобы не зашивать приоритетные направления и приём на ОП в код.
    """

    rows = EducationProgram.objects.values(
        'code',
        'is_priority_2030',
        'is_op_admission',
    )

    return {
        get_text(row['code']): {
            'is_priority_2030': bool(row['is_priority_2030']),
            'is_op_admission': bool(row['is_op_admission']),
        }
        for row in rows
    }


def is_op_admission_direction(
    direction_code: str,
    program_flags_by_code: dict[str, dict],
) -> bool:
    flags = program_flags_by_code.get(get_text(direction_code), {})

    return bool(flags.get('is_op_admission'))


def is_priority_2030_direction(
    direction_code: str,
    program_flags_by_code: dict[str, dict],
) -> bool:
    flags = program_flags_by_code.get(get_text(direction_code), {})

    return bool(flags.get('is_priority_2030'))