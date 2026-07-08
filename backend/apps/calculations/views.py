from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CalculationRequestSerializer,
    CalculationResultSerializer,
    ScenarioCalculationRequestSerializer,
    ValidateSelectionRequestSerializer,
    ValidationResultSerializer,
)
from .services import (
    calculate_scenario,
    calculate_selection,
    validate_selection,
)


class CalculateView(APIView):
    """
    Расчет по выбранным заявлениям.

    POST /api/calculate/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_serializer = CalculationRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        result = calculate_selection(
            direction_code=request_serializer.validated_data['direction_code'],
            application_ids=request_serializer.validated_data.get('application_ids') or [],
        )

        response_serializer = CalculationResultSerializer(result)

        return Response(response_serializer.data)


class ValidateSelectionView(APIView):
    """
    Проверка выбранного набора заявлений.

    POST /api/validate-selection/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_serializer = ValidateSelectionRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        result = validate_selection(
            direction_code=request_serializer.validated_data['direction_code'],
            application_ids=request_serializer.validated_data.get('application_ids') or [],
        )

        response_serializer = ValidationResultSerializer(result)

        return Response(response_serializer.data)


class ScenarioCalculateView(APIView):
    """
    Расчет сценария добавления/удаления заявлений.

    POST /api/calculate/scenario/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_serializer = ScenarioCalculationRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        result = calculate_scenario(
            direction_code=request_serializer.validated_data['direction_code'],
            base_application_ids=request_serializer.validated_data.get(
                'base_application_ids'
            ) or [],
            add_application_ids=request_serializer.validated_data.get(
                'add_application_ids'
            ) or [],
            remove_application_ids=request_serializer.validated_data.get(
                'remove_application_ids'
            ) or [],
        )

        response_serializer = CalculationResultSerializer(result)

        return Response(response_serializer.data)