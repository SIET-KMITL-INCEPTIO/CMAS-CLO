# Software Requirements Specification (SRS)

See also: [[dev]] · [[features-pages]] · [[schema]] · [[usecase]] · [[code-rule]] · [[design-system]]

## ระบบติดตามและประเมินผลลัพธ์การเรียนรู้ที่คาดหวังระดับรายวิชา (CLO System / CMAS)

> **Version:** 2.0.0 | **Updated:** 2026-08-04 | **Owner:** ทีมพัฒนา 67030098 / 67030110 / 67030120
> **Baseline:** `database/schema.prisma` (**11 models — single-tenant**) + Figma `Project CLOs` (14 frames)
> **สถานะ:** Draft — §9 มีข้อตัดสินใจที่ยังค้าง ต้อง sign-off ก่อนเริ่ม implement module ที่เกี่ยวข้อง
>
> **v2.0.0 — การเปลี่ยนขอบเขตครั้งใหญ่ (2026-08-04, งาน 2.7 ปิด E-06):** ระบบเป็น **single-tenant**
> ตัด `Institution` · `Membership` · `Curriculum` · `CurriculumCourse` และ tenant guard ออกทั้งหมด
> `Course` เป็นรากของลำดับชั้นข้อมูล · role อยู่บน `User` · ยกเลิก FR-10…FR-15, NFR-17, NFR-18,
> DC-09…DC-13, UC0 · เพิ่ม FR-27, FR-28, NFR-19, DC-15 · ปิด OI-11

---

## สารบัญ

1. [บทนำ](#1-บทนำ)
2. [ภาพรวมระบบ](#2-ภาพรวมระบบ)
3. [กฎการคำนวณ (Calculation Rules)](#3-กฎการคำนวณ-calculation-rules)
4. [Functional Requirements](#4-functional-requirements)
5. [External Interface Requirements](#5-external-interface-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Requirements & Constraints](#7-data-requirements--constraints)
8. [Traceability Matrix](#8-traceability-matrix)
9. [Open Issues & Decisions Required](#9-open-issues--decisions-required)

---

## 1. บทนำ

### 1.1 วัตถุประสงค์ของเอกสาร

กำหนดความต้องการของ CLO System ให้ครบถ้วนพอที่จะ implement, ทดสอบ และตรวจรับได้
โดยไม่ต้องย้อนถามผู้ออกแบบ เอกสารนี้เป็น **contract** ระหว่าง Figma (UI) กับ
`schema.prisma` (data) — เมื่อสองฝั่งขัดกัน ให้ยึดเอกสารนี้ และแก้ฝั่งที่ผิดตาม §9

### 1.2 ขอบเขต (Scope)

**อยู่ในขอบเขต**
- บันทึกและติดตาม CLO ระดับ**รายวิชา** ตามหลักสูตร ค.อ.บ. เทคโนโลยีคอมพิวเตอร์ (ปรับปรุง พ.ศ. 2567)
- กำหนดกิจกรรมประเมิน (Activity) และผูกกับ CLO พร้อมน้ำหนัก
- นำเข้า/บันทึกคะแนนราย**กิจกรรม** และคำนวณการบรรลุ CLO
- Dashboard สรุปผลระดับวิชา และรายงานรายบุคคล

**นอกขอบเขต (Out of Scope — v1)**
- **การจัดการหลักสูตร (Curriculum) และ PLO / มคอ.2 mapping ระดับหลักสูตร** — ตัดออกทั้งหมด
  ตามการตัดสินใจ 2026-08-04 (งาน 2.7) สูงสุดของลำดับชั้นข้อมูลคือ **Course**
- **การรองรับหลายสถาบัน (multi-institution / multi-tenant)** — ระบบเป็น **single-tenant**
  ใช้ภายในคณะเดียว ไม่มีตาราง `Institution` / `Membership`
- ระบบลงทะเบียนเรียน, ระบบตัดเกรดอย่างเป็นทางการ, การเชื่อมต่อ REG ของสถาบัน
- Mobile native app, การใช้งาน offline
- Single Sign-On และการสมัครสมาชิกด้วยตนเอง (ดู OI-06)

### 1.3 คำนิยาม

| คำ | ความหมาย |
|---|---|
| **CLO** | Course Learning Outcome — ผลลัพธ์การเรียนรู้ที่คาดหวังระดับรายวิชา |
| **Behavioral Objective** | จุดประสงค์เชิงพฤติกรรม ที่แตกย่อยจาก CLO หนึ่งตัว |
| **Activity** | กิจกรรมประเมิน (สอบ / งาน / โครงงาน) ที่มีคะแนนเต็มและน้ำหนัก |
| **Assessment Criteria** | การผูก Activity ↔ CLO พร้อมน้ำหนักต่อคู่ |
| **CLO Target** | เกณฑ์ผ่าน**ราย CLO** ของนักศึกษาแต่ละคน (%) — `CLO.threshold` |
| **Class Target** | สัดส่วนนักศึกษาที่ต้องผ่าน CLO นั้น ระบบจึงถือว่า CLO "บรรลุ" (%) |
| **Pass Criteria** | เกณฑ์คะแนนรวมรายวิชาที่ถือว่านักศึกษาผ่านวิชา (%) |
| **At-risk** | นักศึกษาที่ไม่ผ่าน CLO ตั้งแต่ 1 ตัวขึ้นไป |
| **Attainment** | ร้อยละของนักศึกษาที่ผ่าน CLO ตัวหนึ่ง |

### 1.4 เอกสารอ้างอิง

- `database/schema.prisma` — **source of truth ของโครงสร้างข้อมูล**
- Figma `Project CLOs` — `https://www.figma.com/design/GLnvjhq5ENaQXy35cZtKII/Project-CLOs`
- [[usecase]] (อ้างอิงเอกสารอนุมัติหัวข้อ PD01 §5) · [[features-pages]] · [[dev]] · [[design-system]]
- `docs/pdf/01. หลักสูตร ค.อ.บ. สาขาวิชาเทคโนโลยีคอมพิวเตอร์ (หลักสูตรปรับปรุง พ.ศ. 2567).pdf`

---

## 2. ภาพรวมระบบ

### 2.1 บริบทของระบบ

Web application แบบ SPA (React 19 + React Router 7) เรียก REST API (Fastify 5)
ที่คุยกับ PostgreSQL ผ่าน Prisma 6 — รายละเอียด stack ดู [[dev]] §1
ไม่มีการเชื่อมต่อระบบภายนอกใด ๆ ใน v1 การนำเข้าข้อมูลทำผ่านไฟล์ Excel เท่านั้น

### 2.2 ผู้ใช้งาน (User Classes)

| Role | ขอบเขต | จำนวนที่คาดหวัง | ความชำนาญ | สิทธิ์หลัก |
|---|---|---|---|---|
| **ADMIN** | ทั้งระบบ (คณะเดียว) | 1–3 คน | ใช้งานคอมพิวเตอร์ได้ดี | จัดการผู้ใช้ · รายวิชา · มอบหมายอาจารย์ · เห็นทุกรายวิชา |
| **INSTRUCTOR** | เฉพาะวิชาที่ถูกมอบหมาย | 10–50 คน | ใช้ Excel เป็น แต่ไม่ใช่สาย IT | จัดการ CLO / กิจกรรม / คะแนน / ดูรายงาน **เฉพาะวิชาที่ตนถูกมอบหมาย** |

> ไม่มี role นักศึกษาใน v1 — นักศึกษาเป็น **ข้อมูล** ไม่ใช่ผู้ใช้ระบบ
>
> **Single-tenant:** `role` อยู่ที่ `User` โดยตรง (ไม่มี `Membership`) และไม่มี SUPER_ADMIN —
> ระบบใช้ในคณะเดียว จึงไม่มีชั้นที่อยู่เหนือ ADMIN ให้ต้องแยก
> `User.email` unique = 1 คน 1 credential เหมือนเดิม

### 2.3 ข้อจำกัดและสมมติฐาน

| รหัส | รายการ |
|---|---|
| CON-01 | รองรับเบราว์เซอร์รุ่นล่าสุด 2 เวอร์ชันของ Chrome / Edge / Safari (desktop-first, ≥1280px) |
| CON-02 | ข้อมูลนักศึกษาเป็นข้อมูลส่วนบุคคลตาม PDPA — ห้าม log คะแนนหรือชื่อลง application log |
| CON-03 | ไฟล์อัปโหลดสูงสุด 10 MB (`@fastify/multipart`) |
| CON-04 | ทีมมี 3 คน ระยะเวลาพัฒนาจำกัด — ทุก requirement ที่ระบุ **SHOULD/MAY** ตัดออกได้ก่อน |
| ASM-01 | 1 นักศึกษาในระบบ = 1 การลงทะเบียน 1 วิชา (`Student` = enrolment ไม่ใช่ person) |
| ASM-04 | **`Course` เป็นขอบเขตข้อมูลเดียวของระบบ** (single-tenant) — สิทธิ์ทุกอย่างตอบด้วยสองคำถาม: role อะไร และถูกมอบหมายวิชาไหน |
| ASM-05 | `Course.year` เก็บเป็น **พ.ศ.** ตามที่คณะกรอก (2568) — คณะเดียวจึงมีปฏิทินเดียว ไม่มีคอลัมน์ era ให้ต้อง normalize |
| ASM-02 | คะแนนถูกบันทึกราย **Activity** เท่านั้น คะแนนราย CLO เป็นค่า **คำนวณ** ไม่เคยถูกกรอกตรง (ดู OI-01) |
| ASM-03 | อาจารย์ผู้สอนร่วมทุกคนแก้ข้อมูลวิชาได้เท่ากัน — `CourseRole` ใช้เพื่อการแสดงผล/รายงานเท่านั้นใน v1 |

---

## 3. กฎการคำนวณ (Calculation Rules)

> ส่วนนี้คือหัวใจของระบบ ทุกตัวเลขบน Dashboard ต้องมาจากสูตรเหล่านี้เท่านั้น
> ห้าม hard-code และห้ามคำนวณซ้ำคนละที่ — ต้องอยู่ใน service เดียว (`services/attainment.service.ts`)

### CR-01 — ความหมายของน้ำหนัก

| Field | ความหมาย | Invariant |
|---|---|---|
| `Activity.weight` | สัดส่วนของกิจกรรมนั้นต่อคะแนนรวมรายวิชา (%) | ผลรวมทุก Activity ในวิชา = **100** |
| `AssessmentCriteria.weight` | สัดส่วนของกิจกรรมนั้นที่ใช้วัด CLO ตัวนั้น (%) | ผลรวมต่อ **1 Activity** = **100** |
| `CLO` | **ไม่มี** weight | น้ำหนักของ CLO เป็นค่าอนุพัทธ์ (CR-02) |

### CR-02 — น้ำหนักของ CLO (ค่าคำนวณ ใช้แสดงผลเท่านั้น)

```
weight(CLO c) = Σ over activities a  [ Activity.weight(a) × Criteria.weight(a,c) / 100 ]
```
ผลรวมของทุก CLO ในวิชาจะเท่ากับ 100 โดยอัตโนมัติเมื่อ CR-01 เป็นจริง

### CR-03 — คะแนน CLO ของนักศึกษา 1 คน (%)

```
                Σ over a  [ score(s,a) / maxScore(a) × Criteria.weight(a,c) ]
cloScore(s,c) = ─────────────────────────────────────────────────────────── × 100
                          Σ over a  [ Criteria.weight(a,c) ]
```
- นับเฉพาะ Activity ที่ผูกกับ CLO `c` และ**มีคะแนนของนักศึกษา `s` แล้ว**
- ถ้าไม่มีคะแนนเลย → `cloScore = null` (แสดง `—` ไม่ใช่ 0)
- ผ่านเมื่อ `cloScore(s,c) ≥ CLO.threshold`

### CR-04 — Attainment ระดับวิชา

```
attainment(c) = (จำนวนนักศึกษาที่ผ่าน c / จำนวนนักศึกษาที่มีคะแนนครบพอจะคำนวณ c) × 100
CLO c "บรรลุ"  ⟺  attainment(c) ≥ Class Target
```

### CR-05 — คะแนนรวมรายวิชาและสถานะนักศึกษา

```
totalScore(s) = Σ over a [ score(s,a) / maxScore(a) × Activity.weight(a) ]     // 0–100
ผ่านรายวิชา  ⟺  totalScore(s) ≥ Pass Criteria
at-risk      ⟺  มี CLO อย่างน้อย 1 ตัวที่ cloScore(s,c) < threshold
```

### CR-06 — วิชาแบบ PASS_FAIL

วิชาที่ `Course.gradingType = PASS_FAIL` (รหัส 90641004–90641010)
**ห้ามแสดงเกรดตัวอักษร** ให้แสดงเฉพาะ `ผ่าน (S)` / `ไม่ผ่าน (U)` ตาม CR-05

### CR-07 — การปัดเศษ

คำนวณด้วย float เต็มความละเอียดตลอดสาย ปัดเป็น **ทศนิยม 2 ตำแหน่ง เฉพาะตอนแสดงผล**
ห้ามปัดค่ากลางทาง

---

## 4. Functional Requirements

> **ระดับความสำคัญ:** MUST = ต้องมีจึงจะส่งงานได้ · SHOULD = ควรมี · MAY = ถ้ามีเวลา
> คอลัมน์ **UI** อ้างเฟรมใน Figma — `(ใหม่)` = ยังไม่มีในไฟล์ออกแบบ ต้องออกแบบเพิ่ม

### 4.1 Authentication & Users

| ID | Requirement | ระดับ | UI |
|---|---|---|---|
| FR-01 | ผู้ใช้เข้าสู่ระบบด้วย email + password ระบบออก access token (15 นาที) และ refresh token (7 วัน) | MUST | Login |
| FR-02 | รหัสผ่านเก็บด้วย argon2 เท่านั้น ห้ามเก็บ plaintext หรือ reversible hash | MUST | — |
| FR-03 | ผู้ใช้ที่ `isActive = false` เข้าสู่ระบบไม่ได้ และได้ข้อความเดียวกับกรณีรหัสผิด (ไม่เปิดเผยว่าบัญชีมีอยู่) | MUST | Login |
| FR-04 | ล้มเหลวเกิน 5 ครั้งใน 15 นาทีต่อ IP → rate-limit | SHOULD | Login |
| FR-05 | ADMIN สร้าง / แก้ไข / ปิดการใช้งานบัญชีผู้ใช้ และกำหนด role ได้ | MUST | (ใหม่) User Mgmt |
| FR-06 | ห้ามลบ User ที่ยังผูกกับรายวิชาหรือเคยอัปโหลดคะแนน — ให้ปิดใช้งานแทน (`onDelete: Restrict`) | MUST | (ใหม่) |
| FR-07 | ADMIN รีเซ็ตรหัสผ่านให้ผู้ใช้ได้ (ตั้งรหัสชั่วคราว + บังคับเปลี่ยนเมื่อ login ครั้งถัดไป) | SHOULD | (ใหม่) |
| FR-08 | ผู้ใช้เปลี่ยนรหัสผ่านของตนเองได้ | SHOULD | (ใหม่) |

### 4.2 Curriculum — ❌ ตัดออกทั้งหมด (2026-08-04)

FR-10 ถึง FR-15 ถูกยกเลิกพร้อมกับการตัด `Curriculum` / `CurriculumCourse` ออกจากระบบ
(งาน 2.7 ปิด E-06) — **ห้ามนำหมายเลข FR-10…FR-15 กลับมาใช้ซ้ำกับ requirement อื่น**
เพราะจะทำให้ traceability ในบทที่ 3 และ 4 อ่านผิด

ข้อมูลที่เคยอยู่บน `CurriculumCourse` ย้ายมาอยู่บน `Course` โดยตรง คือ
หน่วยกิต / ชั่วโมงบรรยาย-ปฏิบัติ-ศึกษาด้วยตนเอง / `gradingType`
ข้อกำหนดที่ยังมีผลจึงย้ายไปเป็น FR-27 และ FR-28 ใน §4.3

### 4.3 Course

| ID | Requirement | ระดับ | UI |
|---|---|---|---|
| FR-20 | ADMIN สร้าง/แก้ไขรายวิชาที่เปิดสอนจริง: รหัส / ชื่อ / ปีการศึกษา / ภาคเรียน / **หมู่เรียน (section)** | MUST | Course Mgmt **(ต้องแก้ — F5)** |
| FR-21 | ระบบต้องกันซ้ำที่ระดับ `(code, semester, year, section)` และแจ้ง error ที่อ่านเข้าใจได้ — "รหัสวิชานี้มีอยู่แล้วในภาคเรียนนี้" | MUST | Course Mgmt |
| FR-22 | ADMIN มอบหมายอาจารย์เข้ารายวิชาได้หลายคน พร้อมบทบาท LEAD / CO / ASSISTANT | MUST | (ใหม่) |
| FR-23 | 1 รายวิชามี LEAD ได้ **ไม่เกิน 1 คน** (บังคับด้วย partial unique index) และ**ต้องมีอย่างน้อย 1 คน** (บังคับที่ application layer) | MUST | (ใหม่) |
| FR-24 | รายการรายวิชากรองด้วยปีการศึกษา / ภาคเรียน และค้นด้วยรหัสหรือชื่อได้ | MUST | Course Mgmt |
| FR-25 | INSTRUCTOR เห็นเฉพาะรายวิชาที่ตนถูกมอบหมาย ADMIN เห็นทั้งหมด | MUST | Course Mgmt |
| FR-26 | ลบรายวิชาต้องมี confirm dialog ที่ระบุจำนวน CLO / กิจกรรม / นักศึกษา / คะแนน ที่จะถูกลบตาม (cascade) | MUST | (ใหม่) |
| **FR-27** | รายวิชาเก็บหน่วยกิตในรูป `3 (2-2-5)` — หน่วยกิต / ชม.บรรยาย / ชม.ปฏิบัติ / ชม.ศึกษาด้วยตนเอง เป็นทศนิยม และ**ต้องรับค่า 0 ได้** (วิชา 90641008 = `0 (0-0-45)`) *(เดิม FR-14)* | MUST | (ใหม่) |
| **FR-28** | รายวิชาต้องระบุ `gradingType` = LETTER หรือ PASS_FAIL ซึ่ง CR-06 ใช้ตัดสินว่าแสดงเกรดตัวอักษรได้หรือไม่ *(เดิมอยู่บน `CurriculumCourse`)* | MUST | (ใหม่) |

### 4.4 CLO & Behavioral Objectives

| ID | Requirement | ระดับ | UI |
|---|---|---|---|
| FR-30 | INSTRUCTOR จัดการ CLO ของรายวิชา: `number` / คำอธิบาย / **เกณฑ์ผ่าน (threshold, %)** | MUST | CLO Mgmt **(ต้องแก้ — F2, F3)** |
| FR-31 | `number` ต้องไม่ซ้ำในวิชาเดียวกัน และเรียงลำดับใหม่ด้วย drag ได้ (อัปเดต `number` แบบ transaction) | MUST | CLO Mgmt |
| FR-32 | หน้า CLO **ห้ามมีคอลัมน์น้ำหนักที่แก้ไขได้** — ถ้าจะแสดง ต้องเป็นค่าคำนวณตาม CR-02 และเป็น read-only | MUST | CLO Mgmt |
| FR-33 | INSTRUCTOR จัดการจุดประสงค์เชิงพฤติกรรมภายใต้ CLO แต่ละตัว (`number` ไม่ซ้ำต่อ CLO) | MUST | Behavioral Obj |
| FR-34 | ผูกจุดประสงค์เชิงพฤติกรรมกับ Assessment Criteria (`ObjectiveAssessment`) เพื่อ traceability | SHOULD | (ใหม่) |
| FR-35 | การผูกใน FR-34 ต้อง**ไม่กระทบคะแนน CLO ที่คำนวณได้** ไม่ว่ากรณีใด | MUST | — |
| FR-36 | ลบ CLO ที่มีคะแนนอ้างอิงอยู่แล้ว ต้องเตือนว่าผลการประเมินที่คำนวณไว้จะเปลี่ยน | SHOULD | CLO Mgmt |

### 4.5 Activity & Assessment Criteria

| ID | Requirement | ระดับ | UI |
|---|---|---|---|
| FR-40 | INSTRUCTOR จัดการกิจกรรมประเมิน: ชื่อ / วิธีวัด (`method`) / คะแนนเต็ม / **น้ำหนัก (%)** / ลำดับ | MUST | Activity Mgmt **(ต้องเพิ่มคอลัมน์น้ำหนัก — F2)** |
| FR-41 | `maxScore` ต้อง > 0 เสมอ (ทุกสูตรใน §3 หารด้วยค่านี้) | MUST | Activity Mgmt |
| FR-42 | เรียงลำดับกิจกรรมใหม่ด้วย drag ได้ (อัปเดต `order`) | SHOULD | Activity Mgmt |
| FR-43 | ระบบแสดงผลรวมน้ำหนักกิจกรรม และ**เตือนเมื่อไม่เท่ากับ 100%** — เตือน ไม่ใช่บล็อกการบันทึก (ระหว่างกรอกยังไม่ครบเป็นเรื่องปกติ) | MUST | Activity Mgmt |
| FR-44 | INSTRUCTOR ผูก Activity ↔ CLO ในรูปแบบเมทริกซ์ พร้อม**กรอกน้ำหนักต่อคู่เป็นตัวเลข** ไม่ใช่ checkbox | MUST | Assessment Criteria **(ต้องแก้ — F2)** |
| FR-45 | ผลรวมน้ำหนักต่อ 1 กิจกรรมต้องเป็น 100% — เตือนเมื่อไม่ครบ และบล็อกการคำนวณ Dashboard เมื่อไม่ครบ | MUST | Assessment Criteria |
| FR-46 | Activity และ CLO ที่ผูกกันต้องอยู่ในรายวิชาเดียวกัน (มี trigger บังคับที่ DB — API ต้องตรวจก่อนด้วย) | MUST | — |
| FR-47 | หน้ากำหนดเกณฑ์ต้องแยกให้ชัดว่าค่าไหนเก็บที่ไหน: **CLO Target ราย CLO** · **Pass Criteria + Class Target ระดับรายวิชา** (ดู OI-03) | MUST | Assessment Criteria |
| FR-48 | เตือนเมื่อมี CLO ที่ไม่ถูกกิจกรรมใดวัดเลย — CLO นั้นจะคำนวณ attainment ไม่ได้ | SHOULD | Assessment Criteria |

### 4.6 Student Roster

| ID | Requirement | ระดับ | UI |
|---|---|---|---|
| FR-50 | INSTRUCTOR เพิ่ม / แก้ไข / ลบนักศึกษาในรายวิชา (`studentCode`, ชื่อ) | MUST | Student Roster |
| FR-51 | `studentCode` ต้องไม่ซ้ำภายในรายวิชาเดียวกัน (ซ้ำข้ามวิชาได้ = คนละการลงทะเบียน) | MUST | Student Roster |
| FR-52 | นำเข้ารายชื่อจาก Excel และดาวน์โหลด template ได้ | MUST | Student Roster |
| FR-53 | ลบนักศึกษาต้องเตือนว่าคะแนนทั้งหมดของคนนั้นจะถูกลบตาม (cascade) | MUST | Student Roster |
| FR-54 | ฟิลด์ใดที่ไม่มีใน `Student` (อีเมล / ชั้นปี / สาขา / คณะ) ห้ามแสดงบน UI จนกว่าจะเพิ่มลง schema (ดู OI-05) | MUST | Roster, Individual Report |

### 4.7 Score Entry & Import/Export

| ID | Requirement | ระดับ | UI |
|---|---|---|---|
| FR-60 | INSTRUCTOR กรอกคะแนนแบบตาราง โดยมี**คอลัมน์เป็น Activity** (ไม่ใช่ CLO) | MUST | Score Entry **(ต้อง redesign — F1)** |
| FR-61 | คะแนนต้องอยู่ในช่วง `0 ≤ score ≤ Activity.maxScore` — ตรวจทั้ง client, API (Zod) และ DB (trigger) | MUST | Score Entry |
| FR-62 | ช่องที่เว้นว่าง = **ยังไม่ประเมิน** ต่างจาก 0 = ได้ 0 คะแนน และต้องแยกกันในทุกการคำนวณ | MUST | Score Entry |
| FR-63 | บันทึกคะแนนเป็น upsert ทีละชุดใน transaction เดียว — สำเร็จทั้งหมดหรือไม่สำเร็จเลย | MUST | Score Entry |
| FR-64 | แสดงความคืบหน้าการกรอก (`กรอกแล้ว x/y คน`) ต่อกิจกรรม | SHOULD | Score Entry |
| FR-65 | เตือนเมื่อออกจากหน้าโดยยังไม่บันทึก | SHOULD | Score Entry |
| FR-66 | ดาวน์โหลด Excel template ที่มีรหัสนักศึกษาและชื่อเติมไว้แล้ว 1 คอลัมน์ต่อ 1 กิจกรรม | MUST | Import/Export |
| FR-67 | อัปโหลดไฟล์แล้วต้องมีขั้น **preview + validate ก่อน commit** แสดงจำนวนแถวที่ผ่าน/ไม่ผ่าน และเหตุผลรายแถว | MUST | Import/Export **(ต้องเพิ่ม — F9)** |
| FR-68 | แถวที่ผิดพลาดต้องไม่ทำให้ทั้งไฟล์ล้มเหลว — commit เฉพาะแถวที่ผ่าน แล้วให้ดาวน์โหลดรายการแถวที่ไม่ผ่านได้ | MUST | Import/Export |
| FR-69 | ตรวจอย่างน้อย: รหัสนักศึกษาไม่มีในวิชา / คะแนนไม่ใช่ตัวเลข / คะแนนเกิน maxScore / คะแนนติดลบ / รหัสซ้ำในไฟล์ / คอลัมน์กิจกรรมไม่ตรง | MUST | Import/Export |
| FR-70 | ส่งออกคะแนนดิบและผลสรุป CLO เป็น Excel | MUST | Import/Export |
| FR-71 | ทุกการอัปโหลดต้องบันทึก `ScoreUploadLog` (ไฟล์ / ผู้อัปโหลด / เวลา / recordsOk / recordsFail) แม้จะล้มเหลวทั้งไฟล์ | MUST | Upload Log |
| FR-72 | หน้า Upload Log ต้องแสดง **recordsOk และ recordsFail แยกคอลัมน์** และกดดูรายละเอียดข้อผิดพลาดได้ | MUST | Upload Log **(ต้องแก้ — F9)** |

### 4.8 Dashboard & Reports

| ID | Requirement | ระดับ | UI |
|---|---|---|---|
| FR-80 | Dashboard Overview แสดงจำนวนวิชาที่รับผิดชอบ / นักศึกษาทั้งหมด / CLO ที่ประเมินเสร็จ / ความคืบหน้าการส่งคะแนน | MUST | Dashboard Overview |
| FR-81 | CLO Attainment Dashboard แสดงกราฟแท่ง Target vs Actual ราย CLO ตาม CR-04 | MUST | CLO Attainment |
| FR-82 | ตารางสรุปแสดง CLO / Target / Actual / สถานะ (บรรลุ / ต้องปรับปรุง) | MUST | CLO Attainment |
| FR-83 | Dashboard ต้องมีรายชื่อ **at-risk students** พร้อมระบุว่าไม่ผ่าน CLO ตัวใด และคลิกไปหน้ารายงานรายบุคคลได้ | MUST | CLO Attainment **(ขาดหาย — F7)** |
| FR-84 | เมื่อข้อมูลไม่พอคำนวณ (ยังไม่มีคะแนน / น้ำหนักไม่ครบ 100 / มี CLO ที่ไม่มีกิจกรรมวัด) ต้องแสดงสาเหตุที่ชัดเจน **ห้ามแสดง 0%** | MUST | CLO Attainment |
| FR-85 | รายงานรายบุคคลแสดงคะแนนราย CLO, Target, สถานะ, คะแนนรวม และสถานะรายวิชาตาม CR-05 | MUST | Individual Report |
| FR-86 | วิชา PASS_FAIL ต้องแสดง ผ่าน/ไม่ผ่าน ไม่ใช่เกรดตัวอักษร (CR-06) | MUST | Individual Report **(F8)** |
| FR-87 | ส่งออกรายงานเป็นไฟล์ (Excel หรือ PDF) ทั้งระดับวิชาและรายบุคคล | SHOULD | ทั้งสองหน้า |
| FR-88 | ตัวเลขทุกตัวบน Dashboard ต้องมาจาก service เดียวกับที่ export ใช้ — ห้ามคำนวณซ้ำคนละที่ | MUST | — |

---

## 5. External Interface Requirements

### 5.1 User Interface

- ยึด [[design-system]] และ Design System Board ใน Figma — text styles (Display/H1–H4/Body/label/caption) และ color styles (Primary / Hover / Secondary / Background / Status)
- ทุกหน้าที่ดึงข้อมูลต้องออกแบบครบ 4 สถานะ: **loading / empty / error / success** (ปัจจุบัน Figma มีแค่ success — F11)
- การกระทำที่ทำลายข้อมูลต้องมี confirm dialog ที่ระบุผลกระทบเชิงตัวเลข
- ทุก action ต้องมี feedback (toast) ภายใน 200 ms
- ต้องเลือก IA ภาษาเดียว (ไทยหรืออังกฤษ) ให้ตรงกันทุกหน้า — ปัจจุบันมี 2 ชุดชนกัน (F10)

### 5.2 API

- REST, prefix `/api/v1`, response envelope และ error format ตาม [[dev]] §9–§10
- ทุก endpoint ที่ไม่ใช่ `/auth/login` ต้องผ่าน auth middleware และ RBAC middleware
- ทุก request body ผ่าน Zod schema — ห้ามเชื่อ input ที่ยังไม่ผ่าน schema

### 5.3 File Interface (Excel)

| รายการ | ข้อกำหนด |
|---|---|
| รูปแบบ | `.xlsx` (SheetJS) — CSV เป็น SHOULD |
| ขนาดสูงสุด | 10 MB |
| Template คะแนน | คอลัมน์: `รหัสนักศึกษา`, `ชื่อ-นามสกุล`, แล้วต่อด้วย 1 คอลัมน์ต่อ 1 กิจกรรม (หัวคอลัมน์ = `<รหัสกิจกรรม> (เต็ม N)`) |
| Template รายชื่อ | คอลัมน์: `รหัสนักศึกษา`, `ชื่อ-นามสกุล` |
| การจับคู่ | จับคู่ด้วย `studentCode` เท่านั้น ห้ามจับคู่ด้วยชื่อ |
| Encoding | UTF-8 |

---

## 6. Non-Functional Requirements

| ID | ประเภท | Requirement |
|---|---|---|
| NFR-01 | Performance | หน้าที่มีตารางต้องแสดงผลใน < 2 วินาที ที่ขนาดข้อมูล 1 วิชา / 200 นักศึกษา / 20 กิจกรรม |
| NFR-02 | Performance | การคำนวณ attainment ของ 1 วิชาต้องเสร็จใน < 1 วินาที และต้องไม่เกิด N+1 query |
| NFR-03 | Performance | นำเข้าไฟล์ 500 แถวต้องเสร็จใน < 10 วินาที |
| NFR-04 | Scalability | รองรับ 50 รายวิชา / 5,000 แถวคะแนน **ต่อ 1 ภาคการศึกษา** และเก็บสะสมได้อย่างน้อย 5 ปีการศึกษาโดยไม่ต้องเปลี่ยนสถาปัตยกรรม |
| NFR-05 | Security | Access token 15 นาที + refresh token 7 วัน · argon2 · helmet · CORS allowlist · rate-limit |
| NFR-06 | Security | RBAC ต้องบังคับที่ **API** เสมอ การซ่อนเมนูบน UI ไม่ถือเป็นการควบคุมสิทธิ์ |
| NFR-07 | Security | INSTRUCTOR ต้องเข้าถึงข้อมูลได้เฉพาะวิชาที่ตนถูกมอบหมาย — ทดสอบด้วยการยิง API ตรงด้วย id ของวิชาอื่น ต้องได้ **404 ไม่ใช่ 403** (403 ยืนยันว่า id นั้นมีอยู่จริง = enumeration oracle) · **single-tenant ทำให้ข้อนี้เป็นขอบเขตข้อมูลเดียวที่เหลือ จึงต้องเรียก `assertCourseAccess()` ทุก route ที่รับ `:courseId`** |
| NFR-08 | Privacy | ห้าม log ชื่อนักศึกษา รหัสนักศึกษา หรือคะแนน ลง application log (PDPA) |
| NFR-09 | Usability | ผู้สอนที่ไม่เคยใช้ระบบ ต้องนำเข้าคะแนนจนสำเร็จได้ภายใน 10 นาทีโดยไม่ต้องมีคู่มือ |
| NFR-10 | Usability | ข้อความ error ต้องเป็นภาษาไทย บอกสาเหตุและวิธีแก้ ห้ามแสดง stack trace หรือรหัส error ดิบ |
| NFR-11 | Reliability | ทุกการเขียนหลายแถวต้องอยู่ใน transaction เดียว |
| NFR-12 | Reliability | Business rule ที่ DB บังคับด้วย CHECK/trigger ต้องถูกตรวจซ้ำที่ชั้น API เพื่อคืน error ที่อ่านรู้เรื่อง |
| NFR-13 | Maintainability | TypeScript strict, ห้าม `any` · business logic อยู่ใน `services/` เท่านั้น ตาม [[code-rule]] |
| NFR-14 | Testability | ทุกสูตรใน §3 ต้องมี unit test ครอบคลุมกรณี: ไม่มีคะแนน, คะแนนบางส่วน, น้ำหนักไม่ครบ 100, maxScore ต่างกัน, CLO ที่ไม่มีกิจกรรมวัด |
| NFR-15 | Accessibility | ใช้งานด้วยคีย์บอร์ดได้ทั้งหมด · contrast ≥ 4.5:1 · ตารางกรอกคะแนนต้องเลื่อนช่องด้วย Tab/Enter ได้ |
| NFR-16 | Auditability | การนำเข้าคะแนนทุกครั้งต้องตามรอยได้ว่าใครทำ เมื่อไร ด้วยไฟล์อะไร |
| ~~NFR-17~~ | ~~Security~~ | ❌ **ยกเลิก 2026-08-04** — ข้อกำหนดแยกข้อมูลระดับสถาบัน ไม่มีความหมายในระบบ single-tenant ส่วนที่ยังต้องทดสอบถูกรวมเข้ากับ NFR-07 แล้ว |
| ~~NFR-18~~ | ~~Security~~ | ❌ **ยกเลิก 2026-08-04** — `TENANT_FILTER` และ tenant guard ถูกลบออกจากโค้ดพร้อมกับ `Institution` |
| NFR-19 | Security | `role` ต้องอ่านจากแถว `User` สด ๆ ทุก request ไม่ใช่เชื่อค่าใน JWT — บัญชีที่ถูกปิดหรือลดสิทธิ์ต้องมีผลทันที ไม่ใช่รอ access token หมดอายุ 15 นาที |

---

## 7. Data Requirements & Constraints

ยึด `database/schema.prisma` เป็นหลัก ข้อบังคับที่ Prisma แสดงไม่ได้และ **ห้ามหายไปจาก migration**:

| รหัส | ข้อบังคับ | บังคับที่ |
|---|---|---|
| DC-01 | `score ≥ 0` และ `score ≤ Activity.maxScore` | CHECK + trigger |
| DC-02 | `CLO.threshold` อยู่ระหว่าง 0–100 | CHECK |
| DC-03 | `Activity.maxScore > 0` | CHECK |
| DC-04 | Activity และ CLO ในหนึ่ง `AssessmentCriteria` ต้องอยู่วิชาเดียวกัน | trigger |
| DC-05 | Student และ Activity ในหนึ่ง `Score` ต้องอยู่วิชาเดียวกัน | trigger |
| DC-06 | `ObjectiveAssessment` — objective ต้องเป็นของ CLO เดียวกับ criteria | trigger |
| DC-07 | 1 รายวิชามี LEAD ไม่เกิน 1 คน | partial unique index |
| DC-08 | `User` ที่ยังสอนอยู่หรือเคยอัปโหลด ห้ามลบ | `onDelete: Restrict` |
| ~~DC-09~~ | ❌ ยกเลิก — ไม่มี `Curriculum` ให้ clone | — |
| ~~DC-10~~ | ❌ ยกเลิก — `Student.institutionId` ถูกลบ · `courseId` เพียงพอต่อการจำกัดขอบเขต | — |
| ~~DC-11~~ | ❌ ยกเลิก — ไม่มี `Membership` · การมอบหมายอาจารย์ตรวจที่ชั้น API เท่านั้น | — |
| ~~DC-12~~ | ❌ ยกเลิก — ไม่มี `CurriculumCourse` | — |
| ~~DC-13~~ | ❌ ยกเลิก — ไม่มี `Institution` | — |
| DC-14 | `Course.passCriteria` / `Course.classTarget` อยู่ในช่วง 0–100 | CHECK |
| DC-15 | `Course.credits` อยู่ในช่วง 0–30 และชั่วโมงทุกช่อง ≥ 0 (**ต้องรับ 0 ได้** — FR-27) | CHECK |

> **ต้อง re-verify กับ Postgres จริงอีกครั้ง** — migration `0001_init` และ
> `0002_constraints_and_triggers` ถูกเขียนใหม่ทั้งคู่เมื่อ 2026-08-04 ตามการตัดสินใจ single-tenant
> ผลการทดสอบเดิม (16 ตาราง / 37 CHECK / 7 trigger เมื่อ 2026-07-30) **ใช้อ้างอิงไม่ได้แล้ว**
> โครงสร้างใหม่: 11 ตาราง · 3 trigger · partial index `uq_courseinstructor_lead` — เป็นงาน 3.1.5

**การเก็บรักษาข้อมูล:** ข้อมูลคะแนนเก็บอย่างน้อย 5 ปีการศึกษา · ไม่มีการลบอัตโนมัติ · backup เป็นหน้าที่ของ Supabase

---

## 8. Traceability Matrix

| Use Case ([[usecase]]) | FR | หน้าจอ | Model |
|---|---|---|---|
| UC1 จัดการผู้ใช้งาน | FR-01…FR-08 | Login, User Mgmt *(ใหม่)* | `User` |
| UC2 กรอกข้อมูลรายวิชา | FR-20…FR-28 | Course Mgmt, Course form *(ใหม่)* | `Course`, `CourseInstructor` |
| UC3 กำหนด CLOs | FR-30…FR-32, FR-36 | CLO Management | `CLO` |
| UC4 วัตถุประสงค์เชิงพฤติกรรม | FR-33…FR-35 | Behavioral Objectives | `BehavioralObjective`, `ObjectiveAssessment` |
| UC5 วิธีการประเมิน | FR-40…FR-43 | Activity Management | `Activity` |
| UC6 เกณฑ์การประเมิน | FR-44…FR-48 | Assessment Criteria Mapping | `AssessmentCriteria` |
| UC7 นำเข้า/ส่งออกคะแนน | FR-60…FR-72 | Score Entry, Import/Export, Upload Log | `Score`, `ScoreUploadLog` |
| UC8 นำเข้า/ส่งออกรายชื่อ | FR-50…FR-54 | Student Roster | `Student` |
| UC9 Dashboard | FR-80…FR-84, FR-88 | Dashboard Overview, CLO Attainment | คำนวณ (CR-03, CR-04) |
| UC10 ติดตามรายบุคคล | FR-83, FR-85, FR-86 | Student Individual Report | คำนวณ (CR-03, CR-05) |
| UC11 ส่งออกรายงาน | FR-70, FR-87 | ทั้งสอง Dashboard | — |

> **ช่องว่างที่ปิดแล้วด้วยการตัดขอบเขต (2026-08-04)**
> UC0 (จัดการสถาบัน) ถูกลบทั้ง use case — ไม่ต้องเขียน FR เพิ่มอีกต่อไป
> สิ่งเดียวที่ยกมาจากรายการเดิมคือ: **`role` ต้องอ่านจากแถว `User` สด ๆ ทุก request
> ไม่ใช่เชื่อค่าใน JWT** ซึ่งกลายเป็น NFR-19 แล้ว
>
> ⚠ [[usecase]] ยังมี UC0 และยังวาดด้วยลำดับชั้น หลักสูตร → รายวิชา — **ต้องแก้ก่อนใช้ในเล่ม**
> (งาน 3.2 ใน [[project-plan]])

---

## 9. Open Issues & Decisions Required

> ทุกข้อต้อง sign-off ก่อนเริ่ม implement module ที่เกี่ยวข้อง
> คอลัมน์ "ข้อเสนอ" คือค่าที่ SRS ฉบับนี้ใช้ไปพลางก่อน ถ้าไม่มีใครคัดค้าน = ถือว่ายอมรับ

| ID | ประเด็น | ข้อเสนอ (ใช้ไปก่อน) | ผลถ้าตัดสินใจตรงข้าม |
|---|---|---|---|
| OI-01 | Score Entry ใน Figma กรอกราย **CLO** แต่ schema เก็บราย **Activity** และหน้า Import กรองด้วยกิจกรรม | **เก็บราย Activity** — redesign หน้า Score Entry ให้คอลัมน์เป็นกิจกรรม | ถ้ากรอกราย CLO จริง → `Activity`, `AssessmentCriteria` และหน้า Assessment Criteria Mapping ทั้งหน้าไม่มีความหมาย เหลือแค่ตารางคะแนนธรรมดา และเสียจุดขายของโครงงาน |
| OI-02 | คอลัมน์ "น้ำหนัก" อยู่บนหน้า CLO Management แต่ schema ไม่มี `CLO.weight` | ย้ายน้ำหนักไปที่ Activity (ต่อวิชา) + Assessment Criteria (ต่อคู่) · หน้า CLO แสดงน้ำหนักเป็นค่าคำนวณ read-only | ถ้าจะเก็บ `CLO.weight` จริง ต้องเพิ่ม field + นิยามว่าเมื่อขัดกับ CR-02 ให้ยึดค่าไหน |
| OI-03 | **ปิดแล้ว — รับข้อเสนอ** Assessment Criteria มี 3 เกณฑ์ (CLO Target / Pass Criteria / Class Target) แต่ schema มีแค่ `CLO.threshold` | เพิ่ม `Course.passCriteria Float @default(60)` และ `Course.classTarget Float @default(70)` แล้ว · `CLO.threshold` ทำหน้าที่ CLO Target · ค่าทั้งสองเก็บ **ราย Course** ไม่ใช่ค่ากลางของระบบ — ถ้าใช้ค่ากลางแล้ว resolve ตอนอ่าน การแก้ค่าวันนี้จะเขียนรายงาน attainment ของเทอมที่แล้วใหม่เงียบ ๆ | — |
| OI-04 | Assessment Criteria เป็น checkbox จึงกรอกน้ำหนักต่อคู่ไม่ได้ | เปลี่ยนเป็นช่องกรอกตัวเลข % ในเมทริกซ์ | ถ้าคง checkbox → ต้องนิยามว่าเฉลี่ยเท่ากันทุก CLO ที่ติ๊ก และ `AssessmentCriteria.weight` กลายเป็นค่าอนุพัทธ์ |
| OI-05 | **ปิดแล้ว — รับข้อเสนอ** Roster แสดงอีเมล · Individual Report แสดงชั้นปี/สาขา/คณะ/เกรด — ไม่มีใน `Student` | **ตัดออกจาก UI ใน v1** · การแยก `Student`(คน) ออกจาก `Enrolment` **เลื่อนไป v2** และเลื่อนได้อย่างปลอดภัยเพราะ `@@index([studentCode])` คือ natural key ของ `Person` ในอนาคตพอดี → v2 เป็นการเพิ่มตาราง + backfill ด้วย index-only scan + เพิ่ม `Student.personId` ไม่แตะ unique key ไม่มี downtime | — |
| OI-06 | Login มีสมัครเอง + SSO อีเมลสถาบัน + ลืมรหัสผ่าน แต่ไม่มี backend และไม่มีหน้าจอ | **ตัดสมัครเองและ SSO ออกจาก v1** (ขัดกับ ADMIN-provisioned + `isActive`) · ลืมรหัสผ่านใช้ FR-07 แทน | ถ้าเก็บ SSO ไว้ = งานเพิ่มระดับ sprint (OAuth/SAML + user provisioning) ซึ่งไม่ควรใส่ในโครงงาน 3 คน |
| OI-07 | มี IA สองชุด (`Desktop - 2` เมนูไทย vs อีก 12 เฟรมเมนูอังกฤษ) | เลือกเมนู**ภาษาไทย** (ผู้ใช้จริงคืออาจารย์ไทย) แล้วลบเฟรมค้าง | ถ้าไม่ตัดสิน dev สามคนจะ implement คนละชุด |
| OI-08 | `ObjectiveAssessment` มีใน schema แต่ไม่มีหน้าจอเลย | ทำเป็น SHOULD (FR-34) — ตัดได้ถ้าเวลาไม่พอ | ถ้าตัดถาวร ควรลบ model ออกจาก schema ไม่ปล่อยตารางร้าง |
| OI-09 | ยังไม่มีหน้าจอ: User Mgmt, Course form, มอบหมายอาจารย์ | ออกแบบเพิ่ม 3 เฟรม ก่อนเริ่ม Sprint 1 (ลดจาก 5 เฟรมเพราะตัดหน้า Curriculum ออก) | ถ้าเริ่มโค้ดก่อนออกแบบ = rework แน่นอน (Course สร้างไม่ได้ถ้าไม่มี section/semester/instructor) |
| **OI-10** | **CR-03 ไม่ใช้ `Activity.weight` เลย** แต่ CR-02 ใช้ → สองสูตรตีความ "ความสำคัญของกิจกรรมต่อ CLO" ไม่ตรงกัน · ทดสอบจริงแล้ว: กิจกรรม A1 (น้ำหนักวิชา 30, ได้ 100%) + A2 (น้ำหนักวิชา 70, ได้ 0%) → **CR-03 ตามที่เขียน = 50.00% · แบบถ่วง `Activity.weight` = 30.00%** ต่างกัน 20 จุดบนข้อมูลชุดเดียวกัน | **ต้องตัดสินก่อน Sprint 2** — ข้อเสนอ: ใช้แบบถ่วง `Activity.weight` <br>`cloScore = Σ[ratio×Aw×Cw] / Σ[Aw×Cw] × 100`<br>เพราะสอดคล้องกับ CR-02 และกับหลัก OBE ที่ว่าข้อสอบปลายภาคต้องมีน้ำหนักมากกว่าควิซ | ถ้าคง CR-03 เดิม ต้องเขียนใน SRS ให้ชัดว่า **เจตนา**ให้ทุกกิจกรรมมีน้ำหนักเท่ากันต่อ CLO และ `Activity.weight` ใช้กับ CR-05 เท่านั้น — ไม่งั้นตัวเลขบน Dashboard จะอธิบายต่อกรรมการไม่ได้ |
| **OI-11** | ~~CR-06 ตัดสินไม่ได้ในทางปฏิบัติ เพราะ `gradingType` อยู่บน `CurriculumCourse` (1:N + `courseId` nullable)~~ | ✅ **ปิดแล้ว 2026-08-04** — การตัด `Curriculum` ออกทำให้ `gradingType` ย้ายมาอยู่บน `Course` โดยตรง เป็นคอลัมน์เดียว ไม่ nullable มีค่า default = LETTER · FR-28 และ CR-06 กำหนดผลได้แน่นอนแล้ว | — |
| **OI-12** | **CR-05 ไม่ระบุว่า `cloScore = NULL` (ยังไม่ประเมิน) นับเป็น at-risk หรือไม่** — `NULL < threshold` ใน SQL ให้ค่า unknown → นักศึกษาที่ยังไม่มีคะแนนเลยจะ**หายไปจากทั้งรายการ at-risk และรายการผ่าน** | ข้อเสนอ: `NULL` **ไม่ใช่** at-risk แต่ต้องนับเป็นสถานะที่สามคือ "ยังประเมินไม่ครบ" และแสดงแยกบน Dashboard ตาม FR-84 | ถ้าไม่นิยาม → FR-83 จะรายงาน at-risk ต่ำกว่าความจริงตอนต้นเทอม ซึ่งเป็นตัวเลขที่อาจารย์ใช้ตัดสินใจแทรกแซงนักศึกษา |

---

_ทุกครั้งที่ scope เปลี่ยน ให้แก้เอกสารนี้ก่อน แล้วจึงแก้ [[features-pages]] และ Figma ตาม —
เอกสารนี้เป็น source of truth ของ **requirement**, `schema.prisma` เป็น source of truth ของ **data**_
