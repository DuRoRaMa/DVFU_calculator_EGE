from rest_framework import serializers

from .models import (
    EducationPrograms,
    ImportSettings,
    DataImport,
)


class EducationProgramSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='get_school_display', read_only=True)

    class Meta:
        model = EducationPrograms
        fields = [
            'id',
            'school_name',
            'name',
            'code',
            'study_form',
            'admission_plan',
            'target_avg_score',
            'status',
        ]


class ImportSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportSettings
        fields = [
            'update_interval_minutes',
            'is_enabled',
        ]


class DataImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataImport
        fields = [
            'status',
            'started_at',
            'finished_at',
            'total_loaded',
            'error_message',
        ]
