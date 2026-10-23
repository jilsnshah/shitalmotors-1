# Shital Motors — cinematic web experience

A scroll-driven redesign of [shitalmotors.com](https://www.shitalmotors.com/), the website of Shital Motors, an authorised Mahindra dealer in Gujarat since 2004. All content comes from the dealer's live site (October 2026): the real model line-up and prices, all 10 outlets with their hours and phone numbers, service offerings, verbatim customer reviews, award plaques, and the dealer's own photography. Real-time 3D is used in two places: three licensed car models, and a geographic map of the outlets.

## Run it locally

Requires **Node 22.6+** (the server runs TypeScript directly with `--experimental-strip-types`).

```bash
npm install
npm run dev          # http://localhost:5173 — Vite dev server with /api routes mounted
```

Production build and server:

```bash
npm run build        # type-check + Vite build → dist/
npm start            # serves dist/ + /api on http://localhost:4173 (PORT to change)
```

Optional configuration goes in `.env` (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Turns on the live AI concierge (Claude). Without it, the concierge still works in **offline mode** and answers from the dealership data. |
| `CHAT_MODEL` | Defaults to `claude-opus-5-5`. |
| `PORT` | Production server port (default 4173). |

## What the experience communicates and how it's organised

The original site is a template with a menu of separate pages. I rebuilt it as one narrative that follows the questions a visitor actually has, in order: *who are you → what can I buy → what will it cost me to own → where are you → can I trust you → let me visit*.

| # | Chapter | Treatment |
| --- | --- | --- |
| 1 | **Studio** (hero) | Pinned. A real-time 3D Thar ROXX on a studio floor; scrolling orbits the camera and repaints the car in three of its listed colours (Nebula Blue, Tango Red, Everest White). Falls back to photography that matches the studio backdrop. |
| 2 | **Since 2004** | Sticky copy over a parallax collage of the dealer's own showroom and delivery photos, followed by counting stats (2 lakh+ customers, 6 showrooms, 4 workshops, 3S). |
| 3 | **SUV line-up** | Pinned horizontal track of 8 SUVs with real prices, variant counts and specs. Native swipe on touch devices. |
| 4 | **Electric** | Pinned sequence through the 5 eSUVs, ordered by claimed range, with a range bar chart and an animated readout. |
| 5 | **Commercial** | Editorial list of 10 pick-ups and mini trucks; a photo follows the cursor on desktop and shows inline on touch. Each row opens a price request. |
| 6 | **Service** | The workshop photo opens from a letterbox to full bleed; the 6 service offerings stack as sticky cards beside the booking line and the workshop list. |
| 7 | **Locations** | A 3D map with all 10 outlets at their real coordinates and distance rings from Ashram Road. Includes an accessible outlet list with live open/closed status (IST), hours, tap-to-call and directions. Uses a 2D SVG map when 3D is off. |
| 8 | **Stories** | Delivery photo reels that drift with scroll, 12 verbatim reviews (one in Gujarati), legible award plaques, and the dealer's YouTube films (embed loads only on play). |
| 9 | **Visit** | Showroom quick list with today's status and tap-to-call; booking CTA. |

Each model also has its own page at `/models/:slug`: studio hero, key facts, a **360° studio** (for models with a 3D asset), a colour picker using the real colour photography, a filterable variant/price table, and next/previous navigation.

## AI concierge

The **"Ask Shital"** launcher sits in the corner and never opens by itself.

- **Grounded**: the system prompt is generated from `src/data/*` (the same data the UI renders), so prices, outlets and hours can't drift from the site. It's told not to guess on-road prices, offers, stock, EMI or mileage, and to send those questions to the right phone number instead.
- **Context-aware**: suggested questions change with the section in view, or the model page you're on. The current section is sent as a mid-conversation system message so the cached prompt prefix stays stable.
- **Actionable**: replies can carry action chips (open a model, book a test drive, show an outlet on the map, call a number, jump to a section).
- **Streaming**: uses `@anthropic-ai/sdk` with prompt caching, server-side refusal fallbacks, a rate limit, and input caps (`server/api.ts`).
- **Always answers**: with no API key, if the API fails, or on static hosting, it falls back to a deterministic answer engine (`src/lib/concierge/local.ts`) built from the same data. The header shows which mode is active.
- Supports English, Hindi and Gujarati; on mobile it's a modal sheet. Esc closes it, it has a live region for screen readers, and a stop button while a reply streams.

## Test-drive / quote / service requests

`POST /api/lead` validates the input and appends to `data/leads.ndjson` (git-ignored). **Before launch, connect this to the dealer's CRM or email.** If the endpoint isn't reachable, the form falls back to a pre-filled email to `customercare@shitalmotors.com` (or the service CRM address) plus a call button, so a request is never lost.

## 3D, motion and performance

- **Stack**: Vite 8, React 18, TypeScript, GSAP ScrollTrigger, Lenis (smooth wheel scrolling only; touch stays native), three.js via React Three Fiber and drei.
- **Car models** live in `public/models/`. They're community-made models from Sketchfab, licensed **CC BY 4.0**, downloaded with the Sketchfab Download API and optimised with glTF-Transform (meshopt, WebP textures, 38 MB → 3.9 MB in total). Credits appear in the hero, in each 360° studio, and in the footer:
  - "[Mahindra - Thar Roxx](https://sketchfab.com/3d-models/mahindra-thar-roxx-f85210fe98774b7fab1199d8ee151ead)" by ansari_studios. Repainted live from the listed colour hexes; tyre and rim materials were corrected because the export left them white.
  - "[XUV 3XO](https://sketchfab.com/3d-models/xuv-3xo-816995d6c3454462b62c8c44ea39ae65)" by Shreyansh Chaurasia. Converted from spec-gloss to metal-rough, because three.js no longer supports spec-gloss.
  - "[THAR 4X4](https://sketchfab.com/3d-models/thar-4x4-66ee970b18014c98a1750064b65657b0)" by MB_Mahesh. The 3-door Thar, shown on the Thar OG page.
  - Rejected: a Scorpio-N that was ripped from a GTA mod and marked NoAI (and Shital doesn't list it), all non-commercial-licence models, and low-quality models.
- **Studio lighting** is procedural (`RoomEnvironment`), so no HDR files are downloaded. Painted panels get creased normals to avoid faceting under clear-coat.
- **Progressive loading**: the hero shows the matching photograph immediately and crossfades to 3D once the model is ready. three.js (~300 KB gzipped) is in its own lazy chunk, and the 360° studio only loads when you scroll near it.
- **Capability gating** (`src/lib/motion.tsx`): 3D only runs with hardware WebGL, at least 4 cores / 4 GB, no data-saver, and motion not reduced. Otherwise you get photos and the 2D map. Render loops pause off-screen; DPR is capped at 1.75; WebGL context loss falls back gracefully.
- **Reduced motion**: respects `prefers-reduced-motion`. There's also a Motion toggle in the footer (Auto / Full / Reduced). Reduced removes all pinning, scrubbing, smooth scrolling and 3D, and content reads top to bottom.
- **Accessibility**: skip link, landmarks, real buttons and links, `aria-pressed` filters, focus-trapped dialogs that return focus, `inert` off-screen panels, alt text for every photo. The 3D canvases are decorative (`aria-hidden`), and the outlet list is the accessible control.

QA tip: headless browsers only have software WebGL, which the site deliberately treats as "no 3D". To screenshot the 3D path, run `localStorage.setItem('sm-force-3d','1')`.

## Content accuracy notes

- Prices are **ex-showroom Ahmedabad**, as listed by the dealer, with a disclaimer on every price surface.
- Power figures were left out: the source lists values such as "130 kW" for the Scorpio and "228 kW" for the 59 kWh XEV 9e, which look like PS mislabelled as kW. Engine cc, battery kWh and claimed range are shown as listed.
- Outlet counts use the dealer's current outlet directory (6 showrooms, 4 workshops). Their About page still says "4 showrooms and 3 workshops".
- Per-outlet phone numbers follow the "Call" buttons on the live site. The Surendranagar showroom uses the number from its outlet page (75728 07070).
- Award captions only include plaques whose text is legible in the dealer's photos.

## Project structure

```
server/            api.ts (chat, leads, health) · index.ts (static + API server)
src/data/          business.ts (facts) · models.generated.ts · testimonials.generated.ts · models3d.ts · media.generated.ts
src/lib/           motion.tsx · scroll.ts · hooks.ts · store.ts · geo.ts · hours.ts · concierge/{knowledge,local}.ts
src/sections/      Hero · Legacy · Lineup · Electric · Commercial · Service · network/* · Stories · Visit
src/three/         CarModel · HeroCar · CarViewer
src/pages/         Home · ModelPage · Studio3D · NotFound
src/components/    Header · Footer · Loader · TestDriveSheet · primitives · concierge/*
public/media/      Dealer photography and model images (WebP, with blur placeholders)
public/models/     Optimised GLB car models
```
