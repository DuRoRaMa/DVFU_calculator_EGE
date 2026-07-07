from apps.core.constants import (
    EGE_EXAM_FORM,
    NO_EXAMS_AVERAGE_SCORE,
    SPECIAL_DIRECTIONS_KEYWORDS,
    SPECIAL_EXAM_FORMS,
)
from apps.core.utils import get_text, normalize_upper, to_bool, to_float


def is_special_direction(training_direction: str) -> bool:
    normalized_direction = get_text(training_direction).lower()

    return any(
        get_text(keyword).lower() in normalized_direction
        for keyword in SPECIAL_DIRECTIONS_KEYWORDS
    )


def calculate_average_score(item: dict) -> float:
    """
    Старая бизнес-логика расчета среднего балла:

    - БВИ / NoExams = 100;
    - обычные направления = только ЕГЭ;
    - направления-исключения = ЕГЭ + ДВИ/ВИ.
    """

    if to_bool(item.get('NoExams')):
        return NO_EXAMS_AVERAGE_SCORE

    training_direction = get_text(item.get('TrainingDirection'))
    special_direction = is_special_direction(training_direction)

    scores = []

    for index in range(1, 6):
        score = to_float(item.get(f'Test{index}Score'), default=0.0)
        exam_form = normalize_upper(item.get(f'Test{index}Form'))

        if score <= 0:
            continue

        if exam_form == EGE_EXAM_FORM:
            scores.append(score)
            continue

        if special_direction and exam_form in SPECIAL_EXAM_FORMS:
            scores.append(score)

    if not scores:
        return 0.0

    return round(sum(scores) / len(scores), 2)
