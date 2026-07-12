from django.contrib import admin

from .models import (
    EducationProgram,
    ProgramSubjectRequirement,
    Subject,
    PriorityTarget
)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'code',
    )

    search_fields = (
        'name',
        'code',
    )

    ordering = (
        'name',
    )


class ProgramSubjectRequirementInline(admin.TabularInline):
    model = ProgramSubjectRequirement
    extra = 0
    autocomplete_fields = (
        'subject',
    )

    fields = (
        'subject',
        'min_score',
        'year',
        'is_optional',
    )


@admin.register(EducationProgram)
class EducationProgramAdmin(admin.ModelAdmin):
    list_display = (
        'code',
        'name',
        'school',
        'education_level',
        'study_form',
        'admission_plan',
        'target_avg_score',
        'status',
        'updated_at',
        'is_priority_2030',
        'is_op_admission',
        'is_new_model',
    )

    list_filter = (
        'school',
        'education_level',
        'study_form',
        'status',
        'is_priority_2030',
        'is_op_admission',
        'is_new_model',
    )
    list_editable = [
        'is_priority_2030',
        'is_op_admission',
        'is_new_model',
        'target_avg_score',
    ]

    search_fields = (
        'code',
        'name',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    inlines = [
        ProgramSubjectRequirementInline,
    ]

    ordering = (
        'code',
        'name',
    )

@admin.register(PriorityTarget)
class PriorityTargetAdmin(admin.ModelAdmin):
    list_display = [
        'target_type',
        'ugsn_code',
        'ugsn_name',
        'target_avg_score',
        'is_active',
        'updated_at',
    ]

    list_filter = [
        'target_type',
        'is_active',
    ]

    list_editable = [
        'target_avg_score',
        'is_active',
    ]

    search_fields = [
        'ugsn_code',
        'ugsn_name',
        'comment',
    ]

    fieldsets = (
        (
            'Основное',
            {
                'fields': (
                    'target_type',
                    'ugsn_code',
                    'ugsn_name',
                    'target_avg_score',
                    'is_active',
                )
            },
        ),
        (
            'Комментарий',
            {
                'fields': (
                    'comment',
                )
            },
        ),
    )

@admin.register(ProgramSubjectRequirement)
class ProgramSubjectRequirementAdmin(admin.ModelAdmin):
    list_display = (
        'program',
        'subject',
        'min_score',
        'year',
        'is_optional',
    )

    list_filter = (
        'year',
        'is_optional',
        'subject',
    )

    search_fields = (
        'program__code',
        'program__name',
        'subject__name',
        'subject__code',
    )

    autocomplete_fields = (
        'program',
        'subject',
    )