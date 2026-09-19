# FindBack — Campus Lost & Found Portal

FindBack is an interactive React application for the campus Lost & Found Portal. It features a cinematic, scroll-driven story landing page (`/`) explaining the journey of lost items through a photo-realistic cardboard box and floating items, plus a dedicated Lost & Found catalog (`/browse`).

Built with **plain React + CSS + SVG only** (no external UI or animation libraries).

---

## Key Highlights & Features

### 1. Scroll-Driven Story Landing Page (`/`)
- **900vh scroll track with a sticky 100svh stage**.
- **Imperative rAF + Lerp smoothing** (`useScrollProgress` hook): Updates SVG transforms and DOM cards without triggering per-frame React state re-renders.
- **Pure mathematical timeline** (`src/scene/timeline.js`): Everything is a pure function of scroll progress $p \in [0, 1]$, providing completely symmetrical behavior scrolling up and down.
- **Layered SVG scene** (`viewBox="0 0 1200 800"` with `xMidYMax slice`):
  - Blurred library bookshelves and perspective wooden study table.
  - Photo-realistic cardboard "LOST & FOUND" box (textured with procedural kraft cardboard, corrugated rim, packing tape, taped paper label, and contact shadows).
  - Five floating items: **Glasses**, **Smartphone**, **Notebook with green bookmark**, **Blue Wallet**, and **Grey Knit Scarf**.
  - Layer ordering: Shelves & table → box back & cavity → sunburst & glow → 5 floating items → sparkles → box front (so items realistically sit inside the box and pop out).
  - Procedural textures generated into `public/scene/tex/` (cardboard, wood, paper, tape).
  - Asset override hook (`src/scene/assets.js`) to allow real photographic PNG cutouts to override vector art.

### 2. Five-Step Interactive Story (inspired by reunited.co.in)
- **Step 1 (0.13 – 0.29)**: Report *lost* (cream mock-UI report card).
- **Step 2 (0.29 – 0.44)**: Report *found* (cream mock-UI found logger with photo tag).
- **Step 3 (0.44 – 0.57)**: We *match* them (automated cross-matching correlation chip).
- **Step 4 (0.57 – 0.70)**: You get *notified* (notification bell alert).
- **Step 5 (0.70 – 0.85)**: Item *reunited* (3-stage `Reported → Matched → Returned` lifecycle tracker).
- **Items pop out** during steps 1-2 (`0.17 – 0.42`), hover during steps 3-4 (`0.42 – 0.70`), and return into the box during step 5 (`0.70 – 0.85`) along the exact same path.
- **Finale (0.90 – 1.0)**: Box glides back to center with the closing headline and an accessible Login modal trigger.

### 3. Accessible Login Pop-up & Form
- Accessible modal dialog (`role="dialog"`, `aria-modal="true"`, focus trap, Esc / backdrop dismissal, background scroll lock, focus restore).
- Form fields: Full name, WhatsApp number (10-14 digits, supports `+91`), and Campus name.
- Inline validation with `aria-invalid` and `aria-describedby`.
- Fake loading state with spinner → success confirmation → automatic redirect to `/browse`.
- Shared `LoginForm` component reused on both the landing modal and the `/login` route.

### 4. Dedicated Browse Board (`/browse`)
- Comprehensive item search and category/status filtering.
- Status progression: `Reported → Matched → Returned`.
- Match notification system triggered by keyword and category overlap.

---

## Routes

| Route | Description | Navigation & Footer |
|---|---|---|
| `/` | Scroll-driven story landing page | **No Navbar & No Footer** |
| `/browse` | Lost & found board and search feed | Standard Navbar & Footer |
| `/report-lost` | Form to report a lost item (protected) | Standard Navbar & Footer |
| `/report-found` | Form to report a found item (protected) | Standard Navbar & Footer |
| `/item/:id` | Full item view & status advancement | Standard Navbar & Footer |
| `/login` | Standalone login page | Standard Navbar & Footer |

---

## Project Structure

```text
src/
  App.jsx                  App shell & conditional navigation/footer routing
  main.jsx                 React entry point
  index.css                Design tokens, story stage, mockups, modal styles
  context/
    AppContext.jsx         Global state, item storage, auth profile, notifications
  hooks/
    useScrollProgress.js   rAF + lerp scroll progress hook with subscriber model
  scene/
    timeline.js            Pure timeline math and easing functions
    assets.js              Texture registry and optional PNG cutout overrides
    SceneSvg.jsx           Full-viewport SVG cardboard box, items, and lighting
    StorySteps.jsx         5 sequential step cards with cream mock-UI
    items/
      ItemArtwork.jsx      Detailed vector artwork for glasses, phone, notebook, wallet, scarf
  components/
    Navbar.jsx             Top navigation (shown on non-landing routes)
    LoginForm.jsx          Accessible form with inline validation and loading states
    LoginModal.jsx         Accessible focus-trapped dialog
    ItemCard.jsx           Item preview card
    StatusBadge.jsx        Status pill (Reported, Matched, Returned)
    FilterBar.jsx          Catalog search and filtering controls
    ProtectedRoute.jsx     Route guard requiring student authentication
  pages/
    Landing.jsx            Scroll-driven story landing page (900vh track)
    Browse.jsx             Lost & found board feed
    ReportLost.jsx         Report lost item form
    ReportFound.jsx        Report found item form
    ItemDetail.jsx         Item detail view & lifecycle tracker
    Login.jsx              Standalone login page
    NotFound.jsx           404 page
scripts/
  generate_textures.py     Procedural texture generator (cardboard, wood, paper, tape)
public/
  scene/
    tex/                   Generated textures (cardboard.png, wood.png, paper.png, tape.png)
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Re-generate procedural textures
python3 scripts/generate_textures.py

# 3. Start development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## Production Build

```bash
npm run build
```
Builds cleanly with zero external UI dependencies.
