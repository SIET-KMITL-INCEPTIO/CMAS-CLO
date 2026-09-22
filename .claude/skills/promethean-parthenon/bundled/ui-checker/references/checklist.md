# UI Audit Checklist — 50 Points

Use this as a manual companion to `static-analysis.py`.
Mark each item: ✅ Pass · ❌ Fail · ⚠️ Partial · N/A

---

## 1. Theme & Color (14 points)

| # | Check | Tool | Notes |
|---|---|---|---|
| 1 | No hardcoded `#hex` / `rgb()` / `hsl()` in component CSS rules | `static-analysis.py` → `hardcoded_colors` | Only `:root` / `.dark` token definitions are allowed |
| 2 | No hardcoded colors in `style=""` inline attributes | `static-analysis.py` → `inline_style_issues` | Inline styles bypass CSS variable theming entirely |
| 3 | No Tailwind arbitrary color values like `bg-[#1a1a1a]` | `static-analysis.py` → `hardcoded_colors` (type: tailwind_arbitrary_color) | Use semantic token classes instead |
| 4 | All Tailwind palette classes (`bg-slate-100`) have a `dark:` pair on the same element | `static-analysis.py` → `tailwind.unpaired_dark_variants` | Or replaced with semantic token class |
| 5 | CSS variables cover all color-bearing properties: text, bg, border, shadow, outline, focus ring, caret, scrollbar | Manual + `static-analysis.py` → `css_variables.root_variables` | Check shadows and scrollbars — often missed |
| 6 | Every `:root` variable has a dark-mode override | `static-analysis.py` → `css_variables.missing_dark_overrides` | |
| 7 | Dark mode method is live-toggle compatible (`.dark` class or `data-theme` attribute) | `static-analysis.py` → `css_variables.live_toggle_compatible` | Media-query-only dark mode cannot be toggled by a button |
| 8 | Toggling dark class/attribute in browser shows immediate visual change | Inspector Artifact → theme toggle | Look for any elements that don't respond |
| 9 | No unused CSS variables (defined but never referenced) | `static-analysis.py` → `unused_variables` | Clutter; also signals token naming drift |
| 10 | Semantic token naming follows a consistent convention | Manual | e.g. `--color-text-primary`, `--bg-surface`, `--border-default` — pick one and stick to it |
| 11 | Brand / accent color tokens are defined separately from semantic tokens | Manual | `--brand-blue: #2563eb` distinct from `--color-primary: var(--brand-blue)` |
| 12 | Colors in generated/injected content (charts, third-party widgets) also follow theme | Manual | Often missed — SVGs, Canvas, and iframes need separate handling |
| 13 | No color information conveyed by color alone (a11y) | Manual | Red error borders also have an icon or text label |
| 14 | Theme transitions are smooth (color-transition on body or `:root`) | Manual | `body { transition: background-color 0.2s, color 0.2s; }` |

---

## 2. Layout & Dimensions (12 points)

| # | Check | Tool | Notes |
|---|---|---|---|
| 15 | No fixed `height: Npx` that clips content at large fonts or zoom | `static-analysis.py` → `layout_issues` (fixed_height) | Use `min-height` instead |
| 16 | No fixed `width: Npx > 480px` without `max-width` + `width: 100%` | `static-analysis.py` → `layout_issues` (fixed_width) | Causes horizontal scroll on mobile |
| 17 | `overflow: hidden` on containers doesn't clip focus rings or tooltips | `static-analysis.py` → `layout_issues` (overflow_hidden) | Check at 200% zoom |
| 18 | `box-sizing: border-box` applied globally | Manual | `*, *::before, *::after { box-sizing: border-box }` |
| 19 | Container max-widths use tokens or named sizes (not magic numbers) | Manual | `max-width: var(--container-lg, 1200px)` |
| 20 | Flex/grid layouts don't overflow at 320px viewport | Inspector Artifact → 320 button | Minimum mobile viewport |
| 21 | Flex/grid layouts don't over-stretch at 1920px+ | Inspector Artifact → Full width | Content should be constrained by max-width |
| 22 | Sticky/fixed elements don't overlap content on mobile | Manual at 375px | Nav bars, cookie banners, bottom bars |
| 23 | Z-index values are documented tokens, not arbitrary numbers | Manual | `--z-modal: 300; --z-overlay: 200; --z-sticky: 100` |
| 24 | Aspect ratios preserved on images/media (no stretch) | Manual | `aspect-ratio: 16/9` or `object-fit: cover` |
| 25 | Scrollbar width taken into account for layout (avoid shift on modal open) | Manual | `overflow-y: scroll` on body, or `scrollbar-gutter: stable` |
| 26 | Print styles defined or explicitly skipped | Manual | `@media print { ... }` — at minimum, hide nav and footer |

---

## 3. Typography (6 points)

| # | Check | Tool | Notes |
|---|---|---|---|
| 27 | All `font-size` values use `rem`, not `px` | `static-analysis.py` → `typography_issues` | Scales with browser font-size preference |
| 28 | Line heights are unitless or `rem` (not `px`) | Manual | `line-height: 1.5` not `line-height: 24px` |
| 29 | Font families are defined as CSS variables | Manual | `--font-sans: 'Inter', system-ui, sans-serif` |
| 30 | Type scale follows a consistent ratio (e.g. Major Third 1.25×) | Manual | Avoid arbitrary font sizes scattered through CSS |
| 31 | Text remains readable (no overflow/truncation) at 200% browser zoom | Manual | Resize browser to 200% and scan for clipped labels |
| 32 | Long words / URLs in user-generated content are handled | Manual | `overflow-wrap: break-word` on prose containers |

---

## 4. WCAG Contrast (4 points)

| # | Check | Tool | Notes |
|---|---|---|---|
| 33 | All normal text passes WCAG AA (4.5:1 minimum) | `wcag-checker.py` or Inspector Artifact → WCAG tab | |
| 34 | All large text (≥18px / ≥14px bold) passes AA large (3:1) | `wcag-checker.py --large-text` | |
| 35 | All UI components (buttons, inputs, icons) pass AA component (3:1) | `wcag-checker.py --ui` | |
| 36 | Disabled / placeholder text is intentionally lower contrast and labeled as such | Manual | WCAG exempts disabled elements but placeholder text is not |

---

## 5. Responsive & Breakpoints (4 points)

| # | Check | Tool | Notes |
|---|---|---|---|
| 37 | UI tested at all 8 standard viewports (320–1920px) | Inspector Artifact → viewport buttons | See Viewport Test Matrix in SKILL.md |
| 38 | Breakpoints defined as CSS variable or Tailwind config (not magic px numbers) | Manual | `--bp-md: 768px` or `screens.md` in tailwind.config |
| 39 | Touch targets ≥ 44×44px on mobile viewports | Manual at 375px | WCAG 2.5.5 — buttons, links, form controls |
| 40 | No content hidden only by width-based overflow (hidden on mobile, visible desktop) | Manual | Use `display: none` + appropriate breakpoint instead |

---

## 6. Accessibility (6 points)

| # | Check | Tool | Notes |
|---|---|---|---|
| 41 | All `<img>` tags have meaningful `alt` text (or `alt=""` for decorative) | `static-analysis.py` → `accessibility.images_missing_alt` | |
| 42 | `:focus-visible` styles are visible and distinct from hover | `static-analysis.py` → `accessibility.focus_style_issue` | Never `outline: none` without a replacement |
| 43 | Form inputs have visible `<label>` elements (not just `placeholder`) | Manual | `placeholder` disappears when user types |
| 44 | ARIA roles/labels present on icon-only buttons and custom controls | Manual | `aria-label="Close"` on ✕ buttons |
| 45 | Heading hierarchy is sequential (h1 → h2 → h3, no skipping) | Manual | |
| 46 | Keyboard navigation order matches visual order | Manual — Tab through page | `tabindex` should not create unexpected jump order |

---

## 7. Motion & Performance (4 points)

| # | Check | Tool | Notes |
|---|---|---|---|
| 47 | `@media (prefers-reduced-motion: reduce)` disables or reduces all animations | `static-analysis.py` → `motion` | |
| 48 | No `animation: spin` / `transition: all` in critical render path | Manual | `transition: all` is expensive; be specific |
| 49 | CSS-only animations preferred over JS-driven (layout / paint vs composite) | Manual | `transform` and `opacity` are GPU-composited; avoid `top`/`left`/`width` animations |
| 50 | Loading states (skeleton, spinner) use theme tokens, not hardcoded grays | Manual | Common oversight — skeleton shimmer often hardcoded |

---

## Score Guidance

| Score | Assessment |
|---|---|
| 45–50 ✅ | Production-ready. Minor polish only. |
| 38–44 🟡 | Good foundation. Address failures before launch. |
| 28–37 🟠 | Significant gaps. Theme or a11y work needed. |
| < 28 🔴 | Major refactor needed. Start with color token system. |
