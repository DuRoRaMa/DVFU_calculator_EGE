from rest_framework.response import Response


def success_response(data=None, message='Операция выполнена успешно.', status=200):
    payload = {
        'ok': True,
        'message': message,
        'data': data,
    }

    return Response(payload, status=status)


def error_response(message='Ошибка выполнения операции.', errors=None, status=400):
    payload = {
        'ok': False,
        'message': message,
        'errors': errors or [],
    }

    return Response(payload, status=status)