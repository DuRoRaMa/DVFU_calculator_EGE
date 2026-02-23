from rest_framework import serializers
from .models import EducationPrograms


class EducationProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationPrograms
        fields = ['id', 'name', 'code', 'study_form', 
                  'admission_plan', 'target_avg_score', 'status']