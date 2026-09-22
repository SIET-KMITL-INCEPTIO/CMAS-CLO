#!/usr/bin/env python3
"""
ui-checker / scripts / static-analysis.py

Analyzes HTML/CSS files for:
  - Hardcoded color values (CSS + Tailwind arbitrary values)
  - CSS variable definition & dark-mode coverage
  - Tailwind dark: variant pairing
  - Layout dimension issues
  - Inline style color violations
  - Typography (px font sizes)
  - Motion (missing prefers-reduced-motion)
  - Basic accessibility (alt text, focus styles)

Usage:
  python3 static-analysis.py --input page.html --output analysis.json
  python3 static-analysis.py --input styles.css --output analysis.json
"""

import re
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional

# ── Regex patterns ─────────────────────────────────────────────────────────────

HEX_COLOR     = re.compile(r'#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8}|[0-9a-fA-F]{3,4})\b')
RGB_COLOR     = re.compile(r'rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)')
HSL_COLOR     = re.compile(r'hsla?\(\s*[\d.]+(?:deg|turn|rad|grad)?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+)?\s*\)')
CSS_VAR_DEF   = re.compile(r'(--[a-zA-Z0-9_-]+)\s*:\s*([^;{]+?)(?:\s*;|\s*})')
CSS_VAR_USE   = re.compile(r'var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,\s*[^)]+)?\s*\)')
INLINE_STYLE  = re.compile(r'style\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
FIXED_HEIGHT  = re.compile(r'\bheight\s*:\s*(\d+)px\b')
FIXED_WIDTH   = re.compile(r'\bwidth\s*:\s*(\d+)px\b')
OVERFLOW_HID  = re.compile(r'\boverflow(?:-[xy])?\s*:\s*hidden\b')
DARK_QUERY    = re.compile(r'@media\s*\([^)]*prefers-color-scheme\s*:\s*dark[^)]*\)', re.IGNORECASE)
DARK_CLASS    = re.compile(r'\.dark\s*[\{,]')
DARK_ATTR     = re.compile(r'\[(?:data-theme|data-mode|data-color-scheme)\s*=\s*["\']dark["\']\]', re.IGNORECASE)
TAILWIND_DARK = re.compile(r'\bdark:[a-zA-Z0-9_\[\]/.#%-]+')
TAILWIND_CDN  = re.compile(r'cdn\.tailwindcss\.com', re.IGNORECASE)
TAILWIND_CFG_CLASS = re.compile(r'darkMode\s*:\s*[\'"]class[\'"]')
SCSS_VAR      = re.compile(r'\$[a-zA-Z][a-zA-Z0-9_-]+\s*:')
CLASS_ATTR    = re.compile(r'class\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
FONT_SIZE_PX  = re.compile(r'\bfont-size\s*:\s*(\d+(?:\.\d+)?)px\b')
TRANSITION    = re.compile(r'\b(?:transition|animation)\s*:')
REDUCED_MOTION = re.compile(r'@media\s*\([^)]*prefers-reduced-motion[^)]*\)', re.IGNORECASE)
FOCUS_STYLE   = re.compile(r':focus(?:-visible)?\s*\{')
IMG_TAG       = re.compile(r'<img\b[^>]*>', re.IGNORECASE)
IMG_ALT       = re.compile(r'\balt\s*=\s*["\'][^"\']*["\']', re.IGNORECASE)
BUTTON_LINK   = re.compile(r'<(?:button|a)\b[^>]*>', re.IGNORECASE)

# Tailwind color utilities (only used via fullmatch on pre-split class tokens)
TAILWIND_COLOR_UTIL = re.compile(
    r'(bg|text|border|ring|ring-offset|divide|outline|decoration|caret|accent|fill|stroke|from|via|to|shadow)'
    r'-(?:'
      r'\[(#[0-9a-fA-F]{3,8}|rgba?\([^\]]+\)|hsla?\([^\]]+\))\]'   # arbitrary [#hex] / [rgb(...)]
      r'|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan'
       r'|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)'
      r'(?:-(?:50|100|200|300|400|500|600|700|800|900|950))?'
    r')$'
)
# Semantic token patterns used in shadcn/Tailwind (good — count, don't flag)
TAILWIND_SEMANTIC = re.compile(
    r'\b(?:bg|text|border|ring)-(?:background|foreground|primary|secondary|muted|accent|destructive|card|popover|input|ring)(?:-\w+)?\b'
)

COLOR_PROPS = {
    'color', 'background', 'background-color', 'border-color',
    'outline', 'outline-color', 'box-shadow', 'text-shadow',
    'fill', 'stroke', 'caret-color', 'accent-color',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def extract_css_from_html(html: str) -> str:
    blocks = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL | re.IGNORECASE)
    return '\n'.join(blocks)

def get_prop_context(line: str, match_start: int) -> str:
    before = line[:match_start].rstrip()
    m = re.search(r'([\w-]+)\s*:\s*$', before)
    if m:
        return m.group(1).lower()
    m2 = re.search(r'([\w-]+)\s*:.*$', before)
    return m2.group(1).lower() if m2 else 'unknown'

def detect_theming_system(css: str, html: str = '') -> str:
    combined = css + html
    systems = []
    if TAILWIND_DARK.search(combined) or TAILWIND_CDN.search(html):
        systems.append('tailwind')
    if CSS_VAR_USE.search(css) or CSS_VAR_DEF.search(css):
        systems.append('css-custom-properties')
    if SCSS_VAR.search(css):
        systems.append('scss')
    if 'styled.' in html or '@emotion' in html:
        systems.append('css-in-js')
    if 'data-bs-theme' in html:
        systems.append('bootstrap5')
    return ' + '.join(dict.fromkeys(systems)) if systems else 'unknown'


# ── Analysis functions ─────────────────────────────────────────────────────────

def find_hardcoded_colors(css: str, filename: str = '') -> List[Dict]:
    """Hardcoded color values NOT inside a CSS variable definition line."""
    results = []
    for line_no, line in enumerate(css.split('\n'), 1):
        stripped = line.strip()
        if stripped.startswith(('/*', '*', '//')):
            continue
        is_var_def = bool(re.match(r'\s*--[a-zA-Z0-9_-]+\s*:', line))
        if is_var_def:
            continue
        for pattern, kind in [(HEX_COLOR, 'hex'), (RGB_COLOR, 'rgb'), (HSL_COLOR, 'hsl')]:
            for m in pattern.finditer(line):
                ctx = get_prop_context(line, m.start())
                results.append({
                    'type': kind,
                    'value': m.group(),
                    'line': line_no,
                    'context': ctx,
                    'is_color_property': ctx in COLOR_PROPS,
                    'severity': 'error',
                    'source': filename,
                    'line_content': stripped[:120],
                })
    return results


def find_variable_definitions(css: str, html: str = '') -> Dict[str, Any]:
    root_vars: Dict[str, str] = {}
    dark_vars: Dict[str, str] = {}

    for block in re.findall(r':root\s*\{([^}]+)\}', css, re.DOTALL):
        for m in CSS_VAR_DEF.finditer(block):
            root_vars[m.group(1)] = m.group(2).strip()

    def collect_dark_vars(segment: str) -> None:
        bm = re.match(r'\s*\{(.*?)\}', segment, re.DOTALL)
        if bm:
            for m in CSS_VAR_DEF.finditer(bm.group(1)):
                dark_vars[m.group(1)] = m.group(2).strip()

    for outer in DARK_QUERY.finditer(css):
        collect_dark_vars(css[outer.end():])
    for outer in DARK_ATTR.finditer(css):
        collect_dark_vars(css[outer.end():])
    for outer in DARK_CLASS.finditer(css):
        collect_dark_vars(css[outer.end():])

    missing = {k: v for k, v in root_vars.items() if k not in dark_vars}

    has_dq   = bool(DARK_QUERY.search(css))
    has_da   = bool(DARK_ATTR.search(css))
    has_dc   = bool(DARK_CLASS.search(css))
    has_tw   = bool(TAILWIND_DARK.search(css + html))
    tw_class = bool(TAILWIND_CFG_CLASS.search(html))

    live_toggle = has_da or has_dc or (has_tw and tw_class)

    if has_da:             method = 'data-attribute'
    elif has_dc:           method = 'class'
    elif has_tw and tw_class: method = 'tailwind-class'
    elif has_tw:           method = 'tailwind-media'
    elif has_dq:           method = 'media-query'
    else:                  method = 'none'

    return {
        'root_variables': root_vars,
        'dark_variables': dark_vars,
        'missing_dark_overrides': missing,
        'dark_mode_support': method != 'none',
        'dark_mode_method': method,
        'live_toggle_compatible': live_toggle,
    }


def find_variable_usages(css: str) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for m in CSS_VAR_USE.finditer(css):
        n = m.group(1)
        counts[n] = counts.get(n, 0) + 1
    return counts


def check_tailwind_classes(html: str) -> Dict[str, Any]:
    arbitrary, unpaired = [], []
    semantic_count = 0
    file_has_dark = bool(TAILWIND_DARK.search(html))

    for line_no, line in enumerate(html.split('\n'), 1):
        for cm in CLASS_ATTR.finditer(line):
            classes = cm.group(1).split()
            class_set = set(classes)
            semantic_count += len(TAILWIND_SEMANTIC.findall(cm.group(1)))

            for cls in classes:
                base = cls[5:] if cls.startswith('dark:') else cls
                m = TAILWIND_COLOR_UTIL.fullmatch(base)
                if not m:
                    continue
                prefix = m.group(1)

                if m.group(2):  # arbitrary [#hex]
                    arbitrary.append({
                        'type': 'tailwind_arbitrary_color',
                        'value': cls,
                        'line': line_no,
                        'context': prefix,
                        'severity': 'error',
                        'line_content': line.strip()[:120],
                        'suggestion': (
                            f'Replace `{cls}` with a semantic token class like `{prefix}-background` '
                            f'that maps to a CSS variable via tailwind.config.'
                        ),
                    })

                elif not cls.startswith('dark:') and file_has_dark:
                    # Raw palette literal; flag only when file clearly uses dark: elsewhere
                    has_dark_pair = any(
                        c.startswith('dark:') and c[5:].split('-')[0] == prefix
                        for c in class_set
                    )
                    if not has_dark_pair:
                        unpaired.append({
                            'type': 'tailwind_missing_dark_variant',
                            'value': cls,
                            'line': line_no,
                            'context': prefix,
                            'severity': 'warning',
                            'line_content': line.strip()[:120],
                            'suggestion': (
                                f'`{cls}` has no `dark:{prefix}-...` pair on this element. '
                                f'Add one or replace with a semantic token class.'
                            ),
                        })

    return {
        'arbitrary_color_violations': arbitrary,
        'unpaired_dark_variants': unpaired,
        'semantic_token_usage_count': semantic_count,
    }


def check_layout_issues(css: str) -> List[Dict]:
    issues = []
    lines = css.split('\n')
    for i, line in enumerate(lines, 1):
        nearby = '\n'.join(lines[max(0, i-4):i+4]).lower()
        for m in FIXED_HEIGHT.finditer(line):
            px = int(m.group(1))
            has_min = 'min-height' in nearby
            issues.append({
                'type': 'fixed_height', 'value': f'{px}px', 'line': i,
                'severity': 'info' if has_min else 'warning',
                'suggestion': (
                    f'min-height also set — ensure content never exceeds {px}px.'
                    if has_min else
                    f'Replace with min-height: {px}px; height: auto; so content can grow.'
                ),
            })
        for m in FIXED_WIDTH.finditer(line):
            px = int(m.group(1))
            if px > 480:
                has_max = 'max-width' in nearby
                issues.append({
                    'type': 'fixed_width', 'value': f'{px}px', 'line': i,
                    'severity': 'info' if has_max else 'warning',
                    'suggestion': (
                        f'max-width also set — add width: 100%; if missing.'
                        if has_max else
                        f'Replace with max-width: {px}px; width: 100%; for responsive behaviour.'
                    ),
                })
        if OVERFLOW_HID.search(line):
            issues.append({
                'type': 'overflow_hidden', 'value': 'overflow: hidden', 'line': i,
                'severity': 'info',
                'suggestion': 'Verify content at large fonts or 200% zoom is not clipped.',
            })
    return issues


def check_inline_styles(html: str) -> List[Dict]:
    issues = []
    for i, line in enumerate(html.split('\n'), 1):
        for m in INLINE_STYLE.finditer(line):
            val = m.group(1)
            colors = HEX_COLOR.findall(val) + RGB_COLOR.findall(val) + HSL_COLOR.findall(val)
            if colors:
                issues.append({
                    'type': 'inline_style_color', 'value': m.group(0)[:140], 'line': i,
                    'colors_found': colors, 'severity': 'error',
                    'suggestion': 'Move color values to a CSS class using CSS variables.',
                })
    return issues


def check_typography(css: str) -> List[Dict]:
    issues = []
    for i, line in enumerate(css.split('\n'), 1):
        for m in FONT_SIZE_PX.finditer(line):
            px = float(m.group(1))
            issues.append({
                'type': 'font_size_px', 'value': f'{px}px', 'line': i,
                'severity': 'info',
                'suggestion': f'Use {px/16:.4g}rem instead of {px}px — scales with browser font-size preference.',
            })
    return issues


def check_motion(css: str) -> Dict:
    has_motion = bool(TRANSITION.search(css))
    has_pref   = bool(REDUCED_MOTION.search(css))
    return {
        'uses_transitions_or_animations': has_motion,
        'respects_reduced_motion': has_pref,
        'issue': (
            None if not has_motion or has_pref else
            'Transitions/animations found with no @media (prefers-reduced-motion: reduce) override.'
        ),
    }


def check_accessibility(html: str, css: str) -> Dict:
    imgs = IMG_TAG.findall(html)
    missing_alt = [t[:100] for t in imgs if not IMG_ALT.search(t)]
    has_focus   = bool(FOCUS_STYLE.search(css))
    interactive = len(BUTTON_LINK.findall(html))
    return {
        'images_total': len(imgs),
        'images_missing_alt': len(missing_alt),
        'missing_alt_examples': missing_alt[:5],
        'has_focus_visible_styles': has_focus,
        'interactive_elements_found': interactive,
        'focus_style_issue': (
            None if has_focus or interactive == 0 else
            'No :focus or :focus-visible styles — keyboard users may not see what\'s focused.'
        ),
    }


def calculate_compliance(hardcoded: List[Dict], var_usages: Dict[str, int]) -> float:
    n_hc  = len(hardcoded)
    n_var = sum(var_usages.values())
    total = n_hc + n_var
    return 100.0 if total == 0 else round((n_var / total) * 100, 1)


# ── Main pipeline ──────────────────────────────────────────────────────────────

def analyze_file(input_path: str) -> Dict:
    path = Path(input_path)
    raw  = path.read_text(encoding='utf-8', errors='replace')
    is_html = path.suffix.lower() in ('.html', '.htm')
    css     = extract_css_from_html(raw) if is_html else raw
    html    = raw if is_html else ''

    theming        = detect_theming_system(css, html)
    hardcoded_css  = find_hardcoded_colors(css, path.name)
    var_info       = find_variable_definitions(css, html)
    var_usages     = find_variable_usages(css)
    layout         = check_layout_issues(css)
    inline         = check_inline_styles(html)
    tw             = check_tailwind_classes(html) if html else {
                       'arbitrary_color_violations': [],
                       'unpaired_dark_variants': [],
                       'semantic_token_usage_count': 0,
                     }
    typography     = check_typography(css)
    motion         = check_motion(css)
    a11y           = check_accessibility(html, css)

    # Merge Tailwind arbitrary-value violations into the hardcoded list
    all_hardcoded  = hardcoded_css + tw['arbitrary_color_violations']
    compliance     = calculate_compliance(all_hardcoded, var_usages)
    unused_vars    = {k: v for k, v in var_info['root_variables'].items()
                     if k not in var_usages}

    return {
        'file': str(path),
        'theming_system': theming,
        'theme_compliance_score': compliance,
        'hardcoded_colors': all_hardcoded,
        'css_variables': var_info,
        'variable_usages': var_usages,
        'unused_variables': unused_vars,
        'layout_issues': layout,
        'inline_style_issues': inline,
        'tailwind': {
            'unpaired_dark_variants': tw['unpaired_dark_variants'],
            'semantic_token_usage_count': tw['semantic_token_usage_count'],
        },
        'typography_issues': typography,
        'motion': motion,
        'accessibility': a11y,
        'summary': {
            'total_hardcoded_colors':      len(all_hardcoded),
            'total_css_variables_defined': len(var_info['root_variables']),
            'total_css_variables_used':    len(var_usages),
            'unused_variables':            len(unused_vars),
            'dark_mode_method':            var_info['dark_mode_method'],
            'live_toggle_compatible':      var_info['live_toggle_compatible'],
            'missing_dark_overrides':      len(var_info['missing_dark_overrides']),
            'layout_warnings':             len(layout),
            'inline_style_violations':     len(inline),
            'tailwind_unpaired_dark':      len(tw['unpaired_dark_variants']),
            'typography_warnings':         len(typography),
            'images_missing_alt':          a11y['images_missing_alt'],
            'missing_focus_styles':        a11y['focus_style_issue'] is not None,
            'motion_without_reduced_pref': motion['issue'] is not None,
        },
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='UI Static Analyzer')
    parser.add_argument('--input',  required=True)
    parser.add_argument('--output', default=None)
    args = parser.parse_args()

    result = analyze_file(args.input)

    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, indent=2, ensure_ascii=False))
        s = result['summary']
        print(f'✅ Analysis → {args.output}')
        print(f'   Theming:       {result["theming_system"]}')
        print(f'   Compliance:    {result["theme_compliance_score"]}%')
        print(f'   Hardcoded:     {s["total_hardcoded_colors"]}')
        print(f'   Dark method:   {s["dark_mode_method"]}  live-toggle={s["live_toggle_compatible"]}')
        print(f'   Missing dark:  {s["missing_dark_overrides"]}')
        print(f'   Layout warns:  {s["layout_warnings"]}')
        print(f'   A11y:          missing-alt={s["images_missing_alt"]}  focus={not s["missing_focus_styles"]}')
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))
