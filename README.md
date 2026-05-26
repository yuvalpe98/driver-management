# Driver Management System

A full-stack fleet and delivery management platform built for Hebrew-speaking teams. Supports three distinct user roles — Manager, Driver, and Lab User — with role-based dashboards, real-time notifications, and a barcode-verified delivery completion flow.

## Features

### Manager
- Create and assign delivery/maintenance tasks with priority levels (Urgent / Normal / Low)
- Attach required items and serial numbers to each task
- Monitor driver progress and task statuses in real-time
- Manage the inventory and equipment catalog
- View driver inventory levels and receive low-stock alerts
- Push notifications and WhatsApp alerts when tasks are completed

### Driver
- Personal dashboard showing assigned tasks sorted by priority
- Complete deliveries with recipient signature capture and barcode scanning per item
- Track personal inventory and equipment status
- Receive push notifications for new task assignments

### Lab User
- Log equipment release records with serial number, working hours, and air purity percentage
- Associate releases with technicians and parts
- Search and filter release history with barcode scanner support

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | NextAuth 5 (JWT, credentials) |
| Validation | Zod |
| Image Storage | Cloudinary |
| Notifications | Web Push API + WhatsApp |
| Barcode Scanning | react-zxing (WASM) |
| Signature Capture | signature_pad |

## Architecture

The app uses Next.js App Router with a feature-based structure:

- **Role-based layouts** — each role (`/driver`, `/manager`, `/lab`) has its own layout with a dedicated auth guard. Users are redirected to their role's dashboard on login.
- **Server components for data fetching** — pages fetch data server-side; only interactive UI (scanner, signature canvas, forms) is client-side.
- **Row-level security** — every database query scopes data to the authenticated user's ID. Drivers can only read their own tasks and inventory.
- **Non-blocking notifications** — WhatsApp and push notifications are fire-and-forget; they never block the main operation.

### Database Schema (simplified)

```
User (DRIVER | MANAGER | LAB_USER)
  └── Task (assigned to driver, created by manager)
        └── TaskItem (items required for delivery)
              └── ScannedSerial (unique per physical unit)
        └── TaskCompletion (signature image + scanned serials)

CatalogItem (INVENTORY | EQUIPMENT)
  └── InventoryItem (driver's current stock)
  └── Equipment (driver's assigned equipment)

LabReleaseLog
  └── LabTechnician
  └── LabPart
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/yuvalpe98/driver-management
cd driver-management

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in the values — see Environment Variables section below
```

### Database Setup

```bash
# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed

# Optional: open Prisma Studio to browse data
pnpm db:studio
```

### Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the following:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/driver_management"

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""

# Cloudinary — for signature image storage (https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

For push notifications and WhatsApp, additional keys are required (see `lib/push.ts` and `lib/whatsapp.ts`).

## Deployment

This project is deployed and actively used in production by a real team. A public demo is not available in order to protect user data and system integrity.

The stack deploys cleanly to Vercel + Neon:

1. Push the repo to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add a Neon Postgres database from the Vercel Marketplace (free tier)
4. Set the remaining environment variables in Vercel's dashboard
5. Deploy — Prisma migrations run automatically during build (`prisma generate && next build`)

## Security Design

- Passwords hashed with **bcryptjs** — plaintext never stored
- All protected routes validate session with `requireAuth()` / `requireRole()` middleware
- Every database query filters by the authenticated user's ID — no cross-user data leakage
- All user inputs validated with **Zod** schemas before reaching the database
- Audit log table tracks sensitive actions with user ID and IP address

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Generate Prisma client and build for production |
| `pnpm db:migrate` | Run pending Prisma migrations |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Prisma Studio (database browser) |
| `pnpm lint` | Run ESLint |
