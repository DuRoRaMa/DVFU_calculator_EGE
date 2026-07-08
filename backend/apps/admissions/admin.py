from django.contrib import admin

from .models import ApplicantApplication


@admin.register(ApplicantApplication)
class ApplicantApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'student_id',
        'student_name',
        'direction_code',
        'avg_score',
        'sum_score',
        'no_exams',
        'approval',
        'top_priority',
        'category',
        'level_education',
        'status_vuz',
        'imported_at',
    )

    list_filter = (
        'direction_code',
        'category',
        'level_education',
        'status_vuz',
        'no_exams',
        'approval',
        'top_priority',
        'actual',
    )

    search_fields = (
        'student_id',
        'student_name',
        'direction_code',
        'direction_name',
    )

    readonly_fields = (
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
    )

    ordering = (
        'direction_code',
        '-avg_score',
    )

    def has_add_permission(self, request):
        return False