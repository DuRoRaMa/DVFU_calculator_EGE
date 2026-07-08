from decimal import Decimal, InvalidOperation


def get_text(value) -> str:
    """
    Безопасно приводит значение к строке.

    None -> ''
    '  текст  ' -> 'текст'
    """
    if value is None:
        return ''

    return str(value).strip()


def normalize_text(value) -> str:
    """
    Нормализует текст для сравнения:

    - убирает лишние пробелы;
    - приводит к нижнему регистру;
    - заменяет ё на е.

    Пример:
    '  ОБЩИЙ   конкурс ' -> 'общий конкурс'
    """
    return ' '.join(
        get_text(value)
        .casefold()
        .replace('ё', 'е')
        .split()
    )


def normalize_upper(value) -> str:
    """
    Нормализует текст и приводит к верхнему регистру.

    Используется для форм экзаменов:
    ЕГЭ, ДВИ, ВИ.
    """
    return get_text(value).upper().replace('Ё', 'Е')


def to_bool(value) -> bool:
    """
    Безопасно приводит значение к bool.

    Поддерживает варианты из JSON/SOAP:
    true, True, 1, '1', 'да', 'yes'.
    """
    if isinstance(value, bool):
        return value

    if isinstance(value, int):
        return value == 1

    return normalize_text(value) in {
        '1',
        'true',
        'yes',
        'y',
        'да',
    }


def to_int(value, default=0):
    """
    Безопасно приводит значение к int.
    """
    try:
        if value is None or value == '':
            return default

        return int(float(value))

    except (TypeError, ValueError):
        return default


def to_float(value, default=0.0):
    """
    Безопасно приводит значение к float.
    """
    try:
        if value is None or value == '':
            return default

        return float(value)

    except (TypeError, ValueError):
        return default


def to_decimal(value, default=None):
    """
    Безопасно приводит значение к Decimal.
    """
    try:
        if value is None or value == '':
            return default

        return Decimal(str(value))

    except (InvalidOperation, TypeError, ValueError):
        return default


def round_float(value, digits=2, default=None):
    """
    Безопасное округление числа.
    """
    if value is None:
        return default

    try:
        return round(float(value), digits)

    except (TypeError, ValueError):
        return default


def unique_preserve_order(values):
    """
    Убирает дубли из списка, сохраняя порядок.
    """
    return list(dict.fromkeys(values or []))


def is_value_in_normalized_list(value, allowed_values) -> bool:
    """
    Проверяет значение по списку с нормализацией.

    Полезно для:
    - уровней образования;
    - статусов;
    - категорий конкурса.
    """
    normalized_value = normalize_text(value)

    normalized_allowed = {
        normalize_text(item)
        for item in allowed_values
    }

    return normalized_value in normalized_allowed