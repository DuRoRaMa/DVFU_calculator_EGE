from rest_framework import serializers
from .models import EducationPrograms


class EducationProgramSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='get_school_display', read_only=True)
    class Meta:
        model = EducationPrograms
        fields = ['id','school_name', 'name', 'code', 'study_form', 
                  'admission_plan', 'target_avg_score', 'status']