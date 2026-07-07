"""
Recommendation engine for RE_01–RE_05.

The module uses fixed score categories and the median value of each category.
The category names are fixed, but the median values and locked counts can be
changed from the UI.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from math import comb
from typing import Any, Dict, Iterable, List, Optional, Sequence


class RecommendationValidationError(ValueError):
    """Raised when the recommendation request is invalid."""


DEFAULT_CATEGORIES = [
    {"id": "90_100", "name": "90–100", "median": 95},
    {"id": "80_89", "name": "80–89", "median": 85},
    {"id": "70_79", "name": "70–79", "median": 75},
    {"id": "60_69", "name": "60–69", "median": 65},
    {"id": "0_59", "name": "0–59", "median": 50},
]

DEFAULT_CATEGORY_IDS = {category["id"] for category in DEFAULT_CATEGORIES}


@dataclass(frozen=True)
class ScoreCategory:
    id: str
    name: str
    median: Decimal
    locked_count: int = 0

    @property
    def score(self) -> Decimal:
        return self.median

    @property
    def is_locked(self) -> bool:
        return self.locked_count > 0


def _to_decimal(value: Any, field_name: str) -> Decimal:
    try:
        decimal_value = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        raise RecommendationValidationError(f"Поле {field_name} должно быть числом")

    if decimal_value.is_nan() or decimal_value < 0 or decimal_value > 100:
        raise RecommendationValidationError(f"Поле {field_name} должно быть в диапазоне от 0 до 100")
    return decimal_value


def _to_positive_int(value: Any, field_name: str, *, allow_zero: bool = True) -> int:
    try:
        int_value = int(value)
    except (TypeError, ValueError):
        raise RecommendationValidationError(f"Поле {field_name} должно быть целым числом")

    if int_value < 0 or (int_value == 0 and not allow_zero):
        raise RecommendationValidationError(f"Поле {field_name} должно быть положительным целым числом")
    return int_value


def _normalize_category_payload(payload: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    raw_categories = payload.get("categories") or []
    if not isinstance(raw_categories, list):
        raise RecommendationValidationError("categories должен быть списком")

    normalized: Dict[str, Dict[str, Any]] = {}
    for raw_category in raw_categories:
        if not isinstance(raw_category, dict):
            raise RecommendationValidationError("Каждая категория должна быть объектом")

        category_id = str(raw_category.get("id") or "")
        if category_id not in DEFAULT_CATEGORY_IDS:
            raise RecommendationValidationError(f"Неизвестная категория: {category_id}")
        normalized[category_id] = raw_category

    return normalized


def _parse_categories(payload: Dict[str, Any]) -> List[ScoreCategory]:
    raw_by_id = _normalize_category_payload(payload)
    locked_map = payload.get("locked_categories") or {}
    if not isinstance(locked_map, dict):
        raise RecommendationValidationError("locked_categories должен быть объектом вида {category_id: count}")

    categories: List[ScoreCategory] = []

    for default_category in DEFAULT_CATEGORIES:
        category_id = default_category["id"]
        raw_category = raw_by_id.get(category_id, {})

        median = _to_decimal(
            raw_category.get("median", raw_category.get("median_score", default_category["median"])),
            f"{category_id}.median",
        )
        locked_count = _to_positive_int(
            locked_map.get(category_id, raw_category.get("locked_count", 0)) or 0,
            f"{category_id}.locked_count",
        )

        categories.append(
            ScoreCategory(
                id=category_id,
                name=default_category["name"],
                median=median,
                locked_count=locked_count,
            )
        )

    return categories


def _generate_compositions(total: int, parts: int) -> Iterable[List[int]]:
    """Generate all non-negative integer vectors of length parts with sum total."""
    if parts == 0:
        if total == 0:
            yield []
        return
    if parts == 1:
        yield [total]
        return
    for current in range(total + 1):
        for tail in _generate_compositions(total - current, parts - 1):
            yield [current, *tail]


def _round(value: Decimal, digits: str = "0.01") -> float:
    return float(value.quantize(Decimal(digits), rounding=ROUND_HALF_UP))


def _make_candidate(
    *,
    categories: Sequence[ScoreCategory],
    counts_by_category: Dict[str, int],
    target_avg_score: Decimal,
    admission_plan: int,
) -> Dict[str, Any]:
    total_score = sum(
        category.score * Decimal(counts_by_category.get(category.id, 0))
        for category in categories
    )
    final_avg_score = total_score / Decimal(admission_plan)
    deviation = final_avg_score - target_avg_score

    distribution = [
        {
            "category_id": category.id,
            "category_name": category.name,
            "count": counts_by_category.get(category.id, 0),
            "score": _round(category.score),
            "median": _round(category.median),
            "is_locked": category.is_locked,
        }
        for category in categories
    ]

    return {
        "distribution": {item["category_id"]: item["count"] for item in distribution},
        "categories": distribution,
        "score_type": "median",
        "final_avg_score": _round(final_avg_score),
        "deviation_from_target": _round(deviation),
        "absolute_deviation": _round(abs(deviation)),
    }


def _candidate_sort_key(candidate: Dict[str, Any]) -> tuple:
    return (
        candidate["absolute_deviation"],
        abs(candidate["deviation_from_target"]),
        -candidate["final_avg_score"],
        tuple(candidate["distribution"].items()),
    )


def build_recommendations(payload: Dict[str, Any], *, program: Optional[Any] = None) -> Dict[str, Any]:
    """
    Build up to max_results best applicant distributions.

    payload fields:
    - admission_plan: integer, defaults to program.admission_plan
    - target_avg_score: number, defaults to program.target_avg_score
    - categories: fixed category ids with editable median and locked_count
    - locked_categories: optional {category_id: count}
    - max_results: integer, defaults to 20
    - max_combinations: safety limit, defaults to 5_000_000

    Only the median category value is used in calculations.
    """
    if program is None and not payload.get("admission_plan"):
        raise RecommendationValidationError("Необходимо указать admission_plan или program")

    score_type = str(payload.get("score_type", "median") or "median").strip().lower()
    if score_type not in ("median", "middle", "медиана", ""):
        raise RecommendationValidationError("В системе рекомендаций поддерживается только медианная планка")

    admission_plan = _to_positive_int(
        payload.get("admission_plan", getattr(program, "admission_plan", None)),
        "admission_plan",
        allow_zero=False,
    )
    target_avg_score = _to_decimal(
        payload.get("target_avg_score", getattr(program, "target_avg_score", None)),
        "target_avg_score",
    )
    max_results = min(_to_positive_int(payload.get("max_results", 20), "max_results", allow_zero=False), 20)
    max_combinations = _to_positive_int(
        payload.get("max_combinations", 5_000_000),
        "max_combinations",
        allow_zero=False,
    )

    categories = _parse_categories(payload)
    locked_count = sum(category.locked_count for category in categories)
    if locked_count > admission_plan:
        raise RecommendationValidationError(
            "Суммарное количество абитуриентов в заблокированных категориях "
            "не должно превышать план набора"
        )

    unlocked_categories = [category for category in categories if not category.is_locked]
    remaining_count = admission_plan - locked_count
    if remaining_count > 0 and not unlocked_categories:
        raise RecommendationValidationError(
            "Все категории заблокированы, но план набора ещё не заполнен"
        )

    combinations_total = 1 if not unlocked_categories else comb(
        remaining_count + len(unlocked_categories) - 1,
        len(unlocked_categories) - 1,
    )
    if combinations_total > max_combinations:
        raise RecommendationValidationError(
            f"Слишком большое пространство перебора: {combinations_total}. "
            f"Увеличьте max_combinations или уменьшите план/число незаблокированных категорий."
        )

    best_candidates: List[Dict[str, Any]] = []
    base_counts = {category.id: category.locked_count for category in categories}

    for composition in _generate_compositions(remaining_count, len(unlocked_categories)):
        counts_by_category = dict(base_counts)
        for category, count in zip(unlocked_categories, composition):
            counts_by_category[category.id] = count

        candidate = _make_candidate(
            categories=categories,
            counts_by_category=counts_by_category,
            target_avg_score=target_avg_score,
            admission_plan=admission_plan,
        )
        best_candidates.append(candidate)
        best_candidates.sort(key=_candidate_sort_key)
        if len(best_candidates) > max_results:
            best_candidates.pop()

    best_candidates.sort(key=_candidate_sort_key)
    for index, candidate in enumerate(best_candidates, start=1):
        candidate["rank"] = index

    return {
        "target_avg_score": _round(target_avg_score),
        "admission_plan": admission_plan,
        "score_type": "median",
        "locked_count": locked_count,
        "calculated_count": remaining_count,
        "categories_count": len(categories),
        "unlocked_categories_count": len(unlocked_categories),
        "checked_combinations": combinations_total,
        "recommendations": best_candidates,
    }
