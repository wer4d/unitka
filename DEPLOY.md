# Развёртывание «Юнитки» на своём сервере

Сайт не требует базы данных, серверного API или переменных окружения. После сборки это набор статических файлов.

## Вариант 1: Docker Compose

На сервере с установленными Docker и Docker Compose:

```bash
git clone <адрес-вашего-репозитория> unitka
cd unitka
docker compose up -d --build
```

Сайт будет доступен на порту `8080`. Для обновления:

```bash
git pull
docker compose up -d --build
```

Подключите домен через уже установленный на сервере reverse proxy (Nginx, Caddy, Traefik) к `http://127.0.0.1:8080`.

Пример внешнего Nginx:

```nginx
server {
    listen 80;
    server_name unitka.example.ru;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После настройки DNS включите HTTPS через Certbot или панель вашего сервера.

## Вариант 2: без Docker

Соберите сайт на машине с Node.js 22:

```bash
npm ci
npm run build:selfhost
```

Загрузите содержимое каталога `out/` в корневую папку сайта в Nginx, Apache, Caddy или на любой статический хостинг.

## Проверка

```bash
curl -I http://127.0.0.1:8080/
curl http://127.0.0.1:8080/healthz
```

Ожидаемый ответ проверки состояния: `ok`.
