from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'is_staff',
            'is_superuser',
            'role',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        full_name = obj.get_full_name().strip()

        if full_name:
            return full_name

        return obj.username

    def get_role(self, obj):
        if obj.is_superuser:
            return 'superadmin'

        if obj.is_staff:
            return 'admin'

        return 'user'


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Логин по username/password.
    В ответе возвращаем access, refresh и данные пользователя.
    """

    def validate(self, attrs):
        data = super().validate(attrs)

        data['user'] = UserSerializer(self.user).data

        return data