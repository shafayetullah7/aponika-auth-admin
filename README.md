# @aponika/auth-admin

SolidStart operator console for the identity platform: users, OAuth clients, roles, audit.

**Local port:** `3012`  
**Setup status:** SolidStart 1.1 + Tailwind 4 — see [platform setup plan](../docs/PLATFORM_SETUP_PLAN.md).

Not the same as `byte-forge-admin` (marketplace operations).

## Prerequisites

- Node.js 22 (`nvm use` reads `.nvmrc`)
- pnpm 10

## Commands

```bash
pnpm install
cp .env.example .env.development   # first time
pnpm dev                           # http://localhost:3012
pnpm build
pnpm typecheck
```

## Environment

Copy `.env.example` to `.env.development`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_ORIGIN` | `http://localhost:3010` | Auth API origin (no path) |
| `VITE_API_BASE_URL` | `http://localhost:3010/api/v1` | Versioned API base for `fetcher()` |
| `VITE_HEALTH_URL` | `http://localhost:3010/health` | Public health smoke test |
| `VITE_CLIENT_TIMEOUT` | `30000` | Browser fetch timeout (ms) |
| `VITE_SERVER_TIMEOUT` | `30000` | SSR fetch timeout (ms) |

The dashboard shows API health in dev when the backend is running.

## Routes (stub)

| Path | Purpose |
|------|---------|
| `/login` | Operator login placeholder |
| `/` | Dashboard (sidebar layout) |
| `/users` | Users placeholder |
| `/clients` | OAuth clients placeholder |

## Documentation

| Doc | Purpose |
|-----|---------|
| [../docs/PLATFORM_SETUP_PLAN.md](../docs/PLATFORM_SETUP_PLAN.md) | Phased bootstrap (start here) |
| [../docs/STACK.md](../docs/STACK.md) | Locked dependency versions |
| [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Platform boundaries |
| [../docs/SHARED_UI_SYNC.md](../docs/SHARED_UI_SYNC.md) | Governed UI sync between admin and frontend |
