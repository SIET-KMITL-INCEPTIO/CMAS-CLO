"""
Build docs/excel/CMAS-ER-Diagram.xlsx — an Excel workbook that visualizes the
CMAS / CLO System ER structure (database/schema.prisma, 11 models) with
simulated sample data for abstraction and presentation purposes.

Sheets:
  0. README            — how to read the workbook, legend
  1. ER Diagram         — entity boxes laid out by hierarchy + relationship arrows
  2. Relationships       — flat FK -> PK edge list with cardinality
  3..13. One sheet per entity — column spec (PK/FK/type/constraint) + sample rows

Run: python scripts/build-er-excel.py
Output: docs/excel/CMAS-ER-Diagram.xlsx
"""

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.worksheet import Worksheet

# ---------------------------------------------------------------------------
# Palette — matches the Verdure / Nocturnal-adjacent tokens used elsewhere in
# docs/ (cool neutral violet), so this workbook feels like it belongs to the
# same project.
# ---------------------------------------------------------------------------
C_PRIMARY = "19151B"
C_PRIMARY_TEXT = "FFFFFF"
C_SECONDARY = "5C5C78"
C_SECONDARY_CONTAINER = "DEDDFE"
C_SURFACE = "F3F3F5"
C_SURFACE_ALT = "EEEEF0"
C_OUTLINE = "CCC4CA"
C_ON_SURFACE = "1A1C1D"
C_ON_SURFACE_VARIANT = "4A454A"

C_PK = "137333"        # green — primary key
C_PK_BG = "E6F4EA"
C_FK = "1A56C4"        # blue — foreign key
C_FK_BG = "EAF1FE"
C_UNIQUE = "B06000"    # amber — unique constraint
C_UNIQUE_BG = "FEF7E0"
C_CHECK = "C5221F"     # red — check constraint / trigger
C_CHECK_BG = "FCE8E6"

thin = Side(style="thin", color=C_OUTLINE)
BORDER_ALL = Border(left=thin, right=thin, top=thin, bottom=thin)
BORDER_THICK = Border(
    left=Side(style="medium", color=C_PRIMARY),
    right=Side(style="medium", color=C_PRIMARY),
    top=Side(style="medium", color=C_PRIMARY),
    bottom=Side(style="medium", color=C_PRIMARY),
)

FONT_TITLE = Font(name="Calibri", size=18, bold=True, color=C_PRIMARY)
FONT_SUBTITLE = Font(name="Calibri", size=11, italic=True, color=C_ON_SURFACE_VARIANT)
FONT_H2 = Font(name="Calibri", size=13, bold=True, color=C_PRIMARY)
FONT_HEADER = Font(name="Calibri", size=10, bold=True, color=C_PRIMARY_TEXT)
FONT_BODY = Font(name="Calibri", size=10, color=C_ON_SURFACE)
FONT_BODY_MUTED = Font(name="Calibri", size=10, color=C_ON_SURFACE_VARIANT)
FONT_ENTITY_TITLE = Font(name="Calibri", size=11, bold=True, color=C_PRIMARY_TEXT)
FONT_PK = Font(name="Calibri", size=10, bold=True, color=C_PK)
FONT_FK = Font(name="Calibri", size=10, italic=True, color=C_FK)
FONT_MONO = Font(name="Consolas", size=10, color=C_ON_SURFACE)

FILL_HEADER = PatternFill("solid", fgColor=C_PRIMARY)
FILL_SURFACE = PatternFill("solid", fgColor=C_SURFACE)
FILL_SURFACE_ALT = PatternFill("solid", fgColor=C_SURFACE_ALT)
FILL_SECONDARY = PatternFill("solid", fgColor=C_SECONDARY_CONTAINER)
FILL_PK = PatternFill("solid", fgColor=C_PK_BG)
FILL_FK = PatternFill("solid", fgColor=C_FK_BG)
FILL_UNIQUE = PatternFill("solid", fgColor=C_UNIQUE_BG)
FILL_CHECK = PatternFill("solid", fgColor=C_CHECK_BG)

wb = Workbook()

# ===========================================================================
# 0. README
# ===========================================================================
ws = wb.active
ws.title = "README"
ws.sheet_view.showGridLines = False
ws.column_dimensions["A"].width = 3
ws.column_dimensions["B"].width = 110

ws["B2"] = "CMAS / CLO System — ER Diagram Workbook"
ws["B2"].font = FONT_TITLE
ws["B3"] = "แผนภาพความสัมพันธ์ของฐานข้อมูล (Entity-Relationship) พร้อมข้อมูลจำลอง (Simulated Data)"
ws["B3"].font = FONT_SUBTITLE

rows = [
    ("", ""),
    ("แหล่งที่มา", "สร้างจาก database/schema.prisma (single-tenant, v4) — 11 ตาราง / 3 enum"),
    ("ข้อมูลในไฟล์นี้", "เป็นข้อมูลจำลอง (simulated) ทั้งหมด ใช้เพื่อการอธิบายและแสดงภาพโครงสร้างเท่านั้น ไม่ใช่ข้อมูลจริงของนักศึกษาหรือผู้ใช้งาน"),
    ("วิธีอ่าน sheet \"ER Diagram\"", "แต่ละกล่องคือ 1 ตาราง (entity) — เส้นลูกศรพร้อมป้าย 1 / N / M:N คือความสัมพันธ์ระหว่างตาราง อ่านทิศทางลูกศรจากตารางแม่ (parent) ไปตารางลูก (child) ที่ถือ foreign key"),
    ("วิธีอ่าน sheet \"Relationships\"", "ตารางเรียบ (flat) ของทุกความสัมพันธ์ ระบุ FK column, cardinality และกฎที่บังคับใช้ (CHECK / trigger / unique index) ตาม migration 0002_constraints_and_triggers"),
    ("วิธีอ่าน sheet รายตาราง", "แต่ละ entity มี sheet ของตัวเอง แบ่งเป็น 2 ส่วน: (1) โครงสร้างคอลัมน์ — ชนิดข้อมูล, PK/FK/Unique, ข้อบังคับ (2) ข้อมูลตัวอย่างจำลองที่ referential-consistent กันข้าม sheet (ใช้ id เดียวกันอ้างอิงกันได้จริง)"),
]
r = 5
for label, desc in rows:
    if label:
        ws.cell(row=r, column=2, value=label).font = Font(bold=True, size=10, color=C_PRIMARY)
        r += 1
        cell = ws.cell(row=r, column=2, value=desc)
        cell.font = FONT_BODY
        cell.alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[r].height = 32
        r += 2
    else:
        r += 1

r += 1
ws.cell(row=r, column=2, value="สัญลักษณ์ (Legend)").font = FONT_H2
r += 1
legend = [
    ("PK", "Primary Key — คีย์หลักของตาราง", FILL_PK, FONT_PK),
    ("FK", "Foreign Key — คีย์อ้างอิงไปตารางอื่น", FILL_FK, FONT_FK),
    ("UQ", "Unique constraint / unique index", FILL_UNIQUE, Font(bold=True, color=C_UNIQUE, size=10)),
    ("CK", "CHECK constraint หรือ trigger (บังคับที่ระดับฐานข้อมูล ไม่ใช่ Prisma)", FILL_CHECK, Font(bold=True, color=C_CHECK, size=10)),
]
for tag, desc, fill, font in legend:
    c1 = ws.cell(row=r, column=2, value=tag)
    c1.fill = fill
    c1.font = font
    c1.alignment = Alignment(horizontal="center")
    c1.border = BORDER_ALL
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=2)
    c2 = ws.cell(row=r, column=3, value=desc)
    c2.font = FONT_BODY
    r += 1

r += 2
ws.cell(row=r, column=2, value="สารบัญ").font = FONT_H2
r += 1
toc = [
    "ER Diagram — ผังภาพรวมทั้ง 11 ตาราง",
    "Relationships — รายการความสัมพันธ์ทั้งหมดแบบตาราง",
    "01 User, 02 Course, 03 CourseInstructor, 04 CLO, 05 BehavioralObjective,",
    "06 Activity, 07 AssessmentCriteria, 08 ObjectiveAssessment,",
    "09 Student, 10 Score, 11 ScoreUploadLog",
]
for line in toc:
    ws.cell(row=r, column=2, value="• " + line).font = FONT_BODY_MUTED
    r += 1

# ===========================================================================
# 1. ER DIAGRAM (visual layout with entity boxes + relationship arrows)
# ===========================================================================
ws = wb.create_sheet("ER Diagram")
ws.sheet_view.showGridLines = False
for col in range(1, 34):
    ws.column_dimensions[get_column_letter(col)].width = 4.2

ws.cell(row=1, column=2, value="CMAS — ER Diagram (11 Entities)").font = FONT_TITLE
ws.cell(row=2, column=2, value="กล่อง = ตาราง · ลูกศร = ความสัมพันธ์ (ทิศทางจาก parent → child ที่ถือ FK) · ตัวเลข/ตัวอักษรบนเส้น = cardinality").font = FONT_SUBTITLE


def draw_entity_box(ws: Worksheet, top_row: int, left_col: int, width: int, title: str, fields: list[tuple[str, str, str]]):
    """fields: list of (tag, name, type) where tag in {PK, FK, '', UQ}"""
    height = len(fields) + 1
    # Title bar
    ws.merge_cells(start_row=top_row, start_column=left_col, end_row=top_row, end_column=left_col + width - 1)
    tcell = ws.cell(row=top_row, column=left_col, value=title)
    tcell.fill = FILL_HEADER
    tcell.font = FONT_ENTITY_TITLE
    tcell.alignment = Alignment(horizontal="center", vertical="center")
    tcell.border = BORDER_THICK
    for c in range(left_col, left_col + width):
        ws.cell(row=top_row, column=c).border = BORDER_THICK

    for i, (tag, name, ftype) in enumerate(fields):
        rr = top_row + 1 + i
        tag_col = left_col
        name_col = left_col + 1
        ws.merge_cells(start_row=rr, start_column=name_col, end_row=rr, end_column=left_col + width - 1)
        tag_cell = ws.cell(row=rr, column=tag_col, value=tag)
        name_cell = ws.cell(row=rr, column=name_col, value=f"{name}  {ftype}")
        if tag == "PK":
            tag_cell.fill = FILL_PK
            tag_cell.font = FONT_PK
            name_cell.font = Font(bold=True, size=9, color=C_ON_SURFACE)
        elif tag == "FK":
            tag_cell.fill = FILL_FK
            tag_cell.font = FONT_FK
            name_cell.font = Font(italic=True, size=9, color=C_ON_SURFACE)
        elif tag == "UQ":
            tag_cell.fill = FILL_UNIQUE
            tag_cell.font = Font(bold=True, size=8, color=C_UNIQUE)
            name_cell.font = Font(size=9, color=C_ON_SURFACE)
        else:
            tag_cell.fill = FILL_SURFACE
            name_cell.font = FONT_BODY
        tag_cell.alignment = Alignment(horizontal="center", vertical="center")
        name_cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        for c in range(left_col, left_col + width):
            ws.cell(row=rr, column=c).border = BORDER_ALL
            if ws.cell(row=rr, column=c).fill.fgColor.rgb in (None, "00000000"):
                ws.cell(row=rr, column=c).fill = FILL_SURFACE_ALT if i % 2 else PatternFill("solid", fgColor="FFFFFF")
    return top_row, left_col, width, height


def arrow(ws: Worksheet, row: int, col_from: int, col_to: int, label: str, vertical=False):
    if vertical:
        ws.cell(row=row, column=col_from, value="│").font = Font(size=14, bold=True, color=C_SECONDARY)
        lbl = ws.cell(row=row, column=col_from + 1, value=label)
        lbl.font = Font(size=9, bold=True, color=C_SECONDARY)
    else:
        span = col_to - col_from
        mid = col_from + span // 2
        for c in range(col_from, col_to + 1):
            ws.cell(row=row, column=c, value="─" if c != mid else f"── {label} ──").font = Font(size=10, color=C_SECONDARY)


# --- Layout plan (grid of columns 1..33) -----------------------------------
# Row band 1: User (top-left), Course (top-center),
# Row band 2: CourseInstructor (junction under User<->Course)
# Row band 3: CLO / Activity / Student  (children of Course)
# Row band 4: BehavioralObjective (child of CLO) | AssessmentCriteria (junction Activity<->CLO) | Score (junction Student<->Activity) | ScoreUploadLog (child of Course+User)
# Row band 5: ObjectiveAssessment (junction BehavioralObjective<->AssessmentCriteria)

USER = draw_entity_box(ws, 4, 1, 7, "User", [
    ("PK", "id", "String"),
    ("UQ", "email", "String"),
    ("", "name", "String"),
    ("", "passwordHash", "String"),
    ("", "role", "ADMIN|INSTRUCTOR"),
    ("", "isActive", "Boolean"),
])

COURSE = draw_entity_box(ws, 4, 13, 9, "Course", [
    ("PK", "id", "String"),
    ("UQ", "code+sem+year+sec", "String/Int"),
    ("", "name / nameEn", "String"),
    ("", "credits (L-P-S)", "Decimal"),
    ("", "gradeScale", "LETTER|PASS_FAIL"),
    ("", "passCriteria", "Float %"),
    ("", "classTarget", "Float %"),
])

CI = draw_entity_box(ws, 12, 5, 9, "CourseInstructor  (junction)", [
    ("PK", "id", "String"),
    ("FK", "courseId", "→ Course"),
    ("FK", "userId", "→ User"),
    ("UQ", "(courseId,userId)", "-"),
    ("", "role", "LEAD|CO|ASSISTANT"),
    ("CK", "1 LEAD / course", "partial unique idx"),
])

CLO = draw_entity_box(ws, 20, 1, 7, "CLO", [
    ("PK", "id", "String"),
    ("FK", "courseId", "→ Course"),
    ("UQ", "(courseId,number)", "-"),
    ("", "number", "Int"),
    ("", "description", "String"),
    ("CK", "threshold", "0-100"),
])

ACTIVITY = draw_entity_box(ws, 20, 13, 9, "Activity", [
    ("PK", "id", "String"),
    ("FK", "courseId", "→ Course"),
    ("", "name / method", "String"),
    ("CK", "maxScore", "> 0"),
    ("", "order", "Int"),
    ("", "weight", "Float % (Σ=100/course)"),
])

STUDENT = draw_entity_box(ws, 20, 25, 8, "Student  (= enrolment)", [
    ("PK", "id", "String"),
    ("FK", "courseId", "→ Course"),
    ("UQ", "(studentCode,courseId)", "-"),
    ("", "studentCode", "String"),
    ("", "name", "String"),
])

BO = draw_entity_box(ws, 28, 1, 7, "BehavioralObjective", [
    ("PK", "id", "String"),
    ("FK", "cloId", "→ CLO"),
    ("UQ", "(cloId,number)", "-"),
    ("", "number", "Int"),
    ("", "description", "String"),
])

AC = draw_entity_box(ws, 28, 13, 9, "AssessmentCriteria  (junction)", [
    ("PK", "id", "String"),
    ("FK", "activityId", "→ Activity"),
    ("FK", "cloId", "→ CLO"),
    ("UQ", "(activityId,cloId)", "-"),
    ("", "weight", "Float % (Σ=100/activity)"),
    ("CK", "same course", "trigger"),
])

SCORE = draw_entity_box(ws, 28, 25, 8, "Score", [
    ("PK", "id", "String"),
    ("FK", "studentId", "→ Student"),
    ("FK", "activityId", "→ Activity"),
    ("UQ", "(studentId,activityId)", "-"),
    ("CK", "0 ≤ score ≤ maxScore", "trigger"),
    ("", "no row = ยังไม่ประเมิน", "FR-62"),
])

OA = draw_entity_box(ws, 36, 7, 9, "ObjectiveAssessment  (junction)", [
    ("PK", "id", "String"),
    ("FK", "criteriaId", "→ AssessmentCriteria"),
    ("FK", "objectiveId", "→ BehavioralObjective"),
    ("UQ", "(criteriaId,objectiveId)", "-"),
    ("CK", "objective ∈ criteria's CLO", "trigger"),
])

LOG = draw_entity_box(ws, 12, 19, 9, "ScoreUploadLog  (audit)", [
    ("PK", "id", "String"),
    ("FK", "courseId", "→ Course"),
    ("FK", "uploadedBy", "→ User"),
    ("", "fileName", "String"),
    ("", "recordsOk / recordsFail", "Int"),
    ("", "createdAt", "DateTime"),
])

# --- relationship arrows -----------------------------------------------
# openpyxl cannot draw free-floating connector lines, and several gap rows
# sit adjacent to a merged title/field cell of a box. safe_write skips any
# collision with a merged region instead of crashing, which keeps this
# decorative layer best-effort without risking the whole build.
from openpyxl.cell.cell import MergedCell


def safe_write(ws: Worksheet, row: int, col: int, value: str, font: Font, center=True):
    cell = ws.cell(row=row, column=col)
    if isinstance(cell, MergedCell):
        return
    cell.value = value
    cell.font = font
    if center:
        cell.alignment = Alignment(horizontal="center", vertical="center")


ARROW_FONT = Font(size=12, bold=True, color=C_SECONDARY)
LABEL_FONT = Font(size=9, bold=True, color=C_SECONDARY)
NOTE_FONT = Font(size=8, italic=True, color=C_SECONDARY)

# User -> CourseInstructor  (row 11 is blank: below User@r4-10, left of Course@c13-21)
safe_write(ws, 11, 4, "▼  1 : N", LABEL_FONT)

# Course -> CourseInstructor (col 16 is free through CI's own row band r12-18)
for rr in range(12, 15):
    safe_write(ws, rr, 16, "│", ARROW_FONT)
safe_write(ws, 15, 17, "1:N", LABEL_FONT, center=False)

# Course -> ScoreUploadLog & User -> ScoreUploadLog (LOG sits right of CI, cols19-27, rows12-18)
safe_write(ws, 15, 24, "Course 1─N─ Log ─N─1 User", NOTE_FONT, center=False)

# CourseInstructor/Log band -> CLO / Activity / Student band (row19 fully blank)
safe_write(ws, 19, 4, "▼  Course 1 : N  CLO", LABEL_FONT)
safe_write(ws, 19, 17, "▼  Course 1 : N  Activity", LABEL_FONT)
safe_write(ws, 19, 28, "▼  Course 1 : N  Student", LABEL_FONT)

# CLO/Activity/Student band -> BehavioralObjective/AssessmentCriteria/Score band (row27 blank)
safe_write(ws, 27, 4, "▼  CLO 1 : N  BehavioralObjective", LABEL_FONT)
safe_write(ws, 27, 17, "▼  Activity⇄CLO  M:N  via AssessmentCriteria", NOTE_FONT, center=False)
safe_write(ws, 27, 28, "▼  Student⇄Activity  M:N  via Score", NOTE_FONT, center=False)

# AssessmentCriteria/BehavioralObjective -> ObjectiveAssessment (row35 blank)
safe_write(ws, 35, 10, "▼  BehavioralObjective ⇄ AssessmentCriteria   M:N   via ObjectiveAssessment", NOTE_FONT, center=False)

ws.freeze_panes = "A4"

# ===========================================================================
# 2. RELATIONSHIPS (flat table)
# ===========================================================================
ws = wb.create_sheet("Relationships")
ws.sheet_view.showGridLines = False
headers = ["#", "Parent Entity", "Parent Key", "Child Entity", "FK Column", "Cardinality", "onDelete", "บังคับที่", "หมายเหตุ"]
widths = [4, 20, 14, 22, 16, 12, 12, 22, 46]
for i, (h, w) in enumerate(zip(headers, widths), start=1):
    c = ws.cell(row=2, column=i, value=h)
    c.font = FONT_HEADER
    c.fill = FILL_HEADER
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BORDER_ALL
    ws.column_dimensions[get_column_letter(i)].width = w
ws.row_dimensions[2].height = 28
ws.cell(row=1, column=2, value="CMAS — Relationships (11 entities, 11 edges)").font = FONT_TITLE

rels = [
    ("Course", "id", "CourseInstructor", "courseId", "1 : N", "Cascade", "FK", "รายวิชาถูกลบ → assignment ของอาจารย์ในวิชานั้นถูกลบตาม"),
    ("User", "id", "CourseInstructor", "userId", "1 : N", "Restrict", "FK + trigger", "ห้ามลบ User ที่ยังมี assignment อยู่ (FR-06) · ระดับ M:N ระหว่าง User⇄Course ผ่าน junction นี้"),
    ("Course", "id", "CLO", "courseId", "1 : N", "Cascade", "FK", "-"),
    ("CLO", "id", "BehavioralObjective", "cloId", "1 : N", "Cascade", "FK", "-"),
    ("Course", "id", "Activity", "courseId", "1 : N", "Cascade", "FK", "Σ Activity.weight ต่อวิชา = 100 (CR-01, ตรวจที่ API)"),
    ("Activity", "id", "AssessmentCriteria", "activityId", "1 : N", "Cascade", "FK", "Activity ⇄ CLO เป็น M:N ผ่าน junction นี้ · Σ weight ต่อ activity = 100"),
    ("CLO", "id", "AssessmentCriteria", "cloId", "1 : N", "Cascade", "FK + trigger", "trigger บังคับว่า Activity และ CLO ต้องอยู่วิชาเดียวกัน (DC-04)"),
    ("AssessmentCriteria", "id", "ObjectiveAssessment", "criteriaId", "1 : N", "Cascade", "FK + trigger", "BehavioralObjective ⇄ AssessmentCriteria เป็น M:N ผ่าน junction นี้"),
    ("BehavioralObjective", "id", "ObjectiveAssessment", "objectiveId", "1 : N", "Cascade", "FK + trigger", "trigger บังคับว่า objective ต้องเป็นของ CLO เดียวกับ criteria (DC-06)"),
    ("Course", "id", "Student", "courseId", "1 : N", "Cascade", "FK", "Student = 1 การลงทะเบียน ไม่ใช่ 1 คน — คนเดียวเรียนหลายวิชา = หลายแถว (ASM-01)"),
    ("Student", "id", "Score", "studentId", "1 : N", "Cascade", "FK + trigger", "Student ⇄ Activity เป็น M:N ผ่าน Score · trigger บังคับ Student และ Activity อยู่วิชาเดียวกัน (DC-05)"),
    ("Activity", "id", "Score", "activityId", "1 : N", "Cascade", "FK + trigger", "trigger บังคับ 0 ≤ score ≤ Activity.maxScore (DC-01) · ไม่มีแถว = ยังไม่ประเมิน (FR-62)"),
    ("Course", "id", "ScoreUploadLog", "courseId", "1 : N", "Cascade", "FK", "audit เท่านั้น — ไม่มีอะไรอ้างอิงกลับมาที่ log"),
    ("User", "id", "ScoreUploadLog", "uploadedBy", "1 : N", "Restrict", "FK", "ห้ามลบผู้ใช้ที่เคยอัปโหลดไฟล์คะแนน (FR-06, NFR-16 auditability)"),
]
r = 3
for i, (pe, pk, ce, fk, card, ondel, enforced, note) in enumerate(rels, start=1):
    vals = [i, pe, pk, ce, fk, card, ondel, enforced, note]
    for col, v in enumerate(vals, start=1):
        c = ws.cell(row=r, column=col, value=v)
        c.border = BORDER_ALL
        c.alignment = Alignment(vertical="top", wrap_text=(col == 9), horizontal="center" if col in (1, 6, 7) else "left")
        c.font = FONT_BODY
        c.fill = FILL_SURFACE_ALT if i % 2 == 0 else PatternFill("solid", fgColor="FFFFFF")
        if col == 8 and "trigger" in str(v):
            c.font = Font(size=10, color=C_CHECK, bold=True)
    ws.row_dimensions[r].height = 30
    r += 1
ws.freeze_panes = "A3"
ws.auto_filter.ref = f"A2:I{r-1}"

# ===========================================================================
# Helper to build one entity sheet: structure block + sample data block
# ===========================================================================

def build_entity_sheet(name: str, subtitle: str, columns: list[tuple[str, str, str, str]], sample_headers: list[str], sample_rows: list[list]):
    """
    columns: (column_name, type, key_tag, constraint_note) key_tag in {PK, FK, UQ, CK, ''}
    """
    ws = wb.create_sheet(name)
    ws.sheet_view.showGridLines = False
    ws.cell(row=1, column=1, value=name).font = FONT_TITLE
    ws.cell(row=2, column=1, value=subtitle).font = FONT_SUBTITLE

    # -- structure table --
    ws.cell(row=4, column=1, value="โครงสร้างตาราง (Structure)").font = FONT_H2
    shead = ["Column", "Type", "Key", "Constraint / Note"]
    swidths = [26, 20, 8, 52]
    for i, (h, w) in enumerate(zip(shead, swidths), start=1):
        c = ws.cell(row=5, column=i, value=h)
        c.font = FONT_HEADER
        c.fill = FILL_HEADER
        c.border = BORDER_ALL
        c.alignment = Alignment(horizontal="center")
        ws.column_dimensions[get_column_letter(i)].width = w
    r = 6
    for cname, ctype, tag, note in columns:
        c1 = ws.cell(row=r, column=1, value=cname)
        c2 = ws.cell(row=r, column=2, value=ctype)
        c3 = ws.cell(row=r, column=3, value=tag)
        c4 = ws.cell(row=r, column=4, value=note)
        for c in (c1, c2, c3, c4):
            c.border = BORDER_ALL
            c.alignment = Alignment(vertical="center", wrap_text=(c is c4))
        if tag == "PK":
            c1.font = FONT_PK
            c3.fill = FILL_PK
            c3.font = Font(bold=True, color=C_PK, size=9)
        elif tag == "FK":
            c1.font = FONT_FK
            c3.fill = FILL_FK
            c3.font = Font(italic=True, color=C_FK, size=9)
        elif tag == "UQ":
            c3.fill = FILL_UNIQUE
            c3.font = Font(bold=True, color=C_UNIQUE, size=9)
            c1.font = FONT_BODY
        elif tag == "CK":
            c3.fill = FILL_CHECK
            c3.font = Font(bold=True, color=C_CHECK, size=9)
            c1.font = FONT_BODY
        else:
            c1.font = FONT_BODY
        c2.font = FONT_MONO
        c3.alignment = Alignment(horizontal="center", vertical="center")
        c4.font = FONT_BODY_MUTED
        r += 1

    # -- sample data table --
    r += 2
    ws.cell(row=r, column=1, value="ข้อมูลตัวอย่าง (Simulated Data)").font = FONT_H2
    r += 1
    hrow = r
    for i, h in enumerate(sample_headers, start=1):
        c = ws.cell(row=hrow, column=i, value=h)
        c.font = FONT_HEADER
        c.fill = FILL_SECONDARY
        c.font = Font(bold=True, size=10, color=C_ON_SURFACE)
        c.border = BORDER_ALL
        c.alignment = Alignment(horizontal="center", wrap_text=True)
    r += 1
    start_data = r
    for idx, row_vals in enumerate(sample_rows):
        for i, v in enumerate(row_vals, start=1):
            c = ws.cell(row=r, column=i, value=v)
            c.border = BORDER_ALL
            c.font = FONT_BODY
            c.alignment = Alignment(vertical="center")
            c.fill = FILL_SURFACE_ALT if idx % 2 == 0 else PatternFill("solid", fgColor="FFFFFF")
        r += 1
    if sample_rows:
        ws.auto_filter.ref = f"A{hrow}:{get_column_letter(len(sample_headers))}{r-1}"
    ws.freeze_panes = f"A{start_data}"
    return ws


# ===========================================================================
# 3..13 — entity sheets with referentially-consistent simulated data
# ===========================================================================

build_entity_sheet(
    "01 User", "อาจารย์และผู้ดูแลระบบ — role มีผลทั้งระบบ (single-tenant)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("email", "String", "UQ", "unique ทั้งระบบ"),
        ("name", "String", "", "-"),
        ("passwordHash", "String", "", "argon2 เท่านั้น (FR-02) — ไม่เก็บ plaintext"),
        ("role", "ADMIN | INSTRUCTOR", "", "default INSTRUCTOR"),
        ("isActive", "Boolean", "CK", "account kill switch (FR-03) — ห้าม hard-delete ผู้ที่ยังสอนอยู่/เคยอัปโหลด (onDelete: Restrict)"),
        ("createdAt / updatedAt", "DateTime", "", "auto"),
    ],
    sample_headers=["id", "email", "name", "role", "isActive"],
    sample_rows=[
        ["usr-01", "admin@ftech.ac.th", "อ.ดร.สมชาย ใจดี", "ADMIN", True],
        ["usr-02", "wichai.k@ftech.ac.th", "ผศ.วิชัย คงเจริญ", "INSTRUCTOR", True],
        ["usr-03", "suda.p@ftech.ac.th", "อ.สุดา พรหมมา", "INSTRUCTOR", True],
        ["usr-04", "anan.t@ftech.ac.th", "อ.อนันต์ ทองดี", "INSTRUCTOR", True],
        ["usr-05", "nida.s@ftech.ac.th", "อ.นิดา สายทอง", "INSTRUCTOR", False],
    ],
)

build_entity_sheet(
    "02 Course", "รากของลำดับชั้นทั้งหมด (single-tenant — ไม่มี Institution/Curriculum อยู่เหนือ Course)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("code / semester / year / section", "String/Int/Int/String", "UQ", "unique ร่วมกัน — FR-21"),
        ("name / nameEn", "String", "", "ชื่อไทยบังคับ, อังกฤษ optional"),
        ("credits (L-P-S)", "Decimal(3,1) ×3", "CK", "0 ≤ credits ≤ 30 · ชั่วโมงทุกช่อง ≥ 0 (DC-15, รับ 0 ได้จริงสำหรับวิชาฝึกงาน)"),
        ("gradeScale", "LETTER | PASS_FAIL", "", "CR-06 — 7 วิชา (90641004-010) เป็น PASS_FAIL"),
        ("passCriteria", "Float %", "CK", "0-100 (DC-14) — เกณฑ์คะแนนรวมที่ถือว่าผ่านวิชา (CR-05)"),
        ("classTarget", "Float %", "CK", "0-100 (DC-14) — สัดส่วนนักศึกษาที่ต้องผ่าน CLO จึงถือว่า CLO นั้นบรรลุ (CR-04)"),
    ],
    sample_headers=["id", "code", "name", "sem", "year", "section", "credits", "gradeScale", "passCriteria", "classTarget"],
    sample_rows=[
        ["crs-01", "90641001", "การเขียนโปรแกรมคอมพิวเตอร์", 1, 2567, "01", "3 (2-2-5)", "LETTER", 60, 70],
        ["crs-02", "90641002", "ระบบฐานข้อมูล", 2, 2567, "01", "3 (3-0-6)", "LETTER", 50, 65],
        ["crs-03", "90641008", "ฝึกประสบการณ์วิชาชีพ", 1, 2567, "01", "3 (0-0-45)", "PASS_FAIL", 60, 70],
    ],
)

build_entity_sheet(
    "03 CourseInstructor", "junction: User ⇄ Course (M:N) — role อยู่ที่คู่ (pairing) ไม่ใช่ที่ user หรือ course",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("courseId", "String", "FK", "→ Course.id, onDelete: Cascade"),
        ("userId", "String", "FK", "→ User.id, onDelete: Restrict"),
        ("role", "LEAD | CO | ASSISTANT", "", "default CO"),
        ("(courseId, userId)", "-", "UQ", "1 คนรับได้ 1 role ต่อ 1 วิชา"),
        ("assignedAt", "DateTime", "", "auto"),
        ("LEAD ไม่เกิน 1 คน/วิชา", "-", "CK", "partial unique index uq_courseinstructor_lead (บังคับที่ Postgres, ไม่ใช่ Prisma)"),
    ],
    sample_headers=["id", "courseId", "userId", "role", "assignedAt"],
    sample_rows=[
        ["ci-01", "crs-01", "usr-02", "LEAD", "2026-06-01"],
        ["ci-02", "crs-01", "usr-03", "CO", "2026-06-01"],
        ["ci-03", "crs-02", "usr-03", "LEAD", "2026-06-01"],
        ["ci-04", "crs-03", "usr-04", "LEAD", "2026-06-02"],
        ["ci-05", "crs-02", "usr-04", "ASSISTANT", "2026-06-03"],
    ],
)

build_entity_sheet(
    "04 CLO", "ผลลัพธ์การเรียนรู้ที่คาดหวังระดับรายวิชา — ไม่มี weight ของตัวเอง (เป็นค่าคำนวณ, CR-02)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("courseId", "String", "FK", "→ Course.id, onDelete: Cascade"),
        ("(courseId, number)", "-", "UQ", "เลข CLO ห้ามซ้ำในวิชาเดียวกัน — ซ้ำแล้วรายงาน attainment เพี้ยนทันที"),
        ("number", "Int", "", "-"),
        ("description", "String", "", "-"),
        ("threshold", "Float %", "CK", "0-100 (DC-02) — เกณฑ์ผ่านของ CLO นี้ต่อนักศึกษา 1 คน (CR-03)"),
    ],
    sample_headers=["id", "courseId", "number", "description", "threshold"],
    sample_rows=[
        ["clo-01", "crs-01", 1, "สามารถออกแบบอัลกอริทึมเพื่อแก้ปัญหาได้", 60],
        ["clo-02", "crs-01", 2, "สามารถเขียนโปรแกรมภาษา Python ได้ถูกต้องตามหลักไวยากรณ์", 60],
        ["clo-03", "crs-01", 3, "สามารถทดสอบและแก้ไขข้อผิดพลาดของโปรแกรมได้", 55],
        ["clo-04", "crs-02", 1, "สามารถออกแบบฐานข้อมูลเชิงสัมพันธ์ได้", 60],
        ["clo-05", "crs-02", 2, "สามารถเขียนคำสั่ง SQL ขั้นสูงได้", 60],
        ["clo-06", "crs-02", 3, "สามารถทำ Normalization ได้ถูกต้อง", 65],
        ["clo-07", "crs-03", 1, "สามารถปฏิบัติงานจริงในสถานประกอบการได้", 70],
        ["clo-08", "crs-03", 2, "มีความรับผิดชอบและจรรยาบรรณวิชาชีพ", 70],
    ],
)

build_entity_sheet(
    "05 BehavioralObjective", "จุดประสงค์เชิงพฤติกรรม — สิ่งที่สังเกตได้ซึ่ง CLO ถูกย่อยลงมา (traceability เท่านั้น, ไม่กระทบคะแนน)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("cloId", "String", "FK", "→ CLO.id, onDelete: Cascade"),
        ("(cloId, number)", "-", "UQ", "-"),
        ("number", "Int", "", "-"),
        ("description", "String", "", "-"),
    ],
    sample_headers=["id", "cloId", "number", "description"],
    sample_rows=[
        ["obj-01", "clo-01", 1, "อธิบายขั้นตอนวิธี (algorithm) เป็นผังงานได้"],
        ["obj-02", "clo-01", 2, "เลือกใช้โครงสร้างข้อมูลที่เหมาะสมกับปัญหาได้"],
        ["obj-03", "clo-02", 1, "เขียน syntax พื้นฐานของ Python ได้ถูกต้อง"],
        ["obj-04", "clo-02", 2, "ใช้ฟังก์ชันและไลบรารีมาตรฐานได้"],
        ["obj-05", "clo-04", 1, "เขียน ER-Diagram จากความต้องการได้"],
        ["obj-06", "clo-04", 2, "แปลง ER-Diagram เป็นตารางเชิงสัมพันธ์ได้"],
    ],
)

build_entity_sheet(
    "06 Activity", "กิจกรรมการประเมิน — Σ weight ของทุก Activity ในวิชาเดียวกันต้อง = 100 (CR-01)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("courseId", "String", "FK", "→ Course.id, onDelete: Cascade"),
        ("name / method", "String", "", "-"),
        ("maxScore", "Float", "CK", "> 0 (DC-03) — ทุกสูตร attainment หารด้วยค่านี้"),
        ("order", "Int", "", "ลำดับแสดงผล"),
        ("weight", "Float %", "", "สัดส่วนต่อคะแนนรวมวิชา — Σ ต่อวิชา = 100 (ตรวจที่ API, NFR-12)"),
    ],
    sample_headers=["id", "courseId", "name", "method", "maxScore", "order", "weight"],
    sample_rows=[
        ["act-01", "crs-01", "สอบกลางภาค", "สอบข้อเขียน", 100, 1, 30],
        ["act-02", "crs-01", "สอบปลายภาค", "สอบข้อเขียน", 100, 2, 30],
        ["act-03", "crs-01", "งานที่มอบหมาย (Assignment)", "ประเมินชิ้นงาน", 50, 3, 20],
        ["act-04", "crs-01", "Quiz รายสัปดาห์", "สอบย่อย", 20, 4, 20],
        ["act-05", "crs-02", "สอบกลางภาค", "สอบข้อเขียน", 100, 1, 35],
        ["act-06", "crs-02", "โปรเจกต์ฐานข้อมูล", "ประเมินชิ้นงาน", 100, 2, 40],
        ["act-07", "crs-02", "สอบปลายภาค", "สอบข้อเขียน", 100, 3, 25],
        ["act-08", "crs-03", "ประเมินโดยพี่เลี้ยง (Supervisor)", "แบบประเมินการปฏิบัติงาน", 100, 1, 60],
        ["act-09", "crs-03", "รายงานสรุปผลการฝึกงาน", "ประเมินรายงาน", 100, 2, 40],
    ],
)

build_entity_sheet(
    "07 AssessmentCriteria", "junction: Activity ⇄ CLO (M:N) — weight อยู่ที่คู่ (คนละความหมายกับ Activity.weight)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("activityId", "String", "FK", "→ Activity.id, onDelete: Cascade"),
        ("cloId", "String", "FK", "→ CLO.id, onDelete: Cascade"),
        ("(activityId, cloId)", "-", "UQ", "-"),
        ("weight", "Float %", "", "สัดส่วนของ Activity นี้ที่ใช้วัด CLO นี้ — Σ ต่อ 1 activity = 100 (CR-01)"),
        ("same course", "-", "CK", "trigger บังคับ Activity และ CLO อยู่วิชาเดียวกัน (DC-04) — Prisma เขียนไม่ได้"),
    ],
    sample_headers=["id", "activityId", "cloId", "weight"],
    sample_rows=[
        ["ac-01", "act-01", "clo-01", 60],
        ["ac-02", "act-01", "clo-02", 40],
        ["ac-03", "act-02", "clo-02", 50],
        ["ac-04", "act-02", "clo-03", 50],
        ["ac-05", "act-03", "clo-01", 100],
        ["ac-06", "act-04", "clo-02", 100],
        ["ac-07", "act-05", "clo-04", 50],
        ["ac-08", "act-05", "clo-05", 50],
        ["ac-09", "act-06", "clo-04", 40],
        ["ac-10", "act-06", "clo-06", 60],
        ["ac-11", "act-07", "clo-05", 60],
        ["ac-12", "act-07", "clo-06", 40],
        ["ac-13", "act-08", "clo-07", 70],
        ["ac-14", "act-08", "clo-08", 30],
        ["ac-15", "act-09", "clo-07", 50],
        ["ac-16", "act-09", "clo-08", 50],
    ],
)

build_entity_sheet(
    "08 ObjectiveAssessment", "junction: AssessmentCriteria ⇄ BehavioralObjective (M:N) — traceability เท่านั้น ไม่กระทบคะแนนที่คำนวณ (FR-35)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("criteriaId", "String", "FK", "→ AssessmentCriteria.id, onDelete: Cascade"),
        ("objectiveId", "String", "FK", "→ BehavioralObjective.id, onDelete: Cascade"),
        ("(criteriaId, objectiveId)", "-", "UQ", "-"),
        ("objective ∈ criteria's CLO", "-", "CK", "trigger บังคับว่า objective ต้องเป็นของ CLO เดียวกับที่ criteria ผูกอยู่ (DC-06)"),
    ],
    sample_headers=["id", "criteriaId", "objectiveId"],
    sample_rows=[
        ["oa-01", "ac-01", "obj-01"],
        ["oa-02", "ac-05", "obj-02"],
        ["oa-03", "ac-02", "obj-03"],
        ["oa-04", "ac-06", "obj-04"],
        ["oa-05", "ac-07", "obj-05"],
        ["oa-06", "ac-09", "obj-06"],
    ],
)

build_entity_sheet(
    "09 Student", "แถวนี้คือ \"การลงทะเบียน\" ไม่ใช่ \"คน\" — 1 คนเรียนหลายวิชา = หลายแถว ชื่อซ้ำได้ตั้งใจ (ASM-01, Person/Enrolment split เลื่อนไป v2)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("studentCode", "String", "", "-"),
        ("name", "String", "", "-"),
        ("courseId", "String", "FK", "→ Course.id, onDelete: Cascade"),
        ("(studentCode, courseId)", "-", "UQ", "code เดียวกันต่างวิชา = คนเดียวกันลงทะเบียน 2 วิชา ถือเป็นเรื่องถูกต้อง (FR-51)"),
    ],
    sample_headers=["id", "studentCode", "name", "courseId"],
    sample_rows=[
        ["std-01", "65010001", "นายกิตติพงษ์ แสงทอง", "crs-01"],
        ["std-02", "65010002", "นางสาวจิราพร มีสุข", "crs-01"],
        ["std-03", "65010003", "นายธนกร ศรีสุข", "crs-01"],
        ["std-04", "65010004", "นางสาวปาริชาติ วงศ์ดี", "crs-01"],
        ["std-05", "65010005", "นายภานุวัฒน์ ทองสุข", "crs-01"],
        ["std-06", "65010006", "นางสาวรัตนาภรณ์ ใจงาม", "crs-02"],
        ["std-07", "65010007", "นายวรวุฒิ ชัยมงคล", "crs-02"],
        ["std-08", "65010008", "นางสาวศิริพร แก้วมณี", "crs-02"],
        ["std-09", "65010009", "นายสมพงษ์ รักเรียน", "crs-02"],
        ["std-10", "64010010", "นายอภิสิทธิ์ พูนทรัพย์", "crs-03"],
        ["std-11", "64010011", "นางสาวอรุณี สว่างใจ", "crs-03"],
        ["std-12", "64010012", "นายเอกชัย มั่นคง", "crs-03"],
    ],
)

build_entity_sheet(
    "10 Score", "junction: Student ⇄ Activity (M:N) — ไม่มีแถว = \"ยังไม่ประเมิน\" (FR-62) ไม่ใช่ 0 — สังเกตแถวที่ขาดในตัวอย่างด้านล่าง",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("studentId", "String", "FK", "→ Student.id, onDelete: Cascade"),
        ("activityId", "String", "FK", "→ Activity.id, onDelete: Cascade"),
        ("score", "Float", "CK", "0 ≤ score ≤ Activity.maxScore (DC-01, trigger) — 0 คือคะแนนจริง ห้าม insert 0 แทนค่าที่ยังไม่ให้คะแนน"),
        ("(studentId, activityId)", "-", "UQ", "-"),
        ("same course", "-", "CK", "trigger บังคับ Student และ Activity อยู่วิชาเดียวกัน (DC-05)"),
        ("uploadedAt", "DateTime", "", "auto"),
    ],
    sample_headers=["id", "studentId", "activityId", "score", "uploadedAt", "หมายเหตุ"],
    sample_rows=[
        ["sc-01", "std-01", "act-01", 78, "2026-07-01", ""],
        ["sc-02", "std-01", "act-02", 82, "2026-08-15", ""],
        ["sc-03", "std-01", "act-03", 45, "2026-06-20", ""],
        ["sc-04", "std-01", "act-04", 18, "2026-06-10", ""],
        ["sc-05", "std-02", "act-01", 65, "2026-07-01", ""],
        ["sc-06", "std-02", "act-02", 70, "2026-08-15", ""],
        ["sc-07", "std-02", "act-03", 40, "2026-06-20", ""],
        ["sc-08", "std-02", "act-04", 15, "2026-06-10", ""],
        ["sc-09", "std-03", "act-01", 55, "2026-07-01", ""],
        ["sc-10", "std-03", "act-02", 60, "2026-08-15", ""],
        ["sc-11", "std-03", "act-03", 35, "2026-06-20", ""],
        ["", "std-03", "act-04", "— (ไม่มีแถว)", "", "ยังไม่ประเมิน — ไม่ใช่ 0 (FR-62)"],
        ["sc-12", "std-04", "act-01", 90, "2026-07-01", ""],
        ["sc-13", "std-04", "act-02", 88, "2026-08-15", ""],
        ["sc-14", "std-04", "act-03", 48, "2026-06-20", ""],
        ["sc-15", "std-04", "act-04", 20, "2026-06-10", ""],
        ["sc-16", "std-05", "act-01", 40, "2026-07-01", ""],
        ["", "std-05", "act-02", "— (ไม่มีแถว)", "", "ยังไม่ประเมิน"],
        ["sc-17", "std-05", "act-03", 20, "2026-06-20", ""],
        ["sc-18", "std-05", "act-04", 10, "2026-06-10", ""],
        ["sc-19", "std-06", "act-05", 72, "2026-07-05", ""],
        ["sc-20", "std-06", "act-06", 80, "2026-08-01", ""],
        ["sc-21", "std-06", "act-07", 75, "2026-08-20", ""],
        ["sc-22", "std-07", "act-05", 58, "2026-07-05", ""],
        ["sc-23", "std-07", "act-06", 65, "2026-08-01", ""],
        ["", "std-07", "act-07", "— (ไม่มีแถว)", "", "ยังไม่ประเมิน"],
        ["sc-24", "std-08", "act-05", 88, "2026-07-05", ""],
        ["sc-25", "std-08", "act-06", 90, "2026-08-01", ""],
        ["sc-26", "std-08", "act-07", 85, "2026-08-20", ""],
        ["sc-27", "std-09", "act-05", 45, "2026-07-05", ""],
        ["sc-28", "std-09", "act-06", 50, "2026-08-01", ""],
        ["sc-29", "std-09", "act-07", 48, "2026-08-20", ""],
        ["sc-30", "std-10", "act-08", 85, "2026-09-10", ""],
        ["sc-31", "std-10", "act-09", 88, "2026-09-25", ""],
        ["sc-32", "std-11", "act-08", 90, "2026-09-10", ""],
        ["sc-33", "std-11", "act-09", 92, "2026-09-25", ""],
        ["sc-34", "std-12", "act-08", 60, "2026-09-10", ""],
        ["", "std-12", "act-09", "— (ไม่มีแถว)", "", "ยังไม่ประเมิน"],
    ],
)

build_entity_sheet(
    "11 ScoreUploadLog", "audit trail — อยู่นอกเส้นทางคำนวณทั้งหมด ไม่มีอะไรอ้างอิงกลับมาที่ตารางนี้ (NFR-16 auditability)",
    columns=[
        ("id", "String (cuid)", "PK", "-"),
        ("courseId", "String", "FK", "→ Course.id, onDelete: Cascade"),
        ("uploadedBy", "String", "FK", "→ User.id, onDelete: Restrict"),
        ("fileName", "String", "", "-"),
        ("recordsOk / recordsFail", "Int", "", "-"),
        ("createdAt", "DateTime", "", "auto — ใครทำ เมื่อไร ด้วยไฟล์อะไร ต้องตามรอยได้เสมอ"),
    ],
    sample_headers=["id", "courseId", "uploadedBy", "fileName", "recordsOk", "recordsFail", "createdAt"],
    sample_rows=[
        ["log-01", "crs-01", "usr-02", "scores_crs01_midterm.xlsx", 5, 0, "2026-07-01"],
        ["log-02", "crs-01", "usr-02", "scores_crs01_quiz.xlsx", 4, 1, "2026-06-10"],
        ["log-03", "crs-02", "usr-03", "scores_crs02_project.xlsx", 4, 0, "2026-08-01"],
        ["log-04", "crs-03", "usr-04", "scores_crs03_supervisor.xlsx", 2, 1, "2026-09-10"],
    ],
)

# ---------------------------------------------------------------------------
wb.save("docs/excel/CMAS-ER-Diagram.xlsx")
print("Saved docs/excel/CMAS-ER-Diagram.xlsx")
