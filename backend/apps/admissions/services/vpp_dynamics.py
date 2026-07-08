from django.utils import timezone

from apps.admissions.models import VppAverageScoreSnapshot
from apps.admissions.selectors import get_direction_stats, get_university_stats


def create_vpp_average_score_snapshots(import_log) -> int:
    """
    Создаёт снимки движения среднего балла по ВПП после успешного импорта.

    Сохраняем:
    - один снимок по университету;
    - один снимок на каждый уникальный direction_code.

    Важно:
    если в статистике случайно появятся дубли по direction_code,
    мы не дадим им сломать импорт.
    """

    imported_at = import_log.finished_at or timezone.now()

    VppAverageScoreSnapshot.objects.filter(import_log=import_log).delete()

    snapshots = []

    university_stats = get_university_stats()

    snapshots.append(
        VppAverageScoreSnapshot(
            import_log=import_log,
            scope=VppAverageScoreSnapshot.Scope.UNIVERSITY,
            direction_code='',
            direction_name='Университет',
            average_score_by_plan=university_stats.get('average_score_by_plan'),
            average_score_by_vpp_count=university_stats.get('average_score_by_vpp_count'),
            plan_score_sum=university_stats.get('plan_score_sum') or 0.0,
            admission_plan=university_stats.get('total_admission_plan') or 0,
            plan_applications_count=university_stats.get('plan_applications_count') or 0,
            plan_missing_count=university_stats.get('plan_missing_count') or 0,
            plan_fill_percent=university_stats.get('plan_fill_percent') or 0.0,
            total_applications=university_stats.get('total_applications') or 0,
            approvals_count=university_stats.get('approvals_count') or 0,
            top_priority_count=university_stats.get('top_priority_count') or 0,
            imported_at=imported_at,
        )
    )

    direction_snapshots_by_code = {}

    for direction in get_direction_stats():
        direction_code = direction.get('direction_code') or ''

        if not direction_code:
            continue

        direction_snapshots_by_code[direction_code] = VppAverageScoreSnapshot(
            import_log=import_log,
            scope=VppAverageScoreSnapshot.Scope.DIRECTION,
            direction_code=direction_code,
            direction_name=direction.get('direction_name') or '',
            average_score_by_plan=direction.get('average_score_by_plan'),
            average_score_by_vpp_count=direction.get('average_score_by_vpp_count'),
            plan_score_sum=direction.get('plan_score_sum') or 0.0,
            admission_plan=direction.get('admission_plan') or 0,
            plan_applications_count=direction.get('plan_applications_count') or 0,
            plan_missing_count=direction.get('plan_missing_count') or 0,
            plan_fill_percent=direction.get('plan_fill_percent') or 0.0,
            total_applications=direction.get('total_applications') or 0,
            approvals_count=direction.get('approvals_count') or 0,
            top_priority_count=direction.get('top_priority_count') or 0,
            imported_at=imported_at,
        )

    snapshots.extend(direction_snapshots_by_code.values())

    if not snapshots:
        return 0

    VppAverageScoreSnapshot.objects.bulk_create(
        snapshots,
        batch_size=1000,
        ignore_conflicts=True,
    )

    return len(snapshots)


def get_university_vpp_average_dynamics(limit: int = 30):
    queryset = (
        VppAverageScoreSnapshot.objects
        .filter(scope=VppAverageScoreSnapshot.Scope.UNIVERSITY)
        .order_by('-imported_at')[:limit]
    )

    return list(reversed(list(queryset)))


def get_direction_vpp_average_dynamics(direction_code: str, limit: int = 30):
    queryset = (
        VppAverageScoreSnapshot.objects
        .filter(
            scope=VppAverageScoreSnapshot.Scope.DIRECTION,
            direction_code=direction_code,
        )
        .order_by('-imported_at')[:limit]
    )

    return list(reversed(list(queryset)))