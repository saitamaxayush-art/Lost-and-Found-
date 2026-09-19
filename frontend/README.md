# FindBack — Campus Lost & Found Portal (Frontend)

A sample React frontend for the S4i Hackathon "Lost & Found Portal" problem
statement. Covers every core requirement plus all four bonus features, using
mock/local data so it runs standalone with no backend.

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
    Home.jsx                browse/search feed
    ReportLost.jsx          report-a-lost-item form
    ReportFound.jsx         report-a-found-item form
    ItemDetail.jsx          full item view + status tracker
    Login.jsx               mock login page
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
