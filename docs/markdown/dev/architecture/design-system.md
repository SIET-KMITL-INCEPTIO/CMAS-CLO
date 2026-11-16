# Verdure Design System

See also: [[Design System Strategy]] · [[verdure-design-system]] · [[concept-clo MOC]]

**Version 1.4.0** · Production Release · ใช้งานจริง

> **เลิกใช้กับแอปแล้ว (2026-10-22):** ตามมติ DS ใน [[prototype-to-app]] §5 แอป React ใช้ **Nocturnal Atelier v3.2** ของต้นแบบ
> `docs/index-q/index-q.html` แทน — โทเคนอยู่ที่ `app/client/src/styles/tokens.css` และคลาสอยู่ที่ `styles/atelier.css` ·
> ดูค่าและตัวอย่างที่ `docs/index-q/index-q-design-system.html` · เอกสารนี้เก็บไว้เป็นประวัติของรอบออกแบบก่อนหน้า

> ### สีสื่อความหมายตามเล่มปริญญานิพนธ์ §3.5.2.2 (ใช้กับแอปปัจจุบัน · เพิ่ม 2026-11-14)
>
> ส่วนนี้**ไม่ใช่**ของ Verdure — เป็นกติกาความหมายของสีที่เล่มกำหนด เทียบกับโทเคนของแอป (`app/client/src/styles/tokens.css`)
>
> | กลุ่มในเล่ม | สถานะ / องค์ประกอบ (ตามเล่ม) | โทเคนในแอป (`tone`) | เหตุผลที่เล่มอ้าง |
> |---|---|---|---|
> | สีหลัก (Primary) | แถบนำทาง · แถบเมนู · ปุ่มคำสั่งหลัก — น้ำเงินเข้ม/กรมท่า | `--color-info` · โทนกรมท่าของ Nocturnal Atelier | สีวรรณะเย็นกระตุ้นความคิดเชิงเหตุผล (วัชราธร เพ็ญศศิธร, 2564) · น้ำเงินสื่อความสามารถ (Labrecque & Milne, 2012) |
> | Success / Pass | ผ่านเกณฑ์ CLO · แถบความก้าวหน้าที่บรรลุ · ป้าย "ผ่านแล้ว" (มีคำอธิบายว่าเป็นสถานะจากคะแนนขณะนั้น ยังไม่ใช่เกรดจริง) · แจ้งบันทึกสำเร็จ | `ok` | สัญญาณไฟจราจร (Jisc, 2016) |
> | Danger | "ไม่ผ่านรายวิชา" · ป้าย "ยังไม่ผ่าน" ที่คำนวณโดยนับช่องว่างเป็น 0 ([[srs]] CR-05.2) · ปุ่มที่กระทบข้อมูล เช่น ลบรายวิชา | `bad` | สีแดงเชื่อมกับอันตรายและการหลีกเลี่ยง (Elliot & Maier, 2014) |
> | Warning (Amber) | "ต่ำกว่าเกณฑ์ CLO" · "รอคะแนน N กิจกรรม" — เฝ้าระวังแต่ยังไม่วิกฤต | `warn` | เรียง เขียว → อำพัน → แดง ตามสัญญาณไฟจราจร (Jisc, 2016) |
> | Neutral | "ยังประเมินไม่ครบ" — ข้อมูลไม่พอประเมิน · เทาม่วงกลาง | `nil` | เฉดเทาแทนข้อมูลที่ไม่มีค่า (Simmon, 2013; Muth, n.d.) · สีกลาง/ม่วงแทนสถานะที่ยังไม่ทราบ (Dynatrace, n.d.; IBM, n.d.) |
> | Categorical tags | ป้าย Bloom L1–L6 และ SOLO S1–S3 — สีเดียวไล่ความเข้ม เพราะเป็นข้อมูลมีลำดับ · ตัวอักษรเปลี่ยนสีอัตโนมัติให้ตัดกับพื้น | ป้ายระดับใน `features/clos` | Harrower & Brewer (2003) |
>
> กติการ่วม: ไม่ใช้สีเป็นสื่อความหมายอย่างเดียว ทุกสถานะมีข้อความหรือสัญลักษณ์กำกับ · contrast ≥ 4.5:1 (W3C, 2018) ·
> สถิติแสดงด้วย progress bar / share bar (ผ่าน · ต่ำกว่าเกณฑ์ · ยังไม่มีคะแนน) · กราฟเรดาร์ · กราฟแท่ง · ฮิสโตแกรม
>
> ⚠ **คำว่า "ยังไม่ผ่าน" ใช้ไม่ตรงกัน** — ในเล่มคือป้ายแดงของ CR-05.2 (นับช่องว่างเป็น 0) แต่ในแอปปัจจุบัน
> (`CourseOverview.page.tsx` · `StudentDrawer.tsx`) คือ CLO ต่ำกว่าเกณฑ์ ใช้ `tone="warn"` — ต้องตัดสินพร้อม [[srs]] OI-18

> **1.4.0 Changelog:** รวม typeface เหลือ **IBM Plex Sans Thai** เพียง family เดียว (เดิม Noto Serif + Plex Mono) · Icons ใช้ **React Icons (Lucide)** เท่านั้น — ห้าม emoji · Google Colors สงวนไว้สำหรับ **status semantic** ไม่ใช้ decorative

> ระบบออกแบบที่สร้างบนรากฐาน Material Design 3 Color System — ใช้ palette สี Cool Neutral Violet ที่มีความ sophisticated, อ่านง่าย และ accessible ในทุก surface layer ผสมผสานกับ typography ที่สมดุลระหว่างมรดกทางวัฒนธรรมและประสิทธิภาพในการใช้งาน

---

## สารบัญ

1. [Brand Identity](#1-brand-identity)
2. [Typography](#2-typography)
3. [Color System](#3-color-system)
4. [Status Colors](#4-status-colors)
5. [Spacing & Shape](#5-spacing--shape)
6. [Elevation & Shadow](#6-elevation--shadow)
7. [Iconography](#7-iconography)
8. [Components](#8-components)
    - [Button](#81-button)
    - [Input & Form](#82-input--form)
    - [Badge & Tag](#83-badge--tag)
    - [Card](#84-card)
    - [Alert](#85-alert)
    - [Navigation](#86-navigation)
    - [Progress](#87-progress)
    - [Avatar](#88-avatar)
    - [Toggle](#89-toggle)
9. [Motion & Animation](#9-motion--animation)
10. [Accessibility](#10-accessibility)
11. [Token Reference](#11-token-reference)
12. [Educational Domain — Google Color Semantic Usage](design-system-interaction.md#12-educational-domain--google-color-semantic-usage)
13. [Drag & Drop — CLOs and Tasks](design-system-interaction.md#13-drag--drop--clos-and-tasks)
14. [UX Interaction Principles — Desktop App Feel](design-system-interaction.md#14-ux-interaction-principles--desktop-app-feel)
15. [Right-Click Context Menu — CRUD & Clipboard](design-system-interaction.md#15-right-click-context-menu--crud--clipboard)

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
  --radius-sm:   8px;   /* Badges, pills */
  --radius-md:   16px;  /* Buttons, inputs ★ default */
  --radius-lg:   24px;  /* Cards, panels */
  --radius-xl:   32px;  /* Hero blocks, modals */
  --radius-2xl:  48px;  /* Featured cards */
  --radius-full: 9999px; /* Circular avatars, toggle */
}
```

> **Design Decision:** `--radius-md: 16px` คือค่าหลักของระบบนี้ (ตรงกับ `tokens.css`; เดิมเอกสารเขียน 10px แล้วโค้ดเปลี่ยนเป็น 16px ภายหลัง — แก้ให้ตรงโค้ด 2026-11-09) — เพียงพอที่จะดูเป็นมิตรและ approachable โดยไม่รู้สึก childlike

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