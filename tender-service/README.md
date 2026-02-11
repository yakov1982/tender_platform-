# Система тендерных закупок предприятия

Клиент-серверный сервис для управления тендерными закупками с интерфейсами для пользователей и администратора.

**Интеграция с License_key_server** — поддержка лицензирования системы.

## Технологии

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Frontend**: React, TypeScript, Vite

## Запуск

### Backend

```bash
cd tender-service/backend
pip install -r requirements.txt
python -m scripts.init_admin   # Создать первого админа (admin@company.local / admin123)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd tender-service/frontend
npm install
npm run dev
```

Сервис будет доступен по адресу http://localhost:3000

## Функциональность

### Для пользователей
- Регистрация и вход
- Просмотр каталога тендеров
- Подача заявок на тендеры в статусе «Приём заявок»
- Просмотр своих заявок и их статусов

### Для администратора
- Создание и редактирование тендеров
- Публикация тендеров (перевод из черновика в приём заявок)
- Просмотр и управление заявками (принять/отклонить)
- Управление пользователями (блокировка/разблокировка)
- Регистрация новых администраторов

## API

Документация API: http://localhost:8000/docs

## Учётные данные по умолчанию

После запуска `init_admin`:
- **Email**: admin@example.com
- **Пароль**: admin123

## Интеграция лицензирования (License_key_server)

Система поддерживает проверку лицензии через [License_key_server](https://github.com/yakov1982/License_key_server).

### Настройка

1. Запустите сервер лицензий (на другом порту, т.к. тендерная система использует 8000):
   ```bash
   cd License_key_server
   pip install -r requirements.txt
   uvicorn server.main:app --host 0.0.0.0 --port 8001
   ```

2. В админ-интерфейсе License_key_server (http://localhost:8001) создайте продукт **TenderSystem** и сгенерируйте лицензию.

3. Настройте переменные окружения для тендерной системы:
   ```bash
   export LICENSE_SERVER_URL=http://localhost:8001
   export LICENSE_PRODUCT_NAME=TenderSystem
   ```

4. В панели администратора тендерной системы (раздел «Лицензия») введите лицензионный ключ.

Без `LICENSE_SERVER_URL` проверка лицензии отключена (режим разработки).
