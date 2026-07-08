from urllib.parse import urlparse

from rest_framework import serializers

from apps.imports.models import DataImport, ImportSettings


class DataImportSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(
        source='get_status_display',
        read_only=True,
    )

    trigger_label = serializers.CharField(
        source='get_trigger_display',
        read_only=True,
    )

    class Meta:
        model = DataImport
        fields = [
            'id',
            'status',
            'status_label',
            'trigger',
            'trigger_label',
            'scheduled_for',
            'celery_task_id',
            'started_at',
            'finished_at',
            'total_received',
            'total_loaded',
            'error_message',
            'created_at',
        ]


class ImportSettingsSerializer(serializers.ModelSerializer):
    service_url = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )

    service_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    service_password_is_set = serializers.SerializerMethodField()

    update_interval_label = serializers.CharField(
        source='get_update_interval_minutes_display',
        read_only=True,
    )

    source_type_label = serializers.CharField(
        source='get_source_type_display',
        read_only=True,
    )

    class Meta:
        model = ImportSettings
        fields = [
            'source_type',
            'source_type_label',
            'service_url',
            'soap_action',
            'service_login',
            'service_password',
            'service_password_is_set',
            'soap_timeout_seconds',
            'verify_ssl',
            'update_interval_minutes',
            'update_interval_label',
            'is_enabled',
            'updated_at',
        ]
        read_only_fields = [
            'source_type_label',
            'service_password_is_set',
            'update_interval_label',
            'updated_at',
        ]

    def validate_service_url(self, value):
        value = (value or '').strip()

        if not value:
            return value

        parsed = urlparse(value)

        if parsed.scheme not in {'http', 'https'}:
            raise serializers.ValidationError(
                'URL должен начинаться с http:// или https://.'
            )

        if not parsed.netloc:
            raise serializers.ValidationError(
                'URL должен содержать адрес сервера.'
            )

        if ' ' in value:
            raise serializers.ValidationError(
                'URL не должен содержать пробелы.'
            )

        return value

    def get_service_password_is_set(self, obj):
        return bool(obj.service_password)

    def validate_update_interval_minutes(self, value):
        if value not in {30, 60, 180, 1440}:
            raise serializers.ValidationError(
                'Допустимые значения: 30, 60, 180, 1440 минут.'
            )
        return value

    def validate(self, attrs):
        source_type = attrs.get(
            'source_type',
            getattr(self.instance, 'source_type', ImportSettings.SourceType.SOAP),
        )

        is_enabled = attrs.get(
            'is_enabled',
            getattr(self.instance, 'is_enabled', False),
        )

        if source_type == ImportSettings.SourceType.SOAP and is_enabled:
            service_url = attrs.get(
                'service_url',
                getattr(self.instance, 'service_url', ''),
            )
            service_login = attrs.get(
                'service_login',
                getattr(self.instance, 'service_login', ''),
            )
            service_password = attrs.get(
                'service_password',
                getattr(self.instance, 'service_password', ''),
            )

            if not service_url:
                raise serializers.ValidationError({
                    'service_url': 'Для включенного SOAP-автоимпорта нужно указать адрес сервиса.'
                })

            if not service_login:
                raise serializers.ValidationError({
                    'service_login': 'Для включенного SOAP-автоимпорта нужно указать логин.'
                })

            if not service_password:
                raise serializers.ValidationError({
                    'service_password': 'Для включенного SOAP-автоимпорта нужно указать пароль.'
                })

        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop('service_password', None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.service_password = password

        instance.save()
        return instance
