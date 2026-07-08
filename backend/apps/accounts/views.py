from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from django.contrib.auth.models import User

from .permissions import IsAdminUserRole
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Авторизация пользователя.

    POST /api/token/
    body:
    {
        "username": "admin",
        "password": "password"
    }
    """

    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(APIView):
    """
    Информация о текущем пользователе.

    GET /api/me/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)

        return Response(serializer.data)


class AdminUserListView(ListAPIView):
    """
    Список пользователей для администратора.

    Нужен не обязательно, но полезен для проверки,
    кто является обычным пользователем, а кто администратором.

    GET /api/admin/users/
    """

    permission_classes = [IsAdminUserRole]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.order_by('id')