# My Daily Quest (v0)

A calm, minimal to-do & task manager with projects, archiving, calendar view and PWA support.

---

## Overview

My Daily Quest is a lightweight task manager focused on clarity and calm. It supports:
- Projects and tags
- Due dates and priorities
- Drag-and-drop task ordering
- Pinning and completion
- Archiving of past-due tasks (manual trigger)
- Calendar view
- Offline-capable Progressive Web App (PWA)

This repository contains the v0 version of the app (feature-complete MVP for core flows).

## Screenshot

(See `/public` or run locally to view the UI.)

## Built With / Technologies

- Frontend: React (v18)
- Tooling: Vite
- UI primitives: Radix UI, Tailwind CSS, shadcn/ui components
- State & Data: React hooks, TanStack Query
- Drag & Drop: @dnd-kit
- Authentication & Backend: Supabase (Auth + Postgres)
- PWA: Web Manifest + simple service worker in `public/service-worker.js`
- Languages: TypeScript

## Key Features

- Create, update, delete tasks
- Projects with color labels
- Task priorities and completion status
- Drag-and-drop ordering via `DraggableTaskList`
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