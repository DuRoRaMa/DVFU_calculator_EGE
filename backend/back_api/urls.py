"""
URL configuration for back_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import (
    ProgramListView, 
    ProgramDetailView, 
    CalculateView, 
    RecommendationsView,
    ValidateSelectionView,
    ScenarioCalculateView,
    ProtectedView
)
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/programs/', ProgramListView.as_view(), name='program-list'),
    path('api/programs/<int:pk>/', ProgramDetailView.as_view(), name='program-detail'),
    path('api/calculate/', CalculateView.as_view(), name='calculate'),
    path('api/calculate/scenario/', ScenarioCalculateView.as_view(), name='calculate-scenario'),
    path('api/validate-selection/', ValidateSelectionView.as_view(), name='validate-selection'),
    path('api/recommendations/', RecommendationsView.as_view(), name='recommendations'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # refresh token
    path('api/protected/', ProtectedView.as_view(), name='protected'), 
]
