from django.contrib import admin
from django.urls import path

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.views import (
    ProgramListView,
    ProgramDetailView,
    CalculateView,
    RecommendationsView,
    ValidateSelectionView,
    ScenarioCalculateView,
    ProtectedView,
    DirectionStatsView,
    DirectionApplicantsView,
    UniversityStatsView,
    ImportStatusView,
    RunImportView,
    ImportSettingsView,
    UserInfoView,
)


urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/programs/', ProgramListView.as_view(), name='program-list'),
    path('api/programs/<int:pk>/', ProgramDetailView.as_view(), name='program-detail'),

    path('api/directions/stats/', DirectionStatsView.as_view(), name='direction-stats'),
    path(
        'api/directions/<str:direction_code>/applicants/',
        DirectionApplicantsView.as_view(),
        name='direction-applicants',
    ),

    path('api/admin/university-stats/', UniversityStatsView.as_view(), name='university-stats'),

    path('api/import/status/', ImportStatusView.as_view(), name='import-status'),
    path('api/admin/import/run/', RunImportView.as_view(), name='run-import'),
    path('api/admin/import/settings/', ImportSettingsView.as_view(), name='import-settings'),

    path('api/calculate/', CalculateView.as_view(), name='calculate'),
    path('api/calculate/scenario/', ScenarioCalculateView.as_view(), name='calculate-scenario'),
    path('api/validate-selection/', ValidateSelectionView.as_view(), name='validate-selection'),
    path('api/recommendations/', RecommendationsView.as_view(), name='recommendations'),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/protected/', ProtectedView.as_view(), name='protected'),
    path('api/me/', UserInfoView.as_view(), name='user-info'),
]