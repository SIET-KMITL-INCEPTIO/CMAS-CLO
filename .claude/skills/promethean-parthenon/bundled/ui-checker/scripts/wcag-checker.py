#!/usr/bin/env python3
"""
ui-checker / scripts / wcag-checker.py

Checks color pair contrast ratios against WCAG 2.1 AA and AAA.

Usage:
  # Quick pair check
  python3 wcag-checker.py --colors "#0a0a0a" "#ffffff"
  python3 wcag-checker.py --colors "#555" "#fff" --large-text

  # Batch from static-analysis output
  python3 wcag-checker.py --input analysis.json --output wcag-report.json
"""

import json
import re
import argparse
from pathlib import Path
from typing import Tuple, Dict, List, Optional


# ── Color parsing ──────────────────────────────────────────────────────────────

def hex_to_rgb(h: str) -> Tuple[int, int, int]:
    h = h.lstrip('#')
    if len(h) == 3:   h = h[0]*2 + h[1]*2 + h[2]*2
    elif len(h) == 4: h = h[0]*2 + h[1]*2 + h[2]*2   # 4-digit: drop alpha
    elif len(h) == 8: h = h[:6]                        # 8-digit: drop alpha
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)

def rgb_str_to_rgb(s: str) -> Tuple[int, int, int]:
    nums = re.findall(r'[\d.]+', s)
    return int(float(nums[0])), int(float(nums[1])), int(float(nums[2]))

def parse_color(color: str) -> Optional[Tuple[int, int, int]]:
    color = color.strip()
    try:
        if color.startswith('#'):          return hex_to_rgb(color)
        if color.lower().startswith('rgb'): return rgb_str_to_rgb(color)
    except Exception:
        pass
    return None


# ── Luminance & ratio ──────────────────────────────────────────────────────────

def linearize(c: int) -> float:
    s = c / 255.0
    return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4

def relative_luminance(rgb: Tuple[int, int, int]) -> float:
    r, g, b = rgb
    return 0.2126*linearize(r) + 0.7152*linearize(g) + 0.0722*linearize(b)

def contrast_ratio(fg: str, bg: str) -> float:
    rgb1, rgb2 = parse_color(fg), parse_color(bg)
    if not rgb1 or not rgb2: return 0.0
    l1, l2 = relative_luminance(rgb1), relative_luminance(rgb2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return round((lighter + 0.05) / (darker + 0.05), 2)

def wcag_rating(ratio: float, large_text: bool = False, ui: bool = False) -> Dict:
    aa  = 3.0 if (large_text or ui) else 4.5
    aaa = 4.5 if (large_text or ui) else 7.0
    ctx = 'Large text / UI' if (large_text or ui) else 'Normal text'
    level = 'AAA' if ratio >= aaa else ('AA' if ratio >= aa else 'FAIL')
    return {
        'ratio': ratio, 'level': level,
        'passes_aa': ratio >= aa, 'passes_aaa': ratio >= aaa,
        'aa_threshold': aa, 'aaa_threshold': aaa,
        'context': ctx, 'passes_minimum': ratio >= aa,
        'gap_to_aa': max(0, round(aa - ratio, 2)),
    }

def suggest(fg: str, bg: str) -> str:
    r1, r2 = parse_color(fg), parse_color(bg)
    if not r1 or not r2: return 'Adjust one color to increase contrast.'
    l1, l2 = relative_luminance(r1), relative_luminance(r2)
    if l1 > l2: return f'Lighten {fg} or darken {bg}.'
    return f'Darken {fg} or lighten {bg}.'


# ── Batch from static-analysis JSON ───────────────────────────────────────────

def analyze_pairs(analysis: Dict) -> List[Dict]:
    hardcoded  = analysis.get('hardcoded_colors', [])
    root_vars  = analysis.get('css_variables', {}).get('root_variables', {})
    fg_colors, bg_colors = [], []

    for c in hardcoded:
        ctx = c.get('context', '')
        if ctx in ('color', 'fill', 'stroke'):             fg_colors.append(c['value'])
        elif ctx in ('background', 'background-color'):    bg_colors.append(c['value'])

    for name, val in root_vars.items():
        val = val.strip()
        if not (val.startswith('#') or val.startswith('rgb')): continue
        n = name.lower()
        if any(x in n for x in ('text','foreground','fg','label','heading')): fg_colors.append(val)
        elif any(x in n for x in ('bg','background','surface','card','page')): bg_colors.append(val)

    results, seen = [], set()
    for fg in fg_colors:
        for bg in bg_colors:
            key = tuple(sorted([fg, bg]))
            if key in seen: continue
            seen.add(key)
            ratio  = contrast_ratio(fg, bg)
            rating = wcag_rating(ratio)
            results.append({'foreground': fg, 'background': bg,
                            'suggestion': suggest(fg, bg) if not rating['passes_aa'] else None,
                            **rating})

    return sorted(results, key=lambda x: (x['passes_minimum'], x['ratio']))


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input',      help='Static-analysis JSON')
    parser.add_argument('--colors',     nargs=2, metavar=('FG', 'BG'))
    parser.add_argument('--large-text', action='store_true')
    parser.add_argument('--ui',         action='store_true')
    parser.add_argument('--output',     help='Output JSON path')
    args = parser.parse_args()

    if args.colors:
        fg, bg = args.colors
        ratio  = contrast_ratio(fg, bg)
        result = {'foreground': fg, 'background': bg,
                  **wcag_rating(ratio, large_text=args.large_text or args.ui),
                  'suggestion': suggest(fg, bg)}
        print(json.dumps(result, indent=2))

    elif args.input:
        with open(args.input) as f: analysis = json.load(f)
        pairs   = analyze_pairs(analysis)
        failing = [p for p in pairs if not p['passes_minimum']]
        output  = {
            'total_pairs_checked': len(pairs),
            'failing_aa':          len(failing),
            'passing_aa':          len(pairs) - len(failing),
            'color_pairs':         pairs,
            'failing':             failing,
        }
        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            Path(args.output).write_text(json.dumps(output, indent=2, ensure_ascii=False))
            print(f'✅ WCAG report → {args.output}  ({len(failing)}/{len(pairs)} fail AA)')
        else:
            print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        parser.print_help()
