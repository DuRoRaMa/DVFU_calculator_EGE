import pytest

from api.recommendation_engine import (
    RecommendationValidationError,
    build_recommendations,
)


def test_builds_top_20_sorted_recommendations_with_locked_category():
    payload = {
        "admission_plan": 10,
        "target_avg_score": 84,
        "score_type": "median",
        "categories": [
            {"id": "90_100", "name": "90–100", "lower": 90, "median": 95, "upper": 100, "locked_count": 2},
            {"id": "80_89", "name": "80–89", "lower": 80, "median": 85, "upper": 89},
            {"id": "70_79", "name": "70–79", "lower": 70, "median": 75, "upper": 79},
        ],
    }

    result = build_recommendations(payload)

    assert result["locked_count"] == 2
    assert len(result["recommendations"]) <= 20
    deviations = [item["absolute_deviation"] for item in result["recommendations"]]
    assert deviations == sorted(deviations)
    assert result["recommendations"][0]["distribution"]["90_100"] == 2
    assert sum(result["recommendations"][0]["distribution"].values()) == 10


def test_rejects_locked_count_above_admission_plan():
    with pytest.raises(RecommendationValidationError):
        build_recommendations({
            "admission_plan": 1,
            "target_avg_score": 80,
            "categories": [
                {"id": "90_100", "lower": 90, "median": 95, "upper": 100, "locked_count": 2},
            ],
        })


def test_supports_upper_score_type():
    result = build_recommendations({
        "admission_plan": 2,
        "target_avg_score": 90,
        "score_type": "upper",
        "categories": [
            {"id": "low", "lower": 60, "median": 70, "upper": 80},
            {"id": "high", "lower": 80, "median": 90, "upper": 100},
        ],
    })

    assert result["score_type"] == "upper"
    assert result["recommendations"][0]["final_avg_score"] == 90
