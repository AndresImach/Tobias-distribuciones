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

## Sincronización de Borgest

`POST /api/sync-productos` mantiene su autenticación con `x-api-key`, validaciones
por producto y respuesta `processed`, `created`, `updated`, `errors`.
La escritura usa lotes de hasta 100 productos enviados juntos a Turso, en lugar de
hacer llamadas separadas por producto. No cambia la frecuencia de sincronización
ni omite actualizaciones: los precios y el stock se siguen actualizando en cada
envío. Cuando falta el stock, conserva el anterior; en productos nuevos usa cero.
Si falla un lote, se vuelve a intentar por producto para informar errores parciales.

Verificación local: `npm run test:sync` y `npm run build`.
Para comprobar el ahorro real después de publicar, revisar en Vercel
Observability → External APIs → Turso → Functions, y comparar las llamadas de
`/api/sync-productos` por invocación con el período anterior. Con hasta 100
productos, el camino normal usa dos solicitudes HTTP a Turso. La reducción en
producción debe confirmarse con sincronizaciones reales, no solo con el build.
