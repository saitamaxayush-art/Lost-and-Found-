# FindBack — Campus Lost & Found Portal (Frontend)

A sample React frontend for the S4i Hackathon "Lost & Found Portal" problem
statement. Covers every core requirement plus all four bonus features, using
mock/local data so it runs standalone with no backend.

## Single-page app

There is only one page (`/`). Every other URL redirects to it. Top navigation (no logo/name),
in the same peach theme as the rest of the page:

| Nav item | Section |
|---|---|
| Search a Lost Item | `#search` — keyword/type/category/status search over reported items, item detail pop-up, "Report lost / found" pop-ups (login required) |
| How it Works | `#how-it-works` — the pinned, scroll-driven box animation |
| History | `#history` — success stats (count-up), reported-vs-reunited chart, review cards (all sample data in `src/data/successData.js`) |
| Contact Us | `#contact` — contact cards + message form (mock) |

**Nav behaviour** (`components/landing/Nav.jsx`): a full-width transparent bar at the top of the page that
continuously shrinks into a compact floating pill as you scroll down (CSS variable `--s`, 0..1, eased) and
grows back into place when you return to the top. The current section's link is highlighted.

**Smooth section jumps** (`pages/Landing.jsx` → `goTo`): if the trip to a section would scroll *through* the pinned
"how it works" animation, the page fades a soft veil in, jumps, and fades the veil out, so the animation never
plays in the background. Trips that don't cross it use normal smooth scrolling.

**Login pop-up:** name, WhatsApp number, campus. Reporting an item or advancing its status asks you to sign in
first, then continues what you were doing.

Files: `src/pages/Landing.jsx`, `src/components/landing/*` (Nav, SearchSection, ItemModal, ReportModal, Modal,
LoginModal, Scene, Steps, HistorySection, ContactSection, `timeline.js` = all scroll timings),
`src/hooks/useScrollProgress.js`, `src/hooks/useReveal.js`, `src/styles/landing.css`, `src/styles/sections.css`.

Tweak timings in `src/components/landing/timeline.js` (scroll progress 0..1, length is `TRACK_VH`).

### Using real photos instead of the vector scene
The scene is drawn with shaded vector art plus procedural cardboard/wood textures
(`tools/make-textures.py`). To use real photos, drop transparent PNG cut-outs in
`public/scene/` and reference them in `src/scene/assets.js`.

## Features

**Core**
- Report a lost item (description, category, date lost)
- Report a found item (description, category, date found)
- Search / browse / filter reported items (by keyword, category, type, status)

**Bonus**
- Basic login/authentication (mock, stored in `localStorage`)
- Image upload for reported items (stored as a base64 preview)
- Status tracking: `Reported → Matched → Returned`
- Notification system: when a new report shares a category and overlapping
  keywords with an opposite-type report, both are flagged as a possible match
  and a notification appears in the navbar bell

## Tech stack

- React 18 + Vite
- React Router v6 for pages/routing
- Plain CSS (no UI framework) — see `src/index.css`
- State is kept in React Context and persisted to `localStorage`, so it's a
  drop-in stand-in for a real backend. Swap `src/context/AppContext.jsx`'s
  functions for real API calls (e.g. to your Node/Express + MongoDB backend)
  when you build it.

## Project structure

```
src/
  main.jsx                 entry point
  App.jsx                  routes
  index.css                global styles / design tokens
  data/mockItems.js         seed data shown on first run
  context/AppContext.jsx    app state: items, auth, notifications
  components/
    Navbar.jsx              top nav + notification bell
    ItemCard.jsx            single item preview card
    StatusBadge.jsx         colored status pill
    FilterBar.jsx           search + filter controls
    ProtectedRoute.jsx      route guard for pages that require login
  pages/
    Landing.jsx             scroll-through landing page (route /)
    Home.jsx                browse/search feed (route /browse)
    ReportLost.jsx          report-a-lost-item form
    ReportFound.jsx         report-a-found-item form
    ItemDetail.jsx          full item view + status tracker
    Login.jsx               mock login page (same form as the landing pop-up)
    NotFound.jsx            404 page
```

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Where to plug in a real backend

Everything that would normally hit an API lives in `AppContext.jsx`:
`addItem`, `updateItemStatus`, `login`, `logout`. Replace the localStorage
read/writes inside those functions with `fetch`/`axios` calls to your
Node.js + Express + MongoDB backend, and the rest of the app (pages,
components, routing) needs no changes.
