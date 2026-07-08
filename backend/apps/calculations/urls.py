from django.urls import path

from .views import (
    CalculateView,
    ScenarioCalculateView,
    ValidateSelectionView,
)


urlpatterns = [
    path(
        'calculate/',
        CalculateView.as_view(),
        name='calculate',
    ),

    path(
        'validate-selection/',
        ValidateSelectionView.as_view(),
        name='validate-selection',
    ),

    path(
        'calculate/scenario/',
        ScenarioCalculateView.as_view(),
        name='calculate-scenario',
    ),
]