"""
Build docs/excel/CMAS-API-Endpoints.xlsx — every endpoint of the CMAS API on one
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
Output: docs/excel/CMAS-API-Endpoints.xlsx
"""

import io
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
OUT = ROOT / "docs" / "excel" / "CMAS-API-Endpoints.xlsx"
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
    (G_AUTH, "POST", "/auth/refresh", "ขอ access token ใหม่ด้วย refresh token", NONE, NO, NO, "FR-01", ST_CONTRACT, "P0", "", "✓", "ตาราง RefreshToken ตาม D-2"),
    (G_AUTH, "POST", "/auth/logout", "ออกจากระบบและเพิกถอน refresh token", LOGGED, NO, NO, "FR-01", ST_CONTRACT, "P0", "", "✓", "ตาราง RefreshToken ตาม D-2"),
    (G_AUTH, "GET", "/auth/me", "ข้อมูลและบทบาทของผู้ใช้ที่ล็อกอินอยู่", LOGGED, NO, READ, "NFR-19", ST_CONTRACT, "P0", "", "", ""),
    (G_AUTH, "PATCH", "/auth/password", "เปลี่ยนรหัสผ่านของตัวเอง", LOGGED, NO, NO, "FR-09", ST_LATER, "—", "", "", "รอ D-5"),
    # ── 2 บัญชีผู้ใช้ ────────────────────────────────────────────────────────
    (G_USER, "GET", "/users", "รายการบัญชี กรองด้วย ?status=PENDING หรือ ACTIVE", ADMIN, NO, "user.manage", "FR-05, FR-08b", ST_DONE, "—", "", "", ""),
    (G_USER, "PATCH", "/users/:id/approve", "อนุมัติบัญชีที่รออนุมัติ", ADMIN, NO, "user.manage", "FR-08b", ST_DONE, "—", "", "", "โค้ดใช้ :id ไม่ใช่ :userId"),
    (G_USER, "POST", "/users", "สร้างบัญชีผู้ใช้", ADMIN, NO, "user.manage", "FR-05", ST_LATER, "—", "", "", "รอ D-5"),
    (G_USER, "GET", "/users/:userId", "รายละเอียดบัญชีหนึ่งคน", ADMIN, NO, "user.manage", "FR-05", ST_CONTRACT, "P2", "", "", ""),
    (G_USER, "PATCH", "/users/:userId", "แก้ชื่อหรือบทบาทของบัญชี", ADMIN, NO, "user.manage", "FR-05", ST_CONTRACT, "P2", "", "", ""),
    (G_USER, "PATCH", "/users/:userId/status", "เปิดหรือปิดการใช้งานบัญชี", ADMIN, NO, "user.manage", "FR-03, FR-06", ST_CONTRACT, "P2", "", "", ""),
    (G_USER, "POST", "/users/:userId/reset-password", "รีเซ็ตรหัสผ่านให้ผู้ใช้", ADMIN, NO, "user.manage", "FR-07", ST_LATER, "—", "", "", "รอ D-5 · ต้องมี mustChangePassword (G-4)"),
    (G_USER, "GET", "/users/:userId/auth-events", "ประวัติบัญชี รวมการถูกปฏิเสธสิทธิ์", ADMIN, NO, "user.manage", "UC 1.6", ST_NEW, "P5", "", "✓", ""),
    # ── 3 รายวิชา ───────────────────────────────────────────────────────────
    (G_COURSE, "GET", "/courses", "รายวิชาที่ผู้เรียกมองเห็น", LOGGED, FILTER, READ, "FR-24, FR-25", ST_CONTRACT, "P2", "#6", "", ""),
    (G_COURSE, "POST", "/courses", "สร้างรายวิชา ผู้สร้างเป็นผู้สอนใน transaction เดียวกัน", BOTH, NO, "course.create", "FR-20, FR-21, FR-27, FR-28", ST_CONTRACT, "P2", "#6", "", ""),
    (G_COURSE, "GET", "/courses/:courseId", "รายละเอียดรายวิชา", ANY, URL, READ, "FR-25", ST_CONTRACT, "P2", "#6", "", ""),
    (G_COURSE, "PATCH", "/courses/:courseId", "แก้ข้อมูลและการตั้งค่ารายวิชา (เกณฑ์ผ่าน วิธีตัดเกรด)", ANY, URL, "course.settings", "FR-20, FR-47, FR-90", ST_CONTRACT, "P2", "#6", "", ""),
    (G_COURSE, "DELETE", "/courses/:courseId", "ลบรายวิชา ต้องส่ง ?confirm=true", BOTH, URL, "course.delete", "FR-26", ST_CONTRACT, "P2", "#6", "", ""),
    (G_COURSE, "GET", "/courses/:courseId/impact", "จำนวนข้อมูลที่จะหายถ้าลบรายวิชา", ANY, URL, READ, "FR-26", ST_CONTRACT, "P2", "#6", "", ""),
    (G_COURSE, "GET", "/courses/:courseId/instructors", "รายชื่อผู้สอนของรายวิชา", ANY, URL, READ, "FR-22", ST_CONTRACT, "P2", "#6", "", ""),
    (G_COURSE, "POST", "/courses/:courseId/instructors", "เพิ่มผู้สอนเข้ารายวิชา", BOTH, URL, "staff.write", "FR-22, FR-23", ST_CONTRACT, "P2", "#6", "", ""),
    (G_COURSE, "DELETE", "/courses/:courseId/instructors/:userId", "เอาผู้สอนออก คนสุดท้ายเอาออกไม่ได้ (422)", BOTH, URL, "staff.write", "FR-23", ST_CONTRACT, "P2", "#6", "", "S-9"),
    (G_COURSE, "POST", "/courses/:courseId/duplicate", "คัดลอกรายวิชาเป็นรายวิชาใหม่", BOTH, URL, "course.create", "ต้นแบบ", ST_NEW, "P2", "", "", ""),
    # ── 4 CLO และจุดประสงค์ ─────────────────────────────────────────────────
    (G_CLO, "GET", "/courses/:courseId/clos", "รายการ CLO พร้อมจุดประสงค์", ANY, URL, READ, "FR-30, FR-32", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "POST", "/courses/:courseId/clos", "เพิ่ม CLO", ANY, URL, "clo.write", "FR-30, FR-31", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "PATCH", "/courses/:courseId/clos/reorder", "เรียงลำดับ CLO ใหม่", ANY, URL, "clo.write", "FR-31", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "PATCH", "/clos/:cloId", "แก้ CLO", ANY, RESOLVE, "clo.write", "FR-30", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "DELETE", "/clos/:cloId", "ลบ CLO เตือนถ้ามีคะแนนอ้างอิง", ANY, RESOLVE, "clo.write", "FR-36", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "GET", "/clos/:cloId/objectives", "จุดประสงค์เชิงพฤติกรรมของ CLO", ANY, RESOLVE, READ, "FR-33", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "POST", "/clos/:cloId/objectives", "เพิ่มจุดประสงค์", ANY, RESOLVE, "clo.write", "FR-33", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "PATCH", "/objectives/:objectiveId", "แก้จุดประสงค์", ANY, RESOLVE, "clo.write", "FR-33", ST_CONTRACT, "P3", "#7", "", ""),
    (G_CLO, "DELETE", "/objectives/:objectiveId", "ลบจุดประสงค์", ANY, RESOLVE, "clo.write", "FR-33", ST_CONTRACT, "P3", "#7", "", ""),
    # ── 5 กิจกรรมและเกณฑ์ ───────────────────────────────────────────────────
    (G_ACT, "GET", "/courses/:courseId/activities", "รายการกิจกรรมประเมิน", ANY, URL, READ, "FR-40, FR-43", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "POST", "/courses/:courseId/activities", "เพิ่มกิจกรรม", ANY, URL, "activity.write", "FR-40, FR-41", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "PATCH", "/courses/:courseId/activities/reorder", "เรียงลำดับกิจกรรมใหม่", ANY, URL, "activity.write", "FR-42", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "PATCH", "/activities/:activityId", "แก้กิจกรรม (ชื่อ คะแนนเต็ม น้ำหนัก)", ANY, RESOLVE, "activity.write", "FR-40, FR-41", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "DELETE", "/activities/:activityId", "ลบกิจกรรม", ANY, RESOLVE, "activity.delete", "FR-40", ST_CONTRACT, "P3", "#7", "", ""),
    (G_ACT, "GET", "/courses/:courseId/criteria", "เมทริกซ์ กิจกรรม × จุดประสงค์", ANY, URL, READ, "FR-44, FR-45, FR-48", ST_CONTRACT, "P3", "#7", "", ""),
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
        "FR / CR", "สถานะ", "ช่วงงาน", "Issue", "ต้องมี 0008", "หมายเหตุ"]
WIDTH = [5, 22, 9, 54, 48, 20, 17, 16, 24, 11, 9, 7, 11, 36]

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


def main():
    if not check_drift():
        print("ไม่สร้างไฟล์ — แก้รายการ E ในสคริปต์ให้ตรงกับ api-design.md §3 ก่อน")
        return 1
    wb = Workbook()
    sheet_readme(wb)
    sheet_endpoints(wb)
    sheet_table(wb, "Rules", ["#", "กฎ", "ที่มา"], RULES, [7, 100, 18])
    sheet_table(wb, "Security", ["#", "มาตรการ", "สถานะ"], SECURITY, [7, 100, 28])
    wb.save(OUT)
    by = {}
    for r in E:
        by[r[8]] = by.get(r[8], 0) + 1
    print("เขียน %s — %d endpoint (%s)" % (
        OUT.relative_to(ROOT), len(E), " · ".join("%s %d" % (k, v) for k, v in by.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
