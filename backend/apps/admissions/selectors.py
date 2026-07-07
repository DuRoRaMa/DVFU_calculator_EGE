from django.db.models import Avg, Count, Q

from apps.core.utils import round_float
from apps.programs.models import EducationProgram

from .models import ApplicantApplication


def get_applications_queryset():
    """
    Базовый queryset заявлений.

    После импорта здесь уже должны быть только:
    - актуальные записи;
    - общий конкурс;
    - Бакалавриат/Специалитет/БВО;
    - записи без запрещённых статусов.

    actual=True оставляем как дополнительную защиту.
    """
    return ApplicantApplication.objects.filter(actual=True)


def get_direction_applications(direction_code: str):
    """
    Список заявлений по направлению.
    """
    return (
        get_applications_queryset()
        .filter(direction_code=direction_code)
        .order_by('-avg_score', '-sum_score', 'student_name')
    )


def get_direction_stats():
    """
    Статистика по каждому направлению.

    Заявления берём из admissions.
    План и целевой средний балл подтягиваем из programs по коду направления.
    """
    rows = (
        get_applications_queryset()
        .values('direction_code', 'direction_name')
        .annotate(
            total_applications=Count('id'),
            unique_applicants=Count('student_id', distinct=True),

            # Средний балл считаем только по заявлениям с ВПП / высшим приоритетом.
            average_score=Avg(
                'avg_score',
                filter=Q(top_priority=True),
            ),
            average_sum_score=Avg(
                'sum_score',
                filter=Q(top_priority=True),
            ),

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

        admission_plan = program.admission_plan if program else 0
        target_avg_score = program.target_avg_score if program else 0.0

        total_applications = row['total_applications'] or 0

        if admission_plan > 0:
            plan_fill_percent = total_applications / admission_plan * 100
        else:
            plan_fill_percent = 0.0

        result.append({
            'direction_code': direction_code,
            'direction_name': row['direction_name'] or (program.name if program else ''),
            'admission_plan': admission_plan,
            'target_avg_score': round_float(target_avg_score, digits=2, default=0.0),
            'total_applications': total_applications,
            'unique_applicants': row['unique_applicants'] or 0,
            'average_score': round_float(row['average_score'], digits=2, default=None),
            'average_sum_score': round_float(
                row['average_sum_score'],
                digits=2,
                default=None,
            ),
            'no_exams_count': row['no_exams_count'] or 0,
            'approvals_count': row['approvals_count'] or 0,
            'top_priority_count': row['top_priority_count'] or 0,
            'high_priority_no_original_count': (
                row['high_priority_no_original_count'] or 0
            ),
            'plan_fill_percent': round_float(
                plan_fill_percent,
                digits=2,
                default=0.0,
            ),
        })

    return result


def get_university_stats():
    """
    Общая статистика по всем загруженным заявлениям.
    """
    queryset = get_applications_queryset()

    base_stats = queryset.aggregate(
        total_applications=Count('id'),
        unique_applicants=Count('student_id', distinct=True),
        directions_count=Count('direction_code', distinct=True),
        average_score=Avg('avg_score'),
        no_exams_count=Count('id', filter=Q(no_exams=True)),
        approvals_count=Count('id', filter=Q(approval=True)),
        top_priority_count=Count('id', filter=Q(top_priority=True)),
    )

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
        'average_score': round_float(
            base_stats['average_score'],
            digits=2,
            default=None,
        ),
        'no_exams_count': base_stats['no_exams_count'] or 0,
        'approvals_count': base_stats['approvals_count'] or 0,
        'top_priority_count': base_stats['top_priority_count'] or 0,
        'by_level_education': by_level_education,
        'by_status_vuz': by_status_vuz,
    }
