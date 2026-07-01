# s-shoter

Сохраняй скриншоты вкладок на бесконечную доску вместе с контекстом (URL, заголовок, время).

Состоит из трёх частей:
- **`apps/web`** — Next.js: веб-приложение (доска, регистрация/логин) + REST API.
- **`apps/extension`** — Chrome-расширение (MV3): один клик — скриншот текущей вкладки.
- **`packages/db`** — Prisma-схема и клиент (SQLite, локальный файл).
- **`packages/shared`** — общие zod-схемы DTO.

## Требования

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`, либо `corepack enable`)
- Без Docker — база данных это локальный файл SQLite.

## Локальный запуск (веб + API)

1. Установить зависимости:
   ```sh
   pnpm install
   ```
2. Настроить переменные окружения:
   ```sh
   cp packages/db/.env.example packages/db/.env
   cp apps/web/.env.example apps/web/.env
   ```
   В `apps/web/.env` сгенерируй `AUTH_SECRET`:
   ```sh
   openssl rand -base64 32
   ```
   (`DATABASE_URL` для `apps/web` вычисляется автоматически в `next.config.ts` — руками задавать не нужно. Для команд Prisma CLI внутри `packages/db` используется `packages/db/.env`.)
3. Прогнать миграции (создаст `packages/db/dev.db`):
   ```sh
   pnpm db:migrate
   ```
4. Запустить дев-сервер:
   ```sh
   pnpm dev
   ```
   Приложение поднимется на [http://localhost:3000](http://localhost:3000) (или на порту из `next dev`, см. вывод команды). Открой `/register`, чтобы создать аккаунт.

## Загрузка Chrome-расширения

1. Собери расширение:
   ```sh
   pnpm --filter extension build
   ```
   Это создаст `apps/extension/dist`.
2. В Chrome открой `chrome://extensions`.
3. Включи **Режим разработчика** (тумблер в правом верхнем углу).
4. Нажми **Загрузить распакованное расширение** (Load unpacked) и выбери папку `apps/extension/dist`.
5. Открой попап расширения, войди тем же email/паролем, что и в веб-приложении.
6. На любой вкладке нажми «Сохранить скриншот» — скриншот появится на доске в веб-приложении.

> Расширение по умолчанию обращается к `http://localhost:3100` — поменяй `API_BASE_URL` в `apps/extension/src/config.ts`, если веб-приложение запущено на другом порту/хосте, и пересобери расширение.

## Структура и конвенции кода

См. [`SPEC.md`](SPEC.md) (техническое задание) и [`AGENTS.md`](AGENTS.md) (обязательные конвенции дизайн-системы и структуры кода).

## Полезные команды

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | Запустить веб-приложение в dev-режиме |
| `pnpm build` | Собрать веб-приложение для продакшена |
| `pnpm lint` | Lint по всем пакетам |
| `pnpm db:migrate` | Прогнать миграции Prisma (dev) |
| `pnpm db:generate` | Перегенерировать Prisma Client |
| `pnpm --filter extension build` | Собрать Chrome-расширение в `apps/extension/dist` |
