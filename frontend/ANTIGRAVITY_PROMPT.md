# Prompt for Antigravity

You are working in an existing React 18 + Vite + react-router-dom v6 project called FindBack
(campus Lost & Found portal, plain CSS, state in `src/context/AppContext.jsx`, mock auth in localStorage).
Turn the landing route into a scroll-driven story page. Do not add UI libraries; plain React + CSS + SVG only.

## 1. Routing and chrome
- Route `/` becomes the new `Landing` page. Move the existing browse/search feed (`Home`) to `/browse`
  and update every link/navigate that pointed to `/` for browsing (Navbar "Browse", ReportForm redirect,
  ItemDetail back links, NotFound, Login default redirect).
- On `/` render NO Navbar and NO footer note (hide them via `useLocation`). Other pages keep the Navbar.

## 2. Landing structure
- A tall `track` (900vh) containing a `position: sticky; top: 0; height: 100svh` stage.
- Scroll progress `p` (0..1) is read from the track, smoothed with a lerp in requestAnimationFrame
  (`useScrollProgress` hook exposing `subscribe(fn)`; no per-frame React state). EVERYTHING on the page is a
  pure function of `p`, so it plays identically scrolling down and scrolling up. Respect prefers-reduced-motion
  (no smoothing).
- Put all timings in one file `timeline.js` (progress ranges), so they are easy to tweak.

## 3. Background scene (fixed for the whole page)
- Full-viewport SVG, viewBox 1200x800, `preserveAspectRatio="xMidYMax slice"`: a blurred library
  (bookshelves with book spines, warm bokeh, vignette) and a wooden table at the bottom.
- Make it look like a PHOTOGRAPH, not clip-art: gradients and soft shadows, cardboard box texture, corrugated
  rim, packing tape, a paper "LOST & FOUND" label taped on, wood grain on the table, contact + soft shadow under
  the box. Use tileable image textures inside SVG `<pattern>` (not feTurbulence inside animated groups, it is slow).
  Generate procedural textures with numpy/Pillow into `public/scene/tex/` (cardboard.jpg, wood.jpg).
- Box with items: glasses, phone, notebook with green bookmark and yellow flower, blue wallet, grey knit scarf.
  Layer order: box back -> burst -> items -> sparkles -> box front (front panel hides item bottoms so items sit INSIDE).
- Provide `src/scene/assets.js` where real PNG cut-outs (items, box back/front, library background) can override
  the vector art; `null` = use the built-in vector version.

## 4. Scroll timeline (progress p)
- 0.00 hero: box big and centred; headline "Everything lost on campus ends up in one box." + "Scroll" hint.
- 0.03-0.15: text fades away, box glides to the RIGHT side of the screen and scales down; background unchanged;
  a dark left-side scrim fades in for text legibility.
- Left column reveals ONE step at a time (fade + slight translate + blur, entering from below, leaving upward),
  each with a heading (key word in amber), one short paragraph and a small cream "mock UI" card,
  in the style of https://www.reunited.co.in/#how-it-works (numbered steps "(1)", clean mock cards):
  1. 0.13-0.29 Report what you lost (form mock)
  2. 0.29-0.44 Report what you found (form mock with photo)
  3. 0.44-0.57 We match them for you (lost <-> found "Possible match")
  4. 0.57-0.70 You get notified (notification card with bell)
  5. 0.70-0.85 Item found, back it goes (Reported -> Matched -> Returned tracker)
- ITEM LOGIC: items pop out of the box slowly during steps 1-2 (p 0.17-0.42), hover during steps 3-4 (0.42-0.70),
  and drop back into the box during step 5 (0.70-0.85). Each item follows a curved path with spin and a small
  scale-up, staggered by delay, and returns along EXACTLY the same path (use the same eased value u(p) for up and
  down). Add a burst ring + rays + sparkles + glow at the box mouth that expand as items launch and collapse as they return.
- Keep items on screen: compute the visible area of the "slice" viewBox on resize and clamp how high and how far
  left/right items may travel; on narrow/portrait screens put the text on top and the box centred at the bottom.
- 0.87-0.96: box glides back to the centre. 0.90-1.00: finale tagline
  "Find what you've lost. / Return what you've found." and an amber button "Log in to get started".
  (If a user is already logged in, the button reads "Open the lost & found board" and goes to /browse.)
- Small step pips at the bottom while steps are visible.

## 5. Login pop-up
- The finale button opens an accessible modal (role="dialog", aria-modal, focus trap, Esc/backdrop/close button,
  page scroll locked, focus returned on close).
- Fields: Full name, WhatsApp number (accept +91 98765 43210 style, 10-14 digits), Campus name. Inline validation
  after blur/submit with `aria-invalid` + `aria-describedby`.
- Submit -> short fake loading -> success state ("You're signed in, <first name>", check icon) ->
  call `login({ name, whatsapp, campus })` and navigate to `/browse` after ~1.4s (or immediately via "Continue now").
- Update `AppContext.login` to accept a profile object (keep `login(name, email)` working) and use
  `user.whatsapp || user.email` as reporter. Share the same `LoginForm` component with the `/login` page.

## 6. Quality bar
- Responsive down to 360px wide, visible focus states, no console errors, `npm run build` passes.
- 60fps: update SVG/DOM styles imperatively inside the rAF subscriber, never through React state.
- Update README with a short section describing the landing page and where timings live.
