#!/usr/bin/env python3
"""เติมหน้าบทบาท (ผู้สอน · ผู้ดูแลระบบ) ใน docs/diagrams/usecase/usecase-diagram.drawio

ตามกฎ skill drawio-diagrams: ฟอนต์ IBM Plex Sans Thai 16px · เส้น 2px · ขาว-ดำ ·
กรอบมีชื่อทุกชั้น · วงรี use case ≤9 ต่อกรอบ (แยกกรอบตามแพ็กเกจ) · เส้นประเฉพาะ «include» / «extend»

ที่มา: หน้า overview ของไฟล์เดียวกัน (ชื่อ use case และความสัมพันธ์) — หน้าอื่นไม่ถูกแตะ
แก้ที่นี่แล้วรันใหม่:  python scripts/build-usecase-roles-drawio.py
"""
import html
import io
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / 'docs' / 'diagrams' / 'usecase' / 'usecase-diagram.drawio'
src = io.open(FILE, encoding='utf-8').read()

# ── ชื่อ use case / แพ็กเกจ จากหน้า overview ────────────────────────────
ov = re.search(r'<diagram id="[^"]*" name="overview">(.*?)</diagram>', src, re.S)[1]
UC, PKG = {}, {}
for m in re.finditer(r'<mxCell [^>]*?value="([^"]*)"[^>]*?vertex="1"', ov):
    t = ' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', html.unescape(m[1]))).split())
    if re.match(r'^\d\.\d ', t):
        UC[t[:3]] = t[4:]
    elif re.match(r'^\d · ', t):
        PKG[t[0]] = t[4:]
UC.setdefault('2.9', 'ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่')     # เพิ่ม 2569-11-07 (K1) ยังไม่อยู่ใน overview
for need in ('1.1', '2.1', '5.1', '9.1'):
    assert need in UC, 'overview ไม่มี use case ' + need

# ── ความสัมพันธ์ (ตาม overview): (ฐาน, ลูก, 'include'|'extend')  include ฐาน→ลูก · extend ลูก→ฐาน
REL = [('1.1', '1.4', 'include'), ('2.1', '2.4', 'include'), ('3.1', '3.3', 'include'),
       ('4.1', '4.2', 'include'), ('4.2', '4.3', 'include'), ('4.1', '4.4', 'include'),
       ('5.1', '5.2', 'include'), ('5.1', '5.3', 'include'), ('5.3', '5.6', 'include'),
       ('5.1', '5.4', 'extend'), ('5.4', '5.7', 'extend'), ('5.1', '5.5', 'extend'),
       ('6.1', '6.3', 'include'), ('6.1', '6.5', 'extend'),
       ('7.1', '7.3', 'include'), ('7.1', '7.5', 'extend'), ('8.2', '8.3', 'extend')]
ROLES = [
    ('ผู้สอน', 'ผู้สอน', 'ผู้สอนทำอะไรได้ในรายวิชาของตน',
     ['2.1', '2.2', '2.3', '2.5', '2.6', '2.8', '2.9', '3.1', '3.2', '3.5', '4.1', '4.5', '4.6', '5.1',
      '6.1', '6.2', '6.4', '6.6', '7.1', '7.2', '7.4', '7.6', '8.1', '8.2', '9.1', '9.2']),
    ('ผู้ดูแลระบบ', 'ผู้ดูแลระบบ', 'ผู้ดูแลระบบทำอะไรได้',
     ['1.1', '1.2', '1.3', '1.5', '1.6', '1.7', '2.1', '2.3', '9.1', '9.2']),
]

FONT = ('fontFamily=IBM Plex Sans Thai;fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DIBM%2BPlex%2BSans%2BThai;'
        'fontSize=16;fontColor=#000000;')
BOX = 'html=1;whiteSpace=wrap;rounded=0;strokeWidth=2;strokeColor=#000000;fillColor=#FFFFFF;' + FONT
FRAME = ('html=1;whiteSpace=wrap;rounded=0;strokeWidth=2;strokeColor=#000000;fillColor=none;verticalAlign=top;align=left;'
         'spacingLeft=12;spacingTop=8;fontStyle=1;' + FONT)
ACTOR = ('shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;rounded=0;strokeWidth=2;strokeColor=#000000;'
         'fillColor=#FFFFFF;' + FONT)
TEXT = 'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;' + FONT
ASSOC = ('edgeStyle=orthogonalEdgeStyle;html=1;rounded=0;strokeWidth=2;strokeColor=#000000;endArrow=none;'
         'labelBackgroundColor=#FFFFFF;' + FONT)
DEP = ('edgeStyle=orthogonalEdgeStyle;html=1;rounded=0;strokeWidth=2;strokeColor=#000000;dashed=1;endArrow=open;endFill=0;'
       'labelBackgroundColor=#FFFFFF;' + FONT)
EW, EH, PITCH, COLP = 320, 80, 140, 460      # วงรี · ระยะแถว · ระยะคอลัมน์ (ช่องว่าง 140 พอสำหรับป้าย «include»)


def build_page(pid, name, role_th, title, direct):
    cells, frames, n = [], [], [0]

    def nid():
        n[0] += 1
        return '%s-%d' % (pid, n[0])

    def vertex(bucket, value, style, x, y, w, h):
        assert all(v % 10 == 0 for v in (x, y, w, h)), (value, x, y, w, h)
        i = nid()
        bucket.append('<mxCell id="%s" value="%s" style="%s" parent="1" vertex="1"><mxGeometry x="%d" y="%d" width="%d" '
                      'height="%d" as="geometry"/></mxCell>' % (i, escape(value, {'"': '&quot;'}), style, x, y, w, h))
        return i

    def edge(a, b, style, label, ox, ix):
        cells.append('<mxCell id="%s" value="%s" style="%s exitX=%g;exitY=0.5;exitDx=0;exitDy=0;entryX=%g;entryY=0.5;'
                     'entryDx=0;entryDy=0;" parent="1" source="%s" target="%s" edge="1"><mxGeometry relative="1" '
                     'as="geometry"/></mxCell>' % (nid(), escape(label), style, ox, ix, a, b))

    kids = {}
    for base, kid, rel in REL:
        kids.setdefault(base, []).append((kid, rel))
    # ลูกของ use case ที่ผู้ใช้ทำเองเท่านั้น
    wanted = set(direct)
    pkgs = sorted({u[0] for u in direct})
    y = 140
    X0 = 360
    plan, assoc_ids = [], []
    for p in pkgs:
        roots = [u for u in direct if u[0] == p]
        pos, row = {}, [0]

        def place(u, depth):
            ch = [k for k, _ in kids.get(u, [])]
            if not ch:
                pos[u] = (depth, float(row[0]))
                row[0] += 1
                return
            for c in ch:
                place(c, depth + 1)
            pos[u] = (depth, sum(pos[c][1] for c in ch) / len(ch))
        for r in roots:
            place(r, 0)
        ncol = max(d for d, _ in pos.values()) + 1
        nrow = row[0]
        fw = 40 + EW + (ncol - 1) * COLP + 40
        fh = 60 + (nrow - 1) * PITCH + EH + 40
        plan.append((p, y, fw, fh, pos, roots))
        y += fh + 60
    bottom = y - 60
    ay = 40 + (bottom - 40) // 2
    ay = -(-ay // 10) * 10
    # กรอบหน้า (ชื่อไดอะแกรม) ต้องวาดก่อน
    maxw = max(fw for _, _, fw, _, _, _ in plan)
    frames.append(None)       # ที่ว่างของกรอบหน้า
    ids = {}
    for p, py, fw, fh, pos, roots in plan:
        vertex(frames, '%s · %s' % (p, PKG[p]), FRAME, X0, py, fw, fh)
        for u, (d, r) in pos.items():
            ey = py + 60 + int(round(r * PITCH / 10.0)) * 10
            ids[u] = vertex(cells, '%s %s' % (u, UC[u]), 'ellipse;' + BOX, X0 + 40 + d * COLP, ey, EW, EH)
    actor = vertex(cells, role_th, ACTOR, 120, ay, 60, 100)
    for u in direct:
        edge(actor, ids[u], ASSOC, '', 1, 0)
    for base, kid, rel in REL:
        if base in ids and kid in ids:
            if rel == 'include':
                edge(ids[base], ids[kid], DEP, '«include»', 1, 0)
            else:
                edge(ids[kid], ids[base], DEP, '«extend»', 0, 1)
    cap = vertex(cells, 'เส้นทึบ = ผู้ใช้ทำเอง · «include» = ทำร่วมกันเสมอ · «extend» = ทำเพิ่มเมื่อจำเป็น',
                 TEXT, 80, 90, 1000, 30)
    fw_page = X0 + maxw + 40 - 40
    pf = ('<mxCell id="%s" value="%s" style="%s" parent="1" vertex="1"><mxGeometry x="40" y="40" width="%d" height="%d" '
          'as="geometry"/></mxCell>' % (nid(), escape(title), FRAME, fw_page, bottom + 40 - 40))
    frames[0] = pf
    pw, ph = 40 + fw_page + 40, 40 + bottom + 40
    return ('<diagram id="%s" name="%s"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" '
            'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" background="#FFFFFF" '
            'math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>'
            % (pid, escape(name), pw, ph, ''.join(frames) + ''.join(cells)))


# ── แทนที่หน้า ผู้สอน / ผู้เรียน (ว่าง) ───────────────────────────────────
pages = re.findall(r'<diagram id="([^"]+)" name="([^"]+)">', src)
by_name = {n: i for i, n in pages}
targets = [('ผู้สอน', ROLES[0]), ('ผู้เรียน', ROLES[1])]
out = src
for old_name, (name, role_th, title, direct) in targets:
    pid = by_name.get(old_name) or by_name.get(name)
    assert pid, 'ไม่พบหน้า ' + old_name
    block = re.search(r'<diagram id="%s" name="[^"]+">.*?</diagram>' % re.escape(pid), out, re.S)
    out = out.replace(block[0], build_page(pid, name, role_th, title, direct))
io.open(FILE, 'w', encoding='utf-8', newline='').write(out)
print('wrote', FILE.relative_to(ROOT), '· หน้า', ', '.join(n for _, (n, *_r) in targets))
