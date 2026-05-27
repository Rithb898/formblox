# FormBlox — AI-Native Form Builder SaaS

A production-style Typeform-alternative built with Turborepo, tRPC, Zod, Drizzle ORM, and Scalar. Features conversational forms, AI follow-up questions, AI response summaries, and AI form generation.

---

## Demo

| Item              | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| **Live URL**      | _(add deployed URL here)_                                |
| **Demo email**    | `rithb8981@gmail.com`                                    |
| **Demo password** | `Rithb@8981`                                             |
| **Explore page**  | `/explore` — 3 themed public forms with seeded responses |
| **API docs**      | `/docs` (Scalar)                                         |

---

## Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Monorepo      | Turborepo                                      |
| Frontend      | Next.js 16, React 19, Tailwind CSS v4          |
| Backend       | Express.js, tRPC v11                           |
| Database      | PostgreSQL + Drizzle ORM                       |
| Validation    | Zod                                            |
| Auth          | JWT (access + refresh), bcryptjs, Google OAuth |
| AI            | Vercel AI SDK + Claude                         |
| Rate limiting | Redis (ioredis)                                |
| API docs      | Scalar                                         |

---

## Monorepo Structure

```
formblox/
├── apps/
│   ├── web/          # Next.js 16 frontend (port 3000)
│   └── api/          # Express backend (port 8123)
└── packages/
    ├── database/     # Drizzle schema, migrations, seed
    ├── trpc/         # tRPC router definitions
    ├── services/     # Auth, email, token, Redis services
    ├── forms/        # Field types, configs, Zod validators
    └── logger/       # Shared logger
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL database
- Redis instance

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env` to each package that needs it (or set up a root `.env`):

```env
DATABASE_URL=postgres://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8123/auth/google/callback
RESEND_API_KEY=...
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8123
NEXT_PUBLIC_API_URL=http://localhost:8123
```

### 3. Run migrations

```bash
pnpm db:migrate
```

### 4. Seed demo data

Creates the demo user, workspace, and 3 themed forms with 55 seeded responses and AI follow-ups:

```bash
pnpm db:seed
```

### 5. Start development

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:8123
- API docs: http://localhost:8123/docs

---

## Features

### Core

- Email/password auth + Google OAuth
- JWT access tokens (15min) + refresh tokens (7 days)
- Email verification + password reset flow
- Protected creator dashboard
- Create, edit, publish, unpublish forms
- Soft delete + restore

### Forms

- 8 field types: short text, long text, email, number, single choice, multiple choice, rating, date
- Per-field required/optional toggle
- Type-specific config validation (Zod)
- Drag-and-drop field reordering (dnd-kit)
- Version history (draft → published → archived)
- Public (`public`) and unlisted (`unlisted`) visibility modes
- Rate-limited public submission (10 req/60s per IP per form)
- Honeypot spam protection

### AI

- AI follow-up questions on open-text answers (streaming, skippable)
- AI response summary tab (streaming markdown)
- AI form generation from natural language prompt

### Public

- `/f/[slug]` — conversational form runner, no login required
- `/explore` — public forms gallery with bento grid layout

### API

- Full tRPC API + REST OpenAPI spec
- Scalar API docs at `/docs`

---

## Seeded Demo Data

After running `pnpm db:seed`:

| Form                     | Visibility | Responses |
| ------------------------ | ---------- | --------- |
| Anime Fan Survey 2025    | Public     | 20        |
| Startup Product Feedback | Public     | 15        |
| Gamer Preferences Poll   | Public     | 20        |

All responses include realistic answers and AI follow-up conversations.

---

## API Documentation

Scalar docs: `{BASE_URL}/docs`  
OpenAPI spec: `{BASE_URL}/openapi.json`

Key public endpoints:

- `GET /trpc/forms.public.listPublic` — list all public forms
- `GET /trpc/forms.public.getBySlug` — get form by slug
- `POST /trpc/forms.public.submit` — submit a response (rate limited)

---

## Scripts

```bash
pnpm dev          # start all apps in dev mode
pnpm build        # build all apps
pnpm db:generate  # generate Drizzle migration
pnpm db:migrate   # run migrations
pnpm db:seed      # seed demo data
pnpm lint         # lint all packages
pnpm check-types  # typecheck all packages
```
