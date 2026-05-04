# DVFU Calculator EGE

Веб-приложение для работы с конкурсными списками приёмной комиссии ДВФУ: мониторинг заявлений, расчёт среднего балла по направлениям подготовки и построение рекомендаций по распределению абитуриентов по категориям баллов.

Проект состоит из Django REST API, React-интерфейса и PostgreSQL. Для разработки используется `docker-compose.yml`, для production-запуска без HTTPS — `docker-compose.prod.yml`.

## Возможности

- авторизация пользователей через JWT;
- просмотр направлений подготовки с фильтрацией по школе/институту;
- расчёт среднего балла выбранного списка абитуриентов;
- проверка превышения плана набора;
- сценарный расчёт при добавлении и удалении абитуриентов;
- мониторинг направлений: количество заявлений, согласий, высших приоритетов и средний балл;
- просмотр списка абитуриентов по направлению;
- ручной и автоматический импорт данных;
- административная статистика по университету;
- модуль рекомендаций RE_01–RE_05;
- production-сборка через Docker, Nginx и Gunicorn;
- Jenkins pipeline для проверки и деплоя.

## Модуль рекомендаций

Модуль рекомендаций строит варианты распределения абитуриентов по фиксированным категориям баллов:

| Категория | Значение по умолчанию |
|---|---:|
| 90–100 | 95 |
| 80–89 | 85 |
| 70–79 | 75 |
| 60–69 | 65 |
| 0–59 | 50 |

В текущей реализации категории фиксированы, но медианные планки можно менять в интерфейсе. Для расчёта используется только медиана категории.

Поле `Заблокировано` означает фиксированное количество абитуриентов в категории. Например, если для категории `90–100` указано `2`, то во всех вариантах рекомендаций в этой категории останутся 2 человека, а их вклад в средний балл будет считаться по медианной планке категории.

Доступны три методики расчёта:

| Методика | Код | Логика сортировки |
|---|---|---|
| По целевому среднему баллу | `target` | выбираются варианты с минимальным отклонением от целевого среднего балла |
| Сбалансированная по категориям | `balanced` | сначала учитывается близость к цели, затем более равномерное распределение по категориям |
| Максимизация среднего балла | `max_score` | выше ставятся варианты с максимальным итоговым средним баллом |

Алгоритм перебирает допустимые распределения по незаблокированным категориям, рассчитывает итоговый средний балл и возвращает до 20 лучших вариантов.

## Текущие ограничения

- средний балл берётся из готового поля `avg_score`, а не пересчитывается по отдельным предметам;
- проверка минимальных баллов по предметам и требований направления пока не включена в расчёт;
- расширенная отчётность по диапазонам баллов, отклонениям от цели и сортировкам требует отдельной доработки;
- полный CRUD по направлениям, предметам, минимальным и целевым баллам пока выполняется через Django admin или требует доработки интерфейса;
- production-конфигурация рассчитана на HTTP. HTTPS можно добавить позже через reverse proxy, например Nginx или Traefik, и сертификаты.

## Стек технологий

### Backend

- Python 3.11
- Django 5.2
- Django REST Framework
- Simple JWT
- PostgreSQL
- pandas / numpy для обработки импортируемых данных
- Gunicorn для production-запуска

### Frontend

- React
- React Router
- Material UI
- Axios
- XLSX для клиентского Excel-экспорта
- Nginx для production-сборки

### DevOps

- Docker
- Docker Compose
- Jenkins

## Структура проекта

```text
DVFU_calculator_EGE/
├── backend/
│   ├── api/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── recommendation_engine.py
│   │   ├── services/
│   │   └── tests/
│   ├── back_api/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── nginx/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── Jenkinsfile
├── .env.example
└── README.md
```

## Быстрый запуск в Docker

Склонировать репозиторий и перейти в ветку проекта:

```bash
git clone https://github.com/DuRoRaMa/DVFU_calculator_EGE.git
cd DVFU_calculator_EGE
git checkout auth
```

Запустить сервисы разработки:

```bash
docker compose up -d --build
```

После запуска будут доступны:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:8000/api`
- Django admin: `http://localhost:8000/admin`
- PostgreSQL: `localhost:5432`

Создать администратора Django:

```bash
docker compose exec backend python manage.py createsuperuser
```

Остановить проект:

```bash
docker compose down
```

Остановить проект и удалить volumes с данными БД:

```bash
docker compose down -v
```

## Production-запуск без HTTPS

Создать `.env` из примера:

```bash
cp .env.example .env
```

Минимально нужно изменить значения:

```env
DB_NAME=pgdb
DB_USER=secret_user
DB_PASSWORD=change_me_strong_password
DJANGO_SECRET_KEY=change_me_django_secret_key
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend,your-domain.example
DJANGO_CORS_ALLOW_ALL=0
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost
```

Запустить production-сборку:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

В production frontend отдаётся через Nginx на `http://localhost`, а запросы к API проксируются по пути `/api/`.

Остановить production-контур:

```bash
docker compose -f docker-compose.prod.yml down
```

## Локальный запуск без Docker

### Backend

Для локального запуска backend нужен работающий PostgreSQL.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Переменные окружения для подключения к базе данных:

```env
DB_NAME=pgdb
DB_USER=secret_user
DB_PASSWORD=very_secret_password
DB_HOST=localhost
DB_PORT=5432
DJANGO_DEBUG=1
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Для локальной разработки можно создать файл `frontend/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

## Основные API endpoints

| Метод | URL | Назначение |
|---|---|---|
| `POST` | `/api/token/` | получение JWT-токенов |
| `POST` | `/api/token/refresh/` | обновление access-токена |
| `GET` | `/api/me/` | информация о текущем пользователе |
| `GET` | `/api/programs/` | список активных направлений |
| `GET` | `/api/programs/<id>/` | детальная информация о направлении |
| `POST` | `/api/calculate/` | расчёт среднего балла выбранного списка |
| `POST` | `/api/calculate/scenario/` | сценарный расчёт изменений |
| `POST` | `/api/validate-selection/` | проверка выбранного списка по плану набора |
| `POST` | `/api/recommendations/` | расчёт рекомендаций RE_01–RE_05 |
| `GET` | `/api/directions/stats/` | статистика по направлениям |
| `GET` | `/api/directions/<direction_code>/applicants/` | список абитуриентов направления |
| `GET` | `/api/import/status/` | статус последнего импорта |
| `GET` | `/api/admin/university-stats/` | административная статистика по университету |
| `POST` | `/api/admin/import/run/` | ручной запуск импорта |
| `GET/PATCH` | `/api/admin/import/settings/` | просмотр и изменение настроек импорта |

## Пример запроса рекомендаций

```http
POST /api/recommendations/
Content-Type: application/json
Authorization: Bearer <access_token>
```

```json
{
  "program_id": 1,
  "admission_plan": 30,
  "target_avg_score": 82.5,
  "score_type": "median",
  "calculation_method": "target",
  "categories": [
    { "id": "90_100", "median": 95, "locked_count": 2 },
    { "id": "80_89", "median": 85, "locked_count": 0 },
    { "id": "70_79", "median": 75, "locked_count": 0 },
    { "id": "60_69", "median": 65, "locked_count": 0 },
    { "id": "0_59", "median": 50, "locked_count": 0 }
  ],
  "max_results": 20
}
```

В ответе возвращаются:

- целевой средний балл;
- план набора;
- выбранная методика;
- количество проверенных комбинаций;
- список лучших распределений;
- итоговый средний балл каждого варианта;
- отклонение от цели;
- распределение по категориям.

## Импорт данных

В backend предусмотрен сервис импорта заявлений абитуриентов и отдельный scheduler-контейнер. Интервал автоматического обновления хранится в настройках импорта и может изменяться администратором.

Ручной запуск импорта доступен через административный endpoint:

```bash
POST /api/admin/import/run/
```

Статус последнего импорта можно получить через:

```bash
GET /api/import/status/
```

## Jenkins CI/CD

В корне проекта находится `Jenkinsfile`. Pipeline выполняет:

1. checkout репозитория;
2. сборку backend-контейнера;
3. проверку backend через `python manage.py check`;
4. сборку frontend-контейнера;
5. production build frontend через `npm run build`;
6. сборку production-образов;
7. деплой через `docker compose -f docker-compose.prod.yml up -d --build` для веток `auth`, `main` и `master`.

На Jenkins-агенте должны быть установлены Docker и Docker Compose. Пользователь Jenkins должен иметь доступ к Docker daemon.

## Тестирование

Проверка Django-проекта:

```bash
docker compose run --rm backend python manage.py check
```

Сборка frontend:

```bash
docker compose run --rm frontend npm run build
```

Для модульных тестов `recommendation_engine.py` используется `pytest`. Если `pytest` не установлен, его можно поставить отдельно в окружение разработки:

```bash
cd backend
pip install pytest
pytest api/tests/test_recommendation_engine.py
```

## Работа с интерфейсом

1. Открыть `http://localhost:3000`.
2. Авторизоваться.
3. Выбрать направление подготовки.
4. Для ручного расчёта нажать `Расчёт`.
5. Для подбора распределения нажать `Рекомендации`.
6. На странице рекомендаций указать план набора, целевой средний балл, методику расчёта, медианные планки и заблокированные категории.
7. Нажать `Получить рекомендации`.

## Дальнейшее развитие

- подключить расчёт среднего балла по предметам и правилам направления;
- добавить проверку минимальных баллов по предметам;
- расширить отчётность по диапазонам, сортировкам и отклонениям;
- добавить полноценный CRUD-интерфейс администратора;
- подключить модель машинного обучения на исторических данных зачисления за 4–5 лет;
- добавить HTTPS и доменную production-конфигурацию.

## Подключение ML-модели в будущем

Исторические списки зачисленных можно использовать для обучения модели прогноза вероятности зачисления или прогноза проходного/целевого среднего балла. Практичный вариант интеграции:

1. оставить текущий rule-based модуль рекомендаций как базовый и объяснимый;
2. подготовить датасет по годам, направлениям, планам набора, категориям, средним баллам, приоритетам, согласиям и факту зачисления;
3. обучить модель отдельно;
4. добавить backend-сервис, который возвращает прогнозы для направлений;
5. использовать прогноз как дополнительный критерий сортировки рекомендаций.

Такой подход позволит не ломать текущую логику RE_01–RE_05 и постепенно добавить ML как отдельный слой улучшения рекомендаций.
