from rest_framework.permissions import BasePermission


class IsAdminUserRole(BasePermission):
    """
    Доступ только для администратора приложения.

    В проекте администратор — это пользователь,
    у которого is_staff=True или is_superuser=True.
    """

    message = 'Доступ разрешён только администратору.'

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or user.is_superuser)
        )