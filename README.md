# Nexora — Personal Productivity Operating System

Nexora is a unified personal productivity operating system designed to merge task management, habit tracking, project planning, focus sessions, and calendar scheduling into a single, cohesive, premium interface.

---

## Technology Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org) (Canary release)
- **UI Library:** [React 19](https://react.dev)
- **Language:** [TypeScript 5](https://www.typescriptlang.org)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) with OKLCH design tokens
- **Database & Auth:** [Supabase](https://supabase.com) (PostgreSQL, Row-Level Security, `@supabase/ssr`)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs) (Optimistic client state)
- **Calendar:** [FullCalendar](https://fullcalendar.io) (DayGrid, TimeGrid, Interaction)
- **Charts:** [Recharts](https://recharts.org)
- **Testing:** [Vitest](https://vitest.dev)

---

## Project Structure

```text
src/
├── app/
│   ├── (auth)/            # Public authentication routes (login, register)
│   ├── (dashboard)/       # Protected application pages (tasks, habits, calendar, etc.)
│   ├── api/               # API route handlers
│   ├── layout.tsx         # Root layout and theme providers
│   └── proxy.ts           # Next.js 16 edge request interceptor / session handler
├── components/            # Shared design-system components and layouts
├── features/              # Feature-sliced domain modules
│   ├── analytics/         # Productivity telemetry & weekly review
│   ├── auth/              # Supabase SSR authentication actions
│   ├── calendar/          # Calendar providers, sync logic, and mappers
│   ├── dashboard/         # Dashboard summary widgets
│   ├── focus/             # Focus timer (Pomodoro/Stopwatch) & session logging
│   ├── goals/             # Daily, weekly, and monthly goal tracking
│   ├── habits/            # Habit tracker & streak engine
│   ├── kyro/              # Algorithmic scheduling engine & Web Worker
│   ├── notifications/     # Notification drawer & system alert generator
│   ├── projects/          # Project categorization & task grouping
│   ├── settings/          # User preferences & profile settings
│   ├── tasks/             # Task CRUD, priorities, tags, and subtasks
│   └── timeline/          # FullCalendar view & weekly timetable schedule
├── lib/                   # Core Supabase clients, sync queue, and utilities
├── store/                 # Zustand client stores
└── types/                 # Database and domain TypeScript definitions
```

---

## Getting Started

### 1. Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### 2. Environment Variables
Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Testing Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npm run build` | Builds production bundle using webpack |
| `npm run typecheck` | Validates TypeScript contracts across all files (`tsc --noEmit`) |
| `npm run test` | Runs unit test suites with Vitest (`vitest run`) |
| `npm run verify` | Runs full static verification (`typecheck` + `test`) |
| `npm run lint` | Runs ESLint analysis |

---

## Current Implementation Status

- **Authentication:** Verified working with Supabase SSR cookies.
- **Tasks & Subtasks:** Verified working with CRUD, priority filters, and Supabase RLS persistence.
- **Habits Tracking:** Verified working with completion logging and streak calculations.
- **Focus Sessions:** Verified working with countdown/stopwatch modes and analytical logging.
- **Projects & Goals:** Verified working with active/completed status filtering.
- **Internal Calendar:** Verified working via FullCalendar integration.
- **Kyro Scheduling:** Mathematical constraint engine verified in unit tests (UI connection in progress).
- **External Calendars:** Google and Outlook providers are currently stubs.
- **Voice Automation:** Planned future capability (not yet implemented).
