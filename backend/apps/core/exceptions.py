class ProjectError(Exception):
    """
    Базовая ошибка проекта.
    """

    default_message = 'Ошибка выполнения операции.'

    def __init__(self, message=None):
        self.message = message or self.default_message
        super().__init__(self.message)


class ImportSourceError(ProjectError):
    default_message = 'Ошибка получения данных из источника импорта.'


class ImportParseError(ProjectError):
    default_message = 'Ошибка разбора данных импорта.'


class BusinessRuleError(ProjectError):
    default_message = 'Нарушено бизнес-правило.'


class CalculationError(ProjectError):
    default_message = 'Ошибка расчёта.'