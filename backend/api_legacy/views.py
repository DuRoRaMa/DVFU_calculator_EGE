from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    ApplicantApplication,
    DataImport,
    EducationPrograms,
    ImportSettings,
)
from .recommendation_engine import (
    RecommendationValidationError,
    build_recommendations,
)
from .serializers import (
    DataImportSerializer,
    EducationProgramSerializer,
    ImportSettingsSerializer,
)
from .services.import_service import import_applicants


class ProgramListView(generics.ListAPIView):
    queryset = EducationPrograms.objects.filter(status='Активно').order_by('code')
    serializer_class = EducationProgramSerializer


class ProgramDetailView(generics.RetrieveAPIView):
    queryset = EducationPrograms.objects.all()
    serializer_class = EducationProgramSerializer


class DirectionStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        grouped_data = (
            ApplicantApplication.objects
            .filter(actual=True)
            .values('direction_code', 'direction_name')
            .annotate(
                applicants_count=Count('id'),
                approval_count=Count('id', filter=Q(approval=True)),
                top_priority_count=Count('id', filter=Q(top_priority=True)),
                high_priority_no_original_count=Count(
                    'id',
                    filter=Q(high_priority_no_original=True),
                ),
                top_priority_score_sum=Sum(
                    'avg_score',
                    filter=Q(top_priority=True),
                ),
            )
            .order_by('direction_code', 'direction_name')
        )

        programs_by_code = {
            program.code: program
            for program in EducationPrograms.objects.all()
        }

        result = []
        for item in grouped_data:
            program = programs_by_code.get(item['direction_code'])
            admission_plan = program.admission_plan if program else 0

            if admission_plan > 0:
                avg_score = round(
                    (item['top_priority_score_sum'] or 0) / admission_plan,
                    2,
                )
            else:
                avg_score = 0

            result.append({
                'direction_code': item['direction_code'],
                'direction_name': item['direction_name'],
                'avg_score': avg_score,
                'admission_plan': admission_plan,
                'applicants_count': item['applicants_count'],
                'approval_count': item['approval_count'],
                'top_priority_count': item['top_priority_count'],
                'high_priority_no_original_count': item['high_priority_no_original_count'],
            })

        return Response(result)


class DirectionApplicantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, direction_code):
        applicants = (
            ApplicantApplication.objects
            .filter(actual=True, direction_code=direction_code)
            .order_by('-avg_score', 'student_name')
        )

        result = [
            {
                'student_id': applicant.student_id,
                'student_name': applicant.student_name,
                'avg_score': applicant.avg_score,
                'sum_score': applicant.sum_score,
                'no_exams': applicant.no_exams,
                'approval': applicant.approval,
                'top_priority': applicant.top_priority,
                'high_priority_no_original': applicant.high_priority_no_original,
                'status_vuz': applicant.status_vuz,
            }
            for applicant in applicants
        ]

        return Response(result)


class UniversityStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        top_priority_score_sum = (
            ApplicantApplication.objects
            .filter(actual=True, top_priority=True)
            .aggregate(value=Sum('avg_score'))['value']
            or 0
        )
        total_admission_plan = (
            EducationPrograms.objects
            .filter(status='Активно')
            .aggregate(value=Sum('admission_plan'))['value']
            or 0
        )

        if total_admission_plan > 0:
            avg_score = round(top_priority_score_sum / total_admission_plan, 2)
        else:
            avg_score = 0

        return Response({
            'avg_score': avg_score,
            'applicants_count': ApplicantApplication.objects.filter(
                actual=True,
                top_priority=True,
            ).count(),
            'admission_plan': total_admission_plan,
        })


class ImportStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        last_import = DataImport.objects.order_by('-started_at').first()

        if not last_import:
            return Response({
                'status': 'not_started',
                'is_updating': False,
                'message': 'Обновление еще не запускалось',
                'loaded': 0,
            })

        data = DataImportSerializer(last_import).data
        data['is_updating'] = last_import.status == DataImport.Status.RUNNING
        data['loaded'] = last_import.total_loaded

        if last_import.status == DataImport.Status.RUNNING:
            data['message'] = 'Идет обновление данных'
        elif last_import.status == DataImport.Status.SUCCESS:
            data['message'] = f'Последнее обновление успешно. Загружено записей: {last_import.total_loaded}'
        elif last_import.status == DataImport.Status.FAILED:
            data['message'] = last_import.error_message or 'При обновлении произошла ошибка'
        else:
            data['message'] = ''

        return Response(data)


class RunImportView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            result = import_applicants()
            return Response(result)
        except Exception as error:
            return Response(
                {
                    'status': DataImport.Status.FAILED,
                    'message': str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ImportSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        settings_obj, _ = ImportSettings.objects.get_or_create(id=1)
        return Response(ImportSettingsSerializer(settings_obj).data)

    def patch(self, request):
        settings_obj, _ = ImportSettings.objects.get_or_create(id=1)
        serializer = ImportSettingsSerializer(
            settings_obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CalculateView(APIView):
    def post(self, request):
        program_id = request.data.get('program_id')
        applicants = request.data.get('applicants', [])

        if not program_id or not applicants:
            return Response(
                {'error': 'Необходимо указать program_id и список applicants'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        program = get_object_or_404(EducationPrograms, id=program_id)
        admission_plan = program.admission_plan

        if len(applicants) > admission_plan:
            return Response({
                'error': (
                    f'Выборка превышает план приёма. '
                    f'Выбрано: {len(applicants)}, доступно: {admission_plan}'
                ),
                'error_code': 'EXCEEDS_ADMISSION_PLAN',
            }, status=status.HTTP_400_BAD_REQUEST)

        valid_applicants = []
        invalid_applicants = []

        for idx, applicant in enumerate(applicants):
            if 'id' not in applicant or 'avg_score' not in applicant:
                invalid_applicants.append({
                    'index': idx,
                    'applicant_id': applicant.get('id', 'unknown'),
                    'reason': 'Отсутствует id или avg_score',
                })
                continue

            try:
                avg_score = float(applicant['avg_score'])
                if not (0 <= avg_score <= 100):
                    invalid_applicants.append({
                        'index': idx,
                        'applicant_id': applicant['id'],
                        'reason': (
                            f'Некорректное значение avg_score: {avg_score}. '
                            'Должно быть от 0 до 100'
                        ),
                    })
                    continue
            except (ValueError, TypeError):
                invalid_applicants.append({
                    'index': idx,
                    'applicant_id': applicant['id'],
                    'reason': (
                        'Невозможно преобразовать avg_score в число: '
                        f'{applicant["avg_score"]}'
                    ),
                })
                continue

            valid_applicants.append({
                'id': applicant['id'],
                'avg_score': avg_score,
                'study_form': applicant.get('study_form'),
            })

        if valid_applicants:
            total_score = sum(applicant['avg_score'] for applicant in valid_applicants)
            calculated_avg = total_score / len(valid_applicants)
        else:
            calculated_avg = 0.0

        applicants_details = []
        valid_ids = {applicant['id'] for applicant in valid_applicants}
        for applicant in applicants:
            is_valid = applicant.get('id') in valid_ids
            applicants_details.append({
                'id': applicant.get('id'),
                'avg_score': applicant.get('avg_score'),
                'study_form': applicant.get('study_form'),
                'status': 'valid' if is_valid else 'invalid',
            })

        response_data = {
            'program': {
                'id': program.id,
                'name': program.name,
                'code': program.code,
                'admission_plan': admission_plan,
                'target_avg_score': program.target_avg_score,
            },
            'statistics': {
                'total_received': len(applicants),
                'valid_applicants': len(valid_applicants),
                'invalid_applicants': len(invalid_applicants),
                'available_slots': max(0, admission_plan - len(applicants)),
                'selection_utilization': f'{len(applicants)}/{admission_plan}',
                'selection_percentage': (
                    round((len(applicants) / admission_plan) * 100, 1)
                    if admission_plan > 0
                    else 0
                ),
            },
            'calculation': {
                'calculated_avg_score': round(calculated_avg, 2),
                'target_avg_score': program.target_avg_score,
                'deviation_from_target': round(
                    calculated_avg - program.target_avg_score,
                    2,
                ),
                'is_above_target': calculated_avg > program.target_avg_score,
            },
            'invalid_applicants_details': invalid_applicants,
            'applicants': applicants_details,
        }

        return Response(response_data)


class RecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        program_id = request.data.get('program_id')
        if not program_id:
            return Response(
                {'error': 'Необходимо указать program_id'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        program = get_object_or_404(EducationPrograms, id=program_id)
        payload = dict(request.data)
        payload.setdefault('admission_plan', program.admission_plan)
        payload.setdefault('target_avg_score', program.target_avg_score)

        try:
            result = build_recommendations(payload, program=program)
        except RecommendationValidationError as error:
            return Response(
                {
                    'error': str(error),
                    'error_code': 'INVALID_RECOMMENDATION_INPUT',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'program': {
                'id': program.id,
                'name': program.name,
                'code': program.code,
                'admission_plan': program.admission_plan,
                'target_avg_score': program.target_avg_score,
            },
            **result,
        })


class ValidateSelectionView(APIView):
    def post(self, request):
        program_id = request.data.get('program_id')
        applicants = request.data.get('applicants', [])

        if not program_id:
            return Response(
                {'error': 'Необходимо указать program_id'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        program = get_object_or_404(EducationPrograms, id=program_id)
        is_valid = len(applicants) <= program.admission_plan
        available_slots = max(0, program.admission_plan - len(applicants))

        return Response({
            'is_valid': is_valid,
            'program': {
                'id': program.id,
                'name': program.name,
                'admission_plan': program.admission_plan,
            },
            'selection': {
                'count': len(applicants),
                'available_slots': available_slots,
                'is_within_plan': is_valid,
            },
            'message': (
                f'Можно добавить ещё {available_slots} абитуриентов'
                if is_valid
                else f'Превышен план приёма на {len(applicants) - program.admission_plan}'
            ),
        })


class ScenarioCalculateView(APIView):
    def post(self, request):
        program_id = request.data.get('program_id')
        base_applicants = request.data.get('base_applicants', [])
        changes = request.data.get('changes', [])

        if not program_id:
            return Response(
                {'error': 'Необходимо указать program_id'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        program = get_object_or_404(EducationPrograms, id=program_id)
        calculate_view = CalculateView()

        try:
            base_response = calculate_view.post(
                type('Request', (), {
                    'data': {
                        'program_id': program_id,
                        'applicants': base_applicants,
                    },
                })()
            )
            base_data = base_response.data
        except Exception as error:
            return Response({
                'error': f'Ошибка при расчете базового сценария: {str(error)}',
            }, status=status.HTTP_400_BAD_REQUEST)

        applicants = base_applicants.copy()
        applied_changes = []

        for change in changes:
            action = change.get('action')

            if action == 'add':
                applicant = change.get('applicant')
                if applicant and applicant.get('id'):
                    existing_ids = [item.get('id') for item in applicants]
                    if applicant['id'] in existing_ids:
                        applied_changes.append({
                            'action': 'add',
                            'applicant_id': applicant.get('id'),
                            'status': 'rejected',
                            'reason': 'Абитуриент уже в списке',
                        })
                        continue

                    applicants.append(applicant)
                    applied_changes.append({
                        'action': 'add',
                        'applicant_id': applicant.get('id'),
                        'status': 'applied',
                    })

            elif action == 'remove':
                applicant_id = change.get('applicant_id')
                if not applicant_id:
                    continue

                before_count = len(applicants)
                applicants = [
                    applicant
                    for applicant in applicants
                    if applicant.get('id') != applicant_id
                ]

                if len(applicants) < before_count:
                    applied_changes.append({
                        'action': 'remove',
                        'applicant_id': applicant_id,
                        'status': 'applied',
                    })
                else:
                    applied_changes.append({
                        'action': 'remove',
                        'applicant_id': applicant_id,
                        'status': 'rejected',
                        'reason': 'Абитуриент не найден в списке',
                    })

        try:
            scenario_response = calculate_view.post(
                type('Request', (), {
                    'data': {
                        'program_id': program_id,
                        'applicants': applicants,
                    },
                })()
            )
            scenario_data = scenario_response.data
        except Exception as error:
            return Response({
                'error': f'Ошибка при расчете нового сценария: {str(error)}',
            }, status=status.HTTP_400_BAD_REQUEST)

        before_avg = base_data['calculation']['calculated_avg_score']
        after_avg = scenario_data['calculation']['calculated_avg_score']

        return Response({
            'scenario_info': {
                'program_id': program.id,
                'program_name': program.name,
                'base_applicants_count': len(base_applicants),
                'final_applicants_count': len(applicants),
                'changes_applied': applied_changes,
                'admission_plan': program.admission_plan,
                'available_slots': program.admission_plan - len(applicants),
            },
            'comparison': {
                'before': {
                    'avg_score': before_avg,
                    'applicants_count': len(base_applicants),
                    'deviation_from_target': base_data['calculation']['deviation_from_target'],
                    'is_above_target': base_data['calculation']['is_above_target'],
                },
                'after': {
                    'avg_score': after_avg,
                    'applicants_count': len(applicants),
                    'deviation_from_target': scenario_data['calculation']['deviation_from_target'],
                    'is_above_target': scenario_data['calculation']['is_above_target'],
                },
                'difference': {
                    'avg_score_delta': round(after_avg - before_avg, 2),
                    'deviation_delta': round(
                        scenario_data['calculation']['deviation_from_target']
                        - base_data['calculation']['deviation_from_target'],
                        2,
                    ),
                    'direction': 'increase' if after_avg > before_avg else 'decrease',
                },
            },
            'base_scenario': base_data,
            'new_scenario': scenario_data,
        })


class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({'message': f'Привет, {user.username}!'})


class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })
