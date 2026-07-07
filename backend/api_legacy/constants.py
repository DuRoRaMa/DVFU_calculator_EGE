from pathlib import Path
from django.conf import settings

ADMISSION_LOCAL_JSON_PATH = Path(settings.BASE_DIR) / "data" / "applicants.json"

ALLOWED_LEVEL_EDUCATION = [
    "Бакалавриат/Специалитет",
    "БВО (Заглушка)",
]

SPECIAL_DIRECTIONS_KEYWORDS = [
    "Дизайн",
    "Архитектура",
    "Физическая культура",
    "Журналистика",
]

EXCLUDED_STATUS_VUZ = {
    "Неуд",
    "Отклонено",
    "Отозвано поступающим",
    "Забрал документы"
}

GENERAL_COMPETITION_CATEGORY = "Общий конкурс"