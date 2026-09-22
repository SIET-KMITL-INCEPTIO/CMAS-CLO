"""
Build docs/excel/CMAS-ER-Data-Entry.xlsx — "กรอกอะไร ลงคอลัมน์ไหน".

Walks the ER diagram (docs/reference/db/mysql/cmas_app_mysql_v4.sql, v4, 13
tables — mirrored from database/schema.prisma) table by table and renders every
column as one row of the three-column layout the advisor already reads:

    หัวข้อ            what the instructor is asked for, in Thai
    ค่าที่กรอกในระบบ   the value for the worked example (03376120 ระบบฐานข้อมูล)
    เก็บที่คอลัมน์      Table.column it lands in

Rows the system fills by itself (cuid ids, timestamps, frozen statistics) are
marked green — they are shown because the ER diagram has them, not because
anyone types them. Grey rows are values the screens show but no column holds:
the sheet says which stored columns they are computed from, so a reader does not
mistake a deliberate omission for a forgotten field. Orange rows are things
มคอ.3 asks for that v1 stores nowhere at all — a real scope gap.

Course facts come from the curriculum document (03376120 ระบบฐานข้อมูล 3(2-2-5));
CLO, activities, students and every score are fabricated, and are kept identical
to docs/excel/CMAS-TQF-Data-Entry.xlsx so the two workbooks describe one course.

Run: python scripts/build-er-data-entry-workbook.py
Output: docs/excel/CMAS-ER-Data-Entry.xlsx
"""

from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

OUT = Path(__file__).resolve().parent.parent / "docs" / "excel" / "CMAS-ER-Data-Entry.xlsx"

# ---------------------------------------------------------------------------
# Palette — same tokens as build-tqf-presentation-workbook.py
# ---------------------------------------------------------------------------
C_PRIMARY = "19151B"
C_UI = "1A56C4"
C_ON = "1A1C1D"
C_MUTED = "4A454A"
C_OUTLINE = "CCC4CA"
C_CALC = "137333"
TX_GAP = "C5221F"

BG_UI = "EAF1FE"
BG_CALC = "E6F4EA"
BG_ROW = "F3F3F5"
BG_GAP = "F8CBAD"
BG_DERIV = "EDEBF2"
C_DERIV = "44405A"

thin = Side(style="thin", color=C_OUTLINE)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

F_TITLE = Font(name="Calibri", size=16, bold=True, color=C_UI)
F_SUB = Font(name="Calibri", size=10.5, italic=True, color=C_MUTED)
F_H2 = Font(name="Calibri", size=12, bold=True, color=C_PRIMARY)
F_LABEL = Font(name="Calibri", size=10, bold=True, color=C_ON)
F_BODY = Font(name="Calibri", size=10, color=C_ON)
F_MUTED = Font(name="Calibri", size=9.5, color=C_MUTED)
F_HEAD = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
F_MONO = Font(name="Consolas", size=9.5, color=C_MUTED)
F_GAP = Font(name="Calibri", size=9.5, bold=True, color=TX_GAP)
F_AUTO = Font(name="Consolas", size=9.5, color=C_CALC)
F_DERIV = Font(name="Consolas", size=9.5, italic=True, color=C_DERIV)

FILL_UI = PatternFill("solid", fgColor=C_UI)
FILL_INPUT = PatternFill("solid", fgColor=BG_UI)
FILL_AUTO = PatternFill("solid", fgColor=BG_CALC)
FILL_ROW = PatternFill("solid", fgColor=BG_ROW)
FILL_WHITE = PatternFill("solid", fgColor="FFFFFF")
FILL_GAP = PatternFill("solid", fgColor=BG_GAP)
FILL_DERIV = PatternFill("solid", fgColor=BG_DERIV)

# ---------------------------------------------------------------------------
# Row kinds
#   IN     the instructor types it
#   AUTO   the system generates it (id, timestamp, frozen statistic)
#   DERIV  shown on screen but stored in no column — computed from columns that
#          ARE stored. These rows exist so the sheet answers "ทำไมไม่มีช่องนี้"
#          instead of leaving the reader to assume the data was forgotten.
#   GAP    มคอ.3 asks for it, v1 stores it nowhere and cannot show it
# ---------------------------------------------------------------------------
IN, AUTO, DERIV, GAP = "in", "auto", "deriv", "gap"

COURSE_LINE = "03376120 ระบบฐานข้อมูล (ภาค 1/2568 หมู่ 01)"

# (sheet title, subtitle, [ (table, caption, [ (หัวข้อ, ค่า, คอลัมน์, kind) ]) ])
SHEETS = [
    ("1 ผู้ใช้และรายวิชา",
     "ตาราง User · Course · CourseInstructor — ข้อมูลที่ ADMIN กรอกตอนเปิดรายวิชา (เทียบ มคอ.3 หมวดที่ 1)",
     [
        ("User", "ผู้ใช้ระบบ — ADMIN หรือ INSTRUCTOR (ไม่มี role นักศึกษา) · 1 แถว = 1 บัญชี", [
            ("รหัสผู้ใช้ในระบบ", "usr-02", "User.id", AUTO),
            ("อีเมล (ใช้เข้าสู่ระบบ)", "wichai.k@kmitl.ac.th", "User.email", IN),
            ("ชื่อ-นามสกุล", "ผศ.วิชัย คงเจริญ", "User.name", IN),
            ("รหัสผ่าน", "•••••••• (เก็บเป็นค่าแฮช argon2 ไม่เก็บรหัสผ่านจริง)", "User.passwordHash", IN),
            ("สิทธิ์การใช้งาน", "INSTRUCTOR (อีกค่าคือ ADMIN)", "User.role", IN),
            ("สถานะใช้งาน", "ใช้งานอยู่ (ปิดบัญชีแทนการลบเสมอ)", "User.isActive", IN),
            ("วันที่สร้างบัญชี", "2025-06-01 09:00", "User.createdAt", AUTO),
            ("วันที่แก้ไขล่าสุด", "2025-06-01 09:00", "User.updatedAt", AUTO),
        ]),
        ("Course", "รายวิชา 1 แถว = 1 หมู่เรียน — รากของลำดับชั้นข้อมูลทั้งหมด", [
            ("รหัสรายวิชาในระบบ", "crs-01", "Course.id", AUTO),
            ("รหัสวิชา", "03376120", "Course.code", IN),
            ("ชื่อรายวิชา (ไทย)", "ระบบฐานข้อมูล", "Course.name", IN),
            ("ชื่อรายวิชา (อังกฤษ)", "DATABASE SYSTEM", "Course.nameEn", IN),
            ("ภาคการศึกษา", "1", "Course.semester", IN),
            ("ปีการศึกษา (พ.ศ.)", "2568", "Course.year", IN),
            ("กลุ่มเรียน (หมู่เรียน)", "01", "Course.section", IN),
            ("จำนวนหน่วยกิต", "3", "Course.credits", IN),
            ("ชั่วโมงบรรยาย / สัปดาห์", "2", "Course.lectureHours", IN),
            ("ชั่วโมงปฏิบัติ / สัปดาห์", "2", "Course.practiceHours", IN),
            ("ชั่วโมงศึกษาด้วยตนเอง / สัปดาห์", "5", "Course.selfStudyHours", IN),
            ("รูปแบบผลการเรียน", "LETTER (A–F) · อีกค่าคือ PASS_FAIL (S/U)", "Course.gradeScale", IN),
            ("วิธีตัดเกรด", "อิงเกณฑ์ (CRITERION_REFERENCED) · อีกค่าคือ อิงกลุ่ม (NORM_REFERENCED)",
             "Course.gradeMethod", IN),
            ("เกณฑ์คะแนนรวมที่ถือว่าผ่านรายวิชา (%)", "60", "Course.passCriteria", IN),
            ("เป้าหมายสัดส่วนผู้ผ่านต่อ CLO (%)", "70", "Course.classTarget", IN),
            ("วันที่สร้าง / แก้ไขล่าสุด", "2025-06-01 09:30", "Course.createdAt · Course.updatedAt", AUTO),
            ("หลักสูตรและประเภทของรายวิชา", "หมวดวิชาเฉพาะ · กลุ่มวิชาชีพเฉพาะสาขาวิชา (บังคับเรียน)",
             "— ไม่มีคอลัมน์รองรับ (ตัดชั้น Curriculum/PLO ออกเมื่อ 2026-08-04)", GAP),
            ("รายวิชาที่ต้องเรียนมาก่อน", "ไม่มี",
             "— ไม่มีคอลัมน์รองรับ (นอกขอบเขต v1)", GAP),
            ("คำอธิบายรายวิชา", "ศึกษาและปฏิบัติในหัวข้อ หลักการของระบบฐานข้อมูล …",
             "— ไม่มีคอลัมน์รองรับ (นอกขอบเขต v1)", GAP),
        ]),
        ("CourseInstructor",
         "มอบหมายผู้สอนเข้ารายวิชา — ADMIN เป็นผู้มอบหมาย (FR-22) · 1 แถว = 1 คู่ อาจารย์ × รายวิชา", [
            ("รหัสการมอบหมาย", "ci-01", "CourseInstructor.id", AUTO),
            ("รายวิชาที่มอบหมาย", COURSE_LINE, "CourseInstructor.courseId → Course.id", IN),
            ("อาจารย์ที่ถูกมอบหมาย", "ผศ.วิชัย คงเจริญ", "CourseInstructor.userId → User.id", IN),
            ("บทบาทในรายวิชา", "LEAD (ผู้ประสานงานรายวิชา — มีได้ 1 คนต่อวิชา)", "CourseInstructor.role", IN),
            ("อาจารย์ผู้สอนร่วม", "อ.สุดา พรหมมา (อีก 1 แถว)", "CourseInstructor.role = CO", IN),
            ("วันที่มอบหมาย", "2025-06-01", "CourseInstructor.assignedAt", AUTO),
        ]),
     ]),

    ("2 ผลลัพธ์การเรียนรู้",
     "ตาราง CLO · BehavioralObjective — เทียบได้กับ มคอ.3 หมวดที่ 4",
     [
        ("CLO", "ผลลัพธ์การเรียนรู้ระดับรายวิชา — วัดแบบอิงเกณฑ์เสมอ ไม่ขึ้นกับการตัดเกรด · 1 แถว = 1 ข้อ", [
            ("รหัส CLO ในระบบ", "clo-01", "CLO.id", AUTO),
            ("รายวิชาที่ CLO สังกัด", COURSE_LINE, "CLO.courseId → Course.id", IN),
            ("CLO ข้อที่", "1 (ห้ามซ้ำภายในรายวิชาเดียวกัน)", "CLO.number", IN),
            ("ข้อความผลลัพธ์การเรียนรู้", "ออกแบบฐานข้อมูลเชิงสัมพันธ์จากโจทย์ที่กำหนดได้", "CLO.description", IN),
            ("เกณฑ์ผ่านรายคน (%)", "60", "CLO.threshold", IN),
            ("ระดับพฤติกรรมตาม Bloom", "สร้างสรรค์ (CREATE) — มาจากคำกริยาที่ขึ้นต้น CLO เอง", "CLO.bloomLevel", IN),
            ("เป้าหมายผู้ผ่านเฉพาะข้อนี้ (%)", "60 (เว้นว่าง = ใช้ค่า 70 ของรายวิชา)", "CLO.classTarget", IN),
        ]),
        ("BehavioralObjective", "จุดประสงค์เชิงพฤติกรรมที่แตกย่อยจาก CLO · 1 แถว = 1 จุดประสงค์", [
            ("รหัสจุดประสงค์ในระบบ", "obj-01", "BehavioralObjective.id", AUTO),
            ("CLO ต้นทาง", "CLO 1 — ออกแบบฐานข้อมูลเชิงสัมพันธ์ฯ", "BehavioralObjective.cloId → CLO.id", IN),
            ("จุดประสงค์ข้อที่", "1 (ห้ามซ้ำภายใน CLO เดียวกัน)", "BehavioralObjective.number", IN),
            ("ข้อความจุดประสงค์", "เขียนแผนภาพ ER จากความต้องการของผู้ใช้ได้", "BehavioralObjective.description", IN),
        ]),
     ]),

    ("3 การประเมิน",
     "ตาราง Activity · AssessmentCriteria · ObjectiveAssessment — แผนการประเมินผล มคอ.3 หมวดที่ 5",
     [
        ("Activity", "กิจกรรมประเมิน — คะแนนถูกบันทึกรายกิจกรรมเท่านั้น · 1 แถว = 1 กิจกรรม", [
            ("รหัสกิจกรรมในระบบ", "act-02", "Activity.id", AUTO),
            ("รายวิชาที่กิจกรรมสังกัด", COURSE_LINE, "Activity.courseId → Course.id", IN),
            ("ชื่อกิจกรรม", "สอบกลางภาค", "Activity.name", IN),
            ("วิธีการประเมิน", "สอบข้อเขียน", "Activity.method", IN),
            ("คะแนนเต็ม", "100 (ต้องมากกว่า 0 — ทุกสูตรหารด้วยค่านี้)", "Activity.maxScore", IN),
            ("ลำดับการแสดงผล", "2", "Activity.order", IN),
            ("สัดส่วนคะแนน (%)", "30 (ทุกกิจกรรมรวมกันได้ 100)", "Activity.weight", IN),
            ("สัปดาห์ที่ประเมิน", "สัปดาห์ที่ 9",
             "— ไม่มีคอลัมน์รองรับ (มคอ.3 หมวดที่ 5 ขอ แต่ v1 ยังไม่เก็บ)", GAP),
        ]),
        ("AssessmentCriteria",
         "ผูก Activity กับ CLO พร้อมน้ำหนักต่อคู่ — สิ่งที่ระบบเพิ่มจาก มคอ.3 · 1 แถว = 1 คู่", [
            ("รหัสการผูกในระบบ", "ac-02", "AssessmentCriteria.id", AUTO),
            ("กิจกรรม", "สอบกลางภาค", "AssessmentCriteria.activityId → Activity.id", IN),
            ("CLO ที่กิจกรรมนี้วัด", "CLO 1 — ออกแบบฐานข้อมูลเชิงสัมพันธ์ฯ", "AssessmentCriteria.cloId → CLO.id", IN),
            ("น้ำหนักของคู่นี้ (%)", "40 (ทุกคู่ของกิจกรรมเดียวกันรวมกันได้ 100)", "AssessmentCriteria.weight", IN),
        ]),
        ("ObjectiveAssessment", "ตามรอยเท่านั้น — ไม่กระทบคะแนน CLO ที่คำนวณได้ · 1 แถว = 1 คู่", [
            ("รหัสการตามรอยในระบบ", "oa-01", "ObjectiveAssessment.id", AUTO),
            ("คู่กิจกรรม × CLO ต้นทาง", "สอบกลางภาค × CLO 1",
             "ObjectiveAssessment.criteriaId → AssessmentCriteria.id", IN),
            ("จุดประสงค์เชิงพฤติกรรมที่วัด", "เขียนแผนภาพ ER จากความต้องการของผู้ใช้ได้",
             "ObjectiveAssessment.objectiveId → BehavioralObjective.id", IN),
        ]),
     ]),

    ("4 นักศึกษาและคะแนน",
     "ตาราง Student · Score — งานประจำที่อาจารย์ทำจริงระหว่างภาคเรียน",
     [
        ("Student", "การลงทะเบียน 1 แถว = 1 คน 1 วิชา (ไม่ใช่ตารางบุคคล)", [
            ("รหัสการลงทะเบียนในระบบ", "std-01", "Student.id", AUTO),
            ("รหัสนักศึกษา", "65010001 (ห้ามซ้ำภายในรายวิชาเดียวกัน)", "Student.studentCode", IN),
            ("ชื่อ-นามสกุลนักศึกษา", "นายกิตติพงษ์ แสงทอง", "Student.name", IN),
            ("รายวิชาที่ลงทะเบียน", COURSE_LINE, "Student.courseId → Course.id", IN),
        ]),
        ("Score", "คะแนนดิบรายกิจกรรม — ไม่มีแถว = ยังไม่ประเมิน (ไม่ใช่ 0) · 1 แถว = 1 คน 1 กิจกรรม", [
            ("รหัสคะแนนในระบบ", "sc-02", "Score.id", AUTO),
            ("นักศึกษา", "65010001 นายกิตติพงษ์ แสงทอง", "Score.studentId → Student.id", IN),
            ("กิจกรรม", "สอบกลางภาค (เต็ม 100)", "Score.activityId → Activity.id", IN),
            ("คะแนนที่ได้", "85", "Score.score", IN),
            ("กรณียังไม่ประเมิน", "เว้นว่างไว้ — ระบบไม่สร้างแถว (ต่างจากการกรอก 0)",
             "— ไม่มีแถวใน Score (โดยตั้งใจ)", GAP),
            ("วันที่บันทึกคะแนน", "2025-08-01 14:20", "Score.uploadedAt", AUTO),
        ]),
     ]),

    ("5 การตัดเกรด",
     "ตาราง GradeBand · StudentGrade — เกณฑ์กับผล ส่วนวิธีตัดเก็บเป็นคอลัมน์เดียวบน Course",
     [
        ("Course.gradeMethod",
         "วิธีตัดเกรดเป็นคอลัมน์บนตาราง Course ไม่ใช่ตารางแยก (แสดงซ้ำจากแผ่นที่ 1 ให้เห็นภาพครบ)", [
            ("วิธีตัดเกรด", "อิงเกณฑ์ (CRITERION_REFERENCED) · อีกค่าคือ อิงกลุ่ม (NORM_REFERENCED)",
             "Course.gradeMethod", IN),
            ("หน่วยของเส้นแบ่งเกรด", "ร้อยละ เมื่อตัดอิงเกณฑ์ · T-score เมื่อตัดอิงกลุ่ม",
             "— ไม่เก็บเป็นคอลัมน์ · ตามมาจากวิธีตัดโดยตรง", DERIV),
        ]),
        ("GradeBand", "ช่วงเกรดของรายวิชา — เรียงจาก minValue และต้องมีช่วงล่างสุดเสมอ · 1 แถว = 1 เกรด", [
            ("รหัสช่วงเกรดในระบบ", "gb-01", "GradeBand.id", AUTO),
            ("รายวิชา", COURSE_LINE, "GradeBand.courseId → Course.id", IN),
            ("ตัวอักษรเกรด", "A (หรือ S / U สำหรับรายวิชาแบบ PASS_FAIL)", "GradeBand.grade", IN),
            ("คะแนนขั้นต่ำของเกรดนี้", "80 (อ่านตามวิธีตัดที่รายวิชาเลือกไว้)", "GradeBand.minValue", IN),
            ("ลำดับของเกรด", "A สูงสุด ไล่ลงถึง F",
             "— ไม่เก็บเป็นคอลัมน์ · เรียงจาก minValue มากไปน้อย", DERIV),
        ]),
        ("StudentGrade", "เกรดสุดท้ายรายคน — 1 แถว = 1 นักศึกษา 1 รายวิชา", [
            ("รหัสเกรดในระบบ", "sg-01", "StudentGrade.id", AUTO),
            ("นักศึกษา", "65010001 นายกิตติพงษ์ แสงทอง (รายวิชาติดมากับนักศึกษาอยู่แล้ว)",
             "StudentGrade.studentId → Student.id", AUTO),
            ("คะแนนรวมถ่วงน้ำหนัก (0-100)", "83.60 (บันทึกค่าจริงไว้ตอนตัดเกรด)",
             "StudentGrade.totalPercent", AUTO),
            ("เกรดที่ได้", "A", "StudentGrade.grade", AUTO),
            ("เหตุผลการปรับเกรด", "เว้นว่าง = ใช้เกรดที่ระบบคำนวณ · กรอกแล้ว = ปรับมือ (ต้องมีเหตุผลเสมอ)",
             "StudentGrade.overrideReason", IN),
            ("คะแนนมาตรฐาน T / Z และค่าสถิติของห้อง", "อิงกลุ่มเท่านั้น — คำนวณตอนกดตัดเกรด แล้วไม่เก็บ",
             "— ไม่เก็บเป็นคอลัมน์ · ผลที่เก็บคือตัวเกรด ไม่ใช่ที่มาของเกรด", DERIV),
        ]),
     ]),

    ("6 การตามรอย",
     "ตาราง ScoreUploadLog — อยู่นอกเส้นทางการคำนวณ ไม่มีตารางใดอ้างถึงแถวเหล่านี้",
     [
        ("ScoreUploadLog", "ตามรอยการนำเข้าคะแนน — ใครทำ เมื่อไร ด้วยไฟล์อะไร · 1 แถว = 1 ครั้งที่อัปโหลด", [
            ("รหัสบันทึกในระบบ", "log-01", "ScoreUploadLog.id", AUTO),
            ("รายวิชา", COURSE_LINE, "ScoreUploadLog.courseId → Course.id", AUTO),
            ("ผู้อัปโหลด", "ผศ.วิชัย คงเจริญ", "ScoreUploadLog.uploadedBy → User.id", AUTO),
            ("ชื่อไฟล์ที่อัปโหลด", "scores_midterm_03376120.xlsx", "ScoreUploadLog.fileName", IN),
            ("จำนวนแถวที่นำเข้าสำเร็จ", "7", "ScoreUploadLog.recordsOk", AUTO),
            ("จำนวนแถวที่ผิดพลาด", "1", "ScoreUploadLog.recordsFail", AUTO),
            ("เวลาที่อัปโหลด", "2025-08-01 14:20", "ScoreUploadLog.createdAt", AUTO),
        ]),
     ]),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
wb = Workbook()


def set_widths(ws, widths):
    for col, w in widths.items():
        ws.column_dimensions[col].width = w


def header_row(ws, row, headers, start_col=2):
    for i, h in enumerate(headers):
        c = ws.cell(row=row, column=start_col + i, value=h)
        c.font = F_HEAD
        c.fill = FILL_UI
        c.border = BORDER
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[row].height = 24


def data_cell(ws, row, col, value, *, zebra=False, font=None, fill=None, align=None):
    c = ws.cell(row=row, column=col, value=value)
    c.font = font or F_BODY
    c.border = BORDER
    c.fill = fill or (FILL_ROW if zebra else FILL_WHITE)
    c.alignment = align or Alignment(vertical="center", wrap_text=True)
    return c


# ---------------------------------------------------------------------------
# สารบัญ
# ---------------------------------------------------------------------------
ws = wb.active
ws.title = "สารบัญ"
ws.sheet_view.showGridLines = False
set_widths(ws, {"A": 3, "B": 26, "C": 34, "D": 56, "E": 12})

ws["A1"] = "แผนที่การกรอกข้อมูลตามแผนภาพ ER"
ws["A1"].font = F_TITLE
ws["A2"] = ("อ่านจาก docs/reference/db/mysql/cmas_app_mysql_v4.sql (13 ตาราง) "
            "· ตัวอย่างค่าใช้รายวิชา 03376120 ระบบฐานข้อมูล ภาคการศึกษาที่ 1/2568 หมู่ 01")
ws["A2"].font = F_SUB

r = 4
header_row(ws, r, ["แผ่นงาน", "ตารางในแผนภาพ ER", "ครอบคลุมอะไร", "จำนวนหัวข้อ"])
r += 1
for i, (sheet_name, subtitle, tables) in enumerate(SHEETS):
    z = i % 2 == 1
    n = sum(len(rows) for _, _, rows in tables)
    data_cell(ws, r, 2, sheet_name, zebra=z, font=F_LABEL)
    data_cell(ws, r, 3, " · ".join(t for t, _, _ in tables), zebra=z, font=F_MONO)
    data_cell(ws, r, 4, subtitle.split("—")[-1].strip(), zebra=z)
    data_cell(ws, r, 5, n, zebra=z, align=Alignment(horizontal="center", vertical="center"))
    r += 1

r += 1
ws.cell(row=r, column=2, value="ความหมายของสี").font = F_H2
r += 1
header_row(ws, r, ["สี", "หมายความว่า"])
r += 1
legend = [
    ("ฟ้าอ่อน", "ผู้ใช้เป็นผู้กรอกค่านี้เอง", FILL_INPUT, F_BODY),
    ("เขียวอ่อน", "ระบบสร้างหรือคำนวณให้อัตโนมัติ — แสดงไว้เพราะมีอยู่ในแผนภาพ ER ไม่ใช่เพราะต้องกรอก",
     FILL_AUTO, F_BODY),
    ("เทา", "หน้าจอแสดงค่านี้ได้ แต่ไม่มีคอลัมน์เก็บ — คำนวณจากคอลัมน์ที่เก็บอยู่แล้ว "
            "(ลดคอลัมน์ตารางตัดเกรด 2026-09-05)", FILL_DERIV, F_BODY),
    ("ส้ม", "มคอ.3 ขอข้อมูลนี้ แต่ v1 ไม่มีคอลัมน์รองรับ — เป็นช่องว่างของขอบเขต ไม่ใช่ความผิดพลาด",
     FILL_GAP, F_GAP),
]
for name, meaning, fill, font in legend:
    data_cell(ws, r, 2, name, fill=fill, font=font,
              align=Alignment(horizontal="center", vertical="center"))
    data_cell(ws, r, 3, meaning)
    ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=5)
    r += 1

r += 1
c = ws.cell(row=r, column=2,
            value="ที่มา: database/schema.prisma เป็นต้นฉบับจริง · ไฟล์ MySQL v4 เป็นสำเนาสำหรับวาดแผนภาพ "
                  "เมื่อสองไฟล์ไม่ตรงกันให้ยึด schema.prisma  ·  ค่าตัวอย่างของ CLO กิจกรรม รายชื่อนักศึกษา "
                  "และคะแนน เป็นข้อมูลสมมติชุดเดียวกับ CMAS-TQF-Data-Entry.xlsx")
c.font = F_MUTED
c.alignment = Alignment(vertical="center", wrap_text=True)
ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=5)
ws.row_dimensions[r].height = 44

# ---------------------------------------------------------------------------
# One sheet per group of tables
# ---------------------------------------------------------------------------
for sheet_name, subtitle, tables in SHEETS:
    ws = wb.create_sheet(sheet_name)
    ws.sheet_view.showGridLines = False
    set_widths(ws, {"A": 3, "B": 34, "C": 62, "D": 48})

    ws["A1"] = sheet_name.split(" ", 1)[1]
    ws["A1"].font = F_TITLE
    ws["A2"] = subtitle
    ws["A2"].font = F_SUB

    r = 4
    for table, caption, rows in tables:
        ws.cell(row=r, column=2, value=f"ตาราง {table}").font = F_H2
        c = ws.cell(row=r, column=3, value=caption)
        c.font = F_MUTED
        c.alignment = Alignment(vertical="center", wrap_text=True)
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=4)
        r += 1

        header_row(ws, r, ["หัวข้อ", "ค่าที่กรอกในระบบ", "เก็บที่คอลัมน์"])
        r += 1

        for i, (label, value, column, kind) in enumerate(rows):
            z = i % 2 == 1
            data_cell(ws, r, 2, label, zebra=z, font=F_LABEL)
            value_fill = {GAP: FILL_GAP, AUTO: FILL_AUTO,
                          DERIV: FILL_DERIV}.get(kind, FILL_INPUT)
            column_font = {GAP: F_GAP, AUTO: F_AUTO,
                           DERIV: F_DERIV}.get(kind, F_MONO)
            data_cell(ws, r, 3, value, zebra=z, fill=value_fill)
            data_cell(ws, r, 4, column, zebra=z, font=column_font,
                      fill=FILL_GAP if kind == GAP else
                           (FILL_DERIV if kind == DERIV else None))
            r += 1
        r += 1

    ws.freeze_panes = "B5"

wb.save(OUT)

n_tables = sum(len(t) for _, _, t in SHEETS)
n_rows = sum(len(rows) for _, _, tables in SHEETS for _, _, rows in tables)
n_gap = sum(1 for _, _, tables in SHEETS for _, _, rows in tables
            for row in rows if row[3] == GAP)
n_deriv = sum(1 for _, _, tables in SHEETS for _, _, rows in tables
              for row in rows if row[3] == DERIV)
print(f"wrote {OUT}")
print(f"{len(SHEETS)} sheets - {n_tables} tables - {n_rows} rows - "
      f"{n_deriv} derived - {n_gap} unmapped")
