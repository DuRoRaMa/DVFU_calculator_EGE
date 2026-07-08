from rest_framework import serializers


class RecommendationRequestSerializer(serializers.Serializer):
    direction_code = serializers.CharField(required=False, allow_blank=True)
    application_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
    )


class RecommendationResponseSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()
    message = serializers.CharField()
    recommendations = serializers.ListField()