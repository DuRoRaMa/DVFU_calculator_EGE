from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminUserRole
from rest_framework.permissions import IsAuthenticated
from .serializers import (
    ApplicantApplicationSerializer,
    DirectionStatsSerializer,
    UniversityStatsSerializer,
)
from apps.admissions.serializers import VppAverageScoreSnapshotSerializer
from apps.admissions.services.vpp_dynamics import (
    get_direction_vpp_average_dynamics,
    get_university_vpp_average_dynamics,
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

    permission_classes = [IsAuthenticated]

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

class AdminUniversityVppAverageDynamicsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        limit = int(request.query_params.get('limit', 30))

        rows = get_university_vpp_average_dynamics(limit=limit)
        serializer = VppAverageScoreSnapshotSerializer(rows, many=True)

        return Response({
            'scope': 'university',
            'results': serializer.data,
        })


class AdminDirectionVppAverageDynamicsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request, direction_code: str):
        limit = int(request.query_params.get('limit', 30))

        rows = get_direction_vpp_average_dynamics(
            direction_code=direction_code,
            limit=limit,
        )
        serializer = VppAverageScoreSnapshotSerializer(rows, many=True)

        return Response({
            'scope': 'direction',
            'direction_code': direction_code,
            'results': serializer.data,
        })