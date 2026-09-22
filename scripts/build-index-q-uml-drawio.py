# -*- coding: utf-8 -*-
"""index-q.html as a use case diagram in the TEAM's house style.

   Output: docs/uml/index-q/UML-INDEX-Q.drawio — one page

   This is the SAME MODEL as build-usecase-drawio.py drawn a second way. That
   script renders strict UML 2.5 for a reviewer: monochrome, uc frames, subject
   boundary, extension-point compartments, six pages. This one renders the
   notation the team already uses in docs/uml/CMAS/UML-Layer2.drawio, so the new
   diagram sits beside the old ones without looking imported from elsewhere:

     * one tall page, yellow #FFFFCC system boundary, "System" in 25px bold
     * packages as plain white rectangles, the package name a separate 25px
       text element inside the box rather than a folder tab
     * use cases as 300x120 ellipses at 20px, draw.io defaults for fill/stroke
     * associations solid with no arrowhead, actor centre -> ellipse left edge
     * «include» / «extend» dashed at dashPattern=12 12, the guillemets carried
       by an edgeLabel child of the edge, exactly as Layer2 writes them

   The model is IMPORTED, never copied. build-usecase-drawio owns which use case
   belongs to which role — it derives that from the PERM matrix in index-q.html
   — and this file only decides where the shapes sit. A copied model would give
   two diagrams that disagree the first time PERM changes.

   Two things Layer2 does not have, drawn here because index-q.html's data has
   them and leaving them out would misrepresent it:
     * a third actor, ผู้ยังไม่มีบัญชี — self-registration (D6) is performed by
       someone who is not a user yet. The course roles are ONE actor, ผู้สอน:
       D1 (2569-09-14) removed the ผู้ช่วยสอน ◁ ผู้สอนร่วม ◁ ผู้ประสานงานรายวิชา
       ladder this diagram drew until 2569-09-18
     * packages 8 ตัดเกรด and 9 บัญชีของฉัน, which the prototype adds

   Packages are ordered 1 2 3 4 8 7 5 6 9, not 1-9. The order groups them by the
   actor that owns them, which is what keeps association lines short on a page
   this tall — numeric order put ผู้ประสานงาน's package 8 thousands of pixels
   below its other three.

   The build REFUSES to write the file when two boxes overlap, a use case
   escapes its package, a package escapes the system boundary, an edge names an
   id that was never emitted, or the set of use cases drawn is not exactly the
   set index-q.html defines.

     python scripts/build-index-q-uml-drawio.py
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
OUT = ROOT / 'docs' / 'uml' / 'index-q' / 'UML-INDEX-Q.drawio'

# ══ the model, imported ══════════════════════════════════════════════
PKG_TEXT, NEW, UC_TEXT = m.PKG_TEXT, m.NEW, m.UC_TEXT
ROLE_TH, CHAIN = m.ROLE_TH, m.CHAIN
pages, placed = m.resolve()

# What the course roles touch, per package: {pkg: [(uc, actor, [(kid, rel, from)])]}
UNITS_BY_PKG = {}
for _role, _units in pages.items():
    for _pkg, _uc, _kids, _inherited in _units:
        if _inherited:                 # a borrowed copy of a base that another
            continue                   # role page shows — one page here, so skip
        UNITS_BY_PKG.setdefault(_pkg, []).append(
            (_uc, _role, [(k, r, f) for k, r, f, _c in _kids]))

# Packages 1 and 2's admin half, and package 9, are not in UNITS: they carry no
# course-role capability, so the PERM-driven model has nothing to say about them.
# Inserted as a block per package, in order. One insert(0) per row reversed
# them: package 1 came out 1.6 1.5 1.3 1.2 1.1 down the page.
NON_COURSE = {
    '1': [('1.1', 'ADMIN', [('1.4', 'include', '1.1')]),
          ('1.2', 'ADMIN', []), ('1.3', 'ADMIN', []),
          ('1.5', 'ADMIN', []), ('1.6', 'ADMIN', [])],
    '2': [('2.1', 'ADMIN', [('2.4', 'include', '2.1')]), ('2.3', 'ADMIN', [])],
    '9': [('9.1', 'EVERY', []), ('9.2', 'EVERY', []),
          ('9.3', 'GUEST', [('9.4', 'include', '9.3')]), ('9.5', 'GUEST', [])],
}
for _pkg, _rows in NON_COURSE.items():
    UNITS_BY_PKG[_pkg] = _rows + UNITS_BY_PKG.get(_pkg, [])

# A use case two actors reach — 2.1 and 2.3, admin and instructor — is ONE ellipse
# with two association lines, not two ellipses. Merge duplicates: the first row
# keeps its position and children, every actor is collected. Without this the
# same code was laid out twice and the second ellipse overwrote the first id.
for _pkg, _rows in UNITS_BY_PKG.items():
    _merged, _seen = [], {}
    for _uc, _actor, _kids in _rows:
        if _uc in _seen:
            _row = _merged[_seen[_uc]]
            if _actor not in _row[1]:
                _row[1].append(_actor)
            _row[2].extend(k for k in _kids if k not in _row[2])
        else:
            _seen[_uc] = len(_merged)
            _merged.append((_uc, [_actor], list(_kids)))
    UNITS_BY_PKG[_pkg] = _merged

PKG_ORDER = ['1', '2', '3', '4', '8', '7', '5', '6', '9']

# ══ Layer2's measurements, read off that file rather than invented ═══
UC_W, UC_H = 300, 120                 # its ellipse
COL = 580                             # 1330 → 1910, its two-column pitch
ROW = 180                             # 1400 → 1580, its row pitch
PKG_X = 1240                          # every package box in Layer2
PKG_PAD_X = 90                        # 1240 → 1330
PKG_PAD_TOP = 80                      # 370 → 450
PKG_LABEL_H = 110                     # room under the last row for the 25px name
PKG_GAP = 50                          # 1230 → 1280
SYS_X, SYS_Y = 1080, 240              # the yellow boundary
ACTOR_X, ACTOR_W, ACTOR_H = 250, 60, 110

S_UC = 'ellipse;whiteSpace=wrap;html=1;fontSize=20;'
S_PKG = 'rounded=0;whiteSpace=wrap;html=1;'
S_SYS = 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFCC;'
S_ACTOR = 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;'
S_TEXT_B = ('text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;'
            'fontSize=25;fontStyle=1')
S_NOTE = ('rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFCC;align=left;verticalAlign=top;'
          'spacing=10;fontSize=16;')
S_ASSOC = ('edgeStyle=none;html=1;exitX=0.5;exitY=0.5;exitDx=0;exitDy=0;exitPerimeter=0;'
           'entryX=0;entryY=0.5;entryDx=0;entryDy=0;')
S_DEP = ('edgeStyle=none;html=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;'
         'entryX=0;entryY=0.5;entryDx=0;entryDy=0;dashed=1;dashPattern=12 12;')
S_DEP_BACK = ('edgeStyle=none;html=1;exitX=0;exitY=0.5;exitDx=0;exitDy=0;'
              'entryX=1;entryY=0.5;entryDx=0;entryDy=0;dashed=1;dashPattern=12 12;')
S_GEN = ('edgeStyle=none;html=1;endArrow=block;endFill=0;endSize=12;'
         'exitX=0.5;exitY=0;exitDx=0;exitDy=0;exitPerimeter=0;'
         'entryX=0.5;entryY=1;entryDx=0;entryDy=0;entryPerimeter=0;')
S_EDGELABEL = 'edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];'


class Doc:
    def __init__(self):
        self.cells, self.shapes, self.edges, self.n = [], {}, [], 0

    def _id(self):
        self.n += 1
        return 'c%d' % self.n

    def box(self, value, style, x, y, w, h, role='box'):
        cid = self._id()
        self.cells.append(
            '<mxCell id="%s" value="%s" style="%s" vertex="1" parent="1">'
            '<mxGeometry x="%g" y="%g" width="%g" height="%g" as="geometry"/></mxCell>'
            % (cid, escape(value, {'"': '&quot;'}), style, x, y, w, h))
        self.shapes[cid] = {'role': role, 'x': x, 'y': y, 'w': w, 'h': h,
                            'name': re.sub(r'<[^>]+>', ' ', value).strip()[:44]}
        return cid

    def edge(self, a, b, style, label=None):
        cid = self._id()
        self.cells.append(
            '<mxCell id="%s" style="%s" edge="1" parent="1" source="%s" target="%s">'
            '<mxGeometry relative="1" as="geometry"/></mxCell>' % (cid, style, a, b))
        if label:
            # Layer2 carries the guillemets on a child of the edge rather than in
            # the edge's own value. Keep that: draw.io positions the two
            # differently, and a mixed file would show two label offsets.
            self.cells.append(
                '<mxCell id="%s" value="%s" style="%s" vertex="1" connectable="0" parent="%s">'
                '<mxGeometry x="-0.05" y="-1" relative="1" as="geometry">'
                '<mxPoint as="offset"/></mxGeometry></mxCell>'
                % (self._id(), escape(label, {'"': '&quot;'}), S_EDGELABEL, cid))
        self.edges.append((a, b))
        return cid

    def xml(self, name):
        return ('<diagram id="indexQUml" name="%s"><mxGraphModel dx="3405" dy="1870" grid="1" '
                'gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" '
                'pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0"><root>'
                '<mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>'
                % (escape(name, {'"': '&quot;'}), ''.join(self.cells)))


def label_of(code):
    return code + ' ' + (NEW.get(code) or UC_TEXT[code])


def grid_of(pkg):
    """Rows for one package: column 0 is the use case an actor touches, columns
       1+ are what it includes or is extended by. The same shape Layer2 draws by
       hand — the base on the left, its dependants stepping to the right."""
    rows = []
    for uc, _actor, kids in UNITS_BY_PKG[pkg]:
        firsts = [k for k in kids if k[2] == uc]
        later = [k for k in kids if k[2] != uc]
        row = [uc]
        if firsts:
            row.append(firsts[0][0])
        rows.append(row)
        for k in firsts[1:]:
            rows.append([None, k[0]])
        for k in later:                     # hangs off a child, one column further
            for r in rows:
                if len(r) > 1 and r[1] == k[2]:
                    r.append(k[0])
                    break
            else:
                rows.append([None, None, k[0]])
    return rows


def build():
    doc = Doc()
    ids, deps, assoc = {}, [], []
    owner = {uc: actors for units in UNITS_BY_PKG.values() for uc, actors, _k in units}
    plans = {p: grid_of(p) for p in PKG_ORDER}
    # Each package is as wide as its own widest row, the way Layer2 sizes them
    # (1150 for the one-and-two-column packages, 1720 for the three-column ones).
    # A single width for all nine left package 1 two-thirds empty.
    def width_of(pkg):
        cols = max(len(r) for r in plans[pkg])
        return PKG_PAD_X * 2 + (cols - 1) * COL + UC_W
    widths = {p: width_of(p) for p in PKG_ORDER}
    pkg_w = max(widths.values())

    # ── measure first, emit second ────────────────────────────────────
    # z-order in a drawio file IS document order. The boundary has to be written
    # before the packages it contains, so its height must be known before the
    # first package is emitted — hence a measuring pass. Written last, the
    # yellow rectangle painted over all nine packages and the file looked empty.
    y, stack = SYS_Y + 130, []
    for pkg in PKG_ORDER:
        h = PKG_PAD_TOP + len(plans[pkg]) * ROW + PKG_LABEL_H
        stack.append((pkg, y, h))
        y += h + PKG_GAP
    sys_h = y - PKG_GAP - SYS_Y + 90
    sys_w = PKG_X - SYS_X + pkg_w + 160
    doc.box('', S_SYS, SYS_X, SYS_Y, sys_w, sys_h, role='system')
    doc.box('System', S_TEXT_B, SYS_X + sys_w / 2 - 200, SYS_Y + 30, 400, 70, role='label')

    # ── packages, stacked in owner order ──────────────────────────────
    for pkg, y, h in stack:
        rows, w = plans[pkg], widths[pkg]
        doc.box('', S_PKG, PKG_X, y, w, h, role='package')
        for ri, row in enumerate(rows):
            for ci, code in enumerate(row):
                if code is None:
                    continue
                ids[code] = doc.box(label_of(code), S_UC,
                                    PKG_X + PKG_PAD_X + ci * COL,
                                    y + PKG_PAD_TOP + ri * ROW, UC_W, UC_H, role='uc')
                for actor in owner.get(code, []):
                    assoc.append((actor, code))
        # Sized to the package, not a fixed 500: package 9 บัญชีของฉัน is one
        # column wide (480) and a 500-wide label hung out of both sides of it.
        lw = w - 40
        doc.box(pkg + ' · ' + PKG_TEXT[pkg], S_TEXT_B,
                PKG_X + (w - lw) / 2, y + h - PKG_LABEL_H + 15, lw, 70, role='pkglabel')
        deps.extend(k for _u, _a, kids in UNITS_BY_PKG[pkg] for k in kids)

    # ── actors, each level with the middle of what it touches ─────────
    def centroid(role):
        ys = [doc.shapes[ids[c]]['y'] + UC_H / 2 for r, c in assoc if r == role]
        return sum(ys) / len(ys) - ACTOR_H / 2
    names = dict(ROLE_TH, GUEST=m.GUEST_TH)
    actors = {r: doc.box(names[r], S_ACTOR, ACTOR_X, centroid(r), ACTOR_W, ACTOR_H,
                         role='actor')
              for r in ['ADMIN'] + CHAIN + ['GUEST']}

    # 9.1/9.2 belong to every signed-in user. Layer2 has no abstract ผู้ใช้ระบบ
    # actor, and inventing one here would need a generalization crossing the
    # whole page; a line from each signed-in role says the same thing.
    assoc = [(r, c) for r, c in assoc if r != 'EVERY']
    for code in ('9.1', '9.2'):
        for r in ['ADMIN'] + CHAIN:
            assoc.append((r, code))

    # ── the wiring ────────────────────────────────────────────────────
    for lo, hi in zip(CHAIN, CHAIN[1:]):          # empty while there is one course role
        doc.edge(actors[hi], actors[lo], S_GEN)
    for role, code in assoc:
        doc.edge(actors[role], ids[code], S_ASSOC)
    for kid, rel, frm in deps:
        if rel == 'include':                        # base ──▷ included
            back = doc.shapes[ids[kid]]['x'] < doc.shapes[ids[frm]]['x']
            doc.edge(ids[frm], ids[kid], S_DEP_BACK if back else S_DEP, '«include»')
        else:                                       # extension ──▷ base
            back = doc.shapes[ids[frm]]['x'] < doc.shapes[ids[kid]]['x']
            doc.edge(ids[kid], ids[frm], S_DEP_BACK if back else S_DEP, '«extend»')

    # ── the legend, outside the boundary ──────────────────────────────
    doc.box('<b>UML use case · index-q.html</b><br><br>'
            'สร้างจาก USE_CASES และเมทริกซ์ PERM ใน <i>docs/pages/index-q.html</i> ด้วย '
            '<i>scripts/build-index-q-uml-drawio.py</i> — แก้ที่ไฟล์ต้นทางแล้วสร้างใหม่ '
            'อย่าแก้ที่ภาพนี้<br><br>'
            'สัญกรณ์เดียวกับ <i>docs/uml/CMAS/UML-Layer2.drawio</i><br><br>'
            '<b>บทบาทในรายวิชามีบทบาทเดียว</b> — ผู้สอนทุกคนของวิชาทำได้เท่ากัน (D1) '
            'ไม่มีผู้ประสานงาน / ผู้สอนร่วม / ผู้ช่วยสอนแล้ว<br><br>'
            '<b>ผู้ดูแลระบบไม่ทำงานในรายวิชา</b> — สร้าง ลบ และผูกผู้สอนเข้ากับรายวิชาเท่านั้น '
            '(ASM-03b) · 2.1 และ 2.3 ผู้สอนทำได้ด้วย (P17 · P16)<br><br>'
            '<b>9 บัญชีของฉัน</b> — 9.1 9.2 ผู้ใช้ทุกคนทำได้ · 9.3–9.5 ลงทะเบียนเอง '
            'โดยผู้ยังไม่มีบัญชี เฉพาะอีเมลคณะ (D6)<br><br>'
            'แพ็กเกจเรียงตามเจ้าของ ไม่ใช่ตามเลข เพื่อให้เส้นโยงสั้น',
            S_NOTE, SYS_X + sys_w + 90, SYS_Y, 620, 620, role='note')

    # ── refuse rather than write something wrong ──────────────────────
    S, bad = doc.shapes, []

    def over(a, b):
        return (a['x'] < b['x'] + b['w'] and b['x'] < a['x'] + a['w'] and
                a['y'] < b['y'] + b['h'] and b['y'] < a['y'] + a['h'])

    def inside(a, b):
        return (a['x'] >= b['x'] and a['y'] >= b['y'] and
                a['x'] + a['w'] <= b['x'] + b['w'] and a['y'] + a['h'] <= b['y'] + b['h'])

    ucs = [v for v in S.values() if v['role'] == 'uc']
    pkgs = [v for v in S.values() if v['role'] == 'package']
    labels = [v for v in S.values() if v['role'] == 'pkglabel']
    system = [v for v in S.values() if v['role'] == 'system'][0]
    for i, a in enumerate(ucs):
        for b in ucs[i + 1:]:
            if over(a, b):
                bad.append('use case ทับกัน: "%s" กับ "%s"' % (a['name'], b['name']))
    for i, a in enumerate(pkgs):
        for b in pkgs[i + 1:]:
            if over(a, b):
                bad.append('แพ็กเกจทับกัน')
    for lb in labels:
        for u in ucs:
            if over(lb, u):
                bad.append('ชื่อแพ็กเกจ "%s" ทับ use case "%s"' % (lb['name'], u['name']))
        # Overlap alone missed the case that matters: with no room reserved
        # under the last row, the name slides out of the bottom of its box
        # instead of onto a use case, and every geometry check still passed.
        if not any(inside(lb, pk) for pk in pkgs):
            bad.append('ชื่อแพ็กเกจ "%s" หลุดออกนอกกล่องแพ็กเกจ' % lb['name'])
    for u in ucs:
        if not any(inside(u, p) for p in pkgs):
            bad.append('use case อยู่นอกแพ็กเกจ: "%s"' % u['name'])
    for p in pkgs:
        if not inside(p, system):
            bad.append('แพ็กเกจล้นขอบเขตระบบ')
    acts = [v for v in S.values() if v['role'] == 'actor']
    for a in acts:
        if over(a, system):
            bad.append('actor "%s" ทับขอบเขตระบบ' % a['name'])
    # Each actor sits at the centroid of what it touches, so two roles whose use
    # cases happen to average to the same height would land on top of each other.
    # 150 leaves room for the name, which hangs below the figure.
    for i, a in enumerate(acts):
        for b in acts[i + 1:]:
            if abs(a['y'] - b['y']) < 150:
                bad.append('actor "%s" กับ "%s" ชิดกันเกินไป' % (a['name'], b['name']))
    for a, b in doc.edges:
        if a not in S or b not in S:
            bad.append('เส้นชี้ไปยัง id ที่ไม่มีอยู่จริง')
            continue
        # Same 4px clearance rule the sibling script enforces, and the same
        # helper — a line that grazes an ellipse it does not belong to reads as
        # touching it. Ports match the styles above: an association ends on the
        # ellipse's left tip, a dependency leaves one side and enters the other.
        sa, sb = S[a], S[b]
        if sa['role'] == 'actor':
            pts = [(sa['x'] + sa['w'] / 2, sa['y'] + sa['h'] / 2), (sb['x'], sb['y'] + sb['h'] / 2)]
        elif sa['role'] == 'uc' and sb['role'] == 'uc':
            fwd = sa['x'] < sb['x']
            pts = [(sa['x'] + sa['w'] if fwd else sa['x'], sa['y'] + sa['h'] / 2),
                   (sb['x'] if fwd else sb['x'] + sb['w'], sb['y'] + sb['h'] / 2)]
        else:
            continue
        for hit in sorted(m.path_hits(S, pts, {a, b})):
            bad.append('เส้น %s → %s ทะลุ "%s"' % (sa['name'][:22], sb['name'][:22], hit))
    order = list(S)
    sys_i = order.index([k for k, v in S.items() if v['role'] == 'system'][0])
    for k, v in S.items():
        if v['role'] in ('package', 'uc', 'label', 'pkglabel') and order.index(k) < sys_i:
            bad.append('ขอบเขตระบบถูกเขียนหลัง "%s" — drawio ใช้ลำดับในไฟล์เป็น z-order '
                       'กล่องสีเหลืองจะทับทุกอย่าง' % v['name'])
    drawn, expect = set(ids), set(UC_TEXT) | set(NEW)
    if drawn != expect:
        bad.append('use case ไม่ครบ: ขาด %s เกิน %s'
                   % (sorted(expect - drawn), sorted(drawn - expect)))
    if bad:
        print('layout ใช้ไม่ได้ — ไม่เขียนไฟล์', file=sys.stderr)
        for b in sorted(set(bad)):
            print('  ' + b, file=sys.stderr)
        raise SystemExit(1)
    return doc, ids


def main():
    doc, ids = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    xml = ('<mxfile host="drawio" agent="CMAS scripts/build-index-q-uml-drawio.py" '
           'version="24.0.0">' + doc.xml('index-q · use case') + '</mxfile>\n')
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(xml)
    print('wrote', OUT.relative_to(ROOT))
    print('%d use case · %d แพ็กเกจ · สัญกรณ์ตาม UML-Layer2' % (len(ids), len(PKG_ORDER)))
    print('  %-22s %s' % (ROLE_TH['ADMIN'], '1.1 1.2 1.3 1.4 1.5 1.6 2.1 2.3 2.4'))
    for r in reversed(CHAIN):
        print('  %-22s %s' % (ROLE_TH[r],
                              ' '.join(sorted(k for k, v in placed.items() if v == r))))
    print('  %-22s %s' % (m.GUEST_TH, ' '.join(m.GUEST_UC)))


if __name__ == '__main__':
    main()
