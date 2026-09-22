#!/usr/bin/env python3
"""
ui-checker / scripts / generate-report.py

Combines static-analysis, WCAG, and layout JSON into a dark-themed HTML report.

Usage:
  python3 generate-report.py \
    --analysis /tmp/ui-checker/analysis.json \
    --wcag     /tmp/ui-checker/wcag-report.json \
    --output   /mnt/user-data/outputs/ui-check-report.html

  # --layout and --wcag are optional
"""

import json
import base64
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


def sw(color: str, size: int = 14) -> str:
    return (f'<span style="display:inline-block;width:{size}px;height:{size}px;'
            f'background:{color};border-radius:3px;border:1px solid #30363d;'
            f'vertical-align:middle;margin-right:5px"></span>')

def sev_badge(sev: str) -> str:
    c = {'error':'#f85149','warning':'#d29922','info':'#58a6ff'}.get(sev,'#888')
    i = {'error':'🔴','warning':'🟡','info':'🔵'}.get(sev,'⚪')
    return f'<span style="color:{c};font-weight:600">{i} {sev.title()}</span>'

def wcag_badge(level: str) -> str:
    c = {'AAA':'#3fb950','AA':'#3fb950','FAIL':'#f85149'}.get(level,'#888')
    return f'<span style="color:{c};font-weight:700">{level}</span>'

def score_color(s: float) -> str:
    return '#3fb950' if s >= 80 else ('#d29922' if s >= 50 else '#f85149')

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0d1117;color:#e6edf3;
     padding:2rem;max-width:1100px;margin:0 auto;line-height:1.55}
h1{font-size:1.5rem;font-weight:700;margin-bottom:.2rem}
.meta{color:#7d8590;font-size:.8rem;margin-bottom:2rem}
.tag{background:#21262d;color:#7d8590;padding:.15em .5em;border-radius:4px;font-size:.75rem;margin-left:.4rem}
h2{font-size:.85rem;font-weight:600;color:#7d8590;text-transform:uppercase;letter-spacing:.05em;
   margin:2.5rem 0 .8rem;border-bottom:1px solid #21262d;padding-bottom:.4rem}
.scorecard{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.6rem;margin-bottom:1.5rem}
.sc{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:.9rem;text-align:center}
.sc-val{font-size:1.6rem;font-weight:700;margin-bottom:.2rem}
.sc-lbl{font-size:.68rem;color:#7d8590;text-transform:uppercase;letter-spacing:.04em}
table{width:100%;border-collapse:collapse;background:#161b22;border:1px solid #21262d;
      border-radius:8px;overflow:hidden;margin-bottom:1.5rem;font-size:.8rem}
th{background:#21262d;padding:.55rem 1rem;text-align:left;font-size:.68rem;color:#7d8590;
   text-transform:uppercase;letter-spacing:.04em}
td{padding:.55rem 1rem;border-top:1px solid #21262d;vertical-align:top}
.fail-row{background:rgba(248,81,73,.06)}
code{background:#21262d;padding:.1em .3em;border-radius:3px;font-size:.78em;font-family:monospace}
.fix{color:#3fb950}
.muted{color:#7d8590;font-size:.78rem}
.pass{color:#3fb950;font-size:.85rem}
.screenshot-row{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}
.screenshot-row figure{flex:1;min-width:260px}
.screenshot-row figcaption{font-size:.72rem;color:#7d8590;margin-bottom:.3rem}
.screenshot-row img{width:100%;border:1px solid #21262d;border-radius:6px}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}
"""

def scorecard_html(a: Dict) -> str:
    s  = a.get('summary', {})
    sc = a.get('theme_compliance_score', 0)
    dm = s.get('dark_mode_method','none')
    dm_color = '#3fb950' if dm != 'none' else '#f85149'
    lt = s.get('live_toggle_compatible', False)

    cards = [
        (f'<span style="color:{score_color(sc)};font-size:2rem;font-weight:800">{sc}%</span>', 'Theme Score'),
        (f'<span style="color:#f85149">{s.get("total_hardcoded_colors",0)}</span>', 'Hardcoded Colors'),
        (f'<span style="color:#3b82f6">{s.get("total_css_variables_defined",0)}</span>', 'CSS Variables'),
        (f'<span style="color:{dm_color}">{dm}</span>', 'Dark Mode'),
        (f'<span style="color:{"#3fb950" if lt else "#f85149"}">{"✓ Yes" if lt else "✗ No"}</span>', 'Toggle-able'),
        (f'<span style="color:#d29922">{s.get("missing_dark_overrides",0)}</span>', 'Missing Dark'),
        (f'<span style="color:#d29922">{s.get("layout_warnings",0)}</span>', 'Layout Warns'),
        (f'<span style="color:#f85149">{s.get("inline_style_violations",0)}</span>', 'Inline Styles'),
        (f'<span style="color:#d29922">{s.get("tailwind_unpaired_dark",0)}</span>', 'TW Unpaired'),
        (f'<span style="color:#7d8590">{s.get("typography_warnings",0)}</span>', 'px Font Sizes'),
        (f'<span style="color:#f85149">{s.get("images_missing_alt",0)}</span>', 'Missing Alt'),
    ]
    html = '<div class="scorecard">'
    for val, label in cards:
        html += f'<div class="sc"><div class="sc-val">{val}</div><div class="sc-lbl">{label}</div></div>'
    html += '</div>'
    return html

def hardcoded_table(items: List[Dict]) -> str:
    if not items:
        return '<p class="pass">✅ No hardcoded colors found.</p>'
    rows = ''
    for c in items:
        val = c['value']
        swatch = sw(val) if val.startswith('#') or val.startswith('rgb') else ''
        fix = f'var(--{c.get("context","x").replace("-","_")})'
        rows += (f'<tr><td>{swatch}<code>{val}</code></td>'
                 f'<td>{sev_badge(c.get("severity","error"))}</td>'
                 f'<td><code>{c.get("context","—")}</code></td>'
                 f'<td>L{c.get("line","?")}</td>'
                 f'<td class="muted">{c.get("line_content","")[:70]}</td>'
                 f'<td><code class="fix">{fix}</code></td></tr>')
    return f'<table><thead><tr><th>Value</th><th>Severity</th><th>Property</th><th>Line</th><th>Snippet</th><th>Fix</th></tr></thead><tbody>{rows}</tbody></table>'

def dark_overrides_table(missing: Dict) -> str:
    if not missing:
        return '<p class="pass">✅ All CSS variables have dark-mode overrides.</p>'
    rows = ''
    for var, val in list(missing.items())[:60]:
        swatch = sw(val) if val.startswith('#') or val.startswith('rgb') else ''
        rows += (f'<tr><td><code>{var}</code></td>'
                 f'<td>{swatch}<code>{val[:50]}</code></td>'
                 f'<td class="muted">Add <code class="fix">{var}: &lt;dark-value&gt;</code> inside <code>.dark {"{}"}</code></td></tr>')
    return f'<table><thead><tr><th>Variable</th><th>Light Value</th><th>Action</th></tr></thead><tbody>{rows}</tbody></table>'

def wcag_table(wcag: Optional[Dict]) -> str:
    if not wcag or not wcag.get('color_pairs'):
        return '<p class="muted">Run wcag-checker.py to generate contrast data.</p>'
    pairs = wcag['color_pairs']
    total, fail = wcag.get('total_pairs_checked', len(pairs)), wcag.get('failing_aa', 0)
    rows = ''
    for p in pairs:
        rows += (f'<tr class="{"fail-row" if not p["passes_aa"] else ""}">'
                 f'<td>{sw(p["foreground"])}<code>{p["foreground"]}</code></td>'
                 f'<td>{sw(p["background"])}<code>{p["background"]}</code></td>'
                 f'<td><strong>{p["ratio"]}</strong></td>'
                 f'<td>{wcag_badge(p["level"])}</td>'
                 f'<td class="muted">{p.get("suggestion") or ""}</td></tr>')
    return (f'<p class="muted" style="margin-bottom:.6rem">{total} pairs · '
            f'<span style="color:#f85149">{fail} fail AA</span> · '
            f'<span style="color:#3fb950">{total-fail} pass</span></p>'
            f'<table><thead><tr><th>FG</th><th>BG</th><th>Ratio</th><th>Level</th><th>Fix</th></tr></thead>'
            f'<tbody>{rows}</tbody></table>')

def layout_table(issues: List[Dict]) -> str:
    if not issues:
        return '<p class="pass">✅ No critical layout issues.</p>'
    rows = ''
    for i in issues:
        rows += (f'<tr><td>{sev_badge(i.get("severity","info"))}</td>'
                 f'<td>{i["type"].replace("_"," ").title()}</td>'
                 f'<td><code>{i.get("value","")}</code></td>'
                 f'<td>L{i.get("line","?")}</td>'
                 f'<td class="muted">{i.get("suggestion","")}</td></tr>')
    return f'<table><thead><tr><th>Severity</th><th>Type</th><th>Value</th><th>Line</th><th>Fix</th></tr></thead><tbody>{rows}</tbody></table>'

def screenshots_html(layout: Optional[Dict]) -> str:
    if not layout or not layout.get('viewports'):
        return '<p class="muted">No screenshots (Playwright not run).</p>'
    html = ''
    for vp, data in layout.get('viewports', {}).items():
        shots = data.get('screenshots', {})
        def img(path):
            try:
                d = Path(path).read_bytes()
                return 'data:image/png;base64,' + base64.b64encode(d).decode()
            except Exception:
                return ''
        html += f'<h3 style="font-size:.85rem;color:#7d8590;margin:1rem 0 .4rem">📐 {vp}</h3><div class="screenshot-row">'
        if shots.get('light'):
            src = img(shots['light'])
            if src: html += f'<figure><figcaption>☀️ Light</figcaption><img src="{src}"></figure>'
        if shots.get('dark'):
            src = img(shots['dark'])
            if src: html += f'<figure><figcaption>🌙 Dark</figcaption><img src="{src}"></figure>'
        html += '</div>'
    return html


def generate(analysis: Dict, wcag: Optional[Dict], layout: Optional[Dict]) -> str:
    sc    = analysis.get('theme_compliance_score', 0)
    fname = Path(analysis.get('file', 'unknown')).name
    ts    = analysis.get('theming_system', 'unknown')
    gen   = datetime.now().strftime('%Y-%m-%d %H:%M')

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UI Check — {fname}</title>
<style>{CSS}</style></head><body>
<h1>🔍 UI Inspector Report <span class="tag">{ts}</span></h1>
<p class="meta">Generated {gen} · {fname}</p>
<h2>📊 Scorecard</h2>{scorecard_html(analysis)}
<h2>🎨 Hardcoded Colors</h2>{hardcoded_table(analysis.get('hardcoded_colors',[]))}
<h2>🌙 Missing Dark Overrides</h2>{dark_overrides_table(analysis.get('css_variables',{}).get('missing_dark_overrides',{}))}
<h2>♿ WCAG Contrast</h2>{wcag_table(wcag)}
<h2>📐 Layout Issues</h2>{layout_table(analysis.get('layout_issues',[]))}
<h2>⚠️ Inline Style Violations</h2>{layout_table(analysis.get('inline_style_issues',[]))}
<h2>🖥️ Screenshots</h2>{screenshots_html(layout)}
</body></html>"""


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--analysis', required=True)
    parser.add_argument('--wcag',     default=None)
    parser.add_argument('--layout',   default=None)
    parser.add_argument('--output',   required=True)
    args = parser.parse_args()

    def load(p):
        if p and Path(p).exists():
            return json.loads(Path(p).read_text())
        return None

    html = generate(load(args.analysis), load(args.wcag), load(args.layout))
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(html, encoding='utf-8')
    print(f'✅ Report → {args.output}')
