from apps.core.utils import get_text
from apps.programs.models import PriorityTarget


def normalize_ugsn_code(value: str) -> str:
    """
    Приводит код направления к коду УГСН.

    45.03.02 -> 45.00.00
    44.03.05 -> 44.00.00
    """

    code = get_text(value)

    if not code:
        return ''

    first_part = code.split('.')[0]

    if not first_part:
        return ''

    return f'{first_part}.00.00'


def get_priority_targets():
    """
    Возвращает:
    - общий целевой показатель Приоритета 2030;
    - целевые показатели по УГСН.
    """

    queryset = PriorityTarget.objects.filter(is_active=True)

    total_target = None
    ugsn_targets = {}

    for target in queryset:
        if target.target_type == PriorityTarget.TargetType.PRIORITY_TOTAL:
            total_target = target.target_avg_score
            continue

        if target.target_type == PriorityTarget.TargetType.PRIORITY_UGSN:
            ugsn_code = get_text(target.ugsn_code)

            if not ugsn_code:
                continue

            ugsn_targets[ugsn_code] = {
                'ugsn_code': ugsn_code,
                'ugsn_name': get_text(target.ugsn_name),
                'target_avg_score': target.target_avg_score,
            }

    return {
        'total_target': total_target,
        'ugsn_targets': ugsn_targets,
    }