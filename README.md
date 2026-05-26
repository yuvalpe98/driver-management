# Fleet & Lab Operations System — מערכת תפעול צי ומעבדה

A full-stack fleet and delivery management platform built for Hebrew-speaking teams. Supports three distinct user roles — Manager, Driver, and Lab User — with role-based dashboards, real-time notifications, and a barcode-verified delivery completion flow.

> **Live deployment:** hosted on [Railway](https://railway.app), auto-deployed from the `main` branch on every push.

---

## Features

### Manager
- Create and assign delivery / maintenance tasks with priority levels (Urgent / Normal / Low)
- Attach required items and serial numbers to each task
- Monitor driver progress and task statuses
- Manage the shared **catalog** (inventory items + equipment types, with low-stock thresholds)
- View each driver's inventory levels and equipment status; receive low-stock alerts
- Browse the full **deliveries log** with recipient name and signature image
- Manage **lab technicians** and **parts** (add, rename, activate/deactivate)
- View the **lab release report** — searchable by serial number (supports barcode scanner), technician, customer type, or part; exportable as Excel-compatible UTF-8 CSV
- Drill into any serial number's full **service history** via a side drawer
- Create and manage DRIVER and LAB_USER accounts from a single unified form
- Push notifications and WhatsApp alerts (via Green API) when tasks are completed

### Driver
- Personal dashboard showing assigned tasks sorted by priority
- Complete deliveries with **recipient signature capture** and **barcode scan** per required item
- Track personal inventory quantities and equipment status
- Receive push notifications for new task assignments
- Installable as a **PWA** on mobile home screen (offline-ready shell)

### Lab User
- Release form at `/lab/release` — enter serial number manually or **scan with camera**
- Log technician, service date, working hours, air purity %, customer type, and replaced parts
- "בדיקה בלבד" (inspection-only) mode that disables part selection
- Dark mode support across all lab screens

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Dark mode | next-themes |
| Database | PostgreSQL (Neon hosted) |
| ORM | Prisma 7 |
| Auth | NextAuth 5 β (JWT, credentials, username-based) |
| Validation | Zod 4 |
| Image Storage | Cloudinary (signature images) |
| Push Notifications | Web Push API (`web-push`) |
| WhatsApp Alerts | Green API |
| Barcode Scanning | react-zxing 2 (ZXing WASM, SSR-disabled) |
| Signature Capture | signature_pad 5 |
| Hosting | Railway |

---

## Architecture

### Role-based routing

The root `app/page.tsx` is a server-side dispatch hub — it reads the session and redirects each user to their correct dashboard:

| Role | Default route |
|---|---|
| `MANAGER` | `/manager/dashboard` |
| `DRIVER` | `/driver/dashboard` |
| `LAB_USER` | `/lab/release` |
| (unauthenticated) | `/login` |

Each route group (`(manager)`, `(driver)`, `(lab)`) has its own layout with a dedicated auth guard that sends wrong-role users back to `/`.

### Server vs. client components

Pages fetch data server-side via Prisma (no API round-trip). Only interactive pieces — barcode scanner, signature canvas, CRUD forms, search bars — are client components. The barcode scanner uses `next/dynamic` with `{ ssr: false }` to avoid WASM loading issues.

### Row-level security

Every Prisma query scopes data to the authenticated user. Drivers can only see their own tasks, inventory, and equipment — never another driver's data.

### Notifications

Push and WhatsApp notifications are fire-and-forget (non-blocking). They never delay the main operation and fail silently if keys are not configured.

### Database Schema (simplified)

```
User (DRIVER | MANAGER | LAB_USER)
  ├── Task (assigned to driver, created by manager)
  │     ├── TaskItem (items required per task)
  │     │     └── ScannedSerial (one per physical unit, globally unique)
  │     └── TaskCompletion (recipient name + Cloudinary signature URL)
  │
  ├── InventoryItem  ─┐
  ├── Equipment      ─┤ both reference CatalogItem
  └── PushSubscription

CatalogItem (INVENTORY | EQUIPMENT)
  ├── unit, minThreshold

LabReleaseLog
  ├── serialNumber, date, workingHours, airPurity (Float?)
  ├── customerType (OCCASIONAL_CUSTOMER | CLALIT_ENGINEERING)
  ├── isInspectionOnly
  ├── LabTechnician
  └── LabPart[] (implicit many-to-many)

AuditLog (action, entityType, entityId, userId, ipAddress)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)

### Installation

```bash
git clone https://github.com/yuvalpe98/fleet-lab-ops
cd fleet-lab-ops
pnpm install

# Copy and fill in environment variables
cp .env.example .env.local
```

### Database setup

```bash
# Apply all migrations
pnpm db:migrate         # calls prisma migrate dev (local dev only)

# Seed with sample data (optional)
pnpm db:seed

# Browse data in Prisma Studio
pnpm db:studio
```

> **Production note:** Railway runs `prisma generate && next build` as the build command. Migrations must be applied separately via `prisma migrate deploy` (non-interactive) before or alongside each deploy.

### Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```env
# PostgreSQL (Neon or local)
DATABASE_URL="postgresql://user:password@host:5432/driver_management"

# NextAuth — generate secret with: openssl rand -base64 32
NEXTAUTH_URL="https://your-railway-domain.up.railway.app"
NEXTAUTH_SECRET=""

# Cloudinary — signature image storage (https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Web Push notifications — generate keys with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_EMAIL="mailto:you@example.com"

# WhatsApp via Green API (https://green-api.com) — optional
GREEN_API_INSTANCE_ID=""
GREEN_API_TOKEN=""
```

Push and WhatsApp keys are **optional** — the app works without them; notifications are silently skipped.

---

## Deployment (Railway)

This project is deployed on [Railway](https://railway.app) with auto-deploys on every push to `main`.

1. Push the repo to GitHub
2. Create a new project on Railway → **Deploy from GitHub repo**
3. Add a **PostgreSQL** plugin (or connect an external Neon database via `DATABASE_URL`)
4. Set all required environment variables in Railway's **Variables** tab
5. Set the **Build Command**: `prisma generate && next build`
6. Set the **Start Command**: `next start`
7. Apply migrations once: open a Railway shell and run `pnpm prisma migrate deploy`

Railway auto-assigns a public domain (`*.up.railway.app`). Set `NEXTAUTH_URL` to that domain.

---

## Security Design

- Passwords hashed with **bcryptjs** — plaintext never stored
- All protected routes validate the session with `requireRole()` / `requireLabAccess()` guards
- Every database query filters by the authenticated user's ID — no cross-user data leakage
- All user inputs validated with **Zod** schemas before reaching the database
- `AuditLog` table records sensitive actions with user ID and IP address
- VAPID keys sign push payloads — subscriptions verified server-side

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Generate Prisma client and build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Run pending migrations (dev — uses `migrate dev`) |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Prisma Studio (database browser) |
