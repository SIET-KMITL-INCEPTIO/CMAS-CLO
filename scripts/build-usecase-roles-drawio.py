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
    ('ผู้สอน', 'ผู้สอน', 'ผู้สอนทำอะไรได้ในรายวิชาของตน', 'ทำได้เฉพาะวิชาที่ตนสอน (ตรวจสิทธิ์ทุกครั้ง)',
     ['2.1', '2.2', '2.3', '2.5', '2.6', '2.8', '2.9', '3.1', '3.2', '3.5', '4.1', '4.5', '4.6', '5.1',
      '6.1', '6.2', '6.4', '6.6', '7.1', '7.2', '7.4', '7.6', '8.1', '8.2', '9.1']),
    ('ผู้ดูแลระบบ', 'ผู้ดูแลระบบ', 'ผู้ดูแลระบบทำอะไรได้', 'ดูข้อมูลทุกรายวิชาได้ (อ่านอย่างเดียว) แต่ไม่ทำงานสอน',
     ['1.1', '1.2', '1.3', '1.5', '1.6', '2.1', '2.3', '2.6', '2.8', '9.1']),
    ('ผู้ยังไม่มีบัญชี', 'ผู้ยังไม่มีบัญชี', 'ผู้ยังไม่มีบัญชีลงทะเบียนอย่างไร',
     'Google ในโดเมนคณะใช้ได้ทันที · Google หรือลิงก์อีเมลนอกโดเมนรอผู้ดูแลอนุมัติ (1.6)', ['9.2', '9.3']),
]
# ไม่ระบายสีสถานะความคืบหน้า (docs/diagrams/CLAUDE.md ข้อ 4: ไดอะแกรมแสดงระบบที่เสร็จแล้ว สถานะอยู่ใน progress/ และ README)
# ยังเก็บกลไกไว้: ใส่รหัส use case ใน BUILT ถ้าต้องการเน้นเป็นพิเศษ
BUILT = set()

FONT = ('fontFamily=IBM Plex Sans Thai;fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DIBM%2BPlex%2BSans%2BThai;'
        'fontSize=16;fontColor=#000000;')
BOX = 'html=1;whiteSpace=wrap;rounded=0;strokeWidth=2;strokeColor=#000000;fillColor=#FFFFFF;' + FONT
FRAME = ('html=1;whiteSpace=wrap;rounded=0;strokeWidth=2;strokeColor=#000000;fillColor=none;verticalAlign=top;align=left;'
         'spacingLeft=12;spacingTop=8;fontStyle=1;' + FONT)
ACTOR = ('shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;rounded=0;strokeWidth=2;strokeColor=#000000;'
         'fillColor=#FFFFFF;' + FONT)
TEXT = 'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;' + FONT
# เส้นเหมือนหน้า overview: เส้นตรง (edgeStyle=none) · actor ออกจากกึ่งกลาง · ปลายเปิดที่ use case
ASSOC = ('edgeStyle=none;html=1;rounded=0;strokeWidth=2;strokeColor=#000000;endArrow=open;endFill=0;' + FONT)
DEP = ('edgeStyle=none;html=1;rounded=0;strokeWidth=2;strokeColor=#000000;dashed=1;endArrow=open;endFill=0;'
       'labelBackgroundColor=#FFFFFF;' + FONT + 'fontSize=14;')
EW, EH, PITCH, COLP = 320, 80, 140, 460      # วงรี · ระยะแถว · ระยะคอลัมน์ (ช่องว่าง 140 พอสำหรับป้าย «include»)


class Builder:
    def __init__(self, pid):
        self.pid, self.cells, self.frames, self.n = pid, [], [], 0

    def nid(self):
        self.n += 1
        return '%s-%d' % (self.pid, self.n)

    def vertex(self, value, style, x, y, w, h, frame=False):
        assert all(v % 10 == 0 for v in (x, y, w, h)), (value, x, y, w, h)
        i = self.nid()
        (self.frames if frame else self.cells).append(
            '<mxCell id="%s" value="%s" style="%s" parent="1" vertex="1"><mxGeometry x="%d" y="%d" width="%d" '
            'height="%d" as="geometry"/></mxCell>' % (i, escape(value, {'"': '&quot;'}), style, x, y, w, h))
        return i

    def edge(self, a, b, style, label, ox, ix, pts=()):
        geo = '<mxGeometry relative="1" as="geometry"/>'
        if pts:
            geo = ('<mxGeometry relative="1" as="geometry"><Array as="points">' +
                   ''.join('<mxPoint x="%d" y="%d"/>' % q for q in pts) + '</Array></mxGeometry>')
        if style == ASSOC:        # actor -> use case: จากกึ่งกลาง actor ตรงไปขอบซ้ายของวงรี เหมือน overview
            geo = '<mxGeometry relative="1" as="geometry"/>'
            ex = 'exitX=0.5;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=0;'
        else:
            ex = 'exitX=%g;exitY=0.5;exitDx=0;exitDy=0;' % ox
        self.cells.append('<mxCell id="%s" value="%s" style="%s %sentryX=%g;entryY=0.5;'
                          'entryDx=0;entryDy=0;" parent="1" source="%s" target="%s" edge="1">%s</mxCell>'
                          % (self.nid(), escape(label), style, ex, ix, a, b, geo))

    def finish(self, name, title, x_right, bottom):
        fw = x_right - 40
        pf = ('<mxCell id="%s" value="%s" style="%s" parent="1" vertex="1"><mxGeometry x="40" y="40" width="%d" height="%d" '
              'as="geometry"/></mxCell>' % (self.nid(), escape(title), FRAME, fw, bottom))
        pw, ph = x_right + 40, bottom + 80
        return ('<diagram id="%s" name="%s"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" '
                'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" background="#FFFFFF" '
                'math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>'
                % (self.pid, escape(name), pw, ph, pf + ''.join(self.frames) + ''.join(self.cells)))


CAPTION = 'เส้นทึบ = ผู้ใช้ทำเอง · «include» = ทำร่วมกันเสมอ · «extend» = ทำเพิ่มเมื่อจำเป็น'


def round10(v):
    return int(round(v / 10.0)) * 10


def build_detail(pid, name, title, note, actors):
    """หน้ารายละเอียด: กรอบละแพ็กเกจ · actors = [(ชื่อ, [use case ที่ทำเอง])]"""
    b = Builder(pid)
    kids = {}
    for base, kid, rel in REL:
        kids.setdefault(base, []).append((kid, rel))
    direct = sorted({u for _, ds in actors for u in ds})
    pkgs = sorted({u[0] for u in direct})
    X0, plan = 360, []
    # ความกว้างกรอบแพ็กเกจ = ของแพ็กเกจที่กว้างสุด เพื่อให้ขอบขวาเรียงตรงกันทุกกรอบ
    depth = {}
    for p in pkgs:
        ds, stack = 0, [u for u in direct if u[0] == p]
        while stack:
            u = stack.pop()
            ds = max(ds, depth.get(u, 0))
            for k, _ in kids.get(u, []):
                depth[k] = depth.get(u, 0) + 1
                stack.append(k)
    ncol_all = max([depth.get(u, 0) for u in list(UC) if u[0] in pkgs] + [0]) + 1
    FW = 40 + EW + (ncol_all - 1) * COLP + 40
    out_w = X0 + FW + 40 - 40 - 80                       # ความกว้างกล่องหมายเหตุ (ชิดในกรอบนอก)
    chars = len(re.sub(r'<[^>]+>', '', note)) * 9, len(CAPTION) * 9
    nlines = sum(max(1, -(-c // out_w)) for c in chars)
    note_h = round10(nlines * 24 + 10)
    y = 90 + note_h + 40
    top0 = y
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
        fw = FW
        fh = 60 + (row[0] - 1) * PITCH + EH + 40
        plan.append((p, y, fw, fh, pos))
        y += fh + 60
    bottom = y - 60
    ids, ycen = {}, {}
    for p, py, fw, fh, pos in plan:
        b.vertex('%s · %s' % (p, PKG[p]), FRAME, X0, py, fw, fh, frame=True)
        for u, (d, r) in pos.items():
            ey = py + 60 + round10(r * PITCH)
            ycen[u] = ey + EH // 2
            ids[u] = b.vertex('%s %s' % (u, UC[u]), 'ellipse;' + (BOX.replace('fillColor=#FFFFFF', 'fillColor=#EEF0F8')
                              if u in BUILT else BOX), X0 + 40 + d * COLP, ey, EW, EH)
    # actor อยู่กลางแนวสิ่งที่ตนทำ · เรียงจากบนลง ห่างกันอย่างน้อย 180
    last, aids = 0, []
    for k, (label, ds) in enumerate(actors):
        want = round10(sum(ycen[u] for u in ds) / len(ds)) - 50
        ay = max(want, last + 180, top0)
        last = ay
        a = b.vertex(label, ACTOR, 120, ay, 60, 100)
        aids.append((a, ay + 50, ds))
    multi = len(actors) > 1
    for k, (a, acy, ds) in enumerate(aids):
        tx = 220 + 40 * k
        for u in ds:
            b.edge(a, ids[u], ASSOC, '', 1, 0, pts=[(tx, acy), (tx, ycen[u])] if multi else ())
    for base, kid, rel in REL:
        if base in ids and kid in ids:
            if rel == 'include':
                b.edge(ids[base], ids[kid], DEP, '«include»', 1, 0)
            else:
                b.edge(ids[kid], ids[base], DEP, '«extend»', 0, 1)
    b.vertex(note + '<br>' + CAPTION, TEXT, 80, 90, out_w, note_h)
    bottom = max(bottom, last + 140)
    return b.finish(name, title, X0 + FW + 40, bottom)


def build_summary(pid, name, title, note, links):
    """ภาพรวม: วงรีละแพ็กเกจ ในกรอบ 'ระบบ CMAS' · links = [(ชื่อ actor, [รหัสแพ็กเกจ])]"""
    b = Builder(pid)
    pk = sorted(PKG)
    assert len(pk) <= 9
    tail = 'เส้นทึบ = ผู้ใช้ทำเอง · ตัวเลข = หมวดของ use case (รายละเอียดอยู่หน้าถัดไป)'
    out_w = 440 + EW + 80 + 40 - 40 - 80                 # กล่องหมายเหตุอยู่ในกรอบนอก ไม่ล้น
    nlines = sum(max(1, -(-len(re.sub(r'<[^>]+>', '', t)) * 9 // out_w)) for t in (note, tail))
    base = round10(90 + nlines * 24 + 10 + 40)           # ขอบบนของกรอบ "ระบบ CMAS"
    top, ph = base + 40, 140
    fh = 60 + (len(pk) - 1) * ph + EH + 40
    b.vertex('ระบบ CMAS', FRAME, 440, base, EW + 80, fh, frame=True)
    ids, ycen = {}, {}
    for i, p in enumerate(pk):
        ey = top + 20 + i * ph
        ids[p] = b.vertex('%s · %s' % (p, PKG[p]), 'ellipse;' + BOX, 480, ey + 20, EW, EH)
        ycen[p] = ey + 20 + EH // 2
    last = 0
    for k, (label, ps) in enumerate(links):
        want = round10(sum(ycen[p] for p in ps) / len(ps)) - 50
        ay = max(want, last + 180, base)
        last = ay
        a = b.vertex(label, ACTOR, 120, ay, 60, 100)
        for p in ps:
            b.edge(a, ids[p], ASSOC, '', 1, 0)
    b.vertex(note + '<br>' + tail, TEXT, 80, 90, out_w, round10(nlines * 24 + 10))
    return b.finish(name, title, 440 + EW + 80 + 40, max(base + fh + 40, last + 140) - 40)


# ── สร้าง/แทนที่หน้า (หน้าที่ยังไม่มีจะต่อท้ายไฟล์) ───────────────────────
pages = re.findall(r'<diagram id="([^"]+)" name="([^"]+)">', src)
by_name = {n: i for i, n in pages}
OLD = {'ผู้ดูแลระบบ': 'ผู้เรียน'}          # ชื่อเดิมของหน้าที่เคยว่าง
R_TEACH, R_ADMIN, R_GUEST = ROLES
TARGETS = [
    ('layer-1', lambda pid: build_summary(
        pid, 'layer-1', 'ภาพรวม: ใครใช้งานส่วนไหนของระบบ',
        'ผู้ดูแลระบบจัดการบัญชีและรายวิชา · ผู้สอนทำงานสอนในรายวิชาของตน · ผู้ยังไม่มีบัญชีลงทะเบียนด้วย Google หรือลิงก์อีเมล',
        [('ผู้ดูแลระบบ', ['1', '2', '9']), ('ผู้สอน', ['2', '3', '4', '5', '6', '7', '8', '9']),
         ('ผู้ยังไม่มีบัญชี', ['9'])])),
    ('layer-2', lambda pid: build_detail(
        pid, 'layer-2', 'รายละเอียด: use case ทั้งหมดของทุกบทบาท',
        'ผู้สอนทำได้เฉพาะวิชาที่ตนสอน · ผู้ดูแลระบบไม่ทำงานสอน',
        [(R_ADMIN[1], R_ADMIN[4]), (R_TEACH[1], R_TEACH[4]), (R_GUEST[1], R_GUEST[4])])),
]
for _r in ROLES:
    TARGETS.append((_r[0], (lambda r: lambda pid: build_detail(pid, r[0], r[2], r[3], [(r[1], r[4])]))(_r)))
out = src
for name, make in TARGETS:
    pid = by_name.get(name) or by_name.get(OLD.get(name, ''))
    if pid:
        block = re.search(r'<diagram id="%s" name="[^"]+">.*?</diagram>' % re.escape(pid), out, re.S)
        out = out.replace(block[0], make(pid))
    else:
        out = out.replace('</mxfile>', make('role-' + str(len(by_name))) + '</mxfile>')
io.open(FILE, 'w', encoding='utf-8', newline='').write(out)
print('wrote', FILE.relative_to(ROOT), '· หน้า', ', '.join(n for n, _ in TARGETS))
