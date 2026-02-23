#!/usr/bin/env python3
"""
Скрипт для загрузки данных из внешнего API (REST/GET) с Basic-аутентификацией
и сохранения в файл для анализа структуры.
Использование: python fetch_external_data.py
"""

import requests
import sys
import os
from requests.auth import HTTPBasicAuth

def fetch_and_save(url, username, password, output_file):
    """
    Выполняет GET-запрос с Basic-аутентификацией и сохраняет ответ в файл.
    """
    try:
        # stream=True позволяет читать ответ по частям, не загружая всё в память
        with requests.get(url, auth=HTTPBasicAuth(username, password), stream=True) as response:
            response.raise_for_status()  # выбросит исключение при HTTP-ошибке

            # Информация о заголовках
            content_type = response.headers.get('content-type', 'unknown')
            print(f"Content-Type: {content_type}")
            print(f"HTTP Status: {response.status_code}")
            print(f"Encoding: {response.encoding}")

            # Сохраняем содержимое в файл
            with open(output_file, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            file_size = os.path.getsize(output_file)
            print(f"Сохранено в {output_file} ({file_size} байт)")

            # Покажем начало файла (первые 500 символов) для определения структуры
            print("\n--- Начало файла (первые 500 символов) ---")
            with open(output_file, 'r', encoding='utf-8', errors='ignore') as f:
                preview = f.read(500)
            print(preview)
            print("--- Конец preview ---")

    except requests.exceptions.RequestException as e:
        print(f"Ошибка при запросе: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Неожиданная ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=== Загрузка данных из внешнего API ===")
    url = input("Введите URL: ").strip()
    username = input("Имя пользователя (Basic Auth): ").strip()
    password = input("Пароль: ").strip()
    default_out = "response.dat"
    output = input(f"Имя файла для сохранения (Enter = {default_out}): ").strip()
    if not output:
        output = default_out

    fetch_and_save(url, username, password, output)