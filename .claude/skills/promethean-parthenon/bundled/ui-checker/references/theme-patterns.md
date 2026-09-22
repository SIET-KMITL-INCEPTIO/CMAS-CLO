# Theme Patterns — Per-Framework Reference

Quick reference for how each theming system works, how `static-analysis.py`
detects it, what counts as compliant, and how to fix common violations.

---

## 1. CSS Custom Properties (Vanilla)

**Detection signals:** `var(--` in CSS, `--token: value` in `:root`
**`theming_system` value:** `css-custom-properties`

### How it works
```css
/* Define tokens in :root (light mode baseline) */
:root {
  --color-text:       #1a1a1a;
  --color-background: #ffffff;
  --color-primary:    #2563eb;
  --color-border:     #e4e4e7;
}

/* Override for dark mode — CHOOSE ONE method: */

/* Method A — media query (OS-only, not live-toggleable) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text:       #fafafa;
    --color-background: #0a0a0a;
    --color-primary:    #3b82f6;
    --color-border:     #27272a;
  }
}

/* Method B — .dark class (live-toggleable via JS button) ✅ preferred */
.dark {
  --color-text:       #fafafa;
  --color-background: #0a0a0a;
  --color-primary:    #3b82f6;
  --color-border:     #27272a;
}

/* Method C — data-theme attribute (live-toggleable) ✅ also good */
[data-theme="dark"] {
  --color-text: #fafafa;
  /* ... */
}
```

### Compliant usage
```css
/* ✅ All color values reference a token */
.card {
  background: var(--color-background);
  color:      var(--color-text);
  border:     1px solid var(--color-border);
}
```

### Violations flagged by static-analysis.py
```css
/* ❌ hardcoded — won't change with theme */
.card { background: #ffffff; color: #1a1a1a; }

/* ❌ inline style — bypasses tokens completely */
<div style="color: #1a1a1a;">
```

### Live-toggle JS (Method B)
```js
document.documentElement.classList.toggle('dark');
// or
document.documentElement.setAttribute('data-theme', 'dark');
```

---

## 2. Tailwind CSS — Palette Utilities + dark: Variants

**Detection signals:** `dark:` class prefixes, `cdn.tailwindcss.com`
**`theming_system` value:** `tailwind`
**`dark_mode_method` value:** `tailwind-media` (OS-only) or `tailwind-class` (live-toggleable)

### Enable class-based dark mode (required for live toggle)
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',   // ← must be 'class', not 'media'
  // ...
}
```

### Compliant — paired palette utilities
```html
<!-- ✅ Light and dark palette values explicitly paired -->
<div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

### Violations flagged — missing dark: pair
```html
<!-- ❌ bg-slate-100 has no dark: counterpart on this element -->
<p class="bg-slate-100 text-slate-900">
```

### Violations flagged — arbitrary values
```html
<!-- ❌ arbitrary color — hardcoded, bypasses theme entirely -->
<div class="bg-[#1a1a1a] text-[#ffffff]">
```

### Live-toggle JS
```js
document.documentElement.classList.toggle('dark');
```

---

## 3. Tailwind CSS + shadcn/ui — Semantic Token Classes

**Detection signals:** `dark:` classes + `.dark {}` CSS block + `var(--` in CSS
**`theming_system` value:** `tailwind + css-custom-properties`
**`dark_mode_method` value:** `class`
**`live_toggle_compatible`:** `true` ✅

This is the recommended pattern for new projects. Tailwind utility classes map
through `tailwind.config.js` to CSS variables defined in `:root` / `.dark`.
One config drives everything — no need to pair every utility with a `dark:` variant.

### tailwind.config.js
```js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        muted:       'hsl(var(--muted))',
        'muted-foreground':   'hsl(var(--muted-foreground))',
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        card:        'hsl(var(--card))',
        destructive: 'hsl(var(--destructive))',
      },
    },
  },
}
```

### globals.css (token definitions)
```css
@layer base {
  :root {
    --background:         0 0% 100%;
    --foreground:         240 10% 3.9%;
    --primary:            240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --muted:              240 4.8% 95.9%;
    --muted-foreground:   240 3.8% 46.1%;
    --border:             240 5.9% 90%;
    --input:              240 5.9% 90%;
    --ring:               240 10% 3.9%;
    --card:               0 0% 100%;
    --destructive:        0 84.2% 60.2%;
  }

  .dark {
    --background:         240 10% 3.9%;
    --foreground:         0 0% 98%;
    --primary:            0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --muted:              240 3.7% 15.9%;
    --muted-foreground:   240 5% 64.9%;
    --border:             240 3.7% 15.9%;
    --input:              240 3.7% 15.9%;
    --ring:               240 4.9% 83.9%;
    --card:               240 10% 3.9%;
    --destructive:        0 62.8% 30.6%;
  }
}
```

### Compliant usage — semantic classes, NO dark: pairing needed
```html
<!-- ✅ Uses semantic token classes — automatically light/dark -->
<div class="bg-background text-foreground border border-border rounded-lg p-4">
  <h2 class="text-foreground font-semibold">Card Title</h2>
  <p class="text-muted-foreground text-sm">Subtitle</p>
  <button class="bg-primary text-primary-foreground px-4 py-2 rounded">
    Action
  </button>
</div>
```

### Violations — arbitrary values bypass the token system
```html
<!-- ❌ arbitrary color — ignores the entire token system -->
<div class="bg-[#ffffff] dark:bg-[#0a0a0a]">

<!-- ❌ raw palette — not connected to dark mode without pairing -->
<div class="bg-white text-black">

<!-- ✅ correct replacement -->
<div class="bg-background text-foreground">
```

### static-analysis.py detection
- `semantic_token_usage_count` — count of `bg-background`, `text-foreground` etc. (higher = more compliant)
- `hardcoded_colors` — flags `bg-[#hex]` as `tailwind_arbitrary_color`
- `unpaired_dark_variants` — flags `bg-white` without `dark:bg-...` sibling

---

## 4. SCSS Variables

**Detection signals:** `$variable:` syntax in CSS
**`theming_system` value:** `scss`

### How it works
```scss
// _tokens.light.scss
$color-text:       #1a1a1a;
$color-background: #ffffff;
$color-primary:    #2563eb;

// _tokens.dark.scss
$color-text:       #fafafa;
$color-background: #0a0a0a;
$color-primary:    #3b82f6;

// _theme.scss — apply via class
.dark {
  --color-text:       #{$color-text-dark};
  --color-background: #{$color-background-dark};
}
```

### Best practice — bridge SCSS to CSS variables
```scss
// Define SCSS vars per theme file, then output as CSS vars
// This gives you SCSS compile-time safety AND CSS runtime flexibility
:root {
  --color-text: #{$color-text};
}
.dark {
  --color-text: #{$color-text-dark};
}
```

### Violations flagged
```scss
/* ❌ hardcoded color in component (SCSS or compiled CSS) */
.card { background: #ffffff; }

/* ✅ compliant */
.card { background: var(--color-background); }
```

---

## 5. CSS-in-JS (styled-components / Emotion)

**Detection signals:** `styled.` or `@emotion` in HTML/JSX
**`theming_system` value:** `css-in-js`

### How it works
```jsx
// theme.ts
const lightTheme = {
  colors: {
    text:       '#1a1a1a',
    background: '#ffffff',
    primary:    '#2563eb',
  },
};
const darkTheme = {
  colors: {
    text:       '#fafafa',
    background: '#0a0a0a',
    primary:    '#3b82f6',
  },
};

// App.tsx
<ThemeProvider theme={isDark ? darkTheme : lightTheme}>
  <App />
</ThemeProvider>

// Component.tsx
const Card = styled.div`
  background: ${({ theme }) => theme.colors.background};
  color:      ${({ theme }) => theme.colors.text};
`;
```

### Violations
```jsx
/* ❌ hardcoded inside styled component */
const Card = styled.div`background: #ffffff;`;

/* ❌ inline style with hardcoded color */
<div style={{ color: '#1a1a1a' }}>

/* ✅ always access from theme */
const Card = styled.div`color: ${({ theme }) => theme.colors.text};`;
```

### Note for static-analysis.py
Because CSS-in-JS compiles to `<style>` tags at runtime (not in the HTML source),
static analysis may miss violations inside JS template literals. The Inspector
Artifact's color extraction works correctly because it reads the browser's live
computed styles after JS has run.

---

## 6. Bootstrap 5

**Detection signals:** `data-bs-theme` attribute
**`theming_system` value:** `bootstrap5`

### How it works
```html
<!-- Light (default) -->
<html data-bs-theme="light">

<!-- Dark -->
<html data-bs-theme="dark">

<!-- Per-component theming -->
<div data-bs-theme="dark" class="card">...</div>
```

### Token system (Bootstrap 5.3+)
Bootstrap exposes `--bs-*` CSS variables for all colors. Override these, not raw hex values:

```css
/* ✅ Override Bootstrap tokens */
[data-bs-theme="light"] {
  --bs-body-color: #1a1a1a;
  --bs-body-bg:    #ffffff;
  --bs-primary:    #2563eb;
}
[data-bs-theme="dark"] {
  --bs-body-color: #fafafa;
  --bs-body-bg:    #0a0a0a;
  --bs-primary:    #3b82f6;
}

/* ❌ Hardcoded override — bypasses theme switching */
.card { background: #ffffff !important; }
```

### Live-toggle JS
```js
document.documentElement.setAttribute('data-bs-theme',
  document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'
);
```

---

## Dark Mode Method Decision Matrix

| You want... | Use method | `dark_mode_method` | `live_toggle_compatible` |
|---|---|---|---|
| OS-only (no manual button needed) | `@media (prefers-color-scheme: dark)` | `media-query` | ❌ false |
| Manual toggle button | `.dark {}` class on `<html>` | `class` | ✅ true |
| Manual toggle + data attribute | `[data-theme="dark"]` | `data-attribute` | ✅ true |
| Tailwind, OS-only | `darkMode: 'media'` in config | `tailwind-media` | ❌ false |
| Tailwind, manual toggle | `darkMode: 'class'` in config | `tailwind-class` | ✅ true |
| shadcn/ui convention | `.dark {}` + tailwind `darkMode:'class'` | `class` | ✅ true |

**Best practice:** Always use a class/attribute method so users can manually override
their OS preference inside your app, and so the Inspector Artifact's toggle works.

---

## Common Violations Quick Reference

| Violation | Detected by | Fix |
|---|---|---|
| `color: #1a1a1a` in component CSS | `hardcoded_colors` | `color: var(--color-text)` |
| `style="color: #f00"` | `inline_style_issues` | Move to CSS class with token |
| `bg-[#1a1a1a]` Tailwind | `hardcoded_colors` (type: tailwind_arbitrary_color) | `bg-background` (semantic) |
| `bg-slate-100` without `dark:bg-...` | `tailwind.unpaired_dark_variants` | Add `dark:bg-slate-900` or use `bg-muted` |
| `--color-text` defined but no `.dark` override | `missing_dark_overrides` | Add to `.dark {}` block |
| `font-size: 14px` | `typography_issues` | `font-size: 0.875rem` |
| Transitions, no `prefers-reduced-motion` | `motion.issue` | Add `@media (prefers-reduced-motion: reduce)` block |
| `<img>` with no `alt` | `accessibility.images_missing_alt` | Add `alt="description"` |
| No `:focus-visible` styles | `accessibility.focus_style_issue` | Add focus ring CSS |
| `darkMode: 'media'` in Tailwind | `live_toggle_compatible: false` | Change to `darkMode: 'class'` |
