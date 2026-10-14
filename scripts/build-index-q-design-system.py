# -*- coding: utf-8 -*-
"""index-q.html's design tokens as one engineering reference page.

   Output: docs/pages/index-q-design-system.html

   Every value on the page is READ from docs/pages/index-q.html at build time:
     tailwind.config colors + borderRadius   the utility palette (bg-peri, text-ink …)
     the first :root block                   CSS variables (--ink, --sel, --shadow-card …)
     html[data-density=…]                    the three row heights
     const TONE / const PAL                  status tones and the named chart colours
     text-[Npx] / font-size:Npx              the type sizes actually in use
   Nothing is typed in by hand, so the page cannot drift from the prototype: re-run
   the script after any colour change and the page follows.

   It also reports what a reviewer would otherwise check by eye:
     * how often each token is used in index-q.html
     * contrast against its own background for every text token (WCAG 2.x)
     * one hex value living under several names
     * the same name holding different values in two places (tailwind vs :root vs PAL vs TONE)

     python scripts/build-index-q-design-system.py
"""
import html
import io
import re
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'docs' / 'pages' / 'index-q.html'
OUT = ROOT / 'docs' / 'pages' / 'index-q-design-system.html'

src = io.open(SRC, encoding='utf-8').read()
HEX = r"#[0-9A-Fa-f]{6}"


def block(start, opener='{', closer='}'):
    """The text between the bracket that follows `start` and its partner."""
    i = src.index(opener, src.index(start))
    depth, j = 0, i
    while True:
        if src[j] == opener:
            depth += 1
        elif src[j] == closer:
            depth -= 1
            if depth == 0:
                return src[i + 1:j]
        j += 1


def strip_comments(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


# ── read ─────────────────────────────────────────────────────────────
tw_colors = dict(re.findall(r"(\w+):'(%s)'" % HEX, block('colors:')))
tw_radius = dict(re.findall(r"'?(\w+)'?:'(\d+px)'", block('borderRadius:')))
root_vars = {k: v.strip() for k, v in re.findall(r'--([\w-]+)\s*:\s*([^;]+);', strip_comments(block(':root')))}
density = dict(re.findall(r'html\[data-density="(\w+)"\]\s*\{\s*--row-py:\s*(\d+px)', src))
TONE = {k: dict(re.findall(r"(\w+):'(%s)'" % HEX, body))
        for k, body in re.findall(r'(\w+)\s*:\s*\{([^}]*)\}', block('const TONE ='))}
pal_src = block('const PAL =')
PAL = dict(re.findall(r"(\w+):'(%s)'" % HEX, pal_src))
PAL_LISTS = {k: re.findall(HEX, body) for k, body in re.findall(r'(\w+):\[([^\]]*)\]', pal_src)}
fonts = [f.replace('+', ' ') for f in re.findall(r'family=([A-Za-z+]+):', src[:3000])]
sizes = {}
for m in re.findall(r'text-\[([\d.]+)px\]', src) + re.findall(r'font-size:\s*([\d.]+)px', src):
    sizes[float(m)] = sizes.get(float(m), 0) + 1


# ── measure ──────────────────────────────────────────────────────────
def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    x, y = sorted((lum(a), lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


def grade(r):
    return 'AAA' if r >= 7 else 'AA' if r >= 4.5 else 'AA-large' if r >= 3 else 'fail'


UTIL = r'(?:bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|decoration|accent|caret)'


def used_tw(name):
    return len(re.findall(r'\b%s-%s(?![\w-])' % (UTIL, re.escape(name)), src))


def used_var(name):
    return len(re.findall(r'var\(--%s\)' % re.escape(name), src))


def used_pal(name):
    return len(re.findall(r'\bPAL\.%s\b' % re.escape(name), src))


def used_tone(name):
    """TONE.x references plus the places that pass the tone by name: chip('…','x') · tone result 'x'."""
    return len(re.findall(r'\bTONE\.%s\b' % re.escape(name), src)) + \
        len(re.findall(r"""['"]%s['"]\s*\)""" % re.escape(name), src))


def title(name):
    words = re.sub(r'([a-z])([A-Z0-9])', r'\1 \2', name).replace('-', ' ').split()
    return ' '.join(w[:1].upper() + w[1:] for w in words)


# ── groups ───────────────────────────────────────────────────────────
CORE = ['peri', 'cool', 'haze', 'mid', 'char']
SUB = ['fgray', 'csub', 'mount', 'ev1', 'ev2']
SURF = ['card', 'wash', 'field', 'tint', 'edge', 'edge2']
INK = ['ink', 'ink2', 'dim', 'faint']


def tw_rows(names):
    # a name that also lives in :root is used two ways: bg-edge2 and var(--edge2)
    return [(title(n), '--color-%s' % n, tw_colors[n], used_tw(n) + (used_var(n) if n in root_vars else 0))
            for n in names if n in tw_colors]


core = tw_rows(CORE)
sub = tw_rows(SUB)
surf = tw_rows(SURF) + [('Sel Bg', '--sel-bg', root_vars['sel-bg'], used_var('sel-bg'))] + \
    [(title(k), 'PAL.%s' % k, PAL[k], used_pal(k)) for k in ('head', 'pend', 'blank') if k in PAL]
text_rows = [(title(n), '--color-%s' % n, tw_colors[n], used_tw(n) + used_var(n)) for n in INK] + \
    [('Ink Soft', '--ink-soft', root_vars['ink-soft'], used_var('ink-soft'))] + \
    [(title(k), '--%s' % k, root_vars[k], used_var(k)) for k in ('sel', 'focus')]
chart_rows = [(title(k), 'PAL.%s' % k, PAL[k], used_pal(k)) for k in ('avg', 'avatarA', 'avatarB', 'noteBg', 'noteTx') if k in PAL]

# one hex under several names
names_of = {}
for n, h in tw_colors.items():
    names_of.setdefault(h.upper(), []).append(n)
for n, v in root_vars.items():
    if re.fullmatch(HEX, v):
        names_of.setdefault(v.upper(), []).append('--' + n)
for n, h in PAL.items():
    names_of.setdefault(h.upper(), []).append('PAL.' + n)
for t, d in TONE.items():
    for part, h in d.items():
        names_of.setdefault(h.upper(), []).append('TONE.%s.%s' % (t, part))
dupes = sorted(((h, ns) for h, ns in names_of.items() if len(ns) > 1), key=lambda x: (-len(x[1]), x[0]))

# same name, different value
drift = []
for n in sorted(set(tw_colors) & set(root_vars)):
    if tw_colors[n].upper() != root_vars[n].upper():
        drift.append((n, 'tailwind %s' % tw_colors[n], ':root %s' % root_vars[n]))
for n in sorted(set(PAL) & set(tw_colors)):
    if PAL[n].upper() != tw_colors[n].upper():
        drift.append((n, 'PAL %s' % PAL[n], 'tailwind %s' % tw_colors[n]))
for n in sorted(set(PAL) & set(root_vars)):
    if re.fullmatch(HEX, root_vars[n]) and PAL[n].upper() != root_vars[n].upper():
        drift.append((n, 'PAL %s' % PAL[n], ':root %s' % root_vars[n]))
for t in ('ok', 'warn', 'bad', 'info'):
    if t in TONE:
        for part, tw in (('tx', t), ('bg', t + 'Bg')):
            if tw in tw_colors and TONE[t][part].upper() != tw_colors[tw].upper():
                drift.append(('%s.%s' % (t, part), 'TONE %s' % TONE[t][part], 'tailwind %s %s' % (tw, tw_colors[tw])))


# ── render ───────────────────────────────────────────────────────────
E = html.escape
CSS = """
:root{--bg:#EEEFF8;--panel:#F7F7FC;--ink:#1E233C;--ink2:#4A5070;--dim:#6B7192;--line:#DCDEEC;
  --mono:ui-monospace,'Cascadia Mono',Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#13172B;--panel:#1B2036;--ink:#E9EBF5;--ink2:#C8CDEB;--dim:#9AA0BE;--line:#2E3558}}
:root[data-theme="dark"]{--bg:#13172B;--panel:#1B2036;--ink:#E9EBF5;--ink2:#C8CDEB;--dim:#9AA0BE;--line:#2E3558}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'IBM Plex Sans Thai','Inter',system-ui,sans-serif;font-size:14px;line-height:1.5}
main{max-width:1240px;margin:0 auto;padding:40px 16px 80px}
h1{font-size:28px;font-weight:600;margin:0 0 10px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.lede{color:var(--ink2);margin:0 0 6px;font-size:15px}
.meta{color:var(--dim);font-size:12.5px;margin:0 0 36px}
section{margin:0 0 48px}
.sh{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;padding-bottom:10px;border-bottom:1px solid var(--line);margin-bottom:16px}
.sh b{font-size:12px;letter-spacing:.16em;font-weight:600}
.sh span{color:var(--dim);font-size:12.5px}
.ramp{display:flex;height:48px;border-radius:6px;overflow:hidden;margin-bottom:18px;box-shadow:inset 0 0 0 1px rgba(30,35,60,.06)}
.ramp div{flex:1}
.cap{color:var(--dim);font-size:12.5px;margin:-10px 0 16px}
.row{display:grid;grid-template-columns:18px minmax(120px,1fr) minmax(0,auto) 64px 48px;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid var(--line)}
.row:last-child{border-bottom:0}
.sw{width:16px;height:16px;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(30,35,60,.18);display:inline-block}
.mono{font-family:var(--mono);font-size:12px;color:var(--ink2)}
.r{text-align:right}
.use{color:var(--dim);font-size:12px;text-align:right}
.paper{background:#fff;padding:2px 10px;border-radius:5px;box-shadow:inset 0 0 0 1px rgba(30,35,60,.12)}
.use.zero{color:#A2504F}
.tag{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;margin-left:8px;vertical-align:1px;font-family:var(--mono)}
.AAA,.AA{background:#E7EFEA;color:#3E6553}.AA-large{background:#F4EEE1;color:#6A5528}.fail{background:#F4E8E8;color:#8C4241}
.tones{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.tone{border-radius:10px;padding:14px;border:1px solid var(--line);background:var(--panel)}
.tone .chip{border-radius:8px;padding:8px 12px;font-size:14px;margin-bottom:10px}
.tone .bar{height:6px;border-radius:3px;margin-bottom:10px}
.kv{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;font-size:12px}
.boxes{display:flex;flex-wrap:wrap;gap:16px}
.box{background:#fff;border:1px solid #DCDEEC;width:150px;height:84px;display:flex;align-items:flex-end;padding:10px;color:#4A5070}
.sample{display:grid;grid-template-columns:72px 1fr 48px;align-items:baseline;gap:12px;padding:6px 0;border-bottom:1px solid var(--line)}
.checks{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 16px}
.checks div{padding:4px 0;font-size:13px}
@media (max-width:640px){.row{grid-template-columns:18px 1fr 64px}.row .tok,.row .use{display:none}}
"""


def swatch_rows(rows, rate=False):
    out = []
    for name, var, hexv, n in rows:
        label = E(name)
        if rate:
            r = contrast(hexv, '#FFFFFF')
            # the ratio is measured on white, so the sample sits on white whatever the page theme is
            label = '<span class="paper" style="color:%s">%s</span><span class="tag %s">%.2f:1 · %s</span>' % (hexv, label, grade(r), r, grade(r))
        out.append('<div class="row"><span class="sw" style="background:%s"></span><div>%s</div>'
                   '<div class="mono r tok">%s</div><div class="mono r">%s</div>'
                   '<div class="use%s" title="จำนวนครั้งที่ใช้ใน index-q.html">×%d</div></div>'
                   % (hexv, label, E(var), hexv.lower(), ' zero' if n == 0 else '', n))
    return ''.join(out)


def ramp(values, sort=True):
    vals = sorted(values, key=lambda h: -lum(h)) if sort else list(values)
    return '<div class="ramp">%s</div>' % ''.join('<div style="background:%s" title="%s"></div>' % (v, v) for v in vals)


def section(label, note, body):
    return '<section><div class="sh"><b>%s</b><span>%s</span></div>%s</section>' % (E(label), E(note), body)


parts = [
    section('CORE RAMP', '%d steps · Periwinkle → Charcoal · โครงสีของ UI ตัวอักษร และพื้น' % len(core),
            ramp([r[2] for r in core]) + swatch_rows(core)),
    section('SUB-PALETTE', 'สีรอง · กราฟ ระดับ Bloom/SOLO และงานตกแต่งเท่านั้น ไม่ใช้กับปุ่ม ตัวอักษร หรือเส้นขอบ',
            ramp([r[2] for r in sub]) + swatch_rows(sub)),
    section('SURFACES & LINES', 'พื้นและเส้นแบ่ง · แถบเรียงจากสว่างไปเข้ม', ramp([r[2] for r in surf]) + swatch_rows(surf)),
    section('TEXT & FOCUS', 'สีตัวอักษรเทียบกับพื้นขาว · WCAG 2.x: ตัวอักษรปกติต้องได้ 4.5:1 (AA) ตัวใหญ่ 3:1',
            swatch_rows(text_rows, rate=True)),
]

cards = ''
for t, d in TONE.items():
    r = contrast(d['tx'], d['bg'])
    cards += ('<div class="tone"><div class="chip" style="background:%s;color:%s">TONE.%s · ข้อความตัวอย่าง</div>'
              '<div class="bar" style="background:%s"></div><div class="kv">'
              '<span class="mono">bg</span><span class="mono">%s</span>'
              '<span class="mono">tx</span><span class="mono">%s<span class="tag %s">%.2f:1 · %s</span></span>'
              '<span class="mono">bar</span><span class="mono">%s</span>'
              '<span class="mono">ใช้</span><span class="mono">×%d</span></div></div>'
              % (d['bg'], d['tx'], t, d['bar'], d['bg'].lower(), d['tx'].lower(), grade(r), r, grade(r),
                 d['bar'].lower(), used_tone(t)))
parts.append(section('STATUS TONES', 'const TONE · ทุกสถานะในแอปมาจากที่นี่ · ตัวเลขคือ contrast ของ tx บนพื้น bg',
                     '<div class="tones">%s</div>' % cards))

chart = ''
for key, cap in (('bloom', 'PAL.bloom · ระดับ Bloom L1 → L6'), ('solo', 'PAL.solo · ระดับ SOLO')):
    if PAL_LISTS.get(key):
        chart += ramp(PAL_LISTS[key], sort=False) + '<div class="cap">%s · ×%d</div>' % (cap, used_pal(key))
parts.append(section('DATA & CHART', 'const PAL · สีที่มีชื่อซึ่งไม่ใช่สถานะ', chart + swatch_rows(chart_rows)))

parts.append(section('RADIUS', 'tailwind.config borderRadius', '<div class="boxes">%s</div>' % ''.join(
    '<div class="box" style="border-radius:%s"><span class="mono">rounded%s · %s</span></div>'
    % (v, '' if k == 'DEFAULT' else '-' + k, v) for k, v in tw_radius.items())))

parts.append(section('ELEVATION', ':root --shadow-* · การ์ด เมนูลอย และหน้าต่าง', '<div class="boxes">%s</div>' % ''.join(
    '<div class="box" style="border:0;border-radius:14px;box-shadow:%s"><span class="mono">--%s</span></div>'
    % (E(v), k) for k, v in root_vars.items() if k.startswith('shadow'))))

parts.append(section('TYPE', '%s · ขนาดที่ใช้จริงในไฟล์ เรียงจากใหญ่ไปเล็ก' % ' + '.join(fonts), ''.join(
    '<div class="sample"><span class="mono">%gpx</span><span style="font-size:%gpx">ผลลัพธ์การเรียนรู้ CLO 2 · ผ่าน 68%%</span>'
    '<span class="use">×%d</span></div>' % (s, s, n) for s, n in sorted(sizes.items(), key=lambda kv: -kv[0]))))

parts.append(section('DENSITY', 'ความสูงแถวของตาราง · เลือกได้จากเมนูเลย์เอาต์', ''.join(
    '<div class="sample"><span class="mono">%s</span><span class="mono">--row-py: %s</span><span></span></div>' % (k, v)
    for k, v in density.items())))

checks = ''.join('<div>⚠ <b>%s</b> — %s แต่ %s</div>' % (E(n), E(a), E(b)) for n, a, b in drift) or \
    '<div>✓ ชื่อเดียวกันมีค่าเดียวกันทุกที่ (tailwind · :root · PAL · TONE)</div>'
checks += ''.join('<div><span class="sw" style="vertical-align:-3px;margin-right:8px;background:%s"></span>'
                  '<span class="mono">%s</span> มี %d ชื่อ: <span class="mono">%s</span></div>'
                  % (h, h.lower(), len(ns), E(' · '.join(ns))) for h, ns in dupes)
unused = [r[0] for r in core + sub + surf + text_rows + chart_rows if r[3] == 0]
if unused:
    checks += '<div>○ ประกาศไว้แต่ไม่ถูกใช้: %s</div>' % E(', '.join(unused))
parts.append(section('CHECKS', 'สิ่งที่ผู้ตรวจต้องดูด้วยตา · สคริปต์ตรวจให้ทุกครั้งที่สร้างหน้า', '<div class="checks">%s</div>' % checks))

page = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Index-q Design System</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap" rel="stylesheet">
<!-- GENERATED by scripts/build-index-q-design-system.py from docs/pages/index-q.html. Do not edit by hand. -->
<style>%s</style>
</head>
<body>
<main>
<h1>Design System</h1>
<p class="lede">Nocturnal Atelier v3.2 (light field) — โทเคนที่ <span class="mono">index-q.html</span> ใช้จริง อ่านจากไฟล์ต้นแบบโดยตรง</p>
<p class="meta">แหล่ง: tailwind.config · :root · const TONE · const PAL · ×N คือจำนวนครั้งที่ใช้ในต้นแบบ · สร้างใหม่: <span class="mono">python scripts/build-index-q-design-system.py</span></p>
%s
</main>
</body>
</html>
""" % (CSS, '\n'.join(parts))

io.open(OUT, 'w', encoding='utf-8', newline='\n').write(page)
print('เขียน %s — สี %d · โทนสถานะ %d · ขนาดตัวอักษร %d · ค่าเดียวหลายชื่อ %d · ชื่อเดียวค่าไม่ตรง %d · ไม่ถูกใช้ %d'
      % (OUT.relative_to(ROOT), len(core) + len(sub) + len(surf) + len(text_rows) + len(chart_rows),
         len(TONE), len(sizes), len(dupes), len(drift), len(unused)))
