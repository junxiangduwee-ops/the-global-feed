# The Global Feed

MR.DIY's internal global communications platform — draft, review, translate and publish press releases across markets and languages.

Built with **Next.js 14**, **Prisma**, **Supabase (PostgreSQL)** and **n8n** for translation automation.

---

## Prerequisites

- Node.js v18+
- npm v9+
- Supabase project (free tier works)

> **Corporate network users:** run `npm config set strict-ssl false` once before anything else to bypass SSL inspection.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

The `.env` file is already included with Supabase credentials pre-filled. If you need to point to a different database, update these two values:

```env
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

> Use the **Session pooler on port 5432** from Supabase → Settings → Database → Connection pooling. Do NOT use the direct connection (also port 5432 but on `db.xxxx.supabase.co`) — it is blocked on corporate networks.

### 3. Push schema to database

```bash
npm run db:push
```

### 4. Seed sample data

```bash
npm run db:seed
```

Creates 5 MR.DIY accounts (default password: `ChangeMe123!`):

| Email               | Role                |
|---------------------|---------------------|
| hod@mrdiy.com       | Head of Department  |
| sm@mrdiy.com        | Senior Manager      |
| mgr@mrdiy.com       | Manager             |
| am@mrdiy.com        | Assistant Manager   |
| exec@mrdiy.com      | Senior Executive    |

Also seeds 4 sample releases (Published, Approved, Pending, Draft) so the dashboard has data to display immediately.

### 5. Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any of the seeded accounts.

---

## Database commands

| Command              | What it does                                      |
|----------------------|---------------------------------------------------|
| `npm run db:push`    | Sync Prisma schema to database (no migrations)    |
| `npm run db:seed`    | Insert sample users and releases                  |
| `npm run db:studio`  | Open Prisma Studio — visual database browser      |
| `npm run db:reset`   | Drop and recreate schema (dev only, destructive)  |

---

## Project structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          → Sign in page
│   │   └── register/       → Create account page
│   ├── dashboard/
│   │   ├── page.tsx        → Overview + stats
│   │   ├── releases/       → All releases list + detail
│   │   ├── drafts/         → My submissions + new/edit draft
│   │   ├── approvals/      → HOD approval queue
│   │   └── translations/   → Translation status tracker
│   └── api/
│       ├── auth/           → Login, register, logout
│       ├── releases/       → Create, update, approve, decline
│       └── n8n/callback    → Receives translations from n8n
├── components/
│   ├── layout/             → Sidebar, TopBar
│   ├── releases/           → StatusBadge, ApproveDeclineBar
│   └── drafts/             → DraftForm
├── lib/
│   ├── prisma.ts           → Prisma client singleton
│   ├── session.ts          → Cookie-based auth session
│   ├── types.ts            → Role constants, status configs, languages
│   ├── utils.ts            → Formatting helpers
│   └── n8n.ts              → n8n webhook sender
scripts/
├── prisma.mjs              → Prisma CLI wrapper (loads .env, detects DB)
├── db-config.mjs           → SQLite/Postgres auto-detection
├── seed.mjs                → Runs prisma/seed.ts
└── reset.mjs               → Drops and recreates schema
prisma/
├── schema.prisma           → PostgreSQL schema (source of truth)
├── schema.sqlite.prisma    → Auto-generated SQLite schema (local dev)
├── seed.ts                 → Seed script
└── seed.sql                → Manual SQL seed (paste into Supabase if needed)
```

---

## Roles & permissions

| Role               | Submit draft | Skip HOD approval | Approve / Decline |
|--------------------|:------------:|:-----------------:|:-----------------:|
| Head of Department | ✓            | ✓                 | ✓                 |
| Senior Manager     | ✓            | ✓                 | ✗                 |
| Manager            | ✓            | ✓                 | ✗                 |
| Assistant Manager  | ✓            | ✗                 | ✗                 |
| Senior Executive   | ✓            | ✗                 | ✗                 |

- **Assistant Manager** and **Senior Executive** submissions go into the HOD approval queue (`PENDING` status).
- **Manager and above** submissions are approved automatically (`APPROVED` status).
- Only **Head of Department** sees the Approvals queue and can approve or decline with a written reason.

---

## Workflow

```
Draft → Submit → [HOD Review] → Approved → n8n Translation → Published
                     ↓
                  Declined → Edit & Resubmit
```

---

## n8n Translation Integration

When a release is approved, send it to n8n via:

```
POST /api/n8n/trigger
{ "release_id": "<id>" }
```

n8n processes the translation and posts results back to:

```
POST /api/n8n/callback
{
  "job_id": "<release-id>",
  "secret": "<N8N_WEBHOOK_SECRET>",
  "translations": [
    { "language": "ms", "country": "MY", "title": "...", "body": "...", "excerpt": "..." },
    { "language": "th", "country": "TH", "title": "...", "body": "...", "excerpt": "..." }
  ]
}
```

Set `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` in `.env` when ready to connect.

---

## Tech stack

| Layer        | Technology                    |
|--------------|-------------------------------|
| Framework    | Next.js 14 (App Router)       |
| Database     | Supabase (PostgreSQL)         |
| ORM          | Prisma                        |
| Auth         | Cookie session (bcryptjs)     |
| Styling      | Tailwind CSS                  |
| Toasts       | Sonner                        |
| Translation  | n8n webhook (pluggable)       |

---

> ⚠️ AI-generated content must be reviewed before publishing. For platform support contact **ai.automation@mrdiy.com**.
