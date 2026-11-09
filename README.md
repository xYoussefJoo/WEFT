# WEFT

WEFT — The Thread Co. Bilingual (Arabic / English) online store for hoodies.
Guest checkout with cash on delivery, order tracking by link, and an owner dashboard.

## Stack

| Part | Tech |
|---|---|
| Backend | ASP.NET Core 10 Web API (Controllers) · Clean Architecture · EF Core · PostgreSQL 17 |
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
├─ docker-compose.yml        local PostgreSQL
└─ .github/workflows/ci.yml  build + test on every push
```

Dependency rule: `Api → Infrastructure → Application → Domain`. Domain references nothing.

## Getting started

Requirements: .NET SDK 10, Node.js 24, Docker Desktop.

```bash
# 1. Database
cp .env.example .env            # set DB_PASSWORD
docker compose up -d

# 2. Backend  → http://localhost:5055  (health: /health, OpenAPI: /openapi/v1.json)
cd backend
# one-time: secrets stay on your machine, never in git
# Supabase (Connect → Session pooler). Local PostgreSQL works too: Host=localhost;Database=weft;...
dotnet user-secrets set "ConnectionStrings:Weft" "Host=<pooler host>;Port=5432;Database=postgres;Username=postgres.<project-ref>;Password=<db password>;SSL Mode=Require" --project src/Weft.Api
# Supabase Storage for product photos (Project Settings → API Keys → service_role / secret key)
dotnet user-secrets set "Storage:ServiceKey" "<service_role key>" --project src/Weft.Api
dotnet user-secrets set "Seed:OwnerEmail" "owner@example.com" --project src/Weft.Api
dotnet user-secrets set "Seed:OwnerPassword" "<at least 10 characters>" --project src/Weft.Api
dotnet user-secrets set "Seed:OwnerName" "Owner Name" --project src/Weft.Api
# on start (Development) the API applies migrations (schema "weft"), seeds the 27 governorates, the WEFT
# colours and hoodies (only into an empty catalog; Seed:Catalog=false turns it off), the owner,
# and creates the product-images storage bucket
dotnet run --project src/Weft.Api
dotnet test   # 110 unit tests (+4 PostgreSQL integration tests that run in GitHub Actions; skipped without Docker)

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
- `docs/BACKUP.md` — nightly encrypted database backup

## Workflow

- `main` is protected; work on feature branches and open a pull request.
- CI must be green before merging.
- Never commit secrets: use `.env` (root), `frontend/.env.local`, and `dotnet user-secrets` for the API.
