# -*- coding: utf-8 -*-
"""index-q.html as a data flow diagram a non-programmer can read.

   Output: docs/diagrams/dfd/DFD-INDEX-Q.drawio — four pages
     1  ระดับ 0 · Context   the whole system as ONE process and who it talks to
     2  ระดับ 1             that process opened into six, with six data stores
     3  ระดับ 2 · งาน 4.0   scores: showing the table / checking and saving
     4  ระดับ 2 · งาน 6.0   results: CLO evaluation / grading

   Level 2 opens only the two processes that do more than one job. The other
   four are a single read-and-write of their own data store and would redraw
   level 1 with a new number on the box.

   This is NOT the DFD in docs/markdown/dev/architecture/dfd.md. That one is the
   input to threat modelling: ten processes, 56 numbered flows, trust
   boundaries, table.column on every arrow. This one answers a simpler question
   for a reader who has never seen the system — what goes in, what happens to
   it, what comes out — in the words the prototype's own screens use.

   It still follows the two habits Microsoft Threat Modeling Tool asks for, so
   the picture can be redrawn there without changing its shape:
     * every interaction is TWO arrows, a request and a response — a read from
       a data store is drawn as the question and the answer, not as one arrow
       coming out of the store by itself
     * a process never talks to another process. On level 2 that means 6.1 and
       6.2 each read the scores themselves instead of one handing a total to
       the other

   Notation is Gane–Sarson, the one Thai SA textbooks teach:
     square            external entity (a person or system outside CMAS)
     rounded box       process, numbered, named verb + object
     open-ended box    data store, numbered D1…
     arrow             data in motion, named with a noun

   The rows of level 1 are ordered so that no two arrows cross: 4.0 (scores)
   reads the store above it and the store below it, which is why the student
   roster is 5.0 and sits under it. A process number is a name, not a step.

   The build REFUSES to write the file when a rule is broken:
     R1  data moves only through a process — never entity↔entity,
         store↔store or entity↔store
     R2  every process has at least one flow in and one flow out
     R3  every data store is both written and read
     R4  every flow has a name, and one arrow carries one direction
     R5  the levels balance: level 0 and level 1 have the same entities and
         the same data crossing the system boundary, and a level-2 page touches
         exactly the entities and stores its parent process touches, in the
         same directions
     R6  every schema.prisma model and every table index-q.sql proposes sits
         in exactly one data store
     R7  no two shapes overlap, every arrow starts and ends on the border of
         the shape it names, and no two arrows cross
     R8  every arrow has its partner in the opposite direction (request/response)
     R9  no arrow joins two processes

     python scripts/build-dfd-index-q-drawio.py
"""
import io
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'diagrams' / 'dfd' / 'DFD-INDEX-Q.drawio'
PRISMA = ROOT / 'database' / 'schema.prisma'
SQL_IQ = ROOT / 'docs' / 'reference' / 'db' / 'mysql' / 'index-q.sql'
VERSION = '1.3 · 2026-10-13'

INK, MUTED, TINT, WASH = '#1E233C', '#6B7192', '#E9EBF5', '#F4F5FA'
FONT = ('fontFamily=IBM Plex Sans Thai;'
        'fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DIBM%2BPlex%2BSans%2BThai;')
BASE = 'whiteSpace=wrap;html=1;fontColor=' + INK + ';' + FONT
S_ENTITY = 'rounded=0;strokeWidth=2;fillColor=' + TINT + ';strokeColor=' + INK + ';fontSize=16;fontStyle=1;' + BASE
S_PROC = ('rounded=1;arcSize=16;strokeWidth=1.5;fillColor=#FFFFFF;strokeColor=' + INK +
          ';fontSize=14;verticalAlign=middle;' + BASE)
S_STORE = ('shape=partialRectangle;right=0;strokeWidth=1.5;fillColor=' + WASH + ';strokeColor=' + INK +
           ';fontSize=14;align=left;spacingLeft=12;' + BASE)
S_FLOW = ('endArrow=block;endFill=1;endSize=7;rounded=1;jumpStyle=arc;jumpSize=10;strokeColor=' + INK +
          ';fontSize=12;labelBackgroundColor=#FFFFFF;html=1;fontColor=' + INK + ';' + FONT)
S_TITLE = 'text;align=left;verticalAlign=top;fontSize=22;fontStyle=1;' + BASE
S_SUB = 'text;align=left;verticalAlign=top;fontSize=13;' + BASE.replace(INK, MUTED)
S_NOTE = ('rounded=1;arcSize=4;fillColor=#FFFFFF;strokeColor=' + MUTED + ';dashed=1;align=left;verticalAlign=top;'
          'spacing=12;fontSize=12;' + BASE)

ENT, PROC, STORE = 'entity', 'process', 'store'

# ── what is stored where ─────────────────────────────────────────────
# (id, plain name, tables) · the tables column is what R6 checks and what the
# legend prints — the diagram itself shows only the plain name
STORES = [
    ('D1', 'บัญชีผู้ใช้', ['User', 'EmailVerificationToken', 'AuthEvent']),
    ('D2', 'รายวิชา', ['Course', 'CourseInstructor']),
    ('D3', 'CLO กิจกรรม และเกณฑ์', ['CLO', 'BehavioralObjective', 'Activity', 'AssessmentCriteria',
                                    'CourseGroupWeight']),
    ('D4', 'คะแนน', ['Score', 'ScoreChange', 'ScoreUploadLog', 'UploadReject']),
    ('D5', 'นักศึกษา', ['Student', 'RemediationPlan']),
    ('D6', 'เกรด', ['GradeBand', 'StudentGrade']),
]
PROCS = [
    ('P1', '1.0', 'เข้าสู่ระบบ<br>และดูแลบัญชี'),
    ('P2', '2.0', 'จัดการรายวิชา<br>และผู้สอน'),
    ('P3', '3.0', 'กำหนด CLO กิจกรรม<br>และเกณฑ์วัดผล'),
    ('P4', '4.0', 'บันทึกและ<br>นำเข้าคะแนน'),
    ('P5', '5.0', 'จัดการรายชื่อ<br>นักศึกษา'),
    ('P6', '6.0', 'ประเมินผล CLO<br>ติดตามนักศึกษา<br>และตัดเกรด'),
]

# ── what crosses the system boundary (level 0) ───────────────────────
# R5 holds every level-1 flow that touches an entity to one of these phrases.
T, A, G = 'ผู้สอน', 'ผู้ดูแลระบบ', 'Google'
CTX = {
    (T, 'in'): ['คำขอเข้าสู่ระบบ', 'ข้อมูลรายวิชาและการตั้งค่า', 'CLO กิจกรรม และเกณฑ์วัดผล',
                'คะแนน (กรอกเองหรือไฟล์ Excel)', 'รายชื่อนักศึกษา', 'คำขอดูผลและรายงาน', 'ช่วงเกรดและการปรับเกรด'],
    (T, 'out'): ['ผลการเข้าสู่ระบบ', 'รายการรายวิชา', 'ตาราง CLO และกิจกรรม', 'ตารางคะแนนและผลตรวจไฟล์',
                 'รายชื่อนักศึกษา', 'ผลการบรรลุ CLO และรายชื่อที่ต้องช่วยเหลือ', 'เกรดและรายงาน'],
    (A, 'in'): ['คำขอเข้าสู่ระบบ', 'การอนุมัติและปิดบัญชี', 'การมอบหมายผู้สอน'],
    (A, 'out'): ['รายการบัญชีและประวัติการใช้งาน', 'ผลการมอบหมายผู้สอน'],
    (G, 'in'): ['ผลยืนยันตัวตน (อีเมล ชื่อ)'],
    (G, 'out'): ['คำขอยืนยันตัวตน'],
}


class Page:
    def __init__(self, name, label_size=12):
        self.label_size = label_size
        self.name, self.cells, self.box_of, self.kind_of, self.owner = name, [], {}, {}, {}
        self.flows, self.n = [], 0

    def _id(self, prefix):
        self.n += 1
        return '%s%d' % (prefix, self.n)

    def box(self, key, kind, value, style, x, y, w, h, owner=None):
        cid = self._id('v')
        self.cells.append(
            '<mxCell id="%s" value="%s" style="%s" vertex="1" parent="1">'
            '<mxGeometry x="%g" y="%g" width="%g" height="%g" as="geometry"/></mxCell>'
            % (cid, escape(value, {'"': '&quot;'}), style, x, y, w, h))
        if key:
            self.box_of[key] = (cid, x, y, w, h)
            self.kind_of[key] = kind
            self.owner[key] = owner or key
        return cid

    def flow(self, a, b, label, pts, ctx=None, lx=0, ly=0):
        """pts[0] lies on a's border, pts[-1] on b's; anything between is a bend."""
        ca, ax, ay, aw, ah = self.box_of[a]
        cb, bx, by, bw, bh = self.box_of[b]
        (sx, sy), (tx, ty) = pts[0], pts[-1]
        style = (S_FLOW + 'exitX=%g;exitY=%g;exitDx=0;exitDy=0;entryX=%g;entryY=%g;entryDx=0;entryDy=0;'
                 % ((sx - ax) / aw, (sy - ay) / ah, (tx - bx) / bw, (ty - by) / bh))
        mid = ''.join('<mxPoint x="%g" y="%g"/>' % p for p in pts[1:-1])
        cid = self._id('e')
        self.cells.append(
            '<mxCell id="%s" style="%s" edge="1" parent="1" source="%s" target="%s">'
            '<mxGeometry relative="1" as="geometry">%s</mxGeometry></mxCell>'
            % (cid, style, ca, cb, '<Array as="points">%s</Array>' % mid if mid else ''))
        self.cells.append(
            '<mxCell id="%s" value="%s" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;'
            'fontSize=%d;fontColor=%s;labelBackgroundColor=#FFFFFF;%s" vertex="1" connectable="0" parent="%s">'
            '<mxGeometry x="%g" y="%g" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>'
            % (self._id('l'), escape(label, {'"': '&quot;'}), self.label_size, INK, FONT, cid, lx, ly))
        self.flows.append({'a': a, 'b': b, 'label': label, 'pts': pts, 'ctx': ctx or [], 'lx': lx, 'ly': ly})

    def xml(self, pid, w, h):
        return ('<diagram id="%s" name="%s"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" '
                'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" '
                'background="#FFFFFF" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s'
                '</root></mxGraphModel></diagram>' % (pid, escape(self.name), w, h, ''.join(self.cells)))


def proc_label(num, name):
    return '<b>%s</b><hr size="1" color="%s">%s' % (num, INK, name)


LEGEND = ('<b>อ่านแผนภาพอย่างไร</b><br>'
          '▪ <b>กล่องสี่เหลี่ยมทึบ</b> = คนหรือระบบภายนอกที่ส่งหรือรับข้อมูล<br>'
          '▪ <b>กล่องมุมมน มีเลข</b> = งานที่ระบบทำกับข้อมูล · เลขเป็นชื่อเรียก ไม่ใช่ลำดับการทำงาน<br>'
          '▪ <b>กล่องเปิดด้านขวา (D1, D2 …)</b> = ที่เก็บข้อมูล<br>'
          '▪ <b>ลูกศร</b> = ข้อมูลที่ถูกส่ง หัวลูกศรชี้ไปหาผู้รับ<br>'
          '▪ <b>ลูกศรมาเป็นคู่เสมอ</b> = เส้นหนึ่งขอหรือส่งข้อมูล อีกเส้นคือคำตอบที่ได้กลับ')


# ── level 0 ──────────────────────────────────────────────────────────
def level0():
    p = Page('ระดับ 0 · Context', label_size=14)
    p.box(None, None, 'แผนภาพกระแสข้อมูล ระดับ 0 (Context Diagram) — ระบบ CMAS', S_TITLE, 60, 30, 1100, 40)
    p.box(None, None, 'มองทั้งระบบเป็นกล่องเดียว: ใครส่งอะไรเข้ามา และได้อะไรกลับไป · รุ่น ' + VERSION, S_SUB, 60, 72, 1100, 30)
    p.box(T, ENT, T, S_ENTITY, 60, 400, 200, 140)
    p.box(A, ENT, A, S_ENTITY, 1500, 190, 200, 100)
    p.box(G, ENT, 'Google<br><span style="font-weight:normal;font-size:12px">บริการยืนยันตัวตน</span>',
          S_ENTITY, 1500, 650, 200, 100)
    p.box('P0', PROC, proc_label('0', '<b>ระบบ CMAS</b><br>ติดตามและประเมินผลลัพธ์การเรียนรู้<br>ระดับรายวิชา (CLO)'),
          S_PROC.replace('fontSize=14', 'fontSize=15'), 760, 380, 340, 180)

    def lines(key):
        return '<br>'.join(CTX[key])
    p.flow(T, 'P0', lines((T, 'in')), [(260, 430), (760, 430)], ly=-82)
    p.flow('P0', T, lines((T, 'out')), [(760, 510), (260, 510)], ly=-82)
    p.flow(A, 'P0', lines((A, 'in')), [(1500, 220), (880, 220), (880, 380)], lx=-0.35, ly=-40)
    p.flow('P0', A, lines((A, 'out')), [(1100, 430), (1600, 430), (1600, 290)], lx=-0.3, ly=-28)
    p.flow('P0', G, lines((G, 'out')), [(1100, 510), (1600, 510), (1600, 650)], lx=-0.3, ly=16)
    p.flow(G, 'P0', lines((G, 'in')), [(1500, 720), (880, 720), (880, 560)], lx=-0.35, ly=16)
    p.box(None, None, LEGEND + '<br><br>นักศึกษาไม่ได้ใช้ระบบเอง — ข้อมูลของนักศึกษาเข้ามาทางผู้สอน',
          S_NOTE, 60, 720, 620, 170)
    return p


# ── level 1 ──────────────────────────────────────────────────────────
def level1():
    p = Page('ระดับ 1')
    PX, PW, PH = 580, 250, 120            # left column of processes
    SX, SW, SH = 1180, 260, 76            # data stores
    QX, QY, QH = 1800, 825, 280           # 6.0 — tall, because eight arrows land on its left edge
    ROW = {'P1': 310, 'P2': 600, 'P3': 860, 'P4': 1100, 'P5': 1340}
    SROW = {'D1': 310, 'D2': 625, 'D3': 860, 'D4': 1100, 'D5': 1340}
    name = {k: (num, nm) for k, num, nm in PROCS}
    sname = {k: nm for k, nm, _t in STORES}

    p.box(None, None, 'แผนภาพกระแสข้อมูล ระดับ 1 — ระบบ CMAS', S_TITLE, 60, 20, 900, 40)
    p.box(None, None, 'เปิดกล่อง "ระบบ CMAS" ของระดับ 0 ออกเป็น 6 งาน · ซ้ายคือการป้อนข้อมูล ขวาคือผลที่ได้ · รุ่น ' + VERSION,
          S_SUB, 60, 62, 1000, 30)

    p.box('T1', ENT, T, S_ENTITY, 60, 250, 170, 1150, owner=T)
    p.box(G, ENT, 'Google<br><span style="font-weight:normal;font-size:12px">บริการยืนยันตัวตน</span>',
          S_ENTITY, 900, 110, 190, 70)
    # ผู้ดูแลระบบ sits between the two processes it talks to. Anywhere on the
    # edge of the page its arrows to 2.0 have to cross ผู้สอน's arrows to 1.0.
    p.box(A, ENT, A, S_ENTITY, 900, 420, 180, 70)
    for k, cy in ROW.items():
        p.box(k, PROC, proc_label(*name[k]), S_PROC, PX, cy - PH / 2, PW, PH)
    for k, cy in SROW.items():
        p.box(k, STORE, '<b>%s</b>&nbsp;&nbsp;│&nbsp;&nbsp;%s' % (k, sname[k]), S_STORE, SX, cy - SH / 2, SW, SH)
    p.box('P6', PROC, proc_label(*name['P6']), S_PROC, QX, QY, PW, QH)
    p.box('D6', STORE, '<b>D6</b>&nbsp;&nbsp;│&nbsp;&nbsp;%s' % sname['D6'], S_STORE, QX - 5, 602, SW, SH)
    p.box('T2', ENT, T + '<br><span style="font-weight:normal;font-size:12px">(คนเดียวกับด้านซ้าย)</span>',
          S_ENTITY, 2400, 700, 170, 530, owner=T)

    TL, PR, QR, SR = 230, PX + PW, QX + PW, SX + SW

    def teacher(k, text_in, ctx_in, text_out, ctx_out):
        cy = ROW[k]
        p.flow('T1', k, text_in, [(TL, cy - 30), (PX, cy - 30)], ctx=ctx_in)
        p.flow(k, 'T1', text_out, [(PX, cy + 30), (TL, cy + 30)], ctx=ctx_out)

    def store(k, d, y_w, y_r, text_w, text_r):
        p.flow(k, d, text_w, [(PR, y_w), (SX, y_w)])
        p.flow(d, k, text_r, [(SX, y_r), (PR, y_r)])

    # 1.0
    teacher('P1', 'คำขอเข้าสู่ระบบ', ['คำขอเข้าสู่ระบบ'], 'ผลการเข้าสู่ระบบ', ['ผลการเข้าสู่ระบบ'])
    p.flow('P1', G, 'คำขอยืนยันตัวตน', [(750, 250), (750, 130), (900, 130)], ctx=['คำขอยืนยันตัวตน'], lx=0.45)
    p.flow(G, 'P1', 'ผลยืนยันตัวตน<br>(อีเมล ชื่อ)', [(1000, 180), (1000, 215), (800, 215), (800, 250)],
           ctx=['ผลยืนยันตัวตน (อีเมล ชื่อ)'], lx=-0.1)
    p.flow(A, 'P1', 'คำขอเข้าสู่ระบบ<br>การอนุมัติและปิดบัญชี', [(1020, 420), (1020, 395), (800, 395), (800, 370)],
           ctx=['คำขอเข้าสู่ระบบ', 'การอนุมัติและปิดบัญชี'], lx=-0.05)
    p.flow('P1', A, 'รายการบัญชี<br>ประวัติการใช้งาน', [(660, 370), (660, 440), (900, 440)],
           ctx=['รายการบัญชีและประวัติการใช้งาน'], lx=0.3)
    store('P1', 'D1', 288, 332, 'บัญชีใหม่ · สถานะบัญชี', 'ข้อมูลบัญชี')
    # 2.0
    teacher('P2', 'ข้อมูลรายวิชา · การตั้งค่า', ['ข้อมูลรายวิชาและการตั้งค่า'], 'รายการรายวิชา', ['รายการรายวิชา'])
    p.flow(A, 'P2', 'การมอบหมายผู้สอน', [(900, 474), (700, 474), (700, 540)], ctx=['การมอบหมายผู้สอน'], lx=-0.3)
    p.flow('P2', A, 'ผลการมอบหมาย', [(790, 540), (790, 515), (990, 515), (990, 490)],
           ctx=['ผลการมอบหมายผู้สอน'], lx=0)
    p.flow('P2', 'D1', 'คำขอรายชื่อผู้สอน', [(PR, 552), (1300, 552), (1300, 348)], lx=-0.45)
    p.flow('D1', 'P2', 'รายชื่อผู้สอน', [(1340, 348), (1340, 574), (PR, 574)], lx=0.45)
    store('P2', 'D2', 606, 646, 'ข้อมูลรายวิชา · ผู้สอน', 'ข้อมูลรายวิชา')
    # 3.0
    teacher('P3', 'CLO · จุดประสงค์ · กิจกรรม · น้ำหนัก', ['CLO กิจกรรม และเกณฑ์วัดผล'],
            'ตาราง CLO และกิจกรรม · ผลตรวจน้ำหนัก', ['ตาราง CLO และกิจกรรม'])
    store('P3', 'D3', 838, 882, 'CLO · กิจกรรม · เกณฑ์', 'CLO และกิจกรรมที่มีอยู่')
    # 4.0 — reads the store above it and the store below it
    teacher('P4', 'คะแนน (กรอกเองหรือไฟล์ Excel)<br>คำขอดูตารางคะแนน', ['คะแนน (กรอกเองหรือไฟล์ Excel)'],
            'ตารางคะแนน · แบบฟอร์ม Excel<br>ผลตรวจไฟล์', ['ตารางคะแนนและผลตรวจไฟล์'])
    store('P4', 'D4', 1078, 1122, 'คะแนน · ประวัติการแก้', 'คะแนนที่มีอยู่')
    p.flow('P4', 'D3', 'คำขอรายการกิจกรรม', [(700, 1040), (700, 972), (1230, 972), (1230, 898)], lx=0.1)
    p.flow('D3', 'P4', 'กิจกรรมและคะแนนเต็ม', [(1270, 898), (1270, 1002), (760, 1002), (760, 1040)], lx=0.1)
    p.flow('P4', 'D5', 'คำขอรายชื่อ', [(700, 1160), (700, 1228), (1230, 1228), (1230, 1302)], lx=0.1)
    p.flow('D5', 'P4', 'รายชื่อนักศึกษา', [(1270, 1302), (1270, 1198), (760, 1198), (760, 1160)], lx=0.1)
    # 5.0
    teacher('P5', 'รายชื่อ (กรอกเองหรือไฟล์ Excel)<br>การถอนรายวิชา', ['รายชื่อนักศึกษา'],
            'รายชื่อนักศึกษา · ผลตรวจไฟล์', ['รายชื่อนักศึกษา'])
    store('P5', 'D5', 1318, 1362, 'ข้อมูลนักศึกษา · สถานะถอน', 'รายชื่อที่มีอยู่')
    # 6.0 — asks four stores, answers the reader, keeps the grades in D6
    y = QY + 28
    for d, ask, answer in [('D2', 'คำขอเกณฑ์ของรายวิชา', 'เกณฑ์ผ่าน · วิธีตัดเกรด'),
                           ('D3', 'คำขอ CLO และกิจกรรม', 'CLO · กิจกรรม · น้ำหนัก'),
                           ('D4', 'คำขอคะแนน', 'คะแนน'),
                           ('D5', 'คำขอรายชื่อ', 'รายชื่อ (ไม่นับผู้ถอน)')]:
        cy = SROW[d]
        p.flow('P6', d, ask, [(QX, y), (SR, cy - 16)], lx=0.45)
        p.flow(d, 'P6', answer, [(SR, cy + 16), (QX, y + 28)], lx=-0.45)
        y += 56
    p.flow('T2', 'P6', 'คำขอดูผลและรายงาน<br>ช่วงเกรด · คำสั่งตัดเกรด<br>การปรับเกรดพร้อมเหตุผล', [(2400, 920), (QR, 920)],
           ctx=['คำขอดูผลและรายงาน', 'ช่วงเกรดและการปรับเกรด'])
    p.flow('P6', 'T2', 'ผลการบรรลุ CLO · รายชื่อที่ต้องช่วยเหลือ<br>เกรด · สถิติ · รายงาน Excel', [(QR, 1010), (2400, 1010)],
           ctx=['ผลการบรรลุ CLO และรายชื่อที่ต้องช่วยเหลือ', 'เกรดและรายงาน'])
    p.flow('P6', 'D6', 'ช่วงเกรด<br>เกรดที่ตรึง', [(QX + 70, QY), (QX + 70, 678)])
    p.flow('D6', 'P6', 'ช่วงเกรด<br>เกรดที่มีอยู่', [(QX + 180, 678), (QX + 180, QY)])

    tables = '<br>'.join('<b>%s %s</b> — %s' % (k, nm, ', '.join(t)) for k, nm, t in STORES)
    p.box(None, None, LEGEND + '<br><br><b>แต่ละที่เก็บข้อมูลคือตารางใดในฐานข้อมูล</b><br>' + tables,
          S_NOTE, 1640, 110, 930, 300)
    return p


# ── level 2 ──────────────────────────────────────────────────────────
def level2(parent, title, left, right, middle, extra=None):
    """One parent process opened into two.

    Everything both halves talk to stands in a column between them — ผู้สอน on
    top, the data stores under it — so each half reaches it from its own side
    and no arrow has to cross another. `left` / `right` are (number, name,
    {item: (what the process sends, what it gets back)}); for ผู้สอน the pair
    is (what ผู้สอน sends, what ผู้สอน gets back). `extra` is a store only the
    right half uses.
    """
    p = Page('ระดับ 2 · งาน %s' % parent[1])
    p.parent = parent[0]
    sname = {k: nm for k, nm, _t in STORES}
    LX, MX, RX, PW, SW, SH, PITCH, TOP = 80, 780, 1490, 250, 260, 76, 200, 210
    p.box(None, None, 'แผนภาพกระแสข้อมูล ระดับ 2 — งาน %s %s' % (parent[1], title), S_TITLE, 60, 20, 1500, 40)
    p.box(None, None, 'เปิดกล่อง %s ของระดับ 1 ออกเป็น 2 งานย่อย · สิ่งที่ทั้งสองงานใช้ร่วมกันอยู่ตรงกลาง · รุ่น %s'
          % (parent[1], VERSION), S_SUB, 60, 62, 1500, 30)
    centre = {}
    for i, k in enumerate(middle):
        cy = centre[k] = TOP + i * PITCH
        if k == T:
            p.box(T, ENT, T, S_ENTITY, MX, cy - 45, SW, 90)
        else:
            p.box(k, STORE, '<b>%s</b>&nbsp;&nbsp;│&nbsp;&nbsp;%s' % (k, sname[k]), S_STORE, MX, cy - SH / 2, SW, SH)
    h = 56 * len(middle) + 32
    top = TOP + (len(middle) - 1) * PITCH / 2 - h / 2
    for num, nm, talks, px, near, far in ((left + (LX, LX + PW, MX)), (right + (RX, RX, MX + SW))):
        key = 'S' + num
        p.box(key, PROC, proc_label(num, nm), S_PROC, px, top, PW, h)
        for i, k in enumerate(middle):
            first, second = talks[k]
            upper = [(near, top + 30 + 56 * i), (far, centre[k] - 16)]
            lower = [(far, centre[k] + 16), (near, top + 58 + 56 * i)]
            if k == T:      # ผู้สอน speaks first: the upper arrow runs towards the process
                p.flow(k, key, first, upper[::-1], lx=-0.5)
                p.flow(key, k, second, lower[::-1], lx=-0.45)      # label by the process, clear of the one above
            else:
                p.flow(key, k, first, upper, lx=0.5)
                p.flow(k, key, second, lower, lx=-0.5)
    bottom = max(top + h, centre[middle[-1]] + SH / 2)
    if extra:
        k, (write, read) = extra
        cy, ex = top + h / 2, RX + PW + 330
        p.box(k, STORE, '<b>%s</b>&nbsp;&nbsp;│&nbsp;&nbsp;%s' % (k, sname[k]), S_STORE, ex, cy - SH / 2, SW, SH)
        p.flow('S' + right[0], k, write, [(RX + PW, cy - 22), (ex, cy - 22)])
        p.flow(k, 'S' + right[0], read, [(ex, cy + 22), (RX + PW, cy + 22)])
    p.box(None, None, LEGEND, S_NOTE, 60, bottom + 70, 640, 130)
    p.size = (RX + PW + (330 + SW if extra else 0) + 100, int(bottom + 240))
    return p


def level2_pages():
    scores = level2(
        ('P4', '4.0'), 'บันทึกและนำเข้าคะแนน',
        ('4.1', 'แสดงตารางคะแนน<br>และออกแบบฟอร์ม Excel', {
            T: ('คำขอดูตารางคะแนน', 'ตารางคะแนน · แบบฟอร์ม Excel'),
            'D3': ('คำขอรายการกิจกรรม', 'กิจกรรมและคะแนนเต็ม'),
            'D4': ('คำขอคะแนน', 'คะแนนที่มีอยู่'),
            'D5': ('คำขอรายชื่อ', 'รายชื่อนักศึกษา')}),
        ('4.2', 'ตรวจและบันทึกคะแนน', {
            T: ('คะแนน (กรอกเองหรือไฟล์ Excel)', 'ผลการบันทึก · ผลตรวจไฟล์'),
            'D3': ('คำขอคะแนนเต็มของกิจกรรม', 'คะแนนเต็ม · สถานะปิดรับ'),
            'D4': ('คะแนน · ประวัติการแก้', 'คะแนนเดิม'),
            'D5': ('คำขอตรวจรหัสนักศึกษา', 'รายชื่อและสถานะถอน')}),
        [T, 'D3', 'D4', 'D5'])
    results = level2(
        ('P6', '6.0'), 'ประเมินผล CLO ติดตามนักศึกษา และตัดเกรด',
        ('6.1', 'ประเมินผล CLO<br>และติดตามนักศึกษา', {
            T: ('คำขอดูผลและรายงาน', 'ผลการบรรลุ CLO · รายงาน Excel<br>รายชื่อที่ต้องช่วยเหลือ'),
            'D2': ('คำขอเกณฑ์ผ่าน', 'เกณฑ์ผ่านของรายวิชา'),
            'D3': ('คำขอ CLO และกิจกรรม', 'CLO · กิจกรรม · น้ำหนัก'),
            'D4': ('คำขอคะแนน', 'คะแนน'),
            'D5': ('คำขอรายชื่อ', 'รายชื่อ (ไม่นับผู้ถอน)')}),
        ('6.2', 'ตัดเกรด', {
            T: ('ช่วงเกรด · คำสั่งตัดเกรด<br>การปรับเกรดพร้อมเหตุผล', 'เกรด · สถิติ · ไฟล์ผลการเรียน'),
            'D2': ('คำขอวิธีตัดเกรด', 'วิธีตัดเกรด'),
            'D3': ('คำขอน้ำหนักกิจกรรม', 'กิจกรรมและน้ำหนัก'),
            'D4': ('คำขอคะแนน', 'คะแนน'),
            'D5': ('คำขอรายชื่อ', 'รายชื่อ (ไม่นับผู้ถอน)')}),
        [T, 'D2', 'D3', 'D4', 'D5'],
        extra=('D6', ('ช่วงเกรด · เกรดที่ตรึง', 'ช่วงเกรด · เกรดที่มีอยู่')))
    return [scores, results]


# ── rules ────────────────────────────────────────────────────────────
def on_border(pt, box):
    _c, x, y, w, h = box
    px, py = pt
    inside = x - 0.5 <= px <= x + w + 0.5 and y - 0.5 <= py <= y + h + 0.5
    edge = min(abs(px - x), abs(px - x - w)) < 0.5 or min(abs(py - y), abs(py - y - h)) < 0.5
    return inside and edge


def segments(f):
    return [(f['pts'][i], f['pts'][i + 1]) for i in range(len(f['pts']) - 1)]


def crosses(s1, s2):
    """True when two segments properly intersect (touching at an endpoint is not a crossing)."""
    (a, b), (c, d) = s1, s2

    def side(p, q, r):
        v = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
        return (v > 1e-9) - (v < -1e-9)
    return side(a, b, c) * side(a, b, d) < 0 and side(c, d, a) * side(c, d, b) < 0


def check(l0, l1, l2):
    bad = []
    for p in [l0, l1] + l2:
        io_ = {k: [0, 0] for k in p.box_of}
        seen = set()
        for f in p.flows:
            ka, kb = p.kind_of[f['a']], p.kind_of[f['b']]
            if PROC not in (ka, kb):
                bad.append('R1 · %s: %s → %s ไม่ผ่าน process' % (p.name, f['a'], f['b']))
            if ka == PROC and kb == PROC:
                bad.append('R9 · %s: %s → %s เป็นเส้นระหว่าง process' % (p.name, f['a'], f['b']))
            if not re.sub(r'<[^>]+>', '', f['label']).strip():
                bad.append('R4 · %s: %s → %s ไม่มีชื่อ' % (p.name, f['a'], f['b']))
            if (f['a'], f['b']) in seen:
                bad.append('R4 · %s: %s → %s มีสองเส้น' % (p.name, f['a'], f['b']))
            seen.add((f['a'], f['b']))
            io_[f['a']][1] += 1
            io_[f['b']][0] += 1
            for end, pt in ((f['a'], f['pts'][0]), (f['b'], f['pts'][-1])):
                if not on_border(pt, p.box_of[end]):
                    bad.append('R7 · %s: ปลายเส้น %s → %s ที่ %s ไม่อยู่บนขอบของ %s' % (p.name, f['a'], f['b'], pt, end))
        for a, b in sorted(seen):
            if (b, a) not in seen:
                bad.append('R8 · %s: %s → %s ไม่มีเส้นตอบกลับ' % (p.name, a, b))
        for k, (n_in, n_out) in io_.items():
            kind = p.kind_of[k]
            if kind == PROC and (not n_in or not n_out):
                bad.append('R2 · %s: process %s เข้า %d ออก %d' % (p.name, k, n_in, n_out))
            if kind == STORE and (not n_in or not n_out):
                bad.append('R3 · %s: store %s ถูกเขียน %d ถูกอ่าน %d' % (p.name, k, n_in, n_out))
        keys = list(p.box_of)
        for i, a in enumerate(keys):
            for b in keys[i + 1:]:
                _c, ax, ay, aw, ah = p.box_of[a]
                _c, bx, by, bw, bh = p.box_of[b]
                if ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah:
                    bad.append('R7 · %s: %s ทับ %s' % (p.name, a, b))
        for i, f in enumerate(p.flows):
            for g in p.flows[i + 1:]:
                if any(crosses(s, t) for s in segments(f) for t in segments(g)):
                    bad.append('R7 · %s: เส้น %s → %s ตัดกับ %s → %s' % (p.name, f['a'], f['b'], g['a'], g['b']))
            # an arrow may touch only the two shapes it joins
            for k, (_c, x, y, w, h) in p.box_of.items():
                if k in (f['a'], f['b']):
                    continue
                box = [((x, y), (x + w, y)), ((x + w, y), (x + w, y + h)),
                       ((x + w, y + h), (x, y + h)), ((x, y + h), (x, y))]
                if any(crosses(s, e) for s in segments(f) for e in box):
                    bad.append('R7 · %s: เส้น %s → %s ลากผ่าน %s' % (p.name, f['a'], f['b'], k))

    # R5 — every phrase on level 0 is carried by a level-1 flow, and the reverse
    used = {}
    for f in l1.flows:
        for end, side in ((f['a'], 'in'), (f['b'], 'out')):
            if l1.kind_of[end] == ENT:
                ent = l1.owner[end]
                if not f['ctx']:
                    bad.append('R5 · %s %s ไม่ได้ระบุว่าเป็นข้อมูลใดของระดับ 0' % (f['a'], f['b']))
                for c in f['ctx']:
                    if c not in CTX[(ent, side)]:
                        bad.append('R5 · "%s" (%s %s) ไม่อยู่ในระดับ 0' % (c, ent, side))
                    used.setdefault((ent, side), set()).add(c)
    for key, phrases in CTX.items():
        for c in phrases:
            if c not in used.get(key, set()):
                bad.append('R5 · "%s" (%s %s) อยู่ในระดับ 0 แต่ไม่มีเส้นในระดับ 1' % (c, key[0], key[1]))
    if {l0.owner[k] for k in l0.box_of if l0.kind_of[k] == ENT} != \
            {l1.owner[k] for k in l1.box_of if l1.kind_of[k] == ENT}:
        bad.append('R5 · external entity ของสองระดับไม่ตรงกัน')

    # R5 — a level-2 page touches what its parent touches, in the same directions
    def outside(p, inner):
        out = set()
        for f in p.flows:
            if inner(f['a']) and not inner(f['b']):
                out.add((p.owner[f['b']], 'out'))
            if inner(f['b']) and not inner(f['a']):
                out.add((p.owner[f['a']], 'in'))
        return out
    for p in l2:
        want = outside(l1, lambda k: k == p.parent)
        got = outside(p, lambda k: p.kind_of[k] == PROC)
        for ent, side in sorted(want ^ got):
            bad.append('R5 · %s กับ %s ในระดับ 1 ไม่สมดุลที่ %s (%s)' % (p.name, p.parent, ent, side))

    # R6 — tables
    models = set(re.findall(r'^model\s+(\w+)', io.open(PRISMA, encoding='utf-8').read(), re.M))
    sql = set(re.findall(r'^CREATE TABLE `?(\w+)`?', io.open(SQL_IQ, encoding='utf-8').read(), re.M))
    placed = [t for _k, _n, ts in STORES for t in ts]
    for t in sorted((models | sql) - set(placed)):
        bad.append('R6 · ตาราง %s ไม่อยู่ใน data store ใด' % t)
    for t in sorted(set(placed) - (models | sql)):
        bad.append('R6 · %s ไม่ใช่ตารางใน schema.prisma หรือ index-q.sql' % t)
    for t in sorted({t for t in placed if placed.count(t) > 1}):
        bad.append('R6 · ตาราง %s อยู่มากกว่าหนึ่ง store' % t)
    return bad, len(models), len(sql - models)


def build():
    l0, l1, l2 = level0(), level1(), level2_pages()
    bad, n_models, n_proposed = check(l0, l1, l2)
    return l0, l1, l2, bad, n_models, n_proposed


def main():
    l0, l1, l2, bad, n_models, n_proposed = build()
    if bad:
        for b in bad:
            print('✗', b)
        print('ไม่เขียนไฟล์ — ผิดกฎ %d ข้อ' % len(bad))
        return 1
    xml = ('<mxfile host="drawio" agent="CMAS scripts/build-dfd-index-q-drawio.py" version="24.0.0">%s%s%s%s</mxfile>'
           % (l0.xml('dfd0', 1780, 920), l1.xml('dfd1', 2640, 1460),
              l2[0].xml('dfd2-4', *l2[0].size), l2[1].xml('dfd2-6', *l2[1].size)))
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(xml)
    n_proc = sum(1 for k in l1.kind_of.values() if k == PROC)
    n_store = sum(1 for k in l1.kind_of.values() if k == STORE)
    print('เขียน %s — ระดับ 0: %d เส้น · ระดับ 1: %d process, %d data store, %d เส้น · ระดับ 2: %s · '
          'ตาราง %d + เสนอเพิ่ม %d · ผ่านกฎ R1–R9'
          % (OUT.relative_to(ROOT), len(l0.flows), n_proc, n_store, len(l1.flows),
             ' / '.join('%s %d เส้น' % (p.name.split('· ')[1], len(p.flows)) for p in l2), n_models, n_proposed))
    return 0


if __name__ == '__main__':
    sys.exit(main())
