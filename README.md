# Tobias Distribuciones — Tienda Online

E-commerce catalog with WhatsApp checkout integration, built with Next.js 16, Tailwind CSS, Prisma 7 (SQLite), and Zustand.

## Features

- **Catalog** — Product grid with category filters and search
- **Cart** — Slide-in cart drawer with quantity controls
- **WhatsApp checkout** — Order confirmation sent directly to WhatsApp
- **Admin panel** — Full CRUD for products and categories, order history

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL to an absolute path

# 3. Run migrations
npm run db:migrate

# 4. Seed sample data
npm run db:seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the store, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 |
| Database | SQLite via Prisma 7 + LibSQL |
| State | Zustand (cart) |
| Icons | Lucide React |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Absolute SQLite file path: `file:/path/to/prisma/dev.db` |
| `NEXTAUTH_SECRET` | Random secret string |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `WHATSAPP_NUMBER` | WhatsApp number without `+` (e.g. `5491112345678`) |
