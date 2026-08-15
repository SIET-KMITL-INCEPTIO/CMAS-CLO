# Feature List & Page Count — CMAS

See also: [[dev]] · [[code-rule]] · [[database-schema]] · [[schema]]

> อ้างอิงจาก `database/schema.prisma` ปัจจุบัน — **single-tenant, 11 models:** User, Course,
> CourseInstructor, CLO, BehavioralObjective, Activity, AssessmentCriteria, ObjectiveAssessment,
> Student, Score, ScoreUploadLog — และโครงสร้าง route ที่มีอยู่ใน `app/client/src/pages/`
>
> **อัปเดต 2026-08-04:** ตัด Curriculum / Institution ออกตามงาน 2.7 → เหลือ **13 feature / 13 หน้า**

---

## 1. Feature List

| # | Feature | Role ที่ใช้ได้ | อิงจาก Model | สถานะปัจจุบัน |
|---|---|---|---|---|
| 1 | **Authentication** — login, logout, JWT session | ทุกคน | `User` | มีหน้า `Login.tsx` แล้ว |
| 2 | **User Management** — CRUD ผู้ใช้, เปิด/ปิดบัญชี (`isActive`), กำหนด role | ADMIN | `User` | มีหน้า `Users.tsx` แล้ว |
| ~~3~~ | ~~Curriculum Management~~ | ❌ **ตัดออก 2026-08-04** | — | — |
| ~~4~~ | ~~Curriculum Course~~ | ❌ **ตัดออก 2026-08-04** — หน่วยกิต/ชั่วโมง/gradingType ย้ายไปอยู่บน `Course` (FR-27, FR-28) | — | — |
| 5 | **Course Management** — CRUD รายวิชาที่เปิดสอนจริงต่อเทอม, หน่วยกิต `3 (2-2-5)`, gradingType, มอบหมายอาจารย์ | ADMIN / INSTRUCTOR | `Course`, `CourseInstructor` | มีหน้า `CourseList.tsx` แล้ว |
| 6 | **CLO Management** — CRUD CLO ต่อวิชา, drag-reorder (`number`), ตั้ง threshold | INSTRUCTOR | `CLO` | ยังไม่มีหน้า |
| 7 | **Behavioral Objectives** — CRUD จุดประสงค์เชิงพฤติกรรมต่อ CLO | INSTRUCTOR | `BehavioralObjective` | ยังไม่มีหน้า |
| 8 | **Activity Management** — CRUD กิจกรรมประเมิน (สอบ/งาน), drag-reorder (`order`), กำหนด `weight`/`maxScore` | INSTRUCTOR | `Activity` | ยังไม่มีหน้า |
| 9 | **Assessment Criteria Mapping** — ผูก Activity ↔ CLO พร้อม weight ต่อคู่ | INSTRUCTOR | `AssessmentCriteria` | ยังไม่มีหน้า |
| 10 | **Student Roster** — CRUD รายชื่อนักศึกษาในวิชา | INSTRUCTOR | `Student` | ยังไม่มีหน้า |
| 11 | **Score Entry (manual)** — กรอกคะแนนรายกิจกรรมต่อนักศึกษา | INSTRUCTOR | `Score` | ยังไม่มีหน้า |
| 12 | **Score Import/Export (Excel)** — อัปโหลด/ดาวน์โหลดคะแนนเป็นไฟล์ Excel | INSTRUCTOR | `Score`, `ScoreUploadLog` | ยังไม่มีหน้า |
| 13 | **Score Upload Log** — ดูประวัติการอัปโหลดไฟล์, จำนวนแถวสำเร็จ/ล้มเหลว | INSTRUCTOR | `ScoreUploadLog` | ยังไม่มีหน้า |
| 14 | **CLO Attainment Dashboard** — กราฟสรุปผล CLO ต่อวิชา, at-risk detection | INSTRUCTOR | คำนวณจาก `Score` + `AssessmentCriteria` | ยังไม่มีหน้า |
| 15 | **Student Individual Report** — ดูความก้าวหน้ารายบุคคลต่อ CLO | INSTRUCTOR | คำนวณจาก `Score` ของ `Student` | ยังไม่มีหน้า |

**สรุป:** 13 feature หลัก — เสร็จแล้ว 3 (Auth, User Mgmt, Course List) เหลือ 10 ที่ต้องพัฒนา

---

## 2. Page Count

แผนที่หน้า (routes) ที่ต้องมีตามโครงสร้าง `app/client/src/pages/` (อิงรูปแบบจาก [[dev]] §3.2):

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
| 9 | `/courses/:courseId/clos` | CLO Management (list + drag reorder + objectives) | 6, 7 | ⬜ ต้องทำ |
| 10 | `/courses/:courseId/activities` | Activity Management (list + drag reorder + criteria mapping) | 8, 9 | ⬜ ต้องทำ |
| 11 | `/courses/:courseId/students` | Student Roster | 10 | ⬜ ต้องทำ |
| 12 | `/courses/:courseId/scores` | Score Entry + Excel Import/Export | 11, 12 | ⬜ ต้องทำ |
| 13 | `/courses/:courseId/scores/uploads` | Score Upload Log | 13 | ⬜ ต้องทำ |
| 14 | `/courses/:courseId/dashboard` | CLO Attainment Dashboard | 14 | ⬜ ต้องทำ |
| 15 | `/courses/:courseId/dashboard/students/:studentId` | Student Individual Report | 15 | ⬜ ต้องทำ |

**รวมทั้งหมด: 13 หน้า** (เสร็จแล้ว 3 หน้า / เหลือ 10 หน้า)

> หมายเหตุ: บาง route (เช่น `/courses/:courseId/scores/uploads`) อาจรวมเป็น tab เดียวกับหน้าอื่นแทนการแยกหน้าจริง หากทีมตัดสินใจตอน implement — ให้ปรับตารางนี้และแจ้งในรายงานประจำสัปดาห์ (ดู [[code-rule]] §7)

---

## 3. Suggested Split งาน 3 คน

แบ่งตาม module เพื่อลด conflict (แต่ละคนคุม end-to-end: route + component + service + controller ของ module ตัวเอง ตาม [[code-rule]]):

| คน | รับผิดชอบ | Feature # |
|---|---|---|
| Dev A | Course module (รวมหน่วยกิต/gradingType/มอบหมายอาจารย์) + Auth/User | 1, 2, 5 |
| Dev B | CLO + Activity + Assessment Criteria (core CLO system) | 6, 7, 8, 9 |
| Dev C | Student + Score (entry/import/export/log) + Dashboard | 10, 11, 12, 13, 14, 15 |

> การแบ่งนี้เป็นข้อเสนอเบื้องต้น — ให้ทีมคุยและ confirm scope ก่อนเริ่ม แล้วรายงานแผนสุดท้ายกลับให้เจ้าของโปรเจกต์ตาม [[code-rule]] §7

---

_อัปเดตเอกสารนี้ทุกครั้งที่ feature scope เปลี่ยน — ถือเป็น source of truth ของ scope ทั้งโปรเจกต์_
