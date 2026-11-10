#!/usr/bin/env python3
"""Flowchart ของการเข้าสู่ระบบ 2 ทางเลือก (Google · ลิงก์อีเมล) ภายใต้กฎเดียวกัน เป็นไฟล์ draw.io

ผังนี้ใช้ตัดสินใจก่อนเขียน server: ทั้งสองทางต้องจบที่กฎชุดเดียว (FR-08)
  * โดเมนคณะ  -> ACTIVE เข้าได้ทันที
  * โดเมนอื่น  -> PENDING รอ ADMIN อนุมัติ (FR-08b)
ส่วนที่ต้นแบบหรือ SRS ยังไม่มี (ทางลิงก์อีเมล) ขอบเส้นประ = ส่วนที่เสนอเพิ่ม (กติกา docs/diagrams/CLAUDE.md ข้อ 2)

ไฟล์นี้สร้างจากโมเดลชุดเดียวด้านล่าง แล้วตรวจให้ครบ:
  * ทุกเส้นเชื่อมต้องชี้ไปหาโหนดที่มีอยู่ และโหนดลำดับงานต้องไม่โดดเดี่ยว
  * ทุกแถวในตารางคำถาม (Q#) ต้องอ้างโหนดที่มีจริงในหน้า 1
  * ต้นแบบต้องมีส่วนของ Google และ EmailPolicy ที่ไดอะแกรมอ้างถึง

รหัสในไดอะแกรม  A เริ่ม/เลือก · G Google · M ลิงก์อีเมล · C กฎร่วม · D ข้อมูล · F ทางออกแจ้งข้อผิดพลาด · S/P ผลลัพธ์ · Q คำถามที่ต้องตัดสิน

อ้างอิงต้นแบบ: docs/index-q/index-q.html  (AUTH · EmailPolicy · auth-google · LOGIN_GOOGLE)
ผลลัพธ์:        docs/diagrams/flowchart/CMAS-Flowchart-AuthMethods.drawio

รัน:  python scripts/build-auth-methods-flowchart-drawio.py
ห้ามแก้ไฟล์ .drawio ด้วยมือ — แก้ที่นี่แล้วรันใหม่
"""
import io
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'diagrams' / 'flowchart' / 'CMAS-Flowchart-AuthMethods.drawio'
APP = ROOT / 'docs' / 'index-q' / 'index-q.html'

_app = io.open(APP, encoding='utf-8').read()
for needle in ('class EmailPolicy', "'auth-google'", 'LOGIN_GOOGLE', 'hd = kmitl.ac.th'):
    if needle not in _app:
        raise SystemExit('index-q.html ไม่มี %r — ไดอะแกรมอ้างถึงสิ่งที่ไม่มีแล้ว' % needle)

# ── สไตล์ (ชุดเดียวกับ CMAS-Flowchart-CopyYearLevel.drawio) ─────────────
ST = {
    'start': 'rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontStyle=1;fontSize=13;',
    'end':   'rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#E6E6E6;strokeColor=#666666;fontStyle=1;fontSize=13;',
    'io':    'shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;size=18;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;',
    'proc':  'rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#333333;fontSize=13;',
    'sub':   'shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;size=0.06;fillColor=#FFFFFF;strokeColor=#333333;fontSize=13;fontStyle=1;',
    'dec':   'rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=13;',
    'db':    'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=10;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#D79B00;fontSize=13;',
    'err':   'rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor=#F8CECC;strokeColor=#B85450;fontSize=13;',
    'note':  'whiteSpace=wrap;html=1;rounded=1;arcSize=4;align=left;verticalAlign=top;spacingLeft=10;spacingTop=6;fontSize=12.5;fillColor=#F5F5F5;strokeColor=#999999;',
    'th':    'whiteSpace=wrap;html=1;fillColor=#333333;strokeColor=#333333;fontColor=#FFFFFF;fontStyle=1;fontSize=13;',
    'td':    'whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#BBBBBB;align=left;verticalAlign=middle;spacingLeft=8;spacingRight=6;fontSize=12.5;',
    'tdc':   'whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#BBBBBB;align=center;verticalAlign=middle;fontSize=12.5;fontStyle=1;',
    'title': 'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontSize=22;fontStyle=1;',
    'meta':  'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontSize=13;',
    'lbl':   'whiteSpace=wrap;html=1;text;align=left;verticalAlign=middle;fontSize=12;',
}
EDGE = ('edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;fontSize=12;'
        'labelBackgroundColor=#FFFFFF;jumpStyle=arc;jumpSize=10;')
SIDE = {'T': (0.5, 0), 'B': (0.5, 1), 'L': (0, 0.5), 'R': (1, 0.5)}
PROPOSED = 'dashed=1;dashPattern=8 4;strokeWidth=2;'   # ส่วนที่เสนอเพิ่ม

ALL_IDS = {}


class Page:
    def __init__(self, pid, name, w, h):
        self.pid, self.name, self.w, self.h = pid, name, w, h
        self.cells, self.geo, self.n, self.edges = [], {}, 0, []

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
        self.edges.append((a, b))

    def xml(self):
        return ('<diagram id="%s" name="%s"><mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" '
                'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="%d" pageHeight="%d" '
                'background="#FFFFFF" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>%s'
                '</root></mxGraphModel></diagram>' % (self.pid, escape(self.name), self.w, self.h, ''.join(self.cells)))


def header(p, title, role, extra):
    p.box('title', title, 40, 20, 1100, 34)
    p.box('meta', '<b>ผู้ใช้งาน:</b> ' + role, 40, 62, 1100, 22)
    p.box('meta', '<b>อ้างอิง:</b> ' + extra, 40, 84, 1100, 22)


def legend(p, x, y):
    items = [('start', 'เริ่ม'), ('end', 'จบ'), ('io', 'รับข้อมูล / แสดงผล'), ('proc', 'ประมวลผล'),
             ('dec', 'เงื่อนไข'), ('db', 'ข้อมูล'), ('sub', 'กระบวนการย่อย'), ('err', 'แจ้งข้อผิดพลาด')]
    p.box('lbl', '<b>สัญลักษณ์</b>', x, y, 330, 24)
    for i, (k, lab) in enumerate(items):
        col, row = i % 2, i // 2
        p.box(k, '', x + col * 170, y + 28 + row * 34, 44, 26)
        p.box('lbl', lab, x + 50 + col * 170, y + 28 + row * 34, 120, 26)
    yy = y + 28 + 4 * 34 + 4
    p.box('proc', '', x, yy, 44, 26, extra=PROPOSED)
    p.box('lbl', 'ขอบเส้นประ = ส่วนที่เสนอเพิ่ม (ยังไม่อยู่ในต้นแบบหรือ SRS)', x + 50, yy - 4, 280, 34)


DOMAIN = 'kmitl.ac.th'

# ═══════════════════════════════════════════════════════════════════════
# หน้า 0 · ภาพรวม
# ═══════════════════════════════════════════════════════════════════════
p0 = Page('am-0', '0 · ภาพรวม', 1640, 760)
header(p0, 'เข้าสู่ระบบ 2 ทางเลือก — ภาพรวม',
       'ผู้สอนและ ADMIN ที่ยังไม่มี session · ใช้ได้ทั้ง 2 ทางภายใต้กฎเดียว',
       'docs/index-q/index-q.html (AUTH · EmailPolicy) · FR-01 · FR-07 · FR-08 · FR-08b')
p0.box('meta', '<b>เรื่องนี้ทำอะไร:</b> ให้ผู้ใช้เข้าระบบได้ 2 ทางที่เป็นสำรองซึ่งกันและกัน ทั้งคู่ไม่ใช้รหัสผ่าน และทั้งคู่จบที่กฎ '
               'อนุมัติบัญชีชุดเดียวกัน จึงไม่มีทางหนึ่งที่ผ่านง่ายกว่าอีกทาง', 40, 106, 1100, 40)
cols = [
    ('ทาง A · Google', 'note',
     '<b>คืออะไร:</b> กดปุ่ม Google แล้วเลือกบัญชี Google ออก ID token ให้<br>'
     '<b>ระบบตรวจ:</b> ลายเซ็น · aud · iss · email_verified · hd<br>'
     '<b>จับคู่บัญชี:</b> ด้วย <code>sub</code> ของ token ไม่ใช่ด้วยอีเมล<br>'
     '<b>เหมาะกับ:</b> คนที่มีบัญชี Google ผูกกับอีเมลคณะ เข้าได้ในคลิกเดียว'),
    ('ทาง B · ลิงก์อีเมล (เสนอเพิ่ม)', 'note',
     '<b>คืออะไร:</b> กรอกอีเมล ระบบส่งลิงก์เข้าสู่ระบบทางอีเมล เปิดลิงก์แล้วเข้าได้<br>'
     '<b>โทเคน:</b> 32 bytes เก็บเฉพาะ hash · ใช้ครั้งเดียว · หมดอายุ 24 ชม. · ขอใหม่ได้ทุก 60 วินาที<br>'
     '<b>จับคู่บัญชี:</b> ด้วยอีเมลที่ยืนยันแล้ว (ดู Q4 หน้า 2)<br>'
     '<b>เหมาะกับ:</b> Google ใช้ไม่ได้ หรือผู้สอนที่ไม่มีบัญชี Google ผูกกับอีเมลคณะ'),
    ('กฎร่วม (FR-08)', 'note',
     '<b>โดเมนคณะ (@%s เทียบตรงตัว):</b> สร้างบัญชี INSTRUCTOR สถานะ ACTIVE เข้าได้ทันที<br>'
     '<b>โดเมนอื่น:</b> สถานะ PENDING ไม่ออก token จนกว่า ADMIN อนุมัติ (FR-08b)<br>'
     '<b>บัญชีที่ปิดอยู่ (isActive = false):</b> ปฏิเสธทุกทาง<br>'
     '<b>ใช้ฟังก์ชันตัดสินตัวเดียว</b> ไม่เขียนกฎซ้ำสองที่' % DOMAIN),
]
for i, (t, k, body) in enumerate(cols):
    x = 40 + i * 400
    p0.box('th', t, x, 170, 380, 34)
    p0.box(k, body, x, 204, 380, 190, extra='align=left;verticalAlign=top;spacingLeft=10;spacingTop=8;'
           + (PROPOSED if i == 1 else ''))
p0.box('meta', '<b>แผนที่หน้า</b>', 40, 424, 400, 24)
maps = [
    ('หน้า 1 · ผังลำดับงาน', 'เริ่ม → เลือกทาง → ตรวจตัวตน → กฎร่วม → ออก token หรือรออนุมัติ · รหัส A G M C D F S P'),
    ('หน้า 2 · คำถามที่ต้องตัดสิน Q1–Q8', 'ทุกข้อชี้ไปโหนดในหน้า 1 พร้อมตัวเลือกและข้อเสนอ ต้องตอบก่อนเขียน server'),
]
for i, (a, b) in enumerate(maps):
    p0.box('th', a, 40, 454 + i * 56, 360, 48)
    p0.box('td', b, 400, 454 + i * 56, 740, 48)
p0.box('th', 'ตารางตัดสินของกฎร่วม', 40, 580, 360, 40)
rows =[('ไม่มีบัญชี · โดเมนคณะ', 'สร้างบัญชี ACTIVE → เข้าได้'),
        ('ไม่มีบัญชี · โดเมนอื่น', 'สร้างบัญชี PENDING → รออนุมัติ'),
        ('มีบัญชี · ACTIVE', 'เข้าได้'),
        ('มีบัญชี · PENDING', 'รออนุมัติ (ไม่ออก token)'),
        ('มีบัญชี · isActive = false', 'ปฏิเสธ')]
for i, (a, b) in enumerate(rows):
    x = 400 + (i % 3) * 250
    y = 580 + (i // 3) * 44
    p0.box('tdc', a, x, y, 120, 44)
    p0.box('td', b, x + 120, y, 130, 44)
legend(p0, 1260, 170)

# ═══════════════════════════════════════════════════════════════════════
# หน้า 1 · ผังลำดับงาน
# ═══════════════════════════════════════════════════════════════════════
GX, EX, TX = 300, 900, 600          # กึ่งกลางคอลัมน์ Google · ลิงก์อีเมล · กฎร่วม
p1 = Page('am-1', '1 · ผังลำดับงาน', 1600, 2060)
header(p1, 'เข้าสู่ระบบ 2 ทางเลือก — ผังลำดับงาน',
       'ผู้ใช้ที่ยังไม่มี session',
       'AUTH ในต้นแบบ · ทาง A = POST /auth/google · ทาง B = POST /auth/email-link และ /auth/email-link/verify (ขอบเส้นประ = เสนอเพิ่ม)')
p1.box('meta', '<b>อ่านอย่างไร:</b> สองทางแยกกันจนได้ “อีเมลที่ยืนยันแล้ว” จากนั้นเข้ากฎร่วมชุดเดียว (C1) '
               'ลูกศรประ = เขียนหรืออ่านข้อมูล', 40, 106, 1100, 22)
legend(p1, 1230, 140)


def n(kind, key, text, cx, y, w, h, proposed=False):
    p1.box(kind, text, cx - w // 2, y, w, h, key=key, extra=PROPOSED if proposed else '')


n('start', 'A0', 'เริ่ม · เปิดหน้าเข้าสู่ระบบ', TX, 140, 240, 56)
n('dec', 'A1', 'ผู้ใช้เลือกวิธีเข้า', TX, 235, 240, 100)

# ทาง A · Google
n('io', 'G1', 'กดปุ่ม Google · เลือกบัญชี', GX, 380, 240, 64)
n('sub', 'G2', 'Google ยืนยันตัวตน<br>แล้วออก ID token', GX, 480, 240, 64)
n('proc', 'G3', 'ส่ง idToken ไปที่<br>POST /auth/google', GX, 580, 240, 64)
n('dec', 'G4', 'token ผ่านไหม?<br>(ลายเซ็น · aud · iss · email_verified · hd)', GX, 690, 280, 110)
n('err', 'F1', 'เข้าสู่ระบบไม่สำเร็จ<br>(ข้อความเดียวกันทุกกรณี)', 560, 715, 190, 60)
p1.box('note', '<b>ทำไมมี 2 ทาง</b><br>• Google ล่มหรือตั้งค่าพลาด ยังมีลิงก์อีเมลเป็นทางสำรอง<br>'
               '• ผู้สอนที่ไม่มีบัญชี Google ผูกกับอีเมลคณะ เข้าด้วยลิงก์ได้ ไม่ต้องรอ ADMIN สร้างบัญชี<br>'
               '• ทั้งสองทางผ่านกฎร่วม C1 เดียวกัน', 330, 880, 290, 190)

# ทาง B · ลิงก์อีเมล (ทุกโหนดเป็นส่วนที่เสนอ)
n('io', 'M1', 'กรอกอีเมล', EX, 380, 240, 64, True)
n('dec', 'M2', 'รูปแบบอีเมลถูกต้อง?', EX, 475, 240, 100, True)
n('err', 'FM', 'แจ้ง “กรอกอีเมลให้ถูกต้อง”<br>แล้วกรอกใหม่', 1250, 495, 200, 60)
n('proc', 'M3', 'ส่งอีเมลไปที่<br>POST /auth/email-link<br>(จำกัดความถี่ 60 วินาที)', EX, 620, 240, 76, True)
n('proc', 'M4', 'สร้างโทเคน 32 bytes<br>เก็บเฉพาะ hash · อายุ 24 ชม.<br>ส่งลิงก์ทางอีเมล', EX, 730, 240, 76, True)
p1.box('db', 'D1<br>โทเคนลิงก์เข้าสู่ระบบ<br>(hash · ใช้ครั้งเดียว)', 1140, 710, 220, 80, key='D1', extra=PROPOSED)
n('io', 'M5', 'หน้า “ตรวจสอบอีเมลของคุณ”<br>เหมือนกันทุกกรณี (FR-07)', EX, 850, 260, 70, True)
n('io', 'M6', 'ผู้ใช้เปิดลิงก์ในอีเมล<br>/auth/verify?token=…', EX, 960, 260, 70, True)
n('proc', 'M7', 'ส่งโทเคนไปที่<br>POST /auth/email-link/verify', EX, 1070, 260, 64, True)
n('dec', 'M8', 'โทเคนใช้ได้?<br>(มีอยู่ · ยังไม่ใช้ · ไม่หมดอายุ)', EX, 1170, 280, 110, True)
n('err', 'F2', 'ลิงก์ใช้ไม่ได้<br>ขอลิงก์ใหม่', 1250, 1195, 200, 60)
n('proc', 'M9', 'ทำเครื่องหมายโทเคนว่าใช้แล้ว<br>ได้ “อีเมลที่ยืนยันแล้ว”', EX, 1305, 260, 64, True)

# กฎร่วม
n('proc', 'C0', 'ได้ “อีเมลที่ยืนยันแล้ว”<br>จากทางใดทางหนึ่ง', TX, 1410, 260, 70)
n('sub', 'C1', 'ตัดสินตามกฎเดียว (ฟังก์ชันตัวเดียว)<br>หาบัญชีจากอีเมล · ไม่มีก็สร้าง<br>'
               'โดเมนคณะ → ACTIVE · โดเมนอื่น → PENDING', TX, 1520, 340, 96)
n('dec', 'C2', 'สถานะบัญชี?', TX, 1660, 260, 100)
n('err', 'F3', 'ปฏิเสธ<br>บัญชีถูกปิด (isActive = false)', 230, 1685, 230, 60)
n('proc', 'S1', 'ออก access token (15 นาที)<br>และ refresh cookie (7 วัน)<br>บันทึก AuthEvent', TX, 1830, 280, 76)
n('end', 'S2', 'จบ · เข้าหน้าแรก', TX, 1950, 220, 56)
n('io', 'P1', 'หน้า “รอผู้ดูแลระบบอนุมัติ”<br>(ไม่ออก token)', 1000, 1830, 260, 76)
n('proc', 'P2', 'ADMIN อนุมัติ<br>PATCH /users/:id/approve (FR-08b)', 1000, 1950, 280, 64)
p1.box('db', 'D2<br>User', 1180, 1635, 150, 70, key='D2')

p1.edge('A0', 'A1')
p1.edge('A1', 'G1', 'L', 'T', 'Google')
p1.edge('A1', 'M1', 'R', 'T', 'ลิงก์อีเมล')
p1.edge('G1', 'G2'); p1.edge('G2', 'G3'); p1.edge('G3', 'G4')
p1.edge('G4', 'F1', 'R', 'L', 'ไม่ผ่าน')
p1.edge('G4', 'C0', 'B', 'L', 'ผ่าน', pts=[(GX, 1445)])
p1.edge('M1', 'M2')
p1.edge('M2', 'FM', 'R', 'L', 'ไม่ถูก')
p1.edge('FM', 'M1', 'T', 'R', pts=[(1250, 412)])
p1.edge('M2', 'M3', 'B', 'T', 'ถูก')
p1.edge('M3', 'M4')
p1.edge('M4', 'D1', 'R', 'L', 'เขียน', dashed=True)
p1.edge('M4', 'M5'); p1.edge('M5', 'M6'); p1.edge('M6', 'M7'); p1.edge('M7', 'M8')
p1.edge('M8', 'F2', 'R', 'L', 'ไม่ได้')
p1.edge('M8', 'M9', 'B', 'T', 'ได้')
p1.edge('M9', 'D1', 'R', 'R', 'ใช้แล้ว', pts=[(1420, 1337), (1420, 750)], dashed=True)
p1.edge('M9', 'C0', 'B', 'R', pts=[(EX, 1445)])
p1.edge('C0', 'C1'); p1.edge('C1', 'C2')
p1.edge('C1', 'D2', 'R', 'T', 'อ่าน/สร้าง', pts=[(1255, 1568)], dashed=True)
p1.edge('C2', 'F3', 'L', 'R', 'ปิดอยู่')
p1.edge('C2', 'S1', 'B', 'T', 'ACTIVE')
p1.edge('C2', 'P1', 'R', 'T', 'PENDING', pts=[(1000, 1710)])
p1.edge('S1', 'S2')
p1.edge('P1', 'P2')

# ═══════════════════════════════════════════════════════════════════════
# หน้า 2 · คำถามที่ต้องตัดสิน
# ═══════════════════════════════════════════════════════════════════════
QS = [
    ('M4', 'ใช้ “ลิงก์” หรือ “รหัส 6 หลัก” ในอีเมล',
     'ลิงก์: กดครั้งเดียวเข้า แต่เปิดคนละเครื่องกับที่กรอกไม่สะดวก · รหัส: พิมพ์กลับเข้าหน้าเดิม ต้องกันเดารหัส',
     'ลิงก์ ตรงกับ FR-07 (32 bytes · ใช้ครั้งเดียว · 24 ชม.)'),
    ('C1', 'อีเมลโดเมนอื่นขอลิงก์ได้ไหม',
     'ได้ แล้วไป PENDING · หรือไม่ส่งลิงก์ให้เลย (จะเปิดช่องให้เดาว่าโดเมนใดผ่าน)',
     'ได้ ตามกฎเดียวกับ Google ผู้ใช้เห็นหน้าเดิม ไม่รู้ว่าอีเมลนั้นมีบัญชีหรือไม่'),
    ('C1', 'อีเมลที่ยังไม่มีบัญชี สร้างให้เลยหรือไม่',
     'สร้างตอนเปิดลิงก์ · หรือต้องให้ ADMIN สร้างก่อน',
     'สร้างตอนเปิดลิงก์ (คลิกได้แปลว่าเป็นเจ้าของอีเมล) ตรงกับที่ Google ทำอยู่'),
    ('C1', 'จับคู่บัญชี Google กับบัญชีลิงก์อีเมลของคนเดียวกัน',
     'จับด้วย sub (Google) กับอีเมล (ลิงก์) แยกกัน อาจเกิดสองบัญชี · หรือจับด้วยอีเมลที่ยืนยันแล้วทั้งคู่ แล้วเก็บ sub ตอน Google ครั้งแรก',
     'จับด้วยอีเมลที่ยืนยันแล้ว เก็บ sub ไว้ตรวจครั้งต่อไป ต้องเขียนลงกฎร่วมที่เดียว'),
    ('S1', 'บันทึก AuthEvent ของทางลิงก์อีเมลเป็นค่าอะไร',
     'ใช้ LOGIN เดิม · หรือเพิ่มค่าใหม่ เช่น LOGIN_EMAIL_LINK ใน enum AuthEventAction',
     'เพิ่มค่าใหม่ เพื่อแยกได้ในรายงานว่าเข้าทางไหน (ต้องมี migration)'),
    ('M4', 'ส่งอีเมลด้วยอะไร',
     'SMTP ของคณะ · บริการส่งอีเมล (เช่น Resend, SES) · ต้องมีโดเมนผู้ส่งที่ผ่าน SPF/DKIM',
     'ยังไม่เลือก ต้องตัดสินก่อนเปิดทางสำรอง เพราะถ้าอีเมลไม่ถึง ทางสำรองก็ใช้ไม่ได้'),
    ('M3', 'จำกัดความถี่การขอลิงก์',
     'ต่ออีเมล 60 วินาที (FR-07) · เพิ่มต่อ IP · เพิ่มเพดานต่อวัน',
     'ต่ออีเมล 60 วินาที + ต่อ IP กันยิงถล่มกล่องอีเมลคนอื่น'),
    ('A1', 'ขัดกับ D-5 / OI-06 / FR-01 ใน SRS ที่ตัดอีเมลออกจาก v1',
     'แก้ SRS ให้รับ 2 ทาง (Google + ลิงก์) และตัดรหัสผ่านออก · หรือเก็บ v1 เป็น Google อย่างเดียว',
     'แก้ SRS และ thesis §3.2.2.3 ให้ตรงกัน แล้ว FR-09 (นโยบายรหัสผ่าน) หมดความหมาย'),
]
p2 = Page('am-2', '2 · คำถามที่ต้องตัดสิน', 1500, 170 + 76 * (len(QS) + 1) + 90)
header(p2, 'เข้าสู่ระบบ 2 ทางเลือก — คำถามที่ต้องตัดสิน',
       'ทีมพัฒนา · ต้องตอบก่อนเขียน server',
       'ทุกแถวอ้างโหนดในหน้า 1 · “ข้อเสนอ” คือคำตอบที่ผังหน้า 1 วาดตามไว้แล้ว')
cw = [64, 70, 330, 560, 380]
cx = [40]
for w in cw[:-1]:
    cx.append(cx[-1] + w)
for t, x, w in zip(['รหัส', 'โหนด', 'ประเด็น', 'ตัวเลือก', 'ข้อเสนอ'], cx, cw):
    p2.box('th', t, x, 130, w, 36)
for i, (ref, topic, opts, rec) in enumerate(QS):
    y = 166 + i * 76
    p2.box('tdc', 'Q%d' % (i + 1), cx[0], y, cw[0], 76, key='Q%d' % (i + 1))
    p2.box('tdc', ref, cx[1], y, cw[1], 76)
    p2.box('td', topic, cx[2], y, cw[2], 76)
    p2.box('td', opts, cx[3], y, cw[3], 76)
    p2.box('td', rec, cx[4], y, cw[4], 76)
p2.box('meta', '<b>สรุป:</b> %d ข้อ · Q1–Q4 และ Q7 กระทบกฎร่วมหรือ API · Q5 ต้องมี migration · Q6 ต้องมีผู้ให้บริการอีเมลก่อนเปิดใช้' % len(QS),
       40, 166 + len(QS) * 76 + 16, 1300, 24)

# ═══════════════════════════════════════════════════════════════════════
# ตรวจความถูกต้องของโมเดล
# ═══════════════════════════════════════════════════════════════════════
problems = []
ids = {v[0] for v in p1.geo.values()}
for a, b in p1.edges:
    if p1.geo[a][0] not in ids or p1.geo[b][0] not in ids:
        problems.append('เส้น %s→%s ชี้ไปโหนดที่ไม่มี' % (a, b))
linked = {x for e in p1.edges for x in e}
for k in p1.geo:
    if k not in linked:
        problems.append('โหนด %s ไม่มีเส้นเชื่อมเลย' % k)
for ref, *_ in QS:
    if ref not in p1.geo:
        problems.append('คำถามอ้างโหนด %s ซึ่งไม่มีในหน้า 1' % ref)
# ทุกเงื่อนไข (rhombus) ต้องมีทางออกอย่างน้อยสองเส้น
out_count = {}
for a, _ in p1.edges:
    out_count[a] = out_count.get(a, 0) + 1
for k, (i, *_r) in p1.geo.items():
    if any('id="%s"' % i in c and 'rhombus' in c for c in p1.cells) and out_count.get(k, 0) < 2:
        problems.append('เงื่อนไข %s มีทางออกไม่ถึง 2 ทาง' % k)
if problems:
    raise SystemExit('โมเดลไม่ผ่าน:\n  ' + '\n  '.join(problems))

xml = ('<mxfile host="drawio" agent="CMAS scripts/build-auth-methods-flowchart-drawio.py" version="24.0.0">' +
       ''.join(p.xml() for p in (p0, p1, p2)) + '</mxfile>')
OUT.parent.mkdir(parents=True, exist_ok=True)
io.open(OUT, 'w', encoding='utf-8', newline='').write(xml)
print('wrote', OUT.relative_to(ROOT), '· 3 หน้า')
print('  หน้า 1: %d โหนด %d เส้น · คำถาม %d ข้อ' % (len(p1.geo), len(p1.edges), len(QS)))
