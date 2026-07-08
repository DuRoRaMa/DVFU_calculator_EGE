from django.db.models import Count, Min, Q

from apps.core.utils import round_float
from apps.programs.models import EducationProgram

from .models import ApplicantApplication


def get_applications_queryset():
    return ApplicantApplication.objects.filter(actual=True)


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
