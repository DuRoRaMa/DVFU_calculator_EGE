from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    RecommendationRequestSerializer,
    RecommendationResponseSerializer,
)


class RecommendationsView(APIView):
    """
    Заглушка режима рекомендаций.

    POST /api/recommendations/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_serializer = RecommendationRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        response_data = {
            'enabled': False,
            'message': (
                'Режим рекомендаций временно отключён. '
                'Сейчас доступны импорт, просмотр заявлений и ручные расчёты.'
            ),
            'recommendations': [],
        }

        response_serializer = RecommendationResponseSerializer(response_data)

        return Response(response_serializer.data)