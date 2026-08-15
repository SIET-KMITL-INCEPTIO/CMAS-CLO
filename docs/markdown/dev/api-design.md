# API Design & Endpoint Specification

See also: [[srs]] · [[dev]] · [[features-pages]] · [[schema]] · [[dfd]] · [[objectives-hypotheses-evaluation]]

## ระบบติดตามและประเมินผลลัพธ์การเรียนรู้ที่คาดหวังระดับรายวิชา (CLO System / CMAS)

> **Version:** 1.0.0 (Draft) | **Created:** 2026-08-06
> **Baseline:** [[srs]] v2.0.0 (single-tenant) · `database/schema.prisma` v4 (11 models) ·
> `app/server/src/` (Fastify 5 skeleton — auth/rbac/authorization พร้อมแล้ว routes ยังไม่ทำ)
> **สถานะ:** Draft — เป็น **contract** ระหว่าง client กับ server ก่อนเริ่ม implement Sprint 1
>
> เอกสารนี้เป็น source of truth ของ **หน้าตา API** — [[srs]] เป็น source of truth ของ
> **requirement** และ `schema.prisma` เป็น source of truth ของ **data**
> เมื่อทั้งสามฝั่งขัดกัน ให้ยึด `schema.prisma` → [[srs]] → เอกสารนี้ ตามลำดับ

---

## สารบัญ

1. [หลักการออกแบบ](#1-หลักการออกแบบ)
2. [Convention ร่วมของทุก endpoint](#2-convention-ร่วมของทุก-endpoint)
3. [ตาราง Endpoint ทั้งหมด (สรุป)](#3-ตาราง-endpoint-ทั้งหมด-สรุป)
4. [Auth & Users](#4-auth--users)
5. [Course & Instructor Assignment](#5-course--instructor-assignment)
6. [CLO & Behavioral Objectives](#6-clo--behavioral-objectives)
7. [Activity & Assessment Criteria](#7-activity--assessment-criteria)
8. [Student Roster](#8-student-roster)
9. [Score Entry, Import/Export & Upload Log](#9-score-entry-importexport--upload-log)
10. [Dashboard & Reports](#10-dashboard--reports)
11. [Traceability: FR → Endpoint](#11-traceability-fr--endpoint)
12. [ช่องว่างที่ต้องแก้ในโค้ดปัจจุบัน](#12-ช่องว่างที่ต้องแก้ในโค้ดปัจจุบัน)

---

## 1. หลักการออกแบบ

### 1.1 กฎ 5 ข้อที่ทุก endpoint ต้องทำตาม

| # | กฎ | ที่มา |
|---|---|---|
| **A-1** | **Resource-based, noun plural, kebab-case** — ห้ามมี verb ใน URL (`/getCourse` ❌) ยกเว้น action endpoint ที่ไม่ใช่ CRUD จริง ๆ (`/clos/reorder`, `/scores/import/preview`) | [[dev]] §4.5 |
| **A-2** | **ทุก route ที่รับ `:courseId` ต้องเรียก `assertCourseAccess()` ก่อนแตะข้อมูลใด ๆ** — ผิดแล้วได้ **404 ไม่ใช่ 403** | NFR-07 · `services/authorization.service.ts` |
| **A-3** | **Leaf resource (`:cloId`, `:activityId`, `:studentId`, ...) ต้อง resolve หา `courseId` ก่อน แล้วจึง `assertCourseAccess()`** — id ที่ client ส่งมาไม่เคยเป็นหลักฐานว่ามีสิทธิ์ | NFR-07 |
| **A-4** | **ทุก request body / query / params ผ่าน Zod** ก่อนถึง service ห้ามเชื่อ input ดิบ | NFR-13 · SRS §5.2 |
| **A-5** | **ทุกการเขียนหลายแถวอยู่ใน `prisma.$transaction` เดียว** — สำเร็จทั้งหมดหรือไม่สำเร็จเลย (ยกเว้น import ที่ FR-68 บังคับให้ commit เฉพาะแถวที่ผ่าน) | NFR-11 · FR-63 |

### 1.2 การจัดกลุ่ม route — collection ซ้อนใต้ course, item อยู่ระดับบนสุด

```
GET    /api/v1/courses/:courseId/clos       ← collection: scope มาจาก URL ตรง ๆ
PATCH  /api/v1/clos/:cloId                  ← item: resolve courseId จาก cloId ก่อน (A-3)
```

เหตุผล: ถ้าใช้ path ซ้อนเต็ม (`/courses/:courseId/clos/:cloId/objectives/:objectiveId`)
client ต้องพก id ทุกชั้นติดตัวไปหมด ทั้งที่ `objectiveId` เพียงตัวเดียวก็ resolve
ขึ้นไปถึง course ได้ที่ฝั่ง server อยู่แล้ว — และการ resolve นั้น**บังคับ** ตาม A-3
จึงไม่ได้แลกความปลอดภัยกับความสั้น

โครงสร้างนี้ตรงกับ route file ที่ตั้งไว้แล้วใน `routes/index.ts`
(`/auth` · `/users` · `/courses` · `/clos` · `/excel` · `/dashboard`)

---

## 2. Convention ร่วมของทุก endpoint

### 2.1 Base URL

```
/api/v1
```

⚠ ปัจจุบัน `registerRoutes()` ยัง register โดยไม่มี prefix นี้ — ดู §12

### 2.2 Response envelope ([[dev]] §9.1)

```jsonc
// สำเร็จ (single)
{ "success": true, "data": { "id": "clxxx", "code": "90641001" } }

// สำเร็จ (list + pagination)
{
  "success": true,
  "data": [ /* ... */ ],
  "meta": { "total": 35, "page": 1, "perPage": 20 }
}

// ผิดพลาด
{
  "success": false,
  "message": "รหัสวิชานี้มีอยู่แล้วในภาคเรียนนี้",
  "errors": { "fieldErrors": { "code": ["ต้องไม่ซ้ำ"] } }
}
```

`message` ต้องเป็น**ภาษาไทย บอกสาเหตุและวิธีแก้** ห้าม stack trace / รหัส error ดิบ (NFR-10)

### 2.3 HTTP status ที่ระบบนี้ใช้

| Code | ใช้เมื่อ | ตัวอย่างในระบบนี้ |
|---|---|---|
| `200` | GET / PATCH / PUT / DELETE สำเร็จ | ดึงรายการ CLO |
| `201` | POST สร้าง resource สำเร็จ | สร้างรายวิชา |
| `400` | Zod validation ล้มเหลว / body ผิดรูป | `semester: 9` |
| `401` | ไม่มี token / token หมดอายุ / บัญชีถูกปิด | `isActive = false` (FR-03) |
| `403` | มี token แต่ **role** ไม่พอ | INSTRUCTOR ยิง `POST /users` |
| `404` | ไม่พบ **หรือไม่มีสิทธิ์เข้าถึงรายวิชานั้น** | INSTRUCTOR ยิง courseId ของเพื่อน (NFR-07) |
| `409` | ชนกับ unique constraint | `(code, semester, year, section)` ซ้ำ · `studentCode` ซ้ำในวิชา |
| `422` | ผ่าน schema แล้วแต่ผิด **business rule** | `score > maxScore` · แต่งตั้ง LEAD คนที่สอง · ลบ LEAD คนสุดท้าย |
| `429` | Rate limit | login ผิดเกิน 5 ครั้ง/15 นาที (FR-04) |
| `500` | ไม่คาดคิด | — |

> **`403` vs `404` — จุดที่พลาดกันบ่อยที่สุดในระบบนี้**
> `403` = "คุณเป็น INSTRUCTOR แต่ endpoint นี้ต้องเป็น ADMIN" (เรื่อง role ล้วน ๆ)
> `404` = "รายวิชานี้ไม่มีอยู่ **หรือ** ไม่ใช่ของคุณ" — สองกรณีนี้ต้องแยกไม่ออกจากภายนอก
> เพราะ 403 บนรายวิชาของเพื่อนคือการยืนยันว่า id นั้นมีจริง = enumeration oracle (NFR-07)

### 2.4 Query parameter มาตรฐานของ endpoint แบบ list

| Param | ชนิด | Default | หมายเหตุ |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | |
| `perPage` | int 1–100 | 20 | เกิน 100 → 400 |
| `q` | string | — | ค้นหาแบบ contains, case-insensitive |
| `sort` | string | ตามที่แต่ละ resource กำหนด | รูปแบบ `field:asc` / `field:desc` |

### 2.5 Auth header

```
Authorization: Bearer <accessToken>
```

`/health` และ `/auth/login` · `/auth/refresh` เท่านั้นที่ไม่ต้องใช้ (SRS §5.2)

### 2.6 การเขียนคอลัมน์ตัวเลข

- `credits` / `lectureHours` / `practiceHours` / `selfStudyHours` เป็น `Decimal` ใน DB
  → **ส่งออกเป็น string** ใน JSON (`"3.0"`) เพื่อไม่ให้เสียความละเอียดจาก float ของ JS
- ค่าที่คำนวณได้ (attainment, cloScore, totalScore) ส่งเป็น `number` **ไม่ปัดเศษ**
  ฝั่ง client ปัด 2 ตำแหน่งตอนแสดงผลเท่านั้น (CR-07)
- "ยังไม่ประเมิน" = `null` เสมอ **ห้ามส่ง 0** (FR-62, FR-84)

---

## 3. ตาราง Endpoint ทั้งหมด (สรุป)

> **Role** = role ขั้นต่ำที่เข้าได้ · **Scope** = ต้องเรียก `assertCourseAccess()` หรือไม่

### 3.1 Auth & Users — 11 endpoints

| Method | Path | Role | Scope | FR |
|---|---|---|---|---|
| POST | `/auth/login` | — | — | FR-01, FR-03, FR-04 |
| POST | `/auth/refresh` | — | — | FR-01 |
| POST | `/auth/logout` | any | — | FR-01 |
| GET | `/auth/me` | any | — | NFR-19 |
| PATCH | `/auth/password` | any | — | FR-08 |
| GET | `/users` | ADMIN | — | FR-05 |
| POST | `/users` | ADMIN | — | FR-05 |
| GET | `/users/:userId` | ADMIN | — | FR-05 |
| PATCH | `/users/:userId` | ADMIN | — | FR-05 |
| PATCH | `/users/:userId/status` | ADMIN | — | FR-03, FR-06 |
| POST | `/users/:userId/reset-password` | ADMIN | — | FR-07 |

### 3.2 Course — 9 endpoints

| Method | Path | Role | Scope | FR |
|---|---|---|---|---|
| GET | `/courses` | any | filter ในตัว | FR-24, FR-25 |
| POST | `/courses` | ADMIN | — | FR-20, FR-21, FR-27, FR-28 |
| GET | `/courses/:courseId` | any | ✅ | FR-25 |
| PATCH | `/courses/:courseId` | any | ✅ | FR-20, FR-47 |
| DELETE | `/courses/:courseId` | ADMIN | ✅ | FR-26 |
| GET | `/courses/:courseId/impact` | any | ✅ | FR-26 |
| GET | `/courses/:courseId/instructors` | any | ✅ | FR-22 |
| POST | `/courses/:courseId/instructors` | ADMIN | ✅ | FR-22, FR-23 |
| PATCH | `/courses/:courseId/instructors/:userId` | ADMIN | ✅ | FR-22, FR-23 |
| DELETE | `/courses/:courseId/instructors/:userId` | ADMIN | ✅ | FR-23 |

### 3.3 CLO & Behavioral Objectives — 9 endpoints

| Method | Path | Role | Scope | FR |
|---|---|---|---|---|
| GET | `/courses/:courseId/clos` | any | ✅ | FR-30, FR-32 |
| POST | `/courses/:courseId/clos` | any | ✅ | FR-30, FR-31 |
| PATCH | `/courses/:courseId/clos/reorder` | any | ✅ | FR-31 |
| PATCH | `/clos/:cloId` | any | ✅ (resolve) | FR-30 |
| DELETE | `/clos/:cloId` | any | ✅ (resolve) | FR-36 |
| GET | `/clos/:cloId/objectives` | any | ✅ (resolve) | FR-33 |
| POST | `/clos/:cloId/objectives` | any | ✅ (resolve) | FR-33 |
| PATCH | `/objectives/:objectiveId` | any | ✅ (resolve) | FR-33 |
| DELETE | `/objectives/:objectiveId` | any | ✅ (resolve) | FR-33 |

### 3.4 Activity & Assessment Criteria — 8 endpoints

| Method | Path | Role | Scope | FR |
|---|---|---|---|---|
| GET | `/courses/:courseId/activities` | any | ✅ | FR-40, FR-43 |
| POST | `/courses/:courseId/activities` | any | ✅ | FR-40, FR-41 |
| PATCH | `/courses/:courseId/activities/reorder` | any | ✅ | FR-42 |
| PATCH | `/activities/:activityId` | any | ✅ (resolve) | FR-40, FR-41 |
| DELETE | `/activities/:activityId` | any | ✅ (resolve) | FR-40 |
| GET | `/courses/:courseId/criteria` | any | ✅ | FR-44, FR-45, FR-48 |
| PUT | `/courses/:courseId/criteria` | any | ✅ | FR-44, FR-45, FR-46 |
| PUT | `/criteria/:criteriaId/objectives` | any | ✅ (resolve) | FR-34, FR-35 |

### 3.5 Student Roster — 7 endpoints

| Method | Path | Role | Scope | FR |
|---|---|---|---|---|
| GET | `/courses/:courseId/students` | any | ✅ | FR-50 |
| POST | `/courses/:courseId/students` | any | ✅ | FR-50, FR-51 |
| PATCH | `/students/:studentId` | any | ✅ (resolve) | FR-50 |
| DELETE | `/students/:studentId` | any | ✅ (resolve) | FR-53 |
| GET | `/courses/:courseId/students/template` | any | ✅ | FR-52 |
| POST | `/courses/:courseId/students/import/preview` | any | ✅ | FR-52, FR-67 |
| POST | `/courses/:courseId/students/import/commit` | any | ✅ | FR-52, FR-68 |

### 3.6 Score & Excel — 8 endpoints

| Method | Path | Role | Scope | FR |
|---|---|---|---|---|
| GET | `/courses/:courseId/scores` | any | ✅ | FR-60, FR-62, FR-64 |
| PUT | `/courses/:courseId/scores` | any | ✅ | FR-61, FR-62, FR-63 |
| GET | `/courses/:courseId/scores/template` | any | ✅ | FR-66 |
| POST | `/courses/:courseId/scores/import/preview` | any | ✅ | FR-67, FR-69 |
| POST | `/courses/:courseId/scores/import/commit` | any | ✅ | FR-68, FR-71 |
| GET | `/courses/:courseId/scores/export` | any | ✅ | FR-70 |
| GET | `/courses/:courseId/uploads` | any | ✅ | FR-71, FR-72 |
| GET | `/uploads/:uploadId/errors` | any | ✅ (resolve) | FR-68, FR-72 |

### 3.7 Dashboard & Reports — 5 endpoints

| Method | Path | Role | Scope | FR |
|---|---|---|---|---|
| GET | `/dashboard/overview` | any | filter ในตัว | FR-80 |
| GET | `/courses/:courseId/dashboard/attainment` | any | ✅ | FR-81, FR-82, FR-84 |
| GET | `/courses/:courseId/dashboard/at-risk` | any | ✅ | FR-83 |
| GET | `/courses/:courseId/dashboard/students/:studentId` | any | ✅ | FR-85, FR-86 |
| GET | `/courses/:courseId/dashboard/export` | any | ✅ | FR-87 |

**รวม 57 endpoints** (+ `/health` ที่มีแล้ว)

---

## 4. Auth & Users

### 4.1 `POST /auth/login` — FR-01, FR-03, FR-04

```jsonc
// Request
{ "email": "somchai@kmutnb.ac.th", "password": "••••••••" }

// 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",     // 15 นาที
    "refreshToken": "eyJ...",    // 7 วัน
    "user": { "id": "clx1", "email": "...", "name": "สมชาย ใจดี", "role": "INSTRUCTOR", "mustChangePassword": false }
  }
}
```

| กรณี | ผลลัพธ์ |
|---|---|
| รหัสผ่านผิด | `401` — `"อีเมลหรือรหัสผ่านไม่ถูกต้อง"` |
| ไม่มีบัญชีนี้ | `401` — **ข้อความเดียวกันเป๊ะ** (FR-03: ห้ามเปิดเผยว่าบัญชีมีอยู่) |
| `isActive = false` | `401` — **ข้อความเดียวกันเป๊ะ** |
| ผิดเกิน 5 ครั้ง/15 นาที/IP | `429` (FR-04 — ตั้ง `@fastify/rate-limit` เฉพาะ route นี้ แยกจาก global) |

> `mustChangePassword` รองรับ FR-07 (ADMIN รีเซ็ตรหัสชั่วคราว → บังคับเปลี่ยนเมื่อ login ครั้งถัดไป)
> **ต้องเพิ่มคอลัมน์ `User.mustChangePassword Boolean @default(false)`** ใน schema — ยังไม่มี (ดู §12 G-4)

### 4.2 `POST /auth/refresh`

```jsonc
{ "refreshToken": "eyJ..." }   // → 200 { accessToken, refreshToken }
```
`401` เมื่อ token หมดอายุ/ปลอม/บัญชีถูกปิดไปแล้ว (ตรวจ `isActive` ใหม่ทุกครั้ง — NFR-19)

### 4.3 `POST /auth/logout`

v1 ใช้ stateless JWT จึงไม่มี token blacklist — endpoint นี้แค่ตอบ `200` ให้ client
ทิ้ง token ใน store ของตัวเอง **ต้องเขียนไว้ในเล่มให้ตรงความจริง ห้ามอ้างว่า revoke ได้**

### 4.4 `GET /auth/me`

คืน user จาก**แถว `User` สด ๆ** ไม่ใช่จาก claim ใน token (NFR-19) — client ใช้ค่านี้
ตัดสินใจแสดงเมนู แต่การซ่อนเมนูไม่ใช่การควบคุมสิทธิ์ (NFR-06)

### 4.5 `PATCH /auth/password` — FR-08

```jsonc
{ "currentPassword": "...", "newPassword": "..." }  // 200 | 400 (นโยบายรหัสผ่าน) | 401 (currentPassword ผิด)
```

### 4.6 `GET /users` — FR-05

Query: `q` (ชื่อ/อีเมล) · `role` (`ADMIN|INSTRUCTOR`) · `isActive` (`true|false`) · `page` · `perPage`

```jsonc
{
  "success": true,
  "data": [{ "id": "clx1", "email": "...", "name": "...", "role": "INSTRUCTOR", "isActive": true, "courseCount": 3 }],
  "meta": { "total": 24, "page": 1, "perPage": 20 }
}
```

### 4.7 `POST /users` — FR-05

```jsonc
{ "email": "new@kmutnb.ac.th", "name": "สมหญิง", "role": "INSTRUCTOR", "password": "temp1234" }  // → 201
```
`409` เมื่ออีเมลซ้ำ · รหัสผ่าน hash ด้วย **argon2 เท่านั้น** (FR-02) และ `passwordHash`
**ห้ามปรากฏใน response ใด ๆ**

### 4.8 `PATCH /users/:userId/status` — FR-03, FR-06

```jsonc
{ "isActive": false }   // → 200
```

> **ไม่มี `DELETE /users/:userId` โดยเจตนา** — FR-06 ห้ามลบ User ที่ยังผูกกับรายวิชา
> หรือเคยอัปโหลดคะแนน และ `onDelete: Restrict` ทั้งสองความสัมพันธ์บังคับไว้ที่ DB อยู่แล้ว
> การมี endpoint ที่ล้มเหลว 100% สำหรับผู้ใช้จริงทุกคนมีค่าเท่ากับกับดัก — ปิดบัญชีแทน

### 4.9 `POST /users/:userId/reset-password` — FR-07

```jsonc
// → 200
{ "success": true, "data": { "temporaryPassword": "Xk8#mQ2p" } }
```
ตั้ง `mustChangePassword = true` พร้อมกัน · รหัสชั่วคราวแสดงบนหน้าจอ ADMIN ครั้งเดียว
**ห้าม log** (NFR-08)

---

## 5. Course & Instructor Assignment

### 5.1 `GET /courses` — FR-24, FR-25

Query: `year` · `semester` · `q` (รหัสหรือชื่อ) · `page` · `perPage` · `sort` (default `code:asc`)

**ADMIN เห็นทุกวิชา · INSTRUCTOR เห็นเฉพาะวิชาที่ตนถูกมอบหมาย** — กรองด้วย
`where: { instructors: { some: { userId } } }` ที่ service ไม่ใช่กรองทีหลังที่ client (NFR-06)

```jsonc
{
  "success": true,
  "data": [{
    "id": "clx1", "code": "90641001", "name": "การเขียนโปรแกรมคอมพิวเตอร์", "nameEn": "Computer Programming",
    "semester": 1, "year": 2568, "section": "01",
    "credits": "3.0", "lectureHours": "2.0", "practiceHours": "2.0", "selfStudyHours": "5.0",
    "gradingType": "LETTER", "passCriteria": 60, "classTarget": 70,
    "counts": { "clos": 5, "activities": 8, "students": 42 },
    "instructors": [{ "userId": "clu1", "name": "สมชาย ใจดี", "role": "LEAD" }]
  }],
  "meta": { "total": 12, "page": 1, "perPage": 20 }
}
```

> `counts` ต้องมาจาก `_count` ของ Prisma ใน query เดียว ไม่ใช่ loop นับทีละวิชา (NFR-02: ห้าม N+1)

### 5.2 `POST /courses` — FR-20, FR-21, FR-27, FR-28

```jsonc
{
  "code": "90641001", "name": "การเขียนโปรแกรมคอมพิวเตอร์", "nameEn": "Computer Programming",
  "semester": 1, "year": 2568, "section": "01",
  "credits": 3, "lectureHours": 2, "practiceHours": 2, "selfStudyHours": 5,
  "gradingType": "LETTER", "passCriteria": 60, "classTarget": 70,
  "instructors": [{ "userId": "clu1", "role": "LEAD" }]
}
```

**Zod rules**

| Field | Rule | ที่มา |
|---|---|---|
| `code` | string 1–20 | FR-20 |
| `semester` | int 1–3 | schema comment (DB CHECK กว้างกว่าที่ 1–6) |
| `year` | int 2500–2600 — **พ.ศ.** | ASM-05 |
| `section` | string default `"01"` | FR-20 |
| `credits` | number **0–30** (0 ต้องผ่าน) | FR-27, DC-15 |
| `*Hours` | number ≥ 0 | FR-27, DC-15 |
| `passCriteria` / `classTarget` | number 0–100 | DC-14 |
| `instructors` | array ≥ 1 และมี `role: "LEAD"` **พอดี 1 คน** | FR-23 |

| กรณี | ผลลัพธ์ |
|---|---|
| `(code, semester, year, section)` ซ้ำ | `409` — `"รหัสวิชานี้มีอยู่แล้วในภาคเรียนนี้"` (FR-21) |
| ไม่มี LEAD หรือมี LEAD > 1 | `422` — `"รายวิชาต้องมีผู้ประสานงานรายวิชา (LEAD) 1 คน"` (FR-23) |

การสร้าง Course + CourseInstructor ต้องอยู่ใน **transaction เดียว** (NFR-11) — ไม่งั้นจะเกิด
วิชาที่ไม่มีอาจารย์ ซึ่ง FR-23 ห้าม แต่ DB บังคับแทนไม่ได้ (แถว course ต้องเกิดก่อน)

### 5.3 `GET /courses/:courseId/impact` — FR-26

ให้ confirm dialog มีตัวเลขจริงก่อนลบ

```jsonc
{ "success": true, "data": { "clos": 5, "objectives": 14, "activities": 8, "criteria": 21, "students": 42, "scores": 336, "uploadLogs": 3 } }
```

### 5.4 `DELETE /courses/:courseId` — FR-26

ต้องส่ง `?confirm=true` ไม่งั้น `422` พร้อม payload เดียวกับ §5.3 — กัน client ที่ลืมทำ dialog
ลบแล้ว cascade ทั้งชุด (ยกเว้น `User` ที่เป็น Restrict)

### 5.5 `POST /courses/:courseId/instructors` — FR-22, FR-23

```jsonc
{ "userId": "clu2", "role": "CO" }   // → 201
```

| กรณี | ผลลัพธ์ |
|---|---|
| ผู้ใช้คนนี้อยู่ในวิชาแล้ว | `409` (unique `[courseId, userId]`) |
| ตั้ง `LEAD` ทั้งที่มี LEAD อยู่แล้ว | `422` — `"รายวิชานี้มีผู้ประสานงานรายวิชาอยู่แล้ว"` (DC-07 partial index จะดักซ้ำอีกชั้น) |
| ผู้ใช้ `isActive = false` | `422` — `"บัญชีนี้ถูกปิดใช้งาน"` |

### 5.6 `DELETE /courses/:courseId/instructors/:userId` — FR-23

`422` เมื่อจะเหลือ 0 คน หรือจะเหลือ 0 LEAD — `"รายวิชาต้องมีผู้ประสานงานรายวิชาอย่างน้อย 1 คน"`

---

## 6. CLO & Behavioral Objectives

### 6.1 `GET /courses/:courseId/clos` — FR-30, FR-32

```jsonc
{
  "success": true,
  "data": [{
    "id": "clc1", "number": 1, "description": "อธิบายหลักการเขียนโปรแกรมเชิงวัตถุได้",
    "threshold": 60,
    "computedWeight": 27.5,          // CR-02 — READ-ONLY เสมอ
    "objectiveCount": 3,
    "isMeasured": true               // FR-48 — false = ไม่มีกิจกรรมใดวัด CLO นี้
  }]
}
```

> **`computedWeight` เป็นค่าอนุพัทธ์ตาม CR-02 และไม่มีทางเขียนกลับได้** —
> `PATCH /clos/:cloId` ที่ส่ง `weight` หรือ `computedWeight` มา ต้องตอบ `400`
> ไม่ใช่เพิกเฉยเงียบ ๆ (FR-32, OI-02) การรับแล้วทิ้งคือวิธีที่ bug ประเภทนี้รอดไปถึง production

### 6.2 `POST /courses/:courseId/clos` — FR-30, FR-31

```jsonc
{ "number": 3, "description": "...", "threshold": 60 }   // → 201
```
`409` เมื่อ `number` ซ้ำในวิชา · `threshold` 0–100 (DC-02)

### 6.3 `PATCH /courses/:courseId/clos/reorder` — FR-31

```jsonc
{ "order": ["clc3", "clc1", "clc2"] }   // → 200, number = index + 1
```

**ต้องอยู่ใน transaction เดียว** และเขียนแบบสองเฟส (ตั้งค่าลบชั่วคราว → ตั้งค่าจริง)
เพราะ `@@unique([courseId, number])` จะชนกลางทางถ้าอัปเดตทีละแถวตรง ๆ
`400` เมื่อ array ไม่ครบทุก CLO ของวิชาหรือมี id แปลกปลอม

### 6.4 `DELETE /clos/:cloId` — FR-36

ถ้ามี `AssessmentCriteria` ผูกอยู่ → ต้องส่ง `?confirm=true` ไม่งั้น `422` พร้อม

```jsonc
{ "success": false, "message": "การลบ CLO นี้จะทำให้ผลการประเมินที่คำนวณไว้เปลี่ยน",
  "errors": { "criteria": 4, "activities": 3 } }
```

### 6.5 Behavioral Objectives — FR-33

```
GET    /clos/:cloId/objectives          → [{ id, number, description, assessmentCount }]
POST   /clos/:cloId/objectives          { number, description }        → 201 | 409 (number ซ้ำต่อ CLO)
PATCH  /objectives/:objectiveId         { number?, description? }      → 200
DELETE /objectives/:objectiveId                                        → 200
```

---

## 7. Activity & Assessment Criteria

### 7.1 `GET /courses/:courseId/activities` — FR-40, FR-43

```jsonc
{
  "success": true,
  "data": [{ "id": "cla1", "name": "สอบกลางภาค", "method": "ข้อสอบปรนัย", "maxScore": 100, "order": 1, "weight": 30,
             "scoredCount": 38, "studentCount": 42 }],     // FR-64
  "meta": { "totalWeight": 95, "isWeightComplete": false } // FR-43 — เตือน ไม่บล็อก
}
```

> `meta.totalWeight` เป็น**คำเตือน ไม่ใช่การบล็อก** — ระหว่างกรอกยังไม่ครบ 100 เป็นเรื่องปกติ
> จุดที่บล็อกจริงคือ Dashboard (FR-45, FR-84) ไม่ใช่ตอนบันทึกกิจกรรม

### 7.2 `POST /courses/:courseId/activities` — FR-40, FR-41

```jsonc
{ "name": "สอบกลางภาค", "method": "ข้อสอบปรนัย", "maxScore": 100, "weight": 30, "order": 1 }  // → 201
```
`maxScore` **> 0 เคร่งครัด** (FR-41, DC-03 — ทุกสูตรใน §3 หารด้วยค่านี้) · `weight` 0–100

### 7.3 `PATCH /activities/:activityId` — FR-40, FR-41

การลด `maxScore` ให้ต่ำกว่าคะแนนที่มีอยู่แล้ว → `422` พร้อมจำนวนแถวที่จะขัดกับ trigger

```jsonc
{ "success": false, "message": "มีคะแนนที่บันทึกไว้แล้ว 7 รายการสูงกว่าคะแนนเต็มใหม่",
  "errors": { "conflictingScores": 7, "maxExistingScore": 88 } }
```

> จุดนี้คือ NFR-12 ตรง ๆ: DB trigger บังคับ `score <= maxScore` อยู่แล้ว แต่ถ้าปล่อยให้
> trigger เป็นด่านแรก ผู้ใช้จะได้ `500` พร้อมข้อความ Postgres ภาษาอังกฤษ — API ต้องดักก่อน

### 7.4 `GET /courses/:courseId/criteria` — FR-44, FR-45, FR-48

เมทริกซ์ Activity × CLO เต็มใบในหนึ่ง request (หน้า Assessment Criteria แสดงทั้งตาราง)

```jsonc
{
  "success": true,
  "data": {
    "clos": [{ "id": "clc1", "number": 1 }, { "id": "clc2", "number": 2 }],
    "activities": [{ "id": "cla1", "name": "สอบกลางภาค", "weight": 30 }],
    "cells": [{ "activityId": "cla1", "cloId": "clc1", "weight": 60 },
              { "activityId": "cla1", "cloId": "clc2", "weight": 40 }]
  },
  "meta": {
    "activityWeightSums": { "cla1": 100 },      // FR-45 — ต้อง = 100 ต่อกิจกรรม
    "unmeasuredCloIds": ["clc5"],               // FR-48
    "isReadyForDashboard": false                // FR-84
  }
}
```

### 7.5 `PUT /courses/:courseId/criteria` — FR-44, FR-45, FR-46

**แทนที่เมทริกซ์ทั้งใบในหนึ่ง transaction** (ไม่ใช่ POST/DELETE ทีละช่อง) — หน้าจอนี้ผู้ใช้แก้
หลายช่องแล้วกดบันทึกครั้งเดียว การยิงทีละช่องจะทิ้งสถานะครึ่ง ๆ กลาง ๆ ไว้เมื่อ request ที่ 3 ล้ม

```jsonc
{ "cells": [{ "activityId": "cla1", "cloId": "clc1", "weight": 60 },
            { "activityId": "cla1", "cloId": "clc2", "weight": 40 }] }
```

| กรณี | ผลลัพธ์ |
|---|---|
| `activityId` หรือ `cloId` ไม่ได้อยู่ในวิชานี้ | `422` — **ต้องตรวจที่ API ก่อน** ถึงจะมี DB trigger รออยู่ (FR-46, DC-04) |
| น้ำหนักรวมต่อกิจกรรม ≠ 100 | `200` + `meta.warnings` (FR-45 = เตือนตอนบันทึก, บล็อกที่ Dashboard) |
| `weight` < 0 หรือ > 100 | `400` |

ช่องที่หายไปจาก `cells` = ลบ criteria นั้น (พร้อม `ObjectiveAssessment` ที่ห้อยอยู่, cascade)

### 7.6 `PUT /criteria/:criteriaId/objectives` — FR-34, FR-35

```jsonc
{ "objectiveIds": ["clo1", "clo2"] }   // → 200
```
`422` เมื่อ objective ไม่ได้เป็นของ CLO เดียวกับ criteria (DC-06)

> **FR-35 เป็นข้อกำหนดเชิงลบที่ต้องมี test คุ้ม:** การผูก/ถอด objective ที่นี่
> **ห้ามเปลี่ยนตัวเลขใด ๆ ที่ `/dashboard/attainment` คืน** — เขียน test ที่เรียก attainment
> ก่อนและหลัง แล้ว assert ว่าเท่ากันทุกตัว

---

## 8. Student Roster

### 8.1 `GET /courses/:courseId/students` — FR-50

Query: `q` (รหัสหรือชื่อ) · `page` · `perPage` · `sort` (default `studentCode:asc`)

```jsonc
{ "success": true,
  "data": [{ "id": "cls1", "studentCode": "6703001", "name": "สมศักดิ์ เรียนดี", "scoredCount": 6, "activityCount": 8 }],
  "meta": { "total": 42, "page": 1, "perPage": 20 } }
```

> **ห้ามมี field อีเมล / ชั้นปี / สาขา / คณะ** — ไม่มีใน `Student` และ OI-05 ตัดออกจาก v1 แล้ว
> (FR-54) ถ้า UI ต้องการ ต้องแก้ schema ก่อน ไม่ใช่ให้ API แต่งค่าขึ้นมา

### 8.2 `POST /courses/:courseId/students` — FR-50, FR-51

```jsonc
{ "studentCode": "6703001", "name": "สมศักดิ์ เรียนดี" }   // → 201
```
`409` เมื่อ `studentCode` ซ้ำ**ในวิชานี้** — ซ้ำข้ามวิชาถูกต้องและต้องผ่าน (ASM-01, FR-51)

### 8.3 `DELETE /students/:studentId` — FR-53

ต้อง `?confirm=true` เมื่อมีคะแนนอยู่ ไม่งั้น `422` + `{ "scores": 6 }`

### 8.4 Import รายชื่อ — FR-52

```
GET  /courses/:courseId/students/template          → 200 (xlsx: รหัสนักศึกษา | ชื่อ-นามสกุล)
POST /courses/:courseId/students/import/preview    multipart/form-data: file
POST /courses/:courseId/students/import/commit     { "previewToken": "..." }
```

ใช้ pattern preview → commit เดียวกับคะแนน (§9.4) เพราะเป็นความคาดหวังเดียวกันของผู้ใช้
และใช้โค้ด validate ชุดเดียวกันได้

---

## 9. Score Entry, Import/Export & Upload Log

### 9.1 `GET /courses/:courseId/scores` — FR-60, FR-62, FR-64

ตารางกรอกคะแนน: **แถว = นักศึกษา · คอลัมน์ = Activity** (ไม่ใช่ CLO — OI-01)

```jsonc
{
  "success": true,
  "data": {
    "activities": [{ "id": "cla1", "name": "สอบกลางภาค", "maxScore": 100, "order": 1 }],
    "students": [{
      "id": "cls1", "studentCode": "6703001", "name": "สมศักดิ์ เรียนดี",
      "scores": { "cla1": 78, "cla2": null }     // null = ยังไม่ประเมิน (FR-62)
    }]
  },
  "meta": { "progress": { "cla1": { "scored": 38, "total": 42 } } }   // FR-64
}
```

> **`"cla2": null` กับการไม่มี key `cla2` ต้องหมายถึงสิ่งเดียวกัน = ยังไม่ประเมิน**
> และห้ามเป็น `0` เด็ดขาด — `0` คือคะแนนที่นักศึกษาได้จริง การปนกันสองอย่างนี้
> ทำให้ CR-03 คำนวณผิดทั้งวิชาโดยไม่มีอะไรฟ้อง (FR-62)

### 9.2 `PUT /courses/:courseId/scores` — FR-61, FR-62, FR-63

```jsonc
{
  "scores": [
    { "studentId": "cls1", "activityId": "cla1", "score": 78 },
    { "studentId": "cls2", "activityId": "cla1", "score": null }   // null = ลบแถว = กลับไป "ยังไม่ประเมิน"
  ]
}
```

- **upsert ทั้งชุดใน transaction เดียว** — สำเร็จทั้งหมดหรือไม่สำเร็จเลย (FR-63, NFR-11)
- `score: null` → `prisma.score.deleteMany` ไม่ใช่เขียน 0 (FR-62)
- validate `0 ≤ score ≤ maxScore` ที่ API ก่อน (FR-61, NFR-12) → `422` พร้อมรายแถวที่ผิด:

```jsonc
{ "success": false, "message": "มีคะแนนเกินคะแนนเต็มของกิจกรรม",
  "errors": { "rows": [{ "studentCode": "6703004", "activity": "สอบกลางภาค", "score": 105, "maxScore": 100 }] } }
```

> ⚠ **NFR-08 / CON-02:** endpoint นี้ห้าม log body ไม่ว่ากรณีใด — มีทั้งรหัสนักศึกษาและคะแนน
> ต้องตั้ง `logger.redact` หรือปิด body logging ที่ route นี้โดยเฉพาะ

### 9.3 `GET /courses/:courseId/scores/template` — FR-66

xlsx ที่**เติมรหัสนักศึกษาและชื่อไว้แล้ว** 1 คอลัมน์ต่อ 1 กิจกรรม
หัวคอลัมน์ `<ชื่อกิจกรรม> (เต็ม N)` ตาม SRS §5.3

### 9.4 Import คะแนน — FR-67, FR-68, FR-69, FR-71

**สองเฟส: preview → commit** (FR-67 บังคับให้ผู้ใช้เห็นก่อนเขียนจริง)

```
POST /courses/:courseId/scores/import/preview     multipart/form-data: file (≤ 10 MB, CON-03)
```

```jsonc
// 200
{
  "success": true,
  "data": {
    "previewToken": "prv_01J...",       // อายุ 15 นาที, ผูกกับ courseId + userId
    "fileName": "scores-midterm.xlsx",
    "summary": { "total": 42, "ok": 39, "failed": 3 },
    "columns": [{ "header": "สอบกลางภาค (เต็ม 100)", "activityId": "cla1", "matched": true }],
    "rows": [
      { "row": 2, "studentCode": "6703001", "status": "ok", "values": { "cla1": 78 } },
      { "row": 5, "studentCode": "6703099", "status": "error", "errorCode": "STUDENT_NOT_IN_COURSE",
        "message": "ไม่พบรหัสนักศึกษานี้ในรายวิชา" }
    ]
  }
}
```

**errorCode ที่ต้องรองรับครบทั้ง 6 ตาม FR-69** — ตัวนี้คือสิ่งที่ **H3 (≥ 95%)** วัดตรง ๆ
([[objectives-hypotheses-evaluation]] §2)

| errorCode | ความหมาย | ข้อความไทย |
|---|---|---|
| `STUDENT_NOT_IN_COURSE` | รหัสนักศึกษาไม่มีในวิชา | "ไม่พบรหัสนักศึกษานี้ในรายวิชา" |
| `SCORE_NOT_NUMERIC` | คะแนนไม่ใช่ตัวเลข | "คะแนนต้องเป็นตัวเลข" |
| `SCORE_EXCEEDS_MAX` | คะแนนเกิน `maxScore` | "คะแนนเกินคะแนนเต็มของกิจกรรม (เต็ม N)" |
| `SCORE_NEGATIVE` | คะแนนติดลบ | "คะแนนต้องไม่ติดลบ" |
| `DUPLICATE_STUDENT_IN_FILE` | รหัสซ้ำในไฟล์ | "รหัสนักศึกษานี้ปรากฏซ้ำในไฟล์ (แถวที่ N)" |
| `UNKNOWN_ACTIVITY_COLUMN` | คอลัมน์กิจกรรมไม่ตรง | "ไม่พบกิจกรรมที่ตรงกับคอลัมน์นี้ในรายวิชา" |

```
POST /courses/:courseId/scores/import/commit      { "previewToken": "prv_01J..." }
```

```jsonc
// 200
{ "success": true, "data": { "uploadLogId": "clg1", "recordsOk": 39, "recordsFail": 3 } }
```

- **commit เฉพาะแถวที่ผ่าน** — แถวเสียไม่ทำให้ทั้งไฟล์ล้ม (FR-68)
  นี่คือข้อยกเว้นเดียวของ A-5: แถวที่ผ่านทั้งหมดอยู่ใน transaction เดียว แถวที่ไม่ผ่านถูกข้าม
- เขียน `ScoreUploadLog` **ทุกครั้ง แม้ล้มเหลวทั้งไฟล์** (FR-71) — `recordsOk = 0` ก็ต้องมีแถว
- `previewToken` หมดอายุ / ไม่ใช่ของ course นี้ / ไม่ใช่ของผู้ใช้คนนี้ → `422`

### 9.5 `GET /courses/:courseId/scores/export` — FR-70

Query: `type=raw` (คะแนนดิบ) | `type=clo` (สรุป CLO) | `type=both` (default)
→ `200` `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**ต้องเรียก `attainment.service.ts` ตัวเดียวกับที่ Dashboard ใช้** (FR-88) — ห้ามคำนวณซ้ำที่นี่

### 9.6 `GET /courses/:courseId/uploads` — FR-71, FR-72

```jsonc
{ "success": true,
  "data": [{ "id": "clg1", "fileName": "scores-midterm.xlsx",
             "uploadedBy": { "id": "clu1", "name": "สมชาย ใจดี" },
             "recordsOk": 39, "recordsFail": 3,      // แยกคอลัมน์ (FR-72)
             "createdAt": "2026-08-06T03:12:00.000Z" }],
  "meta": { "total": 3, "page": 1, "perPage": 20 } }
```

### 9.7 `GET /uploads/:uploadId/errors` — FR-68, FR-72

รายการแถวที่ไม่ผ่านของการอัปโหลดครั้งนั้น — `?format=xlsx` ให้ดาวน์โหลดเป็นไฟล์ได้ (FR-68)

> ⚠ **ต้องมีที่เก็บรายละเอียดแถวที่ผิด** ซึ่ง `ScoreUploadLog` ปัจจุบันไม่มี (เก็บแค่ตัวนับ)
> ดู §12 G-5 — ถ้าไม่แก้ endpoint นี้ทำไม่ได้และ FR-72 ตกไปครึ่งข้อ

---

## 10. Dashboard & Reports

> **ทุกตัวเลขในหมวดนี้ต้องมาจาก `services/attainment.service.ts` ตัวเดียว** (FR-88, SRS §3)
> Controller ห้ามคำนวณเอง และ export (§9.5) ต้องเรียก service เดียวกัน

### 10.1 `GET /dashboard/overview` — FR-80

ADMIN เห็นทั้งคณะ · INSTRUCTOR เห็นเฉพาะวิชาของตน

```jsonc
{ "success": true, "data": {
  "courseCount": 3, "studentCount": 118,
  "cloCompleted": 8, "cloTotal": 15,
  "scoreProgress": { "scored": 640, "expected": 944 }
} }
```

### 10.2 `GET /courses/:courseId/dashboard/attainment` — FR-81, FR-82, FR-84

```jsonc
{
  "success": true,
  "data": {
    "classTarget": 70,
    "clos": [{
      "cloId": "clc1", "number": 1, "description": "...",
      "threshold": 60,
      "attainment": 76.19,          // CR-04 — null ถ้าคำนวณไม่ได้
      "status": "ACHIEVED",         // ACHIEVED | NOT_ACHIEVED | INSUFFICIENT_DATA
      "passedCount": 32, "evaluableCount": 42, "notEvaluatedCount": 0
    }]
  },
  "meta": {
    "computable": false,
    "blockers": [
      { "code": "ACTIVITY_WEIGHT_INCOMPLETE", "message": "น้ำหนักกิจกรรมรวมได้ 95% (ต้องเป็น 100%)", "detail": { "totalWeight": 95 } },
      { "code": "CRITERIA_WEIGHT_INCOMPLETE", "message": "กิจกรรม \"สอบปลายภาค\" มีน้ำหนักเกณฑ์รวม 80%", "detail": { "activityId": "cla2" } },
      { "code": "CLO_NOT_MEASURED", "message": "CLO 5 ยังไม่ถูกกิจกรรมใดวัด", "detail": { "cloId": "clc5" } },
      { "code": "NO_SCORES", "message": "ยังไม่มีคะแนนในรายวิชานี้" }
    ]
  }
}
```

> **FR-84 คือหัวใจของหน้านี้: เมื่อข้อมูลไม่พอ ต้องบอกสาเหตุ ห้ามส่ง `attainment: 0`**
> `0%` แปลว่า "นักศึกษาทุกคนไม่ผ่าน" ซึ่งเป็นคนละเรื่องกับ "ยังไม่มีข้อมูลพอจะบอก"
> — และเป็นตัวเลขที่อาจารย์ใช้ตัดสินใจแทรกแซงนักศึกษาจริง ๆ

### 10.3 `GET /courses/:courseId/dashboard/at-risk` — FR-83

```jsonc
{
  "success": true,
  "data": [{
    "studentId": "cls7", "studentCode": "6703007", "name": "สมหมาย ตั้งใจ",
    "failedClos": [{ "cloId": "clc2", "number": 2, "score": 41.25, "threshold": 60 }],
    "totalScore": 52.4, "coursePassed": false
  }],
  "meta": { "atRiskCount": 6, "notEvaluatedCount": 4, "evaluatedCount": 38 }
}
```

> ⚠ **ขึ้นกับ OI-12 ที่ยังไม่ sign-off** — นักศึกษาที่ `cloScore = null` ทุกตัว (ยังไม่มีคะแนนเลย)
> **ไม่นับเป็น at-risk** แต่ต้องโผล่ใน `meta.notEvaluatedCount` เป็นสถานะที่สาม
> ถ้าไม่ทำแบบนี้ ต้นเทอมระบบจะรายงาน at-risk ต่ำกว่าความจริง ซึ่งขัดกับ **H2**
> ([[objectives-hypotheses-evaluation]] §2 · E-04)

### 10.4 `GET /courses/:courseId/dashboard/students/:studentId` — FR-85, FR-86

```jsonc
{
  "success": true,
  "data": {
    "student": { "id": "cls7", "studentCode": "6703007", "name": "สมหมาย ตั้งใจ" },
    "gradingType": "LETTER",
    "clos": [{ "cloId": "clc1", "number": 1, "score": 72.5, "threshold": 60, "status": "PASS" },
             { "cloId": "clc3", "number": 3, "score": null, "threshold": 60, "status": "NOT_EVALUATED" }],
    "activities": [{ "activityId": "cla1", "name": "สอบกลางภาค", "score": 78, "maxScore": 100, "weight": 30 }],
    "totalScore": 52.4,                 // CR-05, null ถ้ายังไม่มีคะแนนเลย
    "coursePassed": false,              // CR-05 เทียบกับ passCriteria
    "passFailResult": null              // CR-06: "S" | "U" เมื่อ gradingType = PASS_FAIL, null เมื่อ LETTER
  }
}
```

> **CR-06 / FR-86:** เมื่อ `gradingType = PASS_FAIL` API **ห้ามส่ง field เกรดตัวอักษรใด ๆ**
> ให้ส่ง `passFailResult` เท่านั้น — การส่งมาแล้วหวังให้ client ซ่อน คือการฝากกฎทางวิชาการ
> ไว้กับ CSS

### 10.5 `GET /courses/:courseId/dashboard/export` — FR-87

`?scope=course` (default) | `?scope=student&studentId=...` · `?format=xlsx` (default) | `pdf`
→ ไฟล์ · ใช้ service เดียวกับ §10.2–§10.4 (FR-88)

---

## 11. Traceability: FR → Endpoint

| FR | Endpoint |
|---|---|
| FR-01, FR-03, FR-04 | `POST /auth/login` · `POST /auth/refresh` |
| FR-02 | ทุก endpoint ที่เขียน `passwordHash` (argon2 เท่านั้น) |
| FR-05, FR-06 | `GET/POST /users` · `PATCH /users/:userId` · `PATCH /users/:userId/status` |
| FR-07 | `POST /users/:userId/reset-password` |
| FR-08 | `PATCH /auth/password` |
| FR-20, FR-21, FR-27, FR-28 | `POST /courses` · `PATCH /courses/:courseId` |
| FR-22, FR-23 | `/courses/:courseId/instructors` ทั้งชุด |
| FR-24, FR-25 | `GET /courses` |
| FR-26 | `GET /courses/:courseId/impact` · `DELETE /courses/:courseId?confirm=true` |
| FR-30, FR-32 | `GET/POST /courses/:courseId/clos` · `PATCH /clos/:cloId` |
| FR-31 | `PATCH /courses/:courseId/clos/reorder` |
| FR-33 | `/clos/:cloId/objectives` · `/objectives/:objectiveId` |
| FR-34, FR-35 | `PUT /criteria/:criteriaId/objectives` |
| FR-36 | `DELETE /clos/:cloId` |
| FR-40, FR-41, FR-43 | `/courses/:courseId/activities` · `PATCH /activities/:activityId` |
| FR-42 | `PATCH /courses/:courseId/activities/reorder` |
| FR-44…FR-46, FR-48 | `GET/PUT /courses/:courseId/criteria` |
| FR-47 | `PATCH /courses/:courseId` (passCriteria, classTarget) + `PATCH /clos/:cloId` (threshold) |
| FR-50, FR-51, FR-53, FR-54 | `/courses/:courseId/students` · `/students/:studentId` |
| FR-52 | `/courses/:courseId/students/template` · `/import/preview` · `/import/commit` |
| FR-60…FR-64 | `GET/PUT /courses/:courseId/scores` |
| FR-66 | `GET /courses/:courseId/scores/template` |
| FR-67, FR-69 | `POST /courses/:courseId/scores/import/preview` |
| FR-68 | `POST /courses/:courseId/scores/import/commit` · `GET /uploads/:uploadId/errors` |
| FR-70 | `GET /courses/:courseId/scores/export` |
| FR-71, FR-72 | `GET /courses/:courseId/uploads` · `GET /uploads/:uploadId/errors` |
| FR-80 | `GET /dashboard/overview` |
| FR-81, FR-82, FR-84 | `GET /courses/:courseId/dashboard/attainment` |
| FR-83 | `GET /courses/:courseId/dashboard/at-risk` |
| FR-85, FR-86 | `GET /courses/:courseId/dashboard/students/:studentId` |
| FR-87 | `GET /courses/:courseId/dashboard/export` |
| FR-88 | ทุก endpoint ใน §10 + `GET /courses/:courseId/scores/export` เรียก `attainment.service.ts` ตัวเดียว |

**FR-65** (เตือนเมื่อออกจากหน้าโดยยังไม่บันทึก) เป็น client-side ล้วน ไม่มี endpoint

---

## 12. ช่องว่างที่ต้องแก้ในโค้ดปัจจุบัน

> ตรวจกับโค้ดจริงเมื่อ 2026-08-06 — ต้องปิดก่อนหรือระหว่าง implement route ชุดแรก

| # | ช่องว่าง | ผลถ้าไม่แก้ | ต้องทำ |
|---|---|---|---|
| **G-1** | `registerRoutes()` ([routes/index.ts](app/server/src/routes/index.ts:22)) register โดย**ไม่มี prefix `/api/v1`** ขัดกับ SRS §5.2 | path จริงไม่ตรงเอกสารทั้งเล่ม และเปลี่ยนทีหลังต้องแก้ client ทุกไฟล์ | `app.register(..., { prefix: "/api/v1" })` ที่ชั้นบนสุด |
| **G-2** | `API_URL` ฝั่ง client default `http://localhost:3001` ([constants.ts](app/client/src/lib/constants.ts:1)) ไม่มี `/api/v1` ต่อท้าย | ทุก request 404 ทันทีที่ G-1 ถูกแก้ | เปลี่ยน default เป็น `http://localhost:3001/api/v1` |
| **G-3** | `rbac("ADMIN")` ([rbac.middleware.ts](app/server/src/middlewares/rbac.middleware.ts:15)) ผ่านเมื่อ role ตรง **หรือเป็น ADMIN** — จึงไม่มีทางเขียน "INSTRUCTOR เท่านั้น ADMIN ห้าม" ได้ | ไม่กระทบ v1 (ADMIN เห็นทุกอย่างโดยเจตนา — FR-25) แต่ต้องรู้ตัวว่าเป็นข้อจำกัด ไม่ใช่ bug | เขียน comment ยืนยันเจตนา หรือเพิ่ม `rbacExact()` ถ้าอนาคตต้องการ |
| **G-4** | ไม่มี `User.mustChangePassword` ใน `schema.prisma` | FR-07 (บังคับเปลี่ยนรหัสหลัง reset) ทำไม่ได้ | เพิ่มคอลัมน์ + migration ก่อน implement `/users/:userId/reset-password` |
| **G-5** | `ScoreUploadLog` เก็บแค่ `recordsOk` / `recordsFail` ไม่เก็บ**รายละเอียดแถวที่ผิด** | `GET /uploads/:uploadId/errors` ทำไม่ได้ → FR-68 (ดาวน์โหลดแถวที่ไม่ผ่าน) และครึ่งหลังของ FR-72 ตกไป | เลือกทางใดทางหนึ่ง: เพิ่ม `errorDetails Json?` บน `ScoreUploadLog` (ง่าย พอสำหรับ v1) หรือสร้าง `ScoreUploadError` เป็นตารางลูก |
| **G-6** | **OI-10 ยังไม่ sign-off** — CR-03 ไม่ใช้ `Activity.weight` แต่ CR-02 ใช้ ต่างกัน **20 จุด** บนข้อมูลชุดเดียวกัน | `GET /dashboard/attainment` และ `/students/:studentId` คืนตัวเลขที่ยังไม่รู้ว่าถูกหรือผิด → **H1 พิสูจน์ไม่ได้** | sign-off ก่อนเขียน `attainment.service.ts` ([[objectives-hypotheses-evaluation]] E-03) |
| **G-7** | **OI-12 ยังไม่ sign-off** — `cloScore = null` นับเป็น at-risk หรือไม่ | `GET /dashboard/at-risk` นิยามไม่ได้ → **H2 และ OBJ-4 วัดไม่ได้** | sign-off ก่อน implement §10.3 ([[objectives-hypotheses-evaluation]] E-04) |
| **G-8** | ยังไม่มี route file จริงสักไฟล์นอกจาก `health.route.ts` — ที่เหลือใน `routes/index.ts` ยังเป็น comment · `controllers/` และ `validators/` มีแค่ `README.md` · `services/` มีเฉพาะ `authorization.service.ts` | — | สร้างตามลำดับ: `auth` → `courses` → `clos`/`activities` → `students`/`scores` → `dashboard` (ตรงกับการแบ่งงาน 3 คนใน [[features-pages]] §3) |

---

_อัปเดตเอกสารนี้ทุกครั้งที่เพิ่ม/แก้ endpoint — และเมื่อขัดกับโค้ดจริง **ให้ยึดโค้ดแล้วแก้เอกสาร**_
