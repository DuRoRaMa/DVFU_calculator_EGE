from django.urls import path

from .views import (
    ImportSettingsView,
    ImportStatusView,
    RunImportView,
    TestImportConnectionView,
)


urlpatterns = [
    path(
        'import/status/',
        ImportStatusView.as_view(),
        name='import-status',
    ),

    path(
        'admin/import/run/',
        RunImportView.as_view(),
        name='run-import',
    ),

    path(
        'admin/import/settings/',
        ImportSettingsView.as_view(),
        name='import-settings',
    ),

    path(
        'admin/import/test-connection/',
        TestImportConnectionView.as_view(),
        name='test-import-connection',
    ),
]