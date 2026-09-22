# -*- coding: utf-8 -*-
"""UML use case diagram of docs/pages/index-q.html, as a draw.io file.

   Output: docs/uml/index-q/index-q-usecase.drawio — four pages
     1 · ภาพรวมระบบ            summary level: actors, their generalization, nine packages
     2 · ผู้ดูแลระบบ              packages 1–2 in full
     3 · ผู้สอน                  every course use case — ONE course role since D1
     4 · รายการ use case          the catalogue the diagrams pair with, same data

   Revised 2569-09-18 for D1 and D6. It drew six pages while index-q.html had
   the ผู้ช่วยสอน ◁ ผู้สอนร่วม ◁ ผู้ประสานงาน ladder; D1 collapsed that to one
   INSTRUCTOR role, so pages 3–5 became one. D6 added self-registration: a
   ผู้ยังไม่มีบัญชี actor and use cases 9.3–9.5, which no PERM role performs.

   NOTATION — UML 2.5, the way a software-engineering reviewer expects it:
     uc diagram frame · subject boundary · packages as folders · stick-figure
     actors with a left-side generalization ladder · «include» / «extend» as
     dashed open arrows · extension points compartment on every extended base ·
     a condition note on every conditional «extend» · a title block per page.
     Monochrome; the one tint marks a use case the prototype adds to UML.md.

   DERIVED from index-q.html rather than drawn from memory:
     * use case labels come from its USE_CASES array, verbatim — except the
       compound "A / B" ones listed in SPLITS, split one per user action
     * which ROLE PAGE a use case lands on comes from its PERM matrix — each
       use case names the capability it exercises and goes to the LOWEST course
       role holding it. CHAIN is one role long now; the machinery is kept so a
       role added back to PERM lands on its own page instead of vanishing — and
       an unknown role in PERM stops the build
     * include/extend structure follows the team's UML-Layer2.drawio, and
       UML.md's rule that an included/extending use case has no direct actor
       line. Where an extension needs MORE rights than its base, the extend
       carries a condition — computed from PERM, not typed.

   The build REFUSES to write the file, naming the problem, when:
     * a capability is missing from PERM, or an include would need more rights
       than the use case including it
     * any line — association, generalization, include/extend or note anchor —
       passes within 4px of a use case or actor that is not one of its ends
     * a package leaves the system boundary, or two boxes overlap
   Those rules were checked against draw.io's own rendering, not only against
   this script's model of it: measuring the real SVG caught a note anchor the
   model had exempted by mistake.

     python scripts/build-usecase-drawio.py
"""
import hashlib
import io
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

# Windows consoles default to cp1252; the refusal messages go to stderr and are
# in Thai, so both streams need it or the one message that matters is unreadable
for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'docs' / 'pages' / 'index-q.html'
OUT = ROOT / 'docs' / 'uml' / 'index-q' / 'index-q-usecase.drawio'

# ══ read the prototype ═══════════════════════════════════════════════
src = io.open(APP, encoding='utf-8').read()

UC_TEXT, PKG_TEXT = {}, {}
for m in re.finditer(r"\['(\d)','([^']*)','(\d\.\d)','([^']*)','([A-Z]+)',", src):
    PKG_TEXT[m.group(1)] = m.group(2)
    UC_TEXT[m.group(3)] = m.group(4)

_at = src.index('const PERM = {')
_pb = src[_at:src.index('};', _at)]
# a row's value is either a literal list or a named const declared just above the
# matrix (TEACH, NODEL, …). Resolve the names rather than hard-coding them — the
# first version knew only 'ALL' and silently read an EMPTY matrix when that const
# was renamed, which is the one failure mode this whole script exists to prevent.
ALIAS = {m.group(1): re.findall(r"'([A-Z]+)'", m.group(2))
         for m in re.finditer(r"const ([A-Z][A-Z0-9_]*)\s*=\s*(\[[^\]]*\]);", src[:_at])}
# ... and a name may alias another name (const NODEL = TEACH;) — read it through
for _m in re.finditer(r"const ([A-Z][A-Z0-9_]*)\s*=\s*([A-Z][A-Z0-9_]*);", src[:_at]):
    if _m.group(2) in ALIAS:
        ALIAS[_m.group(1)] = ALIAS[_m.group(2)]
PERM = {m.group(1): (ALIAS[m.group(2)] if m.group(2) in ALIAS
                     else re.findall(r"'([A-Z]+)'", m.group(2)))
        for m in re.finditer(r"'([a-z.]+)':\s*([A-Z][A-Z0-9_]*|\[[^\]]*\])", _pb)}

assert len(UC_TEXT) == 34, 'expected 34 use cases in USE_CASES, found %d' % len(UC_TEXT)
assert len(PERM) >= 17, 'PERM matrix not found in index-q.html'
assert all(PERM.values()), 'capabilities read as empty: %s — an alias was not resolved' % (
    [k for k, v in PERM.items() if not v],)

# D1 (2569-09-14): one course role. The chain is kept as a list so the code
# still reads "lowest role holding a capability" — it is now one role long.
CHAIN = ['INSTRUCTOR']
ROLE_TH = {'INSTRUCTOR': 'ผู้สอน', 'ADMIN': 'ผู้ดูแลระบบ'}
assert set(r for v in PERM.values() for r in v) <= set(CHAIN) | {'ADMIN'}, (
    'PERM names a role this script does not know: %s — a course role was added back?'
    % sorted(set(r for v in PERM.values() for r in v) - set(CHAIN) - {'ADMIN'}))


def lowest(cap):
    """Most general course role holding the capability. 'view' is P01: every
       course role reads every page. ADMIN means no course role holds it."""
    if cap == 'view':
        return CHAIN[0]
    if cap not in PERM:
        raise SystemExit('capability %r is not in PERM in index-q.html' % cap)
    for r in CHAIN:
        if r in PERM[cap]:
            return r
    return 'ADMIN'


# ══ use cases index-q.html adds (not in UML.md / USE_CASES) ══════════
NEW = {
    '2.6': 'เพิ่ม / ถอดผู้สอนในรายวิชา',
    '5.6': 'ระบุนักศึกษาที่ต้องติดตาม',
    '6.6': 'แก้ไขคะแนนบนหน้าเว็บ',
    '7.6': 'ลบนักศึกษาออกจากรายวิชา',
    '8.1': 'กำหนดขอบเขตเกรด',
    '8.2': 'ประมวลผลและตรึงเกรด',
    '8.3': 'ปรับเกรดรายบุคคล',
    '9.1': 'แก้ไขชื่อและอีเมลของตนเอง',
    '9.2': 'เปลี่ยนรหัสผ่านของตนเอง',
    # D6 / D7 — self-registration. The actor is someone with NO account yet,
    # so these are the only use cases no role in PERM performs (GUEST below).
    '9.3': 'ลงทะเบียนด้วยอีเมลคณะ',
    '9.4': 'ยืนยันอีเมล',
    '9.5': 'ลงทะเบียนด้วยบัญชี Google คณะ',
}
GUEST_UC = ['9.3', '9.4', '9.5']
GUEST_TH = 'ผู้ยังไม่มีบัญชี'
PKG_TEXT.update({'8': 'ตัดเกรด', '9': 'บัญชีของฉัน'})

# ══ compound use cases split into one use case per user action ══════
# A label of the form "A / B" hides two actions behind one ellipse. Split
# ONLY where index-q.html really has two separate actions — two buttons, two
# data-act values — never where both halves are one form or one button:
#   2.6  staff-add        · staff-del                     → เพิ่ม | ถอด
#   3.2  crud-edit clo    · crud-delete clo               → แก้ไข | ลบ
#   4.5  crud-edit obj.   · crud-delete objective         → แก้ไข | ลบ
# Deliberately NOT split: 2.5 Sec/ภาคการศึกษา (fields of one course
# form), 8.2 ประมวลผลและตรึงเกรด (one run-grading button does both), 7.3 and
# 9.1 (one validation pass / one form), 5.1 (already broken down by «include»).
#
# Numbering keeps the base number for the first action and gives the second
# the next number free in its package. 3.4 is skipped: UML.md still assigns it
# to "เชื่อมโยง CLO กับ PLO", and one number meaning two things is exactly
# what scripts/check-diagrams.py exists to catch.
#
# The capability of the new half is written here, not inherited, because a
# delete is often a different capability from an edit (student.delete,
# activity.delete). For these three it is the same — verified against capOf():
# crud-delete kind clo/objective -> clo.write, staff-del -> staff.write.
SPLITS = [
    # base   first half            new    second half         capability of 2nd
    ('2.6', 'เพิ่มผู้สอนในรายวิชา',   '2.8', 'ถอดผู้สอนออกจากรายวิชา', 'staff.write'),
    ('3.2', 'แก้ไข CLO',            '3.5', 'ลบ CLO',              'clo.write'),
    ('4.5', 'แก้ไขวัตถุประสงค์',     '4.6', 'ลบวัตถุประสงค์',       'clo.write'),
]
SPLIT_FROM = {}          # code -> (original code, original label) — for the catalogue
for _base, _a, _new, _b, _cap in SPLITS:
    assert _new not in NEW and _new not in UC_TEXT, 'split target %s is already a use case' % _new
    _orig = NEW.get(_base) or UC_TEXT[_base]
    assert ' / ' in _orig, '%s "%s" is no longer a compound label — remove it from SPLITS' % (_base, _orig)
    SPLIT_FROM[_base] = SPLIT_FROM[_new] = (_base, _orig)
    if _base in NEW:
        NEW[_base] = _a
    else:
        UC_TEXT[_base] = _a
    NEW[_new] = _b


def label(code):
    return code + ' ' + (NEW.get(code) or UC_TEXT[code])


# ══ the model — packages 2–8 as UNITS ════════════════════════════════
# A unit is one use case an actor touches directly, plus what it includes or
# is extended by: (package, direct use case, capability, [(child, rel, from, cap)]).
# rel 'include' draws base→child; 'extend' draws child→base (UML direction).
# A child cap of None means "same rights as its base".
UNITS = [
    ('2', '2.1', 'course.create', []),
    ('2', '2.2', 'course.settings', []),
    ('2', '2.5', 'course.settings', []),
    ('2', '2.6', 'staff.write', []),
    ('2', '2.3', 'course.delete', []),
    ('3', '3.1', 'clo.write', [('3.3', 'include', '3.1', 'clo.write')]),
    ('3', '3.2', 'clo.write', []),
    ('4', '4.1', 'clo.write', [('4.2', 'include', '4.1', 'activity.write'),
                               ('4.3', 'include', '4.2', 'activity.write'),
                               ('4.4', 'include', '4.1', 'activity.write')]),
    ('4', '4.5', 'clo.write', []),
    ('5', '5.1', 'view', [('5.2', 'include', '5.1', None),
                          ('5.3', 'include', '5.1', None),
                          ('5.6', 'include', '5.3', None),
                          ('5.4', 'extend', '5.1', None),
                          ('5.5', 'extend', '5.1', 'results.export')]),
    ('6', '6.1', 'score.import', [('6.3', 'include', '6.1', None),
                                  ('6.5', 'extend', '6.1', None)]),
    ('6', '6.2', 'score.export', []),
    ('6', '6.4', 'score.export', []),
    ('6', '6.6', 'score.edit', []),
    ('7', '7.1', 'student.write', [('7.3', 'include', '7.1', None),
                                   ('7.5', 'extend', '7.1', None)]),
    ('7', '7.2', 'score.export', []),
    ('7', '7.4', 'score.export', []),
    ('7', '7.6', 'student.delete', []),
    ('8', '8.1', 'band.write', []),
    ('8', '8.2', 'grading.run', [('8.3', 'extend', '8.2', 'grade.override')]),
]
for _base, _a, _new, _b, _cap in SPLITS:
    _i = next(i for i, u in enumerate(UNITS) if u[1] == _base)
    assert not UNITS[_i][3], 'split base %s has include/extend children — split them by hand' % _base
    UNITS.insert(_i + 1, (UNITS[_i][0], _new, _cap, []))


# Where a use case is DRAWN, when that differs from the lowest role holding its
# capability. Empty since D1: with one course role there is nowhere else to
# draw it. (It held course.create -> LEAD while the ladder existed.)
DIAGRAM_ROLE = {}


def resolve():
    """Where each unit and each child lands, and the conditions on extends.
       Returns {role: [(pkg, direct, [children...])]}, plus a flat record of
       which role every use case was attached to — the test hook."""
    pages = {r: [] for r in CHAIN}
    placed = {}
    for pkg, uc, cap, kids in UNITS:
        base_role = DIAGRAM_ROLE.get(cap) or lowest(cap)
        if base_role == 'ADMIN':
            raise SystemExit('%s maps to a capability no course role holds' % uc)
        own, lifted = [], []
        for kid, rel, frm, kcap in kids:
            kr = lowest(kcap) if kcap else base_role
            if CHAIN.index(kr) < CHAIN.index(base_role):
                kr = base_role                      # a child is never available below its base
            if kr == base_role:
                own.append((kid, rel, frm, None))
                placed[kid] = base_role
            elif rel == 'extend':
                # needs more rights than its base: it goes to the higher role's
                # page, extending an INHERITED copy of the base, with a guard
                lifted.append((kr, kid, frm))
                placed[kid] = kr
            else:
                raise SystemExit('%s is «include»d by %s but needs %s rights while %s has %s — '
                                 'an include cannot be conditional; make it an extend'
                                 % (kid, frm, ROLE_TH[kr], frm, ROLE_TH[base_role]))
        pages[base_role].append((pkg, uc, own, False))
        placed[uc] = base_role
        for kr, kid, frm in lifted:
            pages[kr].append((pkg, frm, [(kid, 'extend', frm, kr)], True))
    return pages, placed


# ══ notation — UML 2.5, drawn the way a software-engineering reviewer expects ═
# Monochrome ink on white. Colour carries exactly one meaning — a use case the
# prototype adds that UML.md does not have yet — and even that is a light tint,
# so the diagram still reads correctly printed in black and white.
VERSION = '3.0 · 2026-09-18'

INK, MUTED, FAINT, TINT = '#1E233C', '#6B7192', '#9AA0BE', '#EEF0F8'
FONT = ('fontFamily=IBM Plex Sans Thai;'
        'fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DIBM%2BPlex%2BSans%2BThai;')

S_FRAME = ('shape=umlFrame;whiteSpace=wrap;html=1;width={W};height=28;boundedLbl=1;verticalAlign=top;'
           'align=left;spacingLeft=10;spacingTop=5;fillColor=#FFFFFF;strokeColor=' + INK +
           ';fontColor=' + INK + ';fontSize=12;' + FONT)
S_SUBJECT = ('rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=' + INK + ';strokeWidth=1.5;'
             'verticalAlign=top;align=center;spacingTop=6;fontColor=' + INK + ';fontSize=13;' + FONT)
S_PKG = ('shape=folder;tabWidth=56;tabHeight=14;tabPosition=left;html=1;whiteSpace=wrap;container=1;'
         'collapsible=0;recursiveResize=0;fillColor=#FAFAFC;strokeColor=' + MUTED + ';verticalAlign=top;'
         'align=left;spacingLeft=10;spacingTop=16;fontColor=' + INK + ';fontSize=11;' + FONT)
S_UC = ('ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=' + INK + ';fontColor=' + INK +
        ';fontSize=11;spacing=6;' + FONT)
S_UC_NEW = S_UC.replace('fillColor=#FFFFFF', 'fillColor=' + TINT)
S_UC_INH = S_UC.replace('strokeColor=' + INK, 'strokeColor=' + FAINT).replace('fontColor=' + INK, 'fontColor=' + FAINT)
S_SUMMARY = S_UC.replace('fontSize=11', 'fontSize=12')
S_ACTOR = ('shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;'
           'fillColor=#FFFFFF;strokeColor=' + INK + ';fontColor=' + INK + ';fontSize=11;' + FONT)
S_ACTOR_CTX = S_ACTOR.replace('strokeColor=' + INK, 'strokeColor=' + FAINT).replace('fontColor=' + INK, 'fontColor=' + FAINT)
S_ASSOC = 'endArrow=none;html=1;strokeColor=' + INK + ';'
# every association ends on the use case's left tip. Ellipses in a column are
# left-aligned, so a neighbour can only begin at or right of that tip — the
# line cannot pass through one. Centre-to-centre lines did, on three pages.
S_ASSOC_L = S_ASSOC + 'entryX=0;entryY=0.5;entryDx=0;entryDy=0;'
S_GEN = 'endArrow=block;endFill=0;endSize=14;html=1;strokeColor=' + INK + ';'
S_GEN_CTX = S_GEN.replace(INK, FAINT)
S_DEP = ('endArrow=open;endSize=10;dashed=1;dashPattern=6 4;html=1;strokeColor=' + INK + ';fontColor=' + INK +
         ';fontSize=10;labelBackgroundColor=#FFFFFF;' + FONT)
S_NOTE = ('shape=note;size=12;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=' + MUTED + ';fontColor=' + INK +
          ';fontSize=10;align=left;verticalAlign=top;spacingLeft=8;spacingTop=4;spacingRight=14;' + FONT)
S_ANCHOR = 'endArrow=none;dashed=1;dashPattern=2 3;html=1;strokeColor=' + MUTED + ';'
S_TEXT = 'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontColor=' + INK + ';fontSize=10;' + FONT

# ── extension points — a base use case names where it can be extended ──
# UML 2.5 §18.1.3: an «extend» targets a named extension point of its base,
# and a condition, when there is one, sits in a note on the relationship.
EXT_POINTS = {'5.1': ['ติดตามรายบุคคล', 'ส่งออกรายงาน'],
              '6.1': ['มีแถวไม่ผ่านการตรวจ'],
              '7.1': ['มีแถวไม่ผ่านการตรวจ'],
              '8.2': ['ปรับเกรดด้วยมือ']}
EXT_OF = {'5.4': ('ติดตามรายบุคคล', None),
          '5.5': ('ส่งออกรายงาน', 'ROLE'),                     # condition comes from PERM
          '6.5': ('มีแถวไม่ผ่านการตรวจ', '{มีแถวที่ถูกปฏิเสธอย่างน้อยหนึ่งแถว}'),
          '7.5': ('มีแถวไม่ผ่านการตรวจ', '{มีแถวที่ถูกปฏิเสธอย่างน้อยหนึ่งแถว}'),
          '8.3': ('ปรับเกรดด้วยมือ', None)}

W_UC, H_UC = 200, 56
NOTE_ROW = 50                   # room reserved under a row whose «extend» carries a condition
COL = 300                       # 80px between ellipses — room for «include» / «extend»
GAP_ROW = 18
PAD = 20


def uc_size(code):
    if code in EXT_POINTS:
        return 228, 72 + 15 * len(EXT_POINTS[code])
    return W_UC, H_UC


def uc_value(code):
    text = label(code)
    if code in EXT_POINTS:
        pts = '<br>'.join('<i>%s</i>' % p for p in EXT_POINTS[code])
        text += ('<hr style="border:none;border-top:1px solid %s;margin:4px 6px">'
                 '<span style="font-size:9px;color:%s">extension points</span><br>%s' % (INK, MUTED, pts))
    return text


def role_label(role):
    return '%s<br><span style="color:%s;font-size:9px">%s</span>' % (ROLE_TH[role], MUTED, role)


# ══ page model — every shape keeps absolute geometry for the checks ════
class Page:
    def __init__(self, title, kind='uc'):
        self.title, self.kind = title, kind
        self.pw, self.ph = 1654, 1169
        self.cells, self.shapes, self.edges, self.n = [], {}, [], 0

    def _id(self, p):
        self.n += 1
        return '%s%d' % (p, self.n)

    def vertex(self, value, style, x, y, w, h, parent='1', role='box'):
        cid = self._id('v')
        self.cells.append('<mxCell id="%s" value="%s" style="%s" vertex="1" parent="%s">'
                          '<mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
                          % (cid, escape(value, {'"': '&quot;'}), style, parent, x, y, w, h))
        ax, ay = (x, y) if parent == '1' else (self.shapes[parent]['x'] + x, self.shapes[parent]['y'] + y)
        self.shapes[cid] = {'role': role, 'x': ax, 'y': ay, 'w': w, 'h': h, 'parent': parent,
                            'name': re.sub(r'<[^>]+>', ' ', value).split('  ')[0][:34]}
        return cid

    def edge(self, a, b, style, value='', kind='dep', path=None):
        """path: explicit polyline [(x, y), ...] from source port to target port.
           Given, it is written as waypoints and the check walks exactly it."""
        cid = self._id('e')
        if kind == 'assoc':
            style = S_ASSOC_L
        pts = ''
        if path:
            pts = '<Array as="points">%s</Array>' % ''.join(
                '<mxPoint x="%d" y="%d"/>' % p for p in path[1:-1])
        self.cells.append('<mxCell id="%s" value="%s" style="%s" edge="1" parent="1" source="%s" target="%s">'
                          '<mxGeometry relative="1" as="geometry">%s</mxGeometry></mxCell>'
                          % (cid, escape(value, {'"': '&quot;'}), style, a, b, pts))
        self.edges.append((a, b, kind, cid, path))
        return cid

    def gen(self, child, parent, style=None):
        """Generalization as a ladder on the LEFT of both stick figures.
           A straight arrow up from the child lands its triangle on the parent's
           NAME, which sits under the figure — every arrow in the first render
           did exactly that. Leaving and entering at the left keeps names clear."""
        c, p = self.shapes[child], self.shapes[parent]
        cy, py = c['y'] + c['h'] * .35, p['y'] + p['h'] * .35
        jog = min(c['x'], p['x']) - 26
        path = [(c['x'], cy), (jog, cy), (jog, py), (p['x'], py)]
        st = (style or S_GEN) + 'exitX=0;exitY=0.35;exitDx=0;exitDy=0;entryX=0;entryY=0.35;entryDx=0;entryDy=0;'
        return self.edge(child, parent, st, kind='gen', path=path)

    def xml(self):
        pid = 'p' + hashlib.sha1(self.title.encode('utf-8')).hexdigest()[:10]
        return ('<diagram id="%s" name="%s"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" '
                'guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
                'pageWidth="%d" pageHeight="%d" background="#FFFFFF" math="0" shadow="0"><root>'
                '<mxCell id="0"/><mxCell id="1" parent="0"/>%s</root></mxGraphModel></diagram>'
                % (pid, escape(self.title), self.pw, self.ph, ''.join(self.cells)))

    def fit_frame(self, margin=30):
        """Grow the UML frame to enclose every top-level shape, and the page to
           enclose the frame. Drawn first, sized last."""
        fid = next(k for k, v in self.shapes.items() if v['role'] == 'frame')
        f = self.shapes[fid]
        right = max(v['x'] + v['w'] for v in self.shapes.values() if v['parent'] == '1' and v is not f)
        bottom = max(v['y'] + v['h'] + (30 if v['role'] == 'actor' else 0)
                     for v in self.shapes.values() if v['parent'] == '1' and v is not f)
        f['w'], f['h'] = int(right - f['x'] + margin), int(bottom - f['y'] + margin)
        i = next(n for n, c in enumerate(self.cells) if 'id="%s"' % fid in c)
        self.cells[i] = re.sub(r'width="\d+" height="\d+"', 'width="%d" height="%d"' % (f['w'], f['h']),
                               self.cells[i], count=1)
        self.pw, self.ph = max(1654, f['x'] + f['w'] + 40), max(1169, f['y'] + f['h'] + 40)


def thai_width(s, px=7.2):
    """Rough rendered width — Thai vowel and tone marks take no advance."""
    return int(len(re.sub(r'[ัิ-ฺ็-๎]', '', s)) * px)


def frame_and_subject(pg, x, y, w, h, subject_title, sx, sy, sw, sh):
    tab = f'uc&nbsp;&nbsp;{pg.title}'
    pg.vertex(tab, S_FRAME.replace('{W}', str(thai_width(pg.title) + 60)), x, y, w, h, role='frame')
    pg.vertex(subject_title, S_SUBJECT, sx, sy, sw, sh, role='subject')


def title_block(pg, x, y, view, source):
    rows = [('ไดอะแกรม', 'Use Case — ' + view), ('ระบบ', 'CMAS · ต้นแบบ docs/pages/index-q.html'),
            ('ที่มา', source), ('สร้างโดย', 'scripts/build-usecase-drawio.py'),
            ('ฉบับ', VERSION)]
    body = ''.join('<tr><td style="padding:2px 8px;color:%s;border-bottom:1px solid #E4E5F0;white-space:nowrap">%s</td>'
                   '<td style="padding:2px 8px;border-bottom:1px solid #E4E5F0">%s</td></tr>'
                   % (MUTED, k, v) for k, v in rows)
    html = ('<table style="border-collapse:collapse;border:1px solid %s;width:100%%;font-size:10px">%s</table>'
            % (INK, body))
    return pg.vertex(html, S_TEXT, x, y, 400, 22 * len(rows) + 4, role='box')


def legend(pg, x, y, inherited=True):
    pg.vertex('สัญลักษณ์เฉพาะเอกสารนี้ (นอกเหนือ UML 2.5)', S_TEXT + 'fontColor=' + MUTED + ';', x, y, 300, 16)
    pg.vertex('มีใน UML.md', S_UC, x, y + 20, 110, 32, role='legend')
    pg.vertex('ต้นแบบเพิ่ม', S_UC_NEW, x + 118, y + 20, 110, 32, role='legend')
    if inherited:
        pg.vertex('สืบทอดมา', S_UC_INH, x + 236, y + 20, 100, 32, role='legend')


# ══ page 1 · ภาพรวมระบบ ═════════════════════════════════════════════
def page_overview(pages):
    pg = Page('CMAS · ภาพรวมระบบ')
    # ordered so each actor's packages sit nearest it: the course chain's at the
    # top, the admin's at the bottom beside the admin — no line has to cross a
    # stick figure to reach its package
    order = ['9', '6', '5', '7', '3', '4', '8', '2', '1']
    col_x, top, pitch = 620, 110, 84
    body_h = pitch * len(order)
    frame_and_subject(pg, 20, 20, 1500, body_h + 250, 'CMAS', 440, 60, 560, body_h + 60)

    base = pg.vertex('<i>ผู้ใช้ระบบ</i>', S_ACTOR, 260, 90, 34, 64, role='actor')
    A = {'ADMIN': pg.vertex(role_label('ADMIN'), S_ACTOR, 110, 980, 34, 64, role='actor'),
         'INSTRUCTOR': pg.vertex(role_label('INSTRUCTOR'), S_ACTOR, 260, 480, 34, 64, role='actor')}
    pg.gen(A['INSTRUCTOR'], base)
    pg.gen(A['ADMIN'], base)          # joins the same triangle — UML's shared-target style
    # D6 · someone at the faculty domain with no account yet. Not a ผู้ใช้ระบบ,
    # so no generalization — registering is what makes them one.
    guest = pg.vertex(GUEST_TH + '<br><span style="color:%s;font-size:9px">@fac.ac.th</span>' % MUTED,
                      S_ACTOR, 110, 260, 34, 64, role='actor')

    P = {}
    for i, code in enumerate(order):
        st = S_SUMMARY.replace('fillColor=#FFFFFF', 'fillColor=' + TINT) if code in ('8', '9') else S_SUMMARY
        P[code] = pg.vertex(code + ' · ' + PKG_TEXT[code], st, col_x, top + i * pitch, 240, 60, role='uc')

    lines = {('BASE', '9'), ('ADMIN', '1'), ('ADMIN', '2')}
    for role, units in pages.items():
        for pkg, _uc, _kids, _inh in units:
            lines.add((role, pkg))
    for who, code in sorted(lines):
        pg.edge(base if who == 'BASE' else A[who], P[code], S_ASSOC, kind='assoc')
    pg.edge(guest, P['9'], S_ASSOC, kind='assoc')

    note = pg.vertex('ภาพนี้อยู่ระดับ <i>summary use case</i> — หนึ่งวงรีคือหนึ่งแพ็กเกจ '
                     'รายละเอียดอยู่หน้า 2–3 และรายการครบทุกข้ออยู่หน้า 4<br><br>'
                     'ในรายวิชามี<b>บทบาทเดียว</b> — ผู้สอนทุกคนของวิชามีสิทธิ์เท่ากัน (D1) · '
                     'ผู้ดูแลระบบ<b>ไม่ทำงานในรายวิชา</b> — สร้าง ลบ และผูกผู้สอนเข้ากับรายวิชา '
                     'แล้วงานในรายวิชาเป็นของผู้สอน · '
                     'ผู้ยังไม่มีบัญชีลงทะเบียนเองได้ด้วยอีเมลคณะหรือ Google (D6)',
                     S_NOTE, 1050, 110, 400, 124, role='note')
    # P14/P16/P17 · 2.1 create, 2.3 delete and staffing belong to admin AND instructor
    issue = pg.vertex('แพ็กเกจ 2 · <b>สร้างและลบรายวิชา</b> (2.1 · 2.3) ทำได้ทั้งผู้ดูแลระบบ '
                      'และผู้สอน (ลบได้เฉพาะวิชาที่ตนสอน) · <b>ผู้ดูแลระบบ</b> แต่งตั้งผู้สอน (2.4) · '
                      '<b>ผู้สอน</b> เพิ่ม/ถอดเพื่อนผู้สอน (2.6 · 2.8) และแก้ข้อมูลวิชา (2.2 · 2.5)',
                      S_NOTE, 1050, pg.shapes[P['2']]['y'] - 8, 400, 90, role='note')
    pg.edge(issue, P['2'], S_ANCHOR + 'entryX=1;entryY=0.5;entryDx=0;entryDy=0;', kind='anchor')
    legend(pg, 440, body_h + 140, inherited=False)
    title_block(pg, 1090, body_h + 130, 'ภาพรวมระบบ (summary level)',
                'USE_CASES + PERM ใน index-q.html')
    return pg


# ══ package grid — the building block of pages 2–3 ═══════════════════
def package(pg, pkg_code, title, x, y, grid, ncol, styles):
    """grid: rows of cells; a cell is a use case code or None. Returns
       (ids, height). Every package on a page gets the same width so their
       left edges and column lines align — a reviewer reads alignment as care."""
    # a row that is the string 'NOTE' reserves room for a condition note
    heights = [NOTE_ROW if row == 'NOTE' else max([uc_size(c)[1] for c in row if c] + [H_UC])
               for row in grid]
    grid = [[] if row == 'NOTE' else row for row in grid]
    w = ncol * COL - (COL - 228) + 2 * PAD
    h = sum(heights) + GAP_ROW * (len(grid) - 1) + 38 + PAD
    fid = pg.vertex(title, S_PKG, x, y, w, h, role='package')
    ids, cy = {}, 38
    for row, rh in zip(grid, heights):
        for ci, code in enumerate(row):
            if not code:
                continue
            cw, ch = uc_size(code)
            cx = PAD + ci * COL
            ids[code] = pg.vertex(uc_value(code), styles.get(code, S_UC_NEW if code in NEW else S_UC),
                                  cx, cy + (rh - ch) // 2, cw, ch, parent=fid, role='uc')
        cy += rh + GAP_ROW
    return ids, h


def gutter_route(pg, a, b):
    """A straight centre-to-centre dependency is fine while the two ellipses are
       a row apart, and stops being fine as soon as a package grows a fourth
       child — the line then crosses the ellipses stacked between them. When it
       does, run the line out of the source's left tip, down the empty gutter
       between the two columns, and into the target's right tip. Returns None
       when the straight line was already clear, so nothing is redrawn without
       cause. The clearance check still walks whatever comes back: a gutter that
       is itself blocked refuses the build like any other bad line."""
    sa, sb = pg.shapes[a], pg.shapes[b]
    ay, by = sa['y'] + sa['h'] / 2, sb['y'] + sb['h'] / 2
    straight = [(sa['x'] + sa['w'] / 2, ay), (sb['x'] + sb['w'] / 2, by)]
    if not path_hits(pg.shapes, straight, {a, b}):
        return None, ''
    right = sb['x'] + sb['w']                       # target sits in the left column
    if not (right < sa['x']):
        return None, ''                             # not the column pair this handles
    gx = (right + sa['x']) / 2
    return ([(sa['x'], ay), (gx, ay), (gx, by), (right, by)],
            'exitX=0;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;')


def dep(pg, ids, kid, rel, frm, cond_role=None, notes=None):
    if rel == 'include':
        src, dst = ids[frm], ids[kid]
        path, ports = gutter_route(pg, src, dst)
        pg.edge(src, dst, S_DEP + ports, '«include»', kind='dep', path=path)
        return
    path, ports = gutter_route(pg, ids[kid], ids[frm])
    e = pg.edge(ids[kid], ids[frm], S_DEP + ports, '«extend»', kind='dep', path=path)
    point, cond = EXT_OF.get(kid, (None, None))
    if cond == 'ROLE':
        # the guard exists only while PERM says the extension needs MORE rights
        # than its base. When the matrix levels them, the extend is plain — an
        # unconditional «extend» is legal UML, a condition naming no role is not.
        cond = ('{บทบาทในรายวิชา ≥ %s}' % ROLE_TH[cond_role]) if cond_role else None
    if point and cond and notes is not None:
        notes.append((e, kid, 'condition: %s<br>extension point: %s' % (cond, point)))


# ══ page 2 · ผู้ดูแลระบบ ═════════════════════════════════════════════
def page_admin():
    pg = Page('CMAS · ผู้ดูแลระบบ')
    ncol, x0 = 2, 470
    g1 = [['1.1', '1.4'], ['1.2'], ['1.3'], ['1.5'], ['1.6']]
    g2 = [['2.1', '2.4'], ['2.3']]
    # measure first, then draw — the frame and subject are sized from content
    probe = Page('probe')
    _, h1 = package(probe, '1', '', 0, 0, g1, ncol, {})
    _, h2 = package(probe, '2', '', 0, 0, g2, ncol, {})
    body = h1 + 24 + h2
    pw = ncol * COL - (COL - 228) + 2 * PAD
    frame_and_subject(pg, 20, 20, 1500, body + 200, 'CMAS', x0 - 30, 60, pw + 60, body + 60)
    i1, _ = package(pg, '1', '1 · ' + PKG_TEXT['1'], x0, 100, g1, ncol, {})
    i2, _ = package(pg, '2', '2 · ' + PKG_TEXT['2'], x0, 100 + h1 + 24, g2, ncol, {})
    admin = pg.vertex(role_label('ADMIN'), S_ACTOR, 180, 60 + (body + 60) // 2 - 40, 34, 64, role='actor')
    for c in ('1.1', '1.2', '1.3', '1.5', '1.6'):
        pg.edge(admin, i1[c], S_ASSOC, kind='assoc')
    for c in ('2.1', '2.3'):
        pg.edge(admin, i2[c], S_ASSOC, kind='assoc')
    dep(pg, i1, '1.4', 'include', '1.1')
    dep(pg, i2, '2.4', 'include', '2.1')

    side = x0 + pw + 70
    pg.vertex('กติกาที่ต้นแบบบังคับเพิ่ม<br>'
              '· 1.3 — ระงับผู้ดูแลที่ใช้งานอยู่คนสุดท้ายไม่ได้<br>'
              '· บัญชีผู้ดูแลระบบลบไม่ได้ ต้องลดบทบาทก่อน<br>'
              '· 1.5 — ตั้ง mustChangePassword และบันทึก AuthEvent (FR-07)<br>'
              '· 1.6 — อ่านจาก AuthEvent ซึ่งเสนอไว้ใน index-q.sql<br>'
              '· 2.4 — ผู้สอนของวิชาก็เพิ่มผู้สอนได้เอง (2.6 · P14)<br>'
              '· 2.1 สร้าง · 2.3 ลบรายวิชา — ผู้สอนทำได้เหมือนกัน (P17 · P16)<br>'
              '· ผู้ดูแลระบบ<b>ไม่ทำงานในรายวิชา</b> — 2.2 และ 2.5 '
              'เป็นของผู้สอน (P12) อยู่หน้า 3',
              S_NOTE, side, 100, 400, 152, role='note')
    legend(pg, side, 278, inherited=False)
    title_block(pg, side, body + 90, 'ผู้ดูแลระบบ', 'USE_CASES ใน index-q.html · include ตาม UML-Layer2')
    return pg


# ══ page 3 · one per course role (one role since D1) ═════════════════════════════════
def role_grid(units, pkg):
    """Rows for one package on one role page: column 0 is what the actor
       touches (or an inherited base), columns 1–2 what it includes / is
       extended by. Returns grid, the directly-touched codes, the dependencies."""
    grid, direct, deps, inh = [], [], [], []
    for p, uc, kids, inherited in units:
        if p != pkg:
            continue
        rows = [[uc]]
        (inh if inherited else direct).append(uc)
        firsts = [k for k in kids if k[2] == uc]
        seconds = [k for k in kids if k[2] != uc]
        for i, k in enumerate(firsts):
            if i == 0:
                rows[0].append(k[0])
            else:
                rows.append([None, k[0]])
        for k in seconds:
            for r in rows:
                if len(r) > 1 and r[1] == k[2]:
                    r.append(k[0])
                    break
        # an «extend» with a condition needs its note beside the line, and the
        # only place that does not cross either use case is straight below the
        # line's midpoint, in the gap between the columns — so reserve the row
        for r in rows:
            grid.append(r)
            if any(c and EXT_OF.get(c, (None, None))[1] for c in r):
                grid.append('NOTE')
        deps.extend(kids)
    return grid, direct, deps, inh


def page_role(num, role, units, placed):
    pg = Page('CMAS · ' + ROLE_TH[role])
    pkgs = sorted({u[0] for u in units})
    plans = {p: role_grid(units, p) for p in pkgs}
    ncol = max(max(len(r) for r in plans[p][0]) for p in pkgs)
    pw = ncol * COL - (COL - 228) + 2 * PAD

    probe = Page('probe')
    heights = {p: package(probe, p, '', 0, 0, plans[p][0], ncol, {})[1] for p in pkgs}
    body = sum(heights.values()) + 24 * (len(pkgs) - 1)
    x0 = 470
    frame_h = max(body + 220, 700)
    frame_and_subject(pg, 20, 20, 1560, frame_h, 'CMAS', x0 - 30, 60, pw + 60, body + 60)

    ids, direct, deps, styles = {}, [], [], {}
    y = 100
    for p in pkgs:
        grid, d, dp, inh = plans[p]
        for c in inh:
            styles[c] = S_UC_INH
        elsewhere = [c for c, r in placed.items() if c.split('.')[0] == p and r != role]
        title = p + ' · ' + PKG_TEXT[p] + ('  (บางส่วน)' if elsewhere else '')
        got, h = package(pg, p, title, x0, y, grid, ncol, styles)
        ids.update(got)
        direct += d
        deps += dp
        y += h + 24

    # the actor sits level with the middle of what it touches, so the fan of
    # association lines is as flat as the layout allows
    ys = [pg.shapes[ids[c]]['y'] + pg.shapes[ids[c]]['h'] / 2 for c in direct]
    ay = int(sum(ys) / len(ys)) - 40
    actor = pg.vertex(role_label(role), S_ACTOR, 180, ay, 34, 64, role='actor')
    for c in direct:
        pg.edge(actor, ids[c], S_ASSOC, kind='assoc')

    notes = []
    for kid, rel, frm, cond in deps:
        dep(pg, ids, kid, rel, frm, cond, notes)

    side = x0 + pw + 70
    ny = 100
    # a condition note sits beside the use case that extends, in the free column
    # of the same package, so its anchor is a few pixels long. The first version
    # stacked them in the margin and the dotted anchors crossed the whole page.
    base_of = {kid: frm for kid, rel, frm, _c in deps if rel == 'extend'}
    for e, kid, text in notes:
        pkg_id = pg.shapes[ids[kid]]['parent']
        x, y, _a, _m = place_condition_note(pg, ids[kid], ids[base_of[kid]], text, pg.shapes[pkg_id])
        n = pg.vertex(text, S_NOTE, x, y, 236, 44, role='cond')
        pg.edge(n, e, S_ANCHOR, kind='anchor')

    idx = CHAIN.index(role)
    if idx > 0:
        parent = CHAIN[idx - 1]
        p_actor = pg.vertex(role_label(parent), S_ACTOR_CTX, 180, ay + 170, 34, 64, role='actor')
        pg.gen(actor, p_actor, S_GEN_CTX)
        pg.vertex('สืบทอด use case ทั้งหมดของ%s (หน้า %d) · หน้านี้แสดงเฉพาะส่วนที่เพิ่ม'
                  % (ROLE_TH[parent], num - 1), S_NOTE, side, ny, 330, 44, role='note')
        ny += 60
    if role == 'INSTRUCTOR':
        pg.vertex('<b>บทบาทเดียวในรายวิชา (D1)</b> — ผู้สอนทุกคนของวิชาทำได้ทุกข้อในหน้านี้ '
                  'เท่ากัน ไม่มีผู้ประสานงาน / ผู้สอนร่วม / ผู้ช่วยสอนอีกแล้ว<br>'
                  'เงื่อนไขเดียวคือต้อง<b>สอนวิชานั้น</b> (CourseInstructor) — '
                  'ตรวจกับวิชาที่ถูกกระทำ ไม่ใช่วิชาที่แสดงอยู่ (SEC-3)<br>'
                  '2.1 สร้าง · 2.3 ลบรายวิชา ทำได้เหมือนผู้ดูแลระบบ (P17 · P16)',
                  S_NOTE, side, ny, 330, 116, role='note')
        ny += 132
    legend(pg, side, ny + 10, inherited=any(plans[p][3] for p in pkgs))
    title_block(pg, side, max(ny + 90, frame_h - 150), ROLE_TH[role] + ' (' + role + ')',
                'PERM ใน index-q.html · include/extend ตาม UML-Layer2')
    return pg


# ══ page 4 · รายการ use case ═════════════════════════════════════════
def page_catalogue(placed):
    """The table that pairs with the diagrams. Same data, so it cannot disagree
       with them: every row is computed from USE_CASES, NEW, UNITS and PERM."""
    pg = Page('CMAS · รายการ use case', kind='table')
    rel = {}
    for _p, uc, _cap, kids in UNITS:
        for kid, r, frm, _k in kids:
            txt = ('«include» จาก ' if r == 'include' else '«extend» ') + frm
            point, cond = EXT_OF.get(kid, (None, None))
            if r == 'extend' and point:
                txt += ' @ ' + point
            rel[kid] = txt
    rel.update({'1.4': '«include» จาก 1.1', '2.4': '«include» จาก 2.1', '9.4': '«include» จาก 9.3'})
    cap_of = {uc: cap for _p, uc, cap, _k in UNITS}
    for _p, _uc, _c, kids in UNITS:
        for kid, _r, _f, kcap in kids:
            if kcap:
                cap_of[kid] = kcap
    admin_cap = {'1': 'user.manage', '2.1': 'course.create', '2.3': 'course.delete',
                 '2.4': 'staff.write'}

    codes = sorted(set(UC_TEXT) | set(NEW), key=lambda c: tuple(int(x) for x in c.split('.')))
    rows = []
    for c in codes:
        pkg = c.split('.')[0]
        if c in GUEST_UC:
            actor = GUEST_TH
        elif pkg == '9':
            actor = 'ผู้ใช้ระบบ (ทุกบทบาท)'
        elif c in ('2.1', '2.3'):
            actor = ROLE_TH['ADMIN'] + ' · ' + ROLE_TH['INSTRUCTOR']
        elif pkg == '1' or c == '2.4':
            actor = ROLE_TH['ADMIN']
        elif c in placed:
            actor = ROLE_TH[placed[c]]
        else:
            actor = '—'
        cap = cap_of.get(c) or admin_cap.get(c) or admin_cap.get(pkg)
        if cap == 'view':
            cap = 'P01 · ทุกบทบาทอ่านได้'
        if not cap:
            # reached only through its base, so it carries the base's rights
            base = re.search(r'(\d\.\d)', rel.get(c, ''))
            cap = ('ตาม ' + base.group(1)) if base else (
                'ไม่ต้องมีบัญชี · เฉพาะ @fac.ac.th' if c in GUEST_UC else 'ทุกคน' if pkg == '9' else '—')
        if c in SPLIT_FROM:
            src = ('แยกจาก %s' % SPLIT_FROM[c][0]) if c != SPLIT_FROM[c][0] else 'แยกเป็น 2 ข้อ'
        else:
            src = 'ต้นแบบเพิ่ม' if c in NEW else 'UML.md'
        rows.append((c, (NEW.get(c) or UC_TEXT[c]), PKG_TEXT[pkg], actor, cap, rel.get(c, '—'), src))

    head = ['รหัส', 'use case', 'แพ็กเกจ', 'actor หลัก', 'สิทธิ์ (PERM)', 'ความสัมพันธ์', 'ที่มา']
    # fixed column widths: draw.io ignores width:100% on an HTML label, so the
    # table shrank to half the frame and left the right half empty
    widths = [52, 280, 210, 290, 190, 300, 100]
    th = ''.join('<th style="width:%dpx;text-align:left;padding:5px 8px;border-bottom:1.5px solid %s;color:%s;'
                 'font-weight:500;font-size:9.5px;letter-spacing:.06em">%s</th>' % (wd, INK, MUTED, hd)
                 for wd, hd in zip(widths, head))
    trs = []
    for r in rows:
        bg = TINT if r[0] in NEW else '#FFFFFF'
        trs.append('<tr style="background:%s">%s</tr>' % (bg, ''.join(
            '<td style="padding:3px 8px;border-bottom:1px solid #E4E5F0;white-space:nowrap">%s</td>' % escape(v)
            for v in r)))
    table = ('<table style="border-collapse:collapse;width:%dpx;table-layout:fixed;font-size:10px">' % sum(widths) +
             '<thead><tr>%s</tr></thead><tbody>%s</tbody></table>' % (th, ''.join(trs)))
    h = 28 + 19 * len(rows)
    pg.vertex('uc&nbsp;&nbsp;' + pg.title, S_FRAME.replace('{W}', str(thai_width(pg.title) + 60)), 20, 20, 1500, h + 230, role='frame')
    pg.vertex(table, S_TEXT, 50, 70, sum(widths), h, role='box')
    pg.vertex('%d use case · %d จาก UML.md · %d ที่ต้นแบบเพิ่ม · %d แยกย่อยจากข้อที่มี "/" (แถวพื้นสีคือข้อที่ไม่อยู่ใน UML.md) · '
              'actor หลักอ่านจากเมทริกซ์ PERM — ในรายวิชามีบทบาทเดียวคือผู้สอน (D1)'
              % (len(rows), len(UC_TEXT), len(NEW) - len(SPLITS), len(SPLITS)), S_TEXT + 'fontColor=' + MUTED + ';', 50, h + 90, 780, 34)
    title_block(pg, 50 + sum(widths) - 400, h + 90, 'รายการ use case', 'USE_CASES + PERM ใน index-q.html')
    return pg


# ══ checks — the build refuses to write a diagram a reviewer would mark down ═
def _inside(px, py, s, shrink=1.5):
    if s['role'] in ('uc', 'legend'):
        rx, ry = s['w'] / 2 - shrink, s['h'] / 2 - shrink
        cx, cy = s['x'] + s['w'] / 2, s['y'] + s['h'] / 2
        return ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 < 1
    extra = 30 if s['role'] == 'actor' else 0            # the name under a stick figure
    return s['x'] + shrink < px < s['x'] + s['w'] - shrink and s['y'] + shrink < py < s['y'] + s['h'] + extra - shrink


def centre(s):
    return s['x'] + s['w'] / 2, s['y'] + s['h'] / 2


def path_hits(S, pts, skip, clearance=4):
    """Names of use cases / actors a polyline passes through or comes within
       `clearance` px of. `skip` holds the ids the line may touch — its own ends.
       Touching is not the bar; a line that grazes an ellipse reads as touching it."""
    hits = set()
    ends = [S[i] for i in skip if i in S]
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        n = max(2, int(((x2 - x1) ** 2 + (y2 - y1) ** 2) ** .5 / 3))
        for k in range(0, n + 1):
            t = k / n
            px, py = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
            if any(_inside(px, py, e, 0) for e in ends):
                continue
            for cid, s in S.items():
                if cid in skip or s['role'] not in ('uc', 'actor'):
                    continue
                if _inside(px, py, s, -clearance):
                    hits.add(s['name'])
    return hits


def place_condition_note(pg, kid_id, base_id, text, pkg_box):
    """Try positions around the extending use case and keep the first where the
       note sits whole inside its package, covers no use case, and its anchor —
       note to the midpoint of the «extend» — passes through nothing."""
    S = pg.shapes
    u = S[kid_id]
    # draw.io anchors to the midpoint of the VISIBLE «extend» line — centre to
    # centre, clipped at both ellipses — not to the midpoint between centres.
    # The two differ by tens of pixels when the base carries extension points.
    def rim(s, towards):
        (cx, cy), (tx, ty) = centre(s), towards
        dx, dy = tx - cx, ty - cy
        k = 1 / (((dx / (s['w'] / 2)) ** 2 + (dy / (s['h'] / 2)) ** 2) ** .5)
        return cx + dx * k, cy + dy * k
    p1, p2 = rim(u, centre(S[base_id])), rim(S[base_id], centre(u))
    mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
    w, h = 236, 44
    row_bottom = max(u['y'] + u['h'], S[base_id]['y'] + S[base_id]['h'])
    cands = [(mx - w / 2 + 40, row_bottom + 14),            # the reserved row, under the midpoint
             (u['x'] + u['w'] + 34, u['y'] + (u['h'] - h) / 2),
             (u['x'] + u['w'] + 34, u['y'] - h / 2 - 6),
             (u['x'] + u['w'] + 34, u['y'] + u['h'] - h / 2 + 6),
             (u['x'], u['y'] + u['h'] + 12),
             (mx + 60, my - h - 20)]
    for x, y in cands:
        box = {'x': x, 'y': y, 'w': w, 'h': h}
        if pkg_box and not (x >= pkg_box['x'] + 6 and y >= pkg_box['y'] + 30 and
                            x + w <= pkg_box['x'] + pkg_box['w'] - 6 and y + h <= pkg_box['y'] + pkg_box['h'] - 6):
            continue
        # 8px of air around every use case — a note that touches one reads as part of it
        if any(box['x'] < s['x'] + s['w'] + 8 and s['x'] - 8 < x + w and
               box['y'] < s['y'] + s['h'] + 8 and s['y'] - 8 < y + h
               for s in S.values() if s['role'] in ('uc', 'cond')):
            continue
        # anchor: draw.io draws it on the line from the note's centre to the
        # extend's midpoint, clipped at the note — model exactly that line
        ax, ay = x + w / 2, y + h / 2
        # nothing is exempt: the anchor ends on the note and on the «extend» line,
        # neither of which is a use case. An earlier version exempted the two use
        # cases the extend joins — and so never noticed the anchor cutting 6.5.
        if path_hits(S, [(ax, ay), (mx, my)], set(), clearance=10):
            continue
        return int(x), int(y), (ax, ay), (mx, my)
    raise SystemExit('หาที่วางโน้ตเงื่อนไขของ %s ไม่ได้ — ขยายแพ็กเกจหรือช่องคอลัมน์' % S[kid_id]['name'])


def check(pages):
    problems = []
    for pg in pages:
        S = pg.shapes
        frame = next((s for s in S.values() if s['role'] == 'frame'), None)
        subject = next((s for s in S.values() if s['role'] == 'subject'), None)
        tops = [s for s in S.values() if s['parent'] == '1' and s['role'] not in ('frame', 'subject')]

        for s in S.values():
            if s['parent'] == '1' and frame and s is not frame:
                if not (s['x'] >= frame['x'] and s['y'] >= frame['y'] + 28 and
                        s['x'] + s['w'] <= frame['x'] + frame['w'] and s['y'] + s['h'] <= frame['y'] + frame['h']):
                    problems.append('%s: "%s" อยู่นอกกรอบไดอะแกรม' % (pg.title, s['name']))
            if s['role'] == 'package' and subject:
                if not (s['x'] >= subject['x'] and s['x'] + s['w'] <= subject['x'] + subject['w'] and
                        s['y'] >= subject['y'] and s['y'] + s['h'] <= subject['y'] + subject['h']):
                    problems.append('%s: แพ็กเกจ "%s" ล้นขอบระบบ' % (pg.title, s['name']))
        def over(a, b):
            return (a['x'] < b['x'] + b['w'] and b['x'] < a['x'] + a['w'] and
                    a['y'] < b['y'] + b['h'] and b['y'] < a['y'] + a['h'])

        def within(a, b):
            return (a['x'] >= b['x'] and a['y'] >= b['y'] and
                    a['x'] + a['w'] <= b['x'] + b['w'] and a['y'] + a['h'] <= b['y'] + b['h'])

        for i in range(len(tops)):
            for j in range(i + 1, len(tops)):
                a, b = tops[i], tops[j]
                if a['role'] == 'actor' or b['role'] == 'actor' or not over(a, b):
                    continue
                # a condition note may live inside a package — whole, not straddling it
                if {a['role'], b['role']} == {'cond', 'package'}:
                    c, pk = (a, b) if a['role'] == 'cond' else (b, a)
                    if within(c, pk):
                        continue
                problems.append('%s: "%s" ทับ "%s"' % (pg.title, a['name'], b['name']))
        # and it must not sit on a use case
        for c in (v for v in S.values() if v['role'] == 'cond'):
            for u in (v for v in S.values() if v['role'] == 'uc'):
                if over(c, u):
                    problems.append('%s: โน้ต "%s" ทับ "%s"' % (pg.title, c['name'], u['name']))

        # no line of any kind may pass through a use case or actor
        for a, b, kind, _e, path in pg.edges:
            if kind not in ('assoc', 'gen', 'dep', 'anchor'):
                continue
            if kind == 'anchor' and b not in S:
                continue            # note → «extend» anchors were placed by place_condition_note
            sa, sb = S[a], S[b]
            if path:
                pts = path
            else:
                ax, ay = centre(sa)
                bx, by = centre(sb)
                if kind == 'assoc':
                    bx = sb['x']                              # the left-tip port
                pts = [(ax, ay), (bx, by)]
            for hname in sorted(path_hits(S, pts, {a, b})):
                problems.append('%s: เส้น %s → %s ทะลุ "%s"' % (pg.title, sa['name'], sb['name'], hname))
    if problems:
        raise SystemExit('layout ใช้ไม่ได้ — ไม่เขียนไฟล์\n  ' + '\n  '.join(problems))


def main():
    pages, placed = resolve()
    out = [page_overview(pages), page_admin()]
    for n, role in enumerate(CHAIN, 3):
        out.append(page_role(n, role, pages[role], placed))
    out.append(page_catalogue(placed))
    for p in out:
        p.fit_frame()
    check(out)
    for i, p in enumerate(out, 1):
        p.title = '%d · %s' % (i, p.title.split(' · ', 1)[1])
    xml = ('<mxfile host="drawio" agent="CMAS scripts/build-usecase-drawio.py" version="24.0.0">'
           + ''.join(p.xml() for p in out) + '</mxfile>\n')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(xml)

    print('wrote', OUT.relative_to(ROOT), '·', len(out), 'หน้า')
    print('use cases: %d จาก USE_CASES · %d เพิ่มโดย index-q.html' % (len(UC_TEXT), len(NEW)))
    for r in CHAIN:
        print('  %-10s ← %s' % (r, ' '.join(sorted(k for k, v in placed.items() if v == r))))
    return placed


if __name__ == '__main__':
    main()
