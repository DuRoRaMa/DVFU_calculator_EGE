import json
from api.constants import ADMISSION_LOCAL_JSON_PATH


class AdmissionDataSource:
    def fetch(self) -> list[dict]:
        raise NotImplementedError


class LocalJsonAdmissionDataSource(AdmissionDataSource):
    def fetch(self) -> list[dict]:
        with ADMISSION_LOCAL_JSON_PATH.open('r', encoding='utf-8') as file:
            return json.load(file)


class SoapAdmissionDataSource(AdmissionDataSource):
    def fetch(self) -> list[dict]:
        # Позже сюда добавим SOAP + basic auth.
        raise NotImplementedError('SOAP source is not connected yet')


def get_admission_source() -> AdmissionDataSource:
    # Сейчас источник заменен локальным файлом.
    return LocalJsonAdmissionDataSource()

