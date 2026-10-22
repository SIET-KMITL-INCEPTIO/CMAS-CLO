"""
Build docs/excel/api/CMAS-API-Endpoints.xlsx — every endpoint of the CMAS API on one
filterable sheet, with the rules and security measures beside it.

  * Endpoints : one row per endpoint — what it does, who may call it, which
                capability it needs, its status and the phase it is built in
  * Rules     : A-1..A-13, the rules every endpoint follows
  * Security  : S-1..S-11
  * README    : how to read the columns, counts, open decisions

Sources: docs/markdown/dev/architecture/api-design.md §3 (the contract) and
docs/markdown/dev/planning/api-design-plan.md §3-§6 (proposed additions).
The endpoint list lives in this file because the workbook adds columns the
contract does not have (description, capability, phase). To stop the two from
drifting, the script re-reads api-design.md §3 and fails if a contract row is
missing here or a "contract" row here is no longer in the contract.

Run: python scripts/build-api-endpoints-workbook.py
Output: docs/excel/api/CMAS-API-Endpoints.xlsx
"""

import io
import json
import re
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "docs" / "markdown" / "dev" / "architecture" / "api-design.md"
OUT = ROOT / "docs" / "excel" / "api" / "CMAS-API-Endpoints.xlsx"
# Machine-readable copy of the same rows, read by scripts/check-api-design.py and by
# app/server/src/api-contract.test.ts — the two checks of the design against the system.
JSON_OUT = ROOT / "docs" / "excel" / "api" / "api-endpoints.json"
PREFIX = "/api/v1"

# ---------------------------------------------------------------------------
# Palette — same family as the other workbooks in docs/excel
# ---------------------------------------------------------------------------
C_PRIMARY = "19151B"
C_HEAD = "44405A"
C_ON = "1A1C1D"
C_MUTED = "4A454A"
C_OUTLINE = "CCC4CA"
BG_ROW = "F3F3F5"

thin = Side(style="thin", color=C_OUTLINE)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

F_TITLE = Font(name="Calibri", size=16, bold=True, color=C_PRIMARY)
F_SUB = Font(name="Calibri", size=10.5, italic=True, color=C_MUTED)
F_H2 = Font(name="Calibri", size=12, bold=True, color=C_PRIMARY)
F_BODY = Font(name="Calibri", size=10, color=C_ON)
F_BOLD = Font(name="Calibri", size=10, bold=True, color=C_ON)
F_HEAD = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
F_MONO = Font(name="Consolas", size=10, color=C_ON)

FILL_HEAD = PatternFill("solid", fgColor=C_HEAD)
FILL_ROW = PatternFill("solid", fgColor=BG_ROW)

# (background, text) — a method or status is read by colour before it is read
METHOD_TONE = {
    "GET": ("E6F4EA", "137333"),
    "POST": ("EAF1FE", "1A56C4"),
    "PUT": ("FEF7E0", "8A5A00"),
    "PATCH": ("FEF7E0", "8A5A00"),
    "DELETE": ("FCE8E6", "C5221F"),
}
ST_DONE, ST_CONTRACT, ST_NEW, ST_LATER = "ทำแล้ว", "contract", "เสนอใหม่", "หลัง v1"
CAUTION_TONE = {"สูง": ("FCE8E6", "C5221F"), "กลาง": ("FEF7E0", "8A5A00"), "ต่ำ": ("E6F4EA", "137333")}
STATUS_TONE = {
    ST_DONE: ("E6F4EA", "137333"),
    ST_CONTRACT: ("EDEBF2", "44405A"),
    ST_NEW: ("EAF1FE", "1A56C4"),
    ST_LATER: ("F3F3F5", "4A454A"),
}

READ = "อ่าน"
ADMIN, ANY, BOTH, NONE = "ADMIN", "ผู้สอนของรายวิชา", "ADMIN · ผู้สอน", "ไม่ต้องล็อกอิน"
LOGGED = "ผู้ใช้ที่ล็อกอิน"
URL, RESOLVE, FILTER, NO = "จาก URL", "resolve จาก id", "กรองในตัว", "—"

# ---------------------------------------------------------------------------
# Endpoints
# (group, method, path, what it does, role, course scope, capability, FR/CR,
#  status, phase, issue, needs migration 0008, note)
# ---------------------------------------------------------------------------
G_AUTH, G_USER, G_COURSE = "1 เข้าสู่ระบบ", "2 บัญชีผู้ใช้", "3 รายวิชา"
G_CLO, G_ACT, G_STU = "4 CLO และจุดประสงค์", "5 กิจกรรมและเกณฑ์", "6 นักศึกษา"
G_SCORE, G_GRADE, G_DASH = "7 คะแนนและ Excel", "8 ตัดเกรด", "9 แดชบอร์ด"

E = [
    # ── 1 เข้าสู่ระบบ ───────────────────────────────────────────────────────
    (G_AUTH, "POST", "/auth/google", "เข้าสู่ระบบด้วย Google ตรวจ ID token ที่เซิร์ฟเวอร์", NONE, NO, NO, "FR-01, FR-08", ST_DONE, "—", "", "", ""),
    (G_AUTH, "POST", "/auth/login", "เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน", NONE, NO, NO, "FR-01, FR-03, FR-04", ST_LATER, "—", "", "", "รอ D-5"),
    (G_AUTH, "POST", "/auth/refresh", "ขอ access token ใหม่ด้วย refresh token", NONE, NO, NO, "FR-01", ST_DONE, "P0", "", "✓", "ตาราง RefreshToken ตาม D-2"),
    (G_AUTH, "POST", "/auth/logout", "ออกจากระบบและเพิกถอน refresh token", LOGGED, NO, NO, "FR-01", ST_DONE, "P0", "", "✓", "ตาราง RefreshToken ตาม D-2"),
    (G_AUTH, "GET", "/auth/me", "ข้อมูลและบทบาทของผู้ใช้ที่ล็อกอินอยู่", LOGGED, NO, READ, "NFR-19", ST_DONE, "P0", "", "", ""),
    (G_AUTH, "PATCH", "/auth/password", "เปลี่ยนรหัสผ่านของตัวเอง", LOGGED, NO, NO, "FR-09", ST_LATER, "—", "", "", "รอ D-5"),
    # ── 2 บัญชีผู้ใช้ ────────────────────────────────────────────────────────
    (G_USER, "GET", "/users", "รายการบัญชี กรองด้วย ?status=PENDING หรือ ACTIVE", ADMIN, NO, "user.manage", "FR-05, FR-08b", ST_DONE, "—", "", "", ""),
    (G_USER, "PATCH", "/users/:id/approve", "อนุมัติบัญชีที่รออนุมัติ", ADMIN, NO, "user.manage", "FR-08b", ST_DONE, "—", "", "", "โค้ดใช้ :id ไม่ใช่ :userId"),
    (G_USER, "POST", "/users", "สร้างบัญชีผู้ใช้", ADMIN, NO, "user.manage", "FR-05", ST_LATER, "—", "", "", "รอ D-5"),
    (G_USER, "GET", "/users/:userId", "รายละเอียดบัญชีหนึ่งคน", ADMIN, NO, "user.manage", "FR-05", ST_DONE, "P2", "", "", ""),
    (G_USER, "PATCH", "/users/:userId", "แก้ชื่อหรือบทบาทของบัญชี", ADMIN, NO, "user.manage", "FR-05", ST_DONE, "P2", "", "", ""),
    (G_USER, "PATCH", "/users/:userId/status", "เปิดหรือปิดการใช้งานบัญชี", ADMIN, NO, "user.manage", "FR-03, FR-06", ST_DONE, "P2", "", "", ""),
    (G_USER, "POST", "/users/:userId/reset-password", "รีเซ็ตรหัสผ่านให้ผู้ใช้", ADMIN, NO, "user.manage", "FR-07", ST_LATER, "—", "", "", "รอ D-5 · ต้องมี mustChangePassword (G-4)"),
    (G_USER, "GET", "/users/:userId/auth-events", "ประวัติบัญชี รวมการถูกปฏิเสธสิทธิ์", ADMIN, NO, "user.manage", "FR-22b, UC 1.6", ST_DONE, "P5", "", "✓", ""),
    # ── 3 รายวิชา ───────────────────────────────────────────────────────────
    (G_COURSE, "GET", "/courses", "รายวิชาที่ผู้เรียกมองเห็น", LOGGED, FILTER, READ, "FR-24, FR-25", ST_DONE, "P2", "#6", "", ""),
    (G_COURSE, "POST", "/courses", "สร้างรายวิชา ผู้สร้างเป็นผู้สอนใน transaction เดียวกัน", BOTH, NO, "course.create", "FR-20, FR-21, FR-22c, FR-27, FR-28", ST_DONE, "P2", "#6", "", ""),
    (G_COURSE, "GET", "/courses/:courseId", "รายละเอียดรายวิชา", ANY, URL, READ, "FR-25", ST_DONE, "P2", "#6", "", ""),
    (G_COURSE, "PATCH", "/courses/:courseId", "แก้ข้อมูลและการตั้งค่ารายวิชา (เกณฑ์ผ่าน วิธีตัดเกรด)", ANY, URL, "course.settings", "FR-20, FR-47, FR-90", ST_DONE, "P2", "#6", "", ""),
    (G_COURSE, "DELETE", "/courses/:courseId", "ลบรายวิชา ต้องส่ง ?confirm=true", BOTH, URL, "course.delete", "FR-26", ST_DONE, "P2", "#6", "", ""),
    (G_COURSE, "GET", "/courses/:courseId/impact", "จำนวนข้อมูลที่จะหายถ้าลบรายวิชา", ANY, URL, READ, "FR-26", ST_DONE, "P2", "#6", "", ""),
    (G_COURSE, "GET", "/courses/:courseId/instructors", "รายชื่อผู้สอนของรายวิชา", ANY, URL, READ, "FR-22", ST_DONE, "P2", "#6", "", ""),
    (G_COURSE, "POST", "/courses/:courseId/instructors", "เพิ่มผู้สอนเข้ารายวิชา", BOTH, URL, "staff.write", "FR-22, FR-23", ST_DONE, "P2", "#6", "", ""),
    (G_COURSE, "DELETE", "/courses/:courseId/instructors/:userId", "เอาผู้สอนออก คนสุดท้ายเอาออกไม่ได้ (422)", BOTH, URL, "staff.write", "FR-23", ST_DONE, "P2", "#6", "", "S-9"),
    (G_COURSE, "POST", "/courses/:courseId/duplicate", "คัดลอกรายวิชาเป็นรายวิชาใหม่", BOTH, URL, "course.create", "ต้นแบบ", ST_DONE, "P2", "", "", ""),
    # ── 4 CLO และจุดประสงค์ ─────────────────────────────────────────────────
    (G_CLO, "GET", "/courses/:courseId/clos", "รายการ CLO พร้อมจุดประสงค์", ANY, URL, READ, "FR-30, FR-32", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "POST", "/courses/:courseId/clos", "เพิ่ม CLO ต้องเลือกระดับ Bloom เอง ไม่มีค่าตั้งต้น", ANY, URL, "clo.write", "FR-30, FR-31, FR-99, FR-100", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "PATCH", "/courses/:courseId/clos/reorder", "เรียงลำดับ CLO ใหม่", ANY, URL, "clo.write", "FR-31", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "PATCH", "/clos/:cloId", "แก้ CLO", ANY, RESOLVE, "clo.write", "FR-30, FR-99, FR-100", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "DELETE", "/clos/:cloId", "ลบ CLO เตือนถ้ามีคะแนนอ้างอิง", ANY, RESOLVE, "clo.write", "FR-36", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "GET", "/clos/:cloId/objectives", "จุดประสงค์เชิงพฤติกรรมของ CLO", ANY, RESOLVE, READ, "FR-33", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "POST", "/clos/:cloId/objectives", "เพิ่มจุดประสงค์", ANY, RESOLVE, "clo.write", "FR-33", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "PATCH", "/objectives/:objectiveId", "แก้จุดประสงค์", ANY, RESOLVE, "clo.write", "FR-33", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "DELETE", "/objectives/:objectiveId", "ลบจุดประสงค์", ANY, RESOLVE, "clo.write", "FR-33", ST_CONTRACT, "P3", "#7", "", ""),
    # ── 5 กิจกรรมและเกณฑ์ ───────────────────────────────────────────────────
    (G_ACT, "GET", "/courses/:courseId/activities", "รายการกิจกรรมประเมิน", ANY, URL, READ, "FR-40, FR-43", ST_CONTRACT, "P3", "#7", "✓", ""),
    (G_ACT, "POST", "/courses/:courseId/activities", "เพิ่มกิจกรรม", ANY, URL, "activity.write", "FR-40, FR-41", ST_CONTRACT, "P3", "#7", "✓", ""),
    (G_ACT, "PATCH", "/courses/:courseId/activities/reorder", "เรียงลำดับกิจกรรมใหม่", ANY, URL, "activity.write", "FR-42", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "PATCH", "/activities/:activityId", "แก้กิจกรรม (ชื่อ คะแนนเต็ม น้ำหนัก)", ANY, RESOLVE, "activity.write", "FR-40, FR-41", ST_CONTRACT, "P3", "#7", "✓", ""),
    (G_ACT, "DELETE", "/activities/:activityId", "ลบกิจกรรม", ANY, RESOLVE, "activity.delete", "FR-40", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "GET", "/courses/:courseId/criteria", "เมทริกซ์ กิจกรรม × จุดประสงค์ พร้อมคำเตือน", ANY, URL, READ, "FR-44, FR-45, FR-48, FR-102", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "PUT", "/courses/:courseId/criteria", "บันทึกเมทริกซ์ทั้งชุด น้ำหนักไม่ครบ 100 ตอบ 422", ANY, URL, "activity.write", "FR-34, FR-44…FR-46", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "POST", "/activities/:activityId/duplicate", "คัดลอกกิจกรรม", ANY, RESOLVE, "activity.write", "ต้นแบบ", ST_NEW, "P3", "", "", ""),
    (G_ACT, "PUT", "/courses/:courseId/group-weights", "น้ำหนักรายกลุ่มของกิจกรรม", ANY, URL, "activity.write", "ต้นแบบ N1/N2", ST_NEW, "P5", "", "✓", ""),
    (G_ACT, "POST", "/activities/:activityId/close", "ปิดรับคะแนน ช่องว่างหลังปิดคือ \"ขาดส่ง\"", ANY, RESOLVE, "score.edit", "CR-05.1", ST_NEW, "P5", "#8", "✓", ""),
    (G_ACT, "POST", "/activities/:activityId/reopen", "เปิดรับคะแนนอีกครั้ง", ANY, RESOLVE, "score.edit", "CR-05.1", ST_NEW, "P5", "#8", "✓", ""),
    # ── 6 นักศึกษา ──────────────────────────────────────────────────────────
    (G_STU, "GET", "/courses/:courseId/students", "รายชื่อนักศึกษา รวมผู้ที่ถอนรายวิชา", ANY, URL, READ, "FR-50", ST_CONTRACT, "P5", "#8", "", ""),
    (G_STU, "POST", "/courses/:courseId/students", "เพิ่มนักศึกษา รหัสซ้ำในวิชาตอบ 409", ANY, URL, "student.write", "FR-50, FR-51", ST_CONTRACT, "P5", "#8", "", ""),
    (G_STU, "PATCH", "/students/:studentId", "แก้ข้อมูลนักศึกษา", ANY, RESOLVE, "student.write", "FR-50", ST_CONTRACT, "P5", "#8", "", ""),
    (G_STU, "DELETE", "/students/:studentId", "ลบนักศึกษาและคะแนนทั้งหมด", ANY, RESOLVE, "student.delete", "FR-53", ST_CONTRACT, "P5", "#8", "", ""),
    (G_STU, "GET", "/courses/:courseId/students/template", "ดาวน์โหลดแบบฟอร์มรายชื่อ", ANY, URL, "score.export", "FR-52", ST_CONTRACT, "P5", "#8", "", ""),
    (G_STU, "POST", "/courses/:courseId/students/import/preview", "ตรวจไฟล์รายชื่อ ยังไม่บันทึก", ANY, URL, "student.write", "FR-52, FR-67", ST_CONTRACT, "P5", "#8", "", "S-6"),
    (G_STU, "POST", "/courses/:courseId/students/import/commit", "บันทึกรายชื่อที่ตรวจผ่าน", ANY, URL, "student.write", "FR-52, FR-68", ST_CONTRACT, "P5", "#8", "", "S-6"),
    (G_STU, "POST", "/students/:studentId/withdraw", "ถอนรายวิชา ออกจากตัวหารทุกตัว คะแนนยังเก็บไว้", ANY, RESOLVE, "student.write", "CR-05.1, CR-10", ST_NEW, "P5", "#8", "✓", ""),
    (G_STU, "POST", "/students/:studentId/restore", "คืนสถานะนักศึกษาที่ถอน", ANY, RESOLVE, "student.write", "CR-05.1", ST_NEW, "P5", "#8", "✓", ""),
    (G_STU, "PUT", "/students/:studentId/remediation-plans/:cloId", "บันทึกแผนพัฒนาผู้เรียนของนักศึกษาหนึ่งคนใน CLO หนึ่งข้อ", ANY, RESOLVE, "student.write", "ต้นแบบ 5.7 (ความเห็นอาจารย์ 2569-10-19)", ST_NEW, "P5", "", "✓", "ตาราง RemediationPlan"),
    (G_STU, "DELETE", "/students/:studentId/remediation-plans/:cloId", "ลบแผนพัฒนาผู้เรียน", ANY, RESOLVE, "student.write", "ต้นแบบ 5.7", ST_NEW, "P5", "", "✓", "ตาราง RemediationPlan"),
    # ── 7 คะแนนและ Excel ────────────────────────────────────────────────────
    (G_SCORE, "GET", "/courses/:courseId/scores", "ตารางคะแนน ยังไม่ประเมิน = null ไม่ใช่ 0", ANY, URL, READ, "FR-60, FR-62, FR-64", ST_CONTRACT, "P5", "#8", "", ""),
    (G_SCORE, "PUT", "/courses/:courseId/scores", "บันทึกคะแนนหลายช่อง รับตัวเลข null หรือ EXCUSED", ANY, URL, "score.edit", "FR-61…FR-63, CR-05.1", ST_CONTRACT, "P5", "#8", "✓", "เพิ่ม EXCUSED และ from (D-3) · A-12"),
    (G_SCORE, "GET", "/courses/:courseId/scores/template", "ดาวน์โหลดแบบฟอร์มคะแนน", ANY, URL, "score.export", "FR-66", ST_CONTRACT, "P5", "#8", "", ""),
    (G_SCORE, "POST", "/courses/:courseId/scores/import/preview", "ตรวจไฟล์คะแนนรายแถว ยังไม่บันทึก", ANY, URL, "score.import", "FR-67, FR-69", ST_CONTRACT, "P5", "#8", "", "S-6"),
    (G_SCORE, "POST", "/courses/:courseId/scores/import/commit", "บันทึกเฉพาะแถวที่ผ่าน เขียน log การนำเข้า", ANY, URL, "score.import", "FR-68, FR-71", ST_CONTRACT, "P5", "#8", "", "S-6 · A-12"),
    (G_SCORE, "GET", "/courses/:courseId/scores/export", "ส่งออกคะแนนเป็น Excel", ANY, URL, "score.export", "FR-70", ST_CONTRACT, "P5", "#8", "", "S-7"),
    (G_SCORE, "GET", "/courses/:courseId/uploads", "ประวัติการนำเข้าไฟล์", ANY, URL, READ, "FR-71, FR-72", ST_CONTRACT, "P5", "#8", "", ""),
    (G_SCORE, "GET", "/uploads/:uploadId/errors", "แถวที่นำเข้าไม่ผ่านของการนำเข้าหนึ่งครั้ง", ANY, RESOLVE, READ, "FR-68, FR-72", ST_CONTRACT, "P5", "#8", "✓", "ต้องมี UploadReject (G-5)"),
    (G_SCORE, "GET", "/courses/:courseId/score-changes", "ประวัติการแก้คะแนน ใคร เมื่อไร จากอะไรเป็นอะไร", ANY, URL, READ, "NFR-16", ST_NEW, "P5", "#8", "✓", ""),
    # ── 8 ตัดเกรด ───────────────────────────────────────────────────────────
    (G_GRADE, "GET", "/courses/:courseId/grading", "ช่วงเกรด ผลเกรดสด สถิติ และคำเตือน", ANY, URL, READ, "FR-90, FR-97", ST_NEW, "P6", "", "", ""),
    (G_GRADE, "PUT", "/courses/:courseId/grade-bands", "บันทึกช่วงเกรดทั้งชุด เส้นแบ่งห้ามซ้ำ", ANY, URL, "band.write", "FR-91, FR-92", ST_NEW, "P6", "", "", ""),
    (G_GRADE, "POST", "/courses/:courseId/grading/run", "คำนวณและตรึงเกรด ปฏิเสธเมื่อ SD = 0 หรือ n < 2", ANY, URL, "grading.run", "FR-94, FR-96, CR-10, CR-11", ST_NEW, "P6", "", "", "SD ประชากร (หารด้วย n)"),
    (G_GRADE, "DELETE", "/courses/:courseId/grading", "ยกเลิกการตรึงเกรด", ANY, URL, "grading.run", "CR-11", ST_NEW, "P6", "", "", ""),
    (G_GRADE, "PUT", "/students/:studentId/grade-override", "ปรับเกรดรายบุคคล ต้องระบุเหตุผล", ANY, RESOLVE, "grade.override", "FR-95", ST_NEW, "P6", "", "", ""),
    (G_GRADE, "DELETE", "/students/:studentId/grade-override", "ยกเลิกการปรับเกรด", ANY, RESOLVE, "grade.override", "FR-95", ST_NEW, "P6", "", "", ""),
    (G_GRADE, "GET", "/courses/:courseId/grades/export", "ส่งออกผลการเรียนเป็น Excel", ANY, URL, "results.export", "FR-87", ST_NEW, "P6", "", "", "S-7"),
    # ── 9 แดชบอร์ด ──────────────────────────────────────────────────────────
    (G_DASH, "GET", "/dashboard/overview", "ภาพรวมทุกรายวิชาของผู้เรียก", LOGGED, FILTER, READ, "FR-80", ST_CONTRACT, "P6", "#9", "", ""),
    (G_DASH, "GET", "/courses/:courseId/dashboard/attainment", "สัดส่วนผู้ผ่านราย CLO", ANY, URL, READ, "FR-81, FR-82, FR-84", ST_CONTRACT, "P6", "#9", "", ""),
    (G_DASH, "GET", "/courses/:courseId/dashboard/at-risk", "นักศึกษาที่ต้องได้รับความช่วยเหลือ", ANY, URL, READ, "FR-83", ST_CONTRACT, "P6", "#9", "", ""),
    (G_DASH, "GET", "/courses/:courseId/dashboard/students/:studentId", "รายงานรายบุคคล", ANY, URL, READ, "FR-85, FR-86", ST_CONTRACT, "P6", "#9", "", ""),
    (G_DASH, "GET", "/courses/:courseId/dashboard/export", "ส่งออกรายงานผลสัมฤทธิ์", ANY, URL, "results.export", "FR-87", ST_CONTRACT, "P6", "#9", "", "S-7"),
]

HEAD = ["#", "กลุ่ม", "Method", "Path", "ทำอะไร", "ใครเรียกได้", "ตรวจสิทธิ์รายวิชา", "Capability",
        "FR / CR", "สถานะ", "ช่วงงาน", "Issue", "ต้องมี 0008", "หมายเหตุ",
        "ประเภทการทำงาน", "ผลต่อข้อมูล", "ประเภทสิทธิ์", "ระดับความระวัง"]
WIDTH = [5, 22, 9, 54, 48, 20, 17, 16, 24, 11, 9, 7, 11, 36, 22, 24, 24, 12]

RULES = [
    ("A-1", "Resource เป็นคำนามพหูพจน์ kebab-case ไม่มี verb ใน URL ยกเว้น action ที่ไม่ใช่ CRUD", "api-design §1.1"),
    ("A-2", "ทุก route ที่รับ :courseId เรียก assertCourseAccess() ก่อนแตะข้อมูล ผิดได้ 404 ไม่ใช่ 403", "NFR-07"),
    ("A-3", "Leaf resource (:cloId, :activityId, :studentId) resolve หา courseId ก่อน แล้วจึงตรวจสิทธิ์", "NFR-07"),
    ("A-4", "ทุก body, query, params ผ่าน Zod ก่อนถึง service", "NFR-13"),
    ("A-5", "การเขียนหลายแถวอยู่ใน transaction เดียว ยกเว้น import ที่บันทึกเฉพาะแถวที่ผ่าน", "NFR-11"),
    ("A-6", "หนึ่ง route หนึ่ง capability ตรวจผ่าน authorize(cap, courseId, caller) ตัวเดียว route ที่ไม่ประกาศ = test ล้ม", "SEC-1, SEC-2"),
    ("A-7", "ลำดับ preHandler ตายตัว: rate limit → auth → Zod params → resolve courseId → authorize → Zod body → handler", "แผน §3"),
    ("A-8", "Zod .strict() ทุก body · courseId, uploadedBy, changedBy, role, status ไม่รับจาก body", "แผน §3"),
    ("A-9", "ตอบด้วย DTO ที่ select ชัดเจน ไม่ส่ง model ทั้งแถว passwordHash และ googleSub ไม่ออกจาก repository", "แผน §3"),
    ("A-10", "ค่าที่คำนวณได้ (totalPercent, grade, T, attainment) ไม่รับจาก client คำนวณที่ service เดียว", "FR-88"),
    ("A-11", "ตรวจสถานะก่อนเขียน ตอบ 422: กิจกรรมที่ปิดแล้ว นักศึกษาที่ถอนแล้ว เกรดที่ตรึงแล้ว", "FR-96"),
    ("A-12", "การเขียนคะแนนทุกทางเขียน ScoreChange ใน transaction เดียวกัน", "NFR-16"),
    ("A-13", "404 ของ \"ไม่มี\" กับ \"ไม่ใช่ของคุณ\" ต้องเหมือนกันทั้ง body และ header", "NFR-07"),
]

SECURITY = [
    ("S-1", "token แยกชนิดด้วย claim typ · authMiddleware รับเฉพาะ access · /auth/refresh รับเฉพาะ refresh", "ต้องแก้ (F-2)"),
    ("S-2", "refresh token เป็น cookie httpOnly, Secure, SameSite=Strict หมุนทุกครั้ง ใช้ซ้ำ = เพิกถอนทั้งสาย", "ยังไม่มี · รอ D-2"),
    ("S-3", "map error ของโดเมนครบ: CourseNotFoundError → 404 · P2002 → 409 · business rule → 422", "ต้องแก้ (F-3)"),
    ("S-4", "log ไม่มีข้อมูลนักศึกษา: redact ของ pino ไม่ log body log เฉพาะชื่อ error และ request id", "ต้องแก้ (F-4)"),
    ("S-5", "rate limit ราย route: /auth/* 5 ครั้ง/15 นาที ต่อ IP · import 10 ครั้ง/นาที ต่อผู้ใช้", "ยังไม่มี · ตัวเลขเป็นค่าเสนอ"),
    ("S-6", "ไฟล์นำเข้า: เฉพาะ .xlsx ตรวจ magic bytes · 10 MB · 2,000 แถว 5 ชีต · ไม่ประมวลผลสูตร · ไม่เก็บไฟล์", "มีแค่ขนาดไฟล์"),
    ("S-7", "ไฟล์ส่งออก: เซลล์ที่ขึ้นต้นด้วย = + - @ ต้องถูกทำให้เป็นข้อความ", "ยังไม่มี"),
    ("S-8", "test ข้ามรายวิชาแบบตาราง: ทุก route ถูกยิงด้วยผู้สอนของวิชาอื่น ต้องได้ 404", "ยังไม่มี"),
    ("S-9", "ผู้สอนคนสุดท้ายเอาออกไม่ได้ (422) แก้แถวของตัวเองไม่ได้", "อยู่ใน contract"),
    ("S-10", "การถูกปฏิเสธสิทธิ์บันทึกลง AuthEvent พร้อม capability และรายวิชา", "รอ D-4"),
    ("S-11", "CORS allowlist ตรงตัว · helmet · ตรวจ Origin บน /auth/refresh", "CORS และ helmet มีแล้ว"),
]

DECISIONS = [
    ("D-1", "ADMIN ทำอะไรได้ในรายวิชาที่ไม่ได้สอน", "อ่านได้ เขียนไม่ได้ ยกเว้นสร้าง/ลบรายวิชาและจัดการผู้สอน"),
    ("D-2", "เก็บ refresh token ที่ไหน เพิกถอนได้ไหม", "cookie httpOnly หมุนทุกครั้ง และตาราง RefreshToken"),
    ("D-3", "สองคนแก้คะแนนช่องเดียวกันพร้อมกัน", "ส่งค่าเดิมมาด้วย ไม่ตรงกับฐานข้อมูลตอบ 409"),
    ("D-4", "รับ 4 ตารางและ 11 คอลัมน์ที่ต้นแบบเสนอหรือไม่", "รับทั้งหมดใน migration 0008"),
    ("D-5", "v1 มี login ด้วยอีเมลและรหัสผ่านหรือไม่", "ไม่มี ใช้ Google อย่างเดียว"),
]


# ---------------------------------------------------------------------------
# Classification — derived from method, path and capability, so a new row is
# classified the day it is added and the four columns cannot drift from the row.
# ---------------------------------------------------------------------------
OPS = [
    ("ยืนยันตัวตน", "login · refresh · logout"),
    ("อ่านรายการ", "GET คืนหลายแถว รองรับกรอง/ค้น/แบ่งหน้า"),
    ("อ่านรายการเดียว", "GET คืนหนึ่งแถวตาม id"),
    ("อ่านสรุป/คำนวณ", "GET ที่คำนวณจากหลายตาราง (แดชบอร์ด ผลกระทบ ตัดเกรด)"),
    ("สร้าง", "POST เพิ่มแถวใหม่"),
    ("แก้ไข", "PATCH เปลี่ยนบางฟิลด์ของแถวเดียว"),
    ("จัดลำดับ", "PATCH /reorder เปลี่ยนลำดับหลายแถวพร้อมกัน"),
    ("ตั้งค่าทั้งชุด", "PUT แทนที่ชุดข้อมูลทั้งชุดของรายวิชา"),
    ("ลบ", "DELETE"),
    ("คำสั่ง", "POST/PATCH/DELETE ที่เป็นการเปลี่ยนสถานะ ไม่ใช่ CRUD (อนุมัติ ปิดรับ ถอน คัดลอก ตัดเกรด)"),
    ("นำเข้า", "อัปโหลด Excel: preview ตรวจ · commit บันทึก"),
    ("ส่งออก", "ดาวน์โหลดไฟล์ Excel หรือ template"),
]
EFFECTS = [
    ("อ่านอย่างเดียว", "ไม่เปลี่ยนข้อมูล"),
    ("เขียนแถวเดียว", "เปลี่ยน 1 แถว"),
    ("เขียนหลายแถว (transaction)", "ต้องสำเร็จทั้งหมดหรือไม่สำเร็จเลย (NFR-11)"),
    ("ลบข้อมูล", "ลบแถว อาจ cascade"),
]
ACCESS_KINDS = [
    ("สาธารณะ", "ไม่ต้องล็อกอิน"),
    ("ล็อกอินทั่วไป", "ผู้ใช้ที่ล็อกอินทุกคน ข้อมูลกรองตามสิทธิ์ในตัว"),
    ("ผู้ดูแลระบบ", "จัดการบัญชีผู้ใช้ (user.manage)"),
    ("จัดการรายวิชา", "สร้าง/ลบรายวิชา จัดการผู้สอน — ADMIN และผู้สอนทำได้"),
    ("อ่านรายวิชา", "ดูข้อมูลของรายวิชาที่มองเห็น — ADMIN และผู้สอนอ่านได้"),
    ("งานสอน", "แก้ข้อมูลภายในรายวิชา — ผู้สอนของรายวิชาเท่านั้น ADMIN ทำไม่ได้ (D-1)"),
]
CAUTION = [
    ("สูง", "ลบข้อมูล · ตรึง/ยกเลิกเกรด · นำเข้า commit · จัดการบัญชี · ถอนนักศึกษา"),
    ("กลาง", "เขียนข้อมูลอื่น ๆ"),
    ("ต่ำ", "อ่านอย่างเดียว"),
]

MULTI_ROW = ("/reorder", "/duplicate", "/grading/run", "/import/commit", "/criteria", "/group-weights",
             "/scores", "/grade-bands")
ACTIONS = ("/approve", "/close", "/reopen", "/withdraw", "/restore", "/duplicate", "/grading/run")
SUMMARY_READS = ("/impact", "/grading", "/dashboard/")


def classify(method, path, role, cap, status):
    """(operation, effect, access kind, caution) for one endpoint row."""
    p = path.split("?")[0]
    last = p.rsplit("/", 1)[-1]
    by_id = last.startswith(":")

    if p.startswith("/auth/") and method == "POST":
        op = "ยืนยันตัวตน"
    elif method == "GET" and (p.endswith("/template") or p.endswith("/export")):
        op = "ส่งออก"
    elif method == "GET" and any(x in p + "/" for x in SUMMARY_READS) and not p.endswith("/errors"):
        op = "อ่านสรุป/คำนวณ"
    elif method == "GET":
        op = "อ่านรายการเดียว" if by_id or p == "/auth/me" else "อ่านรายการ"
    elif p.endswith("/import/preview") or p.endswith("/import/commit"):
        op = "นำเข้า"
    elif p.endswith("/reorder"):
        op = "จัดลำดับ"
    elif any(p.endswith(a) for a in ACTIONS) or (method == "DELETE" and p.endswith("/grading")):
        op = "คำสั่ง"
    elif method == "PUT" and ("grade-override" in p or "remediation-plans" in p):
        op = "แก้ไข"
    elif method == "PUT":
        op = "ตั้งค่าทั้งชุด"
    elif method == "DELETE":
        op = "ลบ"
    elif method == "PATCH":
        op = "แก้ไข"
    else:
        op = "สร้าง"

    if method == "GET":
        effect = "อ่านอย่างเดียว"
    elif method == "DELETE" and op == "ลบ":
        effect = "ลบข้อมูล"
    elif op in ("นำเข้า", "จัดลำดับ", "ตั้งค่าทั้งชุด") or any(p.endswith(m) for m in MULTI_ROW) or p == "/courses":
        effect = "เขียนหลายแถว (transaction)"
    else:
        effect = "เขียนแถวเดียว"
    if p.endswith("/import/preview"):
        effect = "อ่านอย่างเดียว"  # preview validates, writes nothing (FR-67)

    if role == NONE:
        access = "สาธารณะ"
    elif cap == "user.manage":
        access = "ผู้ดูแลระบบ"
    elif cap in ("course.create", "course.delete", "staff.write"):
        access = "จัดการรายวิชา"
    elif role == LOGGED and cap in (NO, READ):
        access = "ล็อกอินทั่วไป"
    elif cap == READ or cap == "course.view":
        access = "อ่านรายวิชา"
    else:
        access = "งานสอน"

    risky = effect == "ลบข้อมูล" or p.endswith("/grading/run") or p.endswith("/import/commit") \
        or (p.endswith("/grading") and method == "DELETE") or p.endswith("/withdraw") \
        or (access == "ผู้ดูแลระบบ" and method != "GET")
    caution = "ต่ำ" if effect == "อ่านอย่างเดียว" else ("สูง" if risky else "กลาง")
    return op, effect, access, caution


# ---------------------------------------------------------------------------
# Drift check against the contract
# ---------------------------------------------------------------------------
def contract_rows():
    """(METHOD, path) of every live row in api-design.md §3."""
    text = io.open(CONTRACT, encoding="utf-8").read()
    sec = text.split("## 3. ตาราง Endpoint ทั้งหมด", 1)[1].split("\n## 4.", 1)[0]
    out = set()
    for line in sec.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        for i, c in enumerate(cells[:-1]):
            if c in METHOD_TONE:
                m = re.match(r"`([^`]+)`", cells[i + 1])
                if m:
                    out.add((c, m.group(1)))
                break
    return out


def check_drift():
    contract = contract_rows()
    here_all = {(r[1], r[2]) for r in E}
    here_contract = {(r[1], r[2]) for r in E if r[8] != ST_NEW}
    missing = sorted(contract - here_all)
    stale = sorted(here_contract - contract)
    for m, p in missing:
        print("อยู่ใน api-design.md §3 แต่ไม่อยู่ในสคริปต์:", m, p)
    for m, p in stale:
        print("สคริปต์ระบุว่าอยู่ใน contract แต่ไม่พบใน api-design.md §3:", m, p)
    return not missing and not stale


# ---------------------------------------------------------------------------
# Sheets
# ---------------------------------------------------------------------------
def head_row(ws, row, labels):
    for c, label in enumerate(labels, 1):
        cell = ws.cell(row=row, column=c, value=label)
        cell.font, cell.fill, cell.border = F_HEAD, FILL_HEAD, BORDER
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[row].height = 30


def body_cell(ws, row, col, value, font=F_BODY, center=False, tone=None, zebra=False):
    cell = ws.cell(row=row, column=col, value=value)
    cell.font, cell.border = font, BORDER
    cell.alignment = Alignment(horizontal="center" if center else "left", vertical="center", wrap_text=True)
    if tone:
        cell.fill = PatternFill("solid", fgColor=tone[0])
        cell.font = Font(name=font.name, size=font.size, bold=True, color=tone[1])
    elif zebra:
        cell.fill = FILL_ROW
    return cell


def set_widths(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


def sheet_endpoints(wb):
    ws = wb.create_sheet("Endpoints")
    head_row(ws, 1, HEAD)
    for i, r in enumerate(E, 1):
        row, z = i + 1, i % 2 == 0
        group, method, path, what, role, scope, cap, fr, status, phase, issue, mig, note = r
        body_cell(ws, row, 1, i, center=True, zebra=z)
        body_cell(ws, row, 2, group, zebra=z)
        body_cell(ws, row, 3, method, center=True, tone=METHOD_TONE[method])
        body_cell(ws, row, 4, PREFIX + path, font=F_MONO, zebra=z)
        body_cell(ws, row, 5, what, zebra=z)
        body_cell(ws, row, 6, role, zebra=z)
        body_cell(ws, row, 7, scope, center=True, zebra=z)
        body_cell(ws, row, 8, cap, font=F_MONO if "." in cap else F_BODY, zebra=z)
        body_cell(ws, row, 9, fr, zebra=z)
        body_cell(ws, row, 10, status, center=True, tone=STATUS_TONE[status])
        body_cell(ws, row, 11, phase, center=True, zebra=z)
        body_cell(ws, row, 12, issue, center=True, zebra=z)
        body_cell(ws, row, 13, mig, center=True, zebra=z)
        body_cell(ws, row, 14, note, zebra=z)
        for c, v in enumerate(classify(method, path, role, cap, status), 15):
            body_cell(ws, row, c, v, center=c == 18, zebra=z, tone=CAUTION_TONE.get(v) if c == 18 else None)
    set_widths(ws, WIDTH)
    ws.freeze_panes = "E2"
    ws.auto_filter.ref = "A1:%s%d" % (get_column_letter(len(HEAD)), len(E) + 1)
    ws.sheet_view.zoomScale = 110
    return ws


def sheet_table(wb, name, labels, rows, widths):
    ws = wb.create_sheet(name)
    head_row(ws, 1, labels)
    for i, r in enumerate(rows, 1):
        for c, v in enumerate(r, 1):
            body_cell(ws, i + 1, c, v, font=F_BOLD if c == 1 else F_BODY, center=c == 1, zebra=i % 2 == 0)
    set_widths(ws, widths)
    ws.freeze_panes = "B2"
    return ws


DESIGN_HEAD = ["#", "Method", "Path", "Path / Query", "Body (strict)", "สำเร็จ", "ผิดพลาด", "กฎที่ต้องทำตาม", "ตรวจใน"]
DESIGN_WIDTH = [5, 9, 40, 34, 52, 36, 46, 52, 22]
LATER_DESIGN = ("—", "—", "ไม่ทำใน v1", "—",
                "D-5: v1 เข้าสู่ระบบด้วย Google อย่างเดียว · ถ้าเปิดใช้ภายหลังให้ออกแบบตาม api-design §4", "—")
# Rows are keyed by (METHOD, path) of an Endpoints row; the number is looked up, never typed.
# Every Endpoints row has exactly one Design row — scripts/check-api-design.py fails otherwise.
DESIGN = [
    # ── 1 เข้าสู่ระบบ ───────────────────────────────────────────────────────
    ("POST", "/auth/google", "—",
     "idToken (string ≥ 1) — ID token จาก Google Sign-In",
     "200 · ACTIVE → {status:'ACTIVE', user{id, email, name, role}, accessToken} + Set-Cookie cmas_rt (refresh token, httpOnly) · PENDING → {status:'PENDING', message}",
     "400 body ผิดรูป · 401 token ปลอม / aud ผิด / email_verified=false / บัญชีถูกปิด (ข้อความเดียวกันทุกกรณี) · 429",
     "ตรวจ ID token ที่เซิร์ฟเวอร์ (FR-08) · อีเมลนอกโดเมนคณะ → สร้างบัญชี PENDING · บัญชีใหม่เป็น INSTRUCTOR เสมอ · หลัง D-2 refreshToken ย้ายไปเป็น cookie httpOnly (S-2) ไม่อยู่ใน body",
     "ST-AUTH-01, 02, 04"),
    ("POST", "/auth/login") + LATER_DESIGN,
    ("POST", "/auth/refresh", "— (อ่าน cookie cmas_rt)", "— (ไม่มี body)",
     "200 · {accessToken} + Set-Cookie refresh token ใบใหม่ (หมุนทุกครั้ง)",
     "401 ไม่มี / หมดอายุ / ปลอม / ถูกเพิกถอน / บัญชีถูกปิด · 401 ใช้ token ที่หมุนไปแล้ว → เพิกถอนทั้งสาย (S-2) · 403 Origin ไม่อยู่ใน allowlist (S-11)",
     "รับเฉพาะ token typ=refresh (S-1) · อ่านแถว User สดทุกครั้ง (NFR-19) · ตาราง RefreshToken (D-2, 0008)",
     "ST-AUTH-05 · ST-ACL-05"),
    ("POST", "/auth/logout", "—", "— (ไม่มี body)",
     "200 · {loggedOut:true} + ล้าง cookie",
     "401",
     "เพิกถอน refresh token ปัจจุบันในตาราง RefreshToken · access token ที่ออกไปแล้วหมดอายุเองใน 15 นาที — เขียนตามจริง ห้ามอ้างว่าเพิกถอนทันที",
     "ST-AUTH-05"),
    ("GET", "/auth/me", "—", "—",
     "200 · {id, email, name, role, status, courseCount}",
     "401 token หมดอายุ / บัญชีถูกปิดหลังออก token",
     "อ่านแถว User สด ไม่ใช้ claim ใน token (NFR-19) · ไม่ส่ง passwordHash, googleSub (A-9)",
     "ST-ACL-03 · ST-AUTH-07"),
    ("PATCH", "/auth/password") + LATER_DESIGN,
    # ── 2 บัญชีผู้ใช้ ────────────────────────────────────────────────────────
    ("GET", "/users",
     "status=PENDING|ACTIVE (มีแล้ว) · ต่อไป: q (ชื่อ/อีเมล), role, isActive, page=1, perPage=20 (≤100)",
     "—",
     "200 · [{id, email, name, role, status, createdAt}] · เมื่อเพิ่ม page: meta {total, page, perPage}",
     "400 status ผิดค่า · 401 · 403 ไม่ใช่ ADMIN",
     "user.manage · select เฉพาะฟิลด์ใน DTO (A-9) · ตอนนี้ยังไม่แบ่งหน้า — เพิ่มตาม api-design §2.4 ก่อนจำนวนบัญชีเกิน 100",
     "ST-AUTH-06"),
    ("PATCH", "/users/:id/approve", ":id (โค้ดใช้ :id · contract ใช้ :userId)", "— (ไม่มี body)",
     "200 · ผู้ใช้หลังอนุมัติ status = ACTIVE",
     "401 · 403 · 404 \"ไม่พบผู้ใช้งานนี้\"",
     "เปลี่ยนเฉพาะ status ไม่แตะ isActive (ST-AUTH-03) · บันทึก AuthEvent APPROVE เมื่อมีตาราง (S-10, 0008)",
     "ST-AUTH-03"),
    ("POST", "/users") + LATER_DESIGN,
    ("GET", "/users/:userId", ":userId", "—",
     "200 · {id, email, name, role, status, isActive, authProvider, createdAt, courses[{courseId, code, section, semester, year}], uploadCount}",
     "401 · 403 · 404",
     "ไม่ส่ง passwordHash, googleSub (A-9) · courses ใช้ตอบว่า \"ลบได้ไหม\" (FR-06)",
     "ST-AUTH-07"),
    ("PATCH", "/users/:userId", ":userId",
     "name? (1–100) · role? (ADMIN|INSTRUCTOR) · ต้องมีอย่างน้อย 1 ฟิลด์",
     "200 · ผู้ใช้หลังแก้",
     "400 ว่าง/ฟิลด์เกิน · 403 · 404 · 422 แก้บทบาทของตัวเอง / ลดบทบาทผู้ดูแลที่ใช้งานอยู่คนสุดท้าย / ตั้ง ADMIN ให้คนที่ยังเป็นผู้สอนในรายวิชา (D-1)",
     "user.manage · endpoint เดียวที่รับ role จาก body (ข้อยกเว้นของ A-8) · บันทึก AuthEvent ROLE_CHANGE",
     "ST-AUTH-06"),
    ("PATCH", "/users/:userId/status", ":userId", "isActive (boolean)",
     "200 · ผู้ใช้หลังเปลี่ยนสถานะ",
     "400 · 403 · 404 · 422 ปิดบัญชีตัวเอง / ปิดผู้ดูแลที่ใช้งานอยู่คนสุดท้าย",
     "ไม่มี DELETE /users โดยเจตนา (FR-06) · มีผลใน request ถัดไปทันที เพราะ authMiddleware อ่าน User สด · AuthEvent SUSPEND / ACTIVATE",
     "ST-ACL-03"),
    ("POST", "/users/:userId/reset-password") + LATER_DESIGN,
    ("GET", "/users/:userId/auth-events", ":userId · action?, page=1, perPage=20 (≤100)", "—",
     "200 · [{id, action, actorId, actorName, at, detail}] · meta {total, page, perPage}",
     "400 · 401 · 403 · 404",
     "ตาราง AuthEvent (0008) · รวมการถูกปฏิเสธสิทธิ์พร้อม capability (S-10) · detail ไม่มีข้อมูลนักศึกษา (S-4) · เรียงใหม่สุดก่อน",
     "ST-AUTH-06"),
    # ── 3 รายวิชา ───────────────────────────────────────────────────────────
    ("GET", "/courses",
     "year, semester, q (รหัส/ชื่อ ไทย-อังกฤษ), page=1, perPage=20 (≤100), sort=code:asc (code|name|year|semester|createdAt)",
     "—",
     "200 · data[] เป็นรายวิชา + counts {clos, activities, students} + instructors [{userId, name}] · meta {total, page, perPage}",
     "400 query ผิดรูป · 401",
     "ผู้สอนเห็นเฉพาะวิชาของตน ADMIN เห็นทั้งหมด กรองใน query ไม่กรองทีหลัง (NFR-06) · counts มาจาก query เดียว ไม่มี N+1 (NFR-02)",
     "ST-COURSE-04"),
    ("POST", "/courses", "—",
     "code(1–20) name nameEn? semester(1–3) year(2500–2600 พ.ศ.) section='01' credits(0–30, ได้ 0) lectureHours practiceHours selfStudyHours(≥0, ทศนิยม 1 ตำแหน่ง) gradeScale gradeMethod passCriteria? (เฉพาะ PASS_FAIL หรืออิงกลุ่ม) cloPassMark=60 classTarget=100 instructors[{userId}]",
     "201 · รายวิชาเต็ม (credits เป็น string \"3.0\") · ขั้นบันไดเกรดค่าเริ่มต้น",
     "400 body ผิดรูป/มีฟิลด์เกิน · 409 รหัส+ภาค+ปี+Sec ซ้ำ \"รหัสวิชานี้มีอยู่แล้วในภาคเรียนนี้\" · 422 ไม่มีผู้สอน / ผู้สอนเป็น ADMIN, ถูกปิด, รออนุมัติ / PASS_FAIL ร่วมกับอิงกลุ่ม / ส่ง passCriteria มากับ A–F อิงเกณฑ์",
     "ผู้สอนที่สร้างเป็นผู้สอนของวิชาอัตโนมัติ (FR-22c) · ADMIN ต้องระบุผู้สอนอย่างน้อย 1 คน (D-1, FR-23) · วิชา+ผู้สอน+ขั้นบันไดเกรดอยู่ใน transaction เดียว (NFR-11) · A–F อิงเกณฑ์: passCriteria = ขอบล่างของเกรดต่ำสุดที่ยังผ่าน (D = 50)",
     "ST-COURSE-01…03"),
    ("GET", "/courses/:courseId", ":courseId = cuid", "—",
     "200 · รายวิชาเต็ม + counts + instructors",
     "401 · 404 ไม่มี/ไม่ใช่ของคุณ/id รูปผิด (เหมือนกันทุกไบต์)",
     "course.view · ADMIN อ่านได้ทุกวิชา",
     "ST-ACL-01"),
    ("PATCH", "/courses/:courseId", ":courseId",
     "ฟิลด์ใดก็ได้ของ POST ยกเว้น instructors · ต้องมีอย่างน้อย 1 ฟิลด์",
     "200 · รายวิชาที่แก้แล้ว",
     "400 ว่าง/ฟิลด์เกิน · 403 ADMIN · 404 · 409 ชนรหัสวิชา · 422 PASS_FAIL ร่วมกับอิงกลุ่ม / ส่ง passCriteria มากับ A–F อิงเกณฑ์ (ตรวจบนค่าที่รวมกับของเดิม)",
     "course.settings เฉพาะผู้สอน ADMIN ได้ 403 (D-1) · ตรวจแล้ว 404 ก่อน 403 (A-13) · เปลี่ยนรูปแบบเกรดใช้ PUT /grade-bands ไม่ใช่ที่นี่",
     "ST-ACL-01 · ST-COURSE-02"),
    ("DELETE", "/courses/:courseId", ":courseId · ?confirm=true", "—",
     "200 {deleted:true}",
     "404 · 422 ไม่ส่ง confirm → data = ตัวเลขผลกระทบ (เหมือน /impact) และยังไม่ลบ",
     "course.delete ADMIN และผู้สอนของวิชาลบได้ · cascade ถึง CLO กิจกรรม นักศึกษา คะแนน แผนพัฒนาผู้เรียน (FR-26)",
     "ST-COURSE-06"),
    ("GET", "/courses/:courseId/impact", ":courseId", "—",
     "200 · {clos, objectives, activities, criteria, students, scores, uploadLogs, remediationPlans}",
     "404",
     "ตัวเลขต้องเท่ากับจำนวนแถวที่หายจริงเมื่อ DELETE (FR-26)",
     "ST-COURSE-06"),
    ("GET", "/courses/:courseId/instructors", ":courseId", "—",
     "200 · [{userId, name, email, assignedAt}]",
     "404",
     "ไม่มี role ผู้สอนทุกคนสิทธิ์เท่ากัน (D1)",
     "ST-COURSE-05"),
    ("POST", "/courses/:courseId/instructors", ":courseId", "userId",
     "201 · รายชื่อผู้สอนหลังเพิ่ม",
     "400 · 404 · 409 อยู่ในวิชาแล้ว · 422 ไม่พบผู้ใช้ / ADMIN / บัญชีถูกปิด / รออนุมัติ \"บัญชีนี้ยังใช้งานไม่ได้\"",
     "staff.write ADMIN และผู้สอนทำได้ (FR-22) · ข้อความ error ไม่บอก id หรืออีเมลของผู้ใช้",
     "ST-COURSE-05"),
    ("DELETE", "/courses/:courseId/instructors/:userId", ":courseId, :userId", "—",
     "200 {removed:true}",
     "404 ไม่มีผู้สอนคนนี้ในวิชา · 422 \"รายวิชาต้องมีผู้สอนอย่างน้อย 1 คน\" (FR-23)",
     "ล็อกแถววิชา (SELECT … FOR UPDATE) ก่อนนับ กันลบพร้อมกันจนเหลือ 0 คน (S-9) · แก้แถวของตัวเองไม่ได้ (S-9)",
     "ST-COURSE-05"),
    ("POST", "/courses/:courseId/duplicate", ":courseId", "— (ไม่มี body)",
     "201 · รายวิชาใหม่ (Sec ถัดไปที่ว่าง)",
     "404 ผู้เรียกมองไม่เห็นวิชาต้นทาง (ตรวจใน service เพราะ course.create ไม่ผูกกับ :courseId) · 422 Sec ครบ 99",
     "คัดลอก: ค่าตั้งวิชา ช่วงเกรด CLO จุดประสงค์ กิจกรรม (รวมชื่อประเภทที่กำหนดเอง) การผูกเกณฑ์ น้ำหนักกลุ่ม ผู้สอนเดิม · ไม่คัดลอก: นักศึกษา คะแนน แผนพัฒนาผู้เรียน · ผู้สอนที่กดคัดลอกอยู่ในวิชาใหม่ (P17) · transaction เดียว",
     "ST-COURSE-03"),
    # ── 4 CLO และจุดประสงค์ ─────────────────────────────────────────────────
    ("GET", "/courses/:courseId/clos", ":courseId", "—",
     "200 · [{id, number, description, weight, computedWeight, bloomLevel, soloLevel, levelSource, objectiveCount, isMeasured}] · meta {weightSum, weightWarnings[{cloId, entered, computed}], cloPassMark}",
     "401 · 404",
     "course.view · computedWeight อ่านอย่างเดียว (CR-02) · เรียงตาม number",
     "ST-CLO-03 · ST-ACL-01"),
    ("POST", "/courses/:courseId/clos", ":courseId",
     "number(≥1) description(1–1000) weight?(0–100 หรือ null) bloomLevel (บังคับ ไม่มีค่าตั้งต้น) levelSource=AUTO|MANUAL soloLevel? (ต้องมีเมื่อ MANUAL · AUTO ห้ามส่ง)",
     "201 · CLO ใหม่ (AUTO: soloLevel คำนวณจาก Bloom) · meta.weightWarnings",
     "400 ไม่ส่ง bloomLevel / ส่ง computedWeight / soloLevel มากับ AUTO · 403 ADMIN (D-1) · 404 · 409 number ซ้ำในวิชา",
     "clo.write · น้ำหนักตามแผนรวม ≠ 100 → 201 + คำเตือน ไม่บล็อก (FR-32, E2) · ไม่มีเกณฑ์ผ่านราย CLO (ใช้ Course.cloPassMark)",
     "ST-CLO-01, 02, 03"),
    ("PATCH", "/courses/:courseId/clos/reorder", ":courseId",
     "order: [cloId…] ครบทุก CLO ของวิชา ไม่ซ้ำ",
     "200 · CLO ทั้งหมด number = ลำดับใหม่",
     "400 ไม่ครบ / ซ้ำ / มี id ของวิชาอื่น · 403 · 404",
     "transaction เดียว เขียนสองเฟส (ค่าลบชั่วคราว → ค่าจริง) กัน unique (courseId, number) ชนกลางทาง · ล้มกลางทาง ลำดับเดิมคงอยู่",
     "ST-CLO-02"),
    ("PATCH", "/clos/:cloId", ":cloId",
     "ฟิลด์ใดก็ได้ของ POST · ต้องมีอย่างน้อย 1 ฟิลด์",
     "200 · CLO หลังแก้ + meta.weightWarnings",
     "400 ว่าง / ส่ง computedWeight · 403 · 404 (resolve courseId จาก cloId ก่อน A-3) · 409 number ซ้ำ",
     "clo.write · เปลี่ยน bloomLevel ขณะ AUTO → คำนวณ soloLevel ใหม่ (O3)",
     "ST-ACL-02"),
    ("DELETE", "/clos/:cloId", ":cloId · ?confirm=true", "—",
     "200 {deleted:true}",
     "403 · 404 · 422 มีกิจกรรมวัดอยู่แต่ไม่ส่ง confirm → errors {objectives, criteria, activities}",
     "cascade: จุดประสงค์ → AssessmentCriteria · RemediationPlan ของ CLO นี้ · ผลการประเมินเปลี่ยนต้องแจ้งก่อน (FR-36)",
     "ST-ACT-04"),
    ("GET", "/clos/:cloId/objectives", ":cloId", "—",
     "200 · [{id, number, label '1.2', description, weight, activityCount}] · meta {weightSum, warnings}",
     "401 · 404",
     "น้ำหนักจุดประสงค์รวมต่อ CLO ≠ 100 → meta.warnings และล็อกผลการประเมิน (CR-01)",
     "ST-ACT-05"),
    ("POST", "/clos/:cloId/objectives", ":cloId",
     "number(≥1) description(1–1000) weight?(>0–100)",
     "201 · จุดประสงค์ใหม่ + meta.warnings",
     "400 · 403 · 404 · 409 number ซ้ำใน CLO",
     "clo.write · ผลรวม ≠ 100 เตือน ไม่บล็อก",
     "ST-ACT-05"),
    ("PATCH", "/objectives/:objectiveId", ":objectiveId",
     "number? description? weight? · ต้องมีอย่างน้อย 1 ฟิลด์",
     "200 · จุดประสงค์หลังแก้ + meta.warnings",
     "400 · 403 · 404 · 409 number ซ้ำใน CLO",
     "resolve courseId ผ่าน objective → CLO → course (A-3)",
     "ST-ACL-02"),
    ("DELETE", "/objectives/:objectiveId", ":objectiveId · ?confirm=true", "—",
     "200 {deleted:true}",
     "403 · 404 · 422 มีกิจกรรมวัดอยู่แต่ไม่ส่ง confirm → errors {criteria}",
     "cascade AssessmentCriteria · กิจกรรมที่สัดส่วนเหลือไม่ครบ 100 ถูกเตือนใน GET /criteria",
     "ST-ACT-04"),
    # ── 5 กิจกรรมและเกณฑ์ ───────────────────────────────────────────────────
    ("GET", "/courses/:courseId/activities", ":courseId", "—",
     "200 · [{id, order, name, type, typeLabel, assessmentMethod, assessmentLabel, criteriaNote, maxScore, passScore, passMark, weight, closedAt, scoredCount, studentCount}] · meta {totalWeight, isWeightComplete, weightMode, customTypes[], customMethods[]}",
     "401 · 404",
     "customTypes / customMethods = ชื่อที่เคยกำหนดเองในวิชานี้ ใช้เป็นตัวเลือกใน dropdown (ต้นแบบ 4.2) · passMark คำนวณจาก passScore ÷ maxScore",
     "ST-ACT-02"),
    ("POST", "/courses/:courseId/activities", ":courseId",
     "name(1–200) type(LECTURE|LAB|TEST|PROJECT|OTHER|CUSTOM) typeLabel?(1–100 ต้องมีเมื่อ CUSTOM) assessmentMethod?(QUIZ|EXAM|RUBRIC|WORK|OBSERVATION|OTHER|CUSTOM · ไม่ส่ง = ตามประเภท) assessmentLabel?(ต้องมีเมื่อ CUSTOM) criteriaNote?(≤1000) maxScore(>0) passScore?(0–maxScore · ไม่ส่ง = 50%) weight(0–100 · โหมด GROUP ห้ามส่ง) order?(ไม่ส่ง = ต่อท้าย)",
     "201 · กิจกรรมใหม่ · meta.totalWeight",
     "400 · 403 ADMIN · 404 · 409 order ซ้ำ · 422 สัดส่วนรวมทุกกิจกรรมเกิน 100% \"กิจกรรมอื่นรวม x% แล้ว — ใส่ได้ไม่เกิน y%\" / CUSTOM ไม่มีชื่อ / ส่ง weight ในโหมด GROUP",
     "activity.write · รวมต่ำกว่า 100 บันทึกได้และเตือน (FR-43 แก้ 2569-10-19) · วิธีประเมินตั้งต้นตามประเภท TEST→EXAM · LAB, LECTURE→RUBRIC · PROJECT→WORK · OTHER และ CUSTOM ชื่อใหม่→OTHER · CUSTOM ชื่อเดิมคงค่าที่บันทึกไว้ · passMark ไม่รับจาก body (A-10)",
     "ST-ACT-01, 02"),
    ("PATCH", "/courses/:courseId/activities/reorder", ":courseId",
     "order: [activityId…] ครบทุกกิจกรรมของวิชา ไม่ซ้ำ",
     "200 · กิจกรรมทั้งหมดเรียงใหม่",
     "400 ไม่ครบ / ซ้ำ / มี id ของวิชาอื่น · 403 · 404",
     "transaction เดียว · คะแนนและน้ำหนักไม่เปลี่ยน",
     "ST-ACT-02"),
    ("PATCH", "/activities/:activityId", ":activityId",
     "ฟิลด์ใดก็ได้ของ POST · ต้องมีอย่างน้อย 1 ฟิลด์",
     "200 · กิจกรรมหลังแก้ · meta.totalWeight",
     "400 · 403 · 404 · 422 maxScore ต่ำกว่าคะแนนที่บันทึกแล้ว → errors {conflictingScores, maxExistingScore} / สัดส่วนรวมเกิน 100% / passScore > maxScore",
     "ตรวจที่ API ก่อน trigger score ≤ maxScore (NFR-12) · ไม่ปัดคะแนนให้ (Q5) · เปลี่ยน type ไม่ทับ assessmentMethod ที่ส่งมาด้วย",
     "ST-ACT-01, 02 · ST-ACL-02"),
    ("DELETE", "/activities/:activityId", ":activityId · ?confirm=true", "—",
     "200 {deleted:true} · meta.totalWeight",
     "403 (activity.delete) · 404 · 422 มีคะแนนแล้วแต่ไม่ส่ง confirm → errors {scores}",
     "cascade Score · AssessmentCriteria · ScoreChange",
     "ST-ACT-02"),
    ("GET", "/courses/:courseId/criteria", ":courseId", "—",
     "200 · {objectives[{id, cloId, label, weight}], activities[{id, name, weight}], cells[{activityId, objectiveId, weight}]} · meta {activityWeightSums, cloShares, cloWeights{cloId:{computed, planned}}, unlinkedActivityIds, unmeasuredObjectiveIds, objectiveWeightSums, isReadyForDashboard}",
     "401 · 404",
     "เมทริกซ์ทั้งใบใน request เดียว (หน้าตรวจการเชื่อม) · cloWeights.computed = Σ น้ำหนักกิจกรรม × สัดส่วน (CR-02)",
     "ST-ACT-04, 05"),
    ("PUT", "/courses/:courseId/criteria", ":courseId",
     "cells: [{activityId, objectiveId, weight(>0–100)}] แทนที่ทั้งใบ",
     "200 · เมทริกซ์ใหม่ + meta.warnings (รวมต่อกิจกรรม ≠ 100)",
     "400 weight ≤ 0 / > 100 / คู่ซ้ำ · 403 · 404 · 422 กิจกรรมหรือจุดประสงค์ไม่ใช่ของวิชานี้",
     "transaction เดียว ช่องที่หายไป = ลบ (FR-44) · ตรวจข้ามวิชาที่ API ก่อน trigger (FR-46) · รวม ≠ 100 เตือนตอนบันทึก บล็อกที่แดชบอร์ด (FR-45)",
     "ST-ACT-03, 04"),
    ("POST", "/activities/:activityId/duplicate", ":activityId", "— (ไม่มี body)",
     "201 · กิจกรรมใหม่ ชื่อ \"… (สำเนา)\" ต่อท้าย weight = 0",
     "403 · 404",
     "คัดลอก type, typeLabel, assessmentMethod, assessmentLabel, maxScore, passScore, criteriaNote และการผูกจุดประสงค์ · ไม่คัดลอกคะแนน · weight เริ่ม 0 เพื่อไม่ให้รวมเกิน 100",
     "ST-ACT-02"),
    ("PUT", "/courses/:courseId/group-weights", ":courseId",
     "mode (MANUAL|GROUP) · weights {LAB: 25, TEST: 75, \"CUSTOM:ชื่อ\": 10} (เฉพาะ GROUP)",
     "200 · {mode, weights, activities[{id, weight}]}",
     "400 · 403 · 404 · 422 รวมเกิน 100% / มีคีย์ประเภทที่ไม่มีกิจกรรม",
     "transaction เดียว: บันทึก CourseGroupWeight แล้วแบ่งน้ำหนักให้กิจกรรมตามคะแนนเต็ม · สลับเป็น MANUAL เก็บน้ำหนักของกิจกรรมไว้ · คีย์ CUSTOM:ชื่อ = กลุ่มของประเภทกำหนดเอง",
     "ST-ACT-02"),
    ("POST", "/activities/:activityId/close", ":activityId",
     "blank? (ZERO|EXCUSED|LATER = วิธีจัดการช่องว่าง) · reason? (ต้องมีเมื่อ EXCUSED)",
     "200 · {closedAt, zeroed, excused, pending}",
     "400 · 403 · 404 · 422 ปิดแล้ว",
     "score.edit · ทุกช่องที่เปลี่ยนเขียน ScoreChange (A-12) ใน transaction เดียว · หลังปิด ช่องว่าง = ขาดส่ง (R3)",
     "ST-STU-04"),
    ("POST", "/activities/:activityId/reopen", ":activityId", "— (ไม่มี body)",
     "200 · {closedAt:null}",
     "403 · 404 · 422 ยังไม่ได้ปิด",
     "ไม่ลบค่า 0 หรือยกเว้นที่ตั้งไว้ตอนปิด",
     "ST-STU-04"),
    # ── 6 นักศึกษา ──────────────────────────────────────────────────────────
    ("GET", "/courses/:courseId/students",
     "q (รหัสหรือชื่อ), status=ALL|ENROLLED|WITHDRAWN, page=1, perPage=20 (≤100), sort=studentCode:asc", "—",
     "200 · [{id, studentCode, name, status, withdrawnAt, scoredCount, activityCount}] · meta {total, page, perPage}",
     "400 · 401 · 404",
     "ไม่มีอีเมล ชั้นปี สาขา (FR-54) · ผู้ถอนยังอยู่ในรายการ แค่ออกจากตัวหาร",
     "ST-STU-05"),
    ("POST", "/courses/:courseId/students", ":courseId",
     "studentCode(1–20) name(1–200)",
     "201 · นักศึกษาใหม่ status = ENROLLED",
     "400 · 403 ADMIN · 404 · 409 รหัสซ้ำในวิชา",
     "รหัสซ้ำข้ามวิชาได้ (ASM-01, FR-51) · status ไม่รับจาก body (A-8)",
     "ST-STU-05"),
    ("PATCH", "/students/:studentId", ":studentId",
     "studentCode? name? · ต้องมีอย่างน้อย 1 ฟิลด์",
     "200 · นักศึกษาหลังแก้",
     "400 · 403 · 404 · 409 รหัสซ้ำในวิชา",
     "แก้รหัสไม่กระทบคะแนน (ผูกด้วย id)",
     "ST-ACL-02"),
    ("DELETE", "/students/:studentId", ":studentId · ?confirm=true", "—",
     "200 {deleted:true}",
     "403 (student.delete) · 404 · 422 มีคะแนนแต่ไม่ส่ง confirm → errors {scores, grades}",
     "cascade Score · StudentGrade · ScoreChange · RemediationPlan · การลงทะเบียนในวิชาอื่นของรหัสเดียวกันไม่ถูกแตะ",
     "ST-STU-05"),
    ("GET", "/courses/:courseId/students/template", ":courseId", "—",
     "200 · xlsx: หัวเอกสาร + คอลัมน์ รหัสนักศึกษา | ชื่อ-นามสกุล",
     "403 ADMIN (score.export) · 404",
     "คอลัมน์รหัสเป็นข้อความ · S-7",
     "ST-IMP-03"),
    ("POST", "/courses/:courseId/students/import/preview", ":courseId",
     "multipart: file (.xlsx ≤ 10 MB)",
     "200 · {previewToken (15 นาที ผูกวิชา+ผู้ใช้), summary {total, add, failed}, rows[{row, studentCode, name, status, errorCode, message}]}",
     "400 ไม่ใช่ xlsx (magic bytes) / เกิน 10 MB / เกิน 2,000 แถว / มีสูตร · 403 · 404 · 429",
     "S-6 · ไม่บันทึกอะไร · ชื่อเดิมของรหัสที่มีอยู่ไม่ถูกทับ · ไม่เก็บไฟล์",
     "ST-IMP-03, 05"),
    ("POST", "/courses/:courseId/students/import/commit", ":courseId", "previewToken",
     "200 · {uploadLogId, recordsOk, recordsFail}",
     "403 · 404 · 422 token หมดอายุ / ไม่ใช่ของวิชานี้ / ไม่ใช่ของผู้ใช้นี้",
     "บันทึกเฉพาะแถวที่ผ่านใน transaction เดียว (ข้อยกเว้นของ A-5) · ScoreUploadLog kind=ROSTER ทุกครั้ง · UploadReject รายแถว",
     "ST-IMP-03 · ST-NFR-06"),
    ("POST", "/students/:studentId/withdraw", ":studentId", "— (ไม่มี body)",
     "200 · {status:'WITHDRAWN', withdrawnAt}",
     "403 · 404 · 422 ถอนแล้ว / เกรดถูกตรึง",
     "ออกจากตัวหารทุกตัว คะแนนเดิมยังเก็บ (R2) · แก้คะแนนของผู้ถอนไม่ได้ (A-11)",
     "ST-STU-04 · ST-GRADE-04"),
    ("POST", "/students/:studentId/restore", ":studentId", "— (ไม่มี body)",
     "200 · {status:'ENROLLED', withdrawnAt:null}",
     "403 · 404 · 422 ยังไม่ได้ถอน",
     "คะแนนเดิมกลับเข้าการคำนวณ",
     "ST-STU-04"),
    ("PUT", "/students/:studentId/remediation-plans/:cloId", ":studentId, :cloId (CLO ต้องอยู่วิชาเดียวกับนักศึกษา)",
     "plan (1–1000)",
     "200 · {studentId, cloId, plan, updatedBy{id, name}, updatedAt}",
     "400 ว่าง / ยาวเกิน · 403 ADMIN · 404 นักศึกษาหรือ CLO ไม่ใช่ของวิชานี้",
     "student.write · upsert หนึ่งแถวต่อ (นักศึกษา, CLO) · updatedBy มาจาก token ไม่รับจาก body (A-8) · ไม่เข้าสูตรคะแนนใด",
     "ST-STU-05"),
    ("DELETE", "/students/:studentId/remediation-plans/:cloId", ":studentId, :cloId", "—",
     "200 {deleted:true}",
     "403 · 404 ไม่มีแผนของคู่นี้",
     "ต้นแบบลบแผนเมื่อบันทึกข้อความว่าง → client เรียก DELETE แทนการส่ง plan ว่าง",
     "ST-STU-05"),
    # ── 7 คะแนนและ Excel ────────────────────────────────────────────────────
    ("GET", "/courses/:courseId/scores",
     "status=ALL|ENROLLED, page=1, perPage=50 (≤200)", "—",
     "200 · {activities[{id, name, maxScore, passScore, closedAt}], students[{id, studentCode, name, status, scores{activityId: number|null|'EXCUSED'}}]} · meta {progress{activityId:{scored, total}}}",
     "400 · 401 · 404",
     "null = ยังไม่ประเมิน ห้ามเป็น 0 (FR-62) · EXCUSED แยกจาก null",
     "ST-STU-01 · ST-NFR-01"),
    ("PUT", "/courses/:courseId/scores", ":courseId",
     "scores: [{studentId, activityId, score: number|null|'EXCUSED', reason? (เมื่อ EXCUSED), from: number|null|'EXCUSED'}] ≤ 2,000 ช่อง",
     "200 · {written, unchanged}",
     "400 · 403 ADMIN · 404 · 409 from ไม่ตรงกับค่าในฐานข้อมูล (D-3) → errors {cells[]} · 422 คะแนน < 0 หรือ > maxScore / กิจกรรมปิดแล้ว / นักศึกษาถอน / เกรดตรึง → errors {rows[]}",
     "transaction เดียว ผิด 1 ช่อง = ไม่บันทึกเลย (FR-63) · null = ลบแถว · ScoreChange ทุกช่องที่เปลี่ยน source = MANUAL|PASTE (A-12) · ห้าม log body (NFR-08)",
     "ST-STU-01, 02, 03, 04"),
    ("GET", "/courses/:courseId/scores/template", ":courseId", "—",
     "200 · xlsx เติมรหัสและชื่อ คอลัมน์ละกิจกรรม \"<ชื่อ> (เต็ม N)\" + data validation ≤ maxScore",
     "403 · 404",
     "S-7 · คอลัมน์รหัสเป็นข้อความ",
     "ST-IMP-01"),
    ("POST", "/courses/:courseId/scores/import/preview", ":courseId",
     "multipart: file (.xlsx ≤ 10 MB)",
     "200 · {previewToken, fileName, summary {total, ok, failed}, columns[{header, activityId, matched}], rows[{row, studentCode, status, values, errorCode, message}]}",
     "400 ไฟล์ไม่ผ่าน S-6 · 403 · 404 · 429",
     "errorCode ครบ 6 ตัว (FR-69) · คำว่า \"ยกเว้น\" = EXCUSED · ช่องว่างไม่เขียนทับคะแนนเดิม · ไม่บันทึกอะไร",
     "ST-IMP-01, 02, 04, 05"),
    ("POST", "/courses/:courseId/scores/import/commit", ":courseId", "previewToken",
     "200 · {uploadLogId, recordsOk, recordsFail}",
     "403 · 404 · 422 token หมดอายุ / ไม่ใช่ของวิชานี้ / ไม่ใช่ของผู้ใช้นี้",
     "เฉพาะแถวที่ผ่าน · ScoreUploadLog ทุกครั้ง แม้ 0 แถว (FR-71) · UploadReject รายแถว · ScoreChange source = IMPORT (A-12)",
     "ST-IMP-01, 02 · ST-NFR-03, 06"),
    ("GET", "/courses/:courseId/scores/export", ":courseId · type=raw|clo|both (default both)", "—",
     "200 · xlsx",
     "400 type ผิดค่า · 403 ADMIN · 404",
     "ใช้ attainment service เดียวกับแดชบอร์ด (FR-88) · S-7",
     "ST-IMP-06 · ST-CALC-04"),
    ("GET", "/courses/:courseId/uploads", ":courseId · kind=SCORES|ROSTER, page, perPage", "—",
     "200 · [{id, kind, fileName, uploadedBy{id, name}, recordsOk, recordsFail, createdAt}] · meta",
     "400 · 401 · 404",
     "เรียงใหม่สุดก่อน · ตัวนับแยกคอลัมน์ (FR-72)",
     "ST-IMP-02"),
    ("GET", "/uploads/:uploadId/errors", ":uploadId · format=json|xlsx", "—",
     "200 · [{row, studentCode, field, value, reason}] หรือ xlsx",
     "401 · 404 (resolve courseId จาก upload ก่อน)",
     "ตาราง UploadReject (0008) · เลขแถวตรงกับใน Excel",
     "ST-IMP-02"),
    ("GET", "/courses/:courseId/score-changes",
     ":courseId · studentId?, activityId?, page=1, perPage=20 (≤100)", "—",
     "200 · [{id, studentId, studentCode, activityId, activityName, from, to, source, changedBy{id, name}, changedAt, note}] · meta",
     "400 · 401 · 404",
     "อ่านอย่างเดียว เรียงใหม่สุดก่อน · ไม่มี endpoint แก้หรือลบประวัติ (NFR-16)",
     "ST-STU-03"),
    # ── 8 ตัดเกรด ───────────────────────────────────────────────────────────
    ("GET", "/courses/:courseId/grading", ":courseId", "—",
     "200 · {gradeScale, gradeMethod, passCriteria, passCriteriaSource: LADDER|MANUAL, bands[{grade, minValue, maxValue, count, isPassFloor, isFail}], frozen, students[{studentId, totalPercent, derivedGrade, issuedGrade, overrideReason}], stats {mean, sd, n}} · meta.warnings",
     "401 · 404",
     "A–F อิงเกณฑ์: passCriteria = ขอบล่างของเกรดต่ำสุดที่ยังผ่าน (2569-10-19) · คะแนนไม่ครบ = ไม่ออกเกรด ไม่แทนด้วย F · คำนวณจาก service เดียว (FR-88)",
     "ST-GRADE-02, 03"),
    ("PUT", "/courses/:courseId/grade-bands", ":courseId",
     "gradeScale? gradeMethod? passCriteria? (เฉพาะ PASS_FAIL หรืออิงกลุ่ม) bands: [{grade(1–4), minValue(≥0 · อิงเกณฑ์ ≤ 100)}]",
     "200 · ผลเหมือน GET /grading",
     "400 · 403 · 404 · 422 ไม่มีเกรดที่เริ่มที่ 0 / ชื่อหรือค่าเริ่มซ้ำ / PASS_FAIL ต้องมี S และ U / PASS_FAIL กับอิงกลุ่ม / เปลี่ยนรูปแบบเกรดขณะมีเกรดตรึง / ส่ง passCriteria มากับ A–F อิงเกณฑ์",
     "band.write · แทนที่ทั้งชุดใน transaction เดียว · คำนวณ Course.passCriteria ใหม่จากขั้นบันได (A–F อิงเกณฑ์) · PASS_FAIL: ขั้น S = passCriteria (CR-06)",
     "ST-GRADE-02"),
    ("POST", "/courses/:courseId/grading/run", ":courseId", "— (ไม่มี body)",
     "200 · {frozenAt, issued, skipped}",
     "403 · 404 · 422 อิงกลุ่ม n < 2 หรือ SD = 0 / สัดส่วนกิจกรรมรวมไม่ครบ 100",
     "grading.run · ตรึงลง StudentGrade ใน transaction เดียว · การปรับเกรดที่มีอยู่คงไว้ · ผู้ถอนไม่นับ (CR-10)",
     "ST-GRADE-01, 03, 04"),
    ("DELETE", "/courses/:courseId/grading", ":courseId · ?confirm=true", "—",
     "200 · {unfrozen}",
     "403 · 404 · 422 ยังไม่ได้ตรึง / ไม่ส่ง confirm",
     "ลบ StudentGrade ทั้งวิชารวมการปรับเกรด จึงต้องยืนยัน",
     "ST-GRADE-03"),
    ("PUT", "/students/:studentId/grade-override", ":studentId",
     "grade (ต้องมีในขั้นบันได) · reason (1–500)",
     "200 · {studentId, derivedGrade, issuedGrade, overrideReason}",
     "400 ไม่มีเหตุผล · 403 · 404 · 422 ยังไม่ได้ตรึงเกรด / เกรดไม่อยู่ในขั้นบันได / นักศึกษาถอน",
     "grade.override · totalPercent และ grade ที่คำนวณไม่รับจาก body (A-10)",
     "ST-GRADE-03, 05"),
    ("DELETE", "/students/:studentId/grade-override", ":studentId", "—",
     "200 · เกรดกลับเป็นตามคะแนน",
     "403 · 404 ไม่มีการปรับ",
     "ลบเฉพาะ overrideReason และเกรดที่ปรับ ไม่ยกเลิกการตรึงทั้งวิชา",
     "ST-GRADE-03"),
    ("GET", "/courses/:courseId/grades/export", ":courseId", "—",
     "200 · xlsx: สรุปราย CLO · ยังไม่ผ่านราย CLO (พร้อมแผนพัฒนาผู้เรียน) · เกรด",
     "403 ADMIN · 404",
     "S-7 · ตัวเลขตรงกับแดชบอร์ด (FR-88)",
     "ST-CALC-04 · ST-IMP-06"),
    # ── 9 แดชบอร์ด ──────────────────────────────────────────────────────────
    ("GET", "/dashboard/overview", "—", "—",
     "200 · {courseCount, studentCount, cloCompleted, cloTotal, scoreProgress {scored, expected}}",
     "401",
     "ผู้สอนเห็นเฉพาะวิชาตน ADMIN เห็นทั้งหมด กรองใน query (NFR-06)",
     "ST-COURSE-04"),
    ("GET", "/courses/:courseId/dashboard/attainment", ":courseId", "—",
     "200 · {classTarget, cloPassMark, helpCount, clos[{cloId, number, description, attainment, status, passedCount, evaluableCount, notEvaluatedCount, provisionalCount}]} · meta {computable, blockers[]}",
     "401 · 404",
     "ข้อมูลไม่พอ → attainment = null + blockers ห้ามส่ง 0 (FR-84) · helpCount = คนที่ยังไม่ผ่านอย่างน้อย 1 CLO",
     "ST-CALC-01, 03"),
    ("GET", "/courses/:courseId/dashboard/at-risk", ":courseId", "—",
     "200 · [{studentId, studentCode, name, level (COURSE_FAIL|CLO_BELOW|OVERDUE), failedClos[{cloId, number, score, gap, near, provisional, hasPlan}], overdue[], totalScore, coursePassed}] · meta {atRiskCount, notEvaluatedCount, evaluatedCount}",
     "401 · 404",
     "ยังไม่มีคะแนนเลย ≠ at-risk (CR-03.1) · near = ห่างจากเกณฑ์ไม่เกิน 10 คะแนน (NEAR_GAP) · hasPlan บอกว่ามีแผนพัฒนาแล้ว",
     "ST-CALC-02"),
    ("GET", "/courses/:courseId/dashboard/students/:studentId", ":courseId, :studentId", "—",
     "200 · {student, gradeScale, clos[{cloId, number, score, passMark, status, objectives[]}], activities[], totalScore, coursePassed, passFailResult, remediationPlans[{cloId, plan, updatedAt}]}",
     "401 · 404 นักศึกษาไม่ใช่ของวิชานี้",
     "PASS_FAIL ไม่ส่งเกรดตัวอักษร (CR-06) · คะแนนดิบอยู่คู่กับ % เสมอ (M5)",
     "ST-CALC-01 · ST-GRADE-02"),
    ("GET", "/courses/:courseId/dashboard/export", ":courseId · scope=course|student, studentId?, format=xlsx", "—",
     "200 · xlsx",
     "400 scope=student แต่ไม่มี studentId · 403 ADMIN · 404",
     "service เดียวกับ attainment / at-risk / รายงานรายบุคคล (FR-88) · S-7 · PDF หลัง v1",
     "ST-CALC-04"),
]

# A-6: every route behind a login answers 401 to a caller with no token, before
# anything else runs. Rows written before that rule list only their own errors;
# say 401 on each of them rather than leave it implied.
_PUBLIC = {(r[1], r[2]) for r in E if r[4] == NONE}
DESIGN = [
    d if (d[0], d[1]) in _PUBLIC or d[5] == "—" or "401" in d[5]
    else d[:5] + ("401 ไม่มี token · " + d[5],) + d[6:]
    for d in DESIGN
]

# Body fields that are columns, per Design row: (model, [field, …]). check-api-design.py
# resolves each against database/schema.prisma plus the [index-q] proposals in
# docs/reference/db/mysql/index-q.sql, and flags a row that needs a proposed column
# without "ต้องมี 0008" ticked. Fields that are not columns (idToken, order, cells,
# previewToken, …) are left out on purpose.
BODY_FIELDS = {
    ("PATCH", "/users/:userId"): ("User", ["name", "role"]),
    ("PATCH", "/users/:userId/status"): ("User", ["isActive"]),
    ("POST", "/courses"): ("Course", ["code", "name", "nameEn", "semester", "year", "section", "credits",
                                      "lectureHours", "practiceHours", "selfStudyHours", "gradeScale",
                                      "gradeMethod", "passCriteria", "cloPassMark", "classTarget"]),
    ("PATCH", "/courses/:courseId"): ("Course", ["code", "name", "nameEn", "semester", "year", "section",
                                                 "credits", "gradeScale", "gradeMethod", "passCriteria",
                                                 "cloPassMark", "classTarget"]),
    ("POST", "/courses/:courseId/instructors"): ("CourseInstructor", ["userId"]),
    ("POST", "/courses/:courseId/clos"): ("CLO", ["number", "description", "weight", "bloomLevel",
                                                  "levelSource", "soloLevel"]),
    ("PATCH", "/clos/:cloId"): ("CLO", ["number", "description", "weight", "bloomLevel", "levelSource",
                                        "soloLevel"]),
    ("POST", "/clos/:cloId/objectives"): ("BehavioralObjective", ["number", "description", "weight"]),
    ("PATCH", "/objectives/:objectiveId"): ("BehavioralObjective", ["number", "description", "weight"]),
    ("POST", "/courses/:courseId/activities"): ("Activity", ["name", "type", "typeLabel", "assessmentMethod",
                                                             "assessmentLabel", "criteriaNote", "maxScore",
                                                             "passScore", "weight", "order"]),
    ("PATCH", "/activities/:activityId"): ("Activity", ["name", "type", "typeLabel", "assessmentMethod",
                                                         "assessmentLabel", "criteriaNote", "maxScore",
                                                         "passScore", "weight", "order"]),
    ("PUT", "/courses/:courseId/criteria"): ("AssessmentCriteria", ["activityId", "objectiveId", "weight"]),
    ("POST", "/courses/:courseId/students"): ("Student", ["studentCode", "name"]),
    ("PATCH", "/students/:studentId"): ("Student", ["studentCode", "name"]),
    ("PUT", "/students/:studentId/remediation-plans/:cloId"): ("RemediationPlan", ["plan"]),
    ("PUT", "/courses/:courseId/scores"): ("Score", ["studentId", "activityId", "score"]),
    ("PUT", "/courses/:courseId/grade-bands"): ("GradeBand", ["grade", "minValue"]),
    ("PUT", "/students/:studentId/grade-override"): ("StudentGrade", ["grade"]),
}
# Enum values a Design row names for a column: check-api-design.py compares them with the
# enum in the schema (Prisma first, index-q.sql for the [index-q] values).
ENUM_FIELDS = {
    ("POST", "/courses/:courseId/activities"): {
        "type": ["LECTURE", "LAB", "TEST", "PROJECT", "OTHER", "CUSTOM"],
        "assessmentMethod": ["QUIZ", "EXAM", "RUBRIC", "WORK", "OBSERVATION", "OTHER", "CUSTOM"],
    },
    ("POST", "/courses/:courseId/clos"): {"levelSource": ["AUTO", "MANUAL"]},
    ("PATCH", "/users/:userId"): {"role": ["ADMIN", "INSTRUCTOR"]},
}


def sheet_classification(wb):
    ws = wb.create_sheet("Classification")
    ws.sheet_view.showGridLines = False
    set_widths(ws, [3, 30, 70, 10])
    ws["B2"].value, ws["B2"].font = "จำแนกประเภท endpoint", F_TITLE
    ws["B3"].value = "นับจากคอลัมน์ O–R ของแผ่น Endpoints (สูตร COUNTIF) · คอลัมน์เหล่านี้สร้างจาก method + path + capability โดยสคริปต์"
    ws["B3"].font = F_SUB
    row = 4
    for title, col, items in [
        ("1 · ประเภทการทำงาน", "O", OPS),
        ("2 · ผลต่อข้อมูล", "P", EFFECTS),
        ("3 · ประเภทสิทธิ์", "Q", ACCESS_KINDS),
        ("4 · ระดับความระวัง", "R", CAUTION),
    ]:
        row += 2
        ws.cell(row=row, column=2, value=title).font = F_H2
        row += 1
        head_row(ws, row, ["", "ประเภท", "ความหมาย", "จำนวน"])
        ws.cell(row=row, column=1).fill = PatternFill(fill_type=None)
        ws.cell(row=row, column=1).border = Border()
        first = row + 1
        for name, meaning in items:
            row += 1
            body_cell(ws, row, 2, name, font=F_BOLD)
            body_cell(ws, row, 3, meaning)
            body_cell(ws, row, 4, "=COUNTIF(Endpoints!%s:%s,B%d)" % (col, col, row), center=True)
        row += 1
        body_cell(ws, row, 2, "รวม", font=F_BOLD, center=True)
        body_cell(ws, row, 3, "")
        body_cell(ws, row, 4, "=SUM(D%d:D%d)" % (first, row - 1), font=F_BOLD, center=True)
    return ws


def sheet_design(wb):
    ws = wb.create_sheet("Design")
    head_row(ws, 1, DESIGN_HEAD)
    number = {(r[1], r[2]): i for i, r in enumerate(E, 1)}
    for i, (method, path, params, body, ok, err, rules, tests) in enumerate(DESIGN, 1):
        n = number[(method, path)]
        z = i % 2 == 0
        body_cell(ws, i + 1, 1, n, center=True, zebra=z)
        body_cell(ws, i + 1, 2, method, center=True, tone=METHOD_TONE[method])
        body_cell(ws, i + 1, 3, PREFIX + path, font=F_MONO, zebra=z)
        for c, v in enumerate((params, body, ok, err, rules, tests), 4):
            body_cell(ws, i + 1, c, v, zebra=z)
        ws.row_dimensions[i + 1].height = 96
    set_widths(ws, DESIGN_WIDTH)
    ws.freeze_panes = "D2"
    n_rows = len(DESIGN) + 3
    later = sum(1 for r in E if r[8] == ST_LATER)
    ws.cell(row=n_rows, column=2, value="ออกแบบครบ %d จาก %d endpoint · %d ตัวเลื่อนไปหลัง v1 (D-5) ระบุไว้ว่าไม่ทำ · ตรวจกับระบบจริงด้วย scripts/check-api-design.py และ app/server/src/api-contract.test.ts" % (len(DESIGN), len(E), later)).font = F_SUB
    return ws


def sheet_readme(wb):
    ws = wb.active
    ws.title = "README"
    ws.sheet_view.showGridLines = False
    set_widths(ws, [3, 24, 14, 70])
    ws["B2"].value, ws["B2"].font = "CMAS — ตาราง Endpoint ของ API", F_TITLE
    ws["B3"].value = "ทุก path ขึ้นต้นด้วย %s · สร้างจาก scripts/build-api-endpoints-workbook.py ห้ามแก้ไฟล์นี้ด้วยมือ" % PREFIX
    ws["B3"].font = F_SUB

    row = 5
    ws.cell(row=row, column=2, value="จำนวน endpoint").font = F_H2
    row += 1
    head_row(ws, row, ["", "สถานะ", "จำนวน", "ความหมาย"])
    ws.cell(row=row, column=1).fill = PatternFill(fill_type=None)
    ws.cell(row=row, column=1).border = Border()
    meaning = {
        ST_DONE: "มีโค้ดใน app/server/src/modules แล้ว",
        ST_CONTRACT: "อยู่ใน api-design.md §3 ยังไม่มีโค้ด",
        ST_NEW: "ต้นแบบ index-q.html มีแล้ว แต่ยังไม่อยู่ใน api-design.md — รอรับเข้า contract",
        ST_LATER: "อยู่ใน contract แต่เสนอให้เลื่อนไปหลัง v1 (รอ D-5)",
    }
    first = row + 1
    for st in (ST_DONE, ST_CONTRACT, ST_NEW, ST_LATER):
        row += 1
        body_cell(ws, row, 2, st, center=True, tone=STATUS_TONE[st])
        body_cell(ws, row, 3, '=COUNTIF(Endpoints!J:J,B%d)' % row, center=True)
        body_cell(ws, row, 4, meaning[st])
    row += 1
    body_cell(ws, row, 2, "รวม", font=F_BOLD, center=True)
    body_cell(ws, row, 3, "=SUM(C%d:C%d)" % (first, row - 1), font=F_BOLD, center=True)
    body_cell(ws, row, 4, "")

    row += 2
    ws.cell(row=row, column=2, value="อ่านคอลัมน์อย่างไร").font = F_H2
    row += 1
    head_row(ws, row, ["", "คอลัมน์", "", "ความหมาย"])
    ws.cell(row=row, column=1).fill = PatternFill(fill_type=None)
    ws.cell(row=row, column=1).border = Border()
    for label, text in [
        ("ใครเรียกได้", "\"ผู้สอนของรายวิชา\" = ผู้ที่ถูกมอบหมายรายวิชานั้น ผู้สอนทุกคนของวิชามีสิทธิ์เท่ากัน"),
        ("ตรวจสิทธิ์รายวิชา", "\"จาก URL\" = มี :courseId · \"resolve จาก id\" = หา courseId จาก id ของแถวก่อน (A-3) · ไม่มีสิทธิ์ได้ 404 เสมอ"),
        ("Capability", "สิทธิ์หนึ่งตัวจากตาราง PERM ของต้นแบบ (17 ตัว) · \"อ่าน\" = ไม่เปลี่ยนข้อมูล ใช้แค่การตรวจสิทธิ์รายวิชา"),
        ("ช่วงงาน", "P0 ฐาน · P2 รายวิชา · P3 CLO และเกณฑ์ · P5 นักศึกษาและคะแนน · P6 ตัดเกรดและแดชบอร์ด (ดู api-design-plan.md §6)"),
        ("ต้องมี 0008", "ทำไม่ได้จนกว่า migration 0008 จะเพิ่มตารางหรือคอลัมน์ที่ต้นแบบเสนอ (D-4, D-2)"),
        ("ประเภท (O–R)", "ประเภทการทำงาน · ผลต่อข้อมูล · ประเภทสิทธิ์ · ระดับความระวัง — ความหมายและจำนวนอยู่แผ่น Classification"),
        ("แผ่น Design", "ออกแบบละเอียดรายตัว: query, body, คำตอบ, error, กฎ — ใช้เป็นแบบก่อนเขียนโค้ด · ครบทุก endpoint"),
    ]:
        row += 1
        body_cell(ws, row, 2, label, font=F_BOLD)
        body_cell(ws, row, 3, "")
        body_cell(ws, row, 4, text)
        ws.row_dimensions[row].height = 32

    row += 2
    ws.cell(row=row, column=2, value="ข้อที่ยังต้องตัดสิน").font = F_H2
    row += 1
    head_row(ws, row, ["", "คำถาม", "#", "ค่าที่ใช้ไปก่อน"])
    ws.cell(row=row, column=1).fill = PatternFill(fill_type=None)
    ws.cell(row=row, column=1).border = Border()
    for did, q, default in DECISIONS:
        row += 1
        body_cell(ws, row, 2, q)
        body_cell(ws, row, 3, did, font=F_BOLD, center=True)
        body_cell(ws, row, 4, default)
        ws.row_dimensions[row].height = 32

    row += 2
    ws.cell(row=row, column=2, value="ที่มา").font = F_H2
    for text in ["docs/markdown/dev/architecture/api-design.md §3 — contract",
                 "docs/markdown/dev/planning/api-design-plan.md — กฎ ความปลอดภัย endpoint ที่เสนอเพิ่ม ลำดับงาน",
                 "docs/pages/index-q.html — ตาราง PERM และ capOf (ที่มาของ Capability)"]:
        row += 1
        ws.cell(row=row, column=2, value=text).font = F_BODY


def write_json():
    design = {(r[0], r[1]): r for r in DESIGN}
    rows = []
    for i, r in enumerate(E, 1):
        group, method, path, what, role, scope, cap, fr, status, phase, issue, mig, note = r
        d = design.get((method, path))
        rows.append({
            "n": i, "group": group, "method": method, "path": path, "fullPath": PREFIX + path,
            "what": what, "role": role, "courseScope": scope, "capability": cap, "fr": fr,
            "status": {ST_DONE: "done", ST_CONTRACT: "contract", ST_NEW: "new", ST_LATER: "later"}[status],
            "phase": phase, "needs0008": mig == "✓",
            "classification": dict(zip(("operation", "effect", "access", "caution"),
                                       classify(method, path, role, cap, status))),
            "design": None if d is None else dict(zip(
                ("params", "body", "success", "errors", "rules", "tests"), d[2:])),
            "bodyFields": BODY_FIELDS.get((method, path)),
            "enumFields": ENUM_FIELDS.get((method, path)),
        })
    JSON_OUT.write_text(json.dumps({"prefix": PREFIX, "endpoints": rows}, ensure_ascii=False, indent=1) + chr(10),
                        encoding="utf-8", newline=chr(10))  # LF on every OS, so CI sees no diff


def main():
    if not check_drift():
        print("ไม่สร้างไฟล์ — แก้รายการ E ในสคริปต์ให้ตรงกับ api-design.md §3 ก่อน")
        return 1
    wb = Workbook()
    sheet_readme(wb)
    sheet_endpoints(wb)
    sheet_classification(wb)
    sheet_design(wb)
    sheet_table(wb, "Rules", ["#", "กฎ", "ที่มา"], RULES, [7, 100, 18])
    sheet_table(wb, "Security", ["#", "มาตรการ", "สถานะ"], SECURITY, [7, 100, 28])
    wb.save(OUT)
    write_json()
    by = {}
    for r in E:
        by[r[8]] = by.get(r[8], 0) + 1
    print("เขียน %s — %d endpoint (%s)" % (
        OUT.relative_to(ROOT), len(E), " · ".join("%s %d" % (k, v) for k, v in by.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
