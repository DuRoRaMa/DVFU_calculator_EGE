from statistics import mean

from apps.admissions.models import ApplicantApplication
from apps.core.utils import round_float, unique_preserve_order
from apps.programs.models import EducationProgram


def get_program_by_code(direction_code: str):
    return EducationProgram.objects.filter(code=direction_code).first()


def get_applications_by_ids(application_ids: list[int]):
    return ApplicantApplication.objects.filter(
        id__in=application_ids,
        actual=True,
    )


def get_direction_applications(direction_code: str):
    return ApplicantApplication.objects.filter(
        direction_code=direction_code,
        actual=True,
    )


def build_selection(direction_code: str, application_ids: list[int]):
    """
    Возвращает:
    - список выбранных заявлений по направлению;
    - список ошибок.
    """

    errors = []

    if not direction_code:
        return [], ['Не указан код направления.']

    application_ids = unique_preserve_order(application_ids)

    if not application_ids:
        return [], []

    requested_ids = set(application_ids)

    all_found_applications = list(
        get_applications_by_ids(application_ids)
    )

    found_ids = {
        application.id
        for application in all_found_applications
    }

    missing_ids = sorted(requested_ids - found_ids)

    if missing_ids:
        errors.append(
            f'Не найдены заявления с ID: {", ".join(map(str, missing_ids))}.'
        )

    wrong_direction_applications = [
        application
        for application in all_found_applications
        if application.direction_code != direction_code
    ]

    if wrong_direction_applications:
        wrong_ids = [
            str(application.id)
            for application in wrong_direction_applications
        ]

        errors.append(
            'Часть заявлений относится к другому направлению: '
            + ', '.join(wrong_ids)
            + '.'
        )

    selected_applications = [
        application
        for application in all_found_applications
        if application.direction_code == direction_code
    ]

    selected_applications.sort(
        key=lambda application: (
            -application.avg_score,
            -application.sum_score,
            application.student_name,
        )
    )

    return selected_applications, errors


def calculate_selection(direction_code: str, application_ids: list[int]) -> dict:
    program = get_program_by_code(direction_code)

    selected_applications, errors = build_selection(
        direction_code=direction_code,
        application_ids=application_ids,
    )

    if program:
        admission_plan = program.admission_plan
        target_avg_score = float(program.target_avg_score)
        direction_name = program.name
    else:
        admission_plan = 0
        target_avg_score = 0.0
        direction_name = (
            selected_applications[0].direction_name
            if selected_applications
            else ''
        )
        errors.append(
            'Направление не найдено в справочнике образовательных программ.'
        )

    selected_count = len(selected_applications)

    if selected_applications:
        average_score = round_float(
            mean(application.avg_score for application in selected_applications),
            digits=2,
            default=None,
        )
        average_sum_score = round_float(
            mean(application.sum_score for application in selected_applications),
            digits=2,
            default=None,
        )
    else:
        average_score = None
        average_sum_score = None

    if admission_plan > 0:
        remaining_places = max(admission_plan - selected_count, 0)
        over_plan_count = max(selected_count - admission_plan, 0)
        is_plan_filled = selected_count >= admission_plan
    else:
        remaining_places = 0
        over_plan_count = 0
        is_plan_filled = False

    if average_score is not None:
        target_delta = round_float(
            average_score - target_avg_score,
            digits=2,
            default=None,
        )
        is_target_reached = average_score >= target_avg_score
    else:
        target_delta = None
        is_target_reached = False

    no_exams_count = sum(
        1
        for application in selected_applications
        if application.no_exams
    )

    approvals_count = sum(
        1
        for application in selected_applications
        if application.approval
    )

    top_priority_count = sum(
        1
        for application in selected_applications
        if application.top_priority
    )

    high_priority_no_original_count = sum(
        1
        for application in selected_applications
        if application.high_priority_no_original
    )

    if admission_plan > 0 and selected_count > admission_plan:
        errors.append(
            f'Выбрано заявлений больше плана приема: '
            f'{selected_count} из {admission_plan}.'
        )

    return {
        'direction_code': direction_code,
        'direction_name': direction_name,
        'admission_plan': admission_plan,
        'target_avg_score': round_float(
            target_avg_score,
            digits=2,
            default=0.0,
        ),

        'selected_count': selected_count,
        'remaining_places': remaining_places,
        'over_plan_count': over_plan_count,
        'is_plan_filled': is_plan_filled,

        'average_score': average_score,
        'average_sum_score': average_sum_score,
        'target_delta': target_delta,
        'is_target_reached': is_target_reached,

        'no_exams_count': no_exams_count,
        'approvals_count': approvals_count,
        'top_priority_count': top_priority_count,
        'high_priority_no_original_count': high_priority_no_original_count,

        'errors': errors,
        'selected_applications': selected_applications,
    }


def validate_selection(direction_code: str, application_ids: list[int]) -> dict:
    calculation = calculate_selection(
        direction_code=direction_code,
        application_ids=application_ids,
    )

    errors = list(calculation['errors'])
    warnings = []

    selected_count = calculation['selected_count']
    admission_plan = calculation['admission_plan']
    average_score = calculation['average_score']
    target_avg_score = calculation['target_avg_score']

    if admission_plan > 0 and selected_count < admission_plan:
        warnings.append(
            f'План приема не заполнен: выбрано {selected_count} из {admission_plan}.'
        )

    if average_score is not None and average_score < target_avg_score:
        warnings.append(
            f'Средний балл ниже целевого: {average_score} < {target_avg_score}.'
        )

    return {
        'is_valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'calculation': calculation,
    }


def calculate_scenario(
    direction_code: str,
    base_application_ids: list[int],
    add_application_ids: list[int],
    remove_application_ids: list[int],
) -> dict:
    """
    Сценарий:
    - есть базовый набор заявлений;
    - часть заявлений добавляем;
    - часть удаляем;
    - возвращаем новый расчет.
    """

    base_application_ids = unique_preserve_order(base_application_ids)
    add_application_ids = unique_preserve_order(add_application_ids)
    remove_application_ids = unique_preserve_order(remove_application_ids)

    final_ids = list(base_application_ids)

    for application_id in remove_application_ids:
        if application_id in final_ids:
            final_ids.remove(application_id)

    for application_id in add_application_ids:
        if application_id not in final_ids:
            final_ids.append(application_id)

    return calculate_selection(
        direction_code=direction_code,
        application_ids=final_ids,
    )
