# StoreCraft AI

> AI-powered storefront builder — describe your business and get a production-ready website.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Nginx (Reverse Proxy)                       │
│                       :80 / :443 (public)                          │
└─────────────┬───────────────────┬───────────────────────────────────┘
              │                   │
              ▼                   ▼
┌─────────────────────┐  ┌─────────────────────────┐
│   Next.js App       │  │   WebSocket Gateway     │
│   :3000             │  │   :3005                  │
│   - Pages/API       │  │   - /generation ns       │
│   - Auth (NextAuth) │  │   - /chat ns             │
│   - Middleware       │  │   - /admin ns            │
│   - Prisma ORM      │  │   - /monitoring ns       │
└─────┬───────────────┘  └───────────┬──────────────┘
      │                              │
      ▼                              ▼
┌─────────────────────┐  ┌─────────────────────────┐
│   PostgreSQL 16     │  │   Redis 7               │
│   :5432 (internal)  │  │   :6379 (internal)      │
│   - Users, Auth     │  │   - BullMQ queues       │
│   - Storefronts     │  │   - Pub/Sub             │
│   - Analytics       │  │   - Session cache       │
│   - Conversations   │  │   - Rate limiting       │
└─────────────────────┘  └───────────┬──────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
┌──────────────────────┐ ┌─────────────────────┐ ┌────────────────────┐
│ Generation Service   │ │ Worker Service      │ │ (Future services)  │
│ :3002 (internal)     │ │ :3004 (internal)    │ │                    │
│ - LLM Pipeline       │ │ - BullMQ consumers  │ │                    │
│ - Socket.io          │ │ - 5 job queues      │ │                    │
│ - Multi-stage gen    │ │ - Analytics ingest  │ │                    │
└──────────────────────┘ └─────────────────────┘ └────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| **State** | Zustand |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Auth** | NextAuth.js v4 (Credentials + Google OAuth + Email Magic Link) |
| **Database** | PostgreSQL 16 |
| **Cache/Queue** | Redis 7, BullMQ |
| **WebSocket** | Socket.io via custom ws-gateway |
| **AI** | z-ai-web-dev-sdk (LLM orchestration) |
| **Runtime** | Bun |
| **Infra** | Docker Compose, Nginx |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.1+
- [Docker](https://www.docker.com/) & Docker Compose (for full stack)
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### 1. Clone & Configure

```bash
git clone <your-repo-url> storecraft-ai
cd storecraft-ai

# Create your environment config
cp .env.example .env
# Edit .env with your actual values (database password, secrets, etc.)
```

### 2. Local Development (without Docker)

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# (Optional) Seed initial data
bun run db:seed

# Start development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### 3. Docker Deployment (Production)

```bash
# Set required secrets in .env or export them:
export DB_PASSWORD=your_strong_password
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export WS_JWT_SECRET=$(openssl rand -hex 32)

# Build and start all services
docker compose up --build -d

# Run migrations inside the container
docker compose exec app bunx prisma migrate deploy

# (Optional) Seed the database
docker compose exec app bunx prisma db seed

# Check health
curl http://localhost/api/health
```

### 4. Mini-Services (Development)

Each mini-service can be developed independently:

```bash
# Generation Service
cd mini-services/generation-service
bun install
bun run dev

# Worker Service
cd mini-services/worker-service
bun install
bun run dev

# WebSocket Gateway
cd mini-services/ws-gateway
bun install
bun run dev
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `NEXTAUTH_SECRET` | ✅ (prod) | JWT signing secret — `openssl rand -base64 32` |
| `WS_JWT_SECRET` | ✅ (prod) | WebSocket auth secret — `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `EMAIL_SERVER` | ❌ | SMTP server for magic link auth |
| `DB_PASSWORD` | ✅ (docker) | PostgreSQL password for Docker |

---

## Project Structure

```
storecraft-ai/
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL)
│   └── seed.ts                # Database seeding script
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   ├── generate/      # Generation trigger
│   │   │   ├── health/        # Health check
│   │   │   ├── storefronts/   # CRUD operations
│   │   │   └── templates/     # Template listing
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main SPA entry
│   │   └── globals.css        # Tailwind + design tokens
│   ├── components/
│   │   ├── builder/           # Website builder UI
│   │   ├── preview/           # Live preview
│   │   ├── landing/           # Landing page
│   │   ├── agents/            # Agent visualization
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── templates/         # Template gallery
│   │   ├── blocks/            # Block composer
│   │   ├── design-library/    # Design system browser
│   │   ├── settings/          # User settings
│   │   ├── projects/          # Project management
│   │   ├── layout/            # Shell, sidebar, header
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── error-boundary.tsx # React error boundary
│   ├── data/                  # Static data (templates, components, blocks)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Core libraries
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma singleton
│   │   ├── redis.ts           # Redis singleton
│   │   ├── queue.ts           # BullMQ queue definitions
│   │   ├── security.ts        # Security utilities
│   │   ├── errors.ts          # Error handling
│   │   └── api-response.ts    # Standardized API responses
│   ├── store/
│   │   └── app-store.ts       # Zustand global state
│   └── middleware.ts          # Security middleware (CSP, CORS, CSRF, bot detection)
├── mini-services/
│   ├── generation-service/    # LLM pipeline (Socket.io)
│   ├── worker-service/        # BullMQ job processors
│   └── ws-gateway/            # Hardened WebSocket gateway
├── nginx/
│   └── nginx.conf             # Nginx reverse proxy config
├── docker-compose.yml         # Full stack orchestration
├── Dockerfile                 # Multi-stage production build
├── .env.example               # Environment variable template
└── package.json               # Root dependencies & scripts
```

---

## NPM Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start Next.js dev server on port 3000 |
| `bun run build` | Production build with standalone output |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run migrations (dev) |
| `bun run db:migrate:deploy` | Run migrations (production) |
| `bun run db:seed` | Seed initial data |
| `bun run db:push` | Push schema without migrations (dev only) |
| `bun run db:reset` | Reset database and re-run migrations |

---

## Security

The security middleware (`src/middleware.ts`) provides:

- **Content Security Policy (CSP)** with strict report-only mode
- **CORS** with origin allowlist validation
- **CSRF** protection (Double-Submit Cookie pattern)
- **Request ID** tracking via `X-Request-ID` header
- **Payload size** pre-check (rejects oversized requests)
- **Bot detection** (blocks known scanner user-agents)
- **Malicious pattern** filtering (XSS, SQLi, SSRF, Log4j, path traversal)
- **Security headers** (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)

---

## License

Private — All rights reserved.
