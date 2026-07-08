from django.contrib import admin

from .models import (
    EducationProgram,
    ProgramSubjectRequirement,
    Subject,
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
    )

    list_filter = (
        'school',
        'education_level',
        'study_form',
        'status',
    )

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