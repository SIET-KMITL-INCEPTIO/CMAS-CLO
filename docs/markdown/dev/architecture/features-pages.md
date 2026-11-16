# Feature List & Page Count — CMAS

See also: [[dev]] · [[code-rule]] · [[database-schema]] · [[schema]] · [[prototype-to-app]]

> อ้างอิงจาก `database/schema.prisma` ปัจจุบัน (migration 0001–0009) — **single-tenant, 19 models** — และ route จริงใน
> `app/client/src/pages.config.ts` ของ `feature/frontend-index-q`
>
> **อัปเดต 2026-11-14 — ตาม UI ของ `feature/frontend-index-q` (หลังรวม develop):** สถานะทุกแถวตรวจจากโค้ดจริง ·
> client มี **11 route** (นอก login) และทุกหน้าในรายวิชามีแล้ว · หน้าในรายวิชายุบตามต้นแบบ: รายชื่อ + คะแนน + นำเข้า + ประวัติอยู่หน้าเดียว (`/roster`) ·
> ผลรายบุคคลเป็นลิ้นชักในหน้า `/results` · ตรงกับเล่ม §3.5.3 ที่ยุบ 9 กลุ่มยูสเคสเหลือ 6 ส่วน
>
> **อัปเดต 2026-10-14 — ตามต้นแบบ `docs/index-q/index-q.html`:** เพิ่ม §1.1 ฟังก์ชันที่ต้นแบบมีแต่ตาราง §1 ยังไม่ได้แยกออกมา
> (ถอนรายวิชา · ปิดรับคะแนน · ยกเว้น · ประวัติการแก้คะแนน · เลิกทำ · ทำสำเนา ฯลฯ) และ §2.1 เทียบหน้าในต้นแบบกับ route ของแอป
> ตาราง §1 และ §2 เดิมไม่เปลี่ยน · ชื่อปุ่มในตารางใหม่คัดจากต้นแบบตรงตัว
>
> **อัปเดต 2026-09-26:** ตามโมเดลหลัง 0005–0007 · ตัด `ObjectiveAssessment` (0006) · เพิ่ม feature **16 ตัดเกรด** ที่ SRS §4.10 มีแต่เอกสารนี้ตกหล่น →
> **14 feature / 14 หน้า** (เดิม 13/13) · สถานะ implement ยังเท่าเดิม: client มี 4 route (`/` · `/auth/login` · `/admin/users` · `/courses`)
>
> **อัปเดต 2026-08-04:** ตัด Curriculum / Institution ออกตามงาน 2.7 → เหลือ **13 feature / 13 หน้า**
> **ต้นแบบ:** ทุกหน้าที่ยัง "ไม่มีหน้า" ด้านล่างมีต้นแบบใช้งานได้แล้วใน `docs/index-q/index-q.html` (ไม่ใช่โค้ดจริง — ดู [[index-q-architecture]])

---

## 1. Feature List

| # | Feature | Role ที่ใช้ได้ | อิงจาก Model | สถานะปัจจุบัน |
|---|---|---|---|---|
| 1 | **Authentication** — login (Google + ลิงก์อีเมล · ไม่มีรหัสผ่าน), บัญชีนอกโดเมนรออนุมัติ, logout, JWT session | ทุกคน | `User`, `EmailVerificationToken` | ✅ `Login.page.tsx` — Google เท่านั้น · ลิงก์อีเมล (FR-07) ⬜ ไม่มีทั้งหน้าและ API |
| 2 | **User Management** — CRUD ผู้ใช้, เปิด/ปิดบัญชี (`isActive`), อนุมัติบัญชี Google นอกโดเมน (`status` PENDING → ACTIVE, FR-08b), กำหนด role | ADMIN | `User` | ✅ `/admin/users` — รายการ · ลิ้นชักบัญชี (`UserDrawer`) · ฟอร์ม · อนุมัติ · ระงับ · ประวัติบัญชี |
| ~~3~~ | ~~Curriculum Management~~ | ❌ **ตัดออก 2026-08-04** | — | — |
| ~~4~~ | ~~Curriculum Course~~ | ❌ **ตัดออก 2026-08-04** — หน่วยกิต/ชั่วโมง/gradeScale ย้ายไปอยู่บน `Course` (FR-27, FR-28) | — | — |
| 5 | **Course Management** — CRUD รายวิชาที่เปิดสอนจริงต่อเทอม, หน่วยกิต `3 (2-2-5)`, `gradeScale`, เกณฑ์ผ่านระดับวิชา (`passCriteria` · `cloPassMark` · `classTarget`), มอบหมายผู้สอน (สิทธิ์เท่ากันทุกคน) | ADMIN / INSTRUCTOR | `Course`, `CourseInstructor` | ✅ `/courses` (การ์ด/ตาราง · สร้าง · ตั้งค่า · ทำสำเนา · ลบ) · `/courses/:courseId` ภาพรวม |
| 6 | **CLO Management** — CRUD CLO ต่อวิชา, drag-reorder (`number`), น้ำหนัก (`weight`), ระดับ Bloom + SOLO (`levelSource` AUTO/MANUAL), `classTarget` ราย CLO | INSTRUCTOR | `CLO` | ✅ `/courses/:courseId/clos` |
| 7 | **Behavioral Objectives** — CRUD จุดประสงค์เชิงพฤติกรรมต่อ CLO พร้อมน้ำหนัก (รวม 100 ต่อ CLO) | INSTRUCTOR | `BehavioralObjective` | ✅ `/courses/:courseId/objectives` |
| 8 | **Activity Management** — CRUD กิจกรรมประเมิน, ประเภท (`type`) + วิธีประเมิน (`assessmentMethod`), drag-reorder (`order`), กำหนด `weight`/`maxScore`/`passMark` | INSTRUCTOR | `Activity` | ✅ `/courses/:courseId/activities` |
| 9 | **Assessment Criteria Mapping** — ผูก Activity ↔ **จุดประสงค์เชิงพฤติกรรม** พร้อม weight ต่อคู่ (ถึง CLO ผ่านจุดประสงค์) | INSTRUCTOR | `AssessmentCriteria` | ✅ ตารางเมทริกซ์ใน `/activities` (`CriteriaMatrix`) |
| 10 | **Student Roster** — CRUD รายชื่อนักศึกษาในวิชา | INSTRUCTOR | `Student` | ✅ `/courses/:courseId/roster` |
| 11 | **Score Entry (manual)** — กรอกคะแนนรายกิจกรรมต่อนักศึกษา | INSTRUCTOR | `Score` | ✅ ตารางคะแนนใน `/roster` (`ScoreGrid`) |
| 12 | **Score Import/Export (Excel)** — อัปโหลด/ดาวน์โหลดคะแนนเป็นไฟล์ Excel | INSTRUCTOR | `Score`, `ScoreUploadLog` | ✅ `ImportExcel` ใน `/roster` · ส่งออกจาก `/results` · `/grading` |
| 13 | **Score Upload Log** — ดูประวัติการอัปโหลดไฟล์, จำนวนแถวสำเร็จ/ล้มเหลว | INSTRUCTOR | `ScoreUploadLog` | ✅ ประวัติการนำเข้าและแถวที่ไม่ผ่านใน `ImportExcel` · ประวัติการแก้คะแนนใน `ChangesDrawer` |
| 14 | **CLO Attainment Dashboard** — กราฟสรุปผล CLO ต่อวิชา (แท่ง Target vs Actual + เรดาร์), at-risk detection | INSTRUCTOR | คำนวณจาก `Score` + `AssessmentCriteria` + `BehavioralObjective` | ✅ ภาพรวมใน `/courses/:courseId` · ตารางผลทั้งชั้นใน `/results` |
| 15 | **Student Individual Report** — ดูความก้าวหน้ารายบุคคลต่อ CLO | INSTRUCTOR | คำนวณจาก `Score` ของ `Student` | ✅ ลิ้นชัก `StudentDrawer` ใน `/results` (ไม่มี route แยก) |
| 16 | **Grading (ตัดเกรด)** — ขั้นบันไดเกรดอิงเกณฑ์/อิงกลุ่ม, ประมวลผลและตรึงเกรด, ปรับเกรดรายบุคคลพร้อมเหตุผล (SRS §4.10 · CR-08…CR-11) | INSTRUCTOR | `GradeBand`, `StudentGrade` | ✅ `/courses/:courseId/grading` |

### 1.1 ฟังก์ชันในต้นแบบที่ตาราง §1 ยังไม่ได้แยกออกมา

ทุกแถวมีอยู่และใช้งานได้ใน `index-q.html` แล้ว · คอลัมน์ "สิทธิ์" คือ capability ในตาราง `PERM` ของต้นแบบ ·
แถวที่มี ★ ต้องเพิ่มตารางหรือคอลัมน์ใน migration `0008` ก่อน (รายการอยู่ใน `docs/reference/db/mysql/index-q.sql`)

| Feature ใน §1 | ฟังก์ชัน | ปุ่มในต้นแบบ | สิทธิ์ | ข้อกำหนด |
|---|---|---|---|---|
| 5 Course | ทำสำเนารายวิชาไปภาคเรียนใหม่ | "ทำสำเนารายวิชา" | `course.create` | — |
| 5 Course | ตั้งค่ารายวิชา (เกณฑ์ผ่าน · วิธีตัดเกรด · ผู้สอน) | "ตั้งค่ารายวิชา" | `course.settings` · `staff.write` | FR-20, FR-22, FR-90 |
| 7 Objectives | แบ่งน้ำหนักจุดประสงค์ให้เท่ากัน | "แบ่งเท่ากัน" | `clo.write` | FR-33 |
| 8 Activity | ทำสำเนากิจกรรม | "ทำสำเนา" | `activity.write` | — |
| 8 Activity | ★ น้ำหนักรายกลุ่มตามประเภทกิจกรรม | ช่องน้ำหนักบนหัวกลุ่ม | `activity.write` | ต้นแบบ N1/N2 |
| 10 Roster | ★ ถอนรายวิชา / คืนสถานะ — ออกจากตัวหารทุกตัว คะแนนเดิมยังเก็บไว้ | "ถอนรายวิชา" · "คืนสถานะ (กลับเข้าผลการประเมิน)" | `student.write` | CR-05.1, CR-10 |
| 10 Roster | นำเข้ารายชื่อจาก Excel | "นำเข้ารายชื่อจาก Excel" · "ดาวน์โหลดเทมเพลตรายชื่อ" | `student.write` | FR-52 |
| ~~11 Score Entry~~ | ~~★ ปิดรับคะแนน — ช่องว่างหลังปิดคือ "ขาดส่ง"~~ | **ต้นแบบตัดออก 2026-11-14** (แทนด้วย `passNow` · [[srs]] CR-05.2) · ⚠ แอปยังมี `scores/CloseActivity.tsx` | `score.edit` | ~~FR-111~~ · OI-18 |
| 11 Score Entry | ★ ยกเว้นกิจกรรมรายคน พร้อมเหตุผล | เมนูของช่อง → "ยกเว้น…" | `score.edit` | CR-05.1 |
| 11 Score Entry | เติมคะแนนเต็มทั้งคอลัมน์แล้วหักรายคน | "เริ่มจากคะแนนเต็ม" | `score.edit` | — |
| 11 Score Entry | วางคะแนนจาก Excel ลงตาราง | วาง (Ctrl+V) บนตาราง | `score.edit` | — |
| 11 Score Entry | เลิกทำการแก้ล่าสุด | "เลิกทำ" (Ctrl+Z) | สิทธิ์เดียวกับการแก้ที่เลิก | — |
| 11 Score Entry | ★ ประวัติการแก้คะแนน — ใคร เมื่อไร จากอะไรเป็นอะไร | "ประวัติการแก้คะแนน" | อ่าน | NFR-16 |
| 13 Upload Log | ★ แถวที่นำเข้าไม่ผ่าน ดาวน์โหลดได้ | ขั้นตรวจของตัวนำเข้า | `score.import` | FR-68 |
| 14 Dashboard | ส่งออกตารางสอบทาน | "ส่งออกตารางสอบทาน" | `results.export` | FR-87 |
| 16 Grading | ประมวลผลและตรึงเกรด / ยกเลิกการตรึง | "ประมวลผลเกรด" · "ยกเลิกการตรึงเกรด" | `grading.run` | CR-11, FR-96 |
| 16 Grading | ปรับเกรดรายบุคคลพร้อมเหตุผล | "ปรับเกรด" · "ยกเลิกการปรับ" | `grade.override` | FR-95 |
| 16 Grading | แก้ขอบเขตเกรด | "+ ระดับเกรด" | `band.write` | FR-91 |
| 16 Grading | ส่งออกผลการเรียน | "ส่งออกผลการเรียน" | `results.export` | FR-87 |
| 1 Auth | เข้าสู่ระบบด้วย Google หรือลิงก์อีเมล (ไม่มีรหัสผ่าน) และหน้าบัญชีของฉัน | "ส่งลิงก์เข้าสู่ระบบ" · "บัญชีของฉัน" | ทุกคน | FR-01, FR-07, FR-08 |
| 2 User Mgmt | ดูประวัติบัญชี · อนุมัติบัญชีที่รออนุมัติ | "ตรวจสอบ" · "อนุมัติ" | `user.manage` | FR-08b, FR-22b |

**สรุป:** 14 feature หลัก — เสร็จแล้ว 3 (Auth, User Mgmt, Course List — ทั้งสามยังเป็นบางส่วนของ scope feature) เหลือ 11 ที่ต้องพัฒนา

---

## 2. Page Count

แผนที่หน้า (routes) ที่ต้องมีตามโครงสร้าง `app/client/src/features/` (อิงรูปแบบจาก [[dev]] §3.2):

| # | Route | หน้าจอ (ไฟล์) | Feature ที่เกี่ยวข้อง | สถานะ |
|---|---|---|---|---|
| 1 | `/` | Home (`home/Home.page.tsx`) | — | ✅ |
| 2 | `/auth/login` | Login | 1 | ✅ |
| 3 | `/admin/users` | จัดการผู้ใช้งาน | 2 | ✅ |
| ~~4–5~~ | ~~`/curricula…`~~ | ❌ ตัดออก 2026-08-04 | — | — |
| 6 | `/courses` | จัดการรายวิชา · สร้างผ่าน `?new=1` (ไม่มี `/courses/new`) | 5 | ✅ |
| 7 | `/courses/:courseId` | ภาพรวมรายวิชา + แถบขั้นตอนตั้งค่า | 5, 14 | ✅ |
| 8 | `/courses/:courseId/clos` | CLO | 6 | ✅ |
| 9 | `/courses/:courseId/objectives` | จุดประสงค์เชิงพฤติกรรม | 7 | ✅ |
| 10 | `/courses/:courseId/activities` | กิจกรรมและวิธีประเมิน + เมทริกซ์ | 8, 9 | ✅ |
| 11 | `/courses/:courseId/roster` | นักศึกษาและคะแนน · นำเข้า Excel · ประวัติ | 10–13 | ✅ |
| 12 | `/courses/:courseId/results` | ผลรายนักศึกษา + รายงานรายบุคคล (ลิ้นชัก) | 14, 15 | ✅ |
| 13 | `/courses/:courseId/grading` | การตัดเกรด | 16 | ✅ |

**รวม 11 route ที่ต้องเข้าสู่ระบบ + login** · ทุกหน้าตามต้นแบบมีแล้ว · ยังไม่มีหน้าลิงก์อีเมล (`/auth/verify`) เพราะ API ยังไม่มี

### 2.1 หน้าในต้นแบบ `index-q.html` เทียบกับ route ของแอป

ต้นแบบมี **10 หน้า** แบ่งสองระดับ (ตาราง `ROUTES` ในต้นแบบ) · หน้าในรายวิชาเปิดจากแถบซ้ายของรายวิชา
และจาก **แถบขั้นตอนตั้งค่า 6 ขั้น** ด้านบน (ดู [[user-flow]] §3)

| ระดับ | หน้าในต้นแบบ | แท็บย่อย | route ในตาราง §2 |
|---|---|---|---|
| รายวิชา | ภาพรวม | — | 7 `/courses/:courseId` |
| รายวิชา | CLO | — | 8 `/clos` |
| รายวิชา | จุดประสงค์ | — | 9 `/objectives` |
| รายวิชา | กิจกรรมและวิธีประเมิน | กิจกรรมและวิธีประเมิน · ตรวจการเชื่อมกับ CLO | 10 `/activities` |
| รายวิชา | นักศึกษาและคะแนน | — (รวมรายชื่อ กรอกคะแนน และนำเข้า) | 11 `/roster` |
| รายวิชา | ผลรายนักศึกษา | ร้อยละราย CLO · คะแนนดิบราย CLO | 12 `/results` |
| รายวิชา | การตัดเกรด | — | 13 `/grading` |
| ระบบ | จัดการรายวิชา | — | 6 `/courses` |
| ระบบ | จัดการผู้ใช้งาน | ผู้ใช้ทั้งหมด · ผู้สอน · ผู้ดูแลระบบ · ระงับการใช้งาน | 3 `/admin/users` |
| ระบบ | ความครอบคลุมของแบบจำลอง | — | ไม่มี — เป็นเครื่องมือตรวจต้นแบบ ไม่ใช่หน้าของแอป |

> หมายเหตุ: บาง route (เช่น `/courses/:courseId/scores/uploads`) อาจรวมเป็น tab เดียวกับหน้าอื่นแทนการแยกหน้าจริง หากทีมตัดสินใจตอน implement — ให้ปรับตารางนี้และแจ้งในรายงานประจำสัปดาห์ (ดู [[code-rule]] §7)

---

## 3. แบ่งงาน 3 คน — เจ้าของราย feature

> **แก้ 2026-09-13:** เลิกแบ่งแบบ Dev A/B/C ตามตาราง feature 13 ข้อด้านบน · ใช้ **9 package ใน Use Case Diagram**
> (`docs/diagrams/usecase/index-q-usecase.drawio`) แทน คนละ 3 feature · 1 feature มีเจ้าของคนเดียว ทำครบตั้งแต่ API ถึงหน้าจอ
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
