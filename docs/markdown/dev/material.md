# Material Tonal Logic — Design System

See also: [[design-system-obe]] · [[Design System Strategy]] · [[concept-clo MOC]]

> **Version** 1.0.0 · **Status** Active · **Maintainers** UI Design, UX Design, Product Design, UX Research, Design Systems

---

## Table of Contents

1. [Overview & Philosophy](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#1-overview--philosophy)
2. [Core Principles](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#2-core-principles)
3. [Design Tokens](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#3-design-tokens)
    - 3.1 [Color System](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#31-color-system)
    - 3.2 [Typography Scale](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#32-typography-scale)
    - 3.3 [Spacing & Grid](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#33-spacing--grid)
    - 3.4 [Shape Language](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#34-shape-language)
    - 3.5 [Elevation & Depth](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#35-elevation--depth)
    - 3.6 [Motion & Animation](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#36-motion--animation)
4. [Component Reference](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#4-component-reference)
    - 4.1 [Buttons](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#41-buttons)
    - 4.2 [Cards](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#42-cards)
    - 4.3 [Text Fields](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#43-text-fields)
    - 4.4 [Navigation](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#44-navigation)
    - 4.5 [Chips](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#45-chips)
    - 4.6 [Dialogs](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#46-dialogs)
    - 4.7 [FAB — Floating Action Button](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#47-fab--floating-action-button)
    - 4.8 [Lists](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#48-lists)
    - 4.9 [Progress Indicators](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#49-progress-indicators)
    - 4.10 [Badges & Avatars](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#410-badges--avatars)
    - 4.11 [Snackbars & Toasts](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#411-snackbars--toasts)
5. [Pattern Library](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#5-pattern-library)
    - 5.1 [Page Layout](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#51-page-layout)
    - 5.2 [Forms](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#52-forms)
    - 5.3 [Data Tables & File Lists](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#53-data-tables--file-lists)
    - 5.4 [Hero Sections](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#54-hero-sections)
    - 5.5 [Empty States](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#55-empty-states)
    - 5.6 [Error & Validation States](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#56-error--validation-states)
6. [Accessibility Standards](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#6-accessibility-standards)
7. [Implementation Guide](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#7-implementation-guide)
8. [Governance & Contribution](https://claude.ai/chat/34ab32ca-3f17-4247-91b3-8403a8b1afd9#8-governance--contribution)

---

## 1. Overview & Philosophy

**Material Tonal Logic** is a design system built on Material Design 3 (M3) principles, adapted for corporate and educational SaaS products. It prioritizes **clarity**, **tonal hierarchy**, and **adaptive layout** — moving away from sharp shadows and aggressive chrome in favor of surface layering, expressive rounding, and systematic whitespace.

### What This System Is

A single source of truth for every visual and interaction decision across products. It is not a component library alone — it defines how components think, breathe, relate to each other, and respond to users.

### What This System Is Not

A rigid cage. Components and patterns are composable constraints, not pixel-perfect mandates. The system gives teams a shared language, not a set of handcuffs.

### Brand Personality

|Attribute|Expression|
|---|---|
|**Systematic**|Every element follows a strict placement and sizing rule derived from an 8px baseline|
|**Adaptive**|Fluid container logic ensures the system feels native at every breakpoint|
|**Tactile**|Ripple effects, state transitions, and tonal shifts reward interaction|
|**Approachable**|Expressive rounded shapes and breathable spacing prevent information density from feeling oppressive|
|**Accessible**|All color pairings maintain a minimum 4.5:1 contrast ratio; all interactive targets hit 48px minimum|

---

## 2. Core Principles

### P1 — Tonal Hierarchy Over Shadow

Depth is communicated through surface container tiers, not drop shadows. Use shadow only as a secondary reinforcement at Level 1 and Level 2 elevation. Never use hard, dark shadows.

### P2 — Functional Color Roles

Every color has a declared semantic role. Never hardcode a hex value in a component — always reference a token. The palette is built on tonal palettes; brand accent anchors the primary role, secondary and tertiary provide organizational contrast.

### P3 — Touch Safety Always

Every interactive element must present a minimum 48×48px touch target, regardless of its visual footprint. A visually compact chip still needs an invisible tap area.

### P4 — On-Color Pairing Is Mandatory

Text and iconography must always use the "on-" variant of their background role. `on-primary` on `primary`, `on-surface` on `surface`, and so on. This is the primary mechanism for maintaining contrast without manual color picking.

### P5 — Typography Communicates Hierarchy, Not Decoration

Use type scale roles purposefully. Display for landmark moments; Headline for section identity; Title for component headers; Body for reading; Label for interactive affordances.

### P6 — Motion Reinforces Meaning

All transitions should explain a spatial relationship or a state change. Motion is never decorative. Default to 200–300ms easing curves for most micro-interactions; reserve longer durations for complex transitions.

---

## 3. Design Tokens

Tokens are the atomic layer. No component, pattern, or layout decision should reference a raw value — only a token.

---

### 3.1 Color System

#### Tonal Palette Architecture

The system is built on three named palette families — **Primary (Royal Amethyst)**, **Secondary (Muted Violet)**, and **Tertiary (Rose)**. Each palette generates a range of tonal values that map to semantic roles.

#### Surface Container Tiers

Use these tiers to build depth through layering, not shadow:

|Token|Hex|Usage|
|---|---|---|
|`surface`|`#fef7ff`|Base background — Page canvas|
|`surface-dim`|`#ded8df`|Subdued background — Scrim overlays|
|`surface-bright`|`#fef7ff`|Highlighted surface variant|
|`surface-container-lowest`|`#ffffff`|Highest emphasis container — Modals, dialogs|
|`surface-container-low`|`#f8f2f9`|Elevated cards, compose buttons|
|`surface-container`|`#f2ecf3`|Navigation bars, sidebars, section panels|
|`surface-container-high`|`#ece6ed`|Hover states, active containers|
|`surface-container-highest`|`#e6e1e8`|Focus states, pressed containers, footers|
|`surface-variant`|`#e6e1e8`|Dividers, inactive chip backgrounds|

#### On-Surface Roles (Text & Icon)

|Token|Hex|Usage|
|---|---|---|
|`on-surface`|`#1d1b20`|Primary text — Body copy, headlines|
|`on-surface-variant`|`#494551`|Secondary text — Helper text, captions, inactive labels|
|`inverse-surface`|`#322f35`|Text on dark overlays|
|`inverse-on-surface`|`#f5eff6`|Body text on inverse surfaces|

#### Outline Roles (Borders & Dividers)

|Token|Hex|Usage|
|---|---|---|
|`outline`|`#7a7582`|Text field borders, explicit dividers|
|`outline-variant`|`#cbc4d2`|Subtle dividers, card borders, chip strokes|

#### Primary Palette

|Token|Hex|Usage|
|---|---|---|
|`primary`|`#4f378a`|Brand CTA — Filled button background, active nav indicators|
|`on-primary`|`#ffffff`|Text/icons on primary surfaces|
|`primary-container`|`#6750a4`|Hero section backgrounds, prominent containers|
|`on-primary-container`|`#e0d2ff`|Text/icons inside primary-container|
|`inverse-primary`|`#cfbcff`|Primary-colored elements on dark surfaces|
|`primary-fixed`|`#e9ddff`|Stable primary tint — always light regardless of mode|
|`primary-fixed-dim`|`#cfbcff`|Dimmed stable primary tint|
|`on-primary-fixed`|`#22005d`|Text on primary-fixed|
|`on-primary-fixed-variant`|`#4f378a`|Secondary text on primary-fixed|
|`surface-tint`|`#6750a4`|Tint overlay for elevated surfaces at Level 1+|

#### Secondary Palette

|Token|Hex|Usage|
|---|---|---|
|`secondary`|`#625b71`|Secondary brand color — Focus rings, mentor availability labels|
|`on-secondary`|`#ffffff`|Text/icons on secondary surfaces|
|`secondary-container`|`#e8def9`|Active nav pill, tonal button background, selected chip|
|`on-secondary-container`|`#686177`|Text/icons inside secondary-container|
|`secondary-fixed`|`#e8def9`|Stable secondary tint|
|`secondary-fixed-dim`|`#ccc2dc`|Dimmed stable secondary tint|
|`on-secondary-fixed`|`#1e192b`|Text on secondary-fixed|
|`on-secondary-fixed-variant`|`#4a4358`|Secondary text on secondary-fixed|

#### Tertiary Palette

|Token|Hex|Usage|
|---|---|---|
|`tertiary`|`#633b48`|Supporting accent — study group labels, decorative callouts|
|`on-tertiary`|`#ffffff`|Text/icons on tertiary surfaces|
|`tertiary-container`|`#7d5260`|Workshop tags, status badges, study group identifiers|
|`on-tertiary-container`|`#ffcbda`|Text/icons inside tertiary-container|
|`tertiary-fixed`|`#ffd9e3`|Stable tertiary tint|
|`tertiary-fixed-dim`|`#eeb8c8`|Dimmed stable tertiary tint|
|`on-tertiary-fixed`|`#31111d`|Text on tertiary-fixed|
|`on-tertiary-fixed-variant`|`#633b48`|Secondary text on tertiary-fixed|

#### Error Palette

|Token|Hex|Usage|
|---|---|---|
|`error`|`#ba1a1a`|Destructive actions, validation errors, LIVE badge backgrounds|
|`on-error`|`#ffffff`|Text/icons on error surfaces|
|`error-container`|`#ffdad6`|Error message backgrounds, inline validation banners|
|`on-error-container`|`#93000a`|Text inside error-container|

#### Semantic Background/Surface Aliases

|Token|Hex|Notes|
|---|---|---|
|`background`|`#fef7ff`|Alias of `surface` — use `surface` in components|
|`on-background`|`#1d1b20`|Alias of `on-surface` — use `on-surface` in components|

#### State Overlays

Applied as overlay on top of any interactive component's base color. Never use these as a stand-alone fill.

|State|Overlay|Opacity|
|---|---|---|
|Hover|`#000000` (on light) / `#ffffff` (on dark)|8%|
|Focus|`#000000` / `#ffffff`|10%|
|Pressed (Ripple)|`#000000` / `#ffffff`|10%|
|Dragged|`#000000` / `#ffffff`|16%|
|Disabled|`on-surface`|38% opacity on text; 12% on container|

---

### 3.2 Typography Scale

All type uses **Roboto** as the system default. Google Sans may substitute at Display/Headline for brand-heavy contexts.

#### Type Roles

|Role Token|Font|Size|Weight|Line Height|Letter Spacing|Usage|
|---|---|---|---|---|---|---|
|`display-lg`|Roboto|57px|400|64px|−0.25px|Landmark hero text — one per page maximum|
|`display-md`|Roboto|45px|400|52px|0|Hero section headers|
|`display-sm`|Roboto|36px|400|44px|0|Feature highlights, section openers|
|`headline-lg`|Roboto|32px|400|40px|0|Page-level section titles|
|`headline-md`|Roboto|28px|400|36px|0|Module headers|
|`headline-sm`|Roboto|24px|400|32px|0|Card group titles, panel headers|
|`title-lg`|Roboto|22px|400|28px|0|Card titles, widget headers|
|`title-md`|Roboto|16px|500|24px|0.15px|Card content headers, list item primary text|
|`title-sm`|Roboto|14px|500|20px|0.10px|Secondary card headers, drawer section labels|
|`body-lg`|Roboto|16px|400|24px|0.50px|Comfortable reading copy|
|`body-md`|Roboto|14px|400|20px|0.25px|Standard body copy, form descriptions|
|`body-sm`|Roboto|12px|400|16px|0.40px|Helper text, captions, timestamps|
|`label-lg`|Roboto|14px|500|20px|0.10px|**Buttons**, chip labels, tab labels|
|`label-md`|Roboto|12px|500|16px|0.50px|Navigation labels, badge text|
|`label-sm`|Roboto|11px|500|16px|0.50px|Annotation text, tooltip content|

#### Typography Rules

- **Never mix weights within a single component role.** A card title is always `title-md`. Don't bold it additionally.
- **Line-height ratio for body:** Maintain the 1.5× line-height ratio (e.g. 16px text → 24px line height) for comfortable paragraph reading.
- **Tracking direction:** Display sizes use negative tracking (−0.25px) for tight, impactful display. Labels use positive tracking (+0.1–0.5px) for legibility at small sizes.
- **Alignment:** Default to left-aligned text. Center-align only for hero text, empty states, and toast messages.
- **Truncation:** Apply ellipsis (`text-overflow: ellipsis`) on single-line truncation. For multi-line, use `line-clamp` with a maximum of 2–3 lines.

---

### 3.3 Spacing & Grid

#### Baseline Unit

All spacing is derived from an **8px baseline unit**. Half-steps of 4px are available for micro-adjustments only.

#### Spacing Scale

|Token|Value|Usage|
|---|---|---|
|`xs`|4px|Icon internal padding, badge offsets|
|`sm`|8px|Internal component gap — icon to label, avatar to text|
|`md`|16px|Internal container padding — card padding, section internal spacing|
|`lg`|24px|Section-to-section vertical rhythm|
|`xl`|32px|Major section separators, hero padding additions|
|`touch-target`|48px|Minimum interactive hit area for all touchable elements|

#### Responsive Grid

|Breakpoint|Columns|Margin|Gutter|Container Max Width|
|---|---|---|---|---|
|Phone (`< 600px`)|4|16px|16px|100%|
|Tablet (`600–840px`)|8|24px|24px|100%|
|Desktop (`> 840px`)|12|24px+|24px|1280px|

#### Layout Anatomy

- **Navigation Sidebar:** Fixed `360px` wide on desktop. Collapses to bottom tab bar on mobile.
- **Top App Bar:** Fixed `64px` height. Contains branding, search, and global controls.
- **Content Area:** Fills remaining width. Typically receives `margin: 16px` inset, `border-radius: 12–20px`, `background: surface-container-lowest`.
- **Right Panel (App Panel):** Fixed `56px` icon rail for supplementary apps (Calendar, Notes, Tasks). Hidden on mobile.

---

### 3.4 Shape Language

Shape radius is a system-level semantic decision, not per-component improvisation.

|Shape Scale|Radius Value|Applied To|
|---|---|---|
|Extra Small|4px|Text field top corners, tooltips, snackbar corners|
|Small|8px|Menu surfaces, chip containers|
|Medium|12px|Cards (elevated, outlined, filled), small FABs|
|Large|16px|Navigation drawers (right-side radius), dialogs, side sheets|
|Extra Large|24px|Full hero sections, large modal surfaces|
|Full|9999px|Buttons (all variants), standard FABs, active nav pills, search bars, chips|

#### Shape Rules

- **Buttons are always pill-shaped** (`border-radius: 9999px`). No exceptions.
- **Navigation active indicators** use a pill shape (`64×32px` pill on nav bar; full-height pill on nav rail/drawer).
- **Cards** use `12px` radius. Increase to `16–24px` only for hero containers.
- **Never mix shape radii** within a single component. A card cannot have `12px` on top and `0px` on the bottom.

---

### 3.5 Elevation & Depth

Elevation is expressed through **tonal surface fills** first, and **shadow** second.

|Level|Surface Token|Shadow|Used For|
|---|---|---|---|
|Level 0|`surface`|None|Page background|
|Level 1|`surface-container-low`|`0 1px 2px rgba(0,0,0,0.10)`|Cards, compose buttons, dropdowns|
|Level 2|`surface-container`|`0 1px 3px rgba(0,0,0,0.15)`|Navigation bars, sidebars|
|Level 3|`surface-container-high`|`0 4px 8px rgba(0,0,0,0.15)`|Modals, dialogs, drawers|
|Level 4|`surface-container-highest`|`0 6px 10px rgba(0,0,0,0.15)`|Full-screen overlays, critical dialogs|

#### Scrim

When rendering a Level 3+ element (modal, dialog), apply a **scrim** behind the overlay:

- Background: `inverse-surface` (`#322f35`)
- Opacity: `40%`
- `z-index` below the overlay but above page content

#### Shadow Tinting

Shadows must not be pure black. Tint shadow color slightly toward the surface's primary tone to maintain a cohesive appearance. Use `rgba` rather than `hex` for shadow values to allow opacity control.

---

### 3.6 Motion & Animation

Motion reinforces spatial context and provides feedback. It should feel physical and purposeful.

|Property|Value|Usage|
|---|---|---|
|Duration — Micro|100ms|Ripple initiation, icon swap|
|Duration — Standard|200ms|Hover transitions, color changes|
|Duration — Emphasis|300ms|Component entrance, state changes|
|Duration — Complex|400–500ms|Page transitions, drawer open/close|
|Easing — Standard|`cubic-bezier(0.2, 0, 0, 1)`|Most transitions|
|Easing — Decelerate|`cubic-bezier(0, 0, 0, 1)`|Elements entering the screen|
|Easing — Accelerate|`cubic-bezier(0.3, 0, 1, 1)`|Elements leaving the screen|

#### Ripple Effect

All interactive components (buttons, cards, list items, chips, navigation items) must implement a ripple effect on press.

- Origin: Touch/click point
- Color: `on-surface` or `on-primary` at 10% opacity
- Duration: 300ms with fade-out easing
- Must not overflow component bounds (use `overflow: hidden` + `border-radius` to clip)

#### Pulse Animation (LIVE Indicators)

For real-time indicators, use an `animate-ping` pattern — a scaled, fading concentric pulse — over an `error` background.

---

## 4. Component Reference

---

### 4.1 Buttons

Buttons carry `label-lg` text and are always pill-shaped (`border-radius: 9999px`). Minimum touch target: `48px` height.

#### Variants

|Variant|Background|Text Color|Border|When to Use|
|---|---|---|---|---|
|**Filled**|`primary`|`on-primary`|None|Primary CTA — one per view|
|**Filled Tonal**|`secondary-container`|`on-secondary-container`|None|Secondary CTA — supporting actions|
|**Outlined**|Transparent|`primary`|1px `outline`|Low-emphasis actions; destructive cancel|
|**Text**|Transparent|`primary`|None|Tertiary actions, inline links, "View All" links|
|**Elevated**|`surface-container-low`|`primary`|None|Floating actions needing visual separation|
|**Icon Button**|Transparent|`on-surface-variant`|None|Toolbar and utility icons|

#### States

|State|Visual Change|
|---|---|
|Default|Base token fill|
|Hover|+8% black overlay|
|Focus|+10% black overlay + 3px `secondary` focus ring at 2px offset|
|Pressed|+10% black overlay + ripple effect|
|Disabled|`on-surface` 38% opacity text; `on-surface` 12% opacity container|
|Loading|Replace label with circular progress indicator; maintain button dimensions|

#### Sizing

|Size|Height|Horizontal Padding|Label|
|---|---|---|---|
|Small|32px|12px|`label-sm`|
|Default|40px|24px|`label-lg`|
|Large|56px|32px|`label-lg`|

#### Accessibility

- `role="button"` or native `<button>` element
- `aria-disabled="true"` when disabled (not `disabled` attribute — preserves focusability for screen readers in some contexts)
- Focus ring visible at all times (never `outline: none` without a custom ring)
- Keyboard: `Enter` and `Space` both activate

#### Do's and Don'ts

|✅ Do|❌ Don't|
|---|---|
|Use Filled for the single most important action per view|Stack two Filled buttons — creates ambiguity about priority|
|Pair Filled with Outlined or Text for secondary actions|Use an Outlined button as the primary CTA|
|Keep button labels concise: 1–3 words|Use passive phrases like "Click here"|
|Include a leading icon when it adds meaning|Force icons on every button — reserve for semantic reinforcement|

---

### 4.2 Cards

Cards are containers — they group related information into a scannable, interactive unit.

#### Variants

|Variant|Background|Border|Shadow|Radius|When to Use|
|---|---|---|---|---|---|
|**Elevated**|`surface-container-low`|None|Level 1|12px|Default card — general content grouping|
|**Filled**|`surface-container-highest`|None|None|12px|Denser information — lists embedded in cards|
|**Outlined**|`surface`|1px `outline-variant`|None|12px|When background contrast is needed; forms|
|**Hero**|`primary-container`|None|None|24px|Full-width feature banners; landmark moments|

#### Anatomy

```
┌──────────────────────────┐
│  [Media / Image]         │  Optional
├──────────────────────────┤
│  [Header / Title]        │  title-lg or title-md
│  [Subhead]               │  body-sm, on-surface-variant
│  [Body Content]          │  body-md
│  [Supporting Text]       │  body-sm
├──────────────────────────┤
│  [Action Buttons / Chips]│  Optional
└──────────────────────────┘
```

#### Hover State

Filled and Elevated cards: transition to `surface-container-high` on hover (`transition: background-color 200ms standard-easing`). Add subtle border `outline-variant` on outlined cards at hover.

#### Do's and Don'ts

|✅ Do|❌ Don't|
|---|---|
|Use cards to create clear content chunks in a list or grid|Nest cards inside cards — causes visual hierarchy collapse|
|Keep internal padding at 16px (md)|Vary padding between cards in the same grid|
|Use `line-clamp` on body text when space is constrained|Truncate titles — let them wrap to max 2 lines|
|Restrict card actions to 2–3 maximum|Put more than 3 interactive elements in a single card|

---

### 4.3 Text Fields

Text fields allow user input. They use `outlined` style as the system standard.

#### Outlined Text Field

- **Height:** 56px
- **Border radius:** 4px (extra small — intentionally angular to contrast with pill-shaped buttons)
- **Border:** 1px `outline` in default state
- **Focus border:** 2px `primary`; floating label transitions to top and scales to `body-sm`
- **Background:** `surface`

#### States

|State|Border|Label|Helper Text|
|---|---|---|---|
|Enabled (empty)|1px `outline`|Centered, `body-lg`|`body-sm`, `on-surface-variant`|
|Focus|2px `primary`|Top, `body-sm`, `primary`|`body-sm`, `on-surface-variant`|
|Filled|1px `outline`|Top, `body-sm`, `on-surface-variant`|`body-sm`, `on-surface-variant`|
|Error|1px `error`|Top, `body-sm`, `error`|`body-sm`, `error` + error icon|
|Disabled|1px `on-surface` 12%|N/A|N/A — greyed helper|

#### Anatomy

```
┌─ [Leading Icon] ──────────────── [Trailing Icon] ─┐
│  [Floating Label]                                  │ ← 1px outline → 2px primary on focus
│  [Input Text]                                      │
└────────────────────────────────────────────────────┘
  [Helper Text]                     [Character Count]
```

#### Accessibility

- `<label>` element must be programmatically associated via `for/id` or `aria-labelledby`
- Error messages announced via `aria-describedby` pointing to the error element
- Never rely on placeholder text alone as a label — placeholders disappear on input

---

### 4.4 Navigation

#### Navigation Bar (Mobile / Bottom)

- **Height:** 80px
- **Background:** `surface-container`
- **Items:** 3–5 destinations
- **Active indicator:** 64×32px pill in `secondary-container`; icon in `on-secondary-container`; label in `on-surface`
- **Inactive:** Icon and label in `on-surface-variant`
- **Labels:** Always visible (`label-md`)

#### Navigation Rail (Tablet)

- **Width:** 80px
- **Background:** `surface-container`
- **FAB:** Optional at top
- **Active indicator:** Full-height pill in `secondary-container`
- **Icons only** by default; label appears below active icon

#### Navigation Drawer (Desktop)

- **Width:** 360px (standard) / 256px (modal)
- **Background:** `surface-container-low`
- **Border radius:** 0px on left edge (flush to viewport); 16px on right edge (large shape)
- **Items:** Text label + leading icon
- **Active item:** Full-width pill in `secondary-container`; text `on-secondary-container`, weight 500
- **Section dividers:** `outline-variant` at 1px; sections labeled with `label-sm`, `on-surface-variant`
- **Utility area (bottom):** Separator line; Settings and Support links always present

#### Tabs

- **Height:** 48px (primary) / 48px (secondary)
- **Active state:** Bottom border 3px `primary`; text `primary`, weight 500
- **Inactive state:** Text `on-surface-variant`
- **Badges:** Positioned top-right of tab icon; uses `error` or custom category colors
- **Scrollable tabs:** Use when more than 5 items exist

#### Search Bar

- **Height:** 48px (standard) / 56px (full-width hero search)
- **Background:** `surface-container` (resting); `surface-container-lowest` (focused)
- **Border radius:** Full (`9999px`)
- **Border:** None — background change signals focus
- **Shadow on focus:** Level 1 (`0 1px 3px rgba(0,0,0,0.15)`)
- **Leading:** Search icon (`on-surface-variant`)
- **Trailing:** Filter/tune icon

---

### 4.5 Chips

Chips are compact elements for actions, filters, or input values.

|Type|Purpose|Default Background|Selected Background|
|---|---|---|---|
|**Assist**|Contextual actions|`surface-container-low`|`surface-container-high`|
|**Filter**|Toggle filtering criteria|`surface-container-low`|`secondary-container`|
|**Input**|Represent values in a field|`surface-container-low`|`secondary-container`|
|**Suggestion**|AI / contextual suggestions|`surface-container-low`|N/A|

- **Height:** 32px
- **Border radius:** Full (`9999px`)
- **Border:** 1px `outline-variant` (unselected); none (selected)
- **Padding:** 8px horizontal; icon–label gap 8px
- **Label:** `label-lg`

#### Do's and Don'ts

|✅ Do|❌ Don't|
|---|---|
|Use filter chips for multi-select filtering|Use chips as primary navigation|
|Allow chip deletion (×) for input chips|Create chips without a clear contextual purpose|
|Group chips horizontally in a scrollable row|Stack chips vertically — use a list instead|

---

### 4.6 Dialogs

Dialogs interrupt the user to request a decision or surface critical information.

- **Background:** `surface-container-highest`
- **Border radius:** 28px (extra large)
- **Width:** 280–560px (responsive); full-screen on mobile
- **Max height:** 80vh; content scrollable internally
- **Scrim:** `inverse-surface` 40% opacity behind dialog
- **Elevation:** Level 3

#### Anatomy

```
┌──────────────────────────┐
│  [Icon] (optional)       │
│  [Title]  title-lg       │
│                          │
│  [Body content]          │
│  body-md, on-surface     │
│                          │
│  [Outlined] [Filled Btn] │ ← Action buttons right-aligned
└──────────────────────────┘
```

#### Accessibility

- `role="dialog"` with `aria-labelledby` pointing to title
- Focus trapped inside dialog while open
- `Escape` key dismisses (unless a critical decision must be made)
- Focus returns to trigger element on close

---

### 4.7 FAB — Floating Action Button

FABs represent the single most important action available on a screen.

|Type|Size|Shape|Background|Icon|
|---|---|---|---|---|
|Small FAB|40px|12px radius|`surface-container-high`|24px icon|
|Standard FAB|56px|Full|`primary-container`|24px icon|
|Large FAB|96px|Full|`primary-container`|36px icon|
|Extended FAB|56px height|Full|`primary-container`|Icon + `label-lg` label|

- FABs must be positioned bottom-right on mobile (above the navigation bar, 16px inset)
- FABs float above page content at Level 3 elevation
- Maximum **one** standard/large FAB per screen

---

### 4.8 Lists

#### List Item Anatomy

```
[Leading - Icon/Avatar/Checkbox]  [Content Block]  [Trailing - Icon/Meta/Switch]
                                  Primary text (body-lg)
                                  Supporting text (body-md, on-surface-variant)
```

- **One-line height:** 56px
- **Two-line height:** 72px
- **Three-line height:** 88px
- **Dividers:** `outline-variant` 1px, optional — prefer generous padding to separate items instead
- **Hover state:** `surface-container-high`
- **Selected state:** `secondary-container` with `on-secondary-container` text

#### File / Resource List (Specialized)

Used in document management contexts (observed in EduFlow Resource Library):

- **12-column grid layout** for desktop: Name (4–5 col), Reason/Modified (4 col), Owner (2 col), Location (2 col), Actions (1 col)
- Hover reveals trailing action button (`more_vert`) — hidden at rest (`opacity: 0`, `group-hover:opacity-100`)
- File type icon replaces generic leading icon; color-coded: green (spreadsheet), blue (document), red (PDF)
- Sharing indicator: small `group` icon beside filename for shared resources

---

### 4.9 Progress Indicators

|Type|When to Use|
|---|---|
|**Linear (Determinate)**|Known progress duration — file upload, form step|
|**Linear (Indeterminate)**|Unknown duration — page loading, data fetching|
|**Circular (Determinate)**|Compact contexts — small status dashboards, card loaders|
|**Circular (Indeterminate)**|Button loading states, inline async operations|

- All progress indicators use `primary` fill on `surface-variant` track
- Storage bars may use `primary` on `surface-variant` track — keep to 4px height
- Never show both a skeleton and a progress indicator for the same content

---

### 4.10 Badges & Avatars

#### Badges

|Type|Shape|Background|Text|Placement|
|---|---|---|---|---|
|Count badge|Pill|`error`|`on-error`, `label-sm`|Top-right of icon; 2px offset|
|New badge (unlabeled)|6px circle|`error`|None|Top-right of icon|
|Category badge|Pill|Varies by category color|`label-sm`|Inline within nav tab or card|

**Count badge rules:**

- 1–9: Show number
- 10–99: Show number
- 100+: Show "99+" or category-appropriate abbreviation

#### Avatars

|Type|Sizes|Shape|Fallback|
|---|---|---|---|
|Photo avatar|24, 32, 40, 48px|Full circle|Initials on `surface-variant` background|
|Icon avatar|24, 32, 40, 48px|Full circle|Platform icon|
|Initials avatar|Any|Full circle|`primary` background, `on-primary` text|

- Always provide `alt` text for photo avatars: `"[Name] profile photo"` or `"User"` if name unavailable
- Stacked avatar groups: −8px margin overlap; show "+N" text avatar after 3 visible

---

### 4.11 Snackbars & Toasts

Snackbars provide brief, auto-dismissing feedback. They appear at the bottom-center of the screen.

- **Background:** `inverse-surface`
- **Text color:** `inverse-on-surface`, `body-md`
- **Action color:** `inverse-primary`, `label-lg`
- **Border radius:** 4px (small)
- **Max width:** 672px; Min width: 288px
- **Auto-dismiss:** 4 seconds (informational); 10 seconds (with action)
- **Max 1 visible at a time** — queue subsequent snackbars

|Type|Usage|
|---|---|
|**Informational**|Confirmation of completed action ("File uploaded")|
|**With Action**|Recoverable actions ("Email deleted · Undo")|
|**Error**|Non-critical failures ("Couldn't connect to server")|

---

## 5. Pattern Library

---

### 5.1 Page Layout

#### Standard Desktop Layout

```
┌──────────────────────────────────────────────────────────┐
│ [Top App Bar — 64px] — Brand | Search | Global Controls  │
├──────────────┬───────────────────────────────┬───────────┤
│  [Sidebar    │  [Main Content Area]          │  [App     │
│   Drawer     │                               │   Rail    │
│   360px]     │  Inset: 16px margin           │   56px]   │
│              │  bg: surface-container-lowest │           │
│  bg:         │  border-radius: 16–20px       │  bg:      │
│  surface-    │  shadow: Level 1              │  surface  │
│  container   │                               │           │
│  -low        │                               │           │
│              │                               │           │
│              │                               │           │
└──────────────┴───────────────────────────────┴───────────┘
```

- **Sidebar** is `position: fixed` or part of flex row, `overflow-y: auto`
- **Main content** is `overflow-y: auto` — only the content area scrolls
- **App rail** icons: Calendar, Notes, Tasks, Contacts; always includes an Add (`+`) icon at bottom

#### Spacing Insets for Main Content

- Top padding: `16px` (desktop) / `16px` (tablet/mobile)
- Section gaps: `24px` (lg)
- Internal card padding: `16px` (md)

---

### 5.2 Forms

#### Form Layout Rules

- Stack fields vertically with `16px` gap between fields
- Group related fields in `surface-container-low` card containers
- Use section headers (`title-md`) when a form spans multiple logical groups
- Submit button is always **Filled**, right-aligned, with `label-lg`
- Destructive reset/cancel uses **Outlined** or **Text** button, left of submit

#### Validation Timing

- **Don't validate on initial focus** — wait for first blur or submission attempt
- **Validate on blur** for format-sensitive fields (email, phone)
- **Validate in real-time** (debounced 300ms) only for character count and strength indicators
- **Error messages** appear below the field in `body-sm`, `error` color, accompanied by an error icon in the trailing position of the text field

#### Form Submission States

1. Idle → Submit pressed → Button shows loading state (circular progress, disabled)
2. Success → Snackbar confirmation + navigate or reset form
3. Error → Inline field errors + top-level error banner (if critical)

---

### 5.3 Data Tables & File Lists

#### Column Structure

- **Name column** carries the primary affordance (click to open) — always first, 35–40% of table width
- **Metadata columns** (date, owner, location) are hidden progressively on smaller breakpoints
- **Action column** (1 column, right-aligned): Icon button (`more_vert`) revealed only on row hover

#### Row Anatomy

- **Height:** 56px (comfortable); 48px (compact mode)
- **Hover:** `surface-container-low` background
- **Selected:** `secondary-container` background; checkbox leading indicator visible
- **Active/Unread rows:** `surface-container-low` background baseline (slightly elevated from read rows which remain on `surface`)

#### Table Header

- `label-md`, `on-surface-variant` text
- `border-bottom: 1px outline-variant`
- Sticky-positioned (`position: sticky; top: 0`) inside the scrollable container
- Sort icon (`unfold_more` / `arrow_upward` / `arrow_downward`) trailing the header label

---

### 5.4 Hero Sections

Hero sections are page-level landmark moments. Used on dashboard homepages, course overview pages, and feature spotlights.

#### Structure

- **Background:** `primary-container` or a custom branded container with image overlay at 20% opacity
- **Border radius:** 24px (extra large)
- **Minimum height:** 240px (mobile) / 300px (desktop)
- **Content alignment:** Bottom-left (`flex-direction: column; justify-content: flex-end`)
- **Text colors:** `on-primary-container` hierarchy (`display-sm/md`, `body-lg`)
- **Actions:** Max 2 buttons — one Filled (inverted: `on-primary-container` bg, `primary-container` text), one Outlined

#### Image Handling

- Background image at `opacity: 20%` — content remains readable without overlay scrim
- Image `object-fit: cover`, `object-position: center`
- Provide `data-alt` attribute for accessibility tooling even when image is decorative

---

### 5.5 Empty States

Empty states appear when a view contains no content yet — first-time use, cleared filters, or search with no results.

#### Structure

```
                [Illustration / Icon — 120px]
                [Title — headline-sm]
         [Supporting description — body-md, on-surface-variant, centered]
                     [Primary Action — Filled Button]
```

- **Icon:** Material Symbols Outlined, 120px, `on-surface-variant` or a tonal illustration
- **Title:** `headline-sm`, `on-surface`, centered
- **Description:** `body-md`, `on-surface-variant`, max-width 280px, centered
- **Action:** Filled button, single primary action only

#### Common Empty State Messages

|Context|Title|Description|
|---|---|---|
|Empty inbox|"All clear"|"No new messages here"|
|Empty search|"No results found"|"Try a different keyword or check your filters"|
|Empty folder|"Nothing here yet"|"Create your first resource to get started"|
|No notifications|"You're up to date"|"We'll let you know when something needs your attention"|

---

### 5.6 Error & Validation States

#### Field-Level Errors

- Text field border → 1px `error`
- Trailing icon → `error_outline` in `error` color
- Helper text → `body-sm`, `error` color
- Floating label → `error` color

#### Page-Level Errors

- Use an error banner (`error-container` background, `on-error-container` text, `border-radius: 12px`) pinned below the top app bar
- Include icon (`error_outline`), message, and a recovery action if possible

#### 404 / 500 System Errors

- Full-page empty state layout
- Icon: Large system icon or spot illustration
- Title: `headline-sm` — friendly language ("We can't find that page" vs "404 Error")
- Actions: "Go Home" (Filled) + "Contact Support" (Outlined)

---

## 6. Accessibility Standards

All components must meet **WCAG 2.1 Level AA** as a baseline. Target AAA for text contrast where feasible.

### Contrast Requirements

|Use|Minimum Ratio|
|---|---|
|Body text on surface|4.5:1 (AA)|
|Large text (18px+ / 14px+ bold) on surface|3:1 (AA)|
|Interactive UI components and focus indicators|3:1 (AA)|
|Text on `primary`|Ensure `on-primary` (#ffffff) — ratio ≥ 4.5:1|
|Text on `secondary-container`|Ensure `on-secondary-container` — ratio ≥ 4.5:1|

### Keyboard Navigation

|Key|Expected Behavior|
|---|---|
|`Tab`|Move focus forward through all interactive elements|
|`Shift + Tab`|Move focus backward|
|`Enter` / `Space`|Activate button, toggle checkbox, open dropdown|
|`Arrow keys`|Navigate within a component group (tab bar, list, radio group)|
|`Escape`|Close dialog, dropdown, drawer; clear search|
|`Home` / `End`|Jump to first/last item in a list or tab bar|

### Focus Indicators

- **Focus ring:** 3px thick, `secondary` color, 2px offset
- Never remove focus outlines (`outline: none`) without providing a custom visible replacement
- Focus ring must be visible against all surface backgrounds

### Screen Reader Guidance

- All icons used alone must have `aria-label` or be accompanied by visually hidden text
- Status badges (LIVE, count) must be included in the accessible label of their parent element
- Decorative images use `alt=""` or `role="presentation"`
- Dynamic content updates use `aria-live="polite"` (announcements) or `aria-live="assertive"` (critical errors)
- Use semantic HTML elements (`<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<section>`) before reaching for ARIA roles

### Motion & Reduced Motion

- All animations must respect `prefers-reduced-motion: reduce`
- When reduced motion is active: disable transitions, fade instead of slide, remove ripple effect

---

## 7. Implementation Guide

### Token Setup (CSS Custom Properties)

```css
:root {
  /* Surface */
  --color-surface: #fef7ff;
  --color-surface-dim: #ded8df;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f8f2f9;
  --color-surface-container: #f2ecf3;
  --color-surface-container-high: #ece6ed;
  --color-surface-container-highest: #e6e1e8;
  --color-surface-variant: #e6e1e8;

  /* On Surface */
  --color-on-surface: #1d1b20;
  --color-on-surface-variant: #494551;
  --color-inverse-surface: #322f35;
  --color-inverse-on-surface: #f5eff6;

  /* Outline */
  --color-outline: #7a7582;
  --color-outline-variant: #cbc4d2;

  /* Primary */
  --color-primary: #4f378a;
  --color-on-primary: #ffffff;
  --color-primary-container: #6750a4;
  --color-on-primary-container: #e0d2ff;
  --color-inverse-primary: #cfbcff;
  --color-surface-tint: #6750a4;

  /* Secondary */
  --color-secondary: #625b71;
  --color-on-secondary: #ffffff;
  --color-secondary-container: #e8def9;
  --color-on-secondary-container: #686177;

  /* Tertiary */
  --color-tertiary: #633b48;
  --color-on-tertiary: #ffffff;
  --color-tertiary-container: #7d5260;
  --color-on-tertiary-container: #ffcbda;

  /* Error */
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-touch: 48px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Motion */
  --motion-micro: 100ms;
  --motion-standard: 200ms;
  --motion-emphasis: 300ms;
  --motion-complex: 400ms;
  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --easing-decelerate: cubic-bezier(0, 0, 0, 1);
  --easing-accelerate: cubic-bezier(0.3, 0, 1, 1);
}
```

### Tailwind Config Mapping

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'surface': 'var(--color-surface)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'surface-variant': 'var(--color-surface-variant)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'outline': 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        'primary': 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary-container': 'var(--color-on-primary-container)',
        'secondary': 'var(--color-secondary)',
        'secondary-container': 'var(--color-secondary-container)',
        'on-secondary-container': 'var(--color-on-secondary-container)',
        'tertiary': 'var(--color-tertiary)',
        'tertiary-container': 'var(--color-tertiary-container)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',
        'error': 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',
      },
      borderRadius: {
        'xs': 'var(--radius-xs)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
      },
    }
  }
}
```

### Icon Library

This system uses **Material Symbols Outlined** (variable font) as the primary icon set.

```html
<!-- Load from Google Fonts CDN -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
```

**Icon sizing rules:**

- Navigation icons: 24px
- Action icons in toolbars: 20px
- Trailing/leading icons in components: 18–20px
- Hero/decorative icons: 48–120px

**Filled vs Outlined:**

- Use **Outlined** as default
- Use **Filled** (FILL=1) only for the active state of navigational icons and selected indicators

---

## 8. Governance & Contribution

### Version Control

|Version Type|When Applied|Example|
|---|---|---|
|**Patch** `x.x.N`|Bug fixes, copy corrections, minor token adjustments|`1.0.1`|
|**Minor** `x.N.x`|New components, new patterns, additive token additions|`1.1.0`|
|**Major** `N.x.x`|Breaking changes — token renames, component API changes, color palette shifts|`2.0.0`|

Breaking changes require a **migration guide** documenting: what changed, why it changed, and how to update existing implementations.

### Contribution Process

1. **Identify the gap** — Is this a new component, a pattern, or a token?
2. **Check for existing coverage** — Search this doc and the component library before adding
3. **Draft a proposal** — Use the `/design-system extend [component]` workflow for new additions
4. **Cross-functional review** — New components require sign-off from: UI Lead, UX Lead, Engineering Lead, Accessibility reviewer
5. **Document first** — Documentation is mandatory before a component enters the system, not after
6. **Release notes** — Every change is changelog-documented at time of merge

### Component Maturity Model

|Stage|Label|Meaning|
|---|---|---|
|🧪 Experimental|`experimental`|In active exploration; not production-safe|
|🔶 Beta|`beta`|Usable but API may change; use with caution|
|✅ Stable|`stable`|Production-ready; changes are semver-managed|
|🚫 Deprecated|`deprecated`|Migration path documented; do not use in new work|

### Roles & Responsibilities

|Role|Responsibility|
|---|---|
|**Design Systems Lead**|Token governance, system architecture, breaking change decisions|
|**UI Designer**|Component visual spec, variant definition, Figma maintenance|
|**UX Designer**|Pattern documentation, interaction spec, do/don't guidelines|
|**UX Researcher**|Usability validation of new patterns; accessibility audits|
|**Product Designer**|Cross-product consistency review; consumer-use feedback|
|**Engineering Lead**|Token implementation, component API design, performance review|
|**Accessibility Reviewer**|WCAG audit; keyboard/screen reader testing before `stable` status|

---

_Material Tonal Logic Design System · v1.0.0 · Confidential & Internal_