from django.urls import path

from .views import (
    ProgramByCodeView,
    ProgramDetailView,
    ProgramListView,
    SubjectListView,
)


urlpatterns = [
    path(
        'programs/',
        ProgramListView.as_view(),
        name='program-list',
    ),

    path(
        'programs/<int:pk>/',
        ProgramDetailView.as_view(),
        name='program-detail',
    ),

    path(
        'programs/by-code/<str:code>/',
        ProgramByCodeView.as_view(),
        name='program-by-code',
    ),

    path(
        'subjects/',
        SubjectListView.as_view(),
        name='subject-list',
    ),
]