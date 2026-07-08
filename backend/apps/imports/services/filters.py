from apps.core.constants import (
    ALLOWED_LEVEL_EDUCATION,
    EXCLUDED_STATUS_VUZ,
    GENERAL_COMPETITION_CATEGORY,
)
from apps.core.utils import (
    get_text,
    is_value_in_normalized_list,
    normalize_text,
    to_bool,
)


def get_student_id(item: dict) -> str:
    return get_text(item.get('ID_Student')) or get_text(item.get('Student'))


def is_allowed_applicant_item(item: dict) -> bool:
    if not to_bool(item.get('Actual')):
        return False

    status_vuz = get_text(item.get('StatusVUZ'))

    if is_value_in_normalized_list(status_vuz, EXCLUDED_STATUS_VUZ):
        return False

    category = normalize_text(item.get('Category'))

    if category != normalize_text(GENERAL_COMPETITION_CATEGORY):
        return False

    level_education = get_text(item.get('LevelEducation'))

    if not is_value_in_normalized_list(
        level_education,
        ALLOWED_LEVEL_EDUCATION,
    ):
        return False

    spec_code = get_text(item.get('SpecCode'))

    if not spec_code:
        return False

    student_id = get_student_id(item)

    if not student_id:
        return False

    return True
