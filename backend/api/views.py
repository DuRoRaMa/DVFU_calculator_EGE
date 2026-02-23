from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import EducationPrograms
from .serializers import EducationProgramSerializer
# Create your views here.

class ProgramListView(generics.ListAPIView):
    queryset = EducationPrograms.objects.filter(status='Активно').order_by('code')
    serializer_class = EducationProgramSerializer

class ProgramDetailView(generics.RetrieveAPIView):
    queryset = EducationPrograms.objects.all()
    serializer_class = EducationProgramSerializer


class CalculateView(APIView):
    def post(self, request):
        program_id = request.data.get('program_id')
        applicants = request.data.get('applicants', [])
        
        if not program_id or not applicants:
            return Response(
                {'error': 'Необходимо указать program_id и список applicants'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 1. Получаем программу и план приёма
        program = get_object_or_404(EducationPrograms, id=program_id)
        admission_plan = program.admission_plan
        
        # 2. ПРОВЕРКА: выборка не должна превышать план приёма
        if len(applicants) > admission_plan:
            return Response({
                'error': f'Выборка превышает план приёма. '
                         f'Выбрано: {len(applicants)}, доступно: {admission_plan}',
                'error_code': 'EXCEEDS_ADMISSION_PLAN'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Валидация абитуриентов
        valid_applicants = []
        invalid_applicants = []
        
        for idx, applicant in enumerate(applicants):
            # Проверка обязательных полей
            if 'id' not in applicant or 'avg_score' not in applicant:
                invalid_applicants.append({
                    'index': idx,
                    'applicant_id': applicant.get('id', 'unknown'),
                    'reason': 'Отсутствует id или avg_score'
                })
                continue
            
            # Проверка avg_score
            try:
                avg_score = float(applicant['avg_score'])
                if not (0 <= avg_score <= 100):
                    invalid_applicants.append({
                        'index': idx,
                        'applicant_id': applicant['id'],
                        'reason': f'Некорректное значение avg_score: {avg_score}. Должно быть от 0 до 100'
                    })
                    continue
            except (ValueError, TypeError):
                invalid_applicants.append({
                    'index': idx,
                    'applicant_id': applicant['id'],
                    'reason': f'Невозможно преобразовать avg_score в число: {applicant["avg_score"]}'
                })
                continue
            
            valid_applicants.append({
                'id': applicant['id'],
                'avg_score': avg_score,
                'priority': applicant.get('priority'),
                'study_form': applicant.get('study_form')
            })
        
        # 4. Расчёт по ВСЕЙ валидной выборке
        if valid_applicants:
            total_score = sum(app['avg_score'] for app in valid_applicants)
            calculated_avg = total_score / len(valid_applicants)
        else:
            calculated_avg = 0.0
        
        # 5. Детализация по абитуриентам
        applicants_details = []
        valid_ids = {app['id'] for app in valid_applicants}
        
        for applicant in applicants:
            is_valid = applicant.get('id') in valid_ids
            applicants_details.append({
                'id': applicant.get('id'),
                'avg_score': applicant.get('avg_score'),
                'priority': applicant.get('priority'),
                'study_form': applicant.get('study_form'),
                'status': 'valid' if is_valid else 'invalid'
            })
        
        # 6. Формируем ответ
        response_data = {
            'program': {
                'id': program.id,
                'name': program.name,
                'code': program.code,
                'admission_plan': admission_plan,
                'target_avg_score': program.target_avg_score
            },
            'statistics': {
                'total_received': len(applicants),
                'valid_applicants': len(valid_applicants),
                'invalid_applicants': len(invalid_applicants),
                'available_slots': max(0, admission_plan - len(applicants)),
                'selection_utilization': f"{len(applicants)}/{admission_plan}",
                'selection_percentage': round((len(applicants) / admission_plan) * 100, 1) if admission_plan > 0 else 0
            },
            'calculation': {
                'calculated_avg_score': round(calculated_avg, 2),
                'target_avg_score': program.target_avg_score,
                'deviation_from_target': round(calculated_avg - program.target_avg_score, 2),
                'is_above_target': calculated_avg > program.target_avg_score
            },
            'invalid_applicants_details': invalid_applicants,
            'applicants': applicants_details
        }
        
        return Response(response_data)

class RecommendationsView(APIView):
    def post(self, request):
        return Response({
            'status': 'В разработке',
            'message': 'Модуль рекомендаций будет реализован на следующем этапе'
        })
class ValidateSelectionView(APIView):
    """
    Быстрая проверка выборки перед расчетом
    """
    def post(self, request):
        program_id = request.data.get('program_id')
        applicants = request.data.get('applicants', [])
        
        if not program_id:
            return Response(
                {'error': 'Необходимо указать program_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        program = get_object_or_404(EducationPrograms, id=program_id)
        
        is_valid = len(applicants) <= program.admission_plan
        available_slots = max(0, program.admission_plan - len(applicants))
        
        return Response({
            'is_valid': is_valid,
            'program': {
                'id': program.id,
                'name': program.name,
                'admission_plan': program.admission_plan
            },
            'selection': {
                'count': len(applicants),
                'available_slots': available_slots,
                'is_within_plan': is_valid
            },
            'message': (
                f'Можно добавить ещё {available_slots} абитуриентов'
                if is_valid else
                f'Превышен план приёма на {len(applicants) - program.admission_plan}'
            )
        })


class ScenarioCalculateView(APIView):
    """
    Симулятор "что если"
    """
    def post(self, request):
        program_id = request.data.get('program_id')
        base_applicants = request.data.get('base_applicants', [])
        changes = request.data.get('changes', [])
        
        if not program_id:
            return Response(
                {'error': 'Необходимо указать program_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем программу
        program = get_object_or_404(EducationPrograms, id=program_id)
        
        # 1. Рассчитываем базовый сценарий (до изменений)
        # Создаем фейковый запрос для CalculateView
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        base_request = factory.post('/api/calculate/', {
            'program_id': program_id,
            'applicants': base_applicants
        }, format='json')
        
        calculate_view = CalculateView()
        try:
            base_response = calculate_view.post(base_request)
            base_data = base_response.data
        except Exception as e:
            return Response({
                'error': f'Ошибка при расчете базового сценария: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Применяем изменения
        applicants = base_applicants.copy()
        applied_changes = []
        
        for change in changes:
            action = change.get('action')
            
            if action == 'add':
                applicant = change.get('applicant')
                if applicant and applicant.get('id'):
                    # Проверяем, нет ли уже такого абитуриента
                    existing_ids = [app.get('id') for app in applicants]
                    if applicant['id'] in existing_ids:
                        applied_changes.append({
                            'action': 'add',
                            'applicant_id': applicant.get('id'),
                            'status': 'rejected',
                            'reason': 'Абитуриент уже в списке'
                        })
                        continue
                    
                    applicants.append(applicant)
                    applied_changes.append({
                        'action': 'add',
                        'applicant_id': applicant.get('id'),
                        'status': 'applied'
                    })
            
            elif action == 'remove':
                applicant_id = change.get('applicant_id')
                if not applicant_id:
                    continue
                
                before_count = len(applicants)
                applicants = [app for app in applicants if app.get('id') != applicant_id]
                
                if len(applicants) < before_count:
                    applied_changes.append({
                        'action': 'remove',
                        'applicant_id': applicant_id,
                        'status': 'applied'
                    })
                else:
                    applied_changes.append({
                        'action': 'remove',
                        'applicant_id': applicant_id,
                        'status': 'rejected',
                        'reason': 'Абитуриент не найден в списке'
                    })
        
        # 3. Рассчитываем новый сценарий (после изменений)
        scenario_request = factory.post('/api/calculate/', {
            'program_id': program_id,
            'applicants': applicants
        }, format='json')
        
        try:
            scenario_response = calculate_view.post(scenario_request)
            scenario_data = scenario_response.data
        except Exception as e:
            return Response({
                'error': f'Ошибка при расчете нового сценария: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 4. Формируем сравнение
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
                'available_slots': program.admission_plan - len(applicants)
            },
            'comparison': {
                'before': {
                    'avg_score': before_avg,
                    'applicants_count': len(base_applicants),
                    'deviation_from_target': base_data['calculation']['deviation_from_target'],
                    'is_above_target': base_data['calculation']['is_above_target']
                },
                'after': {
                    'avg_score': after_avg,
                    'applicants_count': len(applicants),
                    'deviation_from_target': scenario_data['calculation']['deviation_from_target'],
                    'is_above_target': scenario_data['calculation']['is_above_target']
                },
                'difference': {
                    'avg_score_delta': round(after_avg - before_avg, 2),
                    'deviation_delta': round(
                        scenario_data['calculation']['deviation_from_target'] - 
                        base_data['calculation']['deviation_from_target'], 2
                    ),
                    'direction': 'increase' if after_avg > before_avg else 'decrease'
                }
            },
            'base_scenario': base_data,
            'new_scenario': scenario_data
        })