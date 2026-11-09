# WEFT

WEFT — The Thread Co. Bilingual (Arabic / English) online store for hoodies.
Guest checkout with cash on delivery, order tracking by link, and an owner dashboard.

## Stack

| Part | Tech |
|---|---|
| Backend | ASP.NET Core 10 Web API (Controllers) · Clean Architecture · EF Core · SQL Server |
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS |
| Auth | ASP.NET Identity httpOnly cookie (owner only; customers check out as guests) |

## Repository layout

```
WEFT/
├─ backend/                  .NET solution (Weft.slnx)
│  ├─ src/
│  │  ├─ Weft.Domain/          entities, enums, business rules (no dependencies)
│  │  ├─ Weft.Application/     use cases, validation, interfaces
│  │  ├─ Weft.Infrastructure/  EF Core, Identity, image storage
│  │  └─ Weft.Api/             controllers, Program.cs
│  └─ tests/Weft.Tests/
├─ frontend/                 Next.js app (storefront + /admin)
├─ docs/                     API contract, database, backup, OpenAPI
├─ docker-compose.yml        local SQL Server (optional)
└─ .github/workflows/ci.yml  build + test on every push
```

Dependency rule: `Api → Infrastructure → Application → Domain`. Domain references nothing.

## Getting started

Requirements: .NET SDK 10, Node.js 24. Docker Desktop only for a local database or the integration tests.

```bash
# 1. Database: the MonsterASP.NET SQL Server (or a local one: cp .env.example .env, then docker compose up -d)

# 2. Backend  → http://localhost:5055  (health: /health, OpenAPI: /openapi/v1.json)
cd backend
# one-time: secrets stay on your machine, never in git. The script asks for the database password,
# the owner account and (optional) the photo storage key, and stores them with dotnet user-secrets.
powershell -ExecutionPolicy Bypass -File .\scripts\set-secrets.ps1
# on start (Development) the API applies migrations (schema "weft"), seeds the 27 governorates, the WEFT
# colours and hoodies (only into an empty catalog; Seed:Catalog=false turns it off), the owner,
# and creates the product-images storage bucket
dotnet run --project src/Weft.Api
dotnet test   # 110 unit tests (+4 SQL Server integration tests that run in GitHub Actions; skipped without Docker)

# 3. Frontend → http://localhost:3000
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend forwards `/api/*` to the backend (see `frontend/next.config.ts`), so the browser only ever talks to one origin.

## Docs

- `docs/API-CONTRACT.md` — full request/response contract
- `docs/openapi.json` — generated from the API; `npm run api:types` turns it into `frontend/src/types/api.ts`
- `docs/DATABASE.md` — tables and relations (Mermaid diagram)

## Workflow

- `main` is protected; work on feature branches and open a pull request.
- CI must be green before merging.
- Never commit secrets: use `.env` (root), `frontend/.env.local`, and `dotnet user-secrets` for the API.
