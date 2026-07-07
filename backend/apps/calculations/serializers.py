from rest_framework import serializers

from apps.admissions.serializers import ApplicantApplicationSerializer
from apps.core.utils import unique_preserve_order


class CalculationRequestSerializer(serializers.Serializer):
    direction_code = serializers.CharField()

    application_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True,
        required=False,
    )

    def to_internal_value(self, data):
        """
        Совместимость со старым frontend.

        Основное поле: application_ids.

        Дополнительно принимаем:
        - selected_application_ids;
        - selected_applicants.
        """
        mutable_data = data.copy()

        if 'application_ids' not in mutable_data:
            if 'selected_application_ids' in mutable_data:
                mutable_data['application_ids'] = mutable_data.get(
                    'selected_application_ids'
                )
            elif 'selected_applicants' in mutable_data:
                mutable_data['application_ids'] = mutable_data.get(
                    'selected_applicants'
                )

        return super().to_internal_value(mutable_data)

    def validate_application_ids(self, value):
        return unique_preserve_order(value)


class ValidateSelectionRequestSerializer(CalculationRequestSerializer):
    pass


class ScenarioCalculationRequestSerializer(serializers.Serializer):
    direction_code = serializers.CharField()

    base_application_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True,
        required=False,
    )

    add_application_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True,
        required=False,
    )

    remove_application_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True,
        required=False,
    )

    def validate(self, attrs):
        attrs['base_application_ids'] = unique_preserve_order(
            attrs.get('base_application_ids') or []
        )
        attrs['add_application_ids'] = unique_preserve_order(
            attrs.get('add_application_ids') or []
        )
        attrs['remove_application_ids'] = unique_preserve_order(
            attrs.get('remove_application_ids') or []
        )

        return attrs


class CalculationResultSerializer(serializers.Serializer):
    direction_code = serializers.CharField()
    direction_name = serializers.CharField(allow_blank=True)
    admission_plan = serializers.IntegerField()
    target_avg_score = serializers.FloatField()

    selected_count = serializers.IntegerField()
    remaining_places = serializers.IntegerField()
    over_plan_count = serializers.IntegerField()
    is_plan_filled = serializers.BooleanField()

    average_score = serializers.FloatField(allow_null=True)
    average_sum_score = serializers.FloatField(allow_null=True)
    target_delta = serializers.FloatField(allow_null=True)
    is_target_reached = serializers.BooleanField()

    no_exams_count = serializers.IntegerField()
    approvals_count = serializers.IntegerField()
    top_priority_count = serializers.IntegerField()
    high_priority_no_original_count = serializers.IntegerField()

    errors = serializers.ListField(
        child=serializers.CharField(),
    )

    selected_applications = ApplicantApplicationSerializer(many=True)


class ValidationResultSerializer(serializers.Serializer):
    is_valid = serializers.BooleanField()

    errors = serializers.ListField(
        child=serializers.CharField(),
    )

    warnings = serializers.ListField(
        child=serializers.CharField(),
    )

    calculation = CalculationResultSerializer(allow_null=True)
