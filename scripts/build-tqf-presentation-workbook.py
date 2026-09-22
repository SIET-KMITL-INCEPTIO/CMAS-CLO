"""
Build docs/excel/CMAS-TQF-Data-Entry.xlsx — the presentation copy for the
project advisor.

Same idea as the UI-to-Database workbook, but reframed in the documents an
instructor at KMITL actually works with: มคอ.3 หมวดที่ 5 (แผนการประเมินผล) on the
way in, and มคอ.5 (รายงานผลการดำเนินการ) on the way out. The middle sheets show
what the system adds on top of มคอ.3 — a per-pair weight matrix that makes
CLO attainment computable instead of estimated.

Course facts (code, name, credits, description) are taken from the
real curriculum document at docs/pdf/01. หลักสูตร ค.อ.บ. ... 2567.pdf:
    p.13/15  course list        03376120 ระบบฐานข้อมูล 3(2-2-5)
    p.281    course description
Student names and every score are fabricated.

Run: python scripts/build-tqf-presentation-workbook.py
Output: docs/excel/CMAS-TQF-Data-Entry.xlsx
"""

import sys
import math

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
C_PRIMARY = "19151B"
C_UI = "1A56C4"
C_DB = "44405A"
C_CALC = "137333"
C_TQF = "8A5A00"
C_ON = "1A1C1D"
C_MUTED = "4A454A"
C_OUTLINE = "CCC4CA"

BG_UI = "EAF1FE"
BG_DB = "EDEBF2"
BG_CALC = "E6F4EA"
BG_TQF = "FEF7E0"
BG_ROW = "F3F3F5"
BG_GAP = "FCE8E6"
TX_GAP = "C5221F"

thin = Side(style="thin", color=C_OUTLINE)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

F_TITLE = Font(name="Calibri", size=16, bold=True, color=C_PRIMARY)
F_SUB = Font(name="Calibri", size=10.5, italic=True, color=C_MUTED)
F_H2 = Font(name="Calibri", size=12, bold=True, color=C_PRIMARY)
F_LABEL = Font(name="Calibri", size=10, bold=True, color=C_ON)
F_BODY = Font(name="Calibri", size=10, color=C_ON)
F_MUTED = Font(name="Calibri", size=9.5, color=C_MUTED)
F_HEAD = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
F_MONO = Font(name="Consolas", size=9.5, color=C_MUTED)

FILL_UI = PatternFill("solid", fgColor=C_UI)
FILL_DB = PatternFill("solid", fgColor=C_DB)
FILL_CALC = PatternFill("solid", fgColor=C_CALC)
FILL_TQF = PatternFill("solid", fgColor=C_TQF)
FILL_INPUT = PatternFill("solid", fgColor=BG_UI)
FILL_CALCROW = PatternFill("solid", fgColor=BG_CALC)
FILL_TQFROW = PatternFill("solid", fgColor=BG_TQF)
FILL_ROW = PatternFill("solid", fgColor=BG_ROW)
FILL_WHITE = PatternFill("solid", fgColor="FFFFFF")
FILL_GAP = PatternFill("solid", fgColor=BG_GAP)

# ---------------------------------------------------------------------------
SH_COVER = "หน้าปก"
SH_INFO = "1 ข้อมูลรายวิชา"
SH_CLO = "2 CLO"
SH_PLAN = "3 แผนประเมิน มคอ.3"
SH_MAP = "4 เมทริกซ์ CLO x กิจกรรม"
SH_STU = "5 รายชื่อนักศึกษา"
SH_SCORE = "6 กรอกคะแนน"
SH_RESULT = "7 ผลการบรรลุ CLO"
SH_GRADE = "8 ตัดเกรด"
SH_TQF5 = "9 รายงาน มคอ.5"
SH_DB = "10 ตารางฐานข้อมูล"
SH_FIELDMAP = "11 แผนที่ UI-DB"

# ===========================================================================
# REAL course facts from the curriculum document
# ===========================================================================
INSTITUTION = "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง"
FACULTY = "คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี"
DEPARTMENT = "ภาควิชาครุศาสตร์วิศวกรรม"
PROGRAM = "หลักสูตรครุศาสตร์อุตสาหกรรมบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์ (หลักสูตรปรับปรุง พ.ศ. 2567)"

COURSE = {
    "id": "crs-01",
    "code": "03376120",
    "name": "ระบบฐานข้อมูล",
    "nameEn": "DATABASE SYSTEM",
    "credits": "3 (2-2-5)",
    "semester": 1, "year": 2568, "section": "01",
    "yearOfStudy": "ปีที่ 1 ภาคการศึกษาที่ 1",
    "group": "หมวดวิชาเฉพาะ · กลุ่มวิชาชีพเฉพาะสาขาวิชา (บังคับเรียน)",
    "prereq": "ไม่มี",
    "desc": ("ศึกษาและปฏิบัติในหัวข้อ หลักการของระบบฐานข้อมูล สถาปัตยกรรมฐานข้อมูล "
             "โมเดลฐานข้อมูล ฐานข้อมูลเชิงสัมพันธ์ การออกแบบฐานข้อมูล การทำบรรทัดฐาน "
             "ภาษาสอบถามเชิงโครงสร้าง ฐานข้อมูลโนเอสคิวแอล"),
    "gradeScale": "LETTER (A–F)",
    "passCriteria": 60,
    "classTarget": 70,
}

USERS = [
    ("usr-01", "admin@kmitl.ac.th", "อ.ดร.สมชาย ใจดี", "ADMIN", True),
    ("usr-02", "wichai.k@kmitl.ac.th", "ผศ.วิชัย คงเจริญ", "INSTRUCTOR", True),
    ("usr-03", "suda.p@kmitl.ac.th", "อ.สุดา พรหมมา", "INSTRUCTOR", True),
]
COURSE_INSTRUCTORS = [
    ("ci-01", "crs-01", "usr-02", "LEAD", "2568-06-01"),
    ("ci-02", "crs-01", "usr-03", "CO", "2568-06-01"),
]

# (cloId, number, description, threshold, bloomLevel, classTarget)
#
# bloomLevel มาจากคำกริยาที่ขึ้นต้น CLO เอง ไม่ใช่ค่าที่เดาให้ — "ออกแบบ" คือ CREATE,
# "เขียนคำสั่ง" คือ APPLY, "ทำบรรทัดฐาน" คือ ANALYZE, "เลือกใช้...ได้เหมาะสม" คือ EVALUATE
#
# classTarget เป็นค่า override ราย CLO · None = ใช้ค่าของรายวิชา (70%)
# CLO 1 อยู่ระดับ CREATE ซึ่งเป็นระดับสูงสุดของ Bloom จึงตั้งเป้าสัดส่วนผู้ผ่านไว้ต่ำกว่า
# ค่ากลางอย่างมีเหตุผล — นี่คือสิ่งที่ Course.classTarget ค่าเดียวแสดงไม่ได้
CLOS = [
    ("clo-01", 1, "ออกแบบฐานข้อมูลเชิงสัมพันธ์จากโจทย์ที่กำหนดได้", 60, "CREATE", 60),
    ("clo-02", 2, "เขียนคำสั่งภาษาสอบถามเชิงโครงสร้าง (SQL) เพื่อสืบค้นและจัดการข้อมูลได้", 60, "APPLY", None),
    ("clo-03", 3, "ทำบรรทัดฐาน (Normalization) ถึงระดับ 3NF ได้ถูกต้อง", 65, "ANALYZE", None),
    ("clo-04", 4, "เลือกใช้ฐานข้อมูลเชิงสัมพันธ์หรือโนเอสคิวแอลได้เหมาะสมกับลักษณะงาน", 60, "EVALUATE", 65),
]

# ระดับพฤติกรรมตาม Bloom's revised taxonomy — ใช้แสดงคู่กับ CLO
BLOOM_TH = {
    "REMEMBER":   "จำ",
    "UNDERSTAND": "เข้าใจ",
    "APPLY":      "ประยุกต์ใช้",
    "ANALYZE":    "วิเคราะห์",
    "EVALUATE":   "ประเมินค่า",
    "CREATE":     "สร้างสรรค์",
}

OBJECTIVES = [
    ("obj-01", 0, 1, "เขียนแผนภาพ ER จากความต้องการของผู้ใช้ได้"),
    ("obj-02", 0, 2, "แปลงแผนภาพ ER เป็นตารางเชิงสัมพันธ์ได้"),
    ("obj-03", 1, 1, "เขียนคำสั่ง SELECT พร้อม JOIN หลายตารางได้"),
    ("obj-04", 1, 2, "ใช้ subquery และฟังก์ชันรวม (aggregate function) ได้"),
    ("obj-05", 2, 1, "ระบุความสัมพันธ์เชิงหน้าที่ (functional dependency) ของตารางได้"),
    ("obj-06", 2, 2, "แปลงตารางให้อยู่ในรูปบรรทัดฐานที่ 3 (3NF) ได้"),
    ("obj-07", 3, 1, "เปรียบเทียบข้อดีข้อเสียของฐานข้อมูลเชิงสัมพันธ์กับโนเอสคิวแอลได้"),
]

# (actId, name, method, maxScore, weight, week)
# `week` is required by มคอ.3 but has NO column in schema.prisma — flagged as a gap.
ACTIVITIES = [
    ("act-01", "แบบทดสอบย่อยครั้งที่ 1 — แผนภาพ ER", "สอบย่อย", 20, 10, "5"),
    ("act-02", "สอบกลางภาค", "สอบข้อเขียน", 100, 30, "9"),
    ("act-03", "ปฏิบัติการ SQL (Lab)", "ประเมินชิ้นงานปฏิบัติ", 50, 20, "6-13"),
    ("act-04", "โครงงานกลุ่ม", "ประเมินชิ้นงานและการนำเสนอ", 100, 25, "15"),
    ("act-05", "สอบปลายภาค", "สอบข้อเขียน", 100, 15, "17"),
]

MAPPING = [
    [100, 0, 0, 0],
    [40, 60, 0, 0],
    [0, 70, 30, 0],
    [20, 0, 40, 40],
    [0, 50, 50, 0],
]

STUDENTS = [
    ("std-01", "65010001", "นายกิตติพงษ์ แสงทอง", [18, 85, 45, 88, 82]),
    ("std-02", "65010002", "นางสาวจิราพร มีสุข", [15, 70, 38, 75, 68]),
    ("std-03", "65010003", "นายธนกร ศรีสุข", [12, 55, 30, 62, 58]),
    ("std-04", "65010004", "นางสาวปาริชาติ วงศ์ดี", [8, 42, 22, 55, 40]),
    ("std-05", "65010005", "นายภานุวัฒน์ ทองสุข", [20, 92, 48, 95, 90]),
    ("std-06", "65010006", "นางสาวรัตนาภรณ์ ใจงาม", [14, 65, None, 70, 60]),
    ("std-07", "65010007", "นายวรวุฒิ ชัยมงคล", [0, 38, 20, 50, 35]),
    ("std-08", "65010008", "นางสาวศิริพร แก้วมณี", [None, None, None, None, None]),
]

# DATETIME columns hold real timestamps in ค.ศ. — only Course.year is พ.ศ.
UPLOAD_LOGS = [
    ("log-01", "crs-01", "usr-02", "scores_midterm_03376120.xlsx", 7, 1, "2025-08-01 14:20:00"),
    ("log-02", "crs-01", "usr-02", "scores_lab_sql_03376120.xlsx", 6, 0, "2025-08-15 09:05:00"),
]

N_ACT, N_CLO, N_STU = len(ACTIVITIES), len(CLOS), len(STUDENTS)

CRITERIA = []
_n = 1
for ai, row in enumerate(MAPPING):
    for ci, w in enumerate(row):
        if w > 0:
            CRITERIA.append((f"ac-{_n:02d}", ACTIVITIES[ai][0], CLOS[ci][0], w, ai, ci))
            _n += 1

OBJ_ASSESS = []
_used = set()
_n = 1
for cid, act_id, clo_id, w, ai, ci in CRITERIA:
    for oid, o_ci, onum, odesc in OBJECTIVES:
        if o_ci == ci and oid not in _used:
            OBJ_ASSESS.append((f"oa-{_n:02d}", cid, oid))
            _used.add(oid)
            _n += 1
            break

SCORE_ROWS = []
_n = 1
for si, (sid, code, name, scores) in enumerate(STUDENTS):
    for ai, sc in enumerate(scores):
        if sc is not None:
            SCORE_ROWS.append((f"sc-{_n:02d}", sid, ACTIVITIES[ai][0], sc, ai, si))
            _n += 1

# ===========================================================================
# การตัดเกรด — computed from the scores above, never hand-written, so the two
# methods cannot silently disagree with the rest of the workbook.
# ===========================================================================
# CR-05: totalScore = Σ [ score/maxScore × Activity.weight ]  (weights sum to 100)
# Only students assessed on EVERY activity enter a grade run — a partial total
# is not comparable, and for อิงกลุ่ม it would drag mean and SD off (CR-10).
GRADE_POP = []          # (studentIndex, sid, code, name, totalPercent)
GRADE_EXCLUDED = []     # (name, reason)
for si, (sid, code, name, scores) in enumerate(STUDENTS):
    if any(sc is None for sc in scores):
        n_missing = sum(1 for sc in scores if sc is None)
        GRADE_EXCLUDED.append((name, f"ยังประเมินไม่ครบ ({n_missing} กิจกรรม)"))
        continue
    total = sum(sc / ACTIVITIES[ai][3] * ACTIVITIES[ai][4] for ai, sc in enumerate(scores))
    GRADE_POP.append((si, sid, code, name, total))

GR_N = len(GRADE_POP)
GR_MEAN = sum(p[4] for p in GRADE_POP) / GR_N
GR_SD = math.sqrt(sum((p[4] - GR_MEAN) ** 2 for p in GRADE_POP) / GR_N)
GR_MIN = min(p[4] for p in GRADE_POP)
GR_MAX = max(p[4] for p in GRADE_POP)

# อิงเกณฑ์ — fixed percent cutoffs, known before the term starts
BANDS_CRIT = [("A", 80), ("B+", 75), ("B", 70), ("C+", 65),
              ("C", 60), ("D+", 55), ("D", 50), ("F", 0)]
# อิงกลุ่ม — the same ladder read as T-scores (T = 50 is the class mean)
BANDS_NORM = [("A", 65), ("B+", 60), ("B", 55), ("C+", 50),
              ("C", 45), ("D+", 40), ("D", 35), ("F", 0)]


def band_of(value, bands):
    """Highest band whose minimum the value clears. Bands are ordered high->low."""
    for grade, minv in bands:
        if value >= minv:
            return grade
    return bands[-1][0]


def t_score(x):
    return 50 + 10 * (x - GR_MEAN) / GR_SD


# วิธีตัดเกรดเป็นคอลัมน์บน Course ไม่ใช่ตาราง — ตัวอย่างนี้ตั้งไว้ที่อิงเกณฑ์
COURSE_GRADE_METHOD = "CRITERION_REFERENCED"

# No `order` column — rank is ORDER BY minValue DESC, which is total because no
# two bands in one course may share a cutoff.
GRADE_BANDS = [(f"gb-{i+1:02d}", COURSE["id"], g, v)
               for i, (g, v) in enumerate(BANDS_CRIT)]

# One row per student. The letter is stored; mean/SD and the T-score behind an
# อิงกลุ่ม cut are computed at grading time and not kept, so the norm-referenced
# columns on sheet 8 are a live comparison, not a second stored result.
STUDENT_GRADE_ROWS = [[f"sg-{i+1:02d}", sid, round(total, 2),
                       band_of(total, BANDS_CRIT), "— ว่าง —"]
                      for i, (si, sid, code, name, total) in enumerate(GRADE_POP)]

# CLO list per activity, for the มคอ.3 plan sheet
ACT_CLO_TEXT = []
for ai in range(N_ACT):
    parts = [f"CLO {CLOS[ci][1]} ({MAPPING[ai][ci]}%)" for ci in range(N_CLO) if MAPPING[ai][ci] > 0]
    ACT_CLO_TEXT.append(" · ".join(parts))

wb = Workbook()


def set_widths(ws, widths):
    for col, w in widths.items():
        ws.column_dimensions[col].width = w


def title(ws, text, sub=None, accent=C_UI):
    ws["A1"] = text
    ws["A1"].font = Font(name="Calibri", size=16, bold=True, color=accent)
    if sub:
        ws["A2"] = sub
        ws["A2"].font = F_SUB


def header_row(ws, row, headers, start_col=1, fill=FILL_UI, heights=24):
    for i, h in enumerate(headers):
        c = ws.cell(row=row, column=start_col + i, value=h)
        c.font = F_HEAD
        c.fill = fill
        c.border = BORDER
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[row].height = heights


def data_cell(ws, row, col, value, *, zebra=False, align=None, font=None, fill=None, numfmt=None):
    c = ws.cell(row=row, column=col, value=value)
    c.font = font or F_BODY
    c.border = BORDER
    c.fill = fill or (FILL_ROW if zebra else FILL_WHITE)
    c.alignment = align or Alignment(vertical="center", wrap_text=True)
    if numfmt:
        c.number_format = numfmt
    return c


def note(ws, row, col, text, span=6, kind="muted"):
    colors = {"muted": (C_MUTED, None), "gap": (TX_GAP, FILL_GAP), "tqf": (C_TQF, FILL_TQFROW)}
    fg, bg = colors[kind]
    c = ws.cell(row=row, column=col, value=text)
    c.font = Font(size=9.5, italic=True, color=fg)
    if bg:
        c.fill = bg
    ws.merge_cells(start_row=row, start_column=col, end_row=row, end_column=col + span)
    c.alignment = Alignment(vertical="center", wrap_text=True)
    ws.row_dimensions[row].height = 30
    return c


# ===========================================================================
# COVER
# ===========================================================================
ws = wb.active
ws.title = SH_COVER
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 4, "B": 34, "C": 78})

r = 3
for text, font in [
    (INSTITUTION, Font(name="Calibri", size=15, bold=True, color=C_PRIMARY)),
    (FACULTY, Font(name="Calibri", size=12, color=C_ON)),
    (DEPARTMENT, Font(name="Calibri", size=11, color=C_MUTED)),
]:
    c = ws.cell(row=r, column=2, value=text)
    c.font = font
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
    r += 1

r += 1
c = ws.cell(row=r, column=2, value=PROGRAM)
c.font = Font(name="Calibri", size=11, italic=True, color=C_MUTED)
c.alignment = Alignment(wrap_text=True, vertical="center")
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
ws.row_dimensions[r].height = 30
r += 2

c = ws.cell(row=r, column=2, value="ระบบติดตามและประเมินผลลัพธ์การเรียนรู้ที่คาดหวังระดับรายวิชา")
c.font = Font(name="Calibri", size=20, bold=True, color=C_PRIMARY)
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
ws.row_dimensions[r].height = 30
r += 1
c = ws.cell(row=r, column=2, value="Course Learning Outcome Monitoring and Assessment System (CMAS)")
c.font = Font(name="Calibri", size=12, italic=True, color=C_MUTED)
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
r += 2

c = ws.cell(row=r, column=2, value="ตัวอย่างการกรอกข้อมูลของรายวิชา ตามกรอบ มคอ.3 และ มคอ.5")
c.font = Font(name="Calibri", size=13, bold=True, color=C_TQF)
c.fill = FILL_TQFROW
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
ws.row_dimensions[r].height = 24
r += 2

meta = [
    ("รายวิชาที่ใช้เป็นตัวอย่าง", f"{COURSE['code']}  {COURSE['name']}  ({COURSE['nameEn']})  {COURSE['credits']}"),
    ("แผนการศึกษา", COURSE["yearOfStudy"] + " · " + COURSE["group"]),
    ("ภาคการศึกษา", f"ภาคการศึกษาที่ {COURSE['semester']} ปีการศึกษา {COURSE['year']} กลุ่มเรียน {COURSE['section']}"),
        ("จำนวน CLO ที่กำหนด", f"{N_CLO} ข้อ"),
    ("จำนวนกิจกรรมการประเมิน", f"{N_ACT} กิจกรรม (สัดส่วนรวม 100%)"),
    ("จำนวนนักศึกษาในตัวอย่าง", f"{N_STU} คน"),
]
header_row(ws, r, ["หัวข้อ", "รายละเอียด"], start_col=2, fill=FILL_TQF)
r += 1
for i, (k, v) in enumerate(meta):
    z = i % 2 == 1
    data_cell(ws, r, 2, k, zebra=z, font=F_LABEL)
    data_cell(ws, r, 3, v, zebra=z)
    r += 1

r += 1
c = ws.cell(row=r, column=2, value="ลำดับการนำเสนอในไฟล์นี้")
c.font = F_H2
r += 1
header_row(ws, r, ["แผ่นงาน", "ตอบคำถามของอาจารย์ว่า"], start_col=2, fill=FILL_TQF)
r += 1
agenda = [
    (SH_INFO, "รายวิชานี้คืออะไร และระบบเก็บข้อมูลอะไรบ้างในระดับรายวิชา"),
    (SH_CLO, "CLO ของรายวิชามีอะไร ระดับพฤติกรรมใด และตั้งเป้าการบรรลุไว้เท่าไร"),
    (SH_PLAN, "แผนการประเมินผลตามแบบ มคอ.3 หมวดที่ 5 — ตารางที่อาจารย์คุ้นเคยอยู่แล้ว"),
    (SH_MAP, "สิ่งที่ระบบเพิ่มจาก มคอ.3 — น้ำหนักรายคู่ ที่ทำให้คำนวณการบรรลุ CLO ได้จริง"),
    (SH_STU, "รายชื่อนักศึกษาที่ต้องนำเข้า"),
    (SH_SCORE, "หน้าจอกรอกคะแนน — งานประจำที่อาจารย์ทำจริงทุกสัปดาห์"),
    (SH_RESULT, "ผลการบรรลุ CLO รายบุคคล ที่ระบบคำนวณให้ทันทีระหว่างภาคเรียน"),
    (SH_GRADE, "การตัดเกรด — อิงเกณฑ์และอิงกลุ่ม บนคะแนนชุดเดียวกัน ให้ผลต่างกันอย่างไร"),
    (SH_TQF5, "ตารางสรุปสำหรับกรอก มคอ.5 — ปลายทางที่ข้อมูลทั้งหมดไปจบ"),
    (SH_DB, "ข้อมูลเดียวกันนี้ถูกเก็บในฐานข้อมูลอย่างไร (สำหรับกรรมการสายเทคนิค)"),
    (SH_FIELDMAP, "ช่องกรอกแต่ละช่องลงตารางและคอลัมน์ใด"),
]
for i, (s, why) in enumerate(agenda):
    z = i % 2 == 1
    data_cell(ws, r, 2, s, zebra=z, font=F_LABEL)
    data_cell(ws, r, 3, why, zebra=z)
    r += 1

r += 1
note(ws, r, 2, "ที่มาของข้อมูลรายวิชา: รหัสวิชา ชื่อวิชา หน่วยกิต และคำอธิบายรายวิชา "
                "นำมาจากเล่มหลักสูตรฉบับปรับปรุง พ.ศ. 2567 โดยตรง  ·  ส่วน CLO กิจกรรมการประเมิน "
                "รายชื่อนักศึกษา และคะแนนทั้งหมด เป็นข้อมูลสมมติเพื่อสาธิตการทำงานของระบบเท่านั้น", span=1)

# ===========================================================================
# 1 ข้อมูลรายวิชา
# ===========================================================================
ws = wb.create_sheet(SH_INFO)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 3, "B": 30, "C": 62, "D": 34})
title(ws, "1 · ข้อมูลรายวิชา", "เทียบได้กับ มคอ.3 หมวดที่ 1 (ข้อมูลทั่วไป) — กรอกครั้งเดียวตอนเปิดรายวิชา")

header_row(ws, 4, ["หัวข้อตาม มคอ.3", "ค่าที่กรอกในระบบ", "เก็บที่คอลัมน์"], start_col=2)
INFO_FIRST = 5
# The last two rows are read by formulas on sheets 7 and 8, so they must hold a
# NUMBER. Writing "60 %" as text would silently invert every comparison —
# Excel ranks any text above any number — so the percent sign is applied as a
# display format instead.
PCT_FMT = '0" %"'
info_fields = [
    ("รหัสวิชา", COURSE["code"], "Course.code", None),
    ("ชื่อรายวิชา (ไทย)", COURSE["name"], "Course.name", None),
    ("ชื่อรายวิชา (อังกฤษ)", COURSE["nameEn"], "Course.nameEn", None),
    ("จำนวนหน่วยกิต", COURSE["credits"], "Course.credits + lecture/practice/selfStudyHours", None),
    ("หลักสูตรและประเภทของรายวิชา", COURSE["group"], "— ไม่เก็บ (นอกขอบเขต v1)", None),
    ("ภาคการศึกษา / ชั้นปีที่เรียน", f"ภาคการศึกษาที่ {COURSE['semester']} · {COURSE['yearOfStudy']}", "Course.semester", None),
    ("ปีการศึกษา (พ.ศ.)", COURSE["year"], "Course.year", None),
    ("กลุ่มเรียน (Section)", COURSE["section"], "Course.section", None),
    ("รายวิชาที่ต้องเรียนมาก่อน", COURSE["prereq"], "— ไม่เก็บ (นอกขอบเขต v1)", None),
    ("อาจารย์ผู้รับผิดชอบรายวิชา", "ผศ.วิชัย คงเจริญ (ผู้ประสานงานรายวิชา)", "CourseInstructor.role = LEAD", None),
    ("อาจารย์ผู้สอนร่วม", "อ.สุดา พรหมมา", "CourseInstructor.role = CO", None),
    ("รูปแบบการตัดเกรด", COURSE["gradeScale"], "Course.gradeScale", None),
    ("เกณฑ์คะแนนรวมที่ถือว่าผ่านรายวิชา", COURSE["passCriteria"], "Course.passCriteria", PCT_FMT),
    ("เป้าหมายสัดส่วนผู้ผ่านต่อ CLO (Class Target)", COURSE["classTarget"], "Course.classTarget", PCT_FMT),
]
r = INFO_FIRST
for i, (k, v, col, numfmt) in enumerate(info_fields):
    z = i % 2 == 1
    data_cell(ws, r, 2, k, zebra=z, font=F_LABEL)
    data_cell(ws, r, 3, v, zebra=z, fill=FILL_INPUT, numfmt=numfmt,
              align=Alignment(horizontal="center", vertical="center") if numfmt else None)
    data_cell(ws, r, 4, col, zebra=z, font=F_MONO)
    r += 1
_labels = [f[0] for f in info_fields]
PASS_CRIT_CELL = f"$C${INFO_FIRST + next(i for i, l in enumerate(_labels) if 'ผ่านรายวิชา' in l)}"
CLASS_TARGET_CELL = f"$C${INFO_FIRST + next(i for i, l in enumerate(_labels) if 'Class Target' in l)}"

r += 1
ws.cell(row=r, column=2, value="คำอธิบายรายวิชา (ตามเล่มหลักสูตร)").font = F_H2
r += 1
c = data_cell(ws, r, 2, COURSE["desc"], fill=FILL_TQFROW)
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=4)
ws.row_dimensions[r].height = 46
r += 2
note(ws, r, 2, "สองบรรทัดสุดท้ายของตารางด้านบนคือค่าที่ระบบใช้ตัดสินผล — เกณฑ์ผ่านรายวิชาใช้กับนักศึกษารายคน "
                "ส่วน Class Target ใช้กับภาพรวมทั้งห้องว่า CLO ข้อนั้นบรรลุหรือไม่  ทั้งสองค่าเก็บแยกรายวิชา "
                "การแก้ค่าของวิชานี้จึงไม่กระทบผลของวิชาอื่นหรือของภาคเรียนที่ผ่านมา", span=2)

# ===========================================================================
# 2 CLO
# ===========================================================================
ws = wb.create_sheet(SH_CLO)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 11, "C": 8, "D": 52, "E": 14, "F": 20, "G": 16, "H": 24})
title(ws, "2 · ผลลัพธ์การเรียนรู้ระดับรายวิชา (CLO)",
      "เทียบได้กับ มคอ.3 หมวดที่ 4 — CLO และเกณฑ์ทั้งหมดเป็นสิ่งที่ผู้สอนกำหนดเองในระดับรายวิชา")

header_row(ws, 4, ["ลำดับ", "รหัสในระบบ", "CLO ที่", "ผลลัพธ์การเรียนรู้ที่คาดหวัง",
                   "เกณฑ์ผ่านรายคน (%)", "ระดับ Bloom", "เป้าหมายผู้ผ่าน (%)", "ที่มาของเป้าหมาย"], start_col=1)
CLO_FIRST = 5
r = CLO_FIRST
for i, (cid, num, desc, th, bloom, target) in enumerate(CLOS):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, cid, zebra=z, font=F_MONO)
    data_cell(ws, r, 3, num, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 4, desc, zebra=z, fill=FILL_INPUT)
    data_cell(ws, r, 5, th, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center"))
    data_cell(ws, r, 6, f"{BLOOM_TH[bloom]}  ({bloom})", zebra=z,
              align=Alignment(horizontal="center"), font=F_LABEL, fill=FILL_INPUT)
    # numeric and already resolved, so sheet 8 can reference it directly
    data_cell(ws, r, 7, target if target is not None else COURSE["classTarget"],
              zebra=z, align=Alignment(horizontal="center"),
              font=F_LABEL if target is not None else F_BODY, fill=FILL_INPUT)
    data_cell(ws, r, 8,
              "กำหนดเฉพาะ CLO ข้อนี้" if target is not None else "ใช้ค่าของรายวิชา",
              zebra=z, align=Alignment(horizontal="center"), font=F_MUTED)
    ws.row_dimensions[r].height = 32
    r += 1

r += 1
note(ws, r, 1, "ระดับ Bloom มาจากคำกริยาที่ขึ้นต้น CLO เอง ไม่ใช่ค่าที่ระบบเดาให้ — ระบบจึงไม่ตั้งค่าเริ่มต้นให้ "
                "และผู้สอนต้องเลือกเอง  ·  ประโยชน์คือใช้ตรวจความสอดคล้องของการวัด: CLO ระดับ 'วิเคราะห์' "
                "ที่วัดด้วยแบบทดสอบปรนัยอย่างเดียว คือสัญญาณว่าวิธีประเมินยังไม่ตรงกับสิ่งที่เขียนไว้", span=8)

r += 1
note(ws, r, 1, "คอลัมน์ขวาสุดคือสัดส่วนผู้ผ่านที่ทำให้ถือว่า CLO ข้อนั้น 'บรรลุ'  ·  CLO ข้อ 1 อยู่ระดับ "
                "'สร้างสรรค์' ซึ่งเป็นระดับสูงสุดของ Bloom จึงตั้งเป้าไว้ที่ 60% ต่ำกว่าค่ากลางของรายวิชา (70%) "
                "อย่างมีเหตุผล  ·  ข้อที่เว้นว่างไว้จะใช้ค่าของรายวิชาโดยอัตโนมัติ", span=8)

r += 2
ws.cell(row=r, column=1, value="จุดประสงค์เชิงพฤติกรรมของแต่ละ CLO").font = F_H2
r += 1
header_row(ws, r, ["ลำดับ", "รหัสในระบบ", "สังกัด CLO", "จุดประสงค์เชิงพฤติกรรม", "", "", ""], start_col=1)
r += 1
for i, (oid, ci, num, desc) in enumerate(OBJECTIVES):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, oid, zebra=z, font=F_MONO)
    data_cell(ws, r, 3, f"CLO {CLOS[ci][1]}", zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 4, desc, zebra=z)
    r += 1

# ===========================================================================
# 3 แผนประเมิน มคอ.3
# ===========================================================================
ws = wb.create_sheet(SH_PLAN)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 10, "B": 11, "C": 34, "D": 26, "E": 30, "F": 16, "G": 13, "H": 17, "I": 30})
title(ws, "3 · แผนการประเมินผลการเรียนรู้", None, accent=C_TQF)
ws["A2"] = ("รูปแบบเดียวกับ มคอ.3 หมวดที่ 5 ข้อ 2 — ตารางนี้คือสิ่งที่อาจารย์เขียนอยู่แล้วทุกภาคการศึกษา "
            "ระบบเพียงรับข้อมูลชุดเดียวกันนี้เข้าไปเก็บให้เป็นระเบียบ")
ws["A2"].font = F_SUB

header_row(ws, 4,
           ["กิจกรรมที่", "รหัสในระบบ", "งาน/กิจกรรมที่ใช้ประเมิน", "วิธีการประเมิน",
            "ผลลัพธ์การเรียนรู้ที่ประเมิน", "สัปดาห์ที่ประเมิน", "คะแนนเต็ม",
            "สัดส่วนการประเมิน (%)", "เก็บที่คอลัมน์"],
           start_col=1, fill=FILL_TQF, heights=34)
ACT_FIRST = 5
r = ACT_FIRST
for i, (aid, name, method, mx, w, week) in enumerate(ACTIVITIES):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, aid, zebra=z, font=F_MONO)
    data_cell(ws, r, 3, name, zebra=z, fill=FILL_INPUT)
    data_cell(ws, r, 4, method, zebra=z, fill=FILL_INPUT)
    data_cell(ws, r, 5, ACT_CLO_TEXT[i], zebra=z, font=F_MUTED)
    data_cell(ws, r, 6, week, zebra=z, fill=FILL_GAP, align=Alignment(horizontal="center"))
    data_cell(ws, r, 7, mx, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center"))
    data_cell(ws, r, 8, w, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center"))
    data_cell(ws, r, 9, "Activity.maxScore / .weight" if i == 0 else "", zebra=z, font=F_MONO)
    ws.row_dimensions[r].height = 30
    r += 1
ACT_LAST = r - 1

sum_row = r
data_cell(ws, sum_row, 3, "รวมสัดส่วนการประเมินทั้งหมด", font=F_LABEL, fill=FILL_TQFROW)
data_cell(ws, sum_row, 8, f"=SUM(H{ACT_FIRST}:H{ACT_LAST})", fill=FILL_TQFROW,
          font=Font(size=11, bold=True, color=C_ON), align=Alignment(horizontal="center"))
data_cell(ws, sum_row, 9, f'=IF(H{sum_row}=100,"ครบ 100 ตามข้อกำหนด","ยังไม่ครบ 100 — ได้ "&H{sum_row})',
          fill=FILL_TQFROW, font=Font(size=10, bold=True, color=C_TQF))

r = sum_row + 2
note(ws, r, 1, "คอลัมน์ 'ผลลัพธ์การเรียนรู้ที่ประเมิน' ใน มคอ.3 ปกติเขียนเพียงว่ากิจกรรมนี้วัด CLO ข้อใดบ้าง "
                "แต่ไม่ได้บอกว่าวัดข้อไหนมากน้อยเท่าใด ระบบจึงเพิ่มการระบุน้ำหนักรายคู่ในแผ่นงานถัดไป "
                "ซึ่งเป็นเงื่อนไขที่ทำให้คำนวณระดับการบรรลุ CLO ออกมาเป็นตัวเลขได้", span=7)
r += 1
note(ws, r, 1, "ข้อจำกัดที่พบ — คอลัมน์ 'สัปดาห์ที่ประเมิน' (พื้นหลังสีชมพู) เป็นข้อมูลที่ มคอ.3 ต้องมี "
                "แต่ฐานข้อมูลของระบบรุ่นปัจจุบันยังไม่มีคอลัมน์รองรับ หากต้องการให้ระบบออกแบบฟอร์ม มคอ.3 "
                "ได้ครบถ้วน ต้องเพิ่มคอลัมน์นี้ในตาราง Activity ก่อน", span=7, kind="gap")

# ===========================================================================
# 4 เมทริกซ์
# ===========================================================================
ws = wb.create_sheet(SH_MAP)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 10, "B": 34, "C": 15, "D": 15, "E": 15, "F": 15, "G": 14, "H": 26})
title(ws, "4 · เมทริกซ์น้ำหนัก กิจกรรม × CLO", None, accent=C_UI)
ws["A2"] = ("ส่วนที่ระบบเพิ่มจาก มคอ.3 — ระบุว่ากิจกรรมแต่ละอย่างแบ่งไปวัด CLO ข้อใดกี่เปอร์เซ็นต์  "
            "แต่ละแถวต้องรวมได้ 100  ·  ช่องที่เป็น 0 หมายถึงกิจกรรมนั้นไม่ได้วัด CLO ข้อนั้น")
ws["A2"].font = F_SUB

MAP_HEAD = 4
header_row(ws, MAP_HEAD, ["กิจกรรมที่", "งาน/กิจกรรมที่ใช้ประเมิน"] + [f"CLO {c[1]}" for c in CLOS] + ["รวมแถว", "สถานะ"], start_col=1)
MAP_FIRST = 5
r = MAP_FIRST
for ai, (aid, name, method, mx, w, week) in enumerate(ACTIVITIES):
    z = ai % 2 == 1
    data_cell(ws, r, 1, ai + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, name, zebra=z, font=F_LABEL)
    for ci in range(N_CLO):
        val = MAPPING[ai][ci]
        cell = data_cell(ws, r, 3 + ci, val, zebra=z,
                         fill=FILL_INPUT if val > 0 else PatternFill("solid", fgColor="F5F5F7"),
                         align=Alignment(horizontal="center"))
        if val == 0:
            cell.font = Font(size=10, color="A9A4B0")
    last = get_column_letter(2 + N_CLO)
    data_cell(ws, r, 3 + N_CLO, f"=SUM(C{r}:{last}{r})", zebra=z, font=F_LABEL, align=Alignment(horizontal="center"))
    data_cell(ws, r, 4 + N_CLO,
              f'=IF({get_column_letter(3 + N_CLO)}{r}=100,"ครบ 100","ผิด — ได้ "&{get_column_letter(3 + N_CLO)}{r})',
              zebra=z, font=Font(size=10, bold=True, color=C_MUTED))
    r += 1
MAP_LAST = r - 1

r += 1
CR02_ROW = r
data_cell(ws, CR02_ROW, 2, "น้ำหนักของ CLO ที่คำนวณได้ (%)", font=F_LABEL, fill=FILL_CALCROW)
for ci in range(N_CLO):
    col = get_column_letter(3 + ci)
    data_cell(ws, CR02_ROW, 3 + ci,
              f"=SUMPRODUCT('{SH_PLAN}'!$H${ACT_FIRST}:$H${ACT_LAST},{col}{MAP_FIRST}:{col}{MAP_LAST})/100",
              fill=FILL_CALCROW, font=Font(size=10, bold=True, color=C_CALC),
              align=Alignment(horizontal="center"), numfmt="0.00")
data_cell(ws, CR02_ROW, 3 + N_CLO,
          f"=SUM(C{CR02_ROW}:{get_column_letter(2 + N_CLO)}{CR02_ROW})",
          fill=FILL_CALCROW, font=Font(size=10, bold=True, color=C_CALC),
          align=Alignment(horizontal="center"), numfmt="0.00")
data_cell(ws, CR02_ROW, 4 + N_CLO, "รวมได้ 100 เสมอ", fill=FILL_CALCROW, font=F_MUTED)

r = CR02_ROW + 2
note(ws, r, 1, "แถวสีเขียวคือน้ำหนักของ CLO แต่ละข้อเมื่อคิดจากทั้งรายวิชา ซึ่งเป็นค่าที่คำนวณได้เอง "
                "อาจารย์ไม่ต้องกรอก และไม่มีการเก็บซ้ำในฐานข้อมูล เพื่อไม่ให้มีวันที่ตัวเลขสองที่ไม่ตรงกัน", span=6)
r += 1
ws.cell(row=r, column=1,
        value=f"เมทริกซ์นี้มี {N_ACT}×{N_CLO} = {N_ACT * N_CLO} ช่อง แต่มีความสัมพันธ์ที่ต้องเก็บจริงเพียง {len(CRITERIA)} รายการ").font = F_LABEL

# ===========================================================================
# 5 รายชื่อนักศึกษา
# ===========================================================================
ws = wb.create_sheet(SH_STU)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 12, "C": 18, "D": 34, "E": 40})
title(ws, "5 · รายชื่อนักศึกษาในรายวิชา", "นำเข้าจากไฟล์ Excel ได้ทั้งชั้น ไม่ต้องพิมพ์ทีละคน")
header_row(ws, 4, ["ลำดับ", "รหัสในระบบ", "รหัสนักศึกษา", "ชื่อ-นามสกุล", "เก็บที่คอลัมน์"], start_col=1)
STU_FIRST = 5
r = STU_FIRST
for i, (sid, code, name, _) in enumerate(STUDENTS):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, sid, zebra=z, font=F_MONO)
    data_cell(ws, r, 3, code, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center")).number_format = "@"
    data_cell(ws, r, 4, name, zebra=z, fill=FILL_INPUT)
    data_cell(ws, r, 5, "Student.studentCode / .name" if i == 0 else "", zebra=z, font=F_MONO)
    r += 1
r += 1
note(ws, r, 1, "หนึ่งแถวคือการลงทะเบียนเรียนหนึ่งครั้ง ไม่ใช่ตัวบุคคล — นักศึกษาคนเดียวที่ลงเรียนสามรายวิชา "
                "จะปรากฏสามแถวในระบบ ซึ่งเป็นการออกแบบที่ตั้งใจ เพราะคะแนนและผลการบรรลุ CLO ผูกกับรายวิชาเสมอ", span=4)

# ===========================================================================
# 6 กรอกคะแนน
# ===========================================================================
ws = wb.create_sheet(SH_SCORE)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 16, "C": 30})
for i in range(N_ACT):
    ws.column_dimensions[get_column_letter(4 + i)].width = 18
ws.column_dimensions[get_column_letter(4 + N_ACT)].width = 32

title(ws, "6 · หน้าจอกรอกคะแนน", "งานประจำที่อาจารย์ทำจริง — กรอกได้ทีละกิจกรรม ไม่ต้องรอให้ครบทุกกิจกรรม")

SCORE_HEAD = 4
header_row(ws, SCORE_HEAD, ["ลำดับ", "รหัสนักศึกษา", "ชื่อ-นามสกุล"], start_col=1)
for i in range(N_ACT):
    c = ws.cell(row=SCORE_HEAD, column=4 + i,
                value=f"='{SH_PLAN}'!C{ACT_FIRST + i}&\" (เต็ม \"&'{SH_PLAN}'!G{ACT_FIRST + i}&\")\"")
    c.font = F_HEAD
    c.fill = FILL_UI
    c.border = BORDER
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
c = ws.cell(row=SCORE_HEAD, column=4 + N_ACT, value="จำนวนแถวที่เกิดในฐานข้อมูล")
c.font = F_HEAD
c.fill = FILL_UI
c.border = BORDER
c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
ws.row_dimensions[SCORE_HEAD].height = 38

SCORE_FIRST = 5
r = SCORE_FIRST
for i, (sid, code, name, scores) in enumerate(STUDENTS):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, code, zebra=z, font=F_MONO, align=Alignment(horizontal="center")).number_format = "@"
    data_cell(ws, r, 3, name, zebra=z)
    for j, sc in enumerate(scores):
        cell = data_cell(ws, r, 4 + j, sc, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center"))
        if sc is None:
            cell.fill = PatternFill("solid", fgColor="FAFAFC")
    filled = sum(1 for s in scores if s is not None)
    txt = "ครบทุกกิจกรรม" if filled == N_ACT else f"ยังไม่ประเมิน {N_ACT - filled} กิจกรรม"
    data_cell(ws, r, 4 + N_ACT, f"{filled} แถว — {txt}", zebra=z, font=F_MUTED)
    r += 1
SCORE_LAST = r - 1

r += 1
note(ws, r, 1, "ช่องที่เว้นว่างหมายถึงยังไม่ได้ประเมิน ต่างจากการให้ 0 คะแนนซึ่งหมายถึงประเมินแล้วและได้ 0 จริง "
                "ระบบแยกสองกรณีนี้ออกจากกันในทุกการคำนวณ — เปรียบเทียบได้จากนักศึกษารหัส 65010007 ที่ได้ 0 จริง "
                "กับรหัส 65010008 ที่ยังไม่ถูกประเมินเลย", span=5, kind="tqf")
r += 1
note(ws, r, 1, f"กรอกไปแล้ว {len(SCORE_ROWS)} ช่อง จากทั้งหมด {N_STU * N_ACT} ช่อง — "
                f"ฐานข้อมูลจึงมีคะแนนอยู่ {len(SCORE_ROWS)} รายการ ไม่ใช่ {N_STU * N_ACT} รายการ", span=5)

# ===========================================================================
# 7 ผลการบรรลุ CLO
# ===========================================================================
ws = wb.create_sheet(SH_RESULT)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 16, "C": 30})
for i in range(max(N_ACT, N_CLO)):
    ws.column_dimensions[get_column_letter(4 + i)].width = 15
ws.column_dimensions[get_column_letter(4 + N_CLO)].width = 15
ws.column_dimensions[get_column_letter(5 + N_CLO)].width = 17
ws.column_dimensions[get_column_letter(6 + N_CLO)].width = 13
ws.column_dimensions[get_column_letter(7 + N_CLO)].width = 17
ws.column_dimensions[get_column_letter(8 + N_CLO)].width = 22

title(ws, "7 · ผลการบรรลุ CLO (ระบบคำนวณให้ทั้งหมด)", None, accent=C_CALC)
ws["A2"] = ("อาจารย์ไม่ต้องกรอกอะไรในแผ่นนี้ ทุกตัวเลขคำนวณจากคะแนนในแผ่นที่ 6 และน้ำหนักในแผ่นที่ 4  ·  "
            "ลองแก้คะแนนในแผ่นที่ 6 แล้วกลับมาดู ตัวเลขจะเปลี่ยนทันที")
ws["A2"].font = F_SUB

r = 4
ws.cell(row=r, column=1, value="ขั้นที่ 1 — สัดส่วนคะแนนที่ทำได้ของแต่ละกิจกรรม").font = F_H2
RATIO_HEAD = r + 1
header_row(ws, RATIO_HEAD, ["ลำดับ", "รหัส", "ชื่อ-นามสกุล"] + [f"กิจกรรมที่ {i+1}" for i in range(N_ACT)], start_col=1, fill=FILL_CALC)
RATIO_FIRST = RATIO_HEAD + 1
for i in range(N_STU):
    rr = RATIO_FIRST + i
    z = i % 2 == 1
    data_cell(ws, rr, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 2, STUDENTS[i][1], zebra=z, font=F_MONO, align=Alignment(horizontal="center")).number_format = "@"
    data_cell(ws, rr, 3, STUDENTS[i][2], zebra=z)
    for j in range(N_ACT):
        col = get_column_letter(4 + j)
        src = f"'{SH_SCORE}'!{col}{SCORE_FIRST + i}"
        data_cell(ws, rr, 4 + j, f"=IF({src}=\"\",0,{src}/'{SH_PLAN}'!$G${ACT_FIRST + j})",
                  zebra=z, align=Alignment(horizontal="center"), numfmt="0.0000")

r = RATIO_FIRST + N_STU + 1
ws.cell(row=r, column=1, value="ขั้นที่ 2 — ประเมินแล้วหรือยัง (1 = ประเมินแล้ว, 0 = ยังไม่ประเมิน)").font = F_H2
HAS_HEAD = r + 1
header_row(ws, HAS_HEAD, ["ลำดับ", "รหัส", "ชื่อ-นามสกุล"] + [f"กิจกรรมที่ {i+1}" for i in range(N_ACT)], start_col=1, fill=FILL_CALC)
HAS_FIRST = HAS_HEAD + 1
for i in range(N_STU):
    rr = HAS_FIRST + i
    z = i % 2 == 1
    data_cell(ws, rr, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 2, STUDENTS[i][1], zebra=z, font=F_MONO, align=Alignment(horizontal="center")).number_format = "@"
    data_cell(ws, rr, 3, STUDENTS[i][2], zebra=z)
    for j in range(N_ACT):
        col = get_column_letter(4 + j)
        src = f"'{SH_SCORE}'!{col}{SCORE_FIRST + i}"
        data_cell(ws, rr, 4 + j, f"=IF({src}=\"\",0,1)", zebra=z, align=Alignment(horizontal="center"))

r = HAS_FIRST + N_STU + 1
ws.cell(row=r, column=1, value="ขั้นที่ 3 — ตารางน้ำหนักที่ดึงมาจากแผ่นที่ 4").font = F_H2
CW_HEAD = r + 1
header_row(ws, CW_HEAD, ["", "", "CLO"] + [f"กิจกรรมที่ {i+1}" for i in range(N_ACT)], start_col=1, fill=FILL_CALC)
CW_FIRST = CW_HEAD + 1
for ci in range(N_CLO):
    rr = CW_FIRST + ci
    z = ci % 2 == 1
    data_cell(ws, rr, 3, f"CLO {CLOS[ci][1]}", zebra=z, font=F_LABEL)
    for ai in range(N_ACT):
        data_cell(ws, rr, 4 + ai, f"='{SH_MAP}'!{get_column_letter(3 + ci)}{MAP_FIRST + ai}",
                  zebra=z, align=Alignment(horizontal="center"))

AW_ROW = CW_FIRST + N_CLO
data_cell(ws, AW_ROW, 3, "สัดส่วนของกิจกรรมต่อรายวิชา (%)", font=F_LABEL, fill=FILL_TQFROW)
for ai in range(N_ACT):
    data_cell(ws, AW_ROW, 4 + ai, f"='{SH_PLAN}'!$H${ACT_FIRST + ai}", fill=FILL_TQFROW, align=Alignment(horizontal="center"))

TH_ROW = AW_ROW + 1
data_cell(ws, TH_ROW, 3, "เกณฑ์ผ่านของแต่ละ CLO (%)", font=F_LABEL, fill=FILL_TQFROW)
for ci in range(N_CLO):
    data_cell(ws, TH_ROW, 4 + ci, f"='{SH_CLO}'!$E${CLO_FIRST + ci}", fill=FILL_TQFROW, align=Alignment(horizontal="center"))

r = TH_ROW + 2
ws.cell(row=r, column=1, value="ขั้นที่ 4 — ผลรายบุคคล").font = F_H2
RES_HEAD = r + 1
header_row(ws, RES_HEAD,
           ["ลำดับ", "รหัสนักศึกษา", "ชื่อ-นามสกุล"] + [f"CLO {c[1]} (%)" for c in CLOS]
           + ["คะแนนรวม (%)", "ประเมินแล้วคิดเป็น (%)", "กรอกแล้ว", "สรุปผลรายวิชา", "สถานะการติดตาม"],
           start_col=1, fill=FILL_CALC, heights=34)
RES_FIRST = RES_HEAD + 1

col_total = 4 + N_CLO
col_cap = 5 + N_CLO
col_filled = 6 + N_CLO
col_pass = 7 + N_CLO
col_status = 8 + N_CLO
L_total = get_column_letter(col_total)
L_cap = get_column_letter(col_cap)
L_cloA, L_cloZ = get_column_letter(4), get_column_letter(3 + N_CLO)
L_actA, L_actZ = get_column_letter(4), get_column_letter(3 + N_ACT)

for i in range(N_STU):
    rr = RES_FIRST + i
    z = i % 2 == 1
    ratio_row, has_row = RATIO_FIRST + i, HAS_FIRST + i
    data_cell(ws, rr, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 2, STUDENTS[i][1], zebra=z, font=F_MONO, align=Alignment(horizontal="center")).number_format = "@"
    data_cell(ws, rr, 3, STUDENTS[i][2], zebra=z)
    for ci in range(N_CLO):
        cw = CW_FIRST + ci
        den = f"SUMPRODUCT(${L_actA}${has_row}:${L_actZ}${has_row},${L_actA}${cw}:${L_actZ}${cw})"
        num = f"SUMPRODUCT(${L_actA}${ratio_row}:${L_actZ}${ratio_row},${L_actA}${cw}:${L_actZ}${cw})"
        data_cell(ws, rr, 4 + ci, f'=IF({den}=0,"—",{num}/{den}*100)',
                  zebra=z, align=Alignment(horizontal="center"), numfmt="0.00")
    data_cell(ws, rr, col_total,
              f"=SUMPRODUCT(${L_actA}${ratio_row}:${L_actZ}${ratio_row},${L_actA}${AW_ROW}:${L_actZ}${AW_ROW})",
              zebra=z, align=Alignment(horizontal="center"), numfmt="0.00", font=F_LABEL)
    data_cell(ws, rr, col_cap,
              f"=SUMPRODUCT(${L_actA}${has_row}:${L_actZ}${has_row},${L_actA}${AW_ROW}:${L_actZ}${AW_ROW})",
              zebra=z, align=Alignment(horizontal="center"), numfmt="0", font=F_MUTED)
    data_cell(ws, rr, col_filled,
              f"=COUNT('{SH_SCORE}'!{L_actA}{SCORE_FIRST + i}:{L_actZ}{SCORE_FIRST + i})&\"/{N_ACT}\"",
              zebra=z, align=Alignment(horizontal="center"), font=F_MUTED)
    data_cell(ws, rr, col_pass,
              f'=IF(COUNT(${L_cloA}{rr}:${L_cloZ}{rr})=0,"ยังไม่มีข้อมูล",'
              f'IF(${L_cap}{rr}<100,"ยังตัดสินไม่ได้",'
              f'IF(${L_total}{rr}>=\'{SH_INFO}\'!{PASS_CRIT_CELL},"ผ่าน","ไม่ผ่าน")))',
              zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)
    data_cell(ws, rr, col_status,
              f'=IF(COUNT(${L_cloA}{rr}:${L_cloZ}{rr})=0,"ยังประเมินไม่ครบ",'
              f'IF(SUMPRODUCT(--ISNUMBER(${L_cloA}{rr}:${L_cloZ}{rr}),'
              f'--(${L_cloA}{rr}:${L_cloZ}{rr}<${L_cloA}${TH_ROW}:${L_cloZ}${TH_ROW}))>0,'
              f'"ต้องติดตามเป็นพิเศษ","ปกติ"))',
              zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)
RES_LAST = RES_FIRST + N_STU - 1

r = RES_LAST + 2
note(ws, r, 1, "คอลัมน์ 'ประเมินแล้วคิดเป็น (%)' บอกว่าตอนนี้ประเมินไปแล้วกี่เปอร์เซ็นต์ของคะแนนเต็มทั้งรายวิชา "
                "ถ้ายังไม่ถึง 100 แปลว่ายังสรุปผ่าน/ไม่ผ่านไม่ได้ เพราะคะแนนรวมยังไม่ครบ — "
                "แต่ผลการบรรลุ CLO รายข้อดูได้ทันทีระหว่างภาคเรียน ซึ่งเป็นประโยชน์หลักของระบบนี้", span=8, kind="tqf")

ws.freeze_panes = "D5"
RESULT_SHEET_CLO_COLS = [get_column_letter(4 + ci) for ci in range(N_CLO)]

# ===========================================================================
# 8 ตัดเกรด
# ===========================================================================
ws = wb.create_sheet(SH_GRADE)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 4, "B": 12, "C": 26, "D": 14, "E": 13, "F": 13,
                "G": 13, "H": 13, "I": 30})
title(ws, "8 · การตัดเกรด — อิงเกณฑ์ และ อิงกลุ่ม", None, accent=C_CALC)
ws["A2"] = ("คะแนนชุดเดียวกัน ตัดสองวิธี ได้ผลต่างกัน — แผ่นนี้แสดงให้เห็นว่าทำไมระบบต้องเก็บว่า "
            "ตัดด้วยวิธีใดและด้วยค่าสถิติชุดใด ไม่ใช่เก็บแค่ตัวอักษรเกรด")
ws["A2"].font = F_SUB

r = 4
ws.cell(row=r, column=2, value="กลุ่มที่นำมาคิด (ประชากรของการตัดเกรด)").font = F_H2
r += 1
header_row(ws, r, ["รายการ", "ค่า", "ที่มา"], start_col=2, fill=FILL_CALC)
r += 1
pop_rows = [
    ("จำนวนที่นำมาคิด (n)", GR_N, f"เฉพาะผู้ที่ประเมินครบทุกกิจกรรม จากทั้งหมด {N_STU} คน"),
    ("คะแนนเฉลี่ย (mean)", round(GR_MEAN, 2), "คำนวณจากคะแนนรวมถ่วงน้ำหนักของ n คนนี้"),
    ("ส่วนเบี่ยงเบนมาตรฐาน (SD)", round(GR_SD, 2), "ถ้าเป็น 0 ระบบจะไม่ยอมให้ตัดอิงกลุ่ม เพราะสูตรต้องหารด้วยค่านี้"),
    ("คะแนนต่ำสุด / สูงสุด", f"{round(GR_MIN, 2)} / {round(GR_MAX, 2)}",
     "แสดงประกอบเท่านั้น ไม่มีคอลัมน์เก็บ — หาได้จากคะแนนรวมของ n คนนี้เมื่อไรก็ได้ และไม่มีสูตรใดใช้"),
]
for i, (k, v, why) in enumerate(pop_rows):
    z = i % 2 == 1
    data_cell(ws, r, 2, k, zebra=z, font=F_LABEL)
    data_cell(ws, r, 3, v, zebra=z, align=Alignment(horizontal="center"), font=F_LABEL, fill=FILL_CALCROW)
    data_cell(ws, r, 4, why, zebra=z, font=F_MUTED)
    ws.merge_cells(start_row=r, start_column=4, end_row=r, end_column=9)
    r += 1

r += 1
for nm, why in GRADE_EXCLUDED:
    note(ws, r, 2, f"ไม่นำมาคิด: {nm} — {why}  ·  คนที่ยังประเมินไม่ครบต้องไม่ถูกนับใน mean และ SD "
                   "เพราะคะแนนที่ยังไม่ครบจะดึงค่าเฉลี่ยของทั้งห้องให้ต่ำลงและดันเกรดคนอื่นขึ้นทั้งกลุ่ม",
         span=8, kind="gap")
    r += 1

r += 1
ws.cell(row=r, column=2, value="ผลการตัดเกรดทั้งสองวิธี บนคะแนนชุดเดียวกัน").font = F_H2
r += 1
header_row(ws, r, ["รหัสนักศึกษา", "ชื่อ-นามสกุล", "คะแนนรวม (%)",
                   "เกรด\nอิงเกณฑ์", "T-score", "เกรด\nอิงกลุ่ม", "ต่างกัน?", "หมายเหตุ"],
           start_col=2, fill=FILL_CALC, heights=34)
r += 1
GRADE_FIRST = r
n_diff = 0
for i, (si, sid, code, name, total) in enumerate(GRADE_POP):
    z = i % 2 == 1
    t = t_score(total)
    g_crit = band_of(total, BANDS_CRIT)
    g_norm = band_of(t, BANDS_NORM)
    differs = g_crit != g_norm
    if differs:
        n_diff += 1
    data_cell(ws, r, 2, code, zebra=z, font=F_MONO, align=Alignment(horizontal="center"))
    data_cell(ws, r, 3, name, zebra=z)
    data_cell(ws, r, 4, round(total, 2), zebra=z, align=Alignment(horizontal="center"), numfmt="0.00")
    data_cell(ws, r, 5, g_crit, zebra=z, align=Alignment(horizontal="center"), font=F_LABEL, fill=FILL_TQFROW)
    data_cell(ws, r, 6, round(t, 2), zebra=z, align=Alignment(horizontal="center"), numfmt="0.00")
    data_cell(ws, r, 7, g_norm, zebra=z, align=Alignment(horizontal="center"), font=F_LABEL, fill=FILL_CALCROW)
    data_cell(ws, r, 8, "ต่าง" if differs else "เท่ากัน", zebra=z,
              align=Alignment(horizontal="center"),
              font=Font(name="Calibri", size=10, bold=True, color=TX_GAP) if differs else F_MUTED,
              fill=FILL_GAP if differs else None)
    data_cell(ws, r, 9, "" if not differs else f"{g_crit} → {g_norm}", zebra=z, font=F_MUTED)
    r += 1

r += 1
_crit_counts = {}
_norm_counts = {}
for si, sid, code, name, total in GRADE_POP:
    _crit_counts[band_of(total, BANDS_CRIT)] = _crit_counts.get(band_of(total, BANDS_CRIT), 0) + 1
    g = band_of(t_score(total), BANDS_NORM)
    _norm_counts[g] = _norm_counts.get(g, 0) + 1
_fmt = lambda d: "  ·  ".join(f"{g} = {d[g]}" for g, _ in BANDS_CRIT if g in d)
note(ws, r, 2, f"อิงเกณฑ์:  {_fmt(_crit_counts)}", span=8)
r += 1
note(ws, r, 2, f"อิงกลุ่ม:  {_fmt(_norm_counts)}", span=8)
r += 2

note(ws, r, 2, f"นักศึกษา {n_diff} คนจาก {GR_N} คน ได้เกรดไม่เท่ากันระหว่างสองวิธี ทั้งที่คะแนนดิบชุดเดียวกัน  ·  "
               "อิงเกณฑ์ตัดสินจากคะแนนของตัวเองล้วน ๆ ส่วนอิงกลุ่มตัดสินจากตำแหน่งเทียบกับเพื่อนร่วมห้อง "
               "คนที่ได้ 45 คะแนนจึงตกเมื่อใช้อิงเกณฑ์ แต่ไม่ตกเมื่อใช้อิงกลุ่ม เพราะทั้งห้องคะแนนไม่สูง", span=8)
r += 1
note(ws, r, 2, "เพราะเกรดอิงกลุ่มขึ้นกับ 'ใครอยู่ในห้องวันที่ตัด' ระบบจึงตรึงค่า n / mean / SD ไว้กับผลการตัดเกรด "
               "แต่ละรอบ  ·  ถ้าไม่ตรึง นักศึกษาถอนรายวิชาเพียงคนเดียวจะทำให้ค่าเฉลี่ยขยับ และเกรดของ "
               "ทุกคนเปลี่ยนตามโดยไม่มีใครแก้คะแนนสักตัว  ·  เกรดที่ประกาศแล้วจะแก้ไม่ได้ ต้องตัดรอบใหม่แทน",
     span=8, kind="gap")
r += 2

ws.cell(row=r, column=2, value="เกณฑ์ที่ใช้ตัด").font = F_H2
r += 1
header_row(ws, r, ["เกรด", "อิงเกณฑ์ — คะแนนรวมขั้นต่ำ (%)", "อิงกลุ่ม — T-score ขั้นต่ำ"],
           start_col=2, fill=FILL_CALC)
r += 1
for i, ((g, v_crit), (_, v_norm)) in enumerate(zip(BANDS_CRIT, BANDS_NORM)):
    z = i % 2 == 1
    data_cell(ws, r, 2, g, zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)
    data_cell(ws, r, 3, v_crit, zebra=z, align=Alignment(horizontal="center"), fill=FILL_TQFROW)
    data_cell(ws, r, 4, v_norm, zebra=z, align=Alignment(horizontal="center"), fill=FILL_CALCROW)
    r += 1
r += 1
note(ws, r, 2, "T-score 50 คือค่าเฉลี่ยของห้องพอดี ทุก 10 หน่วยคือ 1 ส่วนเบี่ยงเบนมาตรฐาน  ·  "
               "สูตร T = 50 + 10 × (คะแนนของนักศึกษา − ค่าเฉลี่ย) ÷ ส่วนเบี่ยงเบนมาตรฐาน", span=8)
ws.freeze_panes = "C5"

# ===========================================================================
# 9 รายงาน มคอ.5
# ===========================================================================
ws = wb.create_sheet(SH_TQF5)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 4, "B": 10, "C": 50, "D": 15, "E": 15, "F": 16, "G": 16, "H": 18, "I": 34})
title(ws, "9 · ตารางสรุปสำหรับกรอก มคอ.5", None, accent=C_TQF)
ws["A2"] = ("รายงานผลการดำเนินการของรายวิชา — ระบบสรุปให้พร้อมนำไปกรอกในแบบฟอร์ม มคอ.5 "
            "โดยไม่ต้องรวบรวมคะแนนจากไฟล์ Excel หลายไฟล์อีก")
ws["A2"].font = F_SUB

r = 4
c = ws.cell(row=r, column=2, value=f"{COURSE['code']}  {COURSE['name']}  ·  ภาคการศึกษาที่ {COURSE['semester']} ปีการศึกษา {COURSE['year']}  ·  กลุ่มเรียน {COURSE['section']}")
c.font = F_LABEL
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=9)
r += 2

ws.cell(row=r, column=2, value="ผลการดำเนินการตามผลลัพธ์การเรียนรู้ของรายวิชา").font = F_H2
r += 1
header_row(ws, r, ["CLO ที่", "ผลลัพธ์การเรียนรู้ที่คาดหวัง", "ระดับ Bloom", "เกณฑ์ผ่านรายบุคคล (%)",
                   "เป้าหมายระดับชั้น (%)", "ผลที่ได้จริง (%)", "จำนวนที่ผ่าน / ประเมินได้", "สรุปผล"],
           start_col=2, fill=FILL_TQF, heights=40)
TQF5_FIRST = r + 1
for ci in range(N_CLO):
    rr = TQF5_FIRST + ci
    z = ci % 2 == 1
    col = RESULT_SHEET_CLO_COLS[ci]
    rng = f"'{SH_RESULT}'!{col}{RES_FIRST}:{col}{RES_LAST}"
    data_cell(ws, rr, 2, f"CLO {CLOS[ci][1]}", zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)
    data_cell(ws, rr, 3, CLOS[ci][2], zebra=z)
    data_cell(ws, rr, 4, BLOOM_TH[CLOS[ci][4]], zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 5, f"='{SH_CLO}'!$E${CLO_FIRST + ci}", zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 6, f"='{SH_CLO}'!$G${CLO_FIRST + ci}", zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 7, f'=IF(COUNT({rng})=0,"—",COUNTIF({rng},">="&E{rr})/COUNT({rng})*100)',
              zebra=z, align=Alignment(horizontal="center"), numfmt="0.00", font=F_LABEL)
    data_cell(ws, rr, 8, f'=COUNTIF({rng},">="&E{rr})&" / "&COUNT({rng})',
              zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 9, f'=IF(G{rr}="—","ยังสรุปไม่ได้",IF(G{rr}>=F{rr},"บรรลุตามเป้าหมาย","ยังไม่บรรลุ — ต้องทบทวนการจัดการเรียนการสอน"))',
              zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)
    ws.row_dimensions[rr].height = 34
TQF5_LAST = TQF5_FIRST + N_CLO - 1

r = TQF5_LAST + 2
ws.cell(row=r, column=2, value="สรุปจำนวนนักศึกษา").font = F_H2
r += 1
header_row(ws, r, ["รายการ", "จำนวน (คน)"], start_col=2, fill=FILL_TQF)
r += 1
L_pass = get_column_letter(col_pass)
L_stat = get_column_letter(col_status)
summary = [
    ("นักศึกษาทั้งหมดในรายวิชา", f"=COUNTA('{SH_RESULT}'!B{RES_FIRST}:B{RES_LAST})"),
    ("ประเมินครบทุกกิจกรรมแล้ว", f"=COUNTIF('{SH_RESULT}'!{L_cap}{RES_FIRST}:{L_cap}{RES_LAST},100)"),
    ("ยังประเมินไม่ครบ", f"=COUNTIF('{SH_RESULT}'!{L_stat}{RES_FIRST}:{L_stat}{RES_LAST},\"ยังประเมินไม่ครบ\")"),
    ("ต้องติดตามเป็นพิเศษ (ยังไม่บรรลุ CLO อย่างน้อย 1 ข้อ)", f"=COUNTIF('{SH_RESULT}'!{L_stat}{RES_FIRST}:{L_stat}{RES_LAST},\"ต้องติดตามเป็นพิเศษ\")"),
    ("ผ่านรายวิชาแล้ว", f"=COUNTIF('{SH_RESULT}'!{L_pass}{RES_FIRST}:{L_pass}{RES_LAST},\"ผ่าน\")"),
]
for i, (k, f) in enumerate(summary):
    z = i % 2 == 1
    data_cell(ws, r, 2, k, zebra=z)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=6)
    data_cell(ws, r, 7, f, zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)
    r += 1

r += 1
note(ws, r, 2, "ตัวเลขทุกช่องในแผ่นนี้เชื่อมกับคะแนนในแผ่นที่ 6 โดยตรง เมื่อกรอกคะแนนเพิ่ม ตัวเลขจะปรับเอง "
                "อาจารย์จึงเปิดดูสถานะการบรรลุ CLO ได้ทุกสัปดาห์ ไม่ต้องรอสิ้นภาคการศึกษา "
                "ซึ่งเป็นข้อแตกต่างหลักจากการรวมคะแนนด้วย Excel แบบเดิม", span=7, kind="tqf")

# ===========================================================================
# 10 ตารางฐานข้อมูล
# ===========================================================================
ws = wb.create_sheet(SH_DB)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 3, "B": 13, "C": 21, "D": 26, "E": 20, "F": 11, "G": 10, "H": 11,
                "I": 12, "J": 13, "K": 13, "L": 14, "M": 15, "N": 13, "O": 13, "P": 19, "Q": 19})
title(ws, "10 · ข้อมูลเดียวกันนี้ถูกเก็บในฐานข้อมูลอย่างไร", None, accent=C_DB)
ws["A2"] = ("ทั้ง 13 ตาราง 80 คอลัมน์ ตามแผนภาพ ER ของระบบ พร้อมแถวข้อมูลที่ตรงกับทุกแผ่นงานก่อนหน้า "
            "— แต่ละตารางแสดงชื่อคอลัมน์ ชนิดข้อมูล และบทบาทของคีย์ครบทุกช่อง")
ws["A2"].font = F_SUB


NULL_FONT = Font(name="Consolas", size=9, italic=True, color="9A94A6")
KEY_STYLE = {
    "PK": (C_CALC, "E6F4EA"),
    "FK": (C_UI, "EAF1FE"),
    "UQ": (C_TQF, "FEF7E0"),
    "GEN": ("6B6478", "EDEBF2"),
    # nullable — "เว้นว่างได้" is a real property worth showing, not an absence
    "NULL": ("6B6478", "F3F3F5"),
    "": (C_MUTED, "FFFFFF"),
}


def db_table(ws, start_row, table, thai, source, cols, rows, note_text=None, gap_note=None):
    """cols: list of (name, er_type, key). rows: list of value lists, same order."""
    n = len(cols)
    r = start_row
    span_end = 1 + n

    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=span_end)
    c = ws.cell(row=r, column=2, value=f"{table}   —   {n} คอลัมน์ · {len(rows)} แถว")
    c.font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
    c.fill = FILL_DB
    c.alignment = Alignment(vertical="center", indent=1)
    ws.row_dimensions[r].height = 22
    r += 1

    c = ws.cell(row=r, column=2, value=f"เก็บอะไร: {thai}          ·          กรอกจากแผ่นงาน: {source}")
    c.font = F_MUTED
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=span_end)
    r += 1

    # column names
    for j, (name, _t, _k) in enumerate(cols):
        c = ws.cell(row=r, column=2 + j, value=name)
        c.font = F_HEAD
        c.fill = FILL_DB
        c.border = BORDER
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[r].height = 24
    r += 1

    # ER data type
    for j, (_n, t, _k) in enumerate(cols):
        c = ws.cell(row=r, column=2 + j, value=t)
        c.font = Font(name="Consolas", size=8, color=C_MUTED)
        c.fill = PatternFill("solid", fgColor="F7F6F9")
        c.border = BORDER
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[r].height = 22
    r += 1

    # key role
    for j, (_n, _t, k) in enumerate(cols):
        fg, bg = KEY_STYLE[k]
        c = ws.cell(row=r, column=2 + j, value=k)
        c.font = Font(size=8.5, bold=True, color=fg)
        c.fill = PatternFill("solid", fgColor=bg)
        c.border = BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[r].height = 16
    r += 1

    for i, row in enumerate(rows):
        z = i % 2 == 1
        for j, v in enumerate(row):
            is_null = v is None
            cell = data_cell(ws, r, 2 + j, "NULL" if is_null else v, zebra=z,
                             font=NULL_FONT if is_null else (F_MONO if j == 0 else F_BODY),
                             align=Alignment(vertical="center", wrap_text=True,
                                             horizontal="center" if is_null or isinstance(v, (int, float)) else "left"))
        r += 1

    if note_text:
        note(ws, r, 2, note_text, span=n - 1)
        r += 1
    if gap_note:
        note(ws, r, 2, gap_note, span=n - 1, kind="gap")
        r += 1
    return r + 2


# --- timestamps: `year` is พ.ศ. but DATETIME columns are ค.ศ. -------------
TS_USER = "2025-05-15 08:30:00"
UPLOAD_TS = ["2025-07-08 16:00:00", "2025-08-01 14:20:00", "2025-08-15 09:05:00",
             "2025-09-20 11:30:00", "2025-10-05 15:45:00"]
ARGON = "$argon2id$v=19$m=65536,t=3,p=4$…"

legend_row = 4
c = ws.cell(row=legend_row, column=2,
            value="ความหมายของแถบสีในแถว KEY :   PK = คีย์หลัก   ·   FK = คีย์อ้างอิงไปตารางอื่น   ·   "
                  "UQ = ห้ามซ้ำ   ·   GEN = คอลัมน์ที่ฐานข้อมูลสร้างให้เอง   ·   NULL = ยังไม่มีค่า")
c.font = Font(size=9.5, italic=True, color=C_MUTED)
ws.merge_cells(start_row=legend_row, start_column=2, end_row=legend_row, end_column=17)

r = 6
r = db_table(ws, r, "User", "บัญชีผู้ใช้ระบบและบทบาท", "ผู้ดูแลระบบสร้างให้",
             [("id", "VARCHAR(30)", "PK"), ("email", "VARCHAR(255)", "UQ"), ("name", "VARCHAR(255)", ""),
              ("passwordHash", "VARCHAR(255)", ""), ("role", "ENUM('ADMIN','INSTRUCTOR')", ""),
              ("isActive", "TINYINT(1)", ""), ("createdAt", "DATETIME(3)", ""), ("updatedAt", "DATETIME(3)", "")],
             [[u[0], u[1], u[2], ARGON, u[3], 1 if u[4] else 0, TS_USER, TS_USER] for u in USERS],
             "passwordHash เก็บเฉพาะค่าที่ผ่านการเข้ารหัสด้วย argon2 แล้ว ระบบไม่เคยเก็บรหัสผ่านจริง "
             "และไม่มีทางถอดกลับได้  ·  isActive = 0 คือปิดบัญชี ใช้แทนการลบเสมอ")

r = db_table(ws, r, "Course", "รายวิชา — เป็นรากของข้อมูลทั้งหมด ไม่มีตารางใดอยู่เหนือกว่านี้", SH_INFO,
             [("id", "VARCHAR(30)", "PK"), ("code", "VARCHAR(50)", "UQ"), ("name", "VARCHAR(255)", ""),
              ("nameEn", "VARCHAR(255)", ""), ("semester", "INT", "UQ"), ("year", "INT", "UQ"),
              ("section", "VARCHAR(10)", "UQ"), ("credits", "DECIMAL(3,1)", ""),
              ("lectureHours", "DECIMAL(4,1)", ""), ("practiceHours", "DECIMAL(4,1)", ""),
              ("selfStudyHours", "DECIMAL(4,1)", ""), ("gradeScale", "ENUM('LETTER','PASS_FAIL')", ""),
              ("passCriteria", "DOUBLE", ""), ("classTarget", "DOUBLE", ""),
              ("createdAt", "DATETIME(3)", ""), ("updatedAt", "DATETIME(3)", "")],
             [[COURSE["id"], COURSE["code"], COURSE["name"], COURSE["nameEn"], COURSE["semester"],
               COURSE["year"], COURSE["section"], 3.0, 2.0, 2.0, 5.0, "LETTER",
               COURSE["passCriteria"], COURSE["classTarget"], "2025-05-20 10:15:00", "2025-06-02 14:05:00"]],
             "หน่วยกิต 3 (2-2-5) ถูกแยกเก็บเป็นสี่คอลัมน์ คือ credits / lectureHours / practiceHours / selfStudyHours "
             "เพื่อให้คำนวณและตรวจสอบได้  ·  code + semester + year + section รวมกันต้องไม่ซ้ำ "
             "จึงเปิดวิชาเดียวกันหลายกลุ่มเรียนในเทอมเดียวได้  ·  year เก็บเป็น พ.ศ. (2568) "
             "ส่วนคอลัมน์ DATETIME ทั้งหมดเป็นเวลาจริงแบบ ค.ศ.")

r = db_table(ws, r, "CourseInstructor", "ใครสอนวิชาไหน ในบทบาทใด (ตารางเชื่อม User กับ Course)", SH_INFO,
             [("id", "VARCHAR(30)", "PK"), ("courseId", "VARCHAR(30)", "FK"), ("userId", "VARCHAR(30)", "FK"),
              ("role", "ENUM('LEAD','CO','ASSISTANT')", ""), ("assignedAt", "DATETIME(3)", "")],
             [[ci[0], ci[1], ci[2], ci[3], "2025-06-01 09:00:00"] for ci in COURSE_INSTRUCTORS],
             "กฎ 'หนึ่งรายวิชามี LEAD ได้ไม่เกินหนึ่งคน' ไม่ได้เก็บเป็นคอลัมน์ — PostgreSQL บังคับด้วย "
             "partial unique index บน courseId เฉพาะแถวที่ role = LEAD  ·  ส่วน 'ต้องมีอย่างน้อยหนึ่งคน' "
             "บังคับที่ชั้นแอปพลิเคชัน เพราะแถวรายวิชาต้องมีอยู่ก่อนจึงจะมอบหมายใครได้")

r = db_table(ws, r, "CLO", "ผลลัพธ์การเรียนรู้ของรายวิชา พร้อมเกณฑ์ผ่านรายบุคคล", SH_CLO,
             [("id", "VARCHAR(30)", "PK"), ("courseId", "VARCHAR(30)", "FK"), ("number", "INT", "UQ"),
              ("description", "VARCHAR(1000)", ""), ("threshold", "DOUBLE", ""),
              ("bloomLevel", "ENUM(6 ระดับ)", "NULL"), ("classTarget", "DOUBLE", "NULL")],
             [[c[0], COURSE["id"], c[1], c[2], c[3], c[4], c[5] if c[5] is not None else "— ว่าง —"]
              for c in CLOS],
             "courseId + number ห้ามซ้ำ — ถ้ามี CLO 1 สองแถวในวิชาเดียวกัน รายงานการบรรลุจะผิดทั้งฉบับโดยไม่มีสัญญาณเตือน",
             "bloomLevel ไม่มีค่าเริ่มต้นโดยตั้งใจ — การเดาให้เป็น 'จำ' ทุกแถวจะทำให้คอลัมน์นี้หมดประโยชน์ "
             "ทันที เพราะมีไว้ตรวจว่าวิธีวัดตรงกับระดับพฤติกรรมที่เขียนไว้หรือไม่  ·  classTarget ที่เว้นว่าง "
             "หมายถึงใช้ค่าของรายวิชา ไม่ใช่ศูนย์")

r = db_table(ws, r, "BehavioralObjective", "จุดประสงค์เชิงพฤติกรรมที่ย่อยลงมาจาก CLO", SH_CLO,
             [("id", "VARCHAR(30)", "PK"), ("cloId", "VARCHAR(30)", "FK"), ("number", "INT", "UQ"),
              ("description", "VARCHAR(1000)", "")],
             [[o[0], CLOS[o[1]][0], o[2], o[3]] for o in OBJECTIVES])

r = db_table(ws, r, "Activity", "กิจกรรมการประเมิน คะแนนเต็ม และสัดส่วนต่อรายวิชา", SH_PLAN,
             [("id", "VARCHAR(30)", "PK"), ("courseId", "VARCHAR(30)", "FK"), ("name", "VARCHAR(255)", ""),
              ("method", "VARCHAR(255)", ""), ("maxScore", "DOUBLE", ""), ("order", "INT", ""),
              ("weight", "DOUBLE", "")],
             [[a[0], COURSE["id"], a[1], a[2], a[3], i + 1, a[4]] for i, a in enumerate(ACTIVITIES)],
             "order คือลำดับการแสดงผลบนหน้าจอ ไม่ใช่ลำดับเวลา  ·  maxScore ต้องมากกว่า 0 เสมอ "
             "เพราะทุกสูตรคำนวณต้องหารด้วยค่านี้  ·  ผลรวมของ weight ทุกแถวในวิชาเดียวกันต้องเท่ากับ 100",
             gap_note="ยังไม่มีคอลัมน์ 'สัปดาห์ที่ประเมิน' ซึ่ง มคอ.3 หมวดที่ 5 กำหนดให้ต้องระบุ — "
                      "ต้องเพิ่มคอลัมน์นี้ก่อน ระบบจึงจะออกแบบฟอร์ม มคอ.3 ได้ครบทุกช่อง")

r = db_table(ws, r, "AssessmentCriteria", "กิจกรรมใดวัด CLO ข้อใด ด้วยน้ำหนักเท่าใด (หัวใจของการคำนวณ)", SH_MAP,
             [("id", "VARCHAR(30)", "PK"), ("activityId", "VARCHAR(30)", "FK"), ("cloId", "VARCHAR(30)", "FK"),
              ("weight", "DOUBLE", "")],
             [[c[0], c[1], c[2], c[3]] for c in CRITERIA],
             f"เมทริกซ์ในแผ่นที่ 4 มี {N_ACT}×{N_CLO} = {N_ACT * N_CLO} ช่อง แต่เก็บจริงเพียง {len(CRITERIA)} แถว "
             "เพราะช่องที่เป็น 0 หมายถึงไม่มีความสัมพันธ์ จึงไม่ต้องมีแถว  ·  "
             "มีกลไกตรวจที่ฐานข้อมูลว่ากิจกรรมและ CLO ต้องอยู่ในรายวิชาเดียวกัน")

r = db_table(ws, r, "ObjectiveAssessment", "เกณฑ์การประเมินนี้เป็นหลักฐานของจุดประสงค์เชิงพฤติกรรมข้อใด", SH_MAP,
             [("id", "VARCHAR(30)", "PK"), ("criteriaId", "VARCHAR(30)", "FK"), ("objectiveId", "VARCHAR(30)", "FK")],
             [list(o) for o in OBJ_ASSESS],
             "ใช้เพื่อตามรอยเท่านั้น ไม่มีผลต่อคะแนนหรือการคำนวณใด ๆ")

r = db_table(ws, r, "Student", "การลงทะเบียนเรียนของนักศึกษาในรายวิชา", SH_STU,
             [("id", "VARCHAR(30)", "PK"), ("studentCode", "VARCHAR(50)", "UQ"), ("name", "VARCHAR(255)", ""),
              ("courseId", "VARCHAR(30)", "FK")],
             [[s[0], s[1], s[2], COURSE["id"]] for s in STUDENTS],
             "หนึ่งแถวคือการลงทะเบียนหนึ่งครั้ง ไม่ใช่ตัวบุคคล — นักศึกษาคนเดียวที่ลงเรียนสามรายวิชาจะมีสามแถว "
             "และชื่อจะซ้ำกัน ซึ่งเป็นการออกแบบที่ตั้งใจ  ·  studentCode ห้ามซ้ำภายในรายวิชาเดียวกัน แต่ซ้ำข้ามรายวิชาได้")

missing = [(STUDENTS[si][1], ACTIVITIES[ai][1]) for si, s in enumerate(STUDENTS)
           for ai, v in enumerate(s[3]) if v is None]
r = db_table(ws, r, "Score", "คะแนนดิบรายคน รายกิจกรรม", SH_SCORE,
             [("id", "VARCHAR(30)", "PK"), ("studentId", "VARCHAR(30)", "FK"), ("activityId", "VARCHAR(30)", "FK"),
              ("score", "DOUBLE", ""), ("uploadedAt", "DATETIME(3)", "")],
             [[sc[0], sc[1], sc[2], sc[3], UPLOAD_TS[sc[4]]] for sc in SCORE_ROWS],
             f"ตารางนี้เก็บเฉพาะคะแนนที่ประเมินแล้ว {len(SCORE_ROWS)} แถว จากช่องทั้งหมด {N_STU * N_ACT} ช่อง "
             f"— อีก {len(missing)} ช่องไม่มีแถวอยู่เลย เพราะ 'ยังไม่ประเมิน' แสดงด้วยการไม่มีแถว ไม่ใช่การเก็บค่า 0 "
             "นี่คือจุดที่ทำให้ระบบแยกแยะได้ว่านักศึกษาได้ 0 จริง กับยังไม่ถูกประเมิน")

r = db_table(ws, r, "ScoreUploadLog", "ประวัติการนำเข้าไฟล์คะแนน", "เกิดอัตโนมัติเมื่ออัปโหลดไฟล์",
             [("id", "VARCHAR(30)", "PK"), ("courseId", "VARCHAR(30)", "FK"), ("uploadedBy", "VARCHAR(30)", "FK"),
              ("fileName", "VARCHAR(255)", ""), ("recordsOk", "INT", ""), ("recordsFail", "INT", ""),
              ("createdAt", "DATETIME(3)", "")],
             [list(l) for l in UPLOAD_LOGS],
             "บันทึกทุกครั้งที่อัปโหลด แม้ไฟล์จะผิดทั้งไฟล์ ใช้ตรวจสอบย้อนหลังว่าใครนำเข้าคะแนนชุดใดเมื่อใด  ·  "
             "ตารางนี้ไม่ได้ผูกกับตาราง Score โดยตรง เป็นเพียงบันทึกเหตุการณ์")

r += 1
c = ws.cell(row=r, column=2, value="กลุ่มตารางการตัดเกรด — เพิ่มใน v4")
c.font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
c.fill = FILL_CALC
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=17)
ws.row_dimensions[r].height = 22
r += 2

r = db_table(ws, r, "GradeBand", "ช่วงเกรดของรายวิชา เช่น A ต้องได้ตั้งแต่ 80 ขึ้นไป", SH_GRADE,
             [("id", "VARCHAR(30)", "PK"), ("courseId", "VARCHAR(30)", "FK"),
              ("grade", "VARCHAR(5)", "UQ"), ("minValue", "DOUBLE", "UQ")],
             [[b[0], b[1], b[2], b[3]] for b in GRADE_BANDS],
             "แยกเป็นตารางแทนที่จะเก็บรวมเป็นข้อความก้อนเดียว เพราะฐานข้อมูลต้องบังคับได้ว่าเกรดห้ามซ้ำ "
             "และสองเกรดห้ามใช้เส้นแบ่งเดียวกัน  ·  ไม่มีคอลัมน์ลำดับและไม่มีคอลัมน์บอกหน่วย "
             "เพราะลำดับอ่านจาก minValue ได้ และหน่วยตามมาจาก Course.gradeMethod ว่าอิงเกณฑ์หรืออิงกลุ่ม")

r = db_table(ws, r, "StudentGrade", "เกรดสุดท้ายของนักศึกษาแต่ละคน", SH_GRADE,
             [("id", "VARCHAR(30)", "PK"), ("studentId", "VARCHAR(30)", "UQ"),
              ("totalPercent", "DOUBLE", ""), ("grade", "VARCHAR(5)", ""),
              ("overrideReason", "VARCHAR(1000)", "NULL")],
             STUDENT_GRADE_ROWS,
             "เก็บ 9 คอลัมน์รวมทั้งสองตาราง จากเดิม 35 — ระบบนี้มีไว้รายงานการบรรลุ CLO "
             "การตัดเกรดเป็นผลพลอยได้ จึงเก็บเท่าที่ตอบได้ว่าได้เกรดอะไรบนเกณฑ์แบบไหน  ·  "
             "เกรดกับคะแนนรวมถูกบันทึกเป็นค่าจริง แก้คะแนนดิบทีหลังจึงไม่ทำให้เกรดที่ให้ไปแล้วขยับ  ·  "
             "แลกกับการที่เกรดอิงกลุ่มย้อนพิสูจน์ที่มาไม่ได้ เพราะไม่ได้เก็บ n / mean / sd ไว้")

c = ws.cell(row=r, column=2, value="รวมทั้งหมด 13 ตาราง 80 คอลัมน์")
c.font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
c.fill = FILL_CALC
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=17)
ws.row_dimensions[r].height = 22
r += 1
note(ws, r, 2, "ตาราง 11 ตารางแรกไม่มีตารางใดเก็บผลการคำนวณเลย — ผลการบรรลุ CLO ในแผ่นที่ 7 และรายงานในแผ่นที่ 9 "
                "คำนวณใหม่ทุกครั้งที่เปิดดู จากคะแนนดิบและน้ำหนัก จึงไม่มีทางที่ตัวเลขในรายงานจะขัดแย้งกับคะแนน "
                "ที่อาจารย์กรอกไว้ และการแก้คะแนนย้อนหลังจะสะท้อนในรายงานทันที", span=15)
r += 1
note(ws, r, 2, "StudentGrade คือข้อยกเว้นเดียว และเป็นข้อยกเว้นโดยตั้งใจ  ·  เกรดถูกเก็บเป็นค่าจริง "
                "ไม่ได้คำนวณสดตอนเปิดดู เพราะเกรดที่ประกาศไปเดือนตุลาคมต้องอ่านได้เหมือนเดิมในเดือนมีนาคม "
                "แม้จะมีคนถอนรายวิชาหรือมีการแก้คะแนนย้อนหลังก็ตาม — เป็น 'ข้อเท็จจริงทางประวัติศาสตร์' "
                "ไม่ใช่ค่าที่คำนวณใหม่แล้วได้เท่าเดิม  ·  ส่วนค่าเฉลี่ยและส่วนเบี่ยงเบนที่ใช้ตอนตัดอิงกลุ่ม "
                "ไม่ได้เก็บไว้ จึงย้อนพิสูจน์ที่มาของเกรดอิงกลุ่มจากฐานข้อมูลอย่างเดียวไม่ได้", span=15, kind="gap")

# ===========================================================================
# 11 แผนที่ UI-DB
# ===========================================================================
ws = wb.create_sheet(SH_FIELDMAP)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 3, "B": 24, "C": 34, "D": 24, "E": 26, "F": 50})
title(ws, "11 · ช่องกรอกแต่ละช่องเก็บที่ไหน", None, accent=C_PRIMARY)
ws["A2"] = "ใช้ตอบคำถามว่าข้อมูลที่กรอกไปอยู่ที่ใด และค่าใดที่ระบบคำนวณให้โดยไม่เก็บซ้ำ"
ws["A2"].font = F_SUB

header_row(ws, 4, ["แผ่นงาน", "ช่องกรอก / สิ่งที่เห็น", "ตาราง", "คอลัมน์", "หมายเหตุ"], start_col=2)
rows_map = [
    (SH_INFO, "รหัสวิชา / ภาค / ปี / กลุ่มเรียน", "Course", "code, semester, year, section", "สี่ค่านี้รวมกันต้องไม่ซ้ำ"),
    (SH_INFO, "เกณฑ์ผ่านรายวิชา", "Course", "passCriteria", "ใช้ตัดสินผ่าน/ไม่ผ่านรายบุคคล"),
    (SH_INFO, "เป้าหมายระดับชั้น", "Course", "classTarget", "ใช้ตัดสินว่า CLO บรรลุหรือไม่"),
    (SH_INFO, "อาจารย์ผู้รับผิดชอบ / ผู้สอนร่วม", "CourseInstructor", "userId, role", "LEAD ได้ไม่เกิน 1 คนต่อรายวิชา"),
    (SH_CLO, "ผลลัพธ์การเรียนรู้ที่คาดหวัง", "CLO", "description", ""),
    (SH_CLO, "เกณฑ์ผ่านของ CLO", "CLO", "threshold", "เกณฑ์รายบุคคล ไม่ใช่ระดับชั้น"),
    (SH_CLO, "จุดประสงค์เชิงพฤติกรรม", "BehavioralObjective", "cloId, number, description", "ใช้ตามรอย ไม่กระทบคะแนน"),
    (SH_CLO, "ระดับ Bloom", "CLO", "bloomLevel", "ผู้สอนเลือกเอง ไม่มีค่าเริ่มต้น"),
    (SH_CLO, "เป้าหมายผู้ผ่านราย CLO", "CLO", "classTarget", "เว้นว่าง = ใช้ค่าของรายวิชา"),
    (SH_PLAN, "งาน/กิจกรรม และวิธีการประเมิน", "Activity", "name, method", ""),
    (SH_PLAN, "คะแนนเต็ม", "Activity", "maxScore", "ต้องมากกว่า 0"),
    (SH_PLAN, "สัดส่วนการประเมิน (%)", "Activity", "weight", "รวมทุกกิจกรรมต้องได้ 100"),
    (SH_PLAN, "สัปดาห์ที่ประเมิน", "— ยังไม่มีที่เก็บ —", "ต้องเพิ่มคอลัมน์", "มคอ.3 ต้องระบุ แต่ฐานข้อมูลยังไม่รองรับ"),
    (SH_MAP, "ตัวเลขน้ำหนักในเมทริกซ์", "AssessmentCriteria", "activityId, cloId, weight", "ช่องที่เป็น 0 ไม่สร้างแถว"),
    (SH_MAP, "น้ำหนักของ CLO", "— ไม่เก็บ —", "คำนวณจากเมทริกซ์", "ป้องกันตัวเลขสองที่ไม่ตรงกัน"),
    (SH_STU, "รหัสนักศึกษา / ชื่อ", "Student", "studentCode, name, courseId", "ห้ามซ้ำภายในรายวิชาเดียวกัน"),
    (SH_SCORE, "ตัวเลขคะแนน", "Score", "studentId, activityId, score", "เว้นว่างไม่สร้างแถว · 0 สร้างแถว"),
    (SH_SCORE, "การอัปโหลดไฟล์", "ScoreUploadLog", "fileName, recordsOk, recordsFail", "บันทึกทุกครั้งแม้ไฟล์ผิดทั้งไฟล์"),
    (SH_RESULT, "คะแนน CLO รายบุคคล", "— ไม่เก็บ —", "คำนวณสด", "อ่านจากคะแนนดิบและน้ำหนัก"),
    (SH_RESULT, "สถานะการติดตาม", "— ไม่เก็บ —", "คำนวณสด", "ยังไม่บรรลุ CLO อย่างน้อย 1 ข้อ"),
    (SH_TQF5, "ตารางรายงาน มคอ.5", "— ไม่เก็บ —", "คำนวณสด", "ส่งออกเป็นไฟล์ได้ตามข้อกำหนดของระบบ"),
]
r = 5
for i, (screen, field, table, col, remark) in enumerate(rows_map):
    z = i % 2 == 1
    is_calc = table.startswith("—")
    fill = FILL_CALCROW if is_calc else (FILL_ROW if z else FILL_WHITE)
    if "ยังไม่มีที่เก็บ" in table:
        fill = FILL_GAP
    data_cell(ws, r, 2, screen, fill=fill, font=F_MUTED)
    data_cell(ws, r, 3, field, fill=fill)
    c = data_cell(ws, r, 4, table, fill=fill)
    c.font = Font(size=10, bold=True, color=TX_GAP if "ยังไม่มีที่เก็บ" in table else (C_CALC if is_calc else C_DB))
    data_cell(ws, r, 5, col, fill=fill, font=F_MONO)
    data_cell(ws, r, 6, remark, fill=fill, font=F_MUTED)
    r += 1

r += 1
note(ws, r, 2, "แถวสีเขียวคือค่าที่ระบบคำนวณให้ ไม่มีการเก็บซ้ำในฐานข้อมูล  ·  "
                "แถวสีชมพูคือข้อมูลที่ มคอ. ต้องการแต่ฐานข้อมูลยังไม่รองรับ ซึ่งต้องตัดสินใจก่อนพัฒนาส่วนออกรายงาน", span=4)

# Optional output path: `python scripts/build-tqf-presentation-workbook.py <out.xlsx>`
# Excel keeps an exclusive lock on the workbook while it is open, so writing to
# a scratch path is the way to rebuild without closing it first.
OUT = sys.argv[1] if len(sys.argv) > 1 else "docs/excel/CMAS-TQF-Data-Entry.xlsx"
wb.save(OUT)
print(f"Saved {OUT}")
print(f"  Course: {COURSE['code']} {COURSE['name']} {COURSE['credits']}")
print(f"  Sheets: {len(wb.sheetnames)} -> {wb.sheetnames}")
print(f"  AssessmentCriteria {len(CRITERIA)} rows / Score {len(SCORE_ROWS)} rows")
