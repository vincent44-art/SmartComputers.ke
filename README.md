# SmartComputers.ke

A premium, production-structured eCommerce platform for a Kenyan technology
retailer — laptops, gaming gear, Apple products, monitors, printers and
accessories. Built as a monorepo with a **Next.js 15 / React 19** storefront and
a **Flask / SQLAlchemy** REST API.

> Original work. Design inspired by leading premium retailers; no third-party
> code, images, logos or copyrighted assets were copied.

---

## Tech stack

**Frontend** — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS,
Framer Motion, TanStack React Query, Zustand, React Hook Form, Axios, Swiper,
React Icons, next-themes (dark/light mode).

**Backend** — Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Migrate, Flask-Mail,
Flask-CORS, Marshmallow, Celery + Redis, Gunicorn. SQLite by default for local
dev; PostgreSQL in production via `DATABASE_URL`.

**Payments** — Stripe (live PaymentIntent when keys are set), M-Pesa Daraja and
PayPal (interfaces + simulation mode; live wiring documented).

**Infra** — Docker, docker-compose, Nginx reverse proxy, GitHub Actions CI.

---

## Repository layout

```
smartcomputers-ke/
├── backend/            # Flask REST API
│   ├── app/
│   │   ├── api/        # auth, products, categories, brands, cart, orders,
│   │   │               # reviews, coupons, wishlist, payments, blog, admin
│   │   ├── models/     # user, catalog, review, shopping, order, blog
│   │   ├── services/   # payment gateway abstractions
│   │   ├── utils/      # errors, pagination, auth guards, slugify
│   │   └── seed.py     # demo catalog + blog + users + coupons
│   ├── tests/          # pytest suite
│   ├── config.py       # env-driven config classes
│   ├── wsgi.py         # Gunicorn/Flask entrypoint
│   └── celery_app.py   # background worker entrypoint
├── frontend/           # Next.js 15 storefront + admin dashboard
│   └── src/
│       ├── app/        # routes (storefront, blog, account, admin, content)
│       ├── components/ # layout, ui, product, cart, home, blog, content
│       ├── lib/        # api client, services, types, formatting
│       └── store/      # Zustand stores (cart, auth, wishlist, recently viewed)
├── nginx/nginx.conf    # reverse proxy + gzip + rate limiting
├── docker-compose.yml  # db, redis, backend, worker, frontend, nginx
└── .github/workflows/  # CI (backend tests + frontend lint/typecheck/build)
```

---

## Quick start (local, no Docker)

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # optional; sensible defaults are used
flask --app wsgi seed           # create + seed the SQLite database
gunicorn -b 127.0.0.1:5000 wsgi:app   # or: flask --app wsgi run --port 5000
```

Backend runs at `http://localhost:5000` — health check at
`http://localhost:5000/api/health`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local      # API_PROXY_TARGET defaults to localhost:5000
npm run dev
```

Storefront runs at `http://localhost:3000`. Next.js proxies `/api/*` to Flask.

---

## Quick start (Docker)

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, the Flask API, a Celery worker, the Next.js
frontend and an Nginx reverse proxy. The app is served at `http://localhost`.
Seed the database once the stack is up:

```bash
docker compose exec backend flask --app wsgi seed
```

---

## Demo credentials

> Demo data only — **do not** use in production.

| Role     | Email                       | Password    |
|----------|-----------------------------|-------------|
| Admin    | `admin@smartcomputers.ke`   | `admin12345`|
| Customer | `demo@smartcomputers.ke`    | `demo12345` |

Demo coupons: `WELCOME10` (10% off orders ≥ 10,000), `SAVE5000`
(KES 5,000 off orders ≥ 150,000).

The admin dashboard is available at `/admin` (requires the admin account).

---

## Key features

**Storefront** — premium animated home page, mega-menu navigation, category
listing with filters (brand, price, RAM, storage, processor, condition,
availability), sort & pagination, product detail with gallery/zoom, reviews &
ratings, related products, recently viewed, wishlist, cart drawer, coupons,
guest & account checkout with M-Pesa/card/PayPal options, order confirmation.

**Blog** — categories, tags, post detail with structured data, comments,
related posts, search.

**Admin dashboard** — analytics (revenue, orders, customers, products, 7-day
revenue chart, low-stock alerts), product CRUD, order management with status
updates, customer list, coupon management.

**SEO & performance** — SSR, per-route metadata, Open Graph & Twitter cards,
JSON-LD structured data, dynamic `sitemap.xml` and `robots.txt`, canonical URLs,
`next/image` optimization, code splitting, skeleton loaders.

**Security** — JWT auth (access + refresh), role-based admin guard, server-side
input validation, parameterised queries (SQLAlchemy), CORS allow-list, Nginx
rate limiting & security headers.

---

## API overview

| Area       | Endpoints (prefix `/api`) |
|------------|---------------------------|
| Auth       | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Catalog    | `GET /products`, `GET /products/facets`, `GET /products/<slug>`, `GET /categories`, `GET /categories/<slug>`, `GET /brands` |
| Cart       | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/<id>`, `DELETE /cart/items/<id>` |
| Orders     | `POST /orders`, `GET /orders`, `GET /orders/<orderNumber>` |
| Reviews    | `GET /products/<slug>/reviews`, `POST /products/<slug>/reviews` |
| Wishlist   | `GET /wishlist`, `POST /wishlist`, `DELETE /wishlist/<productId>` |
| Coupons    | `POST /coupons/validate` |
| Payments   | `POST /payments/initiate` (mpesa / stripe / paypal) |
| Blog       | `GET /blog/posts`, `GET /blog/posts/<slug>`, `GET /blog/categories`, `POST /blog/posts/<slug>/comments` |
| Newsletter | `POST /newsletter/subscribe` |
| Admin      | `GET /admin/analytics`, `CRUD /admin/products`, `GET/PATCH /admin/orders`, `GET /admin/customers`, `CRUD /admin/coupons`, `POST /admin/categories`, `POST /admin/brands` |

List endpoints return `{ items, meta: { page, perPage, total, totalPages,
hasNext, hasPrev } }`.

---

## Payments integration status

The checkout is gateway-agnostic. Providers run in **simulation mode** when
credentials are absent (deterministic fake references) so local dev and CI work
without real keys.

- **Stripe** — creates a real `PaymentIntent` when `STRIPE_SECRET_KEY` is set;
  otherwise simulated.
- **M-Pesa (Daraja)** — interface in place; production requires OAuth token →
  STK push → callback handling (`MPESA_*` env vars).
- **PayPal** — interface in place; production requires create-order → capture →
  webhook verification (`PAYPAL_*` env vars).

See `backend/app/services/payments.py` for the provider contract and TODOs.

---

## Testing & quality

```bash
# Backend
cd backend && pytest -q

# Frontend
cd frontend && npm run lint && npm run typecheck && npm run build
```

CI (GitHub Actions) runs the backend test suite and the frontend
lint/typecheck/build on every push and pull request.

---

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list
(database, CORS, Redis/Celery, mail, Cloudinary, Stripe, M-Pesa, PayPal, site
URL and API proxy target).

---

## Production roadmap

Scaffolded with clean interfaces, planned for future iterations: live
M-Pesa/PayPal wiring, Cloudinary uploads in admin, full CMS/banners, blog
authoring UI, product variants & bulk CSV import, barcode support, loyalty &
referral programs, gift cards, multi-currency/language, AI & voice search, live
chat, PDF invoices, abandoned-cart recovery and support ticketing.
