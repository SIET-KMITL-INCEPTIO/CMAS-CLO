# แผนออกแบบ API — กฎ ความปลอดภัย และลำดับงาน

See also: [[api-design]] · [[srs]] · [[course-role-permissions]] · [[code-rule]] · [[sprint-plan-2026]]

> **สร้าง:** 2026-10-11 · **สถานะ:** แผน — รอตัดสิน D-1…D-5 ใน §1
> **ขอบเขต:** สิ่งที่ต้องเพิ่มหรือแก้ใน [[api-design]] v1.1.0 และใน `app/server/src/` ก่อนเขียน route ของรายวิชา
> **ตรวจกับ:** `api-design.md` v1.1.0 · `srs.md` v2.4.3 · `schema.prisma` (13 models, migration 0001–0007) ·
> `docs/pages/index-q.html` (ตาราง `PERM` และ `capOf`) · `docs/reference/db/mysql/index-q.sql` · โค้ดเซิร์ฟเวอร์ ณ วันที่สร้าง
>
> เอกสารนี้**ไม่ใช่ contract** — contract ยังเป็น [[api-design]] เมื่อข้อใดในแผนนี้ถูกรับ ให้ย้ายเข้า [[api-design]] แล้วลบออกจากที่นี่

---

## 1. ต้องตัดสินก่อน (5 ข้อ)

ทุกข้อมีค่าที่แผนนี้ใช้ไปก่อนถ้าไม่มีใครคัดค้าน · **ตัดสินแล้ว 2026-10-15:** D-1 และ D-4 (ดูคอลัมน์ค่าที่ใช้) · Node ของโปรเจกต์เป็น 24

**ตัดสินแล้ว 2026-10-18:** ออกแบบ API ตาม [CMAS-API-Endpoints.xlsx](../../../excel/api/CMAS-API-Endpoints.xlsx) (74 endpoint · สร้างจาก `scripts/build-api-endpoints-workbook.py` ห้ามแก้ Excel ด้วยมือ) ·
Excel ตอบว่ามี endpoint อะไร ใครเรียกได้ capability ไหน อยู่ช่วงไหน · รูป request/response ยึด Zod validator ในโค้ด · envelope และรหัสสถานะยึด [[api-design]] §2 ·
**ยังไม่เขียนโค้ด endpoint ใหม่ (2026-10-18)** จนกว่าจะออกแบบในแผ่น `Design` ของ Excel ครบกลุ่มนั้น · แผ่น `Classification` จำแนก endpoint 4 มิติ (ประเภทการทำงาน · ผลต่อข้อมูล · ประเภทสิทธิ์ · ระดับความระวัง) · **ออกแบบครบแล้ว (2026-10-20): 76 endpoint** — ในขอบเขต 72 · เลื่อนไปหลัง v1 4 ตัว (D-5) · ตรวจกับระบบจริงทุกครั้งที่ CI รันด้วย `scripts/check-api-design.py` (schema · capabilities.ts · แผนทดสอบ · route ในโค้ด) และ `app/server/src/api-contract.test.ts` (บูต Fastify ลงทะเบียน endpoint ที่ออกแบบทุกตัวด้วยสิทธิ์ตามแบบ) · P1 จึงไม่ต้องเขียน [[api-design]] §3 ใหม่เป็น v1.2 · การทดสอบเป็น system test แบบ gray box ตาม [[system-test-plan]]

| # | คำถาม | ค่าที่ใช้ไปก่อน | เหตุผล · ผลถ้าเลือกตรงข้าม |
|---|---|---|---|
| **D-1** ✅ | ADMIN ทำอะไรได้ในรายวิชาที่ตนไม่ได้สอน | **ตัดสินแล้ว: ADMIN ไม่ใช่ผู้สอน ทำงานของผู้สอนไม่ได้** · อ่านได้ · ทำได้แค่ สร้าง/ลบรายวิชา จัดการผู้สอน และบัญชีผู้ใช้ · ทำแล้วใน `capabilities.ts` | เอกสารสามที่ขัดกัน (ดู F-1) · ถ้าให้เขียนได้ ต้องแก้ตาราง `PERM` ของต้นแบบและ [[course-role-permissions]] |
| **D-2** | เก็บ refresh token ที่ไหน และเพิกถอนได้ไหม | **cookie `httpOnly` + หมุนทุกครั้งที่ใช้ + ตาราง `RefreshToken` เก็บ hash** | ตอนนี้เพิกถอนไม่ได้เลย (F-2) · ถ้าไม่เพิ่มตาราง `POST /auth/logout` จะเป็นแค่การลบฝั่ง client |
| **D-3** | สองคนแก้คะแนนช่องเดียวกันพร้อมกัน | **ส่งค่าเดิมมาด้วย (`from`) ไม่ตรงกับ DB ตอบ 409** | `ScoreChange` เก็บ `from`/`to` อยู่แล้ว จึงไม่ต้องเพิ่มคอลัมน์ · ถ้าเลือก "คนหลังชนะ" ประวัติยังครบแต่คนแรกไม่รู้ว่าถูกทับ |
| **D-4** ✅ | รับ 4 ตารางและ 11 คอลัมน์ที่ต้นแบบเสนอเข้า `schema.prisma` หรือไม่ | **ตัดสินแล้ว: รับตาม ER ล่าสุด (`ER-INDEX-Q`, 17 ตาราง) ใน migration `0008`** | endpoint ของ ถอนรายวิชา · ปิดรับคะแนน · ยกเว้น · ประวัติคะแนน · แถวที่นำเข้าไม่ผ่าน ทำไม่ได้ถ้าไม่มี (F-5) |
| **D-5** | v1 มี login ด้วย email + รหัสผ่านหรือไม่ | **ไม่มี — Google อย่างเดียว** ย้าย 6 endpoint ไปเป็น "หลัง v1" | ตอนนี้ทำแล้วเฉพาะ Google · ถ้าจะมี ต้องเพิ่ม `mustChangePassword` (G-4) และกติกา lockout (FR-04) |

---

## 2. สิ่งที่ตรวจพบ

| # | ข้อเท็จจริง | ที่ | ระดับ |
|---|---|---|---|
| **F-1** | สิทธิ์ของ ADMIN ในรายวิชาเขียนไว้สามแบบ: `assertCourseAccess()` ให้ ADMIN ผ่านทุกวิชาทั้งอ่านและเขียน · [[api-design]] §3 เขียนว่า "ไม่ทำงานภายในรายวิชาแทนผู้สอน" · ตาราง `PERM` ของต้นแบบไม่มี ADMIN ในแถวงานรายวิชาเลย | `authorization.service.ts:35` · `index-q.html` (`PERM`) | ต้องตัดสิน (D-1) |
| **F-2** | access token กับ refresh token เซ็นด้วย secret เดียวกัน payload เหมือนกัน และ `verifyToken()` ไม่แยกชนิด — **refresh token (7 วัน) ใช้แทน access token (15 นาที) ได้** | `lib/jwt.ts` · `auth.middleware.ts` | บั๊กความปลอดภัย |
| **F-3** | `errorHandler` ไม่รู้จัก `CourseNotFoundError` จึงตอบ **500 แทน 404** ทันทีที่ route แรกเรียก `assertCourseAccess()` · `P2002` ตอบ 400 แทน 409 ตาม §2.3 | `error-handler.middleware.ts` | บั๊ก (ยังไม่แสดงอาการ) |
| **F-4** | `errorHandler` log error ทั้งก้อน — ข้อความของ Prisma อาจมีค่าที่ชน constraint เช่น รหัสนักศึกษา ขัด NFR-08 | `error-handler.middleware.ts:11` | ต้องแก้ก่อนมี route นักศึกษา |
| **F-5** | [[api-design]] ไม่มี endpoint ของ: การตัดเกรด (FR-90…FR-98) · ถอน/คืนสถานะ · ปิด/เปิดรับคะแนน · ยกเว้น · ประวัติการแก้คะแนน · น้ำหนักรายกลุ่ม · ประวัติบัญชี | เทียบ `capOf` ของต้นแบบกับ §3 | contract ไม่ครบ |
| **F-6** | จำนวน endpoint ไม่ตรงกันในเอกสารเดียว: §3 เขียน "รวม 57" · นับแถวได้ 58 · G-8 เขียน 68 | [[api-design]] §3, §12 | เอกสาร |
| **F-7** | rate limit มีแต่ระดับทั้งระบบ (100 ครั้ง/นาที) ไม่มีระดับ route สำหรับ login และ import | `index.ts` | ยังไม่ทำ |
| **F-8** | baseline ของ [[api-design]] เป็น SRS v2.4.0 · ปัจจุบัน v2.4.3 (CR-05.1 และ CR-10 เปลี่ยน) | [[api-design]] ส่วนหัว | เอกสาร |
| **F-9** | `access.middleware.ts` รับ capability ระดับรายวิชาเฉพาะ path ที่มี `:courseId` จึง**ยังลงทะเบียน endpoint ที่ใช้ leaf id ไม่ได้ 20 ตัว** (`/clos/:cloId` · `/objectives/:objectiveId` · `/activities/:activityId` · `/students/:studentId` · `/uploads/:uploadId`) ต้องเพิ่มตัว resolve courseId จาก leaf id ตาม A-3 ก่อนเริ่ม P3 · พบจาก `api-contract.test.ts` (2026-10-20) ซึ่งเก็บ 20 ตัวนี้ไว้เป็น `it.fails` | `access.middleware.ts` | ต้องทำก่อน P3 |

G-1 (ไม่มี prefix `/api/v1`) และ G-2 ใน [[api-design]] §12 ยังเปิดอยู่ ตรวจซ้ำแล้วเป็นจริง

---

## 3. กฎของ endpoint

A-1…A-5 ใน [[api-design]] §1.1 ใช้ต่อ · เพิ่มอีก 8 ข้อ

| # | กฎ | ปิดช่องอะไร |
|---|---|---|
| **A-6** | **หนึ่ง route หนึ่ง capability** — ทุก route ที่เปลี่ยนข้อมูลประกาศ capability จากตาราง `PERM` (17 ตัว) ตอน register และตรวจผ่านฟังก์ชันเดียว `authorize(cap, courseId, caller)` · route ที่ไม่ประกาศ = test ล้ม | SEC-1, SEC-2 · route ใหม่ที่ลืมตรวจสิทธิ์ |
| **A-7** | **ลำดับ preHandler ตายตัว:** rate limit → `authMiddleware` → Zod params → resolve `courseId` → `authorize()` → Zod body → handler | อ่าน DB ด้วย id ที่ยังไม่ตรวจรูป · ตรวจ body ก่อนรู้ว่ามีสิทธิ์ |
| **A-8** | **Zod `.strict()` ทุก body** · `courseId` · `uploadedBy` · `changedBy` · `role` · `status` มาจาก URL หรือ token เท่านั้น ไม่รับจาก body | mass assignment |
| **A-9** | **ตอบด้วย DTO ที่ `select` ชัดเจน** ไม่ส่ง model ทั้งแถว · `passwordHash` และ `googleSub` ไม่ออกจาก repository | ข้อมูลรั่วเมื่อเพิ่มคอลัมน์ทีหลัง |
| **A-10** | **ค่าที่คำนวณได้ ไม่รับจาก client** — `totalPercent` · `grade` · `T` · attainment คำนวณที่ service เดียว (FR-88) จากคะแนนใน DB | client ส่งเกรดที่ตัวเองคิดมา |
| **A-11** | **ตรวจสถานะก่อนเขียน ตอบ 422 พร้อมวิธีแก้:** กิจกรรมที่ปิดแล้ว · นักศึกษาที่ถอนแล้ว · เกรดที่ตรึงแล้ว | เขียนทับผลที่ประกาศไปแล้ว (FR-96) |
| **A-12** | **การเขียนคะแนนทุกทางเขียน `ScoreChange` ใน transaction เดียวกัน** (กรอกมือ · วาง · นำเข้า · เติมคะแนนเต็ม · ยกเว้น) | ประวัติขาดช่วง (NFR-16) |
| **A-13** | **404 ของ "ไม่มี" กับ "ไม่ใช่ของคุณ" ต้องเหมือนกันทุกไบต์** ทั้ง body และ header | enumeration (NFR-07) |

---

## 4. ความปลอดภัย

| # | มาตรการ | สถานะ |
|---|---|---|
| **S-1** | token แยกชนิดด้วย claim `typ` (`access` / `refresh`) · `authMiddleware` รับเฉพาะ `access` · `/auth/refresh` รับเฉพาะ `refresh` | ✅ ทำแล้ว (P0) |
| **S-2** | refresh token ตาม D-2: cookie `httpOnly; Secure; SameSite=Strict; Path=/api/v1/auth` · หมุนทุกครั้ง · ใช้ซ้ำ = เพิกถอนทั้งสาย | ✅ ทำแล้ว 2026-10-22 (`Secure` เฉพาะ production) |
| **S-3** | map error ของโดเมนครบ: `CourseNotFoundError` → 404 · `P2002` → 409 · business rule → 422 · ข้อความไทยตาม NFR-10 | ✅ ทำแล้ว (P0) |
| **S-4** | log ไม่มีข้อมูลนักศึกษา: ตั้ง `redact` ของ pino · ไม่ log body · log เฉพาะ `err.name` และ request id | ✅ ทำแล้ว (P0) · log ของ query มีแค่ SQL ไม่มีค่า |
| **S-5** | rate limit ราย route: `/auth/*` 5 ครั้ง/15 นาที ต่อ IP · import 10 ครั้ง/นาที ต่อผู้ใช้ · ที่เหลือใช้ค่าทั้งระบบ | ✅ ทำแล้ว · `/auth/refresh` ใช้ 30 ครั้ง/15 นาที เพราะ 5 ล็อกเบราว์เซอร์ที่เปิดหลายแท็บ |
| **S-6** | ไฟล์นำเข้า: รับเฉพาะ `.xlsx` ตรวจ magic bytes (ไม่เชื่อนามสกุลหรือ MIME) · 10 MB (มีแล้ว) · จำกัด 2,000 แถวและ 5 ชีต · ไม่ประมวลผลสูตร · ไม่เก็บไฟล์ลงดิสก์ | ✅ ทำแล้ว (`lib/excel.ts`, `lib/upload.ts`) |
| **S-7** | ไฟล์ส่งออก: เซลล์ข้อความที่ขึ้นต้นด้วย `=` `+` `-` `@` ต้องถูกทำให้เป็นข้อความ (ชื่อนักศึกษาและชื่อกิจกรรมเป็นค่าที่ผู้ใช้พิมพ์) | ✅ ทำแล้ว |
| **S-8** | **test ข้ามรายวิชาแบบตาราง:** ทุก route ที่มี `:courseId` หรือ leaf id ถูกยิงด้วยผู้สอนของวิชาอื่น ต้องได้ 404 · สร้างจากรายการ route อัตโนมัติ route ใหม่จึงถูกทดสอบเอง | ✅ ทำแล้ว · `course-scope.isolation.test.ts` ยิงทุก route ด้วยข้อมูลของตัวเอง (`CMAS_DB_TESTS=1`) |
| **S-9** | ผู้สอนคนสุดท้ายของรายวิชาเอาออกไม่ได้ (422) · แก้แถวของตัวเองไม่ได้ (SEC-4) | ✅ ทำแล้ว · ล็อกแถวรายวิชาก่อนนับ |
| **S-10** | การถูกปฏิเสธสิทธิ์บันทึกลง `AuthEvent` พร้อม capability และรายวิชา ไม่มีข้อมูลนักศึกษา (SEC-5) | ✅ ทำแล้ว (403 ทุกครั้ง · 404 ไม่บันทึก) |
| **S-11** | CORS allowlist ตรงตัว · `helmet` · ตรวจ `Origin` บน `/auth/refresh` เพราะใช้ cookie | ✅ ทำแล้ว · production บังคับ https และ `sslmode=require` ด้วย |

`authMiddleware` อ่านแถว `User` สดทุก request อยู่แล้ว (NFR-19) — คงไว้ ไม่แตะ

---

## 5. Endpoint ที่ต้องเพิ่มใน contract

รายการนี้ได้จากการไล่ `capOf` ของต้นแบบเทียบกับ [[api-design]] §3 — **path เป็นข้อเสนอ** ยังไม่ได้เทียบรูป request/response กับต้นแบบทีละตัว

| กลุ่ม | Method · Path | Capability | อ้างอิง | ต้องมี `0008` |
|---|---|---|---|---|
| ตัดเกรด | `GET /courses/:courseId/grading` — ตั้งค่า ช่วงเกรด ผลสด และสถิติ | (อ่าน) | FR-90, FR-97 | |
| | `PUT /courses/:courseId/grade-bands` | `band.write` | FR-91, FR-92 | |
| | `POST /courses/:courseId/grading/run` — คำนวณและตรึง | `grading.run` | FR-94, FR-96 · CR-10, CR-11 | |
| | `DELETE /courses/:courseId/grading` — ยกเลิกการตรึง | `grading.run` | CR-11 | |
| | `PUT` · `DELETE /students/:studentId/grade-override` | `grade.override` | FR-95 | |
| | `GET /courses/:courseId/grades/export` | `results.export` | FR-87 | |
| นักศึกษา | `POST /students/:studentId/withdraw` · `/restore` | `student.write` | CR-05.1 | ✅ |
| กิจกรรม | `POST /activities/:activityId/close` · `/reopen` | `score.edit` | CR-05.1 | ✅ |
| | `POST /activities/:activityId/duplicate` | `activity.write` | ต้นแบบ | |
| | `PUT /courses/:courseId/group-weights` | `activity.write` | ต้นแบบ N1/N2 | ✅ |
| คะแนน | `PUT /courses/:courseId/scores` รับค่า ตัวเลข · `null` · `EXCUSED` พร้อมเหตุผล และ `from` (D-3) | `score.edit` | CR-05.1 | ✅ |
| | `GET /courses/:courseId/score-changes` | (อ่าน) | NFR-16 | ✅ |
| รายวิชา | `POST /courses/:courseId/duplicate` | `course.create` | ต้นแบบ | |
| บัญชี | `GET /users/:userId/auth-events` | `user.manage` | UC 1.6 | ✅ |
| นักศึกษา | `PUT` · `DELETE /students/:studentId/remediation-plans/:cloId` — แผนพัฒนาผู้เรียนรายคน × CLO | `student.write` | ต้นแบบ 5.7 (2569-10-19) | ✅ |

"เลิกทำ" ของต้นแบบไม่ต้องมี endpoint — client ยิงคำสั่งย้อนกลับด้วยสิทธิ์เดียวกับการแก้เดิม

---

## 6. ลำดับงาน

แบ่งตามสิ่งที่งานถัดไปต้องอ่าน ไม่ใช่ตามหัวข้อ · หนึ่งช่วง = หนึ่ง branch

| ช่วง | งาน | ต้องเสร็จก่อนเพราะ | ผ่านเมื่อ | Issue |
|---|---|---|---|---|
| **P0 ฐาน** ✅ | S-1 · S-3 · S-4 · G-1 · G-2 · `authorize()` ตาม A-6 พร้อม test ทะเบียน route · โครง test S-8 · Node 24 | ทุก route ของรายวิชาเรียกใช้ทั้งหมดนี้ | refresh token ยิง route ปกติได้ 401 · `CourseNotFoundError` ได้ 404 · `npm run verify` ผ่าน | ยังไม่มี |
| **P1 contract** | ~~ปรับ [[api-design]] เป็น v1.2~~ **เปลี่ยน 2026-10-18:** ใช้ Excel API เป็นแบบ · ปรับสถานะในสคริปต์สร้าง Excel ให้ตรงโค้ด (S-1, S-3, S-4 ทำแล้ว) · เพิ่ม A-6…A-13 ในแผ่น `Rules` | โค้ดของ P2 และ P3 เขียนตาม Excel | เปิดแผ่น `Endpoints` แล้วเขียนโค้ดได้โดยไม่ต้องถามกัน | #4 |
| **P2 รายวิชา** | `/courses` 9 endpoint และผู้สอน · S-9 | CLO กิจกรรม และคะแนน ต้องมีรายวิชา | S-8 ผ่านทุก route ของช่วงนี้ | #6 |
| **P3 CLO และเกณฑ์** | §3.3 และ §3.4 | คะแนนและการคำนวณอ่านน้ำหนักจากที่นี่ | S-8 ผ่าน · น้ำหนักรวมไม่ครบ 100 ได้ 422 | #7, #10 |
| **P4 migration `0008`** | ตาราง/คอลัมน์ตาม D-4 และ `RefreshToken` ตาม D-2 | endpoint ที่มี ✅ ใน §5 | `prisma migrate` ผ่านบนฐานข้อมูลว่างและบนข้อมูล seed | — |
| **P5 นักศึกษาและคะแนน** | §3.5 · §3.6 · S-6 · S-7 · A-11 · A-12 · ถอน/ปิดรับ/ยกเว้น | การตัดเกรดและแดชบอร์ดอ่านคะแนน | นำเข้า 500 แถวใน 10 วินาที (NFR-03) · ทุกการเขียนมีแถว `ScoreChange` | #8 |
| **P6 ตัดเกรดและแดชบอร์ด** | กลุ่มตัดเกรดใน §5 · §3.7 · service คำนวณตัวเดียว (FR-88) | — | ผลตรงกับต้นแบบบนข้อมูล seed เดียวกัน รวมกรณีถอนรายวิชาในวิชาอิงกลุ่ม (c3) | #9 |

P4 ไม่ขวาง P2 และ P3 จึงทำคู่ขนานได้ · กำหนดส่ง 24 ต.ค. ครอบคลุมถึง P3

**สถานะ 2026-10-22:** P2–P6 ทำแล้วใน branch `feature/api-endpoints` (ทุกช่วงใน branch เดียวตามที่สั่ง · หนึ่ง commit ต่อช่วง) ·
72 จาก 72 endpoint ในขอบเขต · migration `0008` apply แล้ว · มาตรการเทียบ threat model อยู่ที่ [[threat-mitigations]]

---

## 7. สิ่งที่แผนนี้ไม่ได้ทำ

- ไม่ได้เทียบรูป request/response ของ endpoint ใน §5 กับต้นแบบทีละตัว — เป็นงานของ P1
- ไม่ได้ตรวจ trigger ใน migration `0002` และ `0004` ว่าครอบคลุม A-11 แค่ไหน
- ตัวเลขใน S-5 และ S-6 (5 ครั้ง/15 นาที · 2,000 แถว) เป็นค่าเสนอ ยังไม่ได้วัดกับการใช้งานจริง
