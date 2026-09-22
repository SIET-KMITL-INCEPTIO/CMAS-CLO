# nevinas_ka_i — Portfolio & Dashboard

A React 19 + TypeScript + Express 5 portfolio site. Solo project, quality-over-speed, this
is a live showcase of the author's own engineering and design work.

Full context lives in `.agent/` — this file is the entry point, not a duplicate:
- `.agent/context/context.md` — product scope, personas, architecture, standards (long — skim headers)
- `.agent/design-system/md/design-v3-2.md` — **Nocturnal Atelier v3.2**, the full design system (2000+ lines, authoritative)
- `.agent/docs/frontend/` and `.agent/docs/backend/` — feature-specific implementation notes
- `.agent/skills/` — mirrored at `.claude/skills/`, invoke via `/skill-name`

**Source of truth is always the current code.** The docs above drift; when a doc and the
code disagree, trust the code and fix the doc.

---

## Stack (verified against package.json, not docs)

| | |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4, React Router 7 |
| Animation | Framer Motion 12 (only — GSAP and animejs were removed with the unrouted Portfolio feature) |
| 3D | three.js 0.184, used directly. **No @react-three/fiber or drei** — R3F's `<Canvas>` builds its own renderer and bypasses `webglGuard` |
| Data viz | recharts, @xyflow/react (GraphView) |
| Backend | Express 5, TypeScript, Zod 4 (validation), Helmet, CORS, Multer |
| Data store | **JSON files** in `server/src/data/*.json` — there is no MongoDB/Postgres despite what older docs say |
| State | React Context only (Theme, Profile, Error) — no Redux/Zustand/TanStack Query |

Ports: backend `3000`, frontend dev `10005`, frontend preview `10006` (see
`client/vite.config.ts` and `.claude/launch.json`). Both dev servers proxy `/api` and
`/uploads` to `:3000`.

---

## Design system: Nocturnal Atelier v3.2

*"Two fonts. No weight above 600. Size leads. Depth breathes. Glass that means it."*

Full spec: [design-v3-2.md](../.agent/design-system/md/design-v3-2.md). Tokens are wired
into `client/src/index.css` `@theme` — use the Tailwind token classes (`bg-periwinkle`,
`text-haze`, etc.), not raw hex, so a palette change stays a one-file edit.

**Main palette** (UI, text, surfaces — always):
`#C8CDEB` Periwinkle · `#878CB4` Cool Gray · `#465078` Haze Purple · `#1E233C` Midnight Purple · `#0A0F19` Charcoal

**Sub-palette** (effects, SVG gradients, WebGL particles, glass shimmer — **never** buttons/text/borders):
`#B8BED7` French Gray · `#AFAECC` Cool Gray Sub · `#85758F` Mountbatten Pink (the one warm bridge tone, R>G territory — use sparingly, max ~30% of icons) · `#524E68` / `#44405A` English Violet 1/2

**Rules that matter most in practice:**
- Font stack is Inter (300–600) everywhere, Zen Kaku Gothic New only for optional JP captions. **No weight above 600 anywhere** except icon-only UI elements (600 is the sole exception).
- Size leads hierarchy, not weight — h1 is `font-light`/`font-normal`, not `font-bold`.
- `.glass` is the standard elevated-surface treatment (blur + saturate + soft borders); see §5.2 for light/dark variants.
- Spacing is 8px-based (`gap-1` through `gap-10`); don't invent arbitrary padding.
- Mobile-first responsive: single-column/small-padding by default, scale up with `sm:`/`md:`. Never ship a fixed multi-column grid or flat `px-16` without a mobile override — that has caused real layout breakage on this project (see [homepage-performance-pass](../.agent/../.claude memory) history).

---

## Non-negotiable rules for this repo

1. **`vite.config.ts` must not get a hand-rolled `manualChunks`.** A previous one bundled every lazy-route dependency (recharts, @xyflow, react-markdown) onto the homepage critical path, tripling its JS payload. Rollup's automatic chunking is cycle-safe and already splits along `React.lazy()` boundaries — trust it.
2. **Device-tier gating for expensive effects is two separate signals, not one.** `useDeviceCapability` (`client/src/hooks/useDeviceCapability.ts`) exports `useDeviceProfile() → {tier, isMobile, reducedMotion}`. Gate on `isMobile` when the reason is "wrong on any handheld regardless of speed" (e.g. LiquidEther); gate on `tier` when the reason is "this hardware genuinely can't afford it" (e.g. LaserFlow in the loading screen). Don't collapse them back into one check.
3. **Lighthouse mobile audits emulate screen size and throttle CPU, but `navigator.deviceMemory`/`hardwareConcurrency` still report the host machine.** Any capability check must key off `(pointer: coarse)` / viewport first, hardware specs second, or it silently passes on a 16-core dev box under a "mobile" audit.
4. **Never call scroll-linked hooks (`useScroll`/`useTransform`) on unmounted/inactive slide instances.** `SlideWrapper` splits into `ActiveSlide` (has the hooks) and `InertSlide` (plain placeholder) specifically because running them on all 18 homepage slides caused multi-second style/layout recalcs. Hooks can't be conditional — that split is why it's two components.
5. **TypeScript strict mode, no `any`.** Backend validation goes through Zod schemas — never trust client input past the schema boundary.
6. **`npm run icons:subset` (in `client/`) regenerates the Remix Icon subset** whenever a new `ri-*` class is used — the site does not ship the full icon font.

---

## Where things live

```
client/public/
  models/       *.glb, served verbatim and fetched by URL — NEVER imported from src/
                (Vite dev serves /src/**/*.glb as a JS module, so GLTFLoader breaks
                in dev while the prod build looks fine). Built by `npm run models:optimize`
                from client/models-source/ (gitignored raw exports, ~15 MB each).

client/src/
  components/   feature-organized (homepage/, dashboard/, layouts/, effect/, ui/, ...)
  hooks/        useDeviceCapability, useFetch, useScrollReveal, ...
  context/      ThemeContext, ProfileContext, ErrorContext — the only global state
  pages/        one file per route, lazy-loaded from routes/AppRoutes.tsx
  data/         static content (tech data, homepage copy) — blog posts come from the API
  styles/       index.css @theme tokens + modular CSS (the `_name.css` files are the
                live ones; index.css @imports them explicitly)
  three/        webglGuard.ts ONLY — the single gate for every WebGL context

server/src/
  routes/       blogs.ts, gallery.ts, github.ts, projects.ts
  data/         *.json — the actual data store, no database
  sync/         GitHub + gallery filesystem sync scripts
  schemas/      Zod validation
```

## Commands

```bash
cd client && npm run dev        # :10005, proxies /api → :3000
cd server && npm run dev        # :3000
cd client && npm run build      # production build
cd client && npm run icons:subset   # regenerate remixicon subset after adding ri-* classes
cd client && npm run models:optimize # rebuild public/models/*.glb from client/models-source/
```

Preview config for Lighthouse/browser-tool testing is in `.claude/launch.json`
(`client-preview`, port 10006, serves the real production build with the API proxy intact).
