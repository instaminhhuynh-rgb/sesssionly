# Sessionly

**The Client Operations Layer for independent service professionals who sell appointments.**

> Everything that happens before, during, and after an appointment.

Sessionly is not a Calendly clone. Calendly gets a meeting onto the calendar; Sessionly makes each appointment **profitable, attended, prepared for, remembered, and followed up.**

This repo is the **SaaS-first responsive web prototype** (Phase 1). It runs entirely on mock data and is structured so the data layer can be swapped for Supabase with minimal churn.

---

## Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000> — the root redirects to `/app/today`.

Other scripts:

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

Requires Node 18.17+.

---

## What's in here

A responsive app shell (desktop sidebar / mobile bottom nav) with the seven primary tabs and three overlay flows.

| Route | Screen |
| --- | --- |
| `/app/today` | Today dashboard — greeting, week snapshot, AI Daily Briefing, next session, needs attention, payments due, follow-ups |
| `/app/clients` | Client records with relationship memory, notes, reviews, session & payment history |
| `/app/calendar` | 5-day / week / month views with service color coding and availability buffers |
| `/app/services` | Service types, duration, price, deposit, intake & expandable policies |
| `/app/payments` | Outstanding balances, deposits held, recently paid, weekly revenue trend |
| `/app/more` | Advanced tools: packages, waitlist, intake forms, templates, analytics, integrations |
| `/app/settings` | Style Studio, dashboard layout, Calendar Health, notifications, payment defaults, privacy |

**Overlays** (open over any screen): Smart Invite (live message preview + channels + rules), Session detail (transparent Session Score with reasons), Client detail.

### Product rules encoded here

- Payments is a **primary tab**, not buried in More.
- Reviews live **inside Clients**. Policies live **inside Services**.
- Calendar Health and Style Studio live **inside Settings**.
- More holds **advanced tools only** — nothing used daily.
- **Session Score is host-only and always shows its reasons** (see `lib/session-score.ts`). Never surface a bare number.
- AI **drafts, summarizes, and recommends** — every action is labeled a draft the host approves.

---

## Architecture

```
app/
  layout.tsx              root html/body + metadata
  page.tsx                redirects "/" -> "/app/today"  (SaaS-first, no marketing page)
  app/
    layout.tsx            wraps every screen in <AppShell>
    today|clients|calendar|services|payments|more|settings/page.tsx
components/
  shell/app-shell.tsx     sidebar, top bar, mobile nav, Smart Invite trigger
  overlays.tsx            OverlayProvider + Drawer + SmartInvite / SessionDetail / ClientDetail
  ui.tsx                  Avatar, Btn, Card, Pill, ScoreRing, Segmented, Toggle, ...
  icons.tsx               inline stroke icons
lib/
  types.ts                domain types (close to future DB rows)
  mock-data.ts            seed data + accessor functions (the Supabase seam)
  session-score.ts        explainable Session Score logic
  format.ts               date/time/money helpers
  supabase/client.ts      placeholder for Phase 3
```

**The Supabase seam:** components never touch raw arrays — they call `getClients()`, `getSessionsForDay()`, etc. in `lib/mock-data.ts`. When the database is ready, reimplement those functions as Supabase queries and the UI is untouched.

---

## Design direction — Calm Professional

Polished, restrained, trustworthy, Apple-like, business-aware. System font stack, a warm off-white canvas, a single slate-blue accent, and status colors used sparingly. No decorative gradients or orbs. Tokens live in `tailwind.config.ts`.

---

## Roadmap

- **Phase 1 (this repo):** responsive app shell + all screens on mock data.
- **Phase 2:** connect the workflows (create service → invite → booking → payment → follow-up).
- **Phase 3:** Supabase auth, schema, row-level security, CRUD.
- **Phase 4:** guest booking pages (`/book/[hostSlug]`, `/invite/[inviteId]`, intake, deposit checkout, confirm, reschedule).
- **Phase 5:** integrations — Google/Outlook Calendar, Stripe, email, SMS.
- **Phase 6:** server-side AI — Daily Briefing, Smart Invite, follow-ups, summaries.

See `SESSIONLY_BUILD_NOTES.md` (one level up) for the data model, suggested Supabase tables, and the pre-integration test plan.
