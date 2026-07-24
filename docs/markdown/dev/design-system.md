# Verdure Design System

See also: [[Design System Strategy]] · [[verdure-design-system]] · [[concept-clo MOC]]

**Version 1.4.0** · Production Release · ใช้งานจริง

> **1.4.0 Changelog:** รวม typeface เหลือ **IBM Plex Sans Thai** เพียง family เดียว (เดิม Noto Serif + Plex Mono) · Icons ใช้ **React Icons (Lucide)** เท่านั้น — ห้าม emoji · Google Colors สงวนไว้สำหรับ **status semantic** ไม่ใช้ decorative

> ระบบออกแบบที่สร้างบนรากฐาน Material Design 3 Color System — ใช้ palette สี Cool Neutral Violet ที่มีความ sophisticated, อ่านง่าย และ accessible ในทุก surface layer ผสมผสานกับ typography ที่สมดุลระหว่างมรดกทางวัฒนธรรมและประสิทธิภาพในการใช้งาน

---

## สารบัญ

1. [Brand Identity](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#1-brand-identity)
2. [Typography](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#2-typography)
3. [Color System](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#3-color-system)
4. [Status Colors](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#4-status-colors)
5. [Spacing & Shape](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#5-spacing--shape)
6. [Elevation & Shadow](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#6-elevation--shadow)
7. [Iconography](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#7-iconography)
8. [Components](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#8-components)
    - [Button](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#81-button)
    - [Input & Form](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#82-input--form)
    - [Badge & Tag](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#83-badge--tag)
    - [Card](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#84-card)
    - [Alert](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#85-alert)
    - [Navigation](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#86-navigation)
    - [Progress](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#87-progress)
    - [Avatar](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#88-avatar)
    - [Toggle](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#89-toggle)
9. [Motion & Animation](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#9-motion--animation)
10. [Accessibility](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#10-accessibility)
11. [Token Reference](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#11-token-reference)
12. [Educational Domain — Google Color Semantic Usage](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#12-educational-domain--google-color-semantic-usage)
13. [Drag & Drop — CLOs and Tasks](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#13-drag--drop--clos-and-tasks)
14. [UX Interaction Principles — Desktop App Feel](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#14-ux-interaction-principles--desktop-app-feel)
15. [Right-Click Context Menu — CRUD & Clipboard](https://claude.ai/chat/fce81608-a42a-4f4e-95ca-18aa14992de0#15-right-click-context-menu--crud--clipboard)

---

## 1. Brand Identity

### Visual Personality

|มิติ|คำอธิบาย|
|---|---|
|**Core Feeling**|Calm, Precise, Trustworthy|
|**Visual Tone**|Cool, Neutral, Sophisticated|
|**Typography Mood**|Functional clarity — single family, weight-driven hierarchy|
|**Color Inspiration**|Material Design 3 — Cool Violet Neutral|

### Design Principles

**1. Surface Layering First** ใช้ระบบ surface container ทั้ง 5 ระดับในการสร้าง depth — ไม่ใช้ shadow เพียงอย่างเดียว แต่ใช้สีของ surface บอก elevation

**2. Hierarchy through Weight** ใช้ IBM Plex Sans Thai เพียง family เดียว — สร้าง contrast ระหว่าง Headlines กับ Body ด้วย weight (700 → 400) และ size แทนการสลับ typeface เพื่อความสม่ำเสมอและ functional clarity

**3. Role-based Color Usage** ทุก token มีบทบาทชัดเจน — ใช้ `--md-primary` กับ interactive elements เท่านั้น, ใช้ `--md-on-surface` กับ text หลัก, อย่า hardcode hex ลงใน component

**4. Purposeful Motion** Animation ทุกอันต้องมีเหตุผล — ไม่ใช่แค่ความสวยงาม แต่ต้องสื่อสาร state หรือ relationship

---

## 2. Typography

### Font Stack

ระบบนี้ใช้ **typeface เดียว — IBM Plex Sans Thai** สำหรับทุก role (headlines, body, UI, code) เพื่อความสม่ำเสมอและ performance ที่ดีขึ้น — hierarchy สร้างจาก weight และ size ไม่ใช่การสลับ typeface

```css
/* Headlines, Body, UI, Labels, Code — ทุก role ใช้ family เดียว */
font-family: 'IBM Plex Sans Thai', 'IBM Plex Sans', -apple-system, sans-serif;
```

> **Design Decision:** Token `--font-serif` และ `--font-mono` ยังคงมีอยู่เพื่อ semantic role — แต่ปัจจุบัน map ไปที่ IBM Plex Sans Thai ทั้งหมด หากอนาคตต้องการ display face หรือ monospace แยก สามารถเปลี่ยนที่ token เดียวได้โดยไม่กระทบ component

### Import (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@100;200;300;400;500;600;700&display=swap" rel="stylesheet">
```

### Type Scale

> ทุก token ใช้ **IBM Plex Sans Thai** — hierarchy สร้างจาก Size × Weight

|Token|Size|Weight|Line Height|Use Case|
|---|---|---|---|---|
|`--text-display`|48px|700|1.05|Hero Headlines|
|`--text-h1`|36px|700|1.1|Page Titles|
|`--text-h2`|26px|600|1.2|Section Titles|
|`--text-h3`|20px|700|1.3|Sub-section Headers|
|`--text-h4`|17px|600|1.4|Card Titles|
|`--text-body-lg`|16px|400|1.7|Primary Reading|
|`--text-body`|14px|400|1.7|Default Body|
|`--text-body-sm`|13px|400|1.6|Supporting Text|
|`--text-label`|12px|600|1.4|Form Labels|
|`--text-caption`|11px|500|1.4|Metadata, Timestamps|
|`--text-overline`|10px|700|1.4|Section Tags (UPPERCASE)|
|`--text-code`|13px|400|1.6|Code Snippets (tabular)|

### CSS Variables

```css
:root {
  /* Single typeface — all three roles map to IBM Plex Sans Thai */
  --font-serif: 'IBM Plex Sans Thai', 'IBM Plex Sans', -apple-system, sans-serif;
  --font-sans:  'IBM Plex Sans Thai', 'IBM Plex Sans', -apple-system, sans-serif;
  --font-mono:  'IBM Plex Sans Thai', 'IBM Plex Sans', -apple-system, sans-serif;

  --text-display: clamp(36px, 5vw, 48px);
  --text-h1: clamp(28px, 4vw, 36px);
  --text-h2: clamp(20px, 3vw, 26px);
  --text-h3: 20px;
  --text-h4: 17px;
  --text-body-lg: 16px;
  --text-body: 14px;
  --text-body-sm: 13px;
  --text-label: 12px;
  --text-caption: 11px;
  --text-overline: 10px;
  --text-code: 13px;

  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  --leading-tight: 1.1;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
  --leading-loose: 1.9;

  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
  --tracking-widest: 0.15em;
}
```

### Typography Usage Rules

```
DO    ใช้ IBM Plex Sans Thai สำหรับทุก element — headlines, body, UI, code
DO    สร้าง hierarchy ด้วย weight (700 headline → 400 body) และ size
DO    ใช้ weight 600–700 สำหรับ headlines เพื่อสร้าง gravitas แทน serif face
DO    ใช้ letter-spacing: 0.1em + UPPERCASE สำหรับ Section Tags เท่านั้น
DO    ใช้ font-variant-numeric: tabular-nums สำหรับตัวเลขใน code/ตาราง

DON'T ใช้ font-weight ต่ำกว่า 400 บน body text
DON'T ใช้ font-size ต่ำกว่า 11px ใน production
DON'T โหลด typeface อื่นเพิ่ม — ระบบใช้ family เดียวโดยเจตนา
DON'T ใช้ UPPERCASE กับ body copy ยาวกว่า 3 คำ
```

---

## 3. Color System

ระบบสีนี้สกัดตรงจาก **opu.html** — ใช้ M3 Color Role naming แต่ค่า hex ตรงกับ production color palette ที่ใช้งานจริง แบ่งเป็น 4 กลุ่มหลัก: Surface, Primary (near-black), Secondary (slate-violet), และ JP Accent palette

### Color Philosophy — M3 Roles

```
Primary        → Near-black #19151b — CTA, navbar, ticker, footer
Secondary      → Slate-violet #5c5c78 — secondary actions, links
Tertiary       → Deep charcoal #1d1418 — dark decorative elements
JP Accents     → Fuji violet, Toki pink, Shikoku navy — gradients, chips
Surface        → Cool grey scale #f9f9fb → #e2e2e4 — all backgrounds
```

### M3 Color Tokens — Extracted from opu.html

```css
:root {
  /* ── SURFACE HIERARCHY ──────────────────────────────────────────
     Outer body bg = #e2e2e4 (page frame)
     Page card bg  = #f9f9fb (main content wrapper)
     ─────────────────────────────────────────────────────────────── */
  --md-surface:                  #f9f9fb;   /* Page card background ★ */
  --md-surface-dim:              #d9dadc;   /* Dimmed — disabled bg, product panel */
  --md-surface-bright:           #f9f9fb;   /* Bright surface variant */
  --md-surface-container-lowest: #ffffff;   /* Elev 0 — Cards, modals, glass cards */
  --md-surface-container-low:    #f3f3f5;   /* Elev 1 — Sidebar, detail panel */
  --md-surface-container:        #eeeef0;   /* Elev 2 — Navbar, toolbar, dot-grid bg */
  --md-surface-container-high:   #e8e8ea;   /* Elev 3 — Hub box, popover bg */
  --md-surface-container-highest:#e2e2e4;   /* Elev 4 — Page frame bg, context menu */

  /* ── ON-SURFACE (Text & Icon on surface) ───────────────────────── */
  --md-on-surface:               #1a1c1d;   /* Primary text — all body, headlines ★ */
  --md-on-surface-variant:       #4a454a;   /* Secondary text — muted, supporting */

  /* ── INVERSE SURFACE ──────────────────────────────────────────── */
  --md-inverse-surface:          #2f3132;   /* Inverse bg — toasts, snackbars */
  --md-inverse-on-surface:       #f0f0f2;   /* Text on inverse surface */

  /* ── OUTLINE ─────────────────────────────────────────────────────── */
  --md-outline:                  #7b757b;   /* Default border, input border ★ */
  --md-outline-variant:          #ccc4ca;   /* Subtle border — cards, table divider */

  /* ── PRIMARY — Near-black (CTA buttons, navbar, footer) ────────── */
  --md-primary:                  #19151b;   /* Primary action — darkest near-black ★ */
  --md-on-primary:               #ffffff;   /* Text/icon on primary */
  --md-primary-container:        #2e2930;   /* Dark container — elevated dark surfaces */
  --md-on-primary-container:     #978f98;   /* Muted text on primary container */
  --md-inverse-primary:          #cdc4cd;   /* Primary on dark surface */
  --md-surface-tint:             #19151b;   /* Tint overlay (matches primary) */
  --md-primary-hover:            #44405a;   /* Hover state of primary button ★ */
  --md-primary-fixed:            #f4f4f6;   /* Fixed light bg (jp-white) */
  --md-primary-fixed-dim:        #cdc4cd;   /* Dimmer fixed variant */
  --md-on-primary-fixed:         #19151b;   /* Text on primary-fixed */
  --md-on-primary-fixed-variant: #44405a;   /* Secondary text on primary-fixed */

  /* ── SECONDARY — Slate-violet (secondary actions, active states) ── */
  --md-secondary:                #5c5c78;   /* Violet-slate secondary ★ */
  --md-on-secondary:             #ffffff;   /* Text on secondary */
  --md-secondary-container:      #deddfe;   /* Light violet chip bg */
  --md-on-secondary-container:   #60607c;   /* Text on secondary container */
  --md-secondary-fixed:          #deddfe;   /* Fixed secondary bg */
  --md-secondary-fixed-dim:      #c5c3e4;   /* Dimmer secondary fixed */
  --md-on-secondary-fixed:       #19151b;   /* Text on secondary-fixed */
  --md-on-secondary-fixed-variant:#5c5c78;  /* Secondary text on sec-fixed */

  /* ── TERTIARY — Deep charcoal (decorative dark elements) ──────── */
  --md-tertiary:                 #1d1418;   /* Deep charcoal ★ */
  --md-on-tertiary:              #ffffff;   /* Text on tertiary */
  --md-tertiary-container:       #32282c;   /* Dark tertiary container */
  --md-on-tertiary-container:    #9d8e93;   /* Text on tertiary container */
  --md-tertiary-fixed:           #e9e0e9;   /* Fixed tertiary bg */
  --md-tertiary-fixed-dim:       #cdc4cd;   /* Dimmer tertiary fixed */
  --md-on-tertiary-fixed:        #1d1418;   /* Text on tertiary-fixed */
  --md-on-tertiary-fixed-variant:#635c64;   /* Secondary text on ter-fixed */

  /* ── ERROR — System error color ─────────────────────────────────── */
  --md-error:                    #ba1a1a;   /* Error / graph accent lines ★ */
  --md-on-error:                 #ffffff;   /* Text on error */
  --md-error-container:          #ffdad6;   /* Error surface bg */
  --md-on-error-container:       #93000a;   /* Text on error container */

  /* ── BACKGROUND ─────────────────────────────────────────────────── */
  --md-background:               #f9f9fb;   /* Page card bg = surface */
  --md-on-background:            #1a1c1d;   /* Text on background */
  --md-page-frame:               #e2e2e4;   /* Outermost page bg (body) */

  /* ── SURFACE VARIANT ─────────────────────────────────────────────── */
  --md-surface-variant:          #e2e2e4;   /* = container-highest */

  /* ── JP ACCENT PALETTE ───────────────────────────────────────────
     สีเสริมจาก Japanese palette ใน opu.html — ใช้สำหรับ
     gradient, illustration, avatar, testimonial bg, decorative
  ─────────────────────────────────────────────────────────────── */
  --jp-fuji:    #a6a5c4;   /* Muted violet — primary accent ★ testimonials bg, avatar */
  --jp-shikoku: #2e2930;   /* Deep navy-purple — dark accent surfaces */
  --jp-toki:    #e4d2d8;   /* Pale rose — gradient start, product panels */
  --jp-white:   #f4f4f6;   /* Off-white — glass card bg, overlay */
  --hue-fg:     #b8bed7;   /* Light steel — gradient, product visual */
  --hue-cool:   #afaecc;   /* Cool lavender — gradient mid */
  --hue-mount:  #85758f;   /* Muted mauve — gradient deep */
  --hue-vlight: #524e68;   /* Deep violet-light — gradient deep, avatar bg */
  --hue-vdark:  #44405a;   /* Deep violet-dark — primary hover ★ */
}
```

### Surface Elevation Map

|Level|Token|Hex|ใช้สำหรับ|
|---|---|---|---|
|**Frame**|`--md-page-frame`|`#e2e2e4`|Body background, outer page frame|
|**Page**|`--md-surface` / `--md-background`|`#f9f9fb`|Page card, main content area|
|**0 — Lowest**|`--md-surface-container-lowest`|`#ffffff`|Cards, glass cards, modals|
|**1 — Low**|`--md-surface-container-low`|`#f3f3f5`|Sidebar, detail panel, CTA box|
|**2 — Default**|`--md-surface-container`|`#eeeef0`|Navbar, dot-grid section bg|
|**3 — High**|`--md-surface-container-high`|`#e8e8ea`|Hub box, popover bg|
|**4 — Highest**|`--md-surface-container-highest`|`#e2e2e4`|Tooltip, context menu|
|**Dim**|`--md-surface-dim`|`#d9dadc`|Product panel gradient, disabled bg|
|**Inverse**|`--md-inverse-surface`|`#2f3132`|Toast, Snackbar bg|
|**Primary Dark**|`--md-primary`|`#19151b`|Ticker tape, Footer bg, CTA button|

### Color Semantic Roles — Mapped to opu.html

|Role|Token|Hex|ใช้สำหรับ|
|---|---|---|---|
|**Page Frame**|`--md-page-frame`|`#e2e2e4`|html body background|
|**Page Card**|`--md-background`|`#f9f9fb`|Main content wrapper|
|**Card / Modal**|`--md-surface-container-lowest`|`#ffffff`|Card, dialog, glass overlay|
|**Panel**|`--md-surface-container-low`|`#f3f3f5`|Sidebar, secondary panel|
|**Navbar / Section**|`--md-surface-container`|`#eeeef0`|Navbar bg, dot-grid section|
|**Popover**|`--md-surface-container-high`|`#e8e8ea`|Dropdown, hub box|
|**Context Menu**|`--md-surface-container-highest`|`#e2e2e4`|Right-click menu bg|
|**Text Primary**|`--md-on-surface`|`#1a1c1d`|All headlines, body text|
|**Text Secondary**|`--md-on-surface-variant`|`#4a454a`|Supporting, label, spec text|
|**Text Muted**|`--md-outline`|`#7b757b`|Captions, placeholders, nav links|
|**Border Default**|`--md-outline`|`#7b757b`|Input border, dividers|
|**Border Subtle**|`--md-outline-variant`|`#ccc4ca`|Card border, table row|
|**CTA / Brand**|`--md-primary`|`#19151b`|Primary buttons, nav mark|
|**CTA Hover**|`--md-primary-hover`|`#44405a`|Primary button hover ★|
|**Text on CTA**|`--md-on-primary`|`#ffffff`|Text on dark button|
|**Secondary Action**|`--md-secondary`|`#5c5c78`|Secondary buttons, active states|
|**Accent Violet**|`--jp-fuji`|`#a6a5c4`|Decorative bar, avatar, ticker|
|**Accent Rose**|`--jp-toki`|`#e4d2d8`|Product gradient, chip tag|
|**Error / Graph**|`--md-error`|`#ba1a1a`|Error state, nodemap graph lines|
|**Toast / Footer**|`--md-primary`|`#19151b`|Ticker tape, footer bg|

### JP Accent Gradient Recipes

```css
/* Product panel — hero right side */
.gradient-product {
  background: linear-gradient(145deg,
    var(--md-surface-container-high) 0%,    /* #e8e8ea */
    var(--md-surface-dim)            50%,   /* #d9dadc */
    var(--md-outline-variant)        100%   /* #ccc4ca */
  );
}

/* Lens / dial gradient */
.gradient-lens {
  background: linear-gradient(135deg,
    var(--hue-vdark)   0%,   /* #44405a */
    var(--md-primary)  100%  /* #19151b */
  );
}

/* Feature card gradient — lavender */
.gradient-feature-light {
  background: linear-gradient(135deg,
    var(--jp-toki)   0%,   /* #e4d2d8 */
    var(--hue-fg)    50%,  /* #b8bed7 */
    var(--hue-cool)  100%  /* #afaecc */
  );
}

/* Feature card gradient — dark */
.gradient-feature-dark {
  background: linear-gradient(135deg,
    var(--hue-cool)  0%,   /* #afaecc */
    var(--hue-vlight) 100% /* #524e68 */
  );
}

/* Camera body gradient */
.gradient-camera {
  background: linear-gradient(180deg,
    var(--hue-fg)    0%,   /* #b8bed7 */
    var(--jp-fuji)   50%,  /* #a6a5c4 */
    var(--hue-mount) 100%  /* #85758f */
  );
}
```

### Usage Rules — Color Discipline

```
DO    ใช้ --md-primary (#19151b) สำหรับ CTA buttons, footer, ticker เท่านั้น
DO    ใช้ --md-primary-hover (#44405a) เป็น hover state ของ primary button
DO    ใช้ --md-secondary (#5c5c78) สำหรับ secondary actions และ focus ring
DO    ใช้ JP accent palette สำหรับ gradient, illustration, avatar bg เท่านั้น
DO    ใช้ --md-on-surface-variant (#4a454a) สำหรับ muted text — ไม่ใช้ --md-outline
DO    glass card ต้องใช้ rgba(255,255,255,0.92) + backdrop-filter: blur(12px)

DON'T ใช้ JP accent palette เป็น text color หลัก (ยกเว้น decorative)
DON'T ใช้ --md-primary (#19151b) กับ element ขนาดเล็ก — จะหนักเกินไป
DON'T ใช้ --md-error (#ba1a1a) สำหรับ decorative accent — เฉพาะ error state
DON'T hardcode #1a1c1d หรือ #7b757b ลงใน component — ใช้ token เสมอ
```

---

## 4. Status Colors

ใช้สี Google Material สำหรับ semantic status เพื่อให้ผู้ใช้จดจำและเข้าใจได้ทันที สีเหล่านี้แยกออกจาก M3 brand palette โดยเจตนา — เพื่อให้ status สื่อสารได้ทันทีโดยไม่ต้องตีความ

```css
:root {
  /* ── STATUS: Google Color System ────────────────── */
  --google-blue:   #4285F4;   /* Information, Links, Focus */
  --google-green:  #34A853;   /* Success, Confirmed, Active */
  --google-yellow: #FBBC05;   /* Warning, Pending, Caution */
  --google-red:    #EA4335;   /* Error, Danger, Destructive */

  /* ── STATUS SURFACES (15% opacity on white) ──────── */
  --status-info-bg:     #EAF1FE;  /* Blue 15% */
  --status-success-bg:  #E6F4EA;  /* Green 15% */
  --status-warning-bg:  #FEF7E0;  /* Yellow 15% */
  --status-danger-bg:   #FCE8E6;  /* Red 15% */

  /* ── STATUS BORDERS (40% opacity) ───────────────── */
  --status-info-border:    #93BAF9;
  --status-success-border: #81C995;
  --status-warning-border: #FDD663;
  --status-danger-border:  #F28B82;

  /* ── STATUS TEXT (full saturation, darkened) ─────── */
  --status-info-text:    #1A56C4;
  --status-success-text: #137333;
  --status-warning-text: #B06000;
  --status-danger-text:  #C5221F;
}
```

### Status Usage Matrix

|Status|Background|Border|Text|Icon|ใช้เมื่อ|
|---|---|---|---|---|---|
|**Info**|`--status-info-bg`|`--status-info-border`|`--status-info-text`|`#4285F4`|แจ้งข้อมูลทั่วไป, Tips|
|**Success**|`--status-success-bg`|`--status-success-border`|`--status-success-text`|`#34A853`|บันทึกสำเร็จ, Confirmed|
|**Warning**|`--status-warning-bg`|`--status-warning-border`|`--status-warning-text`|`#FBBC05`|ต้องการความระวัง|
|**Danger**|`--status-danger-bg`|`--status-danger-border`|`--status-danger-text`|`#EA4335`|Error, Destructive action|

### Status Dot — Live Indicator

```css
/* Live / Online badge */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot--online  { background: var(--google-green); animation: pulse 2s ease infinite; }
.status-dot--pending { background: var(--google-yellow); }
.status-dot--error   { background: var(--google-red); }
.status-dot--info    { background: var(--google-blue); }
.status-dot--offline { background: var(--md-outline-variant); }

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.3); opacity: 0.7; }
}
```

### Usage Discipline — Status Only

Google Colors เป็น **semantic status layer** เท่านั้น — แยกออกจาก M3 brand palette โดยเจตนา

```
DO    ใช้ --google-* กับ status ที่สื่อความหมาย: success, warning, danger, info
DO    ใช้กับ status dot, badge, chip, alert, score, heatmap cell, progress
DO    แสดง legend หรือ label กำกับความหมายของสีเสมอ (พร้อม icon)

DON'T ใช้ Google Colors เป็น decorative — พื้นหลัง, gradient, accent bar, brand
DON'T ใช้ Green/Red/Yellow/Blue เพียงเพื่อความสวยงามหรือแยกหมวดที่ไม่ใช่ status
DON'T สลับ semantic — Green = success เสมอ, Red = danger/critical เสมอ
      (สำหรับ decorative accent ใช้ JP Accent Palette หรือ M3 roles แทน)
```

---

## 5. Spacing & Shape

### Spacing Scale (Base 4)

```css
:root {
  --space-0:   0px;
  --space-1:   4px;   /* xs  — icon gap, inline nudge */
  --space-2:   8px;   /* sm  — component internal gap */
  --space-3:   12px;  /* md  — tight section gap */
  --space-4:   16px;  /* base — default padding */
  --space-5:   20px;
  --space-6:   24px;  /* lg  — card padding */
  --space-8:   32px;  /* xl  — group separation */
  --space-10:  40px;
  --space-12:  48px;  /* 2xl — section gap */
  --space-16:  64px;  /* 3xl — hero spacing */
  --space-20:  80px;
  --space-24:  96px;  /* 4xl — page section */
}
```

### Border Radius Scale

```css
:root {
  --radius-none: 0px;
  --radius-xs:   4px;   /* Chips, small tags */
  --radius-sm:   6px;   /* Badges, pills */
  --radius-md:   10px;  /* Buttons, inputs ★ Moderate (2) */
  --radius-lg:   16px;  /* Cards, panels */
  --radius-xl:   24px;  /* Hero blocks, modals */
  --radius-2xl:  32px;  /* Featured cards */
  --radius-full: 9999px; /* Circular avatars, toggle */
}
```

> **Design Decision:** `--radius-md: 10px` คือค่าหลักของระบบนี้ (Moderate Level 2) — เพียงพอที่จะดูเป็นมิตรและ approachable โดยไม่รู้สึก childlike

### Density & Padding — Component Internal

|Component Size|Padding (Y × X)|Font Size|
|---|---|---|
|**Extra Small**|`4px × 10px`|11px|
|**Small**|`6px × 13px`|12px|
|**Default (Medium)**|`9px × 18px`|13–14px|
|**Large**|`12px × 24px`|15–16px|
|**Extra Large**|`16px × 32px`|16–18px|

---

## 6. Elevation & Shadow

M3 ใช้ tonal elevation (surface tint overlay) ร่วมกับ shadow เบาๆ — shadow color สกัดจาก opu.html: `rgba(46,41,48,…)` ซึ่งคือ `#2e2930` (jp-shikoku)

```css
:root {
  /* Shadow base = jp-shikoku #2e2930 (used in opu.html box-shadows) */
  --shadow-color: 46, 41, 48;   /* RGB of #2e2930 */

  /* Flat */
  --shadow-0: none;

  /* Resting — Cards (opu: shadow-soft) */
  --shadow-1: 0px 12px 32px rgba(var(--shadow-color), 0.04);

  /* Raised — Hovered cards (opu: shadow-soft-md) */
  --shadow-2: 0px 20px 48px rgba(var(--shadow-color), 0.07);

  /* Floating — Modals, Dropdowns (opu: shadow-soft-lg) */
  --shadow-3: 0px 32px 80px rgba(var(--shadow-color), 0.10);

  /* Overlay — Dialogs, Drawers */
  --shadow-4: 0px 40px 100px rgba(var(--shadow-color), 0.14);

  /* Glass card (opu: shadow-glass) */
  --shadow-glass: 0 8px 32px rgba(var(--shadow-color), 0.06);

  /* Focus Rings — keyed to opu.html primary and secondary */
  --shadow-focus-primary:   0 0 0 3px rgba(25, 21, 27, 0.20);    /* primary #19151b */
  --shadow-focus-secondary: 0 0 0 3px rgba(92, 92, 120, 0.28);   /* secondary #5c5c78 */
  --shadow-focus-danger:    0 0 0 3px rgba(186, 26, 26, 0.25);   /* error #ba1a1a */

  /* M3 Tonal Elevation Overlay — primary tint (#19151b) */
  --tint-elev-1: rgba(25, 21, 27, 0.03);
  --tint-elev-2: rgba(25, 21, 27, 0.05);
  --tint-elev-3: rgba(25, 21, 27, 0.08);
  --tint-elev-4: rgba(25, 21, 27, 0.10);
  --tint-elev-5: rgba(25, 21, 27, 0.12);
}
```

---

## 7. Iconography

### Icon System — React Icons (Lucide)

```tsx
import { Leaf, Sun, Search, Home, User, Bell, Settings,
         ChevronRight, ChevronDown, X, Plus, Check,
         AlertCircle, AlertTriangle, Info, CheckCircle2,
         Upload, Download, Edit, Trash2, Share2,
         Eye, EyeOff, Lock, Unlock, Filter, SlidersHorizontal,
         Tag, Bookmark, Star, Heart, Globe, Package,
         ArrowRight, ArrowLeft, ExternalLink, RefreshCw,
         MoreHorizontal, MoreVertical, Loader2 } from 'lucide-react';
```

### Icon Size Scale

|Token|Size|Stroke Width|ใช้สำหรับ|
|---|---|---|---|
|`--icon-xs`|12px|2.5px|Badge icons|
|`--icon-sm`|14px|2.5px|Inline with small text|
|`--icon-md`|16px|2px|Default UI icons ★|
|`--icon-lg`|18px|2px|Button icons|
|`--icon-xl`|20px|2px|Navigation items|
|`--icon-2xl`|24px|2px|Feature icons|
|`--icon-3xl`|32px|1.5px|Empty states|
|`--icon-4xl`|48px|1.5px|Hero illustrations|

### Icon Color Rules

```
ใช้ currentColor เสมอ — icons inherit สีจาก parent
อย่า hardcode hex ลงใน icon โดยตรง
ยกเว้น status icons: ใช้ --google-* colors โดยตรง

Filled vs Outlined:
  - Outlined = Default state
  - Filled   = Active / Selected state เท่านั้น
```

### Icon Source — React Icons Only

```
DO    ใช้ icon จาก React Icons (Lucide set) เท่านั้น — import ตาม §7 ด้านบน
DO    ใช้ icon ประกอบ status/สีเสมอ — อย่าพึ่งพาสีเพียงอย่างเดียว (a11y)
DO    ตั้ง aria-hidden="true" บน icon ที่เป็น decorative, aria-label บน icon-only button

DON'T ใช้ emoji (✅ ⚠️ ℹ️ 🌿) ใน UI ทุกกรณี — ใช้ Lucide SVG แทน
DON'T ใช้ icon จาก set อื่นปนกัน — คุม stroke width และ style ให้ consistent
```

### Icon Button Variants

```tsx
/* Icon-only button */
<button className="icon-btn icon-btn--primary">
  <Plus size={16} />
</button>

/* Button with leading icon */
<button className="btn btn--primary">
  <Leaf size={14} />
  เพิ่มพืช
</button>

/* Button with trailing icon */
<button className="btn btn--ghost">
  ดูเพิ่มเติม
  <ChevronRight size={14} />
</button>

/* Loading state */
<button className="btn btn--neutral" disabled>
  <Loader2 size={14} className="spin" />
  กำลังโหลด
</button>
```

---

## 8. Components

### 8.1 Button

#### Variants

```css
/* ── BASE ──────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 9px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: var(--weight-semibold);
  line-height: 1;
  cursor: pointer;
  border: none;
  transition: all 180ms ease;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
}
.btn:focus-visible { outline: none; box-shadow: var(--shadow-focus-primary); }
.btn:active        { transform: scale(0.97); }
.btn:disabled      { opacity: 0.38; cursor: not-allowed; pointer-events: none; }

/* ── PRIMARY ────────────────────────────────────── */
.btn--primary {
  background: var(--md-primary);
  color: var(--md-on-primary);
}
.btn--primary:hover  { background: var(--md-primary-hover); }
.btn--primary:active { background: var(--md-primary-container); color: var(--md-on-primary-container); }

/* ── SECONDARY (Tonal) ──────────────────────────── */
.btn--secondary {
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}
.btn--secondary:hover  { background: color-mix(in srgb, var(--md-secondary-container) 88%, var(--md-on-surface)); }

/* ── TERTIARY ────────────────────────────────────── */
.btn--tertiary {
  background: var(--md-tertiary);
  color: var(--md-on-tertiary);
}
.btn--tertiary:hover { background: color-mix(in srgb, var(--md-tertiary) 88%, var(--md-on-surface)); }

/* ── OUTLINED ────────────────────────────────────── */
.btn--outlined {
  background: transparent;
  color: var(--md-primary);
  border: 1.5px solid var(--md-outline);
}
.btn--outlined:hover { background: color-mix(in srgb, var(--md-primary) 8%, transparent); border-color: var(--md-primary); }

/* ── GHOST / TEXT ────────────────────────────────── */
.btn--ghost {
  background: transparent;
  color: var(--md-primary);
  border: none;
}
.btn--ghost:hover { background: color-mix(in srgb, var(--md-primary) 8%, transparent); }

/* ── NEUTRAL (Surface tonal) ─────────────────────── */
.btn--neutral {
  background: var(--md-surface-container-high);
  color: var(--md-on-surface);
}
.btn--neutral:hover { background: var(--md-surface-container-highest); }

/* ── INVERTED ────────────────────────────────────── */
.btn--inverted {
  background: var(--md-inverse-surface);
  color: var(--md-inverse-on-surface);
}
.btn--inverted:hover { background: color-mix(in srgb, var(--md-inverse-surface) 92%, white); }

/* ── DANGER ─────────────────────────────────────── */
.btn--danger {
  background: var(--md-error);
  color: var(--md-on-error);
}
.btn--danger:focus-visible { box-shadow: var(--shadow-focus-danger); }
.btn--danger:hover { background: color-mix(in srgb, var(--md-error) 88%, var(--md-on-surface)); }
```

#### Size Modifiers

```css
.btn--xs  { padding: 4px 10px;  font-size: var(--text-overline); border-radius: var(--radius-sm); }
.btn--sm  { padding: 6px 13px;  font-size: var(--text-caption); }
.btn--lg  { padding: 12px 24px; font-size: var(--text-body-lg); border-radius: var(--radius-lg); }
.btn--xl  { padding: 16px 32px; font-size: 16px; border-radius: var(--radius-lg); }

/* Icon-only */
.btn--icon    { padding: 9px; }
.btn--icon-sm { padding: 6px; }
.btn--icon-lg { padding: 12px; }
```

#### States Reference

|State|Visual Change|
|---|---|
|**Default**|Base color, no shadow|
|**Hover**|Darkened background (1 step)|
|**Focus**|3px focus ring — `--shadow-focus-*`|
|**Active/Pressed**|`scale(0.97)` + darkest background|
|**Loading**|Spinner icon, `pointer-events: none`|
|**Disabled**|`opacity: 0.45`, `cursor: not-allowed`|

---

### 8.2 Input & Form

```css
/* ── LABEL ──────────────────────────────────────── */
.form-label {
  display: block;
  font-family: var(--font-sans);
  font-size: var(--text-label);
  font-weight: var(--weight-semibold);
  color: var(--md-on-surface);
  margin-bottom: var(--space-1);
}
.form-label--required::after {
  content: ' *';
  color: var(--md-error);
}

/* ── BASE INPUT ─────────────────────────────────── */
.input {
  width: 100%;
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: var(--weight-regular);
  color: var(--md-on-surface);
  background: var(--md-surface-container-lowest);
  border: 1.5px solid var(--md-outline);
  border-radius: var(--radius-md);
  padding: 9px 13px;
  transition: border-color 180ms ease, box-shadow 180ms ease;
  outline: none;
  appearance: none;
}
.input::placeholder      { color: var(--md-on-surface-variant); opacity: 0.6; }
.input:hover             { border-color: var(--md-on-surface); }
.input:focus             { border-color: var(--md-primary); box-shadow: var(--shadow-focus-primary); }
.input:disabled          { background: var(--md-surface-container); opacity: 0.38; cursor: not-allowed; }
.input--error            { border-color: var(--md-error); }
.input--error:focus      { box-shadow: var(--shadow-focus-danger); }
.input--success          { border-color: var(--google-green); }

/* ── INPUT WITH ICON ────────────────────────────── */
.input-wrapper           { position: relative; }
.input-wrapper .input    { padding-left: 38px; }
.input-wrapper .icon     {
  position: absolute; left: 12px;
  top: 50%; transform: translateY(-50%);
  width: 16px; height: 16px;
  color: var(--md-on-surface-variant);
  pointer-events: none;
}

/* ── HINT & ERROR TEXT ──────────────────────────── */
.form-hint    { font-size: var(--text-caption); color: var(--md-on-surface-variant); margin-top: var(--space-1); }
.form-error   { font-size: var(--text-caption); color: var(--md-error); margin-top: var(--space-1); }
.form-success { font-size: var(--text-caption); color: var(--google-green); margin-top: var(--space-1); }

/* ── SELECT ─────────────────────────────────────── */
.select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2347464d' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  cursor: pointer;
}

/* ── TEXTAREA ───────────────────────────────────── */
.textarea { resize: vertical; min-height: 100px; padding-top: 10px; line-height: var(--leading-relaxed); }

/* ── TOGGLE ─────────────────────────────────────── */
.toggle-track {
  width: 44px; height: 24px;
  background: var(--md-surface-container-highest);
  border: 2px solid var(--md-outline);
  border-radius: var(--radius-full);
  position: relative;
  transition: background 200ms ease, border-color 200ms ease;
  cursor: pointer; outline: none;
}
.toggle-track.is-on     { background: var(--md-primary); border-color: var(--md-primary); }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px;
  background: var(--md-outline);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(var(--shadow-color), 0.15);
  transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1), background 200ms ease, width 100ms ease;
}
.toggle-track.is-on .toggle-thumb { transform: translateX(20px); background: var(--md-on-primary); width: 18px; }
.toggle-track:hover .toggle-thumb { width: 18px; }

/* ── CHECKBOX & RADIO ───────────────────────────── */
.checkbox, .radio {
  width: 18px; height: 18px;
  border: 2px solid var(--md-outline);
  background: transparent;
  cursor: pointer;
  transition: all 180ms ease;
  appearance: none;
  display: grid; place-items: center;
}
.checkbox { border-radius: var(--radius-xs); }
.radio    { border-radius: var(--radius-full); }
.checkbox:checked, .radio:checked {
  background: var(--md-primary);
  border-color: var(--md-primary);
}
.checkbox:focus-visible, .radio:focus-visible {
  box-shadow: var(--shadow-focus-primary);
  outline: none;
}
```

---

### 8.3 Badge & Tag

```css
/* ── BASE BADGE ─────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 3px 9px;
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--text-caption);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
  line-height: 1.4;
}

/* Brand Badges — M3 container roles */
.badge--primary   { background: var(--md-primary-container);   color: var(--md-on-primary-container); }
.badge--secondary { background: var(--md-secondary-container); color: var(--md-on-secondary-container); }
.badge--tertiary  { background: var(--md-tertiary-container);  color: var(--md-on-tertiary-container); }
.badge--dark      { background: var(--md-inverse-surface);     color: var(--md-inverse-on-surface); }
.badge--neutral   { background: var(--md-surface-container-high); color: var(--md-on-surface-variant); }

/* Status Badges — Google Colors */
.badge--info     { background: var(--status-info-bg);    color: var(--status-info-text); }
.badge--success  { background: var(--status-success-bg); color: var(--status-success-text); }
.badge--warning  { background: var(--status-warning-bg); color: var(--status-warning-text); }
.badge--danger   { background: var(--status-danger-bg);  color: var(--status-danger-text); }

/* ── TAG (Interactive) ───────────────────────────── */
.tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 5px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  border: 1.5px solid;
  cursor: default;
  transition: transform 180ms ease, box-shadow 180ms ease;
}
.tag:hover { transform: translateY(-2px); box-shadow: var(--shadow-1); }

.tag--primary   { background: var(--md-primary-fixed);   border-color: var(--md-primary-container);   color: var(--md-on-primary-fixed); }
.tag--secondary { background: var(--md-secondary-fixed); border-color: var(--md-secondary-container); color: var(--md-on-secondary-fixed); }
.tag--tertiary  { background: var(--md-tertiary-fixed);  border-color: var(--md-tertiary-container);  color: var(--md-on-tertiary-fixed); }

/* ── REMOVABLE TAG ───────────────────────────────── */
.tag--removable .tag-remove {
  display: inline-flex; margin-left: var(--space-1);
  padding: 1px; border-radius: var(--radius-full);
  opacity: 0.6; transition: opacity 150ms;
  cursor: pointer; border: none; background: none;
  color: inherit;
}
.tag--removable .tag-remove:hover { opacity: 1; }
```

---

### 8.4 Card

```css
/* ── BASE CARD ──────────────────────────────────── */
.card {
  background: var(--md-surface-container-lowest);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  position: relative;
  overflow: hidden;
  transition: transform 220ms ease, box-shadow 220ms ease;
}
.card:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); }

/* Accent Rail (top border color) */
.card--primary::before   { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--md-primary); }
.card--secondary::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--md-secondary); }
.card--tertiary::before  { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--md-tertiary); }

/* Card Anatomy */
.card-meta    { font-size: var(--text-overline); font-weight: var(--weight-bold); text-transform: uppercase; letter-spacing: var(--tracking-wider); color: var(--md-on-surface-variant); margin-bottom: var(--space-1); }
.card-title   { font-family: var(--font-serif); font-size: var(--text-h4); font-weight: var(--weight-semibold); color: var(--md-on-surface); margin-bottom: var(--space-1); }
.card-body    { font-size: var(--text-body-sm); color: var(--md-on-surface-variant); line-height: var(--leading-relaxed); }
.card-footer  { display: flex; align-items: center; justify-content: space-between; margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--md-outline-variant); }

/* Dark Card — uses inverse surface */
.card--dark { background: var(--md-inverse-surface); border-color: var(--md-inverse-surface); }
.card--dark .card-meta   { color: color-mix(in srgb, var(--md-inverse-on-surface) 50%, transparent); }
.card--dark .card-title  { color: var(--md-inverse-on-surface); }
.card--dark .card-body   { color: color-mix(in srgb, var(--md-inverse-on-surface) 65%, transparent); }
.card--dark .card-footer { border-color: color-mix(in srgb, var(--md-inverse-on-surface) 15%, transparent); }

/* Tonal Card — surface container */
.card--tonal { background: var(--md-surface-container); border-color: transparent; }

/* Flat Card (no hover) */
.card--flat   { transition: none; }
.card--flat:hover { transform: none; box-shadow: none; }
```

---

### 8.5 Alert

```css
/* ── BASE ALERT ─────────────────────────────────── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border-left: 3px solid;
  animation: slideRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.alert-icon  { width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; }
.alert-title { font-size: var(--text-body-sm); font-weight: var(--weight-bold); margin-bottom: 3px; }
.alert-body  { font-size: var(--text-caption); line-height: var(--leading-relaxed); opacity: 0.85; }

/* Status Variants — Google Colors */
.alert--info {
  background: var(--status-info-bg);
  border-color: var(--google-blue);
  color: var(--status-info-text);
}
.alert--success {
  background: var(--status-success-bg);
  border-color: var(--google-green);
  color: var(--status-success-text);
}
.alert--warning {
  background: var(--status-warning-bg);
  border-color: var(--google-yellow);
  color: var(--status-warning-text);
}
.alert--danger {
  background: var(--status-danger-bg);
  border-color: var(--google-red);
  color: var(--status-danger-text);
}

/* Brand Alert — uses M3 primary */
.alert--brand {
  background: var(--md-primary-fixed);
  border-color: var(--md-primary);
  color: var(--md-on-primary-fixed-variant);
}

/* Error Alert — uses M3 error role */
.alert--error {
  background: var(--md-error-container);
  border-color: var(--md-error);
  color: var(--md-on-error-container);
}

/* Dismissible */
.alert--dismissible { padding-right: 44px; position: relative; }
.alert-dismiss {
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; cursor: pointer;
  opacity: 0.5; transition: opacity 150ms;
  color: inherit;
}
.alert-dismiss:hover { opacity: 1; }
```

---

### 8.6 Navigation

#### Top Navigation

```css
.nav-top {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 var(--space-8);
  background: var(--color-neutral-0);
  border-bottom: 1px solid var(--color-neutral-100);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-logo        { font-family: var(--font-serif); font-size: 18px; font-weight: var(--weight-semibold); color: var(--color-neutral-900); }
.nav-links       { display: flex; gap: var(--space-1); margin: 0 auto; }
.nav-link        { padding: 6px 14px; border-radius: var(--radius-sm); font-size: var(--text-body-sm); font-weight: var(--weight-medium); color: var(--color-neutral-600); text-decoration: none; transition: all 150ms ease; }
.nav-link:hover  { background: var(--color-neutral-100); color: var(--color-neutral-900); }
.nav-link.active { background: var(--color-primary-50); color: var(--color-primary-600); font-weight: var(--weight-semibold); }
```

#### Sidebar Navigation

```css
.nav-sidebar {
  width: 220px;
  padding: var(--space-8) var(--space-5);
  background: var(--color-neutral-0);
  border-right: 1px solid var(--color-neutral-100);
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
}
.nav-section-label {
  font-size: var(--text-overline);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  color: var(--color-neutral-400);
  padding: 0 var(--space-2);
  margin-bottom: var(--space-2);
}
.nav-item {
  display: flex; align-items: center; gap: var(--space-2);
  padding: 7px 10px; border-radius: var(--radius-sm);
  font-size: var(--text-body-sm); font-weight: var(--weight-medium);
  color: var(--color-neutral-600);
  text-decoration: none; cursor: pointer;
  transition: all 150ms ease; margin-bottom: 2px;
}
.nav-item:hover  { background: var(--color-neutral-100); color: var(--color-neutral-900); }
.nav-item.active { background: var(--color-primary-50); color: var(--color-primary-800); font-weight: var(--weight-semibold); }
.nav-item .nav-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-neutral-200); flex-shrink: 0; transition: background 150ms; }
.nav-item.active .nav-dot { background: var(--color-primary-600); }
```

---

### 8.7 Progress

```css
/* ── LINEAR PROGRESS ────────────────────────────── */
.progress { margin-bottom: var(--space-4); }
.progress-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.progress-label { font-size: var(--text-label); font-weight: var(--weight-semibold); color: var(--color-neutral-800); }
.progress-value { font-size: var(--text-label); font-weight: var(--weight-bold); }
.progress-track { height: 7px; background: var(--color-neutral-100); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill  {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Color variants */
.progress-fill--primary   { background: var(--color-primary-600); }
.progress-fill--secondary { background: var(--color-secondary-400); }
.progress-fill--tertiary  { background: var(--color-tertiary-400); }
.progress-fill--success   { background: var(--google-green); }
.progress-fill--warning   { background: var(--google-yellow); }
.progress-fill--danger    { background: var(--google-red); }
.progress-fill--info      { background: var(--google-blue); }

/* Indeterminate (Loading) */
.progress-fill--indeterminate {
  width: 40% !important;
  background: var(--color-primary-600);
  animation: indeterminate 1.5s ease infinite;
}
@keyframes indeterminate {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
```

---

### 8.8 Avatar

```css
/* ── BASE AVATAR ────────────────────────────────── */
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-weight: var(--weight-semibold);
  border: 2.5px solid var(--color-neutral-0);
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 200ms ease;
  cursor: default;
  user-select: none;
}
.avatar:hover { transform: scale(1.08) translateY(-2px); z-index: 10; }

/* Sizes */
.avatar--xs  { width: 24px; height: 24px; font-size: 9px; }
.avatar--sm  { width: 32px; height: 32px; font-size: 11px; }
.avatar--md  { width: 40px; height: 40px; font-size: 13px; } /* Default */
.avatar--lg  { width: 48px; height: 48px; font-size: 16px; }
.avatar--xl  { width: 64px; height: 64px; font-size: 20px; }
.avatar--2xl { width: 80px; height: 80px; font-size: 24px; }

/* Color variants */
.avatar--primary   { background: var(--color-primary-50);   color: var(--color-primary-800); }
.avatar--secondary { background: var(--color-secondary-50); color: var(--color-secondary-900); }
.avatar--tertiary  { background: var(--color-tertiary-50);  color: var(--color-tertiary-800); }
.avatar--dark      { background: var(--color-neutral-900);  color: var(--color-neutral-50); }

/* ── AVATAR STACK ────────────────────────────────── */
.avatar-stack { display: flex; flex-direction: row-reverse; }
.avatar-stack .avatar { margin-left: -8px; }
.avatar-stack .avatar:last-child { margin-left: 0; }
.avatar-overflow { background: var(--color-neutral-100); color: var(--color-neutral-600); }

/* ── AVATAR WITH STATUS ───────────────────────────── */
.avatar-wrapper { position: relative; display: inline-flex; }
.avatar-status {
  position: absolute; bottom: 1px; right: 1px;
  width: 10px; height: 10px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-neutral-0);
}
.avatar-status--online  { background: var(--google-green); }
.avatar-status--away    { background: var(--google-yellow); }
.avatar-status--busy    { background: var(--google-red); }
.avatar-status--offline { background: var(--color-neutral-200); }
```

---

### 8.9 Toggle

```css
/* documented above in Input & Form section */
/* Additional: Toggle with label */
.toggle-group { display: flex; flex-direction: column; gap: var(--space-3); }
.toggle-row   { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; }
.toggle-label { font-size: var(--text-body-sm); font-weight: var(--weight-medium); color: var(--color-neutral-800); user-select: none; }
.toggle-hint  { font-size: var(--text-caption); color: var(--color-neutral-400); margin-top: 2px; }
```

---

## 9. Motion & Animation

### Easing Functions

```css
:root {
  --ease-default:   cubic-bezier(0.4, 0.0, 0.2, 1);   /* Standard — most transitions */
  --ease-enter:     cubic-bezier(0.0, 0.0, 0.2, 1);   /* Decelerate — elements entering */
  --ease-exit:      cubic-bezier(0.4, 0.0, 1.0, 1);   /* Accelerate — elements leaving */
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring — playful bouncy */
  --ease-linear:    linear;                              /* Continuous — spinners, shimmer */
}
```

### Duration Scale

```css
:root {
  --duration-instant:  80ms;   /* State toggles (checkbox check) */
  --duration-fast:     150ms;  /* Hover states */
  --duration-default:  180ms;  /* Most transitions ★ */
  --duration-slow:     300ms;  /* Panel slides, dropdowns */
  --duration-slower:   450ms;  /* Modal entry */
  --duration-slowest:  600ms;  /* Page transitions, complex sequences */
  --duration-progress: 1200ms; /* Progress bar fills */
}
```

### Named Animation Keyframes

```css
/* ── ENTER ANIMATIONS ───────────────────────────── */
@keyframes fadeIn        { from { opacity: 0; }                           to { opacity: 1; } }
@keyframes fadeUp        { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeDown      { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideRight    { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideLeft     { from { opacity: 0; transform: translateX(16px); }  to { opacity: 1; transform: translateX(0); } }
@keyframes scaleIn       { from { opacity: 0; transform: scale(0.92); }    to { opacity: 1; transform: scale(1); } }
@keyframes springIn      { from { opacity: 0; transform: scale(0.85); }    to { opacity: 1; transform: scale(1); } }

/* ── LOOP ANIMATIONS ────────────────────────────── */
@keyframes spin          { from { transform: rotate(0deg); }               to { transform: rotate(360deg); } }
@keyframes pulse         { 0%, 100% { transform: scale(1); opacity: 1; }  50% { transform: scale(1.2); opacity: 0.7; } }
@keyframes breathe       { 0%, 100% { transform: scale(0.97); opacity: 0.6; } 50% { transform: scale(1); opacity: 1; } }
@keyframes float         { 0%, 100% { transform: translateY(0); }          50% { transform: translateY(-6px); } }
@keyframes shimmer       {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── UTILITY CLASSES ────────────────────────────── */
.animate-fade-up   { animation: fadeUp    var(--duration-slowest) var(--ease-enter) both; }
.animate-fade-in   { animation: fadeIn    var(--duration-slow)    var(--ease-enter) both; }
.animate-slide-in  { animation: slideRight var(--duration-slow)   var(--ease-enter) both; }
.animate-scale-in  { animation: scaleIn   var(--duration-slow)    var(--ease-spring) both; }
.animate-spin      { animation: spin      1s var(--ease-linear) infinite; }
.animate-pulse     { animation: pulse     2s var(--ease-default) infinite; }
.animate-breathe   { animation: breathe   2.5s ease infinite; }
.animate-float     { animation: float     3s ease infinite; }

/* ── SKELETON SHIMMER ────────────────────────────── */
.skeleton {
  background: linear-gradient(90deg,
    var(--color-neutral-100) 25%,
    var(--color-neutral-200) 50%,
    var(--color-neutral-100) 75%
  );
  background-size: 200%;
  animation: shimmer 1.8s var(--ease-linear) infinite;
  border-radius: var(--radius-sm);
}

/* ── STAGGER HELPERS ────────────────────────────── */
.delay-1 { animation-delay: 0.05s; }
.delay-2 { animation-delay: 0.10s; }
.delay-3 { animation-delay: 0.15s; }
.delay-4 { animation-delay: 0.20s; }
.delay-5 { animation-delay: 0.25s; }
.delay-6 { animation-delay: 0.30s; }
```

### Motion Decision Guide

|Trigger|Animation|Duration|Easing|
|---|---|---|---|
|Page load|`fadeUp` + stagger|600ms|`--ease-enter`|
|Modal open|`scaleIn` + backdrop `fadeIn`|300ms|`--ease-spring`|
|Dropdown|`fadeDown`|180ms|`--ease-enter`|
|Toast / Alert|`slideRight`|300ms|`--ease-enter`|
|Hover state|color/bg change|150ms|`--ease-default`|
|Button press|`scale(0.97)`|80ms|`--ease-default`|
|Loading spinner|`spin`|1s|linear|
|Live status dot|`pulse`|2s|ease|

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Accessibility

### Focus Management

```css
/* ทุก interactive element ต้องมี visible focus state */
:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-secondary);   /* secondary #5c5c78 ring */
}

/* Primary (dark) buttons use primary focus ring */
.btn--primary:focus-visible  { box-shadow: var(--shadow-focus-primary); }
.btn--danger:focus-visible   { box-shadow: var(--shadow-focus-danger); }

/* RIGHT pattern */
:focus-visible { outline: none; box-shadow: var(--shadow-focus-secondary); }
```

### Color Contrast Requirements

|Combination|Ratio|WCAG Level|
|---|---|---|
|`#19151b` (primary) บน `#f9f9fb` (surface)|19.4:1|AAA|
|`#1a1c1d` (on-surface) บน `#f9f9fb`|19.1:1|AAA|
|`#ffffff` บน `#19151b` (primary btn)|19.4:1|AAA|
|`#4a454a` (on-surface-var) บน `#f9f9fb`|9.4:1|AAA|
|`#7b757b` (outline/muted) บน `#f9f9fb`|4.6:1|AA|
|`#7b757b` บน `#ffffff`|4.6:1|AA|
|`#5c5c78` (secondary) บน `#f9f9fb`|5.9:1|AA|
|`#ffffff` บน `#5c5c78` (sec btn)|5.9:1|AA|
|`#60607c` (on-sec-container) บน `#deddfe`|4.7:1|AA|
|`#1A56C4` บน `#EAF1FE` (status info)|5.2:1|AA|
|`#137333` บน `#E6F4EA` (status success)|5.8:1|AA|
|`#C5221F` บน `#FCE8E6` (status danger)|5.4:1|AA|

### ARIA Patterns

```html
<!-- Alert -->
<div role="alert" aria-live="polite" class="alert alert--success">
  <CheckCircle2 aria-hidden="true" />
  <div>
    <p class="alert-title">บันทึกสำเร็จ</p>
    <p class="alert-body">ข้อมูลของคุณได้รับการบันทึกเรียบร้อยแล้ว</p>
  </div>
</div>

<!-- Icon Button -->
<button aria-label="เพิ่มรายการ" class="btn btn--icon btn--primary">
  <Plus aria-hidden="true" size={16} />
</button>

<!-- Toggle -->
<button
  role="switch"
  aria-checked="true"
  aria-label="เปิดการแจ้งเตือนอีเมล"
  class="toggle-track is-on"
>
  <span class="toggle-thumb" />
</button>

<!-- Progress -->
<div role="progressbar" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100" aria-label="ความคืบหน้า">
  <div class="progress-track">
    <div class="progress-fill progress-fill--primary" style="width: 72%"></div>
  </div>
</div>

<!-- Badge with status -->
<span class="badge badge--success">
  <span class="sr-only">สถานะ: </span>Active
</span>
```

---

## 11. Token Reference

### Complete CSS Custom Properties

```css
:root {
  /* ── TYPOGRAPHY — single family, all roles = IBM Plex Sans Thai ── */
  --font-serif:    'IBM Plex Sans Thai', 'IBM Plex Sans', -apple-system, sans-serif;
  --font-sans:     'IBM Plex Sans Thai', 'IBM Plex Sans', -apple-system, sans-serif;
  --font-mono:     'IBM Plex Sans Thai', 'IBM Plex Sans', -apple-system, sans-serif;

  /* ── SURFACE ─────────────────────────────────────── */
  --md-page-frame:               #e2e2e4;
  --md-surface:                  #f9f9fb;
  --md-surface-dim:              #d9dadc;
  --md-surface-bright:           #f9f9fb;
  --md-surface-container-lowest: #ffffff;
  --md-surface-container-low:    #f3f3f5;
  --md-surface-container:        #eeeef0;
  --md-surface-container-high:   #e8e8ea;
  --md-surface-container-highest:#e2e2e4;
  --md-surface-variant:          #e2e2e4;
  --md-background:               #f9f9fb;
  --md-on-background:            #1a1c1d;

  /* ── ON-SURFACE ──────────────────────────────────── */
  --md-on-surface:               #1a1c1d;
  --md-on-surface-variant:       #4a454a;
  --md-inverse-surface:          #2f3132;
  --md-inverse-on-surface:       #f0f0f2;

  /* ── OUTLINE ─────────────────────────────────────── */
  --md-outline:                  #7b757b;
  --md-outline-variant:          #ccc4ca;

  /* ── PRIMARY (near-black) ────────────────────────── */
  --md-primary:                  #19151b;
  --md-on-primary:               #ffffff;
  --md-primary-container:        #2e2930;
  --md-on-primary-container:     #978f98;
  --md-inverse-primary:          #cdc4cd;
  --md-surface-tint:             #19151b;
  --md-primary-hover:            #44405a;
  --md-primary-fixed:            #f4f4f6;
  --md-primary-fixed-dim:        #cdc4cd;
  --md-on-primary-fixed:         #19151b;
  --md-on-primary-fixed-variant: #44405a;

  /* ── SECONDARY (slate-violet) ────────────────────── */
  --md-secondary:                #5c5c78;
  --md-on-secondary:             #ffffff;
  --md-secondary-container:      #deddfe;
  --md-on-secondary-container:   #60607c;
  --md-secondary-fixed:          #deddfe;
  --md-secondary-fixed-dim:      #c5c3e4;
  --md-on-secondary-fixed:       #19151b;
  --md-on-secondary-fixed-variant:#5c5c78;

  /* ── TERTIARY (deep charcoal) ────────────────────── */
  --md-tertiary:                 #1d1418;
  --md-on-tertiary:              #ffffff;
  --md-tertiary-container:       #32282c;
  --md-on-tertiary-container:    #9d8e93;
  --md-tertiary-fixed:           #e9e0e9;
  --md-tertiary-fixed-dim:       #cdc4cd;
  --md-on-tertiary-fixed:        #1d1418;
  --md-on-tertiary-fixed-variant:#635c64;

  /* ── ERROR ───────────────────────────────────────── */
  --md-error:                    #ba1a1a;
  --md-on-error:                 #ffffff;
  --md-error-container:          #ffdad6;
  --md-on-error-container:       #93000a;

  /* ── JP ACCENT PALETTE ───────────────────────────── */
  --jp-fuji:    #a6a5c4;
  --jp-shikoku: #2e2930;
  --jp-toki:    #e4d2d8;
  --jp-white:   #f4f4f6;
  --hue-fg:     #b8bed7;
  --hue-cool:   #afaecc;
  --hue-mount:  #85758f;
  --hue-vlight: #524e68;
  --hue-vdark:  #44405a;

  /* ── STATUS (Google) ────────────────────────────── */
  --google-blue:          #4285F4;
  --google-green:         #34A853;
  --google-yellow:        #FBBC05;
  --google-red:           #EA4335;
  --status-info-bg:       #EAF1FE;
  --status-info-border:   #93BAF9;
  --status-info-text:     #1A56C4;
  --status-success-bg:    #E6F4EA;
  --status-success-border:#81C995;
  --status-success-text:  #137333;
  --status-warning-bg:    #FEF7E0;
  --status-warning-border:#FDD663;
  --status-warning-text:  #B06000;
  --status-danger-bg:     #FCE8E6;
  --status-danger-border: #F28B82;
  --status-danger-text:   #C5221F;

  /* ── SPACING ────────────────────────────────────── */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-8: 32px;  --space-10: 40px; --space-12: 48px;
  --space-16: 64px; --space-20: 80px; --space-24: 96px;

  /* ── BORDER RADIUS (from opu.html tailwind config) ── */
  --radius-none: 0px;
  --radius-xs:   4px;      /* Internal chips */
  --radius-sm:   8px;      /* opu: rounded-sm */
  --radius-md:   16px;     /* opu: rounded (DEFAULT) — buttons, inputs ★ */
  --radius-lg:   24px;     /* opu: rounded-md */
  --radius-xl:   32px;     /* opu: rounded-lg */
  --radius-2xl:  48px;     /* opu: rounded-xl — hero blocks */
  --radius-full: 9999px;   /* opu: rounded-full — pills, avatars, CTAs ★ */

  /* ── ELEVATION (opu.html shadow values) ─────────── */
  --shadow-color: 46, 41, 48;   /* #2e2930 jp-shikoku */
  --shadow-0: none;
  --shadow-1: 0px 12px 32px rgba(var(--shadow-color), 0.04);
  --shadow-2: 0px 20px 48px rgba(var(--shadow-color), 0.07);
  --shadow-3: 0px 32px 80px rgba(var(--shadow-color), 0.10);
  --shadow-4: 0px 40px 100px rgba(var(--shadow-color), 0.14);
  --shadow-glass: 0 8px 32px rgba(var(--shadow-color), 0.06);
  --shadow-focus-primary:   0 0 0 3px rgba(25, 21, 27, 0.20);
  --shadow-focus-secondary: 0 0 0 3px rgba(92, 92, 120, 0.28);
  --shadow-focus-danger:    0 0 0 3px rgba(186, 26, 26, 0.25);

  /* ── MOTION ─────────────────────────────────────── */
  --ease-default:  cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-enter:    cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-exit:     cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-instant:  80ms;  --duration-fast:    150ms;
  --duration-default:  180ms; --duration-slow:    300ms;
  --duration-slower:   450ms; --duration-slowest: 600ms;

  /* ── Z-INDEX ─────────────────────────────────────── */
  --z-base:      0;
  --z-raised:    10;
  --z-dropdown:  100;
  --z-sticky:    200;
  --z-overlay:   300;
  --z-modal:     400;
  --z-toast:     500;
  --z-tooltip:   600;
}
```

### Global Base Styles

```css
/* Matches opu.html base structure */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  font-family: var(--font-sans);
  background: var(--md-page-frame);   /* #e2e2e4 outer frame */
  color: var(--md-on-surface);        /* #1a1c1d */
  overflow-x: hidden;
}

/* Page card wrapper — rounded card on frame bg */
.page-card {
  background: var(--md-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0px 24px 80px rgba(var(--shadow-color), 0.08);
  margin: 80px 20px 40px;
}

/* Navigation glass */
.nav-glass {
  background: rgba(249, 249, 251, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--md-surface); }
::-webkit-scrollbar-thumb { background: var(--md-outline-variant); border-radius: 2px; }

/* Node map / dot-grid background */
.nodemap-bg {
  background: var(--md-surface-container);
  background-image: radial-gradient(circle, rgba(46,41,48,.07) 1px, transparent 1px);
  background-size: 26px 26px;
}
```

---

---

## 12. Educational Domain — Google Color Semantic Usage

ระบบนี้ออกแบบสำหรับ Platform การศึกษา (CLOs / Tasks / Student Performance) โดยใช้ Google Color System เป็น semantic layer ที่ทุกคนเข้าใจได้ทันที — ไม่ต้องเรียนรู้ใหม่

### Semantic Intent Map

|Color|Hex|Intent|ความหมายในบริบทการศึกษา|
|---|---|---|---|
|**Blue**|`#4285F4`|Status / In Progress / Neutral Info|รายวิชาที่กำลังดำเนินการ, ข้อมูลจำนวนนักเรียนปกติ, CLO ที่กำลัง active|
|**Green**|`#34A853`|Performance High / Completed|คะแนนผ่านเกณฑ์, สถานะ Completed, ผลลัพธ์ระดับดีมาก, CLO บรรลุเป้าหมาย|
|**Yellow**|`#FBBC05`|Risk Medium / Warning / Watch|คะแนนอยู่ในเกณฑ์เฝ้าระวัง, งานใกล้ Deadline, สถานะที่ต้องตรวจสอบ|
|**Red**|`#EA4335`|Risk High / Critical / Overdue|คะแนนต่ำกว่าเกณฑ์มาตรฐาน, สถานะ Overdue, ข้อผิดพลาดร้ายแรง|

### Application by UI Element

#### 1. Student Score / Performance Badge

```css
/* Score thresholds — ปรับ cutoff ตาม rubric ของแต่ละรายวิชา */
.score-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-caption);
  font-weight: var(--weight-bold);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

/* >= 80%  — High Performance */
.score-badge--high {
  background: var(--status-success-bg);
  color: var(--status-success-text);
  border: 1px solid var(--status-success-border);
}

/* 60–79%  — Watch / Warning */
.score-badge--medium {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
  border: 1px solid var(--status-warning-border);
}

/* < 60%   — Critical / At Risk */
.score-badge--low {
  background: var(--status-danger-bg);
  color: var(--status-danger-text);
  border: 1px solid var(--status-danger-border);
}

/* In Progress / No data yet */
.score-badge--inprogress {
  background: var(--status-info-bg);
  color: var(--status-info-text);
  border: 1px solid var(--status-info-border);
}
```

```tsx
/* Score Badge Component */
function ScoreBadge({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  const variant =
    pct >= 80 ? 'high' :
    pct >= 60 ? 'medium' :
    score === -1 ? 'inprogress' : 'low';

  const label =
    variant === 'high'       ? 'Passed' :
    variant === 'medium'     ? 'Watch'  :
    variant === 'inprogress' ? 'In Progress' : 'At Risk';

  return (
    <span className={`score-badge score-badge--${variant}`}>
      <span className="score-value">{score}/{maxScore}</span>
      <span className="score-label">{label}</span>
    </span>
  );
}
```

#### 2. Task / CLO Status Chip

```css
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: var(--radius-full);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

/* สถานะ Task/CLO */
.status-chip--inprogress {
  background: var(--status-info-bg);
  color: var(--status-info-text);
}
.status-chip--inprogress .chip-dot {
  background: var(--google-blue);
  animation: pulse 2s ease infinite;
}

.status-chip--completed {
  background: var(--status-success-bg);
  color: var(--status-success-text);
}
.status-chip--completed .chip-dot { background: var(--google-green); }

.status-chip--warning {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
}
.status-chip--warning .chip-dot { background: var(--google-yellow); }

.status-chip--overdue {
  background: var(--status-danger-bg);
  color: var(--status-danger-text);
}
.status-chip--overdue .chip-dot { background: var(--google-red); }

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

#### 3. Progress Bar — CLO Attainment Rate

```css
/*
  CLO Attainment: % นักเรียนที่บรรลุ CLO นั้น
  เช่น  >= 75% นักเรียนผ่าน = Green
        50–74%              = Yellow
        < 50%               = Red
        ยังไม่มีข้อมูล      = Blue (neutral / loading)
*/
.clo-progress-fill[data-level="high"]       { background: var(--google-green); }
.clo-progress-fill[data-level="medium"]     { background: var(--google-yellow); }
.clo-progress-fill[data-level="low"]        { background: var(--google-red); }
.clo-progress-fill[data-level="inprogress"] { background: var(--google-blue); }

/* Striped — indicates partial/in-progress data */
.clo-progress-fill[data-level="inprogress"] {
  background-image: repeating-linear-gradient(
    45deg,
    var(--google-blue) 0px,
    var(--google-blue) 6px,
    rgba(66, 133, 244, 0.4) 6px,
    rgba(66, 133, 244, 0.4) 12px
  );
  animation: none;
}
```

#### 4. Dashboard Stat Card — Student Count / KPI

```css
.stat-card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  position: relative;
  overflow: hidden;
  transition: box-shadow 180ms ease;
}
.stat-card:hover { box-shadow: var(--shadow-2); }

/* Left accent stripe — color indicates status */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 4px;
}
.stat-card--blue::before   { background: var(--google-blue); }
.stat-card--green::before  { background: var(--google-green); }
.stat-card--yellow::before { background: var(--google-yellow); }
.stat-card--red::before    { background: var(--google-red); }

.stat-label  { font-size: var(--text-caption); font-weight: var(--weight-semibold); color: var(--color-neutral-400); text-transform: uppercase; letter-spacing: var(--tracking-wider); }
.stat-value  { font-family: var(--font-serif); font-size: 32px; font-weight: var(--weight-bold); color: var(--color-neutral-900); line-height: 1; }
.stat-sub    { font-size: var(--text-caption); color: var(--color-neutral-600); }
.stat-delta  { font-size: var(--text-caption); font-weight: var(--weight-semibold); display: inline-flex; align-items: center; gap: 3px; }
.stat-delta--up   { color: var(--status-success-text); }
.stat-delta--down { color: var(--status-danger-text); }
.stat-delta--flat { color: var(--color-neutral-400); }
```

#### 5. Heatmap Cell — Cohort Performance Grid

```css
/*
  ใช้สำหรับ Grid แสดงผลนักเรียน x CLO
  แต่ละ cell = ผลสัมฤทธิ์ของนักเรียน 1 คน ใน CLO 1 ข้อ
*/
.heatmap-cell {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: transform 100ms ease, box-shadow 100ms ease;
  display: grid;
  place-items: center;
  font-size: 9px;
  font-weight: var(--weight-bold);
  color: rgba(255,255,255,0.9);
}
.heatmap-cell:hover {
  transform: scale(1.25);
  box-shadow: var(--shadow-2);
  z-index: var(--z-raised);
}

.heatmap-cell--high       { background: var(--google-green); }
.heatmap-cell--medium     { background: var(--google-yellow); color: rgba(0,0,0,0.65); }
.heatmap-cell--low        { background: var(--google-red); }
.heatmap-cell--inprogress { background: var(--google-blue); }
.heatmap-cell--empty      { background: var(--color-neutral-100); }
```

#### 6. Deadline Proximity — Visual Time Warning

```css
/*
  งานที่ใกล้ deadline ให้แสดงสีและ urgency
  > 7 วัน   = Neutral (ไม่เน้น)
  3–7 วัน  = Yellow Warning
  < 3 วัน  = Red Critical
  Overdue  = Red + strikethrough label
*/
.deadline-label { font-size: var(--text-caption); font-weight: var(--weight-semibold); display: inline-flex; align-items: center; gap: 4px; }
.deadline-label--normal   { color: var(--color-neutral-400); }
.deadline-label--warning  { color: var(--status-warning-text); }
.deadline-label--critical { color: var(--status-danger-text); }
.deadline-label--overdue  { color: var(--status-danger-text); text-decoration: line-through; }
```

### Color Decision Tree

```
นักเรียน / Task / CLO ต้องแสดงสีอะไร?

                [มีข้อมูลแล้วหรือยัง?]
                      |
          ไม่มี / กำลังดำเนินการ
                      |
                   BLUE (#4285F4)
                "In Progress / Active"

                      |
                [มีข้อมูลแล้ว — ดูผลลัพธ์]
                      |
         ─────────────────────────────
         |                           |
    [ผ่านเกณฑ์?]              [ไม่ผ่านเกณฑ์]
         |                           |
      GREEN (#34A853)        [ใกล้เกณฑ์หรือวิกฤต?]
    "Completed / High"               |
                          ───────────────────────
                          |                     |
                    ใกล้เกณฑ์             ต่ำกว่าเกณฑ์มาก
                  YELLOW (#FBBC05)        RED (#EA4335)
                  "Watch / Warning"    "At Risk / Overdue"
```

### Usage Rules — Color Discipline

```
DO    ใช้สีเดียวกันให้ consistent ข้ามทุก component ใน session เดียวกัน
DO    แสดง legend หรือ tooltip อธิบายความหมายของสีเสมอ (hover หรือ info icon)
DO    ใช้ icon ประกอบสีเสมอ — อย่าพึ่งพาสีเพียงอย่างเดียว (เพื่อ accessibility)
DO    ใช้ font-weight: 700 กับ status text เพื่อให้อ่านได้โดยไม่ต้องพึ่งสีอย่างเดียว

DON'T ใช้ Red สำหรับ branding หรือ decorative element ใดๆ — Red = Critical เท่านั้น
DON'T ใช้ Yellow บน background สีอ่อน โดยไม่มี border หรือ text สีเข้ม
DON'T สลับ semantic ของสี เช่น ใช้ Red = success หรือ Green = danger
DON'T ใช้ทั้ง 4 สีในหน้าเดียวโดยไม่จำเป็น — ทำให้สายตาล้า
```

---

## 13. Drag & Drop — CLOs and Tasks

### Overview

Drag & Drop ใน Platform นี้ใช้สำหรับ:

- **CLO Reorder** — จัดเรียงลำดับ Course Learning Outcomes ภายใน course
- **Task Reorder** — จัดเรียง Tasks ภายใน CLO เดียวกัน
- **Task Move** — ย้าย Task ข้าม CLO (cross-list move)
- **CLO Group Collapse** — ย่อ/ขยาย CLO group โดยไม่ต้อง drag

### Visual States — Drag & Drop Lifecycle

```
[IDLE]        → ไม่มีอะไรเกิดขึ้น — item แสดงปกติ
[HOVER]       → เมาส์วางบน item — แสดง drag handle icon
[DRAG START]  → กดค้างและเริ่ม drag — item กลายเป็น ghost
[DRAGGING]    → item ลอยตาม cursor — พร้อม drop zone highlight
[OVER TARGET] → item ลอยอยู่เหนือ drop zone ที่ valid
[DROP]        → ปล่อย — animate เข้าตำแหน่งใหม่
[CANCELLED]   → กด Escape — item กลับตำแหน่งเดิม animate
```

### CSS — Drag & Drop

```css
/* ── DRAG HANDLE ──────────────────────────────────── */
.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--color-neutral-200);
  cursor: grab;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
  transition: color 150ms ease, background 150ms ease;
  opacity: 0;                       /* hidden until row hover */
}
.drag-handle:active { cursor: grabbing; }

/* Show handle only on parent hover */
.clo-row:hover   .drag-handle,
.task-row:hover  .drag-handle { opacity: 1; color: var(--color-neutral-400); }
.drag-handle:hover             { background: var(--color-neutral-100); color: var(--color-neutral-600); }

/* ── DRAGGABLE ITEM ───────────────────────────────── */
.draggable-item {
  position: relative;
  transition: box-shadow 180ms ease, transform 180ms ease, opacity 180ms ease;
  user-select: none;
}

/* Ghost — the item being dragged */
.draggable-item.is-dragging {
  opacity: 0.45;
  box-shadow: none;
  transform: none;
  pointer-events: none;
}

/* Drag mirror — floating clone following cursor */
.drag-mirror {
  position: fixed;
  pointer-events: none;
  z-index: var(--z-tooltip);
  transform: rotate(1.5deg) scale(1.02);
  box-shadow: var(--shadow-4);
  opacity: 0.95;
  transition: transform 80ms var(--ease-spring);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-0);
}

/* ── DROP ZONE ────────────────────────────────────── */
.drop-zone {
  transition: all 180ms ease;
  border-radius: var(--radius-md);
}

/* Active drop zone — item hovering over it */
.drop-zone.is-over-valid {
  background: rgba(75, 93, 22, 0.06);
  outline: 2px dashed var(--color-primary-400);
  outline-offset: -2px;
}

/* Invalid drop zone */
.drop-zone.is-over-invalid {
  background: rgba(234, 67, 53, 0.05);
  outline: 2px dashed var(--google-red);
  outline-offset: -2px;
  cursor: no-drop;
}

/* ── DROP INDICATOR LINE ──────────────────────────── */
/*
  เส้นแนวนอนที่แสดงตำแหน่ง insert ก่อน/หลัง item
  ใช้ pseudo-element บน sibling ที่ถูก hover ขณะ drag
*/
.draggable-item.is-drop-before::before,
.draggable-item.is-drop-after::after {
  content: '';
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  height: 2px;
  background: var(--color-primary-600);
  border-radius: var(--radius-full);
  pointer-events: none;
  animation: fadeIn 100ms ease;
}
.draggable-item.is-drop-before::before { top: -1px; }
.draggable-item.is-drop-after::after   { bottom: -1px; }

/* Drop indicator dot caps */
.draggable-item.is-drop-before::before,
.draggable-item.is-drop-after::after {
  box-shadow: -6px 0 0 3px var(--color-primary-600),
               6px 0 0 3px var(--color-primary-600);
}
```

### CLO Row Structure

```tsx
/* CLO Row — draggable group header */
interface CLORowProps {
  clo: CLO;
  index: number;
  isDragging: boolean;
}

function CLORow({ clo, index, isDragging }: CLORowProps) {
  return (
    <div
      className={`clo-row draggable-item ${isDragging ? 'is-dragging' : ''}`}
      data-id={clo.id}
    >
      {/* Drag Handle */}
      <button
        className="drag-handle"
        aria-label={`ลาก CLO ${index + 1} เพื่อจัดเรียง`}
        tabIndex={-1}
      >
        {/* GripVertical icon — 6 dots */}
        <GripVertical size={14} />
      </button>

      {/* CLO Number */}
      <span className="clo-index">CLO {index + 1}</span>

      {/* CLO Title */}
      <span className="clo-title">{clo.title}</span>

      {/* Attainment Rate */}
      <span className={`score-badge score-badge--${getLevel(clo.attainment)}`}>
        {clo.attainment}%
      </span>

      {/* Task Count */}
      <span className="clo-task-count">{clo.tasks.length} tasks</span>

      {/* Collapse Toggle */}
      <button className="clo-collapse-btn" aria-expanded={clo.expanded}>
        <ChevronDown size={14} className={clo.expanded ? 'rotated' : ''} />
      </button>
    </div>
  );
}
```

### Task Row Structure

```tsx
/* Task Row — draggable item inside CLO */
interface TaskRowProps {
  task: Task;
  cloId: string;
  isDragging: boolean;
}

function TaskRow({ task, cloId, isDragging }: TaskRowProps) {
  const deadline = getDeadlineLevel(task.dueDate); /* 'normal' | 'warning' | 'critical' | 'overdue' */

  return (
    <div
      className={`task-row draggable-item ${isDragging ? 'is-dragging' : ''}`}
      data-id={task.id}
      data-clo-id={cloId}
    >
      <button className="drag-handle" tabIndex={-1}>
        <GripVertical size={12} />
      </button>

      {/* Task type icon */}
      <span className="task-type-icon" aria-label={task.type}>
        {TASK_TYPE_ICON[task.type]}
      </span>

      {/* Task title — editable inline on double-click */}
      <span
        className="task-title"
        onDoubleClick={() => startInlineEdit(task.id)}
      >
        {task.title}
      </span>

      {/* Weight */}
      <span className="task-weight">{task.weight}%</span>

      {/* Deadline */}
      <span className={`deadline-label deadline-label--${deadline}`}>
        <Clock size={11} />
        {formatRelativeDate(task.dueDate)}
      </span>

      {/* Status */}
      <span className={`status-chip status-chip--${task.status}`}>
        <span className="chip-dot" />
        {STATUS_LABEL[task.status]}
      </span>
    </div>
  );
}
```

### Cross-CLO Move — Drag Task Between CLOs

```css
/* CLO container ที่รับ task จาก CLO อื่น */
.clo-drop-container {
  min-height: 40px;              /* ให้มีพื้นที่ drop แม้ว่า CLO จะว่าง */
  transition: min-height 200ms ease;
}
.clo-drop-container.is-over-valid {
  min-height: 60px;
  background: rgba(75, 93, 22, 0.04);
  border-radius: var(--radius-md);
}

/* Empty CLO drop area — placeholder text */
.clo-drop-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: var(--text-caption);
  color: var(--color-neutral-200);
  border: 1.5px dashed var(--color-neutral-200);
  border-radius: var(--radius-md);
  transition: all 180ms ease;
  pointer-events: none;
}
.clo-drop-container.is-over-valid .clo-drop-empty {
  color: var(--color-primary-400);
  border-color: var(--color-primary-400);
}
```

### Keyboard Drag & Drop

```
Space / Enter    เมื่อ focus ที่ drag handle — เข้าสู่ drag mode
Arrow Up/Down    ขยับ item ขึ้น/ลงใน list เดียวกัน
Arrow Left/Right ย้าย task ไปยัง CLO ก่อน/หลัง (cross-CLO move)
Escape           ยกเลิก drag กลับตำแหน่งเดิม
Enter / Space    วาง item ที่ตำแหน่งปัจจุบัน (confirm drop)
```

```css
/* Keyboard drag mode — selected item highlight */
.draggable-item.is-keyboard-drag {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
  box-shadow: var(--shadow-3);
  z-index: var(--z-raised);
}
```

### Animation — Drop Completion

```css
/* Item settling into new position */
@keyframes dropSettle {
  0%   { transform: scale(1.02); box-shadow: var(--shadow-3); }
  60%  { transform: scale(0.99); }
  100% { transform: scale(1);    box-shadow: none; }
}
.draggable-item.just-dropped {
  animation: dropSettle 380ms var(--ease-spring) both;
}

/* Item sliding to make room for incoming item */
@keyframes slideApart {
  from { transform: translateY(0); }
  to   { transform: translateY(var(--slide-offset, 48px)); }
}
```

### Implementation Notes (React DnD / dnd-kit)

```tsx
/* dnd-kit recommended — เบากว่า react-beautiful-dnd */
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* Sortable hook usage */
function SortableTaskRow({ task }: { task: Task }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-row draggable-item ${isDragging ? 'is-dragging' : ''}`}
    >
      {/* Only the handle gets listeners */}
      <button className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={12} />
      </button>
      {/* ... rest of task row */}
    </div>
  );
}
```

---

## 14. UX Interaction Principles — Desktop App Feel

Platform นี้ออกแบบให้รู้สึกเหมือน **native desktop application** ไม่ใช่ website ทั่วไป หลักการสำคัญ:

### Core Philosophy

```
"One screen = One complete workflow"
ผู้ใช้ไม่ควรต้องออกจากหน้าปัจจุบันเพื่อทำงานหลักให้เสร็จ
```

### Principle 1 — Minimal Click Depth

**เป้าหมาย:** งานหลักทุกอย่างต้องทำได้ใน 1–2 click

```
WORKFLOW CLICK BUDGET:
  View data        = 0 click  (แสดงทันทีที่โหลดหน้า)
  Edit inline      = 1 click  (double-click to edit)
  Create new item  = 1 click  (+ button หรือ keyboard shortcut)
  Delete item      = 2 clicks (right-click → Delete หรือ select + Del key)
  Move/Reorder     = drag     (ไม่ใช่ click)
  Filter/Sort      = 1 click  (header click หรือ toolbar)

NEVER require:
  - เปิด modal เพื่อดูข้อมูลที่ควร show inline
  - Navigate ไปหน้าใหม่เพื่อ edit field เดียว
  - 3+ clicks สำหรับ action ที่ทำบ่อยที่สุด
```

### Principle 2 — Data Density (Information-First Layout)

แสดงข้อมูลให้ครบในหน้าเดียว ไม่ต้อง scroll หรือ paginate สำหรับ data ที่ผู้ใช้ต้องการเห็นพร้อมกัน

```css
/* Compact Table Row — dense mode */
.table-row--compact {
  height: 40px;                       /* ลดจาก default 52px */
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border-bottom: 1px solid var(--color-neutral-100);
  transition: background 120ms ease;
}
.table-row--compact:hover { background: var(--color-neutral-50); }

/* Normal density */
.table-row--normal { height: 52px; }

/* Comfortable (default for reading) */
.table-row--comfortable { height: 64px; }
```

```css
/* Density Toggle — ผู้ใช้เลือกได้ */
.density-toggle {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--color-neutral-100);
  border-radius: var(--radius-sm);
}
.density-btn {
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-neutral-400);
  transition: all 120ms ease;
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
}
.density-btn.active { background: var(--color-neutral-0); color: var(--color-neutral-800); box-shadow: var(--shadow-1); }
```

### Principle 3 — Inline Editing (No Modal for Simple Edits)

```css
/* Inline editable cell */
.editable-cell {
  cursor: default;
  border-radius: var(--radius-xs);
  padding: 2px 6px;
  margin: -2px -6px;
  transition: background 120ms ease;
}
.editable-cell:hover { background: var(--color-neutral-100); cursor: text; }

/* Active edit state */
.editable-cell.is-editing {
  background: var(--color-neutral-0);
  outline: 2px solid var(--color-primary-600);
  outline-offset: 0;
  cursor: text;
  box-shadow: var(--shadow-focus-primary);
}

/* Editable field — looks like text until focused */
.inline-input {
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  width: 100%;
  padding: 0;
}
.inline-input:focus { background: var(--color-neutral-0); }
```

### Principle 4 — Selection & Multi-Select

```css
/* Row selection */
.selectable-row { position: relative; }

.selectable-row.is-selected {
  background: rgba(75, 93, 22, 0.06);
}
.selectable-row.is-selected::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--color-primary-600);
  border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
}

/* Checkbox — show on hover or when any row selected */
.row-checkbox {
  opacity: 0;
  transition: opacity 120ms ease;
}
.selectable-row:hover .row-checkbox,
.selectable-row.is-selected .row-checkbox,
.table-body.has-selection .row-checkbox { opacity: 1; }

/* Multi-select toolbar — appears when items selected */
.selection-toolbar {
  position: sticky;
  bottom: 0;
  background: var(--color-neutral-900);
  color: var(--color-neutral-50);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  animation: fadeUp 200ms var(--ease-enter) both;
  box-shadow: var(--shadow-4);
  z-index: var(--z-sticky);
}
.selection-count { font-size: var(--text-body-sm); font-weight: var(--weight-semibold); opacity: 0.7; }
```

### Principle 5 — Keyboard Shortcuts

```css
/* Keyboard shortcut hint — shown in tooltips and menus */
.kbd {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-bottom: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--weight-medium);
  color: var(--color-neutral-600);
  line-height: 1.4;
  white-space: nowrap;
}
```

|Action|Shortcut|Context|
|---|---|---|
|New CLO|`N`|Global|
|New Task|`T`|CLO focused|
|Delete selected|`Del` / `Backspace`|Row selected|
|Duplicate|`Ctrl+D`|Row selected|
|Undo|`Ctrl+Z`|Global|
|Redo|`Ctrl+Shift+Z`|Global|
|Select all|`Ctrl+A`|Table focused|
|Focus search|`/`|Global|
|Escape|`Esc`|Close any panel / cancel edit|
|Save inline edit|`Enter`|Editing cell|
|Newline in textarea|`Shift+Enter`|Editing multiline|
|Move row up|`Alt+Up`|Row selected|
|Move row down|`Alt+Down`|Row selected|

### Principle 6 — Persistent Layout State

```ts
/* บันทึก UI state ใน localStorage ให้ layout คง state ไว้ระหว่าง session */
interface LayoutState {
  sidebarWidth: number;           /* user-resizable sidebar */
  tableDensity: 'compact' | 'normal' | 'comfortable';
  collapsedCLOs: string[];        /* CLO ids ที่ถูก collapse */
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  visibleColumns: string[];       /* column visibility toggle */
}

const LAYOUT_STATE_KEY = 'verdure:layout';
```

### Principle 7 — Resizable Panels

```css
/* Resizable divider — drag to resize sidebar / detail panel */
.resize-handle {
  width: 4px;
  background: transparent;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 150ms ease;
  position: relative;
}
.resize-handle:hover,
.resize-handle.is-resizing { background: var(--color-primary-400); }

/* Snap indicator */
.resize-handle::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 2px; height: 32px;
  background: var(--color-primary-600);
  border-radius: var(--radius-full);
  opacity: 0;
  transition: opacity 150ms;
}
.resize-handle:hover::after { opacity: 1; }
```

---

## 15. Right-Click Context Menu — CRUD & Clipboard

Context Menu ปรากฏเมื่อผู้ใช้ right-click บน CLO row, Task row, หรือ selected items ใดๆ แทนที่การกด button แยกต่างหาก — ลดจำนวน click และทำให้ interface สะอาด

### Design Spec

```css
/* ── CONTEXT MENU CONTAINER ──────────────────────── */
.context-menu {
  position: fixed;
  z-index: var(--z-tooltip);
  min-width: 200px;
  max-width: 260px;
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-3);
  padding: var(--space-1) 0;
  animation: scaleIn 140ms var(--ease-spring) both;
  transform-origin: top left;          /* adjusts to bottom/right near viewport edge */
  outline: none;
}

/* ── MENU ITEM ────────────────────────────────────── */
.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 7px 14px;
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: var(--weight-regular);
  color: var(--color-neutral-800);
  cursor: pointer;
  transition: background 100ms ease;
  white-space: nowrap;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  user-select: none;
}
.context-menu-item:hover  { background: var(--color-neutral-50); }
.context-menu-item:active { background: var(--color-neutral-100); }

/* Icon */
.context-menu-item .menu-icon {
  width: 15px; height: 15px;
  color: var(--color-neutral-400);
  flex-shrink: 0;
}

/* Keyboard shortcut hint */
.context-menu-item .menu-shortcut {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-neutral-200);
  padding-left: var(--space-6);
}

/* ── DESTRUCTIVE ITEM ─────────────────────────────── */
.context-menu-item--danger {
  color: var(--status-danger-text);
}
.context-menu-item--danger .menu-icon { color: var(--google-red); opacity: 0.7; }
.context-menu-item--danger:hover { background: var(--status-danger-bg); }

/* ── DISABLED ITEM ────────────────────────────────── */
.context-menu-item--disabled {
  opacity: 0.38;
  pointer-events: none;
  cursor: default;
}

/* ── SEPARATOR ────────────────────────────────────── */
.context-menu-separator {
  height: 1px;
  background: var(--color-neutral-100);
  margin: var(--space-1) 0;
}

/* ── SECTION LABEL ────────────────────────────────── */
.context-menu-label {
  padding: 5px 14px 3px;
  font-size: var(--text-overline);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  color: var(--color-neutral-200);
  user-select: none;
}

/* ── SUBMENU TRIGGER ──────────────────────────────── */
.context-menu-item--submenu::after {
  content: '';
  margin-left: auto;
  width: 12px; height: 12px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239AA668' stroke-width='2'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: contain;
  flex-shrink: 0;
}

/* Submenu panel */
.context-submenu {
  position: absolute;
  left: calc(100% + 2px);
  top: -4px;
  min-width: 180px;
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-3);
  padding: var(--space-1) 0;
  animation: scaleIn 120ms var(--ease-spring) both;
  transform-origin: top left;
}
```

### Context Menu — Item Schema

```tsx
import {
  Copy, Scissors, Clipboard, Files,
  Pencil, Trash2, Plus, ArrowUpDown,
  MoveUp, MoveDown, Link2, ExternalLink,
  ChevronRight
} from 'lucide-react';

/* Full menu structure for CLO and Task rows */
const CLO_CONTEXT_MENU: ContextMenuItem[] = [
  /* ── EDIT ───────────────────────────── */
  {
    id: 'rename',
    label: 'Rename',
    icon: Pencil,
    shortcut: 'F2',
    action: (id) => startInlineRename(id),
  },
  { type: 'separator' },

  /* ── REORDER ─────────────────────────── */
  { type: 'label', text: 'Reorder' },
  {
    id: 'move-up',
    label: 'Move Up',
    icon: MoveUp,
    shortcut: 'Alt+Up',
    action: (id) => moveItem(id, 'up'),
    disabled: (id) => isFirstItem(id),
  },
  {
    id: 'move-down',
    label: 'Move Down',
    icon: MoveDown,
    shortcut: 'Alt+Down',
    action: (id) => moveItem(id, 'down'),
    disabled: (id) => isLastItem(id),
  },
  { type: 'separator' },

  /* ── CLIPBOARD ───────────────────────── */
  { type: 'label', text: 'Clipboard' },
  {
    id: 'copy',
    label: 'Copy',
    icon: Copy,
    shortcut: 'Ctrl+C',
    action: (id) => copyToClipboard(id),
  },
  {
    id: 'cut',
    label: 'Cut',
    icon: Scissors,
    shortcut: 'Ctrl+X',
    action: (id) => cutItem(id),
  },
  {
    id: 'paste',
    label: 'Paste Below',
    icon: Clipboard,
    shortcut: 'Ctrl+V',
    action: (id) => pasteBelow(id),
    disabled: () => !hasClipboardContent(),
  },
  { type: 'separator' },

  /* ── CLONE ───────────────────────────── */
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: Files,
    shortcut: 'Ctrl+D',
    action: (id) => duplicateItem(id),
  },
  {
    id: 'duplicate-with-tasks',
    label: 'Duplicate with Tasks',
    icon: Files,
    action: (id) => duplicateWithChildren(id),
  },
  { type: 'separator' },

  /* ── CREATE ──────────────────────────── */
  {
    id: 'add-task',
    label: 'Add Task Below',
    icon: Plus,
    shortcut: 'T',
    action: (id) => addTaskToCLO(id),
  },
  { type: 'separator' },

  /* ── DANGER ──────────────────────────── */
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    shortcut: 'Del',
    variant: 'danger',
    action: (id) => confirmAndDelete(id),
  },
];

const TASK_CONTEXT_MENU: ContextMenuItem[] = [
  {
    id: 'rename',
    label: 'Rename',
    icon: Pencil,
    shortcut: 'F2',
    action: (id) => startInlineRename(id),
  },
  { type: 'separator' },
  { type: 'label', text: 'Move to CLO' },
  {
    id: 'move-to-clo',
    label: 'Move to...',
    icon: ArrowUpDown,
    type: 'submenu',
    submenu: () => buildCLOTargetMenu(),   /* dynamic — list of available CLOs */
  },
  { type: 'separator' },
  { type: 'label', text: 'Clipboard' },
  { id: 'copy',      label: 'Copy',          icon: Copy,      shortcut: 'Ctrl+C',  action: copyToClipboard },
  { id: 'cut',       label: 'Cut',           icon: Scissors,  shortcut: 'Ctrl+X',  action: cutItem },
  { id: 'paste',     label: 'Paste Below',   icon: Clipboard, shortcut: 'Ctrl+V',  action: pasteBelow, disabled: () => !hasClipboardContent() },
  { type: 'separator' },
  { id: 'duplicate', label: 'Duplicate',     icon: Files,     shortcut: 'Ctrl+D',  action: duplicateItem },
  { type: 'separator' },
  { id: 'delete',    label: 'Delete',        icon: Trash2,    shortcut: 'Del',     variant: 'danger', action: confirmAndDelete },
];
```

### Context Menu — React Implementation

```tsx
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string;
  targetType: 'clo' | 'task' | 'selection';
}

function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, targetId: '', targetType: 'clo' });
  const menuRef = useRef<HTMLDivElement>(null);

  const open = useCallback((e: React.MouseEvent, targetId: string, targetType: 'clo' | 'task' | 'selection') => {
    e.preventDefault();
    e.stopPropagation();

    /* Viewport edge detection — flip menu if too close to edge */
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = 220;
    const menuH = 320;

    const x = e.clientX + menuW > vw ? e.clientX - menuW : e.clientX;
    const y = e.clientY + menuH > vh ? e.clientY - menuH : e.clientY;

    setMenu({ visible: true, x, y, targetId, targetType });
  }, []);

  const close = useCallback(() => setMenu(m => ({ ...m, visible: false })), []);

  /* Close on outside click, Escape, or scroll */
  useEffect(() => {
    if (!menu.visible) return;
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent && menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handler);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('scroll', close, true);
    };
  }, [menu.visible, close]);

  return { menu, menuRef, open, close };
}

/* Context menu renderer */
function ContextMenu({ menu, menuRef, items, onClose }: ContextMenuProps) {
  if (!menu.visible) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      aria-label="Context actions"
      tabIndex={-1}
      style={{ top: menu.y, left: menu.x }}
    >
      {items.map((item, i) => {
        if (item.type === 'separator') return <div key={i} className="context-menu-separator" />;
        if (item.type === 'label')    return <div key={i} className="context-menu-label">{item.text}</div>;

        const isDisabled = typeof item.disabled === 'function' ? item.disabled(menu.targetId) : item.disabled;

        return (
          <button
            key={item.id}
            className={[
              'context-menu-item',
              item.variant === 'danger'  ? 'context-menu-item--danger'   : '',
              item.type    === 'submenu' ? 'context-menu-item--submenu'  : '',
              isDisabled                 ? 'context-menu-item--disabled' : '',
            ].join(' ')}
            role="menuitem"
            aria-disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) {
                item.action?.(menu.targetId);
                onClose();
              }
            }}
          >
            {item.icon && <item.icon className="menu-icon" size={15} aria-hidden="true" />}
            <span>{item.label}</span>
            {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
```

### Context Menu Attachment — CLO & Task Rows

```tsx
/* On CLO row */
<div
  className="clo-row draggable-item"
  onContextMenu={(e) => contextMenu.open(e, clo.id, 'clo')}
>
  ...
</div>

/* On Task row */
<div
  className="task-row draggable-item"
  onContextMenu={(e) => contextMenu.open(e, task.id, 'task')}
>
  ...
</div>

/* On multi-selection (selected count > 1) */
<div
  className="selectable-row is-selected"
  onContextMenu={(e) => contextMenu.open(e, 'selection', 'selection')}
>
  ...
</div>
```

### Multi-Select Context Menu

```tsx
/* เมื่อ select หลาย items แล้ว right-click */
const MULTI_SELECT_CONTEXT_MENU: ContextMenuItem[] = [
  { type: 'label', text: `{count} items selected` },
  { id: 'copy-all',      label: 'Copy All',          icon: Copy,     action: copyAllSelected },
  { id: 'cut-all',       label: 'Cut All',            icon: Scissors, action: cutAllSelected },
  { id: 'duplicate-all', label: 'Duplicate All',      icon: Files,    action: duplicateAllSelected },
  { type: 'separator' },
  { id: 'move-to',       label: 'Move All to CLO...', icon: ArrowUpDown, type: 'submenu', submenu: buildCLOTargetMenu },
  { type: 'separator' },
  { id: 'delete-all',    label: 'Delete All',         icon: Trash2, variant: 'danger', action: confirmAndDeleteAll },
];
```

### Delete Confirmation — Inline (not modal)

```css
/*
  ไม่ใช้ Modal popup สำหรับ delete confirmation
  ใช้ inline confirmation bar แทน — ไม่ block workflow
*/
.delete-confirm-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px var(--space-4);
  background: var(--status-danger-bg);
  border: 1px solid var(--status-danger-border);
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm);
  color: var(--status-danger-text);
  animation: slideRight 200ms var(--ease-enter) both;
}
.delete-confirm-bar .confirm-label { flex: 1; font-weight: var(--weight-medium); }
.delete-confirm-bar .btn-confirm   { background: var(--google-red); color: #fff; padding: 4px 12px; border-radius: var(--radius-sm); font-size: var(--text-caption); font-weight: var(--weight-bold); border: none; cursor: pointer; }
.delete-confirm-bar .btn-cancel    { background: transparent; border: none; color: var(--status-danger-text); opacity: 0.7; cursor: pointer; padding: 4px 8px; font-size: var(--text-caption); }
.delete-confirm-bar .btn-cancel:hover { opacity: 1; }

/* Auto-dismiss timer bar */
.delete-confirm-timer {
  position: absolute;
  bottom: 0; left: 0;
  height: 2px;
  background: var(--google-red);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  animation: shrinkWidth 5s linear forwards;   /* 5s undo window */
}
@keyframes shrinkWidth {
  from { width: 100%; }
  to   { width: 0%; }
}
```

### Clipboard Internal State

```ts
/* Internal clipboard — ไม่ใช้ system clipboard สำหรับ CLO/Task objects */
interface ClipboardEntry {
  type: 'copy' | 'cut';
  itemType: 'clo' | 'task';
  payload: CLO[] | Task[];
  timestamp: number;
}

/* ตัวอย่าง implementation */
class InternalClipboard {
  private entry: ClipboardEntry | null = null;

  copy(items: CLO[] | Task[], itemType: 'clo' | 'task') {
    this.entry = { type: 'copy', itemType, payload: deepClone(items), timestamp: Date.now() };
    this.showCopyIndicator(items.length);
  }

  cut(items: CLO[] | Task[], itemType: 'clo' | 'task') {
    this.entry = { type: 'cut', itemType, payload: deepClone(items), timestamp: Date.now() };
    this.markAsCut(items);               /* dim original items visually */
  }

  paste(targetId: string): ClipboardEntry | null {
    if (!this.entry) return null;
    if (this.entry.type === 'cut') {
      this.clearCutMarks();
      this.entry = null;                 /* cut = single use */
    }
    return this.entry;
  }

  has(): boolean { return this.entry !== null; }
  clear() { this.entry = null; this.clearCutMarks(); }
}
```

```css
/* Cut visual indicator — dimmed + dashed border */
.draggable-item.is-cut {
  opacity: 0.45;
  outline: 1.5px dashed var(--color-neutral-200);
  outline-offset: 2px;
}

/* Copy flash feedback */
@keyframes copyFlash {
  0%   { background: rgba(66, 133, 244, 0.15); }
  100% { background: transparent; }
}
.draggable-item.just-copied {
  animation: copyFlash 600ms var(--ease-default) both;
}
```

---

## Changelog

|Version|Date|Changes|
|---|---|---|
|`1.3.0`|2025-05|Color system rebuilt from opu.html|
|—|—|Primary: `#5c5c78` → `#19151b` (near-black)|
|—|—|Added `--md-primary-hover: #44405a` token|
|—|—|Secondary promoted to `#5c5c78` (slate-violet)|
|—|—|Tertiary updated to `#1d1418` (deep charcoal)|
|—|—|Added JP Accent palette: fuji, shikoku, toki, hue-*|
|—|—|Outline corrected: `#7b757b` / `#ccc4ca`|
|—|—|On-surface-variant corrected: `#4a454a`|
|—|—|Shadow color base changed to jp-shikoku `#2e2930`|
|—|—|Shadow values match opu.html `shadow-soft-*`|
|—|—|Border-radius updated to match opu.html tailwind|
|—|—|Added `--shadow-glass`, `--md-page-frame` tokens|
|—|—|Global base styles + page-card, nav-glass, nodemap-bg|
|—|—|Focus rings re-keyed to new primary/secondary|
|—|—|WCAG contrast table updated for new palette|
|—|—|JP gradient recipes added to Color System|
|`1.2.0`|2025-05|M3 color system, IBM Plex Sans Thai|
|`1.1.0`|2025-05|Educational domain, drag-drop, context menu|
|`1.0.0`|2025-01|Initial production release|

---

_Verdure Design System — v1.4.0_ _Colors extracted from opu.html · M3 Role Naming · JP Accent Palette_ _Font: IBM Plex Sans Thai (single family, all roles)_ _Icons: React Icons / Lucide_