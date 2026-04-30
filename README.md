# AutoLableServer

`AutoLableServer` is an Express-based community API server for the random dance generator project.

## Current Status

The server is now suitable for single-instance deployment with the following constraints:

- Bearer-token authentication only
- Private collections require authenticated ownership
- Session and auth responses return sanitized user data only
- Public community cards are available through `/api/cards/public`
- `.env` is loaded automatically for direct Node.js and PM2 starts

This project still uses JSON files for persistence. That is acceptable for low-volume, single-instance deployment, but it is not suitable for multi-instance production.

## Requirements

- Node.js 18+
- npm 9+

## Quick Start

```bash
npm install
cp .env.example .env
npm start
```

Health check:

```bash
curl http://localhost:8787/api/health
```

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP port | `8787` |
| `SESSION_TTL_MS` | Session lifetime in milliseconds | `604800000` |
| `CORS_ORIGIN` | Allowed origins, comma-separated. Use `*` only for development. | `*` |

Notes:

- `CORS_ORIGIN=*` allows any origin and disables credentialed CORS.
- For browser clients in production, set explicit origins such as `https://app.example.com`.

## Data Storage

Runtime data is stored under the `data/` directory:

- `data/data.json`
- `data/sessions.json`

Back up that directory if you deploy this server.

## API Overview

### Health

```text
GET /api/health
```

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
```

### Personal Cards

```text
GET    /api/cards
POST   /api/cards
PATCH  /api/cards/:id
DELETE /api/cards/:id
POST   /api/cards/:id/publish
POST   /api/cards/:id/unpublish
```

### Public Community Cards

```text
GET  /api/cards/public
POST /api/cards/:id/like
POST /api/card-favorites/:cardId
GET  /api/my/liked-cards
GET  /api/my/card-favorites
GET  /api/categories
GET  /api/categories/:id/cards
```

### Tags

```text
GET    /api/tags
GET    /api/tags/my
GET    /api/tags/my/favorites
POST   /api/tags
PATCH  /api/tags/:id
POST   /api/tags/favorites/:id
```

### Collections

```text
GET    /api/collections
GET    /api/collections/public
GET    /api/collections/:id
POST   /api/collections
PATCH  /api/collections/:id
DELETE /api/collections/:id
```

### Bilibili Proxy

```text
GET /api/bili/cover?bvid=...
```

### Compatibility Routes

`/api/published` is still available for existing clients that use the separate published-card model. The recommended public browsing entry for current deployments is `/api/cards/public`.

## Deployment

### Direct Node.js

```bash
npm install --production
cp .env.example .env
npm start
```

### PM2

```bash
npm install --production
cp .env.example .env
pm2 start index.js --name auto-label-server
pm2 save
```

### Docker Compose

```bash
docker compose up -d --build
docker compose logs -f
```

The compose file persists runtime state via:

```text
./data -> /app/data
```

### Build Release Package

```bash
npm run package:release
```

This creates a versioned zip under `release/` and includes the one-click deploy scripts `deploy.sh` and `deploy.bat`.

## Recommended Production Settings

Example `.env`:

```env
NODE_ENV=production
PORT=8787
SESSION_TTL_MS=604800000
CORS_ORIGIN=https://app.example.com
```

Recommended fronting:

- Nginx or Caddy reverse proxy
- HTTPS termination on `80/443`
- Single instance only while using JSON storage

## Security Notes

- Authentication accepts Bearer tokens only.
- `x-user-id` is not accepted as an auth shortcut.
- Private collections are not readable without the owning user's token.
- Auth responses do not expose password hashes or salts.

## Minimal Verification

Register:

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test-user","password":"pass1234"}'
```

Login:

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test-user","password":"pass1234"}'
```

Public cards:

```bash
curl http://localhost:8787/api/cards/public
```

## Limitations

- JSON storage has no transaction support
- Not suitable for horizontal scaling
- Sessions are file-backed and local to one instance

If you need higher write volume or multi-instance deployment, migrate the storage layer to a real database before scaling out.
