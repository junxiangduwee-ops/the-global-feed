# The Global Feed

Global communications platform — draft, translate and publish press releases across markets.

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# For Supabase free tier — get both from Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres"

AUTH_SECRET="generate-with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\""
```

> Leave `DATABASE_URL` empty to use SQLite locally with zero setup.

### 3. Push schema to database

```bash
npm run db:push
```

### 4. Seed sample data

```bash
npm run db:seed
```

Creates 5 accounts (password: `ChangeMe123!`):

| Email                  | Role                |
|------------------------|---------------------|
| hod@globalfeed.com     | Head of Department  |
| sm@globalfeed.com      | Senior Manager      |
| mgr@globalfeed.com     | Manager             |
| am@globalfeed.com      | Assistant Manager   |
| exec@globalfeed.com    | Senior Executive    |

### 5. Run

```bash
npm run dev
# open http://localhost:3000
```

---

## Database commands

| Command             | What it does                              |
|---------------------|-------------------------------------------|
| `npm run db:push`   | Push schema to database (no migrations)   |
| `npm run db:seed`   | Load sample users + releases              |
| `npm run db:studio` | Open Prisma Studio (visual DB browser)    |
| `npm run db:reset`  | Drop + recreate schema (dev only)         |

---

## Roles & permissions

| Role               | Submit | Skip approval | Approve/Decline |
|--------------------|--------|---------------|-----------------|
| Head of Department | ✓      | ✓             | ✓               |
| Senior Manager     | ✓      | ✓             | ✗               |
| Manager            | ✓      | ✓             | ✗               |
| Assistant Manager  | ✓      | ✗             | ✗               |
| Senior Executive   | ✓      | ✗             | ✗               |

---

## n8n translation workflow

When a release is approved, trigger n8n by calling:

```
POST /api/n8n/trigger  { release_id }
```

n8n posts translations back to:

```
POST /api/n8n/callback
{
  "job_id": "<release-id>",
  "secret": "<N8N_WEBHOOK_SECRET>",
  "translations": [
    { "language": "ms", "country": "MY", "title": "...", "body": "...", "excerpt": "..." }
  ]
}
```

> ⚠️ Review all AI-generated content before publishing. Contact ai.automation@mrdiy.com for support.
