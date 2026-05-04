from django.contrib import admin

from .models import (
    Subjects,
    EducationPrograms,
    ProgramSubjectRequirements,
    ImportSettings,
    DataImport,
    ApplicantApplication,
)


class ProgramRequirementInline(admin.TabularInline):
    model = ProgramSubjectRequirements
    extra = 1
    fields = ('year', 'subject_id', 'min_score', 'is_optional')
    ordering = ('year', 'is_optional', 'subject_id')


@admin.register(EducationPrograms)
class EducationProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'admission_plan', 'target_avg_score', 'status')
    list_filter = ('study_form', 'status')
    search_fields = ('name', 'code')
    inlines = [ProgramRequirementInline]


@admin.register(Subjects)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name',)


@admin.register(ImportSettings)
class ImportSettingsAdmin(admin.ModelAdmin):
    list_display = ('update_interval_minutes', 'is_enabled')


@admin.register(DataImport)
class DataImportAdmin(admin.ModelAdmin):
    list_display = ('status', 'started_at', 'finished_at', 'total_loaded')
    list_filter = ('status',)
    search_fields = ('error_message',)
    readonly_fields = ('status', 'started_at', 'finished_at', 'total_loaded', 'error_message')


@admin.register(ApplicantApplication)
class ApplicantApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'student_name',
        'direction_code',
        'avg_score',
        'approval',
        'top_priority',
        'high_priority_no_original',
        'status_vuz',
    )
    list_filter = (
        'approval',
        'top_priority',
        'high_priority_no_original',
        'status_vuz',
        'category',
        'level_education',
    )
    search_fields = (
        'student_name',
        'student_id',
        'direction_code',
        'direction_name',
    )
