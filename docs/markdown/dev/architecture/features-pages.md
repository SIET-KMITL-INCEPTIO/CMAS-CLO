# Feature List & Page Count — CMAS

See also: [[dev]] · [[code-rule]] · [[database-schema]] · [[schema]]

> อ้างอิงจาก `database/schema.prisma` ปัจจุบัน (migration 0001–0007) — **single-tenant, 13 models:** User,
> EmailVerificationToken, Course, CourseInstructor, CLO, BehavioralObjective, Activity, AssessmentCriteria,
> Student, Score, ScoreUploadLog, GradeBand, StudentGrade — และโครงสร้าง route ที่มีอยู่ใน `app/client/src/features/`
>
> **อัปเดต 2026-09-26:** ตามโมเดลหลัง 0005–0007 · ตัด `ObjectiveAssessment` (0006) · เพิ่ม feature **16 ตัดเกรด** ที่ SRS §4.10 มีแต่เอกสารนี้ตกหล่น →
> **14 feature / 14 หน้า** (เดิม 13/13) · สถานะ implement ยังเท่าเดิม: client มี 4 route (`/` · `/auth/login` · `/admin/users` · `/courses`)
>
> **อัปเดต 2026-08-04:** ตัด Curriculum / Institution ออกตามงาน 2.7 → เหลือ **13 feature / 13 หน้า**
> **ต้นแบบ:** ทุกหน้าที่ยัง "ไม่มีหน้า" ด้านล่างมีต้นแบบใช้งานได้แล้วใน `docs/pages/index-q.html` (ไม่ใช่โค้ดจริง — ดู [[index-q-architecture]])

---

## 1. Feature List

| # | Feature | Role ที่ใช้ได้ | อิงจาก Model | สถานะปัจจุบัน |
|---|---|---|---|---|
| 1 | **Authentication** — login (Google + อีเมล), ลงทะเบียนเอง (D6), logout, JWT session | ทุกคน | `User`, `EmailVerificationToken` | มีหน้า `Login.page.tsx` แล้ว · API มีเฉพาะ `POST /auth/google` |
| 2 | **User Management** — CRUD ผู้ใช้, เปิด/ปิดบัญชี (`isActive`), อนุมัติบัญชี Google นอกโดเมน (`status` PENDING → ACTIVE, FR-08b), กำหนด role | ADMIN | `User` | มีหน้า `Users.page.tsx` แล้ว · API มี `GET /users` · `PATCH /users/:id/approve` |
| ~~3~~ | ~~Curriculum Management~~ | ❌ **ตัดออก 2026-08-04** | — | — |
| ~~4~~ | ~~Curriculum Course~~ | ❌ **ตัดออก 2026-08-04** — หน่วยกิต/ชั่วโมง/gradeScale ย้ายไปอยู่บน `Course` (FR-27, FR-28) | — | — |
| 5 | **Course Management** — CRUD รายวิชาที่เปิดสอนจริงต่อเทอม, หน่วยกิต `3 (2-2-5)`, `gradeScale`, เกณฑ์ผ่านระดับวิชา (`passCriteria` · `cloPassMark` · `classTarget`), มอบหมายผู้สอน (สิทธิ์เท่ากันทุกคน) | ADMIN / INSTRUCTOR | `Course`, `CourseInstructor` | มีหน้า `CourseList.page.tsx` แล้ว (รายการอย่างเดียว) |
| 6 | **CLO Management** — CRUD CLO ต่อวิชา, drag-reorder (`number`), น้ำหนัก (`weight`), ระดับ Bloom + SOLO (`levelSource` AUTO/MANUAL), `classTarget` ราย CLO | INSTRUCTOR | `CLO` | ยังไม่มีหน้า |
| 7 | **Behavioral Objectives** — CRUD จุดประสงค์เชิงพฤติกรรมต่อ CLO พร้อมน้ำหนัก (รวม 100 ต่อ CLO) | INSTRUCTOR | `BehavioralObjective` | ยังไม่มีหน้า |
| 8 | **Activity Management** — CRUD กิจกรรมประเมิน, ประเภท (`type`) + วิธีประเมิน (`assessmentMethod`), drag-reorder (`order`), กำหนด `weight`/`maxScore`/`passMark` | INSTRUCTOR | `Activity` | ยังไม่มีหน้า |
| 9 | **Assessment Criteria Mapping** — ผูก Activity ↔ **จุดประสงค์เชิงพฤติกรรม** พร้อม weight ต่อคู่ (ถึง CLO ผ่านจุดประสงค์) | INSTRUCTOR | `AssessmentCriteria` | ยังไม่มีหน้า |
| 10 | **Student Roster** — CRUD รายชื่อนักศึกษาในวิชา | INSTRUCTOR | `Student` | ยังไม่มีหน้า |
| 11 | **Score Entry (manual)** — กรอกคะแนนรายกิจกรรมต่อนักศึกษา | INSTRUCTOR | `Score` | ยังไม่มีหน้า |
| 12 | **Score Import/Export (Excel)** — อัปโหลด/ดาวน์โหลดคะแนนเป็นไฟล์ Excel | INSTRUCTOR | `Score`, `ScoreUploadLog` | ยังไม่มีหน้า |
| 13 | **Score Upload Log** — ดูประวัติการอัปโหลดไฟล์, จำนวนแถวสำเร็จ/ล้มเหลว | INSTRUCTOR | `ScoreUploadLog` | ยังไม่มีหน้า |
| 14 | **CLO Attainment Dashboard** — กราฟสรุปผล CLO ต่อวิชา (แท่ง Target vs Actual + เรดาร์), at-risk detection | INSTRUCTOR | คำนวณจาก `Score` + `AssessmentCriteria` + `BehavioralObjective` | ยังไม่มีหน้า |
| 15 | **Student Individual Report** — ดูความก้าวหน้ารายบุคคลต่อ CLO | INSTRUCTOR | คำนวณจาก `Score` ของ `Student` | ยังไม่มีหน้า |
| 16 | **Grading (ตัดเกรด)** — ขั้นบันไดเกรดอิงเกณฑ์/อิงกลุ่ม, ประมวลผลและตรึงเกรด, ปรับเกรดรายบุคคลพร้อมเหตุผล (SRS §4.10 · CR-08…CR-11) | INSTRUCTOR | `GradeBand`, `StudentGrade` | ยังไม่มีหน้า |

**สรุป:** 14 feature หลัก — เสร็จแล้ว 3 (Auth, User Mgmt, Course List — ทั้งสามยังเป็นบางส่วนของ scope feature) เหลือ 11 ที่ต้องพัฒนา

---

## 2. Page Count

แผนที่หน้า (routes) ที่ต้องมีตามโครงสร้าง `app/client/src/features/` (อิงรูปแบบจาก [[dev]] §3.2):

| # | Route | หน้าจอ | Feature ที่เกี่ยวข้อง | สถานะ |
|---|---|---|---|---|
| 1 | `/` | Home / redirect | — | ✅ มีแล้ว |
| 2 | `/auth/login` | Login | 1 | ✅ มีแล้ว |
| 3 | `/admin/users` | User Management | 2 | ✅ มีแล้ว |
| ~~4~~ | ~~`/curricula`~~ | ❌ ตัดออก 2026-08-04 | — | — |
| ~~5~~ | ~~`/curricula/:curriculumId`~~ | ❌ ตัดออก 2026-08-04 | — | — |
| 6 | `/courses` | Course List | 5 | ✅ มีแล้ว |
| 7 | `/courses/new` | Create Course | 5 | ⬜ ต้องทำ |
| 8 | `/courses/:courseId` | Course Overview | 5 | ⬜ ต้องทำ |
| 9 | `/courses/:courseId/clos` | CLO Management (list + drag reorder) + จุดประสงค์เชิงพฤติกรรม | 6, 7 | ⬜ ต้องทำ |
| 10 | `/courses/:courseId/activities` | Activity Management (list + drag reorder) + เชื่อมกิจกรรมกับจุดประสงค์ | 8, 9 | ⬜ ต้องทำ |
| 11 | `/courses/:courseId/students` | Student Roster | 10 | ⬜ ต้องทำ |
| 12 | `/courses/:courseId/scores` | Score Entry + Excel Import/Export | 11, 12 | ⬜ ต้องทำ |
| 13 | `/courses/:courseId/scores/uploads` | Score Upload Log | 13 | ⬜ ต้องทำ |
| 14 | `/courses/:courseId/dashboard` | CLO Attainment Dashboard | 14 | ⬜ ต้องทำ |
| 15 | `/courses/:courseId/dashboard/students/:studentId` | Student Individual Report | 15 | ⬜ ต้องทำ |
| 16 | `/courses/:courseId/grading` | Grading — ขั้นบันไดเกรด + ตรึงเกรด | 16 | ⬜ ต้องทำ |

**รวมทั้งหมด: 14 หน้า** (เสร็จแล้ว 3 หน้า + Home / เหลือ 11 หน้า)

> หมายเหตุ: บาง route (เช่น `/courses/:courseId/scores/uploads`) อาจรวมเป็น tab เดียวกับหน้าอื่นแทนการแยกหน้าจริง หากทีมตัดสินใจตอน implement — ให้ปรับตารางนี้และแจ้งในรายงานประจำสัปดาห์ (ดู [[code-rule]] §7)

---

## 3. แบ่งงาน 3 คน — เจ้าของราย feature

> **แก้ 2026-09-13:** เลิกแบ่งแบบ Dev A/B/C ตามตาราง feature 13 ข้อด้านบน · ใช้ **9 package ใน Use Case Diagram**
> (`docs/uml/index-q/index-q-usecase.drawio`) แทน คนละ 3 feature · 1 feature มีเจ้าของคนเดียว ทำครบตั้งแต่ API ถึงหน้าจอ
> ลำดับงานราย sprint และจุดที่ต้องรอกันอยู่ใน [[sprint-plan-2026]]

| คน | Feature 1 | Feature 2 | Feature 3 | งานฐาน (ไม่อยู่ใน UML) |
|---|---|---|---|---|
| **ธีรณัฎฐ์** | 2 · จัดการรายวิชา | 5 · วิเคราะห์และสรุป CLO | 8 · ตัดเกรด | login · สิทธิ์ `can()` ที่ API · merge migration |
| **นัจญมา** | 1 · จัดการผู้ใช้งาน | 3 · กำหนด CLO | 4 · วัตถุประสงค์เชิงพฤติกรรม (วิธีและเกณฑ์การประเมิน) | — |
| **นูรีน** | 7 · นำเข้า-ส่งออกรายชื่อ | 6 · นำเข้า-ส่งออกคะแนน | 9 · บัญชีของฉัน | AppShell + components · `ExcelWorkbookWriter` · seed data |

**เทียบกับ feature ในตาราง §1**

| Feature ใน §1 | อยู่ใน UML package | เจ้าของ |
|---|---|---|
| 1 Authentication | งานฐาน · 9 บัญชีของฉัน | ธีรณัฎฐ์ (login) · นูรีน (บัญชีตนเอง) |
| 2 User Management | 1 จัดการผู้ใช้งาน | นัจญมา |
| 5 Course Management | 2 จัดการรายวิชา | ธีรณัฎฐ์ |
| 6 CLO Management | 3 กำหนด CLO | นัจญมา |
| 7 Behavioral Objectives · 8 Activity · 9 Assessment Criteria | 4 วัตถุประสงค์เชิงพฤติกรรม | นัจญมา |
| 10 Student Roster | 7 นำเข้า-ส่งออกรายชื่อ | นูรีน |
| 11 Score Entry · 12 Import/Export · 13 Upload Log | 6 นำเข้า-ส่งออกคะแนน | นูรีน |
| 14 Dashboard · 15 Individual Report | 5 วิเคราะห์และสรุป CLO | ธีรณัฎฐ์ |
| 16 Grading | 8 ตัดเกรด | ธีรณัฎฐ์ |

> สูตรคำนวณทั้งหมด (CR-01…CR-11) อยู่ใน feature ของธีรณัฎฐ์ เพื่อไม่ให้คำนวณซ้ำคนละที่ (FR-88) · รายงานแผนสุดท้ายกลับให้เจ้าของโปรเจกต์ตาม [[code-rule]] §7

---

_อัปเดตเอกสารนี้ทุกครั้งที่ feature scope เปลี่ยน — ถือเป็น source of truth ของ scope ทั้งโปรเจกต์_
