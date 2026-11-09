#!/usr/bin/env python3
"""Flowchart ของฟีเจอร์ "ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่" (K1, UC 2.9) เป็นไฟล์ draw.io

ทำไมสคริปต์ ไม่วาดมือ: ฟีเจอร์นี้มีกติกาเยอะ (ขั้นหลัก · ตารางที่คัดลอก · edge case)
และทั้งสามอย่างต้องอ้างถึงกันได้ ไฟล์นี้จึงสร้างจากโมเดลชุดเดียวด้านล่าง แล้วตรวจให้ครบ:
  * ทุกเส้นเชื่อมต้องชี้ไปหาโหนดที่มีอยู่
  * ทุกแถวใน edge case ต้องอ้างขั้น (S#) หรือตาราง (T#) ที่มีจริงในหน้า 1–2
  * ทุกขั้น S# ที่เป็นเงื่อนไข (ทางออกผิดปกติ) ต้องมี edge case อย่างน้อยหนึ่งแถว

รหัสในไดอะแกรม
  S# ขั้นตอนหลัก · D# ฐานข้อมูล · P# กระบวนการย่อย · F# ทางออกแบบแจ้งข้อผิดพลาด
  K# ทางข้าม · T# ตารางที่คัดลอก · E## edge case

อ้างอิงโค้ด: docs/index-q/index-q.html  (modalCopyLevel · copyLevelPlan · copyLevelDo · cloneCourse · STUDY_PLAN)
ผลลัพธ์:    docs/diagrams/flowchart/CMAS-Flowchart-CopyYearLevel.drawio

รัน:  python scripts/build-copy-year-flowchart-drawio.py
ห้องแก้ไฟล์ .drawio ด้วยมือ — แก้ที่นี่แล้วรันใหม่
"""
import io
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'diagrams' / 'flowchart' / 'CMAS-Flowchart-CopyYearLevel.drawio'
APP = ROOT / 'docs' / 'index-q' / 'index-q.html'

# ── ต้นแบบต้องมีฟังก์ชันที่ไดอะแกรมอ้างถึงจริง ─────────────────────────
_app = io.open(APP, encoding='utf-8').read()
for fn in ('function modalCopyLevel', 'function copyLevelPlan', 'function copyLevelDo',
           'function cloneCourse', 'const STUDY_PLAN'):
    if fn not in _app:
        raise SystemExit('index-q.html ไม่มี %r — ไดอะแกรมอ้างถึงสิ่งที่ไม่มีแล้ว' % fn)
N_PLAN = len(re.findall(r"\[(\d),(\d),'(\d{8})'", _app[_app.index('const STUDY_PLAN'):]))

# ── สไตล์ (ชุดเดียวกับ CMAS-Flowcharts_Handwritten.drawio) ──────────────
ST = {
    'start': 'rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontStyle=1;fontSize=13;',
    'end':   'rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#E6E6E6;strokeColor=#666666;fontStyle=1;fontSize=13;',
    'io':    'shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;size=18;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;',
    'proc':  'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#333333;fontSize=13;',
    'sub':   'shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;size=0.06;fillColor=#FFFFFF;strokeColor=#333333;fontSize=13;fontStyle=1;',
    'dec':   'rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=13;',
    'db':    'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=10;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#D79B00;fontSize=13;',
    'err':   'rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor=#F8CECC;strokeColor=#B85450;fontSize=13;',
    'skip':  'rounded=0;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#999999;dashed=1;fontSize=13;',
    'note':  'whiteSpace=wrap;html=1;rounded=1;arcSize=4;align=left;verticalAlign=top;spacingLeft=10;spacingTop=6;fontSize=12.5;fillColor=#F5F5F5;strokeColor=#999999;',
    'ok':    'rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=12.5;',
    'warn':  'rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=12.5;',
    'th':    'whiteSpace=wrap;html=1;fillColor=#333333;strokeColor=#333333;fontColor=#FFFFFF;fontStyle=1;fontSize=13;',
    'td':    'whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#BBBBBB;align=left;verticalAlign=middle;spacingLeft=8;spacingRight=6;fontSize=12.5;',
    'tdc':   'whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#BBBBBB;align=center;verticalAlign=middle;fontSize=12.5;fontStyle=1;',
    'lane':  'rounded=0;whiteSpace=wrap;html=1;fillColor=#FAFAFA;strokeColor=#CCCCCC;verticalAlign=top;fontStyle=1;fontSize=14;',
    'title': 'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontSize=22;fontStyle=1;',
    'meta':  'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontSize=13;',
    'lbl':   'whiteSpace=wrap;html=1;text;align=left;verticalAlign=middle;fontSize=12;',
}
EDGE = ('edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;fontSize=12;'
        'labelBackgroundColor=#FFFFFF;jumpStyle=arc;jumpSize=10;')
SIDE = {'T': (0.5, 0), 'B': (0.5, 1), 'L': (0, 0.5), 'R': (1, 0.5)}

ALL_IDS = {}          # รหัสโหนด -> หน้าที่อยู่ (ใช้ตรวจ edge case)


class Page:
    def __init__(self, pid, name, w, h):
        self.pid, self.name, self.w, self.h = pid, name, w, h
        self.cells, self.geo, self.n = [], {}, 0

    def _id(self):
        self.n += 1
        return '%s-%d' % (self.pid, self.n)

    def box(self, kind, text, x, y, w, h, key=None, extra=''):
        i = self._id()
        self.cells.append('<mxCell id="%s" value="%s" style="%s%s" parent="1" vertex="1">'
                          '<mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
                          % (i, escape(text, {'"': '&quot;'}), ST[kind], extra, x, y, w, h))
        if key:
            assert key not in self.geo, 'รหัสซ้ำ ' + key
            self.geo[key] = (i, x, y, w, h)
            ALL_IDS[key] = self.pid
        return i

    def edge(self, a, b, out='B', inn='T', label='', pts=(), dashed=False):
        ia, ib = self.geo[a][0], self.geo[b][0]
        ox, oy = SIDE[out]
        ix, iy = SIDE[inn]
        st = EDGE + 'exitX=%g;exitY=%g;exitDx=0;exitDy=0;entryX=%g;entryY=%g;entryDx=0;entryDy=0;' % (ox, oy, ix, iy)
        if dashed:
            st += 'dashed=1;'
        geo = '<mxGeometry relative="1" as="geometry"/>'
        if pts:
            geo = ('<mxGeometry relative="1" as="geometry"><Array as="points">' +
                   ''.join('<mxPoint x="%d" y="%d"/>' % p for p in pts) + '</Array></mxGeometry>')
        self.cells.append('<mxCell id="%s" value="%s" style="%s" parent="1" source="%s" target="%s" edge="1">%s</mxCell>'
                          % (self._id(), escape(label), st, ia, ib, geo))
        self.edges = getattr(self, 'edges', [])
        self.edges.append((a, b))

    def cx(self, k):
        _, x, y, w, h = self.geo[k]
        return x + w // 2

    def cy(self, k):
        _, x, y, w, h = self.geo[k]
        return y + h // 2

    def xml(self):
        return ('<diagram id="%s" name="%s"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" '
                'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" '
                'background="#FFFFFF" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s'
                '</root></mxGraphModel></diagram>' % (self.pid, escape(self.name), self.w, self.h, ''.join(self.cells)))


def header(p, title, role, extra):
    p.box('title', title, 40, 20, 1100, 34)
    p.box('meta', '<b>ผู้ใช้งาน:</b> ' + role, 40, 62, 1100, 22)
    p.box('meta', '<b>อ้างอิงต้นแบบ:</b> docs/index-q/index-q.html · ' + extra, 40, 84, 1100, 22)


def legend(p, x, y, items):
    p.box('lbl', '<b>สัญลักษณ์</b>', x, y, 330, 24)
    for i, (k, lab) in enumerate(items):
        col, row = i % 2, i // 2
        p.box(k, '', x + col * 170, y + 28 + row * 34, 44, 26)
        p.box('lbl', lab, x + 50 + col * 170, y + 28 + row * 34, 120, 26)


LEGEND = [('start', 'เริ่ม'), ('end', 'จบ'), ('io', 'รับข้อมูล / แสดงผล'), ('proc', 'ประมวลผล'),
          ('dec', 'เงื่อนไข'), ('db', 'ข้อมูล (อ่าน/เขียน)'), ('sub', 'กระบวนการย่อย'),
          ('err', 'แจ้งข้อผิดพลาด · จบ'), ('skip', 'ข้าม / ไม่ทำ')]

# ═══════════════════════════════════════════════════════════════════════
# หน้า 0 · ภาพรวม
# ═══════════════════════════════════════════════════════════════════════
p0 = Page('cy-0', '0 · ภาพรวม', 1400, 720)
header(p0, '2.9 ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่ — ภาพรวม',
       'ผู้สอน (เฉพาะวิชาที่ตนสอน) หรือ ADMIN (ทุกวิชา) · สิทธิ์ <b>course.create</b>',
       'modalCopyLevel() · copyLevelPlan() · copyLevelDo() · cloneCourse() · STUDY_PLAN')
p0.box('meta', '<b>เรื่องนี้ทำอะไร:</b> เปิดวิชาของชั้นปีหนึ่ง (เช่น ปี 1) ของปีการศึกษาเดิม ไปปีการศึกษาถัดไปในครั้งเดียว '
               '(เช่น 2568 → 2569) โดยระบบรู้เองว่าวิชาไหนเป็นของชั้นปีไหนจากแผนการเรียนของหลักสูตร', 40, 106, 1100, 40)
box_y, box_h = 170, 220
cols = [
    ('เข้า (Input)', 'proc',
     '• ชั้นปี 1–4<br>• ปีต้นทาง และปีปลายทาง (ค่าตั้งต้น = ปีต้นทาง + 1)<br>'
     '• แผนการเรียน STUDY_PLAN %d รายวิชา จากหลักสูตร ค.อ.บ. เทคโนโลยีคอมพิวเตอร์ (ปรับปรุง 2567) หน้า 15–19<br>'
     '• รายวิชาที่ผู้ใช้เข้าถึงได้ในปีต้นทาง' % N_PLAN),
    ('ระบบทำ (Process)', 'proc',
     '1. เลือกวิชาของชั้นปีตามแผน ติ๊กไว้ให้<br>2. ติดคำเตือนทีละวิชา<br>3. ผู้ใช้ตรวจ แก้ที่ติ๊ก แล้วยืนยัน<br>'
     '4. ตรวจซ้ำทีละวิชาตอนกดยืนยัน<br>5. คัดลอกโครงรายวิชา 7 ตาราง (หน้า 2)<br>6. เก็บ “เลิกทำ” ทั้งชุด'),
    ('ออก (Output)', 'proc',
     '• รายวิชาใหม่ในภาคเดิม ปีใหม่ Sec เดิม<br>• CLO · วัตถุประสงค์ · กิจกรรม · เกณฑ์ · ขั้นเกรด · ผู้สอน<br>'
     '• ร่องรอยต้นทาง copiedFrom บนวิชาและ CLO<br>• ข้อความสรุป: สร้างกี่วิชา ข้ามกี่วิชา'),
    ('ไม่ทำ (Out of scope)', 'skip',
     '• ไม่คัดลอกนักศึกษา คะแนน เกรด<br>• ไม่รวมผลข้าม Sec หรือข้ามปี<br>• ไม่เพิ่ม Sec ใหม่ (ใช้ “ทำสำเนา” ทีละวิชา)<br>'
     '• ไม่แก้ข้อมูลของวิชาต้นทาง'),
]
for i, (t, k, body) in enumerate(cols):
    x = 40 + i * 330
    p0.box('th', t, x, box_y, 310, 34)
    p0.box('note' if k != 'skip' else 'skip', body, x, box_y + 34, 310, box_h - 34,
           extra='align=left;verticalAlign=top;spacingLeft=10;spacingTop=8;')
for i in range(3):
    pass
p0.box('meta', '<b>แผนที่หน้า</b>', 40, 420, 400, 24)
maps = [
    ('หน้า 1 · ขั้นตอนหลัก S1–S15', 'ผู้ใช้ · ระบบ · ข้อมูล แยกเลน เห็นว่าใครทำอะไรเมื่อไร มีทางวนกลับและทางออกผิดปกติ F1–F4'),
    ('หน้า 2 · คัดลอกโครงรายวิชา T1–T8', 'ทีละตาราง ตามลำดับที่ข้อมูลอ้างถึงกัน และตารางที่ไม่คัดลอก'),
    ('หน้า 3 · Edge case E01–E23', 'ตารางกรณีพิเศษ แต่ละแถวอ้างขั้น S#/T# ในหน้า 1–2 พร้อมสถานะว่าทำแล้วหรือยัง'),
]
for i, (a, b) in enumerate(maps):
    p0.box('th', a, 40, 450 + i * 56, 360, 48)
    p0.box('td', b, 400, 450 + i * 56, 740, 48)
p0.box('meta', '<b>ระบบรหัส:</b> S = ขั้นตอนหลัก · D = ข้อมูล · P = กระบวนการย่อย · F = ทางออกแจ้งข้อผิดพลาด · K = ทางข้าม · '
               'T = ตารางที่คัดลอก · E = edge case · อ้างกันได้ทุกหน้า', 40, 640, 1100, 40)
legend(p0, 1160, 170, LEGEND)

# ═══════════════════════════════════════════════════════════════════════
# หน้า 1 · ขั้นตอนหลัก (swimlane)
# ═══════════════════════════════════════════════════════════════════════
LANES = [('ผู้ใช้', 40, 300), ('ระบบ (ต้นแบบ)', 340, 560), ('ข้อมูล', 900, 300)]
UC, SC, DC = 190, 480, 1050          # กึ่งกลางเลน
ROW0, DY = 215, 112
ROWS = 14
p1 = Page('cy-1', '1 · ขั้นตอนหลัก', 1760, ROW0 + ROWS * DY + 60)
header(p1, '2.9 ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่ — ขั้นตอนหลัก',
       'ผู้สอน (เฉพาะวิชาที่ตนสอน) หรือ ADMIN (ทุกวิชา) · สิทธิ์ <b>course.create</b>',
       'modalCopyLevel() · copyLevelPlan() · copyLevelDo()')
p1.box('meta', '<b>อ่านอย่างไร:</b> ลูกศรทึบ = ลำดับงาน · วงกลับ “เปลี่ยนชั้นปี/ปี” ไปคำนวณรายการใหม่ · '
               'กล่องแดง = ออกจากงานทันที · กล่องเทาประ = ข้ามวิชานั้นแล้วทำวิชาถัดไป', 40, 106, 1100, 22)
lane_top, lane_h = ROW0 - 70, (ROWS - 1) * DY + 110
for name, x, w in LANES:
    p1.box('lane', name, x, lane_top, w, lane_h)
legend(p1, 1260, lane_top, LEGEND)


def N(key, lane, row, kind, text, w=260, h=64, dx=0):
    cx = {'U': UC, 'S': SC, 'D': DC}[lane] + dx
    cyy = ROW0 + row * DY
    p1.box(kind, '<b>%s</b> · %s' % (key, text) if re.match(r'^[SDPFK]\d', key) else text,
           cx - w // 2, cyy - h // 2, w, h, key=key)


N('S1', 'U', 0, 'start', 'กด “ยกโครงทั้งชั้นปี”<br>ที่หน้าจัดการรายวิชา', 240, 56)
N('S2', 'S', 1, 'dec', 'มีสิทธิ์ course.create ?<br>(บัญชียังใช้งานได้)', 260, 96)
N('F1', 'S', 1, 'err', 'แจ้ง “สิทธิ์ไม่พอ …”<br>+ บันทึก AuthEvent DENY → จบ', 220, 64, dx=300)
N('S3', 'S', 2, 'proc', 'ตั้งค่าตั้งต้น: ชั้นปี 1<br>ปีต้นทาง = ปีล่าสุดที่มีวิชาชั้นปีนั้น · ปลายทาง = ต้นทาง+1', 270, 70)
N('D1', 'D', 2, 'db', 'อ่าน STUDY_PLAN<br>+ Course ที่เข้าถึงได้ในปีต้นทาง', 250, 70)
N('S4', 'S', 3, 'proc', 'จัดวิชาเป็น 3 กลุ่ม<br>① ตามแผน → ติ๊ก ② นอกแผน → ไม่ติ๊ก<br>③ ในแผนแต่ไม่ได้เปิด → แสดงอย่างเดียว', 290, 84)
N('S5', 'S', 4, 'proc', 'ตรวจทีละวิชา ติดคำเตือน<br>(ซ้ำที่ปลายทาง · ภาคไม่ตรงแผน · ชื่อไม่ตรง<br>· ตั้งค่าไม่ครบ · ผู้สอนถูกระงับ)', 290, 84)
N('S6', 'U', 5, 'io', 'แสดงรายการ<br>ภาค/ปีเดิม → ภาค/ปีใหม่ · Sec เดิม', 250, 64)
N('S7', 'U', 6, 'dec', 'ผู้ใช้ทำอะไร ?', 220, 90)
N('F2', 'S', 6, 'end', 'จบ (ยกเลิก)', 150, 44, dx=-30)
N('S8', 'S', 7, 'dec', 'ปีปลายทาง &gt; ปีต้นทาง ?', 260, 90)
N('F3', 'S', 7, 'err', 'แจ้ง “ปีปลายทางต้องอยู่หลังปีต้นทาง” → จบ', 240, 64, dx=300)
N('S9', 'S', 8, 'dec', 'เลือกอย่างน้อย 1 วิชา ?', 260, 90)
N('F4', 'S', 8, 'err', 'แจ้ง “ยังไม่ได้เลือกรายวิชา” → จบ', 240, 64, dx=300)
N('S10', 'S', 9, 'dec', 'วิชานี้ยังอยู่ในขอบเขตผู้ใช้<br>และ key (รหัส·ภาค·ปีใหม่·Sec) ว่าง ?', 280, 100)
N('K1', 'S', 9, 'skip', 'ข้ามวิชานี้ ไม่เขียนทับ<br>นับเป็น “ข้าม” (FR-21)', 220, 60, dx=300)
N('S11', 'S', 10, 'sub', 'คัดลอกโครงรายวิชา (cloneCourse)<br>รายละเอียด = หน้า 2 · T1–T7', 270, 64)
N('D2', 'D', 10, 'db', 'เขียน Course · CourseInstructor<br>GradeBand · CLO · Objective<br>Activity · Criteria', 250, 84)
N('S12', 'S', 11, 'dec', 'ยังมีวิชาที่เลือกเหลือ ?', 260, 90)
N('S13', 'S', 12, 'proc', 'เก็บ “เลิกทำ” = ลบวิชาที่สร้างทั้งชุด<br>ปิดหน้าต่าง · แสดงวิชารายภาค', 270, 64)
N('S14', 'U', 12, 'io', 'แจ้ง “คัดลอกปี N ไป Y แล้ว … วิชา<br>· ข้าม … · ยังไม่มีรายชื่อและคะแนน”<br>+ ปุ่มเลิกทำ', 250, 78)
N('S15', 'U', 13, 'end', 'จบ', 140, 44)

p1.edge('S1', 'S2', 'B', 'L', pts=[(UC, p1.cy('S2'))])
p1.edge('S2', 'F1', 'R', 'L', 'ไม่ใช่')
p1.edge('S2', 'S3', 'B', 'T', 'ใช่')
p1.edge('S3', 'D1', 'R', 'L')
p1.edge('D1', 'S4', 'B', 'R', pts=[(DC, p1.cy('S4'))])
p1.edge('S4', 'S5')
p1.edge('S5', 'S6', 'L', 'T', pts=[(UC, p1.cy('S5'))])
p1.edge('S6', 'S7')
p1.edge('S7', 'S4', 'L', 'L', 'เปลี่ยนชั้นปี / ปี', pts=[(55, p1.cy('S7')), (55, p1.cy('S4'))])
p1.edge('S7', 'F2', 'R', 'L', 'ยกเลิก')
p1.edge('S7', 'S8', 'B', 'L', 'คัดลอกที่เลือก', pts=[(UC, p1.cy('S8'))])
p1.edge('S8', 'F3', 'R', 'L', 'ไม่ใช่')
p1.edge('S8', 'S9', 'B', 'T', 'ใช่')
p1.edge('S9', 'F4', 'R', 'L', 'ไม่ใช่')
p1.edge('S9', 'S10', 'B', 'T', 'ใช่ · วิชาแรก')
p1.edge('S10', 'K1', 'R', 'L', 'ไม่ใช่')
p1.edge('S10', 'S11', 'B', 'T', 'ใช่')
p1.edge('S11', 'D2', 'R', 'L')
p1.edge('S11', 'S12')
p1.edge('K1', 'S12', 'B', 'R', pts=[(p1.cx('K1'), p1.cy('S12'))])
p1.edge('S12', 'S10', 'L', 'L', 'ใช่ · วิชาถัดไป', pts=[(330, p1.cy('S12')), (330, p1.cy('S10'))])
p1.edge('S12', 'S13', 'B', 'T', 'ไม่ใช่')
p1.edge('S13', 'S14', 'L', 'R')
p1.edge('S14', 'S15')

# ═══════════════════════════════════════════════════════════════════════
# หน้า 2 · คัดลอกโครงรายวิชา (cloneCourse)
# ═══════════════════════════════════════════════════════════════════════
p2 = Page('cy-2', '2 · คัดลอกโครงรายวิชา', 1700, 1420)
header(p2, '2.9 คัดลอกโครงรายวิชา (cloneCourse) — ทีละตาราง',
       'ระบบ (เรียกจาก S11 ต่อวิชา)',
       'cloneCourse() · FORMS.course.remove() (ใช้ตอนเลิกทำ)')
p2.box('meta', '<b>หลักคิด:</b> คัดลอก “โครง” (สิ่งที่ผู้สอนคิดไว้) ไม่คัดลอก “คน” และสิ่งที่คนทำ · ตารางที่อ้างอิงกันคัดลอกตามลำดับ '
               'และจำคู่ id เก่า → ใหม่ (cloMap · objMap · actMap) เพื่อผูกลูกกับพ่อใหม่', 40, 106, 1200, 40)
COLS = [('ตาราง', 40, 330), ('คัดลอกอย่างไร', 410, 470), ('ข้อควรระวัง / edge case', 920, 480)]
y0 = 170
for t, x, w in COLS:
    p2.box('th', t, x, y0, w, 34)
rows = [
    ('T1', 'Course', 'คัดลอกทุกช่อง<br>แก้ semester · year · section ตามที่ส่งมา · copiedFrom = วิชาต้นทาง · สร้าง id ใหม่ (มีเลขลำดับ)',
     'ภาคเดิม ปีใหม่ Sec เดิม (คัดลอกทั้งชั้นปี) หรือ Sec ใหม่ (ปุ่มทำสำเนา) · key ซ้ำถูกกันที่ S10 แล้ว'),
    ('T2', 'CourseInstructor', 'คัดลอกเฉพาะผู้สอนที่บัญชีใช้งานได้ (ไม่ระงับ ไม่รออนุมัติ) · ผู้สอนที่กดต้องมีชื่ออยู่เสมอ (P17)',
     'ADMIN คัดลอกแล้วไม่มีผู้สอนที่ใช้งานได้ → วิชาไม่มีผู้สอน (FR-23) ต้องมอบหมายต่อ'),
    ('T3', 'GradeBand', 'คัดลอกขั้นบันไดเกรดทุกขั้น (เกรด + ค่าต่ำสุด)',
     'ผ่าน/ไม่ผ่านมีแค่ S และ U · key (courseId, minValue) ไม่ชนเพราะเป็นวิชาใหม่'),
    ('T4', 'CLO', 'คัดลอกทุกช่อง: เลข · น้ำหนัก · levelSource · Bloom · SOLO · classTarget · คำอธิบาย · copiedFrom = CLO เดิม · จำ cloMap',
     'น้ำหนักรวมไม่ถึง 100 ติดไปตามเดิม · Bloom ว่างก็ว่าง · ใช้ copiedFrom เทียบ CLO ข้ามปีแทนเลขข้อ'),
    ('T5', 'BehavioralObjective', 'คัดลอกทุกช่อง · ผูกกับ CLO ใหม่ผ่าน cloMap · จำ objMap',
     'จุดประสงค์ที่ไม่มี CLO พ่อไม่ถูกคัดลอก · น้ำหนักในแต่ละ CLO ≠ 100 ติดไปตามเดิม'),
    ('T6', 'Activity', 'คัดลอกทุกช่อง ยกเว้น id/courseId · closedAt = ว่าง · groupWeight คัดลอกเป็นวัตถุใหม่ · จำ actMap',
     'เปิดรับคะแนนใหม่ในปีใหม่ · แก้น้ำหนักกลุ่มปีใหม่ไม่กระทบปีเก่า · น้ำหนักกิจกรรมรวม ≠ 100 ติดไปตามเดิม'),
    ('T7', 'AssessmentCriteria', 'สร้างคู่ (กิจกรรมใหม่, วัตถุประสงค์ใหม่) จาก actMap + objMap พร้อมสัดส่วนเดิม',
     'หาคู่ไม่เจอ = ไม่สร้าง จึงไม่มีการเชื่อมข้ามวิชา (trigger DC-04 ไม่มีวันถูกเรียก)'),
]
RH = 96
for i, (tid, tbl, how, caution) in enumerate(rows):
    y = y0 + 46 + i * (RH + 22)
    p2.box('db', '<b>%s</b> · %s' % (tid, tbl), 40, y, 330, RH, key=tid)
    p2.box('proc', how, 410, y, 470, RH, extra='align=left;spacingLeft=10;')
    p2.box('note', caution, 920, y, 480, RH)
    if i:
        p2.edge(rows[i - 1][0], tid)
ty = y0 + 46 + len(rows) * (RH + 22)
p2.box('skip', '<b>T8</b> · ไม่คัดลอก (ข้อมูลของคน — เป็นของภาคที่เรียนจริง)', 40, ty, 330, 110, key='T8')
p2.box('skip', 'Student · Score · StudentGrade (เกรดที่ตรึง) · การปรับเกรด · RemediationPlan · ScoreChange · ScoreUploadLog · UploadReject',
       410, ty, 470, 110, extra='align=left;spacingLeft=10;')
p2.box('note', 'วิชาใหม่ว่างเปล่า → นำเข้ารายชื่อ (7.1) ก่อน แล้วจึงนำเข้าคะแนน (6.1) · '
               'การลอกคะแนนไปด้วยคือการสร้างข้อมูลปลอม',
       920, ty, 480, 110)
p2.edge('T7', 'T8', dashed=True)
p2.box('meta', '<b>ลำดับขึ้นอยู่กัน:</b> T4 → T5 (ต้องมี cloMap) · T6 → T7 (ต้องมี actMap และ objMap) · '
               'T1 ต้องมาก่อนทุกตารางเพราะทุกตารางอ้าง courseId ใหม่', 40, ty + 130, 1360, 24)
legend(p2, 1440, y0, LEGEND[:6])

# ═══════════════════════════════════════════════════════════════════════
# หน้า 3 · Edge case
# ═══════════════════════════════════════════════════════════════════════
DONE, TODO, PART = 'ทำแล้ว', 'ยังไม่ทำ', 'บางส่วน'
CASES = [
    # (รหัส, ขั้น/ตาราง, กรณี, ระบบทำอย่างไร, สถานะ)
    ('S2', 'ผู้ใช้ไม่มีสิทธิ์ หรือบัญชีถูกระงับ', 'ปฏิเสธ แจ้งสาเหตุ และบันทึก DENY ลงประวัติ (SEC-5)', DONE),
    ('S4', 'ปีต้นทางไม่มีวิชาของชั้นปีที่เลือก (หรือผู้ใช้ไม่ได้สอน)', 'แสดง “ไม่มีวิชาของชั้นปีนี้ที่คุณเข้าถึงได้” ไม่สร้างวิชาเปล่า', DONE),
    ('S4', 'วิชาอยู่ในแผนแต่เปิดคนละภาคกับแผน', 'คงภาคเดิมที่เปิดจริง และเตือนว่าแผนกำหนดภาคอื่น', DONE),
    ('S4', 'วิชาเลือก / วิชาที่ไม่อยู่ในแผน (รหัส 9064XXXX · XXXXXXXX)', 'อยู่กลุ่ม “นอกแผน” ไม่ติ๊ก ผู้ใช้ติ๊กเอง', DONE),
    ('S4', 'วิชาในแผนที่ปีต้นทางไม่ได้เปิด', 'แสดงรายชื่ออย่างเดียว ไม่สร้างวิชาเปล่า ให้ไปสร้างเองที่ “สร้างรายวิชา”', DONE),
    ('S5', 'ชื่อวิชาไม่ตรงกับหลักสูตร', 'เตือนพร้อมชื่อในเล่ม · ไม่แก้ให้ ไม่บล็อก', DONE),
    ('S5', 'ต้นทางยังตั้งค่าไม่ครบ (มีข้อค้าง)', 'เตือนจำนวนข้อค้าง · ข้อที่ค้างติดไปกับสำเนา', DONE),
    ('S5', 'ผู้สอนต้นทางถูกระงับ หรือรออนุมัติ', 'ไม่คัดลอกคนนั้น และเตือนจำนวนที่ไม่ได้คัดลอก', DONE),
    ('S5', 'ไม่มีผู้สอนที่ใช้งานได้เลย (ADMIN กดคัดลอก)', 'เตือนสีแดง · คัดลอกได้ แต่ต้องมอบหมายผู้สอนต่อ (FR-23)', DONE),
    ('S7', 'เปลี่ยนชั้นปี หรือปีต้นทางระหว่างตรวจรายการ', 'คำนวณรายการใหม่ · เปลี่ยนปีต้นทางแล้วปีปลายทางเลื่อนเป็นปีถัดไป', DONE),
    ('S8', 'ปีปลายทางไม่อยู่หลังปีต้นทาง', 'ปฏิเสธตอนกดยืนยัน (ตัวเลือกจำกัดอยู่แล้ว แต่ไม่พึ่งตัวเลือกอย่างเดียว)', DONE),
    ('S9', 'ไม่ได้เลือกวิชาเลย', 'แจ้ง “ยังไม่ได้เลือกรายวิชา” ไม่ทำอะไร', DONE),
    ('S10', 'ปลายทางมีวิชานี้แล้ว (รหัส·ภาค·ปี·Sec ซ้ำ)', 'ข้าม ไม่เขียนทับ ตรวจซ้ำตอนกดยืนยัน เพราะระหว่างเปิดหน้าต่างอาจมีคนสร้างไปแล้ว', DONE),
    ('S10', 'วิชาหลุดจากขอบเขตผู้ใช้ระหว่างเปิดหน้าต่าง', 'ข้ามวิชานั้น (ขอบเขตรายวิชาคือขอบเขตข้อมูลเดียวของระบบ)', DONE),
    ('S13', 'กดผิด ต้องการย้อน', 'เลิกทำ = ลบวิชาที่สร้างทั้งชุดผ่านตัวลบเดียวกับปุ่มลบรายวิชา · หมดอายุ 5 นาที', DONE),
    ('T4', 'น้ำหนัก CLO รวมไม่ถึง 100 หรือ Bloom/SOLO ว่าง', 'ติดไปตามเดิม ไม่แก้ให้ — ผู้สอนตรวจในปีใหม่', DONE),
    ('T6', 'กิจกรรมที่ปิดรับคะแนนแล้ว · โหมดน้ำหนักตามกลุ่ม', 'เปิดรับคะแนนใหม่ (closedAt ว่าง) · คัดลอกน้ำหนักกลุ่มเป็นชุดใหม่', DONE),
    ('T8', 'ต้องการคัดลอกนักศึกษา / คะแนน / เกรดไปด้วย', 'ไม่ทำโดยเจตนา — เป็นข้อมูลของภาคเดิม (J6)', DONE),
    ('S4', 'ปีปลายทางมีห้องเรียนมากกว่าปีต้นทาง (Sec ใหม่)', 'หน้านี้คัดลอก Sec เดิมเท่านั้น · Sec เพิ่มใช้ “ทำสำเนา” ทีละวิชา', PART),
    ('S11', 'คัดลอกล้มกลางทาง (บางวิชาสำเร็จ บางวิชาไม่)', 'ต้นแบบทำในหน่วยความจำจึงไม่ล้มกลางทาง · ระบบจริงต้องทำต่อวิชาในธุรกรรมเดียว แล้วรายงานรายวิชา', TODO),
    ('T4', 'เทียบผล CLO ข้ามปี / รวมข้าม Sec', 'เก็บ copiedFrom ไว้แล้ว แต่ยังไม่มีรายงานเทียบ · รวมข้าม Sec ตัดออกโดยเจตนา (มติ 2.7)', TODO),
    ('D1', 'ตาราง StudyPlanCourse ยังไม่อยู่ใน schema.prisma', 'แผนการเรียนอยู่ในโค้ดต้นแบบ (STUDY_PLAN) · ต้องเพิ่มตาราง + คอลัมน์ copiedFromId ก่อนทำฝั่ง server', TODO),
    ('D1', 'หลักสูตรปรับปรุงรอบใหม่ (รหัสหรือ CLO เปลี่ยน)', 'ต้องแก้ STUDY_PLAN เอง · สำเนาพา CLO ชุดเก่าไปด้วย ผู้สอนต้องตรวจก่อนใช้', TODO),
]
p3 = Page('cy-3', '3 · Edge case', 1500, 190 + 50 * (len(CASES) + 1) + 90)
header(p3, '2.9 Edge case ของการยกโครงทั้งชั้นปี',
       'ทุกแถวอ้างขั้น S# (หน้า 1) หรือตาราง T# (หน้า 2) หรือข้อมูล D# ที่มีอยู่จริง · สถานะวัดจากต้นแบบ index-q.html',
       'copyLevelPlan() · copyLevelDo() · cloneCourse()')
cw = [64, 70, 380, 780, 110]
cx = [40]
for w in cw[:-1]:
    cx.append(cx[-1] + w)
for t, x, w in zip(['รหัส', 'ขั้น', 'กรณี', 'ระบบทำอย่างไร', 'สถานะ'], cx, cw):
    p3.box('th', t, x, 130, w, 36)
for i, (ref, case, how, status) in enumerate(CASES):
    y = 166 + i * 50
    p3.box('tdc', 'E%02d' % (i + 1), cx[0], y, cw[0], 50)
    p3.box('tdc', ref, cx[1], y, cw[1], 50)
    p3.box('td', case, cx[2], y, cw[2], 50)
    p3.box('td', how, cx[3], y, cw[3], 50)
    p3.box({DONE: 'ok', PART: 'warn', TODO: 'err'}[status], status, cx[4], y, cw[4], 50,
           extra='align=center;verticalAlign=middle;fontStyle=1;')
n_done = sum(1 for c in CASES if c[3] == DONE)
p3.box('meta', '<b>สรุป:</b> %d กรณี · ทำแล้ว %d · บางส่วน %d · ยังไม่ทำ %d' %
       (len(CASES), n_done, sum(1 for c in CASES if c[3] == PART), sum(1 for c in CASES if c[3] == TODO)),
       40, 166 + len(CASES) * 50 + 16, 1200, 24)

# ═══════════════════════════════════════════════════════════════════════
# ตรวจความถูกต้องของโมเดล
# ═══════════════════════════════════════════════════════════════════════
problems = []
for p in (p1, p2):
    ids = {v[0] for v in p.geo.values()}
    for a, b in getattr(p, 'edges', []):
        if p.geo[a][0] not in ids or p.geo[b][0] not in ids:
            problems.append('%s: เส้น %s→%s ชี้ไปโหนดที่ไม่มี' % (p.pid, a, b))
    # ไม่มีโหนดโดดเดี่ยวในหน้าที่เป็นผังลำดับงาน (ข้ามเลน/หัวตาราง)
    linked = {x for e in p.edges for x in e}
    for k in p.geo:
        if re.match(r'^(S|D|F|K|T)\d+$', k) and k not in linked:
            problems.append('%s: โหนด %s ไม่มีเส้นเชื่อมเลย' % (p.pid, k))
for ref, case, how, st in CASES:
    if ref not in ALL_IDS:
        problems.append('edge case อ้างรหัส %s ซึ่งไม่มีในไดอะแกรม' % ref)
decisions = [k for k in ALL_IDS if re.match(r'^S\d+$', k) and k in p1.geo and 'rhombus' in
             next(c for c in p1.cells if 'id="%s"' % p1.geo[k][0] in c)]
cited = {c[0] for c in CASES}
for k in decisions:
    if k not in cited and k not in ('S7', 'S12'):
        problems.append('เงื่อนไข %s ไม่มี edge case รองรับ' % k)
if problems:
    raise SystemExit('โมเดลไม่ผ่าน:\n  ' + '\n  '.join(problems))

xml = ('<mxfile host="drawio" agent="CMAS scripts/build-copy-year-flowchart-drawio.py" version="24.0.0">' +
       ''.join(p.xml() for p in (p0, p1, p2, p3)) + '</mxfile>')
OUT.parent.mkdir(parents=True, exist_ok=True)
io.open(OUT, 'w', encoding='utf-8', newline='').write(xml)
print('wrote', OUT.relative_to(ROOT), '· 4 หน้า')
print('  หน้า 1: %d โหนด · หน้า 2: %d ตาราง · edge case %d (ทำแล้ว %d)' %
      (len(p1.geo), len([k for k in p2.geo if k.startswith('T')]), len(CASES), n_done))
print('  STUDY_PLAN ในต้นแบบ: %d รายวิชา' % N_PLAN)
