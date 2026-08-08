# NEXORA — MASTER DOCUMENTATION V2

## 1. Executive Summary

**What Nexora is:** Nexora is a premium Personal Productivity Operating System designed to help users execute meaningful work. It merges task management, habit tracking, project organization, and calendar scheduling into a single, cohesive, premium interface.
**Why it exists:** To eliminate the fragmentation of using separate apps for tasks (Todoist), habits (Habitica), and calendars (Google Calendar) by unifying them under one centralized database and design system.
**Core vision:** To provide a unified, distraction-free environment that acts as a "second brain" for highly productive individuals, utilizing intelligent analytics (Kyro) to guide daily focus.
**Mission:** To empower individuals to take control of their time and goals with a tool that is as beautiful as it is functional.
**Target Users:** Entrepreneurs, software engineers, students, and professionals who juggle multiple projects and habits and require a beautifully designed, high-performance tool.
**Problems Solved:** Context switching fatigue, scattered data, lack of integrated analytics, and poor aesthetic experiences in traditional productivity tools.
**Long-term roadmap:** Evolving from a structured task manager into a true AI-driven operating system with generative coaching (Kyro), collaborative workspaces, and automated timeline conflict resolution.

## 2. Technology Stack

*   **Next.js 16 (App Router):** The core React framework used for SSR (Server-Side Rendering), routing, API endpoints, and Server Actions. It provides optimal performance and SEO.
*   **React 19:** UI library used for building interactive components.
*   **TypeScript 5:** Strongly typed programming language ensuring code safety and reducing runtime errors.
*   **TailwindCSS 4:** Utility-first CSS framework used for rapid UI development and implementing the specific "Deep Space" premium design system.
*   **Supabase (PostgreSQL):** Backend-as-a-Service providing the PostgreSQL database, Row Level Security (RLS), and Edge Functions.
*   **Supabase SSR Auth:** Handles secure, cookie-based authentication and session management across server and client components.
*   **Server Actions:** Next.js feature used for secure, server-side data mutations without needing dedicated API routes.
*   **Zustand:** Lightweight client-side state management used for optimistic UI updates (e.g., toggling task completion instantly before server confirmation).
*   **shadcn/ui:** Accessible, customizable, and unstyled UI primitive components (Dialogs, Selects, Cards).
*   **Recharts:** Composable charting library built on React components used for the Analytics dashboard.
*   **FullCalendar:** Advanced, full-sized drag & drop calendar library for the Calendar and Timetable features.
*   **next-themes:** Abstraction for implementing light/dark/system theme switching.
*   **lucide-react:** Clean, consistent SVG icon set.
*   **date-fns:** Modern JavaScript date utility library.

## 3. Folder Structure

```text
/src
├── app/                  # Next.js App Router (pages, layouts, middleware)
│   ├── (auth)/           # Public routes (login, register)
│   ├── (dashboard)/      # Protected routes wrapped in DashboardLayout
│   ├── api/              # API routes (e.g., seed data)
│   ├── globals.css       # Global styles, OKLCH color variables, custom utilities
│   └── layout.tsx        # Root layout, providers
├── components/           # Global shared UI components
│   ├── ui/               # shadcn UI primitives (Button, Card, Input, etc.)
│   ├── layout/           # Header, Sidebar, Navigation components
│   └── theme-provider.tsx# next-themes integration
├── features/             # Domain-driven feature modules
│   ├── analytics/        # Analytics actions and Recharts components
│   ├── calendar/         # FullCalendar integration
│   ├── focus/            # Deep work timer components
│   ├── goals/            # Goal setting and tracking
│   ├── habits/           # Habit tracking and streaks
│   ├── projects/         # Project CRUD
│   ├── settings/         # User preferences
│   ├── subtasks/         # Task breakdown
│   ├── tasks/            # Task management and Kyro prioritization
│   └── timetable/        # Fixed weekly block schedule
├── lib/                  # Utilities
│   ├── supabase/         # Supabase client singletons (server, client, middleware)
│   └── utils.ts          # Tailwind class merger (cn)
├── store/                # Zustand global stores
│   ├── useProjectStore.ts
│   └── useTaskStore.ts
└── types/                # TypeScript definitions
    └── database.types.ts # Generated Supabase types
```

## 4. Feature Documentation

### Dashboard
*   **Purpose:** Central hub for a quick glance at today's focus, recent projects, habit streaks, and upcoming events.
*   **Current implementation:** Real-time data aggregation via Server Components. Uses premium `glass-card` styling.
*   **How it works:** Fetches data from multiple modules concurrently and displays them in interactive widgets.
*   **Files involved:** `src/app/(dashboard)/dashboard/page.tsx`
*   **Dependencies:** `lucide-react`, `date-fns`
*   **Database tables:** `tasks`, `projects`, `habits`, `analytics`, `calendar_events`
*   **Server Actions:** Aggregates data from respective feature actions.
*   **Known limitations:** Layout is fixed.
*   **Missing functionality:** Drag-and-drop widget rearrangement.
*   **Future improvements:** Fully personalized dashboard layouts.

### Tasks
*   **Purpose:** Tracking actionable items.
*   **Current implementation:** Client-side optimistic updates synchronized with Supabase.
*   **How it works:** Uses `useTaskStore` to update UI instantly, while Server Actions update the DB. Features Kyro Smart Sort heuristics (Eisenhower matrix).
*   **Files involved:** `src/features/tasks/*`
*   **Dependencies:** `zustand`
*   **Database tables:** `tasks`, `task_tags`
*   **Server Actions:** `createTask`, `toggleTaskStatus`, `deleteTask`, `getTasks`
*   **Known limitations:** No recurring tasks native functionality.
*   **Missing functionality:** Task dependencies (blocking/blocked by).
*   **Future improvements:** Natural language task creation.

### Projects
*   **Purpose:** Grouping tasks into larger goals.
*   **Current implementation:** CRUD operations using Supabase Server Actions and Zustand for client state.
*   **How it works:** Projects have colors and statuses. Tasks are linked via `project_id`.
*   **Files involved:** `src/features/projects/*`
*   **Dependencies:** `zustand`
*   **Database tables:** `projects`
*   **Server Actions:** `createProject`, `updateProject`, `deleteProject`
*   **Known limitations:** Lacks advanced project views (Kanban/Gantt).
*   **Missing functionality:** File attachments.
*   **Future improvements:** Rich-text project wikis.

### Subtasks
*   **Purpose:** Breaking down complex tasks.
*   **Current implementation:** Accordion UI within the task list.
*   **How it works:** Linked to a parent `task_id`.
*   **Files involved:** `src/features/subtasks/*`
*   **Database tables:** `subtasks`
*   **Known limitations:** Only one level deep.
*   **Missing functionality:** Subtask specific due dates.

### Habits
*   **Purpose:** Building consistent routines.
*   **Current implementation:** Server Actions logging completions to a junction table.
*   **How it works:** Calculates streaks dynamically. Uses premium rounded card UI.
*   **Files involved:** `src/features/habits/*`
*   **Database tables:** `habits`, `habit_completions`
*   **Server Actions:** `toggleHabitCompletion`
*   **Known limitations:** Streak algorithm is strictly consecutive calendar days; no "forgiveness" days.
*   **Missing functionality:** Detailed habit historical heatmaps (currently only high-level analytics exists).

### Goals
*   **Purpose:** Tracking Daily, Weekly, and Monthly objectives.
*   **Current implementation:** Dedicated dashboard with visual completion states.
*   **How it works:** Filters goals by timeframe.
*   **Files involved:** `src/features/goals/*`
*   **Database tables:** (Shares schema with tasks/projects conceptually, specific implementation details vary).

### Calendar
*   **Purpose:** Visualizing time commitments.
*   **Current implementation:** Integrates `@fullcalendar/react`.
*   **How it works:** Pulls data from `calendar_events`, `tasks`, and `projects`. Features interactive drag & drop.
*   **Files involved:** `src/features/calendar/*`
*   **Dependencies:** `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`, `@fullcalendar/timegrid`
*   **Database tables:** `calendar_events`, `tasks`, `projects`
*   **Known limitations:** Mobile responsiveness on complex grid views.
*   **Missing functionality:** 2-way sync with Google Calendar/Outlook.

### Focus Mode
*   **Purpose:** Immersive deep work sessions.
*   **Current implementation:** Dedicated `/focus` page and a global floating timer.
*   **How it works:** Runs Pomodoro and Deep Work sessions. Syncs to analytics.
*   **Files involved:** `src/features/focus/*`
*   **Database tables:** Updates `analytics` and `tasks` (`actual_time_minutes`).
*   **Future improvements:** Strict website blocking during focus.

### Analytics
*   **Purpose:** Measuring productivity over time.
*   **Current implementation:** Recharts integration displaying data.
*   **How it works:** Generates GitHub-style heatmaps and bar/pie charts.
*   **Files involved:** `src/features/analytics/*`
*   **Dependencies:** `recharts`
*   **Database tables:** `analytics`, `tasks`, `habits`
*   **Known limitations:** Historical data limited to current and previous weeks in the UI.
*   **Missing functionality:** Custom date range filtering.

### Settings
*   **Purpose:** Application configuration.
*   **Current implementation:** Persists to `user_preferences` table.
*   **How it works:** Controls theme, accent color (updates CSS variables globally), and strict mode.
*   **Files involved:** `src/features/settings/*`
*   **Database tables:** `user_preferences`
*   **Missing functionality:** Account deletion pipeline.

### Authentication
*   **Purpose:** Securing user data.
*   **Current implementation:** Supabase SSR Auth with Next.js middleware.
*   **How it works:** Email/password login, registration, secure session persistence.
*   **Files involved:** `src/app/(auth)/*`, `src/lib/supabase/middleware.ts`
*   **Dependencies:** `@supabase/ssr`
*   **Missing functionality:** Social OAuth providers, password reset UI.

### Theme
*   **Purpose:** Visual aesthetic control.
*   **Current implementation:** `next-themes` with custom OKLCH variables.
*   **How it works:** Injects variables at the `DashboardLayout` level based on user preference.

### Notifications
*   **Purpose:** System alerts and reminders.
*   **Current implementation:** Database schema exists.
*   **How it works:** Tracks `is_read` status for various alert types.
*   **Missing functionality:** Client-side push mechanism and UI inbox are missing.

### Kyro (Smart Insights)
*   **Purpose:** Actionable productivity advice.
*   **Current implementation:** Rule-based logic engine in `src/features/analytics/actions.ts`.
*   **How it works:** Calculates weekly growth, deadline warnings, and streak celebrations.
*   **Known limitations:** Hardcoded logic paths.
*   **Missing functionality:** True LLM integration for personalized coaching.

## 5. Database Documentation

### `profiles`
*   **Purpose:** User metadata.
*   **Columns:** `id` (UUID, PK, FK to auth.users), `full_name` (TEXT), `avatar_url` (TEXT), `created_at`, `updated_at`.
*   **Relationships:** 1:1 with `auth.users`.

### `user_preferences`
*   **Purpose:** Global app settings.
*   **Columns:** `id` (UUID, PK, FK to profiles), `theme` (TEXT), `timezone` (TEXT), `email_notifications` (BOOLEAN), `accent_color` (TEXT), `strict_mode` (BOOLEAN), `ai_insights` (BOOLEAN).
*   **Relationships:** 1:1 with `profiles`.

### `categories` & `tags`
*   **Purpose:** Taxonomy for organization.
*   **Columns:** `id`, `user_id` (FK to auth.users), `name`, `color`.

### `projects`
*   **Purpose:** Goal groupings.
*   **Columns:** `id`, `user_id`, `category_id`, `name`, `description`, `color`, `status` (active, archived, completed), `due_date`, `deleted_at`.
*   **Relationships:** 1:M with `tasks`.

### `tasks`
*   **Purpose:** Action items.
*   **Columns:** `id`, `user_id`, `project_id`, `title`, `description`, `priority` (low, medium, high, urgent), `status` (todo, in_progress, done), `due_date`, `is_schedule_for_today`.
*   **Relationships:** M:1 with `projects`. 1:M with `subtasks`.

### `subtasks`
*   **Purpose:** Task children.
*   **Columns:** `id`, `user_id`, `task_id`, `title`, `is_completed`.

### `habits`
*   **Purpose:** Routines.
*   **Columns:** `id`, `user_id`, `name`, `frequency` (daily, weekly, weekdays), `color`, `streak`.
*   **Relationships:** 1:M with `habit_completions`.

### `habit_completions`
*   **Purpose:** Junction tracking dates of completion.
*   **Columns:** `id`, `user_id`, `habit_id`, `completed_date`.
*   **Constraints:** UNIQUE(`habit_id`, `completed_date`).

### `timetable_slots`
*   **Purpose:** Fixed weekly blocks.
*   **Columns:** `id`, `user_id`, `day_of_week` (0-6), `start_time`, `end_time`, `label`, `color`.

### `calendar_events`
*   **Purpose:** One-off events.
*   **Columns:** `id`, `user_id`, `title`, `start_time`, `end_time`, `is_all_day`.

### `notifications`
*   **Purpose:** System alerts.
*   **Columns:** `id`, `user_id`, `title`, `message`, `type` (system, reminder, achievement, kyro), `is_read`.

### `analytics`
*   **Purpose:** Daily snapshot tracking.
*   **Columns:** `id`, `user_id`, `date`, `tasks_completed`, `habits_completed`, `focus_time_minutes`.

**Database Mechanics:**
*   **RLS Policies:** Enabled on all tables (`auth.uid() = user_id`), ensuring strict tenant isolation.
*   **Triggers:** `handle_updated_at` runs before updates. `handle_new_user` creates profile/preferences on signup.

## 6. Authentication System

*   **Production Login:** Email/password via Supabase Auth.
*   **Supabase Auth:** `@supabase/ssr` manages secure, HTTP-only cookies.
*   **Protected Routes:** Next.js Middleware intercepts requests to `/(dashboard)/*` and redirects unauthenticated users to `/login`.
*   **Current issues:** No social OAuth providers; missing password reset flow.
*   **Security considerations:** Excellent. RLS enforces tenant isolation at the database level, preventing cross-user data access even if API routes are compromised.

## 7. Application Flow

1.  **Login:** User authenticates via `/login`.
2.  **Dashboard:** Middleware redirects to `/dashboard`. Server fetches aggregate data. Skeletons render during fetch.
3.  **Tasks:** User visits `/tasks` to capture actionable items. Prioritizes via Kyro heuristics (Eisenhower Matrix).
4.  **Projects:** User links tasks to Projects to track overarching goals.
5.  **Calendar:** User visualizes deadlines. Unscheduled tasks can be dragged onto the calendar to assign due dates.
6.  **Focus Mode:** User enters deep work sessions via the global timer or `/focus` page.
7.  **Analytics:** User reviews weekly progress and reads Kyro's generated insights.
8.  **Logout:** Session is destroyed securely.

## 8. Current Progress

*   Dashboard: 95%
*   Calendar: 90%
*   Tasks: 95%
*   Projects: 90%
*   Goals: 80%
*   Habits: 90%
*   Focus: 95%
*   Analytics: 85%
*   Timetable: 75%
*   Notifications: 10% (Backend only)
*   Kyro AI: 10% (Rule-based only)

**Overall Completion:** ~85%
**Estimated production readiness:** Highly stable. Ready for soft launch (beta), pending Notifications UI and external Calendar Sync.

## 9. Known Issues

*   **Performance bottlenecks:** WASM bindings for SWC on Windows cause occasional build/lockfile warnings. Edge runtime usage disables static generation on some pages.
*   **Missing integrations:** True LLM Integration for Kyro is missing. No Google Calendar sync.
*   **Incomplete features:** Notifications UI is unbuilt. Timetable UI lacks conflict detection.
*   **Logic:** Habit streak algorithm is unforgiving (no grace periods).

## 10. Technical Debt

*   **Repeated logic:** Some data fetching logic in `actions.ts` files across modules could be abstracted into a unified `queryClient` or shared service layer.
*   **Large components:** `TaskList.tsx` and `AnalyticsDashboard.tsx` are growing large and could be split into smaller sub-components.
*   **Missing abstractions:** Accent color CSS variables are hardcoded hex string mappings rather than algorithmic OKLCH transformations.

## 11. Performance Analysis

*   **Server rendering:** Excellent. Heavy data aggregation happens on the server via `actions.ts`, shipping minimal JS to the client.
*   **Client rendering:** Optimized. Zustand prevents prop drilling and minimizes unnecessary re-renders during optimistic UI updates.
*   **Hydration:** Fast. Skeleton loaders provide immediate feedback.
*   **Optimization opportunities:** Implement `React.memo` or `useMemo` on heavy FullCalendar views and Recharts components. Add caching (e.g., Redis or Next.js Data Cache) for daily analytics aggregates.

## 12. UI/UX Analysis

*   **Consistency:** 10/10. Unified `glass-card` styling, `smooth-ring` focus states, and consistent `max-w-7xl` layouts.
*   **Typography:** 9/10. Geist sans/mono looks incredibly professional.
*   **Colors:** 10/10. The Deep Space theme with OKLCH dynamic accent colors is striking and modern.
*   **Animations:** 9/10. Subtle scale and opacity transitions on hover make the app feel alive without being distracting.
*   **Responsiveness:** 8/10. Great on desktop and tablet. Complex calendar and timetable grids need slight mobile optimization.
*   **Professionalism:** 10/10. Looks and feels like a premium SaaS product (Arc/Linear aesthetic).

## 13. Feature Dependency Map

```text
User Preferences
│
├──> Theme / Layout
│
├──> Projects <──> Categories / Tags
│    │
│    └──> Tasks
│         │
│         ├──> Subtasks
│         │
│         ├──> Calendar (Due Dates)
│         │
│         └──> Focus (Actual Time Spent)
│              │
│              └──> Analytics (Productivity Score)
│                   │
│                   └──> Kyro (Insights Generation)
│
└──> Habits
     │
     └──> Habit Completions
          │
          └──> Analytics (Streak Tracking)
```

## 14. Missing Integrations

*   **Calendar -> External Providers:** Cannot sync Nexora events out to Google Calendar/Outlook.
*   **Focus -> Projects:** Focus sessions track time on Tasks, but rolling up total time spent at the Project level is not fully visualized in the UI.
*   **Notifications -> Kyro:** Kyro generates insights, but cannot proactively push them to the user via the Notification inbox.

## 15. Future Roadmap

*   **Milestone 1: Stable Core** (COMPLETED)
*   **Milestone 2: Connected Productivity Engine** (COMPLETED)
*   **Milestone 3: Premium UX** (COMPLETED)
*   **Milestone 4: Kyro Intelligence** (Pending - True LLM Integration)
*   **Milestone 5: Production Ready** (Pending - Notifications, OAuth, Mobile Polish)
*   **Milestone 6: Ecosystem Expansion** (Future - Mobile App, Browser Extension)

## 16. Code Quality Audit

*   **Architecture:** 9/10 (Domain-driven App Router structure)
*   **Maintainability:** 8/10 (Clear separation of concerns, strong TypeScript typing)
*   **Scalability:** 9/10 (Supabase RLS and Next.js Edge capabilities)
*   **Readability:** 8/10 (Clean code, needs slightly more inline comments for complex heuristics)
*   **Testing readiness:** 7/10 (Architecture supports it, but unit/e2e tests are not yet written)
*   **Production readiness:** 8/10 (Stable, but requires a few minor feature completions)
*   **Security:** 9/10 (Supabase SSR Auth + strict RLS policies)

## 17. Final Assessment

*   **What is excellent?** The UI/UX design, visual consistency, optimistic state management (Zustand), and strict database security (RLS).
*   **What is average?** The analytics insights (currently just rule-based `if/else` statements).
*   **What is unfinished?** Notifications inbox, True LLM Kyro integration, Google Calendar sync.
*   **What should never be changed?** The core "Deep Space" visual identity and the domain-driven folder structure (`src/features/*`).
*   **What must be redesigned?** The Timetable UI (needs better mobile handling and conflict detection).
*   **What should be the highest priority before adding new features?** Implementing the Notifications UI and migrating Kyro to a true LLM (Sprint 3) to fulfill the "Productivity OS" vision.
