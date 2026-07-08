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


def get_used_exam_scores(item: dict) -> list[float]:
    """
    Возвращает список баллов экзаменов, которые должны участвовать
    в расчёте среднего балла и суммы баллов без индивидуальных достижений.
    """

    training_direction = get_text(
        item.get('TrainingDirection')
        or item.get('SpecName')
        or item.get('DirectionName')
    )
    special_direction = is_special_direction(training_direction)

    scores = []

    for index in range(1, 6):
        score = to_float(item.get(f'Test{index}Score'), default=None)
        exam_form = normalize_upper(item.get(f'Test{index}Form'))

        if score is None:
            continue

        if score <= 0:
            continue

        if score > 100:
            continue

        if exam_form == EGE_EXAM_FORM:
            scores.append(score)
            continue

        if special_direction and exam_form in SPECIAL_EXAM_FORMS:
            scores.append(score)

    return scores


def calculate_average_score(item: dict) -> float:
    """
    Бизнес-логика расчёта среднего балла:

    - БВИ / NoExams = 100;
    - обычные направления = только ЕГЭ;
    - направления-исключения = ЕГЭ + ДВИ/ВИ;
    - индивидуальные достижения не учитываются.
    """

    if to_bool(item.get('NoExams')):
        return NO_EXAMS_AVERAGE_SCORE

    scores = get_used_exam_scores(item)

    if not scores:
        return 0.0

    return round(sum(scores) / len(scores), 2)


def calculate_sum_score_without_individual_achievements(item: dict) -> int:
    """
    Считает сумму баллов без индивидуальных достижений.

    Важно:
    - SumScore из источника не используем;
    - суммируем ровно те экзамены, которые участвуют в calculate_average_score;
    - для БВИ / NoExams возвращаем 100.
    """

    if to_bool(item.get('NoExams')):
        return int(NO_EXAMS_AVERAGE_SCORE)

    scores = get_used_exam_scores(item)

    if not scores:
        return 0

    return int(round(sum(scores)))