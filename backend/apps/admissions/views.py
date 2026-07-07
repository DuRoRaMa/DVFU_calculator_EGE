from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminUserRole

from .serializers import (
    ApplicantApplicationSerializer,
    DirectionStatsSerializer,
    UniversityStatsSerializer,
)
from .selectors import (
    get_direction_applications,
    get_direction_stats,
    get_university_stats,
)


class DirectionStatsView(APIView):
    """
    Статистика по направлениям.

    GET /api/directions/stats/
    """

    permission_classes = [IsAdminUserRole]

    def get(self, request):
        stats = get_direction_stats()
        serializer = DirectionStatsSerializer(stats, many=True)

        return Response(serializer.data)


class DirectionApplicantsView(APIView):
    """
    Список заявлений по конкретному направлению.

    GET /api/directions/<direction_code>/applicants/
    """

    permission_classes = [IsAdminUserRole]

    def get(self, request, direction_code):
        applications = get_direction_applications(direction_code)
        serializer = ApplicantApplicationSerializer(applications, many=True)

        return Response(serializer.data)


class UniversityStatsView(APIView):
    """
    Общая статистика по университету.

    GET /api/admin/university-stats/
    """

    permission_classes = [IsAdminUserRole]

    def get(self, request):
        stats = get_university_stats()
        serializer = UniversityStatsSerializer(stats)

        return Response(serializer.data)