from rest_framework import serializers

from .models import (
    EducationProgram,
    ProgramSubjectRequirement,
    Subject,
)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = [
            'id',
            'name',
            'code',
        ]
        read_only_fields = fields


class ProgramSubjectRequirementSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)

    class Meta:
        model = ProgramSubjectRequirement
        fields = [
            'id',
            'subject',
            'min_score',
            'year',
            'is_optional',
        ]
        read_only_fields = fields


class EducationProgramShortSerializer(serializers.ModelSerializer):
    school_label = serializers.CharField(
        source='get_school_display',
        read_only=True,
    )

    education_level_label = serializers.CharField(
        source='get_education_level_display',
        read_only=True,
    )

    study_form_label = serializers.CharField(
        source='get_study_form_display',
        read_only=True,
    )

    status_label = serializers.CharField(
        source='get_status_display',
        read_only=True,
    )

    class Meta:
        model = EducationProgram
        fields = [
            'id',
            'code',
            'name',
            'school',
            'school_label',
            'education_level',
            'education_level_label',
            'study_form',
            'study_form_label',
            'admission_plan',
            'target_avg_score',
            'status',
            'status_label',
            'is_new_model',
        ]
        read_only_fields = fields


class EducationProgramSerializer(EducationProgramShortSerializer):
    subject_requirements = ProgramSubjectRequirementSerializer(
        many=True,
        read_only=True,
    )

    class Meta(EducationProgramShortSerializer.Meta):
        fields = EducationProgramShortSerializer.Meta.fields + [
            'subject_requirements',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields