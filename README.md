# Daftar — دفتر

Mini-market accounting system in Arabic (RTL).

- Public customer portal — customers look up their balance and history by their **code**.
- Admin dashboard — manage customers, log purchases (مشتريات / مديونية) and payments (دفعات / سداد), see KPIs, import bulk data from CSV / XLSX.
- Mobile-first UI with large touch targets.
- No external auth services. Self-hostable. All data lives in your own PostgreSQL database.

---

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Landing — choose Admin or Customer Portal |
| `/portal` | Customer enters their code |
| `/portal/:code` | Public read-only view of balance + history |
| `/admin/login` | Admin password login |
| `/admin` | KPI dashboard + recent transactions |
| `/admin/customers` | Customer list + create |
| `/admin/customers/:id` | Customer detail, add purchase / payment, delete |
| `/admin/import` | CSV / XLSX bulk import |

---

## Required environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | _(required)_ |
| `SESSION_SECRET` | Secret used to sign the admin auth cookie | _(required)_ |
| `ADMIN_PASSWORD` | Password for `/admin/login` | `admin` (change in production!) |
| `PORT` | Port for the API server (production) | `8080` |

> **Important — production:** the API server **refuses to start in production** (`NODE_ENV=production`) unless both `SESSION_SECRET` and `ADMIN_PASSWORD` are set. Use a long random `SESSION_SECRET` (e.g. `openssl rand -hex 32`) and a strong `ADMIN_PASSWORD`. The auth cookie is automatically marked `Secure` in production.

---

## Bulk import format

The importer accepts **CSV** or **XLSX**. Headers can be Arabic or English:

| Arabic | English | Required | Notes |
| --- | --- | --- | --- |
| `الكود` | `code` | yes | Unique customer code |
| `الاسم` | `name` | yes | Customer name |
| `الهاتف` | `phone` | no | |
| `ملاحظات` | `notes` | no | |
| `النوع` | `type` | optional | `شراء` / `purchase` or `دفعة` / `payment` |
| `المبلغ` | `amount` | optional | Required if `type` is set |
| `الوصف` | `description` | optional | |
| `التاريخ` | `occurredAt` | optional | ISO date / datetime |

If a customer code already exists, their row is updated. If `type` + `amount` are present, a transaction is added.

A template can be downloaded from the import page.

---

## Self-hosting

This project lives inside a pnpm workspace monorepo. The two relevant artifacts are:

- `artifacts/daftar` — the React + Vite frontend (this app)
- `artifacts/api-server` — the Express + Drizzle backend
- `lib/db` — Drizzle schema and migrations
- `lib/api-spec` — OpenAPI contract (regenerate hooks with codegen after changes)

### 1. Prerequisites

- Node.js 24+
- pnpm 10+
- A PostgreSQL 14+ database

### 2. Install

```bash
pnpm install
```

### 3. Configure environment

Create a `.env` file (or export in your shell) with at least:

```bash
export DATABASE_URL="postgres://user:pass@host:5432/daftar"
export SESSION_SECRET="$(openssl rand -hex 32)"
export ADMIN_PASSWORD="something-strong-here"
```

### 4. Initialise the database

```bash
pnpm --filter @workspace/db run push
```

This creates the `customers` and `transactions` tables.

### 5. Run in development

The repo uses Replit-managed workflows in dev. To run locally without Replit:

```bash
# terminal 1 — API
pnpm --filter @workspace/api-server run dev

# terminal 2 — frontend
pnpm --filter @workspace/daftar run dev
```

The frontend expects the API on the same origin under `/api`. In development the dev proxy must forward `/api/*` to the API server.

### 6. Build for production

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/daftar run build
```

The API bundle is emitted at `artifacts/api-server/dist/index.mjs` and the static frontend at `artifacts/daftar/dist/`.

Run the API:

```bash
NODE_ENV=production \
DATABASE_URL=... SESSION_SECRET=... ADMIN_PASSWORD=... PORT=8080 \
node --enable-source-maps artifacts/api-server/dist/index.mjs
```

Serve the frontend `dist/` from any static host (nginx, Caddy, Cloudflare Pages, etc.) and reverse-proxy `/api/*` to the API server.

Minimal nginx example:

```nginx
server {
  listen 80;
  root /var/www/daftar;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri /index.html;
  }
}
```

### 7. Deploying on Replit

The project is Replit-ready. Just publish — the deployment skill builds both artifacts, runs the API on `$PORT`, and routes `/api/*` to it via the platform proxy. Make sure `DATABASE_URL`, `SESSION_SECRET`, and `ADMIN_PASSWORD` are set as deployment secrets.

---

## Tech stack

- **Frontend:** React 18, Vite, Wouter (router), TanStack Query, shadcn/ui, Tailwind CSS, Tajawal Arabic font.
- **Backend:** Express 5, Drizzle ORM, signed cookies via `cookie-parser`, Zod validation generated from OpenAPI.
- **DB:** PostgreSQL.
- **Bulk import:** PapaParse (CSV), SheetJS / `xlsx` (Excel).
