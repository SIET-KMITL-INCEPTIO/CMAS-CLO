# -*- coding: utf-8 -*-
"""Two structure pages appended to docs/uml/CMAS/Structure.drawio.

   Page 1 of that file is hand-drawn and is NEVER touched — this script keeps
   every <diagram> it did not write, verbatim, and replaces only its own. Its
   pages are tagged with an id prefix so re-running replaces rather than piles up.

     Page 2 · โครงสร้างปัจจุบัน       who holds which capability today
     Page 3 · ถ้าเหลือผู้สอนคนเดียว    the same picture with the course roles merged

   WHY BOTH: page 1 already draws a single "Professor". That is not an old
   drawing of today's system — it is a drawing of the merged model, made before
   the course role was enforced. Putting the two side by side is the answer to
   "what happens if we merge them", in the notation the question was asked in.

   Both pages are DERIVED from the PERM matrix in docs/pages/index-q.html. The
   9 capabilities that page 3 tints are computed — the ones the three course
   roles do not hold equally today — not a list typed here. Nothing about the
   prototype is changed by this script; it only draws.

   Style follows page 1: plain rectangles, rounded=0, edgeStyle=none, draw.io
   defaults. The one addition is a light tint on the capabilities that MOVE,
   because a page whose whole purpose is "which ones move" cannot say it in
   monochrome. #FFF2CC is draw.io's own light yellow, the same family as the
   #FFFFCC boundary in UML-Layer2.

   The build REFUSES to write when two boxes overlap, an edge names a missing
   id, or the capabilities drawn are not exactly the 18 in PERM.

     python scripts/build-structure-pages.py
"""
import importlib
import io
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

sys.path.insert(0, str(Path(__file__).resolve().parent))
m = importlib.import_module('build-usecase-drawio')

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'docs' / 'uml' / 'CMAS' / 'Structure.drawio'
APP = ROOT / 'docs' / 'pages' / 'index-q.html'
MY_ID = 'cmasGenStruct'

PERM = m.PERM
CHAIN = ['ASSISTANT', 'CO', 'LEAD']
ROLE_TH = m.ROLE_TH

_src = io.open(APP, encoding='utf-8').read()
_blk = _src[_src.index('const CAP_TH = {'):_src.index('};', _src.index('const CAP_TH = {'))]
CAP_TH = dict(re.findall(r"'([a-z.]+)'\s*:\s*'([^']*)'", _blk))
missing = [c for c in PERM if c not in CAP_TH]
if missing:
    raise SystemExit('capability ไม่มีชื่อไทยใน CAP_TH: %s' % missing)

# ── who holds what, computed ─────────────────────────────────────────
ADMIN_ONLY = [c for c, v in PERM.items() if not any(r in v for r in CHAIN)]
SHARED = [c for c, v in PERM.items() if all(r in v for r in CHAIN)]
CO_ADDS = [c for c, v in PERM.items() if 'CO' in v and 'ASSISTANT' not in v]
LEAD_ADDS = [c for c, v in PERM.items() if 'LEAD' in v and 'CO' not in v]
MOVED = CO_ADDS + LEAD_ADDS          # the ones a merge hands to everyone

# ── page 1's vocabulary ──────────────────────────────────────────────
S_BOX = 'rounded=0;whiteSpace=wrap;html=1;'
S_BOX_MOVED = 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#B8912B;'
S_NOTE = ('rounded=0;whiteSpace=wrap;html=1;fillColor=#FFF9E6;strokeColor=#B8912B;'
          'align=left;verticalAlign=top;spacing=8;fontSize=11;')
S_TITLE = ('text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;'
           'fontSize=18;fontStyle=1')
S_SUB = 'text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;fontSize=11;'
S_EDGE = ('edgeStyle=none;html=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;'
          'entryX=0;entryY=0.5;entryDx=0;entryDy=0;')
S_INHERIT = ('edgeStyle=none;html=1;endArrow=block;endFill=0;endSize=10;dashed=1;'
             'exitX=0.5;exitY=0;exitDx=0;exitDy=0;entryX=0.5;entryY=1;entryDx=0;entryDy=0;')

SYS_X, ROLE_X, CAP_X = 40, 260, 620
SYS_W, ROLE_W, CAP_W = 160, 300, 340
BOX_H, ROW = 44, 54
TOP = 90


class Page:
    def __init__(self, name, pid):
        self.name, self.pid = name, pid
        self.cells, self.shapes, self.edges, self.n = [], {}, [], 0

    def _id(self):
        self.n += 1
        return '%s_%s_%d' % (MY_ID, self.pid, self.n)

    def box(self, value, style, x, y, w, h, role='box'):
        cid = self._id()
        self.cells.append(
            '<mxCell id="%s" value="%s" style="%s" vertex="1" parent="1">'
            '<mxGeometry x="%g" y="%g" width="%g" height="%g" as="geometry"/></mxCell>'
            % (cid, escape(value, {'"': '&quot;'}), style, x, y, w, h))
        self.shapes[cid] = {'role': role, 'x': x, 'y': y, 'w': w, 'h': h,
                            'name': re.sub(r'<[^>]+>', ' ', value).strip()[:40]}
        return cid

    def edge(self, a, b, style=S_EDGE):
        cid = self._id()
        self.cells.append(
            '<mxCell id="%s" style="%s" edge="1" parent="1" source="%s" target="%s">'
            '<mxGeometry relative="1" as="geometry"/></mxCell>' % (cid, style, a, b))
        self.edges.append((a, b))

    def xml(self):
        return ('<diagram id="%s" name="%s"><mxGraphModel dx="1228" dy="549" grid="1" '
                'gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" '
                'page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" '
                'shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s</root>'
                '</mxGraphModel></diagram>'
                % (MY_ID + self.pid, escape(self.name, {'"': '&quot;'}), ''.join(self.cells)))


def role_label(th, en):
    return '<b>%s</b><br><span style="font-size:10px;color:#7A7F99">%s</span>' % (th, en)


def cap_box(pg, cap, y, tint=False):
    # <br>, not a newline: these labels are html=1, so draw.io renders the value
    # as innerHTML and a raw newline collapses to a space — both lines ran
    # together on one line.
    label = '%s<br><span style="font-size:9px;color:#7A7F99">%s</span>' % (CAP_TH[cap], cap)
    return pg.box(label, S_BOX_MOVED if tint else S_BOX,
                  CAP_X, y, CAP_W, BOX_H, role='cap'), y + ROW


def page_now():
    pg = Page('2 · โครงสร้างปัจจุบัน', 'Now')
    pg.box('โครงสร้างสิทธิ์ปัจจุบัน', S_TITLE, SYS_X, 20, 700, 30, role='label')
    pg.box('บทบาทในรายวิชาบังคับใช้จริง (ASM-03a) · หนึ่งกล่องขวา = หนึ่ง capability ใน PERM · '
           'รวม %d ข้อ · ลูกศรประหมายถึงสืบทอดสิทธิ์ของบทบาทที่ชี้ไป'
           % len(PERM), S_SUB, SYS_X, 52, 760, 30, role='label')

    y = TOP
    groups = [(role_label('ผู้ดูแลระบบ', 'ADMIN'), ADMIN_ONLY, False),
              (role_label('ผู้ช่วยสอน', 'ASSISTANT'), SHARED, False),
              (role_label('ผู้สอนร่วม', 'CO — เพิ่มจากผู้ช่วยสอน'), CO_ADDS, False),
              (role_label('ผู้ประสานงานรายวิชา', 'LEAD — เพิ่มจากผู้สอนร่วม'), LEAD_ADDS, False)]
    role_ids, drawn = [], []
    for title, caps, tint in groups:
        block_top = y
        cap_ids = []
        for c in caps:
            cid, y = cap_box(pg, c, y, tint)
            cap_ids.append(cid)
            drawn.append(c)
        span = y - ROW + BOX_H - block_top
        rid = pg.box(title, S_BOX, ROLE_X, block_top + (span - 60) / 2, ROLE_W, 60, role='role')
        for cid in cap_ids:
            pg.edge(rid, cid)
        role_ids.append(rid)
        y += 26

    sys_top = TOP + (y - 26 - TOP - 60) / 2
    sid = pg.box('System', S_BOX, SYS_X, sys_top, SYS_W, 60, role='system')
    for rid in role_ids:
        pg.edge(sid, rid)
    # the ladder: LEAD ◁ CO ◁ ASSISTANT, drawn between the role boxes
    pg.edge(role_ids[3], role_ids[2], S_INHERIT)
    pg.edge(role_ids[2], role_ids[1], S_INHERIT)

    pg.box('<b>อ่านอย่างไร</b><br>'
           'ผู้ช่วยสอนถือ %d ข้อ · ผู้สอนร่วมถือ %d ข้อ (%d + %d) · '
           'ผู้ประสานงานถือ %d ข้อ (ทั้งหมดของรายวิชา)<br><br>'
           'ผู้ดูแลระบบถือ %d ข้อ และ<b>ไม่มีข้อใดเป็นงานในรายวิชา</b> (ASM-03b)'
           % (len(SHARED), len(SHARED) + len(CO_ADDS), len(SHARED), len(CO_ADDS),
              len(SHARED) + len(CO_ADDS) + len(LEAD_ADDS), len(ADMIN_ONLY)),
           S_NOTE, CAP_X + CAP_W + 40, TOP, 300, 150, role='note')
    return pg, drawn


def page_merged():
    pg = Page('3 · ถ้าเหลือผู้สอนคนเดียว', 'Merged')
    pg.box('ถ้ายุบเหลือผู้สอนคนเดียว', S_TITLE, SYS_X, 20, 700, 30, role='label')
    pg.box('สมมุติฐาน ไม่ใช่สิ่งที่ระบบเป็น · กล่องพื้นเหลืองคือ %d capability ที่'
           '<b>เปลี่ยนมือ</b> — วันนี้ผู้ช่วยสอนไม่มี พรุ่งนี้มีเท่าผู้ประสานงาน'
           % len(MOVED), S_SUB, SYS_X, 52, 760, 30, role='label')

    y = TOP
    admin_ids = []
    for c in ADMIN_ONLY:
        cid, y = cap_box(pg, c, y)
        admin_ids.append(cid)
    admin_span = y - ROW + BOX_H - TOP
    aid = pg.box(role_label('ผู้ดูแลระบบ', 'ADMIN'), S_BOX, ROLE_X, TOP + (admin_span - 60) / 2,
                 ROLE_W, 60, role='role')
    for cid in admin_ids:
        pg.edge(aid, cid)

    y += 26
    teach_top, teach_ids, drawn = y, [], list(ADMIN_ONLY)
    for c in SHARED + MOVED:
        cid, y = cap_box(pg, c, y, tint=c in MOVED)
        teach_ids.append(cid)
        drawn.append(c)
    teach_span = y - ROW + BOX_H - teach_top
    tid = pg.box(role_label('ผู้สอน', 'INSTRUCTOR'), S_BOX, ROLE_X, teach_top + (teach_span - 60) / 2,
                 ROLE_W, 60, role='role')
    for cid in teach_ids:
        pg.edge(tid, cid)

    sys_top = TOP + (y - 26 - TOP - 60) / 2
    sid = pg.box('System', S_BOX, SYS_X, sys_top, SYS_W, 60, role='system')
    pg.edge(sid, aid)
    pg.edge(sid, tid)

    pg.box('<b>สิ่งที่หายไปพร้อมกับบทบาท</b><br><br>'
           '<b>SEC-4 · การยกระดับสิทธิ์ตนเอง</b><br>'
           'วันนี้กันด้วยเส้นแบ่งสองเส้น — ผู้ประสานงานเชิญได้แค่ผู้ช่วยสอน '
           'และมีแต่ผู้ดูแลระบบที่ตั้ง LEAD/CO ได้ · ถ้ามีบทบาทเดียว '
           'การเชิญใครเข้ามาคือการให้สิทธิ์เต็มทันที<br><br>'
           '<b>EX-7 · ที่มาของไฟล์ Excel</b><br>'
           'บรรทัด "จัดทำโดยผู้ช่วยสอน — รอผู้สอนตรวจสอบ" ต้องรู้บทบาทของผู้สร้าง '
           'ไม่มีบทบาท ก็ไม่มีที่มา<br><br>'
           '<b>can() เหลือความหมายเดียว</b><br>'
           'เมทริกซ์ %d แถวยุบเหลือคำถาม "อยู่ในรายวิชานี้ไหม"<br><br>'
           '<b>ASM-03 กลับมา</b><br>'
           'ข้อสมมุติที่ยกเลิกไปเมื่อ 2568-09-10 เพราะผู้ช่วยสอนตรึงเกรดได้ · '
           'การยุบคือการย้อนมตินั้น ไม่ใช่การทำให้ง่ายขึ้นเฉย ๆ'
           % len(PERM), S_NOTE, CAP_X + CAP_W + 40, TOP, 300, 420, role='note')
    return pg, drawn


def check(pages):
    bad = []
    for pg in pages:
        S = pg.shapes
        boxes = [v for v in S.values() if v['role'] in ('cap', 'role', 'system', 'note')]
        for i, a in enumerate(boxes):
            for b in boxes[i + 1:]:
                if (a['x'] < b['x'] + b['w'] and b['x'] < a['x'] + a['w'] and
                        a['y'] < b['y'] + b['h'] and b['y'] < a['y'] + a['h']):
                    bad.append('%s: "%s" ทับ "%s"' % (pg.name, a['name'], b['name']))
        for a, b in pg.edges:
            if a not in S or b not in S:
                bad.append('%s: เส้นชี้ไปยัง id ที่ไม่มีอยู่' % pg.name)
    return bad


def main():
    p_now, drawn_now = page_now()
    p_mg, drawn_mg = page_merged()

    bad = check([p_now, p_mg])
    for label, drawn in (('หน้า 2', drawn_now), ('หน้า 3', drawn_mg)):
        if sorted(drawn) != sorted(PERM):
            bad.append('%s วาด capability ไม่ตรงกับ PERM: ขาด %s เกิน %s'
                       % (label, sorted(set(PERM) - set(drawn)), sorted(set(drawn) - set(PERM))))
    if bad:
        print('layout ใช้ไม่ได้ — ไม่เขียนไฟล์', file=sys.stderr)
        for b in sorted(set(bad)):
            print('  ' + b, file=sys.stderr)
        raise SystemExit(1)

    raw = io.open(TARGET, encoding='utf-8').read()
    # Keep every page this script did not write, byte for byte. Page 1 is
    # hand-drawn and a regenerated copy of it would be a silent rewrite.
    kept = [d for d in re.findall(r'<diagram\b.*?</diagram>', raw, re.S)
            if 'id="%s' % MY_ID not in d]
    if not kept:
        raise SystemExit('ไม่พบหน้าที่วาดด้วยมือใน %s — ไม่เขียนทับ' % TARGET.name)
    head = raw[:raw.index('<diagram')]
    tail = raw[raw.rindex('</diagram>') + len('</diagram>'):]
    io.open(TARGET, 'w', encoding='utf-8', newline='\n').write(
        head + ''.join(kept) + p_now.xml() + p_mg.xml() + tail)

    print('wrote', TARGET.relative_to(ROOT))
    print('  เก็บหน้าที่วาดด้วยมือไว้ %d หน้า · เพิ่ม/แทนที่หน้าที่สร้างเอง 2 หน้า' % len(kept))
    print('  capability %d ข้อ — ผู้ดูแล %d · ทุกบทบาทในรายวิชา %d · '
          'ผู้สอนร่วมเพิ่ม %d · ผู้ประสานงานเพิ่ม %d'
          % (len(PERM), len(ADMIN_ONLY), len(SHARED), len(CO_ADDS), len(LEAD_ADDS)))
    print('  ยุบแล้วเปลี่ยนมือ %d ข้อ: %s' % (len(MOVED), ' '.join(MOVED)))


if __name__ == '__main__':
    main()
