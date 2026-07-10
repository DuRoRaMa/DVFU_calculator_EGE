from django.urls import path

from .views import (
    DirectionApplicantsView,
    DirectionStatsView,
    UniversityStatsView,
    AdminDirectionVppAverageDynamicsView,
    AdminUniversityVppAverageDynamicsView,
    PriorityDirectionStatsView,
    PublicDirectionMonitoringView,
    NewModelDirectionStatsView
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
    path(
        'admin/vpp-average-dynamics/university/',
        AdminUniversityVppAverageDynamicsView.as_view(),
        name='admin-university-vpp-average-dynamics',
    ),
    path(
        'admin/vpp-average-dynamics/directions/<str:direction_code>/',
        AdminDirectionVppAverageDynamicsView.as_view(),
        name='admin-direction-vpp-average-dynamics',
    ),
    path(
        'admin/priority-direction-stats/',
        PriorityDirectionStatsView.as_view(),
        name='admin-priority-direction-stats',
    ),
    path(
        'directions/monitoring/',
        PublicDirectionMonitoringView.as_view(),
        name='public-direction-monitoring',
    ),
    path(
        'admin/new-model-direction-stats/',
        NewModelDirectionStatsView.as_view(),
        name='admin-new-model-direction-stats',
    ),
]