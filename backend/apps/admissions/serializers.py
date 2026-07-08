from rest_framework import serializers

from .models import ApplicantApplication
from apps.admissions.models import VppAverageScoreSnapshot

class ApplicantApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicantApplication
        fields = [
            'id',
            'student_id',
            'student_name',
            'direction_code',
            'direction_name',
            'avg_score',
            'sum_score',
            'no_exams',
            'approval',
            'high_priority_no_original',
            'top_priority',
            'status_vuz',
            'category',
            'level_education',
            'actual',
            'imported_at',
        ]
        read_only_fields = fields


class DirectionStatsSerializer(serializers.Serializer):
    direction_code = serializers.CharField()
    direction_name = serializers.CharField(allow_blank=True)
    admission_plan = serializers.IntegerField()
    target_avg_score = serializers.FloatField()
    total_applications = serializers.IntegerField()
    unique_applicants = serializers.IntegerField()
    average_score = serializers.FloatField(allow_null=True)
    average_sum_score = serializers.FloatField(allow_null=True)
    no_exams_count = serializers.IntegerField()
    approvals_count = serializers.IntegerField()
    top_priority_count = serializers.IntegerField()
    high_priority_no_original_count = serializers.IntegerField()
    plan_fill_percent = serializers.FloatField()
    plan_score_sum = serializers.FloatField()
    plan_sum_score_sum = serializers.FloatField()
    plan_applications_count = serializers.IntegerField()
    plan_missing_count = serializers.IntegerField()
    average_score_by_plan = serializers.FloatField(allow_null=True)
    average_score_by_vpp_count = serializers.FloatField(allow_null=True)

    average_sum_score_by_plan = serializers.FloatField(allow_null=True)
    average_sum_score_by_vpp_count = serializers.FloatField(allow_null=True)

class UniversityStatsSerializer(serializers.Serializer):
    total_applications = serializers.IntegerField()
    unique_applicants = serializers.IntegerField()
    directions_count = serializers.IntegerField()
    average_score = serializers.FloatField(allow_null=True)
    no_exams_count = serializers.IntegerField()
    approvals_count = serializers.IntegerField()
    top_priority_count = serializers.IntegerField()
    by_level_education = serializers.ListField()
    by_status_vuz = serializers.ListField()
    plan_score_sum = serializers.FloatField()
    total_admission_plan = serializers.IntegerField()
    plan_applications_count = serializers.IntegerField()
    plan_missing_count = serializers.IntegerField()
    plan_fill_percent = serializers.FloatField()
    average_score_by_plan = serializers.FloatField(allow_null=True)
    average_score_by_vpp_count = serializers.FloatField(allow_null=True)

    average_sum_score_by_plan = serializers.FloatField(allow_null=True)
    average_sum_score_by_vpp_count = serializers.FloatField(allow_null=True)

class VppAverageScoreSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = VppAverageScoreSnapshot
        fields = [
            'id',
            'scope',
            'direction_code',
            'direction_name',
            'average_score_by_plan',
            'average_score_by_vpp_count',
            'plan_score_sum',
            'admission_plan',
            'plan_applications_count',
            'plan_missing_count',
            'plan_fill_percent',
            'total_applications',
            'approvals_count',
            'top_priority_count',
            'imported_at',
            'created_at',
        ]
