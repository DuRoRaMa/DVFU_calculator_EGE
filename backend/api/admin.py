from django.contrib import admin
from .models import Subjects, EducationPrograms, ProgramSubjectRequirements
# Register your models here.


class ProgramRequirementInline(admin.TabularInline):
    model = ProgramSubjectRequirements
    extra = 1
    fields = ("year", "subject_id", "min_score", "is_optional")
    ordering = ("year", "is_optional", "subject_id")


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