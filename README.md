# Indivisible

Shared household task management for couples. Make it visible. Share the load.

## Overview

Indivisible is a real-time collaborative task management app designed for couples sharing a household. Both partners see the same lists, tasks, and progress — nothing falls through the cracks.

### Key Features (Phase 1 MVP)

- **Shared Lists** — Create lists for groceries, house projects, kids, etc.
- **Task Management** — Add, assign, prioritize, and complete tasks with two taps
- **Real-Time Sync** — Changes appear instantly on both devices via Supabase Realtime
- **Dashboard** — See what needs attention: overdue, today, upcoming, and workload balance
- **Household Invite** — One partner creates a household, the other joins with an invite code
- **Mobile-First** — Designed for phones with bottom tab navigation and touch-friendly UI

### Phase Roadmap

| Phase | Features | Status |
|-------|----------|--------|
| 1 | Core task management, lists, dashboard, auth, real-time sync | Current |
| 2 | Push notifications, reminders, recurring tasks | Planned |
| 3 | AI assistant (Claude), smart suggestions, chat interface | Planned |
| 4 | Google Calendar sync, Gmail forwarding, calendar view | Planned |
| 5 | Location reminders, offline support, dark mode, PWA | Planned |

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Row-Level Security)
- **Build:** Vite 6 with SWC
- **Hosting:** Vercel (frontend), Supabase (backend)

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings > API

### 2. Run Database Migrations

In the Supabase SQL Editor, run these files in order:

1. `supabase/migrations/00001_initial_schema.sql` — Tables, enums, indexes, triggers
2. `supabase/migrations/00002_rls_policies.sql` — Row-Level Security policies

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Create Your First Household

1. Sign up with an email and password
2. Create a new household (give it a name)
3. Share the invite code with your partner
4. Your partner signs up and enters the invite code

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── auth/         # Auth layout, protected routes
│   ├── dashboard/    # Dashboard-specific components
│   ├── layout/       # App layout, bottom nav, header
│   ├── lists/        # List cards and forms
│   ├── settings/     # Settings sections
│   ├── tasks/        # Task rows, filters, forms
│   └── ui/           # Generic UI: Button, Modal, Badge, etc.
├── contexts/         # Auth and Toast context providers
├── hooks/            # Custom React hooks for data fetching
├── lib/              # Supabase client, utilities
├── pages/            # Route-level page components
├── types/            # TypeScript interfaces and Supabase types
└── styles/           # Global styles
```

## Deployment to Vercel

1. Push this repository to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel will auto-detect Vite and configure the build

The `vercel.json` file handles SPA routing (all routes serve `index.html`).
