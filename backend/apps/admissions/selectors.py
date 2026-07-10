from django.db.models import Count, Min, Q

from apps.core.utils import round_float
from apps.programs.models import EducationProgram

from .models import ApplicantApplication
from apps.programs.services.program_flags import (
    get_program_flags_by_code,
    is_priority_2030_direction,
)
from apps.programs.services.priority_targets import (
    get_priority_targets,
    normalize_ugsn_code,
)

def calculate_delta(actual_value, target_value):
    if actual_value is None or target_value is None:
        return None

    return round(actual_value - target_value, 2)


def get_status_by_delta(delta):
    if delta is None:
        return 'no_target'

    if delta >= 0:
        return 'success'

    if delta >= -1:
        return 'warning'

    return 'danger'

def get_applications_queryset():
    return ApplicantApplication.objects.filter(actual=True)

def get_priority_direction_stats():
    """
    Статистика по направлениям с галочкой 'Приоритет 2030'.
    """

    priority_targets = get_priority_targets()
    total_target = priority_targets['total_target']
    ugsn_targets = priority_targets['ugsn_targets']

    programs_by_code = {
        program.code: program
        for program in EducationProgram.objects.filter(is_priority_2030=True)
    }

    priority_codes = set(programs_by_code.keys())

    all_rows = get_direction_stats()

    priority_rows = [
        row
        for row in all_rows
        if row.get('direction_code') in priority_codes
    ]

    directions = []
    ugsn_groups = {}

    total_score_sum = 0
    total_vpp_count = 0

    for row in priority_rows:
        direction_code = row.get('direction_code')
        program = programs_by_code.get(direction_code)

        if not program:
            continue

        ugsn_code = normalize_ugsn_code(direction_code)
        ugsn_target = ugsn_targets.get(ugsn_code, {})

        actual_avg_score = row.get('average_score_by_vpp_count')
        target_avg_score = program.target_avg_score

        direction_delta = calculate_delta(
            actual_avg_score,
            target_avg_score,
        )

        plan_score_sum = row.get('plan_score_sum') or 0
        plan_applications_count = row.get('plan_applications_count') or 0

        total_score_sum += plan_score_sum
        total_vpp_count += plan_applications_count

        if ugsn_code not in ugsn_groups:
            ugsn_groups[ugsn_code] = {
                'ugsn_code': ugsn_code,
                'ugsn_name': ugsn_target.get('ugsn_name') or f'УГСН {ugsn_code}',
                'target_avg_score': ugsn_target.get('target_avg_score'),
                'plan_score_sum': 0,
                'plan_applications_count': 0,
                'directions_count': 0,
                'directions': [],
            }

        ugsn_groups[ugsn_code]['plan_score_sum'] += plan_score_sum
        ugsn_groups[ugsn_code]['plan_applications_count'] += plan_applications_count
        ugsn_groups[ugsn_code]['directions_count'] += 1

        direction_item = {
            'direction_code': direction_code,
            'direction_name': row.get('direction_name'),
            'ugsn_code': ugsn_code,
            'ugsn_name': ugsn_groups[ugsn_code]['ugsn_name'],
            'actual_avg_score': actual_avg_score,
            'target_avg_score': target_avg_score,
            'delta': direction_delta,
            'status': get_status_by_delta(direction_delta),
            'vpp_count': plan_applications_count,
        }

        directions.append(direction_item)
        ugsn_groups[ugsn_code]['directions'].append(direction_item)

    ugsn_results = []

    for group in ugsn_groups.values():
        group_vpp_count = group['plan_applications_count']
        group_score_sum = group['plan_score_sum']

        actual_avg_score = (
            round(group_score_sum / group_vpp_count, 2)
            if group_vpp_count > 0
            else 0
        )

        target_avg_score = group['target_avg_score']

        delta = calculate_delta(
            actual_avg_score,
            target_avg_score,
        )

        ugsn_results.append({
            'ugsn_code': group['ugsn_code'],
            'ugsn_name': group['ugsn_name'],
            'actual_avg_score': actual_avg_score,
            'target_avg_score': target_avg_score,
            'delta': delta,
            'status': get_status_by_delta(delta),
            'directions_count': group['directions_count'],
            'vpp_count': group_vpp_count,
            'directions': sorted(
                group['directions'],
                key=lambda item: item['direction_code'],
            ),
        })

    priority_actual_avg_score = (
        round(total_score_sum / total_vpp_count, 2)
        if total_vpp_count > 0
        else 0
    )

    total_delta = calculate_delta(
        priority_actual_avg_score,
        total_target,
    )

    return {
        'aggregate': {
            'actual_avg_score': priority_actual_avg_score,
            'target_avg_score': total_target,
            'delta': total_delta,
            'status': get_status_by_delta(total_delta),
            'directions_count': len(directions),
            'ugsn_count': len(ugsn_results),
            'vpp_count': total_vpp_count,
        },
        'ugsn_groups': sorted(
            ugsn_results,
            key=lambda item: item['ugsn_code'],
        ),
        'directions': sorted(
            directions,
            key=lambda item: item['direction_code'],
        ),
    }

def get_direction_applications(direction_code: str):
    return (
        get_applications_queryset()
        .filter(direction_code=direction_code)
        .order_by('-avg_score', '-sum_score', 'student_name')
    )


def get_plan_applications_for_direction(direction_code: str, admission_plan: int):
    """
    Берём заявления с ВПП / высшим приоритетом в пределах плана набора.

    Если план = 25, а ВПП = 40, учитываем только первые 25.
    Если план = 25, а ВПП = 12, учитываем 12.

    Дальше считаем два показателя:
    1. Средний по плану: сумма / план.
    2. Средний по ВПП: сумма / количество ВПП.
    """

    if admission_plan <= 0:
        return []

    return list(
        ApplicantApplication.objects
        .filter(
            actual=True,
            direction_code=direction_code,
            top_priority=True,
        )
        .order_by(
            '-no_exams',
            '-sum_score',
            '-avg_score',
            'student_name',
        )[:admission_plan]
    )


def calculate_plan_score_sum(applications: list[ApplicantApplication]) -> float:
    return sum(float(application.avg_score or 0) for application in applications)


def calculate_sum_score_sum(applications: list[ApplicantApplication]) -> float:
    return sum(float(application.sum_score or 0) for application in applications)


def calculate_average_by_plan(score_sum: float, admission_plan: int):
    """
    Средний по плану набора:
    сумма баллов ВПП в пределах плана / план набора.
    """

    if admission_plan <= 0:
        return None

    return round_float(
        score_sum / admission_plan,
        digits=2,
        default=None,
    )


def calculate_average_by_vpp_count(score_sum: float, vpp_count: int):
    """
    Средний по фактическим ВПП:
    сумма баллов ВПП в пределах плана / количество ВПП.
    """

    if vpp_count <= 0:
        return None

    return round_float(
        score_sum / vpp_count,
        digits=2,
        default=None,
    )


def get_direction_stats():
    rows = (
        get_applications_queryset()
        .values('direction_code')
        .annotate(
            direction_name=Min('direction_name'),
            total_applications=Count('id'),
            unique_applicants=Count('student_id', distinct=True),
            no_exams_count=Count('id', filter=Q(no_exams=True)),
            approvals_count=Count('id', filter=Q(approval=True)),
            top_priority_count=Count('id', filter=Q(top_priority=True)),
            high_priority_no_original_count=Count(
                'id',
                filter=Q(high_priority_no_original=True),
            ),
        )
        .order_by('direction_code')
    )

    programs_by_code = {
        program.code: program
        for program in EducationProgram.objects.all()
    }

    result = []

    for row in rows:
        direction_code = row['direction_code']
        program = programs_by_code.get(direction_code)

        admission_plan = int(program.admission_plan or 0) if program else 0
        target_avg_score = program.target_avg_score if program else 0.0
        total_applications = row['total_applications'] or 0

        plan_applications = get_plan_applications_for_direction(
            direction_code=direction_code,
            admission_plan=admission_plan,
        )

        plan_applications_count = len(plan_applications)
        plan_missing_count = max(admission_plan - plan_applications_count, 0)

        plan_score_sum = calculate_plan_score_sum(plan_applications)
        plan_sum_score_sum = calculate_sum_score_sum(plan_applications)

        average_score_by_plan = calculate_average_by_plan(
            score_sum=plan_score_sum,
            admission_plan=admission_plan,
        )

        average_score_by_vpp_count = calculate_average_by_vpp_count(
            score_sum=plan_score_sum,
            vpp_count=plan_applications_count,
        )

        average_sum_score_by_plan = calculate_average_by_plan(
            score_sum=plan_sum_score_sum,
            admission_plan=admission_plan,
        )

        average_sum_score_by_vpp_count = calculate_average_by_vpp_count(
            score_sum=plan_sum_score_sum,
            vpp_count=plan_applications_count,
        )

        if admission_plan > 0:
            plan_fill_percent = plan_applications_count / admission_plan * 100
        else:
            plan_fill_percent = 0.0

        result.append({
            'direction_code': direction_code,
            'direction_name': row['direction_name'] or (program.name if program else ''),
            'admission_plan': admission_plan,
            'target_avg_score': round_float(target_avg_score, digits=2, default=0.0),

            'total_applications': total_applications,
            'unique_applicants': row['unique_applicants'] or 0,

            # Для обратной совместимости оставляем average_score как показатель по плану.
            'average_score': average_score_by_plan,
            'average_sum_score': average_sum_score_by_plan,

            # Новые явные показатели.
            'average_score_by_plan': average_score_by_plan,
            'average_score_by_vpp_count': average_score_by_vpp_count,

            'average_sum_score_by_plan': average_sum_score_by_plan,
            'average_sum_score_by_vpp_count': average_sum_score_by_vpp_count,

            'plan_score_sum': round_float(plan_score_sum, digits=2, default=0.0),
            'plan_sum_score_sum': round_float(plan_sum_score_sum, digits=2, default=0.0),

            'plan_applications_count': plan_applications_count,
            'plan_missing_count': plan_missing_count,
            'plan_fill_percent': round_float(plan_fill_percent, digits=2, default=0.0),

            'no_exams_count': row['no_exams_count'] or 0,
            'approvals_count': row['approvals_count'] or 0,
            'top_priority_count': row['top_priority_count'] or 0,
            'high_priority_no_original_count': row['high_priority_no_original_count'] or 0,
        })

    return result


def get_university_stats():
    queryset = get_applications_queryset()

    base_stats = queryset.aggregate(
        total_applications=Count('id'),
        unique_applicants=Count('student_id', distinct=True),
        directions_count=Count('direction_code', distinct=True),
        no_exams_count=Count('id', filter=Q(no_exams=True)),
        approvals_count=Count('id', filter=Q(approval=True)),
        top_priority_count=Count('id', filter=Q(top_priority=True)),
    )

    programs = EducationProgram.objects.all()

    total_admission_plan = 0
    total_plan_score_sum = 0.0
    total_plan_sum_score_sum = 0.0
    total_plan_applications_count = 0

    for program in programs:
        admission_plan = int(program.admission_plan or 0)

        if admission_plan <= 0:
            continue

        plan_applications = get_plan_applications_for_direction(
            direction_code=program.code,
            admission_plan=admission_plan,
        )

        total_admission_plan += admission_plan
        total_plan_score_sum += calculate_plan_score_sum(plan_applications)
        total_plan_sum_score_sum += calculate_sum_score_sum(plan_applications)
        total_plan_applications_count += len(plan_applications)

    university_average_score_by_plan = calculate_average_by_plan(
        score_sum=total_plan_score_sum,
        admission_plan=total_admission_plan,
    )

    university_average_score_by_vpp_count = calculate_average_by_vpp_count(
        score_sum=total_plan_score_sum,
        vpp_count=total_plan_applications_count,
    )

    university_average_sum_score_by_plan = calculate_average_by_plan(
        score_sum=total_plan_sum_score_sum,
        admission_plan=total_admission_plan,
    )

    university_average_sum_score_by_vpp_count = calculate_average_by_vpp_count(
        score_sum=total_plan_sum_score_sum,
        vpp_count=total_plan_applications_count,
    )

    if total_admission_plan > 0:
        university_plan_fill_percent = round_float(
            total_plan_applications_count / total_admission_plan * 100,
            digits=2,
            default=0.0,
        )
    else:
        university_plan_fill_percent = 0.0

    by_level_education = list(
        queryset
        .values('level_education')
        .annotate(count=Count('id'))
        .order_by('level_education')
    )

    by_status_vuz = list(
        queryset
        .values('status_vuz')
        .annotate(count=Count('id'))
        .order_by('status_vuz')
    )

    return {
        'total_applications': base_stats['total_applications'] or 0,
        'unique_applicants': base_stats['unique_applicants'] or 0,
        'directions_count': base_stats['directions_count'] or 0,

        # Для обратной совместимости average_score = показатель по плану.
        'average_score': university_average_score_by_plan,

        # Новые явные показатели.
        'average_score_by_plan': university_average_score_by_plan,
        'average_score_by_vpp_count': university_average_score_by_vpp_count,

        'average_sum_score_by_plan': university_average_sum_score_by_plan,
        'average_sum_score_by_vpp_count': university_average_sum_score_by_vpp_count,

        'plan_score_sum': round_float(total_plan_score_sum, digits=2, default=0.0),
        'plan_sum_score_sum': round_float(total_plan_sum_score_sum, digits=2, default=0.0),

        'total_admission_plan': total_admission_plan,
        'plan_applications_count': total_plan_applications_count,
        'plan_missing_count': max(total_admission_plan - total_plan_applications_count, 0),
        'plan_fill_percent': university_plan_fill_percent,

        'no_exams_count': base_stats['no_exams_count'] or 0,
        'approvals_count': base_stats['approvals_count'] or 0,
        'top_priority_count': base_stats['top_priority_count'] or 0,

        'by_level_education': by_level_education,
        'by_status_vuz': by_status_vuz,
    }

def get_new_model_direction_stats():
    new_model_codes = set(
        EducationProgram.objects
        .filter(is_new_model=True)
        .values_list('code', flat=True)
    )

    rows = [
        row
        for row in get_direction_stats()
        if row.get('direction_code') in new_model_codes
    ]

    plan_score_sum = sum(row.get('plan_score_sum') or 0 for row in rows)
    vpp_count = sum(row.get('plan_applications_count') or 0 for row in rows)
    admission_plan = sum(row.get('admission_plan') or 0 for row in rows)
    missing = sum(row.get('plan_missing_count') or 0 for row in rows)

    return {
        'aggregate': {
            'directions_count': len(rows),
            'average_score_by_vpp_count': round(plan_score_sum / vpp_count, 2) if vpp_count else 0,
            'plan_applications_count': vpp_count,
            'admission_plan': admission_plan,
            'plan_missing_count': missing,
            'plan_fill_percent': round(vpp_count / admission_plan * 100, 2) if admission_plan else 0,
        },
        'directions': rows,
    }
