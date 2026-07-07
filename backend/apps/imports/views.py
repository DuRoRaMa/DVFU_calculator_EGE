from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminUserRole
from apps.imports.models import DataImport, ImportSettings
from apps.imports.serializers import (
    DataImportSerializer,
    ImportSettingsSerializer,
)
from apps.imports.services.admission_source import get_admission_source
from apps.imports.tasks import enqueue_manual_import


class ImportStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        last_import = DataImport.objects.order_by('-created_at').first()

        if not last_import:
            return Response({
                'status': 'never',
                'message': 'Импорт ещё не выполнялся',
            })

        serializer = DataImportSerializer(last_import)

        return Response(serializer.data)


class RunImportView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        import_log, error = enqueue_manual_import()

        if error:
            return Response(
                {
                    'status': DataImport.Status.RUNNING,
                    'message': error,
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {
                'status': DataImport.Status.PENDING,
                'message': 'Импорт поставлен в очередь',
                'import_id': import_log.id,
                'task_id': import_log.celery_task_id,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class ImportSettingsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get_object(self):
        settings_obj, _ = ImportSettings.objects.get_or_create(id=1)
        return settings_obj

    def get(self, request):
        serializer = ImportSettingsSerializer(self.get_object())

        return Response(serializer.data)

    def patch(self, request):
        settings_obj = self.get_object()

        serializer = ImportSettingsSerializer(
            settings_obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class TestImportConnectionView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        settings_obj, _ = ImportSettings.objects.get_or_create(id=1)

        try:
            source = get_admission_source(settings_obj)
            items = source.fetch()

            return Response({
                'ok': True,
                'message': 'Подключение выполнено успешно',
                'items_count': len(items),
                'sample_keys': list(items[0].keys()) if items else [],
            })

        except Exception as error:
            return Response(
                {
                    'ok': False,
                    'message': str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )