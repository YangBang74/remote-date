# Remote Date

Совместный просмотр и прослушивание в реальном времени: создайте комнату, поделитесь ссылкой — воспроизведение, перемотка и чат синхронизируются у всех участников.

## Возможности

- **YouTube** — комната с видео по ссылке, синхронизация play / pause / seek
- **SoundCloud** — комната с треками, поиск через API, смена трека для всех
- **Чат** в комнате через WebSocket
- **Авторизация** — регистрация, вход, JWT, профиль
- **Счётчик участников** в комнате

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | Vue 3, TypeScript, Vite, Vue Router, Tailwind CSS 4, shadcn-vue |
| Backend | Rust, Axum, WebSocket (`/ws`) |
| Данные | In-memory (MongoDB в `docker-compose` подготовлена, но пока не подключена к бэкенду) |

## Структура репозитория

```
remote-date/
├── front/          # SPA (порт 5173)
├── back-rs/        # API и WebSocket (порт 5001 локально, 5000 в Docker)
└── docker-compose.yml
```

## Требования

- **Node.js** 20+ (для фронтенда)
- **Rust** 1.70+ и **Cargo** (для бэкенда)
- Опционально: **Docker** — MongoDB и фронтенд через Compose

## Быстрый старт (локально)

```bash
make install   # первый раз
make dev       # API (:5001) + фронтенд (:5173)
```

На macOS порт **5000** часто занят AirPlay Receiver — `make dev` использует **5001** по умолчанию.

### 1. Бэкенд

```bash
cd back-rs
```

Создайте `.env` в `back-rs/` (опционально):

```env
PORT=5001
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
# Для поиска треков SoundCloud (обязательно для SoundCloud-комнат)
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id
# MONGO_URL=mongodb://localhost:27017/remote   # пока не используется
```

Запуск:

```bash
cargo run
```

Сервер слушает `http://localhost:5001`. Проверка: `GET http://localhost:5001/api/health` → `OK`.

### 2. Фронтенд

```bash
cd front
npm install
```

Создайте `.env` в `front/` (опционально):

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=ws://localhost:5001/ws
```

Запуск:

```bash
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173). Для доступа к приложению нужна регистрация или вход (`/auth`).

### 3. Использование

1. Войдите в аккаунт.
2. На главной выберите **YouTube** или **SoundCloud**.
3. Создайте комнату (ссылка на видео / ID комнаты) или присоединитесь по ID.
4. Отправьте ссылку на комнату (`/room/:id` или `/sound-room/:id`) другим участникам.

## Docker Compose

Поднимает MongoDB, Rust-бэкенд (`back-rs`) и Vite-фронтенд.

```bash
docker compose up --build
```

После сборки:

- Фронтенд: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- MongoDB: `localhost:27017`

Остановка:

```bash
docker compose down
```

Опционально свой SoundCloud Client ID:

```bash
SOUNDCLOUD_CLIENT_ID=your_id docker compose up --build
```

Переменные `VITE_*` указывают на `localhost`, потому что запросы идут из браузера на хосте, а не из контейнера фронтенда.

## API (кратко)

Базовый префикс: `/api`

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/health` | Проверка живости |
| `POST` | `/auth/register`, `/auth/login`, … | Регистрация и сессия |
| `GET` | `/auth/me` | Текущий пользователь (JWT) |
| `POST` | `/rooms` | Создать комнату |
| `GET` | `/rooms/:id` | Данные комнаты |
| `GET` | `/soundcloud/search?q=…` | Поиск треков |
| `GET` | `/chat/…` | Сообщения чата |

**WebSocket:** `ws://localhost:5000/ws` — события комнаты, видео/аудио и чат (формат JSON с полем `event`).

## Скрипты фронтенда

```bash
npm run dev      # dev-сервер
npm run build    # production-сборка
npm run preview  # просмотр сборки
npm run check    # проверка TypeScript
```

## Переменные окружения

### Backend (`back-rs`)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `5001` (локально) / `5000` (Docker) | HTTP-порт |
| `JWT_SECRET` | dev-строка | Секрет для JWT |
| `JWT_EXPIRES_IN` | `7d` | Срок жизни токена |
| `SOUNDCLOUD_CLIENT_ID` | — | Client ID SoundCloud API |
| `MONGO_URL` | — | Зарезервировано; без неё — только память |

### Frontend (`front`)

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `VITE_API_URL` | `http://localhost:5001/api` | REST API |
| `VITE_SOCKET_URL` | `ws://localhost:5001/ws` | WebSocket |

## Маршруты приложения

| Путь | Назначение |
|------|------------|
| `/` | Главная (YouTube / SoundCloud) |
| `/youtube`, `/soundcloud` | Создание и вход в комнату |
| `/room/:id` | YouTube-комната |
| `/sound-room/:id` | SoundCloud-комната |
| `/profile` | Профиль |
| `/auth` | Вход и регистрация |

## Ограничения и заметки

- Данные пользователей, комнат и чата хранятся **в памяти** — после перезапуска бэкенда они сбрасываются.
- Для production смените `JWT_SECRET` и не коммитьте секреты в репозиторий.
- `socket.io-client` в зависимостях фронта остаётся для совместимости; реальное соединение — нативный **WebSocket**.

## Лицензия

Уточните лицензию при публикации репозитория.
