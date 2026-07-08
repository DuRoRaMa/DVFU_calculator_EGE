import json
import xml.etree.ElementTree as ET

import requests
from django.conf import settings
from requests.auth import HTTPBasicAuth

from apps.core.exceptions import ImportParseError, ImportSourceError
from apps.imports.models import ImportSettings


class AdmissionDataSource:
    def fetch(self) -> list[dict]:
        raise NotImplementedError


class LocalJsonAdmissionDataSource(AdmissionDataSource):
    def fetch(self) -> list[dict]:
        local_path = settings.BASE_DIR / 'data' / 'applicants.json'

        try:
            with local_path.open('r', encoding='utf-8') as file:
                data = json.load(file)
        except FileNotFoundError as error:
            raise ImportSourceError(
                f'Локальный файл импорта не найден: {local_path}'
            ) from error
        except json.JSONDecodeError as error:
            raise ImportParseError(
                f'Ошибка разбора локального JSON: {error}'
            ) from error

        return normalize_response_to_list(data)


class SoapAdmissionDataSource(AdmissionDataSource):
    """
    Источник данных 1С.

    Важно:
    - если soap_action заполнен, считаем источник классическим SOAP и делаем POST;
    - если soap_action пустой, считаем источник HTTP-сервисом 1С и делаем GET.

    Для адреса вида:
    http://10.110.21.11/bit_pk/hs/dvfu_exchange/v1/statement

    нужен именно GET.
    """

    def __init__(self, settings_obj: ImportSettings):
        self.settings_obj = settings_obj

    def fetch(self) -> list[dict]:
        if not self.settings_obj.service_url:
            raise ImportSourceError('Не указан адрес сервиса импорта')

        if self.settings_obj.soap_action:
            return self._fetch_soap_post()

        return self._fetch_http_get()

    def _get_auth(self):
        if self.settings_obj.service_login or self.settings_obj.service_password:
            return HTTPBasicAuth(
                self.settings_obj.service_login,
                self.settings_obj.service_password,
            )

        return None

    def _fetch_http_get(self) -> list[dict]:
        headers = {
            'Accept': 'application/json, text/plain, */*',
        }

        try:
            response = requests.get(
                self.settings_obj.service_url,
                headers=headers,
                auth=self._get_auth(),
                timeout=self.settings_obj.soap_timeout_seconds,
                verify=self.settings_obj.verify_ssl,
            )
            response.raise_for_status()
        except requests.RequestException as error:
            raise ImportSourceError(
                f'Ошибка запроса к HTTP-сервису 1С: {error}'
            ) from error

        return self._parse_response(response.text)

    def _fetch_soap_post(self) -> list[dict]:
        headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': self.settings_obj.soap_action,
        }

        try:
            response = requests.post(
                self.settings_obj.service_url,
                data=self._build_request_body().encode('utf-8'),
                headers=headers,
                auth=self._get_auth(),
                timeout=self.settings_obj.soap_timeout_seconds,
                verify=self.settings_obj.verify_ssl,
            )
            response.raise_for_status()
        except requests.RequestException as error:
            raise ImportSourceError(
                f'Ошибка запроса к SOAP-сервису: {error}'
            ) from error

        return self._parse_response(response.text)

    def _build_request_body(self) -> str:
        return """<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <!-- TODO: вставить реальный SOAP-метод, если источник будет настоящим SOAP -->
  </soap:Body>
</soap:Envelope>"""

    def _parse_response(self, response_text: str) -> list[dict]:
        text = (response_text or '').strip()

        if not text:
            raise ImportParseError('Сервис импорта вернул пустой ответ.')

        # 1. Сначала пробуем разобрать ответ как обычный JSON.
        try:
            data = json.loads(text)
            return normalize_response_to_list(data)
        except json.JSONDecodeError:
            pass

        # 2. Если это не JSON, пробуем разобрать как XML,
        # внутри которого может лежать JSON.
        try:
            root = ET.fromstring(text)
        except ET.ParseError as error:
            preview = text[:500]
            raise ImportParseError(
                'Ответ сервиса не является ни JSON, ни корректным XML. '
                f'Начало ответа: {preview}'
            ) from error

        json_payload = None

        for element in root.iter():
            element_text = (element.text or '').strip()

            if element_text.startswith('[') or element_text.startswith('{'):
                json_payload = element_text
                break

        if not json_payload:
            raise ImportParseError(
                'В XML-ответе не найден JSON с абитуриентами.'
            )

        try:
            data = json.loads(json_payload)
        except json.JSONDecodeError as error:
            raise ImportParseError(
                f'Ошибка разбора JSON внутри XML-ответа: {error}'
            ) from error

        return normalize_response_to_list(data)


def normalize_response_to_list(data) -> list[dict]:
    """
    Приводит разные варианты ответа источника к list[dict].

    Поддерживает:
    - [ {...}, {...} ]
    - { "Applicants": [ ... ] }
    - { "items": [ ... ] }
    - { "data": [ ... ] }
    - { "Result": [ ... ] }
    - { "result": [ ... ] }
    - { "statements": [ ... ] }
    - { "Statement": [ ... ] }
    """

    if isinstance(data, list):
        if not all(isinstance(item, dict) for item in data):
            raise ImportParseError(
                'JSON-список должен содержать объекты заявлений.'
            )

        return data

    if isinstance(data, dict):
        for key in (
            'Applicants',
            'applicants',
            'items',
            'data',
            'Result',
            'result',
            'statements',
            'Statements',
            'Statement',
            'statement',
        ):
            value = data.get(key)

            if isinstance(value, list):
                if not all(isinstance(item, dict) for item in value):
                    raise ImportParseError(
                        f'Поле {key} должно содержать список объектов заявлений.'
                    )

                return value

    raise ImportParseError(
        'Ответ сервиса не удалось привести к списку заявлений.'
    )


def get_admission_source(settings_obj: ImportSettings | None = None) -> AdmissionDataSource:
    if settings_obj is None:
        settings_obj, _ = ImportSettings.objects.get_or_create(id=1)

    if settings_obj.source_type == ImportSettings.SourceType.SOAP:
        return SoapAdmissionDataSource(settings_obj)

    return LocalJsonAdmissionDataSource()
