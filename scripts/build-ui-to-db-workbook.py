"""
Build docs/excel/CMAS-UI-to-Database.xlsx — a teaching workbook that shows the
SAME mock course from two angles:

  * UI-1..UI-7 : the screens an instructor actually fills in the running system
                 (course setup -> CLOs -> activities -> CLO mapping -> roster ->
                 score entry -> computed CLO results)
  * DB sheet   : the exact rows those screens produce in all 11 Prisma tables
  * Mapping    : field-by-field "this input box lands in that table.column"

The CLO results sheet uses LIVE Excel formulas implementing CR-02..CR-05 from
docs/markdown/dev/srs.md, so the team can change a score in UI-6 and watch
attainment move. Nothing on UI-7 is stored in the database — that is the point
the sheet is meant to make.

Run: python scripts/build-ui-to-db-workbook.py
Output: docs/excel/CMAS-UI-to-Database.xlsx
"""

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ---------------------------------------------------------------------------
# Palette — same family as the rest of docs/ (Verdure cool violet)
# ---------------------------------------------------------------------------
C_PRIMARY = "19151B"
C_UI = "1A56C4"          # blue  = screens the instructor touches
C_DB = "44405A"          # violet = database tables
C_CALC = "137333"        # green  = derived, never stored
C_ON = "1A1C1D"
C_MUTED = "4A454A"
C_OUTLINE = "CCC4CA"
C_SOFT = "E2E2E4"

BG_UI = "EAF1FE"
BG_DB = "EDEBF2"
BG_CALC = "E6F4EA"
BG_ROW = "F3F3F5"
BG_WARN = "FEF7E0"
BG_DANGER = "FCE8E6"
TX_WARN = "B06000"
TX_DANGER = "C5221F"

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
FILL_INPUT = PatternFill("solid", fgColor=BG_UI)
FILL_DBROW = PatternFill("solid", fgColor=BG_DB)
FILL_CALCROW = PatternFill("solid", fgColor=BG_CALC)
FILL_ROW = PatternFill("solid", fgColor=BG_ROW)
FILL_WHITE = PatternFill("solid", fgColor="FFFFFF")
FILL_WARN = PatternFill("solid", fgColor=BG_WARN)

# ---------------------------------------------------------------------------
# Sheet names (referenced inside formulas — keep short and stable)
# ---------------------------------------------------------------------------
SH_README = "README"
SH_COURSE = "UI-1 รายวิชา"
SH_CLO = "UI-2 CLO"
SH_ACT = "UI-3 กิจกรรม"
SH_MAP = "UI-4 Mapping"
SH_STU = "UI-5 รายชื่อ"
SH_SCORE = "UI-6 กรอกคะแนน"
SH_RESULT = "UI-7 ผลลัพธ์ CLO"
SH_DB = "DB ทุกตาราง"
SH_FIELDMAP = "UI to DB Mapping"

# ===========================================================================
# MOCK DATA — one course, internally consistent across every sheet
# ===========================================================================
COURSE = {
    "id": "crs-01", "code": "90641002", "name": "ระบบฐานข้อมูล", "nameEn": "Database Systems",
    "semester": 1, "year": 2568, "section": "01",
    "credits": "3 (2-2-5)", "gradeScale": "LETTER",
    "passCriteria": 60, "classTarget": 70,
}

USERS = [
    ("usr-01", "admin@ftech.ac.th", "อ.ดร.สมชาย ใจดี", "ADMIN", True),
    ("usr-02", "wichai.k@ftech.ac.th", "ผศ.วิชัย คงเจริญ", "INSTRUCTOR", True),
    ("usr-03", "suda.p@ftech.ac.th", "อ.สุดา พรหมมา", "INSTRUCTOR", True),
]
COURSE_INSTRUCTORS = [
    ("ci-01", "crs-01", "usr-02", "LEAD", "2568-06-01"),
    ("ci-02", "crs-01", "usr-03", "CO", "2568-06-01"),
]

# (cloId, number, description, threshold)
CLOS = [
    ("clo-01", 1, "ออกแบบฐานข้อมูลเชิงสัมพันธ์จากโจทย์ที่กำหนดได้", 60),
    ("clo-02", 2, "เขียนคำสั่ง SQL เพื่อสืบค้นและจัดการข้อมูลได้", 60),
    ("clo-03", 3, "ทำ Normalization ถึงระดับ 3NF ได้ถูกต้อง", 65),
    ("clo-04", 4, "ทำงานเป็นทีมและนำเสนอผลงานได้", 60),
]

# (objId, cloIdx, number, description)
OBJECTIVES = [
    ("obj-01", 0, 1, "เขียน ER-Diagram จากความต้องการของผู้ใช้ได้"),
    ("obj-02", 0, 2, "แปลง ER-Diagram เป็นตารางเชิงสัมพันธ์ได้"),
    ("obj-03", 1, 1, "เขียนคำสั่ง SELECT พร้อม JOIN หลายตารางได้"),
    ("obj-04", 1, 2, "ใช้ subquery และฟังก์ชันรวม (aggregate) ได้"),
    ("obj-05", 2, 1, "ระบุ functional dependency ของตารางได้"),
    ("obj-06", 2, 2, "แปลงตารางให้อยู่ในรูป 3NF ได้"),
    ("obj-07", 3, 1, "นำเสนอผลงานกลุ่มต่อชั้นเรียนได้"),
]

# (actId, name, method, maxScore, weight)  — weight must total 100 (CR-01)
ACTIVITIES = [
    ("act-01", "Quiz 1 — ER Diagram", "สอบย่อย", 20, 10),
    ("act-02", "สอบกลางภาค", "สอบข้อเขียน", 100, 30),
    ("act-03", "ปฏิบัติการ SQL (Lab)", "ประเมินชิ้นงาน", 50, 20),
    ("act-04", "โปรเจกต์กลุ่ม", "ประเมินชิ้นงาน + นำเสนอ", 100, 25),
    ("act-05", "สอบปลายภาค", "สอบข้อเขียน", 100, 15),
]

# mapping[activity_idx][clo_idx] = AssessmentCriteria.weight (%) — each ROW
# must total 100 (CR-01). 0 means "this activity does not measure this CLO"
# and therefore NO AssessmentCriteria row exists in the database.
MAPPING = [
    [100, 0, 0, 0],     # Quiz 1        -> CLO1
    [40, 60, 0, 0],     # สอบกลางภาค     -> CLO1 + CLO2
    [0, 70, 30, 0],     # Lab           -> CLO2 + CLO3
    [20, 0, 40, 40],    # โปรเจกต์กลุ่ม   -> CLO1 + CLO3 + CLO4
    [0, 50, 50, 0],     # สอบปลายภาค     -> CLO2 + CLO3
]

# (studentId, studentCode, name, [score per activity; None = ยังไม่ประเมิน])
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

UPLOAD_LOGS = [
    ("log-01", "crs-01", "usr-02", "midterm_90641002.xlsx", 8, 0, "2568-08-01 14:20"),
    ("log-02", "crs-01", "usr-02", "lab_sql_90641002.xlsx", 7, 1, "2568-08-15 09:05"),
]

N_ACT = len(ACTIVITIES)
N_CLO = len(CLOS)
N_STU = len(STUDENTS)

# Derived: AssessmentCriteria rows exist only where weight > 0
CRITERIA = []
_n = 1
for ai, row in enumerate(MAPPING):
    for ci, w in enumerate(row):
        if w > 0:
            CRITERIA.append((f"ac-{_n:02d}", ACTIVITIES[ai][0], CLOS[ci][0], w, ai, ci))
            _n += 1

# ObjectiveAssessment: criteria x objective, both must belong to the SAME CLO
# (DC-06 trigger). Pick one objective per criteria where available.
OBJ_ASSESS = []
_used = set()
_n = 1
for cid, act_id, clo_id, w, ai, ci in CRITERIA:
    for oid, o_ci, onum, odesc in OBJECTIVES:
        if o_ci == ci and (oid not in _used):
            OBJ_ASSESS.append((f"oa-{_n:02d}", cid, oid))
            _used.add(oid)
            _n += 1
            break

# Score rows: a row exists ONLY when a score was actually given (FR-62)
SCORE_ROWS = []
_n = 1
for si, (sid, code, name, scores) in enumerate(STUDENTS):
    for ai, sc in enumerate(scores):
        if sc is not None:
            SCORE_ROWS.append((f"sc-{_n:02d}", sid, ACTIVITIES[ai][0], sc, ai, si))
            _n += 1

wb = Workbook()

# ---------------------------------------------------------------------------
# small helpers
# ---------------------------------------------------------------------------

def set_widths(ws, widths: dict):
    for col, w in widths.items():
        ws.column_dimensions[col].width = w


def title(ws, text, sub=None, accent=C_UI):
    ws["A1"] = text
    ws["A1"].font = Font(name="Calibri", size=16, bold=True, color=accent)
    if sub:
        ws["A2"] = sub
        ws["A2"].font = F_SUB


def header_row(ws, row, headers, start_col=1, fill=FILL_UI, heights=22):
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
    c.alignment = align or Alignment(vertical="center")
    if numfmt:
        c.number_format = numfmt
    return c


def note(ws, row, col, text, span=6, warn=False):
    c = ws.cell(row=row, column=col, value=text)
    c.font = Font(size=9.5, italic=True, color=TX_WARN if warn else C_MUTED)
    if warn:
        c.fill = FILL_WARN
    ws.merge_cells(start_row=row, start_column=col, end_row=row, end_column=col + span)
    c.alignment = Alignment(vertical="center", wrap_text=True)
    return c


# ===========================================================================
# README
# ===========================================================================
ws = wb.active
ws.title = SH_README
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 3, "B": 26, "C": 34, "D": 62})

ws["B2"] = "CMAS — จากหน้าจอที่อาจารย์กรอก สู่ตารางในฐานข้อมูล"
ws["B2"].font = F_TITLE
ws["B3"] = "ไฟล์เดียว 2 มุมมองของข้อมูลชุดเดียวกัน (ข้อมูลจำลอง) — เพื่อให้ทีมเห็นว่ากรอกอะไรแล้วลงตารางไหน"
ws["B3"].font = F_SUB

r = 5
ws.cell(row=r, column=2, value="แผนผังการไหลของข้อมูล").font = F_H2
r += 1
header_row(ws, r, ["หน้าจอ (UI)", "อาจารย์กรอกอะไร", "ลงตารางใดในฐานข้อมูล"], start_col=2)
r += 1
flow = [
    (SH_COURSE, "ข้อมูลรายวิชา + เกณฑ์ผ่าน + เป้าหมายระดับชั้น", "Course  (1 แถว)"),
    (SH_CLO, "ผลลัพธ์การเรียนรู้ + จุดประสงค์เชิงพฤติกรรม", "CLO  ·  BehavioralObjective"),
    (SH_ACT, "กิจกรรมประเมิน + คะแนนเต็ม + น้ำหนักต่อวิชา", "Activity"),
    (SH_MAP, "เมทริกซ์น้ำหนัก กิจกรรม × CLO  ← หัวใจของระบบ", "AssessmentCriteria  ·  ObjectiveAssessment"),
    (SH_STU, "รายชื่อนักศึกษาในวิชา", "Student  (= การลงทะเบียน ไม่ใช่ตัวคน)"),
    (SH_SCORE, "คะแนนรายคน รายกิจกรรม", "Score  (มีแถวเฉพาะช่องที่กรอกแล้ว)"),
    (SH_RESULT, "ไม่ได้กรอก — ระบบคำนวณให้", "ไม่มีตารางเก็บ! คำนวณสดทุกครั้งที่เปิดดู"),
]
for i, (screen, what, table) in enumerate(flow):
    is_calc = i == len(flow) - 1
    fill = FILL_CALCROW if is_calc else (FILL_ROW if i % 2 else FILL_WHITE)
    data_cell(ws, r, 2, screen, fill=fill, font=F_LABEL)
    data_cell(ws, r, 3, what, fill=fill).alignment = Alignment(wrap_text=True, vertical="center")
    c = data_cell(ws, r, 4, table, fill=fill)
    c.font = Font(size=10, bold=True, color=C_CALC if is_calc else C_DB)
    ws.row_dimensions[r].height = 28
    r += 1

r += 1
ws.cell(row=r, column=2, value="สิ่งที่ไฟล์นี้ตั้งใจให้เห็น").font = F_H2
r += 1
points = [
    ("น้ำหนักมี 2 ชั้น อย่าสับสน",
     "Activity.weight = กิจกรรมนี้คิดเป็นกี่ % ของคะแนนวิชา (รวมทุกกิจกรรม = 100)  ส่วน "
     "AssessmentCriteria.weight = กิจกรรมนี้เอาไปวัด CLO ตัวไหนกี่ % (รวมต่อ 1 กิจกรรม = 100)  "
     "ส่วน CLO ไม่มีน้ำหนักของตัวเอง เป็นค่าที่คำนวณออกมา (CR-02)"),
    ("ช่องว่าง ≠ ศูนย์",
     "ช่องคะแนนที่เว้นว่าง = ยังไม่ประเมิน จะไม่มีแถวในตาราง Score เลย  ส่วน 0 = สอบแล้วได้ 0 จริง "
     "มีแถวและถูกนำไปคำนวณ  ดูนักศึกษา 65010007 (ได้ 0 จริง) เทียบกับ 65010008 (ยังไม่ประเมินเลย)"),
    ("ผลลัพธ์ไม่ถูกเก็บลงฐานข้อมูล",
     "คะแนน CLO / attainment / at-risk คำนวณสดจากตาราง Score + AssessmentCriteria ทุกครั้ง "
     "จึงไม่มีวันขัดแย้งกับคะแนนดิบ และการแก้คะแนนย้อนหลังจะสะท้อนผลทันที"),
    ("สูตรในไฟล์นี้ทำงานจริง",
     "ลองแก้คะแนนใน " + SH_SCORE + " แล้วดู " + SH_RESULT + " เปลี่ยนตาม — เป็นสูตร Excel จริง "
     "ที่เขียนตาม CR-02 ถึง CR-05 ใน SRS ไม่ใช่ตัวเลขที่พิมพ์ทิ้งไว้"),
    ("กิจกรรมที่ไม่ได้วัด CLO นั้น = ไม่มีแถว",
     "ช่อง 0 ในเมทริกซ์ " + SH_MAP + " แปลว่าไม่มีความสัมพันธ์ ระบบจะไม่สร้างแถวใน AssessmentCriteria "
     "(ดูได้ว่าเมทริกซ์ 5×4 = 20 ช่อง แต่มีแถวจริงแค่ " + str(len(CRITERIA)) + " แถว)"),
]
for head, body in points:
    c = ws.cell(row=r, column=2, value=head)
    c.font = F_LABEL
    c.alignment = Alignment(vertical="top", wrap_text=True)
    c2 = ws.cell(row=r, column=3, value=body)
    c2.font = F_BODY
    c2.alignment = Alignment(vertical="top", wrap_text=True)
    ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=4)
    ws.row_dimensions[r].height = 46
    r += 1

r += 1
note(ws, r, 2, "ข้อมูลทั้งหมดในไฟล์นี้เป็นข้อมูลจำลองเพื่อการอธิบาย ไม่ใช่ข้อมูลจริงของนักศึกษา · "
                "โครงสร้างอ้างอิง database/schema.prisma (single-tenant, 11 ตาราง) และกฎการคำนวณ CR-01…CR-07 ใน SRS", span=2)

# ===========================================================================
# UI-1 รายวิชา
# ===========================================================================
ws = wb.create_sheet(SH_COURSE)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 3, "B": 30, "C": 30, "D": 46})
title(ws, "UI-1 · ตั้งค่ารายวิชา", "หน้าจอแรกที่อาจารย์กรอกเมื่อเปิดวิชาใหม่ → บันทึกเป็น 1 แถวในตาราง Course")

header_row(ws, 4, ["ช่องกรอกบนหน้าจอ", "ค่าที่กรอก (ตัวอย่าง)", "→ ลงคอลัมน์ใดของตาราง Course"], start_col=2)
COURSE_FIRST_ROW = 5
course_fields = [
    ("รหัสวิชา", COURSE["code"], "code"),
    ("ชื่อวิชา (ไทย)", COURSE["name"], "name"),
    ("ชื่อวิชา (อังกฤษ)", COURSE["nameEn"], "nameEn"),
    ("ภาคการศึกษา", COURSE["semester"], "semester"),
    ("ปีการศึกษา (พ.ศ.)", COURSE["year"], "year"),
    ("กลุ่มเรียน (Section)", COURSE["section"], "section"),
    ("หน่วยกิต (บรรยาย-ปฏิบัติ-ศึกษาเอง)", COURSE["credits"], "credits, lectureHours, practiceHours, selfStudyHours"),
    ("รูปแบบการตัดเกรด", COURSE["gradeScale"], "gradeScale"),
    ("เกณฑ์ผ่านรายวิชา (%)", COURSE["passCriteria"], "passCriteria  ← CR-05 ใช้ค่านี้"),
    ("เป้าหมายระดับชั้น / Class Target (%)", COURSE["classTarget"], "classTarget  ← CR-04 ใช้ค่านี้"),
]
r = COURSE_FIRST_ROW
for i, (label, value, col) in enumerate(course_fields):
    zebra = i % 2 == 1
    data_cell(ws, r, 2, label, zebra=zebra, font=F_LABEL)
    data_cell(ws, r, 3, value, zebra=zebra, fill=FILL_INPUT,
              align=Alignment(horizontal="center", vertical="center"))
    data_cell(ws, r, 4, col, zebra=zebra, font=F_MONO)
    r += 1

# Derive the two cells UI-7 depends on, rather than hardcoding row numbers —
# inserting a field above them would otherwise silently repoint every formula
# on the results sheet at the wrong value.
_labels = [f[0] for f in course_fields]
PASS_CRIT_CELL = f"$C${COURSE_FIRST_ROW + next(i for i, l in enumerate(_labels) if 'เกณฑ์ผ่านรายวิชา' in l)}"
CLASS_TARGET_CELL = f"$C${COURSE_FIRST_ROW + next(i for i, l in enumerate(_labels) if 'Class Target' in l)}"

r += 1
note(ws, r, 2, "passCriteria และ classTarget เก็บ 'ราย Course' ไม่ใช่ค่ากลางของระบบ — เพื่อไม่ให้การแก้ค่ากลาง "
                "วันนี้ ย้อนไปเปลี่ยนผลว่า 'CLO บรรลุ/ไม่บรรลุ' ของเทอมที่แล้วโดยไม่มีใครรู้ (OI-03)", span=2)

# ===========================================================================
# UI-2 CLO
# ===========================================================================
ws = wb.create_sheet(SH_CLO)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 12, "C": 10, "D": 62, "E": 18, "F": 30})
title(ws, "UI-2 · กำหนด CLO และจุดประสงค์เชิงพฤติกรรม",
      "CLO ไม่มีช่อง 'น้ำหนัก' ให้กรอก — น้ำหนักของ CLO เป็นค่าที่คำนวณจากเมทริกซ์ใน UI-4 (CR-02)")

header_row(ws, 4, ["ลำดับ", "cloId (ระบบสร้าง)", "CLO ที่", "คำอธิบายผลลัพธ์การเรียนรู้", "เกณฑ์ผ่าน (%)", "→ ตาราง CLO"], start_col=1)
r = 5
for i, (cid, num, desc, th) in enumerate(CLOS):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, cid, zebra=z, font=F_MONO)
    data_cell(ws, r, 3, num, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 4, desc, zebra=z)
    data_cell(ws, r, 5, th, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center"))
    data_cell(ws, r, 6, "threshold" if i == 0 else "", zebra=z, font=F_MONO)
    r += 1
CLO_TH_FIRST_ROW = 5  # E5..E8

r += 1
note(ws, r, 1, "เกณฑ์ผ่าน (threshold) คือเกณฑ์ราย 'นักศึกษา 1 คน' ต่อ CLO 1 ข้อ — คนละตัวกับ Class Target "
                "ที่เป็นเกณฑ์ระดับชั้นเรียนใน UI-1", span=5)

r += 2
ws.cell(row=r, column=1, value="จุดประสงค์เชิงพฤติกรรม (ย่อยจาก CLO)").font = F_H2
r += 1
header_row(ws, r, ["ลำดับ", "objectiveId", "สังกัด CLO", "ข้อที่", "คำอธิบาย", "→ ตาราง BehavioralObjective"], start_col=1)
r += 1
for i, (oid, ci, num, desc) in enumerate(OBJECTIVES):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, oid, zebra=z, font=F_MONO)
    data_cell(ws, r, 3, f"CLO {CLOS[ci][1]}", zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 4, num, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 5, desc, zebra=z)
    data_cell(ws, r, 6, "cloId, number, description" if i == 0 else "", zebra=z, font=F_MONO)
    r += 1

r += 1
note(ws, r, 1, "จุดประสงค์เชิงพฤติกรรมใช้เพื่อการตามรอย (traceability) เท่านั้น "
                "ไม่มีผลต่อคะแนน CLO ที่คำนวณได้ (FR-35)", span=5)

# ===========================================================================
# UI-3 กิจกรรม
# ===========================================================================
ws = wb.create_sheet(SH_ACT)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 12, "C": 30, "D": 26, "E": 14, "F": 18, "G": 34})
title(ws, "UI-3 · กิจกรรมการประเมิน",
      "น้ำหนักในหน้านี้คือ 'กิจกรรมนี้คิดเป็นกี่ % ของคะแนนรวมวิชา' — รวมทุกกิจกรรมต้องได้ 100 พอดี (CR-01)")

header_row(ws, 4, ["ลำดับ", "activityId", "ชื่อกิจกรรม", "วิธีประเมิน", "คะแนนเต็ม", "น้ำหนักต่อวิชา (%)", "→ ตาราง Activity"], start_col=1)
ACT_FIRST_ROW = 5
r = ACT_FIRST_ROW
for i, (aid, name, method, mx, w) in enumerate(ACTIVITIES):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, aid, zebra=z, font=F_MONO)
    data_cell(ws, r, 3, name, zebra=z)
    data_cell(ws, r, 4, method, zebra=z)
    data_cell(ws, r, 5, mx, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center"))
    data_cell(ws, r, 6, w, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center"))
    data_cell(ws, r, 7, "maxScore, weight" if i == 0 else "", zebra=z, font=F_MONO)
    r += 1
ACT_LAST_ROW = r - 1

sum_row = r
data_cell(ws, sum_row, 3, "รวมน้ำหนักทุกกิจกรรม", font=F_LABEL, fill=FILL_WARN)
data_cell(ws, sum_row, 6, f"=SUM(F{ACT_FIRST_ROW}:F{ACT_LAST_ROW})", fill=FILL_WARN,
          font=Font(size=10, bold=True, color=C_ON), align=Alignment(horizontal="center"))
data_cell(ws, sum_row, 7, f'=IF(F{sum_row}=100,"ถูกต้อง — ครบ 100","ผิดกฎ CR-01 — ต้องได้ 100")',
          fill=FILL_WARN, font=Font(size=10, bold=True, color=TX_WARN))

r = sum_row + 2
note(ws, r, 1, "คะแนนเต็ม (maxScore) ต้องมากกว่า 0 เสมอ เพราะทุกสูตรคำนวณ CLO ต้องเอาคะแนนหารด้วยค่านี้ "
                "— ฐานข้อมูลบังคับด้วย CHECK constraint (DC-03)", span=6)

# ===========================================================================
# UI-4 Mapping  (the heart of the system)
# ===========================================================================
ws = wb.create_sheet(SH_MAP)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 30, "C": 15, "D": 15, "E": 15, "F": 15, "G": 14, "H": 30})
title(ws, "UI-4 · เมทริกซ์น้ำหนัก  กิจกรรม × CLO", None, accent=C_UI)
ws["A2"] = ("กรอกว่า 'กิจกรรมนี้ เอาไปวัด CLO ตัวไหน กี่ %' — แต่ละแถวต้องรวมได้ 100  ·  "
            "ช่อง 0 = ไม่ได้วัด CLO นั้น จะไม่มีแถวในตาราง AssessmentCriteria")
ws["A2"].font = F_SUB

MAP_HEAD_ROW = 4
header_row(ws, MAP_HEAD_ROW, ["ลำดับ", "กิจกรรม \\ CLO"] + [f"CLO {c[1]}" for c in CLOS] + ["รวมแถว", "สถานะ (ต้องรวม = 100)"], start_col=1)

MAP_FIRST_ROW = 5
r = MAP_FIRST_ROW
for ai, (aid, name, method, mx, w) in enumerate(ACTIVITIES):
    z = ai % 2 == 1
    data_cell(ws, r, 1, ai + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, name, zebra=z, font=F_LABEL)
    for ci in range(N_CLO):
        val = MAPPING[ai][ci]
        c = data_cell(ws, r, 3 + ci, val, zebra=z,
                      fill=FILL_INPUT if val > 0 else PatternFill("solid", fgColor="F5F5F7"),
                      align=Alignment(horizontal="center"))
        if val == 0:
            c.font = Font(size=10, color="A9A4B0")
    data_cell(ws, r, 3 + N_CLO, f"=SUM(C{r}:{get_column_letter(2 + N_CLO)}{r})",
              zebra=z, font=F_LABEL, align=Alignment(horizontal="center"))
    data_cell(ws, r, 4 + N_CLO,
              f'=IF({get_column_letter(3 + N_CLO)}{r}=100,"ครบ 100","ผิด — ได้ "&{get_column_letter(3 + N_CLO)}{r})',
              zebra=z, font=Font(size=10, bold=True, color=C_MUTED))
    r += 1
MAP_LAST_ROW = r - 1

r += 1
CR02_ROW = r
data_cell(ws, CR02_ROW, 2, "น้ำหนักของ CLO (CR-02) %", font=F_LABEL, fill=FILL_CALCROW)
for ci in range(N_CLO):
    col = get_column_letter(3 + ci)
    f = (f"=SUMPRODUCT('{SH_ACT}'!$F${ACT_FIRST_ROW}:$F${ACT_LAST_ROW},"
         f"{col}{MAP_FIRST_ROW}:{col}{MAP_LAST_ROW})/100")
    data_cell(ws, CR02_ROW, 3 + ci, f, fill=FILL_CALCROW,
              font=Font(size=10, bold=True, color=C_CALC),
              align=Alignment(horizontal="center"), numfmt="0.00")
data_cell(ws, CR02_ROW, 3 + N_CLO,
          f"=SUM(C{CR02_ROW}:{get_column_letter(2 + N_CLO)}{CR02_ROW})",
          fill=FILL_CALCROW, font=Font(size=10, bold=True, color=C_CALC),
          align=Alignment(horizontal="center"), numfmt="0.00")
data_cell(ws, CR02_ROW, 4 + N_CLO, "รวมต้องได้ 100 อัตโนมัติ", fill=FILL_CALCROW, font=F_MUTED)

r = CR02_ROW + 2
note(ws, r, 1, "แถวสีเขียวคือค่าที่ 'คำนวณได้' ไม่ใช่ค่าที่กรอก — CLO ไม่มีคอลัมน์ weight ในฐานข้อมูล "
                "ถ้าเก็บไว้ซ้ำจะมีวันที่ค่าสองที่ไม่ตรงกัน (OI-02)", span=6)
r += 2
ws.cell(row=r, column=1, value=f"เมทริกซ์ {N_ACT}×{N_CLO} = {N_ACT * N_CLO} ช่อง  แต่มีแถวจริงในตาราง AssessmentCriteria เพียง {len(CRITERIA)} แถว (เฉพาะช่องที่ > 0)").font = F_LABEL

# ===========================================================================
# UI-5 รายชื่อ
# ===========================================================================
ws = wb.create_sheet(SH_STU)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 12, "C": 18, "D": 34, "E": 40})
title(ws, "UI-5 · รายชื่อนักศึกษาในรายวิชา",
      "1 แถว = 1 การลงทะเบียน ไม่ใช่ 1 คน — คนเดียวกันลงเรียน 3 วิชา จะมี 3 แถว ชื่อซ้ำกันโดยตั้งใจ")

header_row(ws, 4, ["ลำดับ", "studentId", "รหัสนักศึกษา", "ชื่อ-นามสกุล", "→ ตาราง Student"], start_col=1)
STU_FIRST_ROW = 5
r = STU_FIRST_ROW
for i, (sid, code, name, _) in enumerate(STUDENTS):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, r, 2, sid, zebra=z, font=F_MONO)
    c = data_cell(ws, r, 3, code, zebra=z, fill=FILL_INPUT, align=Alignment(horizontal="center"))
    c.number_format = "@"
    data_cell(ws, r, 4, name, zebra=z, fill=FILL_INPUT)
    data_cell(ws, r, 5, "studentCode, name, courseId" if i == 0 else "", zebra=z, font=F_MONO)
    r += 1
STU_LAST_ROW = r - 1

r += 1
note(ws, r, 1, "รหัสนักศึกษาห้ามซ้ำ 'ภายในวิชาเดียวกัน' (FR-51) แต่ซ้ำข้ามวิชาได้ เพราะนั่นคือคนเดิมลงเรียนอีกวิชา", span=4)

# ===========================================================================
# UI-6 กรอกคะแนน
# ===========================================================================
ws = wb.create_sheet(SH_SCORE)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 16, "C": 30})
for i in range(N_ACT):
    ws.column_dimensions[get_column_letter(4 + i)].width = 17
ws.column_dimensions[get_column_letter(4 + N_ACT)].width = 34

title(ws, "UI-6 · กรอกคะแนนรายกิจกรรม",
      "คอลัมน์เป็น 'กิจกรรม' ไม่ใช่ CLO (FR-60) — เว้นว่าง = ยังไม่ประเมิน · 0 = ได้ 0 คะแนนจริง")

SCORE_HEAD_ROW = 4
head = ["ลำดับ", "รหัสนักศึกษา", "ชื่อ-นามสกุล"]
header_row(ws, SCORE_HEAD_ROW, head, start_col=1)
for i, (aid, name, method, mx, w) in enumerate(ACTIVITIES):
    c = ws.cell(row=SCORE_HEAD_ROW, column=4 + i,
                value=f"='{SH_ACT}'!C{ACT_FIRST_ROW + i}&\" (เต็ม \"&'{SH_ACT}'!E{ACT_FIRST_ROW + i}&\")\"")
    c.font = F_HEAD
    c.fill = FILL_UI
    c.border = BORDER
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
c = ws.cell(row=SCORE_HEAD_ROW, column=4 + N_ACT, value="→ ตาราง Score")
c.font = F_HEAD
c.fill = FILL_UI
c.border = BORDER
c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
ws.row_dimensions[SCORE_HEAD_ROW].height = 32

SCORE_FIRST_ROW = 5
r = SCORE_FIRST_ROW
for i, (sid, code, name, scores) in enumerate(STUDENTS):
    z = i % 2 == 1
    data_cell(ws, r, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    c = data_cell(ws, r, 2, code, zebra=z, font=F_MONO, align=Alignment(horizontal="center"))
    c.number_format = "@"
    data_cell(ws, r, 3, name, zebra=z)
    for j, sc in enumerate(scores):
        cell = data_cell(ws, r, 4 + j, sc, zebra=z, fill=FILL_INPUT,
                         align=Alignment(horizontal="center"))
        if sc is None:
            cell.fill = PatternFill("solid", fgColor="FAFAFC")
    filled = sum(1 for s in scores if s is not None)
    lbl = "ครบทุกกิจกรรม" if filled == N_ACT else (f"ยังไม่ประเมิน {N_ACT - filled} กิจกรรม")
    data_cell(ws, r, 4 + N_ACT, f"{filled} แถว — {lbl}", zebra=z, font=F_MUTED)
    r += 1
SCORE_LAST_ROW = r - 1

r += 1
note(ws, r, 1, f"กรอกไป {sum(1 for s in STUDENTS for x in s[3] if x is not None)} ช่อง จากทั้งหมด {N_STU * N_ACT} ช่อง "
                f"→ ตาราง Score จึงมี {len(SCORE_ROWS)} แถว ไม่ใช่ {N_STU * N_ACT} แถว "
                f"เพราะช่องว่างไม่สร้างแถว (FR-62)", span=5)
r += 1
note(ws, r, 1, "ลองแก้ตัวเลขในหน้านี้ แล้วเปิดหน้า " + SH_RESULT + " — คะแนน CLO และผลการบรรลุจะเปลี่ยนตามทันที", span=5, warn=True)

# ===========================================================================
# UI-7 ผลลัพธ์ CLO  (live formulas, CR-02..CR-05)
# ===========================================================================
ws = wb.create_sheet(SH_RESULT)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 8, "B": 16, "C": 30})
for i in range(max(N_ACT, N_CLO)):
    ws.column_dimensions[get_column_letter(4 + i)].width = 15
ws.column_dimensions[get_column_letter(4 + N_CLO)].width = 15      # คะแนนรวม
ws.column_dimensions[get_column_letter(5 + N_CLO)].width = 16      # เพดาน ณ ตอนนี้
ws.column_dimensions[get_column_letter(6 + N_CLO)].width = 13      # กรอกแล้ว
ws.column_dimensions[get_column_letter(7 + N_CLO)].width = 16      # ผ่านวิชา
ws.column_dimensions[get_column_letter(8 + N_CLO)].width = 22      # สถานะ

title(ws, "UI-7 · ผลลัพธ์การบรรลุ CLO  (ระบบคำนวณให้ ไม่มีการกรอก)", None, accent=C_CALC)
ws["A2"] = ("ทุกตัวเลขในหน้านี้ 'ไม่ถูกเก็บลงฐานข้อมูล' — คำนวณสดจากตาราง Score + AssessmentCriteria ทุกครั้ง  ·  "
            "สูตรตาม CR-02 ถึง CR-05 ใน SRS")
ws["A2"].font = F_SUB

# --- Step 1: ratio block -------------------------------------------------
r = 4
ws.cell(row=r, column=1, value="ขั้นที่ 1 — สัดส่วนคะแนนที่ได้ (score ÷ maxScore) · ช่องที่ยังไม่ประเมินให้เป็น 0").font = F_H2
RATIO_HEAD = r + 1
header_row(ws, RATIO_HEAD, ["ลำดับ", "รหัส", "ชื่อ-นามสกุล"] + [a[1] for a in ACTIVITIES], start_col=1, fill=FILL_CALC)
RATIO_FIRST = RATIO_HEAD + 1
for i, (sid, code, name, scores) in enumerate(STUDENTS):
    rr = RATIO_FIRST + i
    z = i % 2 == 1
    data_cell(ws, rr, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 2, code, zebra=z, font=F_MONO, align=Alignment(horizontal="center")).number_format = "@"
    data_cell(ws, rr, 3, name, zebra=z)
    for j in range(N_ACT):
        col = get_column_letter(4 + j)
        src = f"'{SH_SCORE}'!{col}{SCORE_FIRST_ROW + i}"
        f = f"=IF({src}=\"\",0,{src}/'{SH_ACT}'!$E${ACT_FIRST_ROW + j})"
        data_cell(ws, rr, 4 + j, f, zebra=z, align=Alignment(horizontal="center"), numfmt="0.0000")

# --- Step 2: has-score block --------------------------------------------
r = RATIO_FIRST + N_STU + 1
ws.cell(row=r, column=1, value="ขั้นที่ 2 — มีคะแนนแล้วหรือยัง (1 = ประเมินแล้ว, 0 = ยังไม่ประเมิน) · ตัวนี้คือสิ่งที่แยก \"ว่าง\" ออกจาก \"ศูนย์\"").font = F_H2
HAS_HEAD = r + 1
header_row(ws, HAS_HEAD, ["ลำดับ", "รหัส", "ชื่อ-นามสกุล"] + [a[1] for a in ACTIVITIES], start_col=1, fill=FILL_CALC)
HAS_FIRST = HAS_HEAD + 1
for i, (sid, code, name, scores) in enumerate(STUDENTS):
    rr = HAS_FIRST + i
    z = i % 2 == 1
    data_cell(ws, rr, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 2, code, zebra=z, font=F_MONO, align=Alignment(horizontal="center")).number_format = "@"
    data_cell(ws, rr, 3, name, zebra=z)
    for j in range(N_ACT):
        col = get_column_letter(4 + j)
        src = f"'{SH_SCORE}'!{col}{SCORE_FIRST_ROW + i}"
        data_cell(ws, rr, 4 + j, f"=IF({src}=\"\",0,1)", zebra=z, align=Alignment(horizontal="center"))

# --- Step 3: transposed weight table ------------------------------------
r = HAS_FIRST + N_STU + 1
ws.cell(row=r, column=1, value="ขั้นที่ 3 — ตารางน้ำหนักที่สลับแกนจาก UI-4 (เพื่อให้คูณกับแถวคะแนนได้)").font = F_H2
CW_HEAD = r + 1
header_row(ws, CW_HEAD, ["", "", "CLO \\ กิจกรรม"] + [a[1] for a in ACTIVITIES], start_col=1, fill=FILL_CALC)
CW_FIRST = CW_HEAD + 1
for ci in range(N_CLO):
    rr = CW_FIRST + ci
    z = ci % 2 == 1
    data_cell(ws, rr, 3, f"CLO {CLOS[ci][1]}", zebra=z, font=F_LABEL)
    for ai in range(N_ACT):
        src_col = get_column_letter(3 + ci)
        data_cell(ws, rr, 4 + ai, f"='{SH_MAP}'!{src_col}{MAP_FIRST_ROW + ai}",
                  zebra=z, align=Alignment(horizontal="center"))

AW_ROW = CW_FIRST + N_CLO
data_cell(ws, AW_ROW, 3, "น้ำหนักกิจกรรมต่อวิชา (Aw)", font=F_LABEL, fill=FILL_WARN)
for ai in range(N_ACT):
    data_cell(ws, AW_ROW, 4 + ai, f"='{SH_ACT}'!$F${ACT_FIRST_ROW + ai}",
              fill=FILL_WARN, align=Alignment(horizontal="center"))

TH_ROW = AW_ROW + 1
data_cell(ws, TH_ROW, 3, "เกณฑ์ผ่านของแต่ละ CLO (threshold)", font=F_LABEL, fill=FILL_WARN)
for ci in range(N_CLO):
    data_cell(ws, TH_ROW, 4 + ci, f"='{SH_CLO}'!$E${CLO_TH_FIRST_ROW + ci}",
              fill=FILL_WARN, align=Alignment(horizontal="center"))

# --- Step 4: results -----------------------------------------------------
r = TH_ROW + 2
ws.cell(row=r, column=1, value="ขั้นที่ 4 — คะแนน CLO รายบุคคล (CR-03) · คะแนนรวมและสถานะ (CR-05)").font = F_H2
RES_HEAD = r + 1
res_headers = (["ลำดับ", "รหัส", "ชื่อ-นามสกุล"]
               + [f"CLO {c[1]} (%)" for c in CLOS]
               + ["คะแนนรวม (%)", "เพดาน ณ ตอนนี้ (%)", "กรอกแล้ว", "ผ่านวิชา?", "สถานะการติดตาม"])
header_row(ws, RES_HEAD, res_headers, start_col=1, fill=FILL_CALC, heights=30)
RES_FIRST = RES_HEAD + 1

col_total = 4 + N_CLO
col_cap = 5 + N_CLO
col_filled = 6 + N_CLO
col_pass = 7 + N_CLO
col_status = 8 + N_CLO
L_total = get_column_letter(col_total)
L_cap = get_column_letter(col_cap)
L_cloA = get_column_letter(4)
L_cloZ = get_column_letter(3 + N_CLO)
L_actA = get_column_letter(4)
L_actZ = get_column_letter(3 + N_ACT)

for i, (sid, code, name, scores) in enumerate(STUDENTS):
    rr = RES_FIRST + i
    z = i % 2 == 1
    ratio_row = RATIO_FIRST + i
    has_row = HAS_FIRST + i

    data_cell(ws, rr, 1, i + 1, zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 2, code, zebra=z, font=F_MONO, align=Alignment(horizontal="center")).number_format = "@"
    data_cell(ws, rr, 3, name, zebra=z)

    for ci in range(N_CLO):
        cw_row = CW_FIRST + ci
        denom = f"SUMPRODUCT(${L_actA}${has_row}:${L_actZ}${has_row},${L_actA}${cw_row}:${L_actZ}${cw_row})"
        numer = f"SUMPRODUCT(${L_actA}${ratio_row}:${L_actZ}${ratio_row},${L_actA}${cw_row}:${L_actZ}${cw_row})"
        f = f'=IF({denom}=0,"—",{numer}/{denom}*100)'
        data_cell(ws, rr, 4 + ci, f, zebra=z, align=Alignment(horizontal="center"), numfmt="0.00")

    data_cell(ws, rr, col_total,
              f"=SUMPRODUCT(${L_actA}${ratio_row}:${L_actZ}${ratio_row},${L_actA}${AW_ROW}:${L_actZ}${AW_ROW})",
              zebra=z, align=Alignment(horizontal="center"), numfmt="0.00", font=F_LABEL)

    # Sum of Activity.weight for the activities that HAVE been graded — the
    # highest total this student could still reach right now. While this is
    # below 100 the raw total is not comparable to passCriteria yet.
    data_cell(ws, rr, col_cap,
              f"=SUMPRODUCT(${L_actA}${has_row}:${L_actZ}${has_row},${L_actA}${AW_ROW}:${L_actZ}${AW_ROW})",
              zebra=z, align=Alignment(horizontal="center"), numfmt="0", font=F_MUTED)

    data_cell(ws, rr, col_filled,
              f"=COUNT('{SH_SCORE}'!{get_column_letter(4)}{SCORE_FIRST_ROW + i}:{get_column_letter(3 + N_ACT)}{SCORE_FIRST_ROW + i})&\"/{N_ACT}\"",
              zebra=z, align=Alignment(horizontal="center"), font=F_MUTED)

    data_cell(ws, rr, col_pass,
              f'=IF(COUNT(${L_cloA}{rr}:${L_cloZ}{rr})=0,"—",'
              f'IF(${L_cap}{rr}<100,"ยังตัดสินไม่ได้",'
              f'IF(${L_total}{rr}>=\'{SH_COURSE}\'!{PASS_CRIT_CELL},"ผ่าน","ไม่ผ่าน")))',
              zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)

    data_cell(ws, rr, col_status,
              f'=IF(COUNT(${L_cloA}{rr}:${L_cloZ}{rr})=0,"ยังประเมินไม่ครบ",'
              f'IF(SUMPRODUCT(--ISNUMBER(${L_cloA}{rr}:${L_cloZ}{rr}),'
              f'--(${L_cloA}{rr}:${L_cloZ}{rr}<${L_cloA}${TH_ROW}:${L_cloZ}${TH_ROW}))>0,'
              f'"เสี่ยง (at-risk)","ปกติ"))',
              zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)

RES_LAST = RES_FIRST + N_STU - 1

# --- Step 5: attainment --------------------------------------------------
r = RES_LAST + 2
ws.cell(row=r, column=1, value="ขั้นที่ 5 — การบรรลุ CLO ระดับชั้นเรียน (CR-04)").font = F_H2
ATT_HEAD = r + 1
header_row(ws, ATT_HEAD,
           ["", "", "CLO", "เกณฑ์ผ่านรายคน (%)", "จำนวนที่ผ่าน", "จำนวนที่คำนวณได้", "Attainment (%)", "Class Target (%)", "ผลการบรรลุ"],
           start_col=1, fill=FILL_CALC, heights=30)
ATT_FIRST = ATT_HEAD + 1
for ci in range(N_CLO):
    rr = ATT_FIRST + ci
    z = ci % 2 == 1
    col = get_column_letter(4 + ci)
    data_cell(ws, rr, 3, f"CLO {CLOS[ci][1]}", zebra=z, font=F_LABEL)
    data_cell(ws, rr, 4, f"='{SH_CLO}'!$E${CLO_TH_FIRST_ROW + ci}", zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 5, f'=COUNTIF({col}{RES_FIRST}:{col}{RES_LAST},">="&D{rr})',
              zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 6, f"=COUNT({col}{RES_FIRST}:{col}{RES_LAST})",
              zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 7, f'=IF(F{rr}=0,"—",E{rr}/F{rr}*100)',
              zebra=z, align=Alignment(horizontal="center"), numfmt="0.00", font=F_LABEL)
    data_cell(ws, rr, 8, f"='{SH_COURSE}'!{CLASS_TARGET_CELL}", zebra=z, align=Alignment(horizontal="center"))
    data_cell(ws, rr, 9, f'=IF(G{rr}="—","ยังสรุปไม่ได้",IF(G{rr}>=H{rr},"บรรลุ","ไม่บรรลุ"))',
              zebra=z, align=Alignment(horizontal="center"), font=F_LABEL)

r = ATT_FIRST + N_CLO + 1
note(ws, r, 1, "ตัวหารของ Attainment คือ 'จำนวนนักศึกษาที่มีคะแนนพอจะคำนวณ CLO นั้นได้' ไม่ใช่จำนวนนักศึกษาทั้งห้อง — "
                "คนที่ยังไม่ถูกประเมินเลยจะไม่ถูกนับเป็นทั้งผ่านและไม่ผ่าน (OI-12)", span=7)
r += 1
note(ws, r, 1, "ข้อสังเกตที่พบจากข้อมูลชุดนี้ — CR-05 บวกเฉพาะกิจกรรมที่มีคะแนนแล้ว ดังนั้นระหว่างเทอมที่ยังกรอกไม่ครบ "
                "'คะแนนรวม' จะต่ำกว่าความจริงเสมอ (ดู 65010006 ที่ยังไม่ประเมิน Lab น้ำหนัก 20% — คะแนน CLO อยู่ราว 62-70 "
                "แต่คะแนนรวมแสดง 53 เพราะเพดานตอนนี้คือ 80 ไม่ใช่ 100) จึงต้องดูคอลัมน์ 'เพดาน ณ ตอนนี้' ควบคู่เสมอ "
                "และห้ามตัดสินผ่าน/ไม่ผ่านจนกว่าเพดานจะครบ 100", span=7, warn=True)
r += 1
note(ws, r, 1, "หมายเหตุ OI-10 (ยังไม่ sign-off): CR-03 ตามที่เขียนใน SRS ไม่ได้ถ่วงด้วย Activity.weight — "
                "กิจกรรมเล็กกับใหญ่จึงมีน้ำหนักเท่ากันต่อ CLO ไฟล์นี้คำนวณตามสูตรที่เขียนไว้จริง "
                "ถ้าทีมตัดสินใจใช้แบบถ่วงน้ำหนัก ต้องแก้ทั้ง SRS และสูตรในขั้นที่ 4", span=7, warn=True)

ws.freeze_panes = "D5"

# ===========================================================================
# DB ทุกตาราง
# ===========================================================================
ws = wb.create_sheet(SH_DB)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 3, "B": 14, "C": 20, "D": 20, "E": 16, "F": 16, "G": 16, "H": 16, "I": 30})
title(ws, "ฐานข้อมูล — ข้อมูลจริงที่เกิดจากหน้าจอ UI-1 ถึง UI-6", None, accent=C_DB)
ws["A2"] = "ทั้ง 11 ตารางของ schema.prisma พร้อมแถวข้อมูลที่สอดคล้องกับหน้าจอทุกหน้าในไฟล์นี้"
ws["A2"].font = F_SUB


def db_table(ws, start_row, table, thai, source, headers, rows, note_text=None):
    r = start_row
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=2 + max(len(headers) - 1, 3))
    c = ws.cell(row=r, column=2, value=f"{table}   ({len(rows)} แถว)")
    c.font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
    c.fill = FILL_DB
    c.alignment = Alignment(vertical="center", indent=1)
    ws.row_dimensions[r].height = 22
    r += 1

    c = ws.cell(row=r, column=2, value=f"เก็บอะไร: {thai}")
    c.font = F_MUTED
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=2 + max(len(headers) - 1, 3))
    r += 1
    c = ws.cell(row=r, column=2, value=f"ข้อมูลมาจาก: {source}")
    c.font = Font(size=9.5, italic=True, color=C_UI)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=2 + max(len(headers) - 1, 3))
    r += 1

    header_row(ws, r, headers, start_col=2, fill=FILL_DB, heights=20)
    r += 1
    for i, row in enumerate(rows):
        z = i % 2 == 1
        for j, v in enumerate(row):
            cell = data_cell(ws, r, 2 + j, v, zebra=z,
                             font=F_MONO if j == 0 else F_BODY,
                             align=Alignment(vertical="center",
                                             horizontal="center" if isinstance(v, (int, float)) else "left"))
        r += 1
    if note_text:
        note(ws, r, 2, note_text, span=len(headers) - 1 if len(headers) > 1 else 4)
        r += 1
    return r + 2


r = 4
r = db_table(ws, r, "User", "บัญชีผู้ใช้ระบบ (อาจารย์/แอดมิน) และบทบาทระดับระบบ",
             "ผู้ดูแลระบบสร้างให้ ไม่ได้อยู่ในหน้าจอของอาจารย์",
             ["id", "email", "name", "role", "isActive"],
             [[u[0], u[1], u[2], u[3], "TRUE" if u[4] else "FALSE"] for u in USERS],
             "รหัสผ่านเก็บเป็น passwordHash (argon2) เท่านั้น ไม่แสดงในตารางนี้และห้ามส่งออกทาง API")

r = db_table(ws, r, "Course", "รายวิชา — รากของลำดับชั้นข้อมูลทั้งหมด ไม่มีตารางใดอยู่เหนือกว่านี้",
             SH_COURSE,
             ["id", "code", "name", "semester", "year", "section", "gradeScale", "passCriteria", "classTarget"],
             [[COURSE["id"], COURSE["code"], COURSE["name"], COURSE["semester"], COURSE["year"],
               COURSE["section"], COURSE["gradeScale"], COURSE["passCriteria"], COURSE["classTarget"]]])

r = db_table(ws, r, "CourseInstructor", "ใครสอนวิชาไหน ในบทบาทอะไร (ตารางเชื่อม User ↔ Course แบบ M:N)",
             "หน้าจอมอบหมายผู้สอน (สิทธิ์ ADMIN)",
             ["id", "courseId", "userId", "role", "assignedAt"],
             [list(ci) for ci in COURSE_INSTRUCTORS],
             "1 รายวิชามี LEAD ได้ไม่เกิน 1 คน — บังคับด้วย partial unique index ที่ Postgres (DC-07)")

r = db_table(ws, r, "CLO", "ผลลัพธ์การเรียนรู้ที่คาดหวังของรายวิชา พร้อมเกณฑ์ผ่านรายคน",
             SH_CLO,
             ["id", "courseId", "number", "description", "threshold"],
             [[c[0], COURSE["id"], c[1], c[2], c[3]] for c in CLOS],
             "ไม่มีคอลัมน์ weight — น้ำหนักของ CLO เป็นค่าคำนวณจาก AssessmentCriteria (CR-02)")

r = db_table(ws, r, "BehavioralObjective", "จุดประสงค์เชิงพฤติกรรมที่ย่อยลงมาจาก CLO แต่ละข้อ",
             SH_CLO + " (บล็อกล่าง)",
             ["id", "cloId", "number", "description"],
             [[o[0], CLOS[o[1]][0], o[2], o[3]] for o in OBJECTIVES])

r = db_table(ws, r, "Activity", "กิจกรรมการประเมิน พร้อมคะแนนเต็มและน้ำหนักต่อคะแนนรวมวิชา",
             SH_ACT,
             ["id", "courseId", "name", "method", "maxScore", "order", "weight"],
             [[a[0], COURSE["id"], a[1], a[2], a[3], i + 1, a[4]] for i, a in enumerate(ACTIVITIES)],
             f"ผลรวม weight ของทุกแถวในวิชาเดียวกันต้องได้ 100 พอดี (CR-01) — ในชุดนี้ = {sum(a[4] for a in ACTIVITIES)}")

r = db_table(ws, r, "AssessmentCriteria", "กิจกรรมนี้ใช้วัด CLO ตัวไหน ด้วยน้ำหนักเท่าไร (ตารางเชื่อม Activity ↔ CLO แบบ M:N)",
             SH_MAP + "  (เฉพาะช่องที่ค่ามากกว่า 0)",
             ["id", "activityId", "cloId", "weight"],
             [[c[0], c[1], c[2], c[3]] for c in CRITERIA],
             f"เมทริกซ์บนหน้าจอมี {N_ACT}×{N_CLO} = {N_ACT * N_CLO} ช่อง แต่เกิดแถวจริงเพียง {len(CRITERIA)} แถว "
             f"เพราะช่องที่เป็น 0 แปลว่า 'ไม่ได้วัด' จึงไม่มีความสัมพันธ์ให้เก็บ")

r = db_table(ws, r, "ObjectiveAssessment", "เกณฑ์การประเมินข้อนี้ เป็นหลักฐานของจุดประสงค์เชิงพฤติกรรมข้อใด",
             SH_MAP + " (ส่วนขยาย — ไม่บังคับกรอก)",
             ["id", "criteriaId", "objectiveId"],
             [list(o) for o in OBJ_ASSESS],
             "trigger บังคับว่า objective ต้องเป็นของ CLO เดียวกับที่ criteria ผูกอยู่ (DC-06)")

r = db_table(ws, r, "Student", "การลงทะเบียนเรียน 1 แถว = นักศึกษา 1 คนในวิชา 1 วิชา (ไม่ใช่ตัวบุคคล)",
             SH_STU,
             ["id", "courseId", "studentCode", "name"],
             [[s[0], COURSE["id"], s[1], s[2]] for s in STUDENTS])

score_rows_display = [[sc[0], sc[1], sc[2], sc[3],
                       f"{STUDENTS[sc[5]][1]} · {ACTIVITIES[sc[4]][1]}"] for sc in SCORE_ROWS]
missing = [(STUDENTS[si][1], ACTIVITIES[ai][1])
           for si, s in enumerate(STUDENTS) for ai, v in enumerate(s[3]) if v is None]
r = db_table(ws, r, "Score", "คะแนนดิบ 1 แถว = นักศึกษา 1 คน ต่อกิจกรรม 1 อย่าง",
             SH_SCORE,
             ["id", "studentId", "activityId", "score", "(อ่านเป็นภาษาคน)"],
             score_rows_display,
             f"ไม่มีแถวสำหรับช่องที่ยังไม่ประเมิน {len(missing)} ช่อง — "
             f"เช่น {missing[0][0]} ยังไม่มีคะแนน {missing[0][1]} จึงไม่มีแถว ไม่ใช่แถวที่ score = 0")

r = db_table(ws, r, "ScoreUploadLog", "ประวัติการนำเข้าไฟล์คะแนน — ใครอัปโหลด เมื่อไร ไฟล์อะไร สำเร็จ/ล้มเหลวกี่แถว",
             "เกิดอัตโนมัติทุกครั้งที่อัปโหลดไฟล์ Excel",
             ["id", "courseId", "uploadedBy", "fileName", "recordsOk", "recordsFail", "createdAt"],
             [list(l) for l in UPLOAD_LOGS],
             "อยู่นอกเส้นทางการคำนวณทั้งหมด — ไม่มีตารางใดอ้างอิงกลับมาที่ log นี้ (NFR-16)")

c = ws.cell(row=r, column=2, value="ไม่มีตารางเก็บผลการคำนวณ")
c.font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
c.fill = FILL_CALC
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=9)
ws.row_dimensions[r].height = 22
r += 1
note(ws, r, 2, "คะแนน CLO รายบุคคล · attainment ระดับชั้น · สถานะ at-risk — ทั้งหมดคำนวณสดจาก Score และ "
                "AssessmentCriteria ทุกครั้งที่เปิดดู จึงไม่มีทางขัดแย้งกับคะแนนดิบ และการแก้คะแนนย้อนหลัง "
                "จะสะท้อนผลทันทีโดยไม่ต้องสั่งคำนวณใหม่ (ดูหน้า " + SH_RESULT + ")", span=7)

# ===========================================================================
# UI to DB Mapping
# ===========================================================================
ws = wb.create_sheet(SH_FIELDMAP)
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 3, "B": 20, "C": 34, "D": 26, "E": 24, "F": 52})
title(ws, "แผนที่ระดับช่องกรอก — UI → ตาราง.คอลัมน์", None, accent=C_PRIMARY)
ws["A2"] = "ใช้ตอบคำถามว่า 'ช่องนี้บนหน้าจอ ไปโผล่ที่ไหนในฐานข้อมูล' และ 'ค่านี้ใครเป็นคนคำนวณ'"
ws["A2"].font = F_SUB

header_row(ws, 4, ["หน้าจอ", "ช่องกรอก / สิ่งที่เห็น", "ตาราง", "คอลัมน์", "หมายเหตุ"], start_col=2)
mapping_rows = [
    (SH_COURSE, "รหัสวิชา / ภาค / ปี / กลุ่ม", "Course", "code, semester, year, section", "4 ค่านี้รวมกันต้องไม่ซ้ำทั้งระบบ (FR-21)"),
    (SH_COURSE, "เกณฑ์ผ่านรายวิชา", "Course", "passCriteria", "CR-05 ใช้ตัดสินว่านักศึกษาผ่านวิชาหรือไม่"),
    (SH_COURSE, "เป้าหมายระดับชั้น", "Course", "classTarget", "CR-04 ใช้ตัดสินว่า CLO บรรลุหรือไม่"),
    (SH_CLO, "คำอธิบาย CLO", "CLO", "description", ""),
    (SH_CLO, "เกณฑ์ผ่านของ CLO", "CLO", "threshold", "เกณฑ์รายบุคคล ไม่ใช่ระดับชั้น"),
    (SH_CLO, "จุดประสงค์เชิงพฤติกรรม", "BehavioralObjective", "cloId, number, description", "ไม่กระทบคะแนนที่คำนวณ (FR-35)"),
    (SH_ACT, "ชื่อกิจกรรม / วิธีประเมิน", "Activity", "name, method", ""),
    (SH_ACT, "คะแนนเต็ม", "Activity", "maxScore", "ต้อง > 0 บังคับที่ฐานข้อมูล (DC-03)"),
    (SH_ACT, "น้ำหนักต่อวิชา", "Activity", "weight", "รวมทุกกิจกรรมในวิชา = 100 (CR-01)"),
    (SH_MAP, "ตัวเลขในเมทริกซ์ (> 0)", "AssessmentCriteria", "activityId, cloId, weight", "ช่องที่เป็น 0 ไม่สร้างแถว"),
    (SH_MAP, "แถว 'น้ำหนักของ CLO'", "— ไม่เก็บ —", "คำนวณ (CR-02)", "ถ้าเก็บซ้ำจะมีวันที่ค่าสองที่ไม่ตรงกัน"),
    (SH_STU, "รหัสนักศึกษา / ชื่อ", "Student", "studentCode, name, courseId", "ห้ามซ้ำภายในวิชาเดียวกัน (FR-51)"),
    (SH_SCORE, "ตัวเลขคะแนนในตาราง", "Score", "studentId, activityId, score", "ช่องว่างไม่สร้างแถว · 0 สร้างแถว (FR-62)"),
    (SH_SCORE, "การอัปโหลดไฟล์", "ScoreUploadLog", "fileName, recordsOk, recordsFail", "บันทึกทุกครั้งแม้ไฟล์ล้มเหลวทั้งไฟล์ (FR-71)"),
    (SH_RESULT, "คะแนน CLO รายบุคคล", "— ไม่เก็บ —", "คำนวณ (CR-03)", "อ่านจาก Score + AssessmentCriteria สด ๆ"),
    (SH_RESULT, "คะแนนรวม / ผ่านวิชา", "— ไม่เก็บ —", "คำนวณ (CR-05)", ""),
    (SH_RESULT, "Attainment / บรรลุหรือไม่", "— ไม่เก็บ —", "คำนวณ (CR-04)", ""),
    (SH_RESULT, "สถานะ at-risk", "— ไม่เก็บ —", "คำนวณ (CR-05)", "มี CLO อย่างน้อย 1 ข้อต่ำกว่า threshold"),
]
r = 5
for i, (screen, field, table, col, remark) in enumerate(mapping_rows):
    z = i % 2 == 1
    is_calc = table.startswith("—")
    fill = FILL_CALCROW if is_calc else (FILL_ROW if z else FILL_WHITE)
    data_cell(ws, r, 2, screen, fill=fill, font=F_MUTED)
    data_cell(ws, r, 3, field, fill=fill)
    c = data_cell(ws, r, 4, table, fill=fill)
    c.font = Font(size=10, bold=True, color=C_CALC if is_calc else C_DB)
    data_cell(ws, r, 5, col, fill=fill, font=F_MONO)
    data_cell(ws, r, 6, remark, fill=fill, font=F_MUTED)
    r += 1

r += 1
note(ws, r, 2, "แถวสีเขียวคือค่าที่ 'ไม่มีตารางเก็บ' — ระบบคำนวณใหม่ทุกครั้งที่แสดงผล "
                "ถ้าวันหนึ่งมีคนเสนอให้เก็บลงตารางเพื่อความเร็ว ต้องตอบให้ได้ก่อนว่าจะทำให้ค่าตรงกับคะแนนดิบเสมอได้อย่างไร", span=4)

wb.save("docs/excel/CMAS-UI-to-Database.xlsx")
print("Saved docs/excel/CMAS-UI-to-Database.xlsx")
print(f"  Activities: {N_ACT}  CLOs: {N_CLO}  Students: {N_STU}")
print(f"  AssessmentCriteria rows: {len(CRITERIA)} (from {N_ACT * N_CLO} matrix cells)")
print(f"  Score rows: {len(SCORE_ROWS)} (from {N_STU * N_ACT} grid cells)")
print(f"  ObjectiveAssessment rows: {len(OBJ_ASSESS)}")
