from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminUserListView,
    CurrentUserView,
    CustomTokenObtainPairView,
)


urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    path('me/', CurrentUserView.as_view(), name='current-user'),

    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
]