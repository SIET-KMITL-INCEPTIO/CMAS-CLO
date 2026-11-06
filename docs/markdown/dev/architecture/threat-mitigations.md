# มาตรการป้องกันตาม Threat Model — API v1

See also: [[dfd]] · [[api-design]] · [[api-design-plan]] · [[security-rule]]

> **สร้าง:** 2026-10-22 · **ตรวจกับ:** `docs/diagrams/threat-model/report.htm` (สร้าง 2026-10-19 จาก DFD v1.4 · 695 ภัย สถานะ Not Started ทั้งหมด) ·
> โค้ดใน branch `feature/api-endpoints` (72 จาก 72 endpoint ในขอบเขต)
>
> Threat Modeling Tool สร้างภัยตาม STRIDE ให้ทุกเส้นข้อมูลที่ข้าม trust boundary ภัยชนิดเดียวกันจึงซ้ำหลายร้อยแถว
> เอกสารนี้จับคู่ **ชนิดของภัย** กับมาตรการในโค้ดและที่ตรวจได้ เพื่อใช้กรอก Justification ใน `.tm7`

## สรุปตามหมวด STRIDE

| หมวด | จำนวน | สถานะ |
|---|---|---|
| Spoofing | 156 | ป้องกันแล้ว |
| Tampering | 63 | ป้องกันแล้ว |
| Repudiation | 84 | ป้องกันแล้วบางส่วน (ดูข้อจำกัด) |
| Information Disclosure | 70 | ป้องกันแล้ว · TLS บังคับใน production |
| Denial of Service | 210 | ป้องกันแล้วระดับแอป · ความพร้อมของ Supabase อยู่นอกขอบเขต |
| Elevation of Privilege | 112 | ป้องกันแล้ว |

## ชนิดของภัยกับมาตรการ

| ชนิดของภัย (จำนวน) | มาตรการ | อยู่ที่ | ตรวจด้วย |
|---|---|---|---|
| Spoofing ผู้สอน / ผู้ดูแล / process (≈80) | Google ID token ตรวจที่เซิร์ฟเวอร์ (aud, email_verified) · JWT HS256 แยก `typ` access/refresh (S-1) · ทุก request อ่านแถว `User` สด บัญชีปิดหรือรออนุมัติได้ 401 (NFR-19) | `lib/google.ts` · `lib/jwt.ts` · `middlewares/auth.middleware.ts` | `app.test.ts` (S-1) · `courses.db.test.ts` (ปิดบัญชีแล้วได้ 401 ทันที) |
| Spoofing Google (4) | ตรวจลายเซ็นกับ JWKS ของ Google และ `aud` = `GOOGLE_CLIENT_ID` | `lib/google.ts` | `auth.service.test.ts` |
| Spoofing data store (≈55) | ต่อฐานข้อมูลด้วย connection string ใน env เท่านั้น · production บังคับ `sslmode=require` (ยืนยันว่าเป็นเซิร์ฟเวอร์จริงและเข้ารหัส) | `lib/env.schema.ts` | `env.schema.test.ts` |
| Elevation by impersonation / weak access control (≈44) | ทุก route ต้องประกาศ `config.access` ไม่ประกาศ = เซิร์ฟเวอร์ไม่บูต (A-6) · capability ตาราง `PERM` · course scope ทุก route ที่มี `:courseId` หรือ leaf id (A-3) · ไม่ใช่ของคุณ = 404 เหมือนไม่มีทุกไบต์ (A-13) · ADMIN ไม่ทำงานสอน (D-1) | `middlewares/access.middleware.ts` · `modules/authorization/` | `api-contract.test.ts` · `course-scope.isolation.test.ts` (ยิงทุก route ด้วยผู้สอนวิชาอื่น) |
| Cross Site Request Forgery (12) | API ใช้ `Authorization: Bearer` ไม่ใช้ cookie · cookie เดียวคือ refresh token: `HttpOnly; SameSite=Strict; Path=/api/v1/auth` และ `/auth/refresh` ตรวจ `Origin` (S-11) | `lib/cookie.ts` · `modules/auth/auth.controller.ts` | — |
| Remote code execution / changing execution flow (≈43) | ไม่มี `eval` · Excel ที่มีสูตรถูกปฏิเสธ ไม่ประมวลผลสูตร · ไม่บันทึกไฟล์ลงดิสก์ · ตรวจ magic bytes (S-6) · ส่งออก: ข้อความที่ขึ้นต้น `= + - @` ถูกใส่ `'` นำหน้า (S-7) | `lib/excel.ts` · `lib/upload.ts` | `students-scores.db.test.ts` (ไฟล์ไม่ใช่ xlsx · ไฟล์มีสูตร) |
| SQL injection (21) | Prisma query builder · SQL ดิบใช้ tagged template (`$queryRaw\`…\``, `Prisma.sql`) ซึ่งเป็น parameter เสมอ | `modules/scores/score-writer.ts` · `score.repository.ts` · `course.repository.ts` | — |
| Lack of input validation (13) | Zod `.strict()` ทุก body · `courseId`, `changedBy`, `updatedBy`, `status` มาจาก URL หรือ token เท่านั้น (A-8) · ค่าที่คำนวณได้ไม่รับจาก client (A-10) | `modules/*/**.validator.ts` | `courses.db.test.ts` (A-8) |
| Data store corrupted (≈28) | CHECK และ trigger ใน migration 0002, 0004, 0008 · การเขียนหลายแถวอยู่ใน transaction เดียว (FR-63) · แก้คะแนนพร้อมกันได้ 409 ภายใต้ row lock (D-3) | `database/migrations/` · `score.repository.ts` | `students-scores.db.test.ts` (D-3, FR-63) |
| Data flow sniffing (42) | HSTS ผ่าน `helmet` · production บังคับ `CORS_ORIGIN` เป็น https และฐานข้อมูล `sslmode=require` | `app.ts` · `lib/env.schema.ts` | `env.schema.test.ts` |
| Information disclosure ทาง response และ log (≈28) | DTO `select` ชัดเจน ไม่มี `passwordHash` / `googleSub` (A-9) · error ไม่ส่ง stack หรือข้อความ Prisma (S-3) · log ไม่มี body, `Authorization`, cookie (S-4) · log ของ query มีแค่ SQL และเวลา ไม่มีค่า parameter | `error-handler.middleware.ts` · `app.ts` · `index.ts` | `app.test.ts` (S-4) |
| Repudiation (84) | `AuthEvent`: เข้าสู่ระบบ ออกจากระบบ เปลี่ยนบทบาท ปิด/เปิดบัญชี และ**การถูกปฏิเสธสิทธิ์** (S-10) · `ScoreChange` ทุกช่องคะแนนที่เปลี่ยน ทุกเส้นทาง (A-12) · `ScoreUploadLog` + `UploadReject` ทุกการนำเข้า · request log มี `reqId` | `auth-event.repository.ts` · `score-writer.ts` | `courses.db.test.ts` (DENY) · `clos-activities.db.test.ts` (CLOSE) |
| Denial of service — resource consumption (≈36) | rate limit ทั้งระบบ · `/auth/google` 5 ครั้ง/15 นาที · `/auth/refresh` 30 ครั้ง/15 นาที · นำเข้า 10 ครั้ง/นาที ต่อผู้ใช้ (S-5) · ไฟล์ ≤ 10 MB, ≤ 2,000 แถว, ≤ 5 ชีต · list มี `perPage` สูงสุด · PUT คะแนน ≤ 2,000 ช่อง · preview เก็บในหน่วยความจำสูงสุด 500 รายการ 15 นาที | `app.ts` · route ของ auth/students/scores · `lib/preview-store.ts` | — |
| Denial of service — process crash / data store inaccessible / flow interrupted (≈150) | ทุก error กลายเป็น response เดียว (S-3) ไม่ล้ม process · ฐานข้อมูลล่มตอนบูต: log error แต่ server ยังรับ request · ส่วนที่เหลือเป็นเรื่องความพร้อมของ Supabase และเครือข่าย | `error-handler.middleware.ts` · `index.ts` | — |

## ข้อจำกัดที่ยังเหลือ (ต้องเขียนลงรายงานตามจริง)

- **การแก้ CLO กิจกรรม และเกณฑ์ไม่มีประวัติรายการ** — มีแค่ request log ที่มี `reqId` และผู้เรียก · ตาราง audit ทั่วไปยังไม่อยู่ในขอบเขต (Repudiation ของ process CLO 13 แถว)
- **access token เพิกถอนไม่ได้** — ออกจากระบบแล้ว access token เดิมใช้ได้ถึงหมดอายุ (15 นาที) · แต่บัญชีที่ถูกปิดถูกปฏิเสธทันทีเพราะอ่านแถว `User` สด
- **preview ของการนำเข้าอยู่ในหน่วยความจำ** — ใช้ได้กับเซิร์ฟเวอร์ process เดียว ถ้าขยายเป็นหลาย instance ต้องย้ายไปเก็บร่วมกัน
- **rate limit เก็บในหน่วยความจำ** — นับแยกต่อ instance เช่นกัน
- **ไม่มี virus scan ของไฟล์ที่อัปโหลด** — ลดความเสี่ยงด้วยการไม่เก็บไฟล์และไม่ประมวลผลสูตร
- ความพร้อมใช้งานของ Supabase และ Google (DoS ฝั่ง data store และ external entity) อยู่นอกการควบคุมของแอป
