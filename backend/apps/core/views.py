from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    Проверка доступности backend и БД.

    GET /api/health/
    """

    permission_classes = [AllowAny]

    def get(self, request):
        database_ok = True

        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
                cursor.fetchone()
        except Exception:
            database_ok = False

        status_code = 200 if database_ok else 503

        return Response(
            {
                'status': 'ok' if database_ok else 'error',
                'database': database_ok,
            },
            status=status_code,
        )