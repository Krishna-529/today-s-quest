# My Daily Quest

## Purpose and Motivation

My Daily Quest is a thoughtfully designed, minimalistic task manager built to help users organize daily goals with clarity and calm. The project aims to reduce cognitive overload by providing a focused interface for managing tasks, projects, priorities, and notes, while supporting modern features like drag-and-drop ordering, archiving, and offline Progressive Web App (PWA) capabilities. The motivation is to create a tool that feels lightweight yet powerful, suitable for both personal and professional use, and easily extensible for future needs.

---

## High-Level Architecture

The application is a single-page React app, bootstrapped with Vite for fast development and build times. It leverages TypeScript for type safety, Radix UI and shadcn/ui for accessible UI primitives, and Tailwind CSS for rapid styling. State management and data fetching are handled via custom React hooks and TanStack Query, ensuring efficient, cache-aware interactions with the backend. Supabase provides authentication and a Postgres database for persistent storage. The app is installable as a PWA, with offline support via a service worker and manifest configuration.

### Main Layers

- **Frontend UI**: React components, organized by feature (tasks, projects, calendar, notes, etc.), with reusable UI primitives.
- **State & Data**: Custom hooks encapsulate all data logic, using TanStack Query for fetching, mutations, and cache updates.
- **Backend Integration**: Supabase client handles authentication and CRUD operations for tasks, projects, notes, and archived tasks.
- **PWA Layer**: Manifest and service worker enable offline access and installability.

---

## Module-by-Module Explanation

### Entry Point and Routing

- **src/main.tsx**: Initializes the React app, registers the service worker for PWA, and renders the root `<App />` component.
- **src/App.tsx**: Sets up global providers (TanStack Query, tooltips, toasts), and configures routing for the main pages (`Index`, `Auth`, `NotFound`).

### Core Pages

- **src/pages/Index.tsx**: The main dashboard, orchestrating all task/project/note/calendar logic. Handles view modes (today, tomorrow, upcoming, all, calendar, archived), project selection, completion filtering, and modal dialogs for notes and task forms. Integrates all major hooks and components, and manages UI state transitions.
- **src/pages/Auth.tsx**: Authentication page supporting email/password and Google OAuth via Supabase. Handles login, signup, and redirects, with error handling and feedback.
- **src/pages/NotFound.tsx**: Simple 404 page for invalid routes.

### Components

- **TaskList / DraggableTaskList**: Render lists of tasks, supporting toggling, editing, deleting, pinning, and drag-and-drop reordering (via @dnd-kit). `DraggableTaskList` manages local order state and updates the backend order_index.
- **TaskForm**: Modal dialog for creating/editing tasks, with validation for required fields, due dates, and project tags. Handles both new and edit flows, and resets state on open/close.
- **Dashboard**: Displays summary cards for today's/tomorrow's tasks, completion rates, and upcoming tasks, using date utilities for accurate filtering.
- **CalendarView**: Integrates a calendar UI, highlighting dates with tasks and showing tasks for the selected date. Uses date normalization for timezone consistency.
- **ProjectsPanel / MobileProjectsDropdown**: List and manage projects, with color selection, add/delete actions, and view mode switching. Ensures only active projects are shown, and handles edge cases for deletion (clearing selection if deleted).
- **ArchivedTasks**: Displays archived tasks, grouped by date, with project names preserved for readability even after project deletion.
- **NotesModal**: Modal for viewing/editing notes scoped to date/project, supporting both edit and view-only modes.
- **NavigationSidebar**: Mobile sidebar for switching views, tabs, completion filters, and triggering archive/sign-out actions.

### Hooks

- **useTasks**: Encapsulates all task CRUD logic. Fetches tasks from Supabase, maps fields to frontend types, and exposes mutations for add, update, delete, toggle, pin, and reorder. Handles order_index for drag-and-drop, and ensures cache is updated after mutations.
- **useProjects**: Manages project CRUD, filtering only active projects for UI, and mapping color/name fields. Ensures backward compatibility for missing columns.
- **useArchivedTasks**: Handles fetching, archiving, deleting, and clearing archived tasks. Archives are triggered manually, copying project names for future readability. Computes stats (total, completed, avg days past due) client-side for dashboard insights.
- **useAuth**: Manages authentication state, sign-in, sign-out, and redirects.
- **useLocalStorage, useMobile, useLadders, useOverdueTasks**: Utility hooks for device detection, local storage, and advanced flows.

### Utilities and Types

- **lib/dateUtils.ts**: Provides timezone-aware date formatting and normalization (IST), ensuring all date comparisons and displays are consistent regardless of user locale.
- **lib/utils.ts**: Utility for merging Tailwind and clsx class names, simplifying conditional styling.
- **types/index.ts**: Type definitions for Task, Project, ArchivedTask, Note, and related enums. Ensures type safety across all modules.

### Backend Integration

- **integrations/supabase/client.ts**: Configures the Supabase client with environment variables, PKCE flow for OAuth, and session persistence. All hooks use this client for database operations.

### Configuration and PWA

- **manifest.json**: Defines PWA metadata, icons, theme color, and display mode. Ensures installability and proper OS integration.
- **public/service-worker.js**: Minimal service worker for offline caching and update notifications.
- **vite.config.js**: Vite configuration, including PWA plugin, dev server settings, and component tagging for development.
- **tailwind.config.ts, postcss.config.js, eslint.config.js**: Styling and linting configuration for maintainable code.

---

## Key Algorithms, Logic, and Workflows

### Task Ordering and Drag-and-Drop

Tasks are ordered using an `order_index` field, updated via drag-and-drop in `DraggableTaskList`. The frontend maintains local order state, and on drop, updates the backend for all affected tasks. This ensures consistent ordering across devices and sessions.

### Archiving Past-Due Tasks

Archiving is a manual workflow, triggered by the user. The system fetches all tasks, filters those past their due date, and moves them to the `archived_tasks` table, copying project names for future readability. This avoids unexpected background mutations and ensures user control. Stats are computed client-side for dashboard insights.

### Date Handling and Timezone Consistency

All date logic uses IST (Asia/Kolkata) via `date-fns-tz`, ensuring that due dates, calendar views, and archiving are consistent regardless of user locale or device timezone. Dates are normalized to `YYYY-MM-DD` for comparison and display.

### Authentication and Security

Supabase Auth is used for secure login/signup, supporting both email/password and OAuth (Google). The PKCE flow is used for OAuth, and session persistence is enabled. Redirect URLs are validated both in the frontend and Supabase dashboard to prevent misconfiguration.

### PWA and Offline Support

The app registers a service worker and exposes a manifest, enabling offline access and installability. Update notifications are handled via the service worker, prompting users to reload when a new version is available.

---

## Challenges and Design Decisions

- **Manual Archiving**: Automatic archiving was avoided to prevent unexpected data loss or background mutations. Manual triggers ensure user intent and transparency.
- **Project Name Preservation**: When archiving, project names are copied to archived tasks, so even if a project is deleted, archived tasks remain readable. This required careful mapping and fallback logic.
- **Timezone Handling**: Ensuring all date logic is consistent across devices required explicit normalization and use of timezone libraries.
- **Drag-and-Drop Performance**: Updating order_index for all tasks after a reorder is optimized to minimize backend writes and ensure UI responsiveness.
- **PWA Icon Caching**: OS-level caching of icons (especially on Windows) required documentation and user guidance for clearing caches after updates.

---

## Edge Cases, Validations, and Constraints

- **Task Creation**: Validates required fields, due dates, and project tags. Handles empty states gracefully.
- **Project Deletion**: If a selected project is deleted, selection is cleared to avoid UI errors.
- **Archiving**: Only tasks with a due date before today are archived. If no past-due tasks exist, the user is notified.
- **Authentication**: Handles errors and misconfigurations, with user feedback for all auth flows.
- **Offline Mode**: UI disables actions that require network when offline, and caches data for read-only access.

---

## Ensuring Correctness, Performance, and Scalability

- **Type Safety**: TypeScript is used throughout, with strict types for all entities and API responses.
- **React Query**: Ensures cache consistency, background refetching, and error handling for all data flows.
- **Modular Design**: Components and hooks are decoupled, making the system easy to extend and maintain.
- **Backend Efficiency**: Only necessary fields are fetched, and mutations are batched where possible.
- **PWA**: Service worker and manifest ensure fast load times and offline reliability.

---

## Developer Guide: Understanding Functions and Features

### Task Management

- **Add/Edit/Delete/Toggle/Pin**: All flows are exposed via `useTasks`, with clear mutation functions. UI components call these via props, and state is updated via React Query cache.
- **Drag-and-Drop**: `DraggableTaskList` manages local state and calls `onReorder` to update backend order_index.

### Project Management

- **Add/Delete**: Managed via `useProjects`, with color selection and validation. Only active projects are shown in the UI.

### Archiving

- **Manual Trigger**: User clicks "Archive Past Due"; `useArchivedTasks` moves tasks and updates stats. Archived tasks retain project names for readability.

### Calendar and Notes

- **CalendarView**: Highlights dates with tasks, shows tasks for selected date, and uses IST normalization for accuracy.
- **NotesModal**: Allows notes per date/project, supporting both edit and view-only modes.

### Authentication

- **Supabase Auth**: Handles login/signup, session persistence, and redirects. Errors are surfaced to the user via toasts.

### PWA

- **Manifest and Service Worker**: Enable installability and offline access. Update notifications prompt users to reload for new versions.

---

## Getting Started

1. Clone the repository and run `npm install`.
2. Configure `.env` with your Supabase credentials and redirect URL.
3. Start the dev server with `npm run dev`.
4. (Optional) Generate favicon with `npm run generate:favicon`.
5. Open the app at the printed local address.

---

## Contributing

Fork the repo, create a feature branch, and open a PR with a clear description and screenshots as needed. See the code comments and this README for guidance on architecture and design decisions.
- Archive past-due tasks — archived rows keep project names so they remain readable after project deletion
- Grouped archived tasks view with date headers
- Offline support and installable as a PWA

## Project Structure (important files)

- `src/` — application source
  - `components/` — React components (including `ArchivedTasks.tsx`)
  - `hooks/` — custom hooks (e.g., `useAuth`, `useArchivedTasks`)
  - `integrations/supabase/` — Supabase client setup
  - `pages/` — top-level page components (Auth, Index, etc.)
- `public/` — static assets, `manifest.json`, `service-worker.js`, icons
- `.env` — local env variables (not committed)

## Environment variables

Create a `.env` in the repo root (example already present) and set:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_REDIRECT_URL=http://localhost:8081/
```

- Make sure the `VITE_REDIRECT_URL` matches your dev server port (Vite may pick another port if 5173/8080 are in use).
- Also add the redirect URL(s) to your Supabase project's **Auth → URL Configuration**.

## Setup & Local Development

1. Install dependencies:

```cmd
npm install
```

2. (Optional) Generate `favicon.ico` from provided PNG icons:

```cmd
npm run generate:favicon
```

3. Start the dev server:

```cmd
npm run dev
```

4. Open the app (Vite prints the local address, e.g. `http://localhost:8081/`).

## Generate favicon (script)

An npm script `generate:favicon` is included which uses `png-to-ico` to generate `public/favicon.ico` from `public/icons/icon-512x512.png` and `public/icons/icon-192x192.png`:

```json
"generate:favicon": "png-to-ico public/icons/icon-512x512.png public/icons/icon-192x192.png > public/favicon.ico"
```

Install `png-to-ico` globally or run via `npx` if needed:

```cmd
npm i -g png-to-ico
npm run generate:favicon
```

If you see errors, ensure you pass the correct relative paths (`public/icons/...`) and that files are valid PNGs.

## PWA & Caching Notes

- The app exposes a `manifest.json` and a minimal `service-worker.js` in `public/`.
- Browsers and the OS sometimes cache PWA icons (Windows caches icons for taskbar shortcuts). If you update icons and they don't appear:
  1. Uninstall/remove the installed PWA.
  2. Clear site data and unregister the service worker in DevTools (Application tab).
  3. Reinstall the PWA from the browser.
  4. On Windows, you may need to clear the Windows icon cache (see README PWA section) or re-pin the app to the taskbar.

## Authentication

- Supabase Auth is used (email/password and OAuth providers like Google).
- Make sure the redirect URLs configured in Supabase match your dev URLs.
- The client is configured to `detectSessionInUrl` and uses `pkce` flow for OAuth.

## Archiving Behavior

- Archiving is manual by default (via the **Archive Past Due** button/menu). This avoids unexpected background mutations.
- Archived tasks include stored `project_names` so labels persist even if the original project is deleted.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Open a PR with a clear description and screenshots as needed