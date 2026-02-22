# My Ledger — Shared Expense Tracker

A full-stack expense tracker built with the latest tech stack, using **Bun** as the JavaScript runtime and package manager.

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| **Bun** | latest (≥1.1) | Runtime + package manager |
| **Next.js** | 15.2 (Turbopack) | Full-stack framework |
| **React** | 19 | UI library |
| **TypeScript** | 5.7 | Type safety |
| **Tailwind CSS** | 3.4 | Styling |
| **NextAuth.js** | v5 beta.25 | Authentication (Google OAuth) |
| **Prisma** | 6.x | ORM |
| **PostgreSQL** | any (Neon recommended) | Database |
| **Redux Toolkit** | 2.5 | Global state |
| **React Hook Form** | 7.5 | Form handling |
| **Zod** | 3.24 | Schema validation |
| **pdf-lib** | 1.17 | PDF generation |
| **date-fns** | 4.x | Date helpers |
| **Lucide React** | latest | Icons |

---

## Features

- 🔐 Google OAuth sign-in (NextAuth v5)
- 📁 Multiple ledger projects per user
- 👥 Unlimited participants per project
- 💰 Itemized expense entries with quantities
- 📊 Per-participant breakdown with progress bars
- ⚖️ Automatic minimum-transfer settlement guide
- 📄 PDF export — weekly / monthly / yearly
- 🔍 Full-text search + filter by payer / date range
- 🌙 Dark mode (persisted via Redux)
- 🛡️ Rate limiting on all API routes
- 📱 Fully responsive layout

---

## Quick Start

### 1. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Clone & install dependencies

```bash
git clone <your-repo>
cd my-ledger
bun install
```

### 3. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

**Required values:**

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Neon / Supabase / Railway PostgreSQL |
| `DIRECT_URL` | Same as above (for Prisma migrations) |
| `AUTH_SECRET` | Run: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | [Google Cloud Console](https://console.cloud.google.com) |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console |

**Google OAuth setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. **Create OAuth 2.0 Client ID** → Web application
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Secret into `.env.local`

### 4. Set up the database

```bash
# Generate Prisma client
bun db:generate

# Push schema to your database (dev)
bun db:push

# Or run migrations (production)
bun db:migrate
```

### 5. Run the app

```bash
# Development (with Turbopack HMR)
bun dev

# Production build
bun build
bun start
```

---

## Project Structure

```
my-ledger/
├── app/
│   ├── (auth)/login/           # Login page (public)
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   ├── projects/           # CRUD – projects
│   │   ├── expenses/           # CRUD – expenses
│   │   └── export/             # PDF export
│   ├── dashboard/
│   │   ├── page.tsx            # Overview
│   │   └── projects/
│   │       ├── page.tsx            # Project list
│   │       ├── new/page.tsx        # Create project
│   │       └── [id]/
│   │           ├── page.tsx                # Project detail
│   │           └── expenses/new/page.tsx   # Add expense
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Landing page
├── components/
│   ├── layout/                 # Sidebar, TopBar
│   ├── ui/                     # Toaster
│   ├── expenses/               # DeleteExpenseButton, ExpenseSearchFilter
│   ├── projects/               # ExportButton
│   └── Providers.tsx
├── hooks/
│   └── redux.ts                # Typed Redux hooks
├── lib/
│   ├── pdf-export.ts           # pdf-lib report generator
│   ├── prisma.ts               # Prisma singleton
│   ├── rate-limit.ts           # In-memory IP rate limiter
│   ├── utils.ts                # formatCurrency, calculateSettlements, etc.
│   └── validations.ts          # Zod schemas
├── prisma/
│   └── schema.prisma
├── store/
│   ├── index.ts
│   └── slices/
│       ├── expensesSlice.ts
│       ├── projectsSlice.ts
│       └── uiSlice.ts
├── types/
│   └── index.ts                # All shared TypeScript types
├── auth.ts                     # NextAuth v5 config
├── middleware.ts               # Route protection
├── bunfig.toml                 # Bun config
└── next.config.ts
```

---

## Useful Commands

```bash
bun dev           # Start dev server
bun build         # Production build
bun start         # Start production server
bun lint          # ESLint
bun db:generate   # Generate Prisma client
bun db:push       # Push schema to DB (dev/prototype)
bun db:migrate    # Create & run migrations (production)
bun db:studio     # Open Prisma Studio (DB GUI)
```
