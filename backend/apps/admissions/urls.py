from django.urls import path

from .views import (
    DirectionApplicantsView,
    DirectionStatsView,
    UniversityStatsView,
)


urlpatterns = [
    path(
        'directions/stats/',
        DirectionStatsView.as_view(),
        name='direction-stats',
    ),

    path(
        'directions/<str:direction_code>/applicants/',
        DirectionApplicantsView.as_view(),
        name='direction-applicants',
    ),

    path(
        'admin/university-stats/',
        UniversityStatsView.as_view(),
        name='university-stats',
    ),
]