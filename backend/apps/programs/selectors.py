from .models import EducationProgram, Subject


def get_active_programs_queryset():
    return (
        EducationProgram.objects
        .filter(status=EducationProgram.Status.ACTIVE)
        .prefetch_related(
            'subject_requirements',
            'subject_requirements__subject',
        )
        .order_by('code', 'name')
    )


def get_all_programs_queryset():
    return (
        EducationProgram.objects
        .all()
        .prefetch_related(
            'subject_requirements',
            'subject_requirements__subject',
        )
        .order_by('code', 'name')
    )


def get_program_by_id(program_id: int):
    return (
        EducationProgram.objects
        .prefetch_related(
            'subject_requirements',
            'subject_requirements__subject',
        )
        .filter(id=program_id)
        .first()
    )


def get_program_by_code(code: str):
    return (
        EducationProgram.objects
        .prefetch_related(
            'subject_requirements',
            'subject_requirements__subject',
        )
        .filter(code=code)
        .first()
    )


def get_subjects_queryset():
    return Subject.objects.order_by('name')