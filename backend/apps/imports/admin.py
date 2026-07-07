from django import forms
from django.contrib import admin

from .models import DataImport, ImportSettings


class ImportSettingsAdminForm(forms.ModelForm):
    service_password = forms.CharField(
        label='Пароль SOAP-сервиса',
        required=False,
        widget=forms.PasswordInput(render_value=True),
    )

    class Meta:
        model = ImportSettings
        fields = '__all__'


@admin.register(ImportSettings)
class ImportSettingsAdmin(admin.ModelAdmin):
    form = ImportSettingsAdminForm

    fieldsets = (
        ('Источник данных', {
            'fields': (
                'source_type',
            ),
        }),
        ('SOAP-сервис', {
            'fields': (
                'service_url',
                'soap_action',
                'service_login',
                'service_password',
                'soap_timeout_seconds',
                'verify_ssl',
            ),
        }),
        ('Автоимпорт', {
            'fields': (
                'is_enabled',
                'update_interval_minutes',
            ),
        }),
    )

    list_display = (
        'source_type',
        'service_url',
        'update_interval_minutes',
        'is_enabled',
        'updated_at',
    )

    readonly_fields = (
        'updated_at',
    )

    def has_add_permission(self, request):
        return not ImportSettings.objects.exists()


@admin.register(DataImport)
class DataImportAdmin(admin.ModelAdmin):
    list_display = (
        'status',
        'trigger',
        'scheduled_for',
        'started_at',
        'finished_at',
        'total_received',
        'total_loaded',
    )

    list_filter = (
        'status',
        'trigger',
    )

    search_fields = (
        'celery_task_id',
        'error_message',
    )

    readonly_fields = (
        'status',
        'trigger',
        'scheduled_for',
        'celery_task_id',
        'started_at',
        'finished_at',
        'total_received',
        'total_loaded',
        'error_message',
        'created_at',
    )

    def has_add_permission(self, request):
        return False