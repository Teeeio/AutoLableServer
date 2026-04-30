# AutoLableServer Quick Start

## Windows

```powershell
cd F:\设计\快速项目\AutoLableServer
copy .env.example .env
npm install
npm start
```

## Linux / macOS

```bash
cd /path/to/AutoLableServer
cp .env.example .env
npm install
npm start
```

## Docker Compose

```bash
cd /path/to/AutoLableServer
docker compose up -d --build
```

## Verify

```bash
curl http://localhost:8787/api/health
```

Expected response:

```json
{"ok":true}
```

## Important Notes

- `.env` is loaded automatically on startup.
- Runtime data is stored in `data/data.json` and `data/sessions.json`.
- For production, replace `CORS_ORIGIN=*` with your frontend origin.
