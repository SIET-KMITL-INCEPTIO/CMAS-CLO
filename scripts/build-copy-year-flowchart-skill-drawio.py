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

อ้างอิงโค้ด: docs/pages/index-q.html  (modalCopyLevel · copyLevelPlan · copyLevelDo · cloneCourse · STUDY_PLAN)
ผลลัพธ์:    docs/diagrams/flowchart/CMAS-Flowchart-CopyYearLevel-Skill.drawio

รัน:  python scripts/build-copy-year-flowchart-skill-drawio.py
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
OUT = ROOT / 'docs' / 'diagrams' / 'flowchart' / 'CMAS-Flowchart-CopyYearLevel-Skill.drawio'
APP = ROOT / 'docs' / 'pages' / 'index-q.html'

# ── ต้นแบบต้องมีฟังก์ชันที่ไดอะแกรมอ้างถึงจริง ─────────────────────────
_app = io.open(APP, encoding='utf-8').read()
for fn in ('function modalCopyLevel', 'function copyLevelPlan', 'function copyLevelDo',
           'function cloneCourse', 'const STUDY_PLAN'):
    if fn not in _app:
        raise SystemExit('index-q.html ไม่มี %r — ไดอะแกรมอ้างถึงสิ่งที่ไม่มีแล้ว' % fn)
N_PLAN = len(re.findall(r"\[(\d),(\d),'(\d{8})'", _app[_app.index('const STUDY_PLAN'):]))

# ── สไตล์ตามกฎ skill drawio-diagrams ────────────────────────────────────
# ฟอนต์ IBM Plex Sans Thai ≥16px · เส้น 2px ทึบ มุมฉาก · ขาว-ดำ + พื้น #EEF0F8 (เน้น ≤2 ต่อกรอบ)
# ทุกกล่องอยู่ในกรอบที่มีชื่อ · ≤9 กล่องต่อกรอบ · พิกัดลงตาราง 10px · ไม่มี gradient/เงา
import html as _html

FONT = ('fontFamily=IBM Plex Sans Thai;fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DIBM%2BPlex%2BSans%2BThai;'
        'fontSize=16;fontColor=#000000;')
BASE = 'html=1;whiteSpace=wrap;rounded=0;strokeWidth=2;strokeColor=#000000;fillColor=@F@;' + FONT
SHAPE = {
    'term': 'shape=mxgraph.flowchart.terminator;',
    'io':   'shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;size=18;',
    'proc': '',
    'sub':  'shape=process;backgroundOutline=1;size=0.06;',
    'dec':  'rhombus;',
}
LEFT = 'align=left;verticalAlign=top;spacingLeft=10;spacingRight=10;spacingTop=8;'
FRAME_ST = BASE.replace('@F@', 'none') + 'verticalAlign=top;align=left;spacingLeft=12;spacingTop=8;fontStyle=1;'
TEXT_ST = 'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;' + FONT
EDGE = ('edgeStyle=orthogonalEdgeStyle;html=1;rounded=0;strokeWidth=2;strokeColor=#000000;endArrow=block;endFill=1;'
        'labelBackgroundColor=#FFFFFF;' + FONT)
SIDE = {'T': (0.5, 0), 'B': (0.5, 1), 'L': (0, 0.5), 'R': (1, 0.5)}

GAP, LGAP = 60, 100          # ช่องว่างระหว่างกล่อง: เส้นไม่มีป้าย / เส้นมีป้าย
ALL_IDS = {}                 # รหัสโหนด -> หน้าที่อยู่ (ใช้ตรวจ edge case)
PAGES = {}


def n_lines(text, cpl):
    n = 0
    for seg in re.split(r'<br\s*/?>', text):
        seg = _html.unescape(re.sub(r'<[^>]+>', '', seg))
        n += max(1, -(-len(seg) // cpl))
    return n


def fit(text, w, kind='proc', min_h=60):
    """ประมาณความสูงกล่อง: ไทย 16px ≈ 9.5px/ตัว · ปัดขึ้นเป็นทวีคูณของ 20"""
    pad = {'term': 70, 'io': 80, 'sub': 60}.get(kind, 30)
    cpl = max(8, int((w - pad) / 9.5))
    h = 24 * n_lines(text, cpl) + 36
    return max(min_h, -(-h // 20) * 20)


class Page:
    def __init__(self, pid, name):
        self.pid, self.name = pid, name
        self.frames, self.cells, self.geo, self.n, self.edges = [], [], {}, 0, []
        self.maxy = 0
        PAGES[pid] = self

    def _id(self):
        self.n += 1
        return '%s-%d' % (self.pid, self.n)

    def box(self, kind, text, x, y, w, h, key=None, focus=False, left=False):
        assert all(v % 10 == 0 for v in (x, y, w, h)), 'ไม่ลงตาราง 10px: %s %r' % (key, (x, y, w, h))
        i = self._id()
        if kind == 'frame':
            st, bucket = FRAME_ST, self.frames
        elif kind == 'text':
            st, bucket = TEXT_ST, self.cells
        else:
            st = SHAPE[kind] + BASE.replace('@F@', '#EEF0F8' if focus else '#FFFFFF') + (LEFT if left else '')
            bucket = self.cells
        bucket.append('<mxCell id="%s" value="%s" style="%s" parent="1" vertex="1">'
                      '<mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
                      % (i, escape(text, {'"': '&quot;'}), st, x, y, w, h))
        if key:
            assert key not in self.geo and key not in ALL_IDS, 'รหัสซ้ำ ' + key
            self.geo[key] = (i, x, y, w, h)
            ALL_IDS[key] = self.pid
        self.maxy = max(self.maxy, y + h)
        return y + h

    def edge(self, a, b, out='B', inn='T', label='', pts=()):
        ia, ib = self.geo[a][0], self.geo[b][0]
        ox, oy = SIDE[out]
        ix, iy = SIDE[inn]
        st = EDGE + 'exitX=%g;exitY=%g;exitDx=0;exitDy=0;entryX=%g;entryY=%g;entryDx=0;entryDy=0;' % (ox, oy, ix, iy)
        geo = '<mxGeometry relative="1" as="geometry"/>'
        if pts:
            geo = ('<mxGeometry relative="1" as="geometry"><Array as="points">' +
                   ''.join('<mxPoint x="%d" y="%d"/>' % p for p in pts) + '</Array></mxGeometry>')
        self.cells.append('<mxCell id="%s" value="%s" style="%s" parent="1" source="%s" target="%s" edge="1">%s</mxCell>'
                          % (self._id(), escape(label), st, ia, ib, geo))
        self.edges.append((a, b))

    def cy(self, k):
        return self.geo[k][2] + self.geo[k][4] // 2

    def cx(self, k):
        return self.geo[k][1] + self.geo[k][3] // 2

    def bottom(self, k):
        return self.geo[k][2] + self.geo[k][4]

    def caption(self, text, x, w, y=90):
        h = max(30, -(-(24 * n_lines(text, int(w / 9.5)) + 6) // 10) * 10)
        self.box('text', text, x, y, w, h)
        return -(-(y + h + 30) // 10) * 10        # y เริ่มเนื้อหา

    def page_frame(self, title, x, w, bottom):
        """วาดกรอบหน้า (ชื่อ = ชื่อไดอะแกรม) ทับอยู่หลังสุด · bottom = ล่างสุดของเนื้อหา"""
        h = -(-(bottom + 40 - 40) // 10) * 10
        self.frames.insert(0, '<mxCell id="%s" value="%s" style="%s" parent="1" vertex="1">'
                              '<mxGeometry x="%d" y="40" width="%d" height="%d" as="geometry"/></mxCell>'
                           % (self._id(), escape(title, {'"': '&quot;'}), FRAME_ST, x, w, h))
        self.w, self.h = x + w + 40, 40 + h + 40

    def xml(self):
        return ('<diagram id="%s" name="%s"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" '
                'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" '
                'background="#FFFFFF" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s'
                '</root></mxGraphModel></diagram>'
                % (self.pid, escape(self.name), self.w, self.h, ''.join(self.frames) + ''.join(self.cells)))


def put(p, key, kind, text, cx, y, w, h=None, **kw):
    """วางกล่องกึ่งกลางที่ cx · คืนค่าขอบล่าง"""
    h = h or fit(text, w, kind)
    return p.box(kind, text, cx - w // 2, y, w, h, key=key, **kw)


def side(p, key, kind, text, x, w, cy, **kw):
    """วางกล่องข้างทาง ให้กึ่งกลางแนวตั้งตรงกับ cy"""
    h = fit(text, w, kind)
    return p.box(kind, text, x, cy - h // 2, w, h, key=key, **kw)


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


FOCUS_NOTE = ' · พื้นสีฟ้าอ่อน = ขั้นที่เป็นหัวใจของหน้านี้'

# ═══════════════════════════════════════════════════════════════════════
# หน้า 0 · ภาพรวม
# ═══════════════════════════════════════════════════════════════════════
p0 = Page('cy-0', '0 · ภาพรวม')
y = p0.caption('เปิดวิชาของชั้นปีหนึ่ง (เช่น ปี 1) ของปีการศึกษาเดิม ไปปีการศึกษาถัดไป (เช่น 2568 → 2569) ในครั้งเดียว '
               'ระบบรู้เองว่าวิชาไหนเป็นของชั้นปีไหนจากแผนการเรียนของหลักสูตร<br>'
               'ผู้ใช้: ผู้สอน (เฉพาะวิชาที่ตนสอน) หรือ ADMIN (ทุกวิชา) · สิทธิ์ course.create · '
               'ต้นแบบ: modalCopyLevel() · copyLevelPlan() · copyLevelDo() · cloneCourse() · STUDY_PLAN' + FOCUS_NOTE
               .replace('หน้านี้', 'หน้านี้ (ระบบทำ)'), 80, 1120)
IO = [
    ('เข้า (Input)', '• ชั้นปี 1–4<br>• ปีต้นทาง และปีปลายทาง (ค่าตั้งต้น = ปีต้นทาง + 1)<br>'
     '• แผนการเรียน STUDY_PLAN %d รายวิชา จากหลักสูตร ค.อ.บ. เทคโนโลยีคอมพิวเตอร์ (ปรับปรุง 2567) หน้า 15–19<br>'
     '• รายวิชาที่ผู้ใช้เข้าถึงได้ในปีต้นทาง' % N_PLAN, False),
    ('ระบบทำ (Process)', '1. เลือกวิชาของชั้นปีตามแผน ติ๊กไว้ให้<br>2. ติดคำเตือนทีละวิชา<br>3. ผู้ใช้ตรวจ แก้ที่ติ๊ก แล้วยืนยัน<br>'
     '4. ตรวจซ้ำทีละวิชาตอนกดยืนยัน<br>5. คัดลอกโครงรายวิชา 7 ตาราง (หน้า 2)<br>6. เก็บ “เลิกทำ” ทั้งชุด', True),
    ('ออก (Output)', '• รายวิชาใหม่ในภาคเดิม ปีใหม่ Sec เดิม<br>• CLO · วัตถุประสงค์ · กิจกรรม · เกณฑ์ · ขั้นเกรด · ผู้สอน<br>'
     '• ร่องรอยต้นทาง copiedFrom บนวิชาและ CLO<br>• ข้อความสรุป: สร้างกี่วิชา ข้ามกี่วิชา', False),
    ('ไม่ทำ (Out of scope)', '• ไม่คัดลอกนักศึกษา คะแนน เกรด<br>• ไม่รวมผลข้าม Sec หรือข้ามปี<br>'
     '• ไม่เพิ่ม Sec ใหม่ (ใช้ “ทำสำเนา” ทีละวิชา)<br>• ไม่แก้ข้อมูลของวิชาต้นทาง', False),
]
for r in range(2):
    pair = IO[r * 2:r * 2 + 2]
    bh = max(fit(b, 460) for _, b, _ in pair)
    for c, (t, body, foc) in enumerate(pair):
        gx = 80 + c * 580
        p0.box('frame', t, gx, y, 540, 60 + bh + 40)
        p0.box('proc', body, gx + 40, y + 60, 460, bh, focus=foc, left=True)
    y += 60 + bh + 40 + 40
MAPS = [
    ('หน้า 1A · เตรียมรายการ (S1–S6)', 'ตรวจสิทธิ์ ตั้งค่าตั้งต้น อ่านแผนการเรียน จัดวิชาเป็น 3 กลุ่ม ติดคำเตือน แล้วแสดงรายการ'),
    ('หน้า 1B · ผู้ใช้ตรวจและยืนยัน (S7–S9)', 'ผู้ใช้เปลี่ยนค่า ยกเลิก หรือกดคัดลอก · ตรวจปีปลายทางและจำนวนวิชาที่เลือก'),
    ('หน้า 1C · คัดลอกทีละวิชา (S10–S15)', 'ข้ามวิชาที่ซ้ำ คัดลอกวิชาที่เหลือทีละวิชา เก็บ “เลิกทำ” แล้วแจ้งผล'),
    ('หน้า 2 · คัดลอกโครงรายวิชา (T1–T8)', 'ทีละตาราง ตามลำดับที่ข้อมูลอ้างถึงกัน และตารางที่ไม่คัดลอก'),
    ('หน้า 3A–3C · Edge case (E01–E23)', 'กรณีพิเศษ แต่ละกรณีอ้างขั้น S# / ตาราง T# / ข้อมูล D# พร้อมสถานะว่าทำแล้วหรือยัง'),
]
mh = [fit('<b>%s</b><br>%s' % m, 1040) for m in MAPS]
mapbox_h = 60 + sum(mh) + 20 * (len(MAPS) - 1) + 40
p0.box('frame', 'แผนที่หน้า', 80, y, 1120, mapbox_h)
yy = y + 60
for (a, b), h in zip(MAPS, mh):
    p0.box('proc', '<b>%s</b><br>%s' % (a, b), 120, yy, 1040, h, left=True)
    yy += h + 20
y += mapbox_h + 30
y = p0.caption('ระบบรหัส: S = ขั้นตอนหลัก · D = ข้อมูล · F = ทางออกแจ้งข้อผิดพลาด · K = ทางข้าม · T = ตารางที่คัดลอก · '
               'E = edge case · อ้างกันได้ทุกหน้า', 80, 1120, y=y)
p0.page_frame('2.9 ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่ — ภาพรวม', 40, 1200, y - 30)

# ═══════════════════════════════════════════════════════════════════════
# หน้า 1A · เตรียมรายการ
# ═══════════════════════════════════════════════════════════════════════
pA = Page('cy-1a', '1A · เตรียมรายการ')
y = pA.caption('ผู้ใช้กดปุ่ม ระบบตรวจสิทธิ์ อ่านแผนการเรียน จัดวิชาเป็นกลุ่ม ติดคำเตือนทีละวิชา แล้วแสดงรายการให้ตรวจ · '
               'อ้างอิง: modalCopyLevel() · copyLevelPlan()' + FOCUS_NOTE, 80, 880)
CX, SX = 360, 680
b = put(pA, 'S1', 'term', '<b>S1</b> · ผู้ใช้กด “ยกโครงทั้งชั้นปี” ที่หน้าจัดการรายวิชา', CX, y, 340)
b = put(pA, 'S2', 'dec', '<b>S2</b> · มีสิทธิ์ course.create และบัญชียังใช้งานอยู่?', CX, b + GAP, 400, 180)
side(pA, 'F1', 'term', '<b>F1</b> · แจ้ง “สิทธิ์ไม่พอ” และบันทึกว่าถูกปฏิเสธ แล้วจบ', SX, 280, pA.cy('S2'))
b = put(pA, 'S3', 'proc', '<b>S3</b> · ตั้งค่าตั้งต้น: ชั้นปี 1 · ปีต้นทาง = ปีล่าสุดที่มีวิชาชั้นนั้น · ปลายทาง = ต้นทาง + 1', CX, b + LGAP, 340)
side(pA, 'D1', 'proc', '<b>D1</b> · อ่านแผนการเรียน (STUDY_PLAN) และวิชาที่เข้าถึงได้ในปีต้นทาง', SX, 280, pA.cy('S3'))
b = put(pA, 'S4', 'proc', '<b>S4</b> · จัดวิชาเป็น 3 กลุ่ม<br>① ตามแผน → ติ๊กให้<br>② นอกแผน → ไม่ติ๊ก<br>③ ในแผนแต่ไม่ได้เปิด → แสดงอย่างเดียว',
        CX, b + GAP, 340, focus=True)
b = put(pA, 'S5', 'proc', '<b>S5</b> · ตรวจทีละวิชา ติดคำเตือน (ซ้ำที่ปลายทาง · ภาคไม่ตรงแผน · ชื่อไม่ตรง · ตั้งค่าไม่ครบ · ผู้สอนถูกระงับ)',
        CX, b + GAP, 340)
b = put(pA, 'S6', 'io', '<b>S6</b> · แสดงรายการ ภาค/ปีเดิม → ภาค/ปีใหม่ · Sec เดิม', CX, b + GAP, 420)
b = put(pA, 'toB', 'sub', 'ผู้ใช้ตรวจรายการ (หน้า 1B)', CX, b + GAP, 340)
pA.edge('S1', 'S2')
pA.edge('S2', 'F1', 'R', 'L', 'ไม่ใช่')
pA.edge('S2', 'S3', 'B', 'T', 'ใช่')
pA.edge('S3', 'D1', 'R', 'L')
pA.edge('D1', 'S4', 'B', 'R', pts=[(pA.cx('D1'), pA.cy('S4'))])
pA.edge('S4', 'S5')
pA.edge('S5', 'S6')
pA.edge('S6', 'toB')
pA.page_frame('2.9 ขั้นตอนหลัก (1/3) — เตรียมรายการ', 40, 960, b)

# ═══════════════════════════════════════════════════════════════════════
# หน้า 1B · ผู้ใช้ตรวจและยืนยัน
# ═══════════════════════════════════════════════════════════════════════
pB = Page('cy-1b', '1B · ผู้ใช้ตรวจและยืนยัน')
y = pB.caption('ผู้ใช้ดูรายการแล้วเลือกว่าจะเปลี่ยนค่า ยกเลิก หรือคัดลอก · ถ้าคัดลอก ระบบตรวจปีปลายทางและจำนวนวิชาก่อนเริ่ม · '
               'อ้างอิง: copyLevelDo()' + FOCUS_NOTE, 80, 920)
CX = 550
b = put(pB, 'B0', 'term', 'เริ่ม · ผู้ใช้ตรวจรายการ (จากหน้า 1A)', CX, y, 320)
b = put(pB, 'S7', 'dec', '<b>S7</b> · ผู้ใช้ทำอะไร?', CX, b + GAP, 300, 140, focus=True)
side(pB, 'toA', 'sub', 'กลับไปคำนวณรายการใหม่ (หน้า 1A)', 80, 200, pB.cy('S7'))
side(pB, 'F2', 'term', '<b>F2</b> · ยกเลิก แล้วจบ', 820, 200, pB.cy('S7'))
b = put(pB, 'S8', 'dec', '<b>S8</b> · ปีปลายทางอยู่หลังปีต้นทาง?', CX, b + LGAP, 320, 160)
side(pB, 'F3', 'term', '<b>F3</b> · แจ้ง “ปีปลายทางต้องอยู่หลังปีต้นทาง” แล้วจบ', 820, 200, pB.cy('S8'))
b = put(pB, 'S9', 'dec', '<b>S9</b> · เลือกอย่างน้อย 1 วิชา?', CX, b + LGAP, 320, 160)
side(pB, 'F4', 'term', '<b>F4</b> · แจ้ง “ยังไม่ได้เลือกรายวิชา” แล้วจบ', 820, 200, pB.cy('S9'))
b = put(pB, 'toC', 'sub', 'คัดลอกทีละวิชา (หน้า 1C)', CX, b + LGAP, 340)
pB.edge('B0', 'S7')
pB.edge('S7', 'toA', 'L', 'R', 'เปลี่ยนค่า')
pB.edge('S7', 'F2', 'R', 'L', 'ยกเลิก')
pB.edge('S7', 'S8', 'B', 'T', 'คัดลอกที่เลือก')
pB.edge('S8', 'F3', 'R', 'L', 'ไม่ใช่')
pB.edge('S8', 'S9', 'B', 'T', 'ใช่')
pB.edge('S9', 'F4', 'R', 'L', 'ไม่ใช่')
pB.edge('S9', 'toC', 'B', 'T', 'ใช่')
pB.page_frame('2.9 ขั้นตอนหลัก (2/3) — ผู้ใช้ตรวจและยืนยัน', 40, 1020, b)

# ═══════════════════════════════════════════════════════════════════════
# หน้า 1C · คัดลอกทีละวิชา
# ═══════════════════════════════════════════════════════════════════════
pC = Page('cy-1c', '1C · คัดลอกทีละวิชา')
y = pC.caption('ระบบวนทีละวิชาที่เลือก: ข้ามวิชาที่ซ้ำหรือหลุดขอบเขต คัดลอกวิชาที่เหลือ แล้วเก็บ “เลิกทำ” และแจ้งผล · '
               'อ้างอิง: copyLevelDo() · cloneCourse()' + FOCUS_NOTE, 80, 1120)
CX = 700
b = put(pC, 'C0', 'term', 'เริ่ม · คัดลอกทีละวิชา (จากหน้า 1B)', CX, y, 320)
b = put(pC, 'S10', 'dec', '<b>S10</b> · วิชานี้ยังอยู่ในขอบเขตผู้ใช้ และรหัส·ภาค·ปีใหม่·Sec ยังว่าง?', CX, b + GAP, 400, 180)
side(pC, 'K1', 'proc', '<b>K1</b> · ข้ามวิชานี้ ไม่เขียนทับ นับเป็น “ข้าม” (FR-21)', 1000, 240, pC.cy('S10'))
b = put(pC, 'S11', 'sub', '<b>S11</b> · คัดลอกโครงรายวิชา (cloneCourse) ดูหน้า 2 · T1–T7', CX, b + LGAP, 360, focus=True)
side(pC, 'D2', 'proc', '<b>D2</b> · เขียน 7 ตาราง: Course · CourseInstructor · GradeBand · CLO · Objective · Activity · Criteria',
     120, 320, pC.cy('S11'))
b = put(pC, 'S12', 'dec', '<b>S12</b> · ยังมีวิชาที่เลือกเหลือ?', CX, b + GAP, 380, 160)
b = put(pC, 'S13', 'proc', '<b>S13</b> · เก็บ “เลิกทำ” = ลบวิชาที่สร้างทั้งชุด · ปิดหน้าต่าง · แสดงวิชารายภาค', CX, b + LGAP, 380)
b = put(pC, 'S14', 'io', '<b>S14</b> · แจ้งผล “คัดลอกปี N ไป Y แล้ว … วิชา · ข้าม … วิชา · ยังไม่มีรายชื่อและคะแนน” + ปุ่มเลิกทำ',
        CX, b + GAP, 440)
b = put(pC, 'S15', 'term', '<b>S15</b> · จบ', CX, b + GAP, 200)
pC.edge('C0', 'S10')
pC.edge('S10', 'K1', 'R', 'L', 'ไม่ใช่')
pC.edge('S10', 'S11', 'B', 'T', 'ใช่')
pC.edge('S11', 'D2', 'L', 'R')
pC.edge('S11', 'S12')
pC.edge('K1', 'S12', 'B', 'R', pts=[(pC.cx('K1'), pC.cy('S12'))])
pC.edge('S12', 'S10', 'L', 'L', 'ใช่ · วิชาถัดไป', pts=[(80, pC.cy('S12')), (80, pC.cy('S10'))])
pC.edge('S12', 'S13', 'B', 'T', 'ไม่ใช่')
pC.edge('S13', 'S14')
pC.edge('S14', 'S15')
pC.page_frame('2.9 ขั้นตอนหลัก (3/3) — คัดลอกทีละวิชา', 40, 1240, b)

# ═══════════════════════════════════════════════════════════════════════
# หน้า 2 · คัดลอกโครงรายวิชา (cloneCourse)
# ═══════════════════════════════════════════════════════════════════════
p2 = Page('cy-2', '2 · คัดลอกโครงรายวิชา')
y = p2.caption('คัดลอก “โครง” (สิ่งที่ผู้สอนคิดไว้) ไม่คัดลอก “คน” และสิ่งที่คนทำ · ตารางที่อ้างอิงกันคัดลอกตามลำดับ '
               'และจำคู่ id เก่า → ใหม่ (cloMap · objMap · actMap) · T4 → T5 ต้องมี cloMap · T6 → T7 ต้องมี actMap และ objMap · '
               'T1 มาก่อนทุกตาราง · อ้างอิง: cloneCourse()' + FOCUS_NOTE.replace('หน้านี้', 'หน้านี้ (ตารางที่ไม่คัดลอก)'), 80, 920)
rows = [
    ('T1', 'Course', 'คัดลอกทุกช่อง แก้ semester · year · section ตามที่ส่งมา · copiedFrom = วิชาต้นทาง · สร้าง id ใหม่ (มีเลขลำดับ)',
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
    ('T8', 'ไม่คัดลอก (ข้อมูลของคน — เป็นของภาคที่เรียนจริง)',
     'Student · Score · StudentGrade (เกรดที่ตรึง) · การปรับเกรด · RemediationPlan · ScoreChange · ScoreUploadLog · UploadReject',
     'วิชาใหม่ว่างเปล่า → นำเข้ารายชื่อ (7.1) ก่อน แล้วจึงนำเข้าคะแนน (6.1) · การลอกคะแนนไปด้วยคือการสร้างข้อมูลปลอม'),
]
GX, X1, W1, X2, W2 = 80, 120, 430, 590, 410
for i, (tid, tbl, how, caution) in enumerate(rows):
    last = tid == 'T8'
    t1 = ('<b>ไม่คัดลอก</b><br>' if last else '<b>วิธีคัดลอก</b><br>') + how
    t2 = '<b>ข้อควรระวัง</b><br>' + caution
    bh = max(fit(t1, W1), fit(t2, W2))
    p2.box('frame', '%s · %s' % (tid, tbl), GX, y, 960, 60 + bh + 40, key=tid)
    p2.box('proc', t1, X1, y + 60, W1, bh, left=True, focus=last)
    p2.box('proc', t2, X2, y + 60, W2, bh, left=True)
    y += 60 + bh + 40
    if i < len(rows) - 1:
        y += 80
for a, b2 in zip(rows, rows[1:]):
    p2.edge(a[0], b2[0])
p2.page_frame('2.9 คัดลอกโครงรายวิชา (cloneCourse) — ทีละตาราง', 40, 1040, y)


# ═══════════════════════════════════════════════════════════════════════
# หน้า 3A–3C · Edge case (จัดกลุ่มตามช่วงของงาน · กรอบละ ≤9 กรณี)
# ═══════════════════════════════════════════════════════════════════════
EC_GROUPS = [
    ('ก่อนเริ่ม: สิทธิ์และการจัดกลุ่มวิชา (S2 · S4)', range(0, 5)),
    ('คำเตือนทีละวิชา (S5)', range(5, 9)),
    ('ตอนผู้ใช้ตรวจและกดยืนยัน (S7 · S8 · S9 · S10)', range(9, 14)),
    ('หลังคัดลอก และข้อมูลที่ไม่คัดลอก (S13 · T4 · T6 · T8)', range(14, 18)),
    ('ที่ยังไม่ครบ (S4 · S11 · T4 · D1)', range(18, 23)),
]
EC_PAGES = [('3A · Edge case ก่อนกดยืนยัน', [0, 1]), ('3B · Edge case ตอนยืนยันและหลังคัดลอก', [2, 3]),
            ('3C · Edge case ที่ยังไม่ครบ', [4])]
n_done = sum(1 for c in CASES if c[3] == DONE)
n_part = sum(1 for c in CASES if c[3] == PART)
n_todo = sum(1 for c in CASES if c[3] == TODO)
SUMMARY = 'สถานะวัดจากต้นแบบ index-q.html · รวม %d กรณี: ทำแล้ว %d · บางส่วน %d · ยังไม่ทำ %d' % (len(CASES), n_done, n_part, n_todo)
for k, (pname, gids) in enumerate(EC_PAGES):
    pe = Page('cy-3%s' % 'abc'[k], pname)
    y = pe.caption('ทุกกรณีอ้างขั้น S# (หน้า 1A–1C) หรือตาราง T# (หน้า 2) หรือข้อมูล D# ที่มีอยู่จริง · ' + SUMMARY, 80, 1120)
    for g in gids:
        gname, idx = EC_GROUPS[g]
        texts = []
        for i in idx:
            ref, case, how, status = CASES[i]
            texts.append('<b>E%02d</b> · ขั้น/ตาราง %s · สถานะ: <b>%s</b><br>กรณี: %s<br>ระบบทำ: %s' % (i + 1, ref, status, case, how))
        hs = [fit(t, 1040) for t in texts]
        gh = 60 + sum(hs) + 20 * (len(hs) - 1) + 40
        pe.box('frame', gname, 80, y, 1120, gh)
        yy = y + 60
        for t, h in zip(texts, hs):
            pe.box('proc', t, 120, yy, 1040, h, left=True)
            yy += h + 20
        y += gh + 40
    pe.page_frame('2.9 Edge case ของการยกโครงทั้งชั้นปี (%d/3)' % (k + 1), 40, 1200, y - 40)

# ═══════════════════════════════════════════════════════════════════════
# ตรวจความถูกต้องของโมเดล
# ═══════════════════════════════════════════════════════════════════════
problems = []
flow_pages = [PAGES[k] for k in ('cy-1a', 'cy-1b', 'cy-1c', 'cy-2')]
for p in flow_pages:
    for a, b in p.edges:
        if a not in p.geo or b not in p.geo:
            problems.append('%s: เส้น %s→%s ชี้ไปโหนดที่ไม่มี' % (p.pid, a, b))
    linked = {x for e in p.edges for x in e}
    for k in p.geo:
        if re.match(r'^(S|D|F|K|T)\d+$', k) and k not in linked:
            problems.append('%s: โหนด %s ไม่มีเส้นเชื่อมเลย' % (p.pid, k))
for ref, case, how, st in CASES:
    if ref not in ALL_IDS:
        problems.append('edge case อ้างรหัส %s ซึ่งไม่มีในไดอะแกรม' % ref)
decisions = []
for k, pid in ALL_IDS.items():
    if re.match(r'^S\d+$', k):
        pg = PAGES[pid]
        cell = next(c for c in pg.cells if 'id="%s"' % pg.geo[k][0] in c)
        if 'rhombus' in cell:
            decisions.append(k)
cited = {c[0] for c in CASES}
for k in decisions:
    if k not in cited and k not in ('S7', 'S12'):
        problems.append('เงื่อนไข %s ไม่มี edge case รองรับ' % k)
if problems:
    raise SystemExit('โมเดลไม่ผ่าน:\n  ' + '\n  '.join(problems))

ORDER = ['cy-0', 'cy-1a', 'cy-1b', 'cy-1c', 'cy-2', 'cy-3a', 'cy-3b', 'cy-3c']
xml = ('<mxfile host="drawio" agent="CMAS scripts/build-copy-year-flowchart-skill-drawio.py" version="24.0.0">' +
       ''.join(PAGES[k].xml() for k in ORDER) + '</mxfile>')
OUT.parent.mkdir(parents=True, exist_ok=True)
io.open(OUT, 'w', encoding='utf-8', newline='').write(xml)
print('wrote', OUT.relative_to(ROOT), '·', len(ORDER), 'หน้า')
print('  ขั้นตอนหลัก %d โหนด · หน้า 2: %d ตาราง · edge case %d (ทำแล้ว %d)' %
      (sum(len(PAGES[k].geo) for k in ('cy-1a', 'cy-1b', 'cy-1c')), len([k for k in PAGES['cy-2'].geo]), len(CASES), n_done))
print('  STUDY_PLAN ในต้นแบบ: %d รายวิชา' % N_PLAN)
