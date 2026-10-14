# จากต้นแบบสู่แอป — อะไรมาจาก `index-q.html` อะไรมาจาก React

See also: [[srs]] · [[features-pages]] · [[user-flow]] · [[api-design]] · [[api-design-plan]] · [[design-system]] · [[dev]]

> **สร้าง:** 2026-10-14 · **ใช้กับ:** ทุกคนที่เขียนหน้าหรือ endpoint ใหม่ใน `app/`
> **กฎข้อเดียว:** ต้นแบบบอก **ระบบต้องทำอะไรและหน้าตาเป็นอย่างไร** · แอป React บอก **ทำอย่างไรให้ใช้งานจริงได้อย่างปลอดภัย**
> เมื่อเอกสารนี้ขัดกับ [[srs]] ให้ยึด [[srs]] แล้วแก้เอกสารนี้

---

## 1. แบ่งหน้าที่

| เอามาจาก `docs/pages/index-q.html` | เอามาจากแอป React (`app/`, `database/`) |
|---|---|
| ฟีเจอร์และฟังก์ชันทั้งหมด ([[features-pages]] §1.1) | Tech stack: React 19 · Fastify 5 · Prisma 6 · PostgreSQL (Supabase) |
| Flow และลำดับขั้นตั้งค่า 6 ขั้น ([[user-flow]] §3, §11) | ความปลอดภัย: `authMiddleware` · `rbac` · `assertCourseAccess` · Zod · rate limit ([[api-design-plan]] §3–§4) |
| หน้าตา: โทเคนสี ตัวอักษร ระยะ เงา ([index-q-design-system.html](../../../pages/index-q-design-system.html)) | ประสิทธิภาพ: code splitting ราย route · TanStack Query cache · transaction ในฐานข้อมูล |
| ข้อความบนหน้าจอ ชื่อปุ่ม และข้อความ error ภาษาไทย | โครงไฟล์ราย feature และกฎชั้น Route → Controller → Service → Repository ([[code-rule]]) |
| ตารางสิทธิ์ `PERM` (17 capability) — ใช้เป็น**รายการ** | การตรวจสิทธิ์จริง — ทำที่เซิร์ฟเวอร์ทุก route |
| สูตร CR-01…CR-11 — ใช้เป็น**ผลที่ต้องได้** | การคำนวณจริง — service เดียวที่เซิร์ฟเวอร์ (FR-88) |
| ข้อมูลตัวอย่างใน `db` ของต้นแบบ | `database/seed.ts` และ migration |

## 2. ห้ามลอกจากต้นแบบ

| ในต้นแบบ | ในแอปต้องเป็น | เหตุผล |
|---|---|---|
| ตรวจสิทธิ์ด้วย `can()` ในเบราว์เซอร์ | เซิร์ฟเวอร์ตรวจทุก route · หน้าเว็บแค่ซ่อนปุ่ม | ผู้ใช้แก้โค้ดในเบราว์เซอร์ได้ (SEC-6, NFR-06) |
| คำนวณคะแนนและเกรดในเบราว์เซอร์ (`derive()`) | เซิร์ฟเวอร์คำนวณ client แสดงผลอย่างเดียว | FR-88 · ไม่รับค่าที่ client คำนวณเอง |
| อ่านไฟล์ Excel ในเบราว์เซอร์ด้วย SheetJS | เซิร์ฟเวอร์ตรวจทีละแถว | input ที่ไม่น่าเชื่อถือ (CLAUDE.md ข้อ 7) |
| ข้อมูลอยู่ในหน่วยความจำ แก้แล้วเห็นผลทันที | ทุกการแก้ผ่าน API ต้องรับมือกับการรอ การล้มเหลว และสองคนแก้พร้อมกัน | เครือข่ายไม่ได้ทันทีเสมอ (D-3) |
| เลิกทำหลายขั้นในหน่วยความจำ | เลิกทำ = ยิงคำสั่งย้อนกลับด้วยสิทธิ์เดียวกับการแก้เดิม | ไม่มี endpoint "undo" (api-design-plan §5) |
| หน้า "ความครอบคลุมของแบบจำลอง" | ไม่ต้องทำ | เป็นเครื่องมือตรวจต้นแบบ ไม่ใช่ฟีเจอร์ |
| hash route (`#overview/c1`) | path route ใน `pages.config.ts` | React Router 7 |

## 3. เชื่อมกันตรงไหน

แต่ละแถวคือ "ของในต้นแบบ" → "ของในแอปที่ต้องตรงกัน" · ชื่อ feature ฝั่ง client และ server เป็นคำเดียวกันเสมอ

| ในต้นแบบ | ฝั่ง client (`app/client/src/`) | ฝั่ง server (`app/server/src/modules/`) |
|---|---|---|
| หน้า `courses` (จัดการรายวิชา) · `overview` (ภาพรวม) | `features/courses/` | `courses/` |
| หน้า `clos` · `objectives` | `features/clos/` | `clos/` |
| หน้า `activities` (รวมแท็บตรวจการเชื่อม) | `features/activities/` | `activities/` |
| หน้า `roster` (นักศึกษาและคะแนน) | `features/students/` · `features/scores/` | `students/` · `scores/` |
| หน้า `dashboard` (ผลรายนักศึกษา) | `features/dashboard/` | `dashboard/` |
| หน้า `grading` | `features/grading/` | `grading/` |
| หน้า `users` | `features/users/` ✅ บางส่วน | `users/` ✅ บางส่วน |
| ฟอร์มเข้าสู่ระบบและบัญชีของฉัน | `features/auth/` ✅ บางส่วน | `auth/` ✅ บางส่วน |
| `ROUTES` · `SUBTABS` · `STEP_HOME` | `pages.config.ts` | — |
| `PERM` · `capOf()` | ซ่อนปุ่มตาม capability | `authorize(cap, courseId)` ทุก route (A-6) |
| `tailwind.config` · `:root` · `TONE` · `PAL` | `styles/tokens.css` | — |
| `derive()` | แสดงผลอย่างเดียว | service คำนวณตัวเดียว |
| `db` และ `index-q.sql` | — | `database/schema.prisma` + migration `0008` |
| `scripts/check-*.js` (ตรวจต้นแบบ) | — | test ข้ามรายวิชาราย route (S-8) |

## 4. ลำดับการทำงานของหนึ่งหน้า

1. **ล็อกหน้านั้นในต้นแบบ** — ตั้งแต่เริ่มเขียนหน้านี้ในแอป ห้ามแก้หน้าเดียวกันในต้นแบบ ถ้าต้องเปลี่ยน ให้แก้ [[srs]] ก่อน
2. **อ่าน 3 แหล่ง** — หน้าในต้นแบบ (หน้าตาและ flow) · [[features-pages]] §1.1 (ฟังก์ชันและ capability) · [api-design.md](api-design.md) §3 (endpoint)
3. **เขียน server ก่อน client** — endpoint + Zod + `authorize()` + test ข้ามรายวิชา
4. **เขียน client** — ใช้โทเคนจาก `tokens.css` เท่านั้น ห้ามพิมพ์ค่า hex ใหม่
5. **เทียบผลกับต้นแบบ** — ใช้ข้อมูลชุดเดียวกับ seed ตัวเลขทุกตัวต้องตรงกับที่ต้นแบบคำนวณ

## 5. ยังต้องตัดสิน

| # | คำถาม | ค่าที่ใช้ไปก่อน |
|---|---|---|
| **DS** | แอปใช้ design system ชุดไหน | **ชุดของต้นแบบ (Nocturnal Atelier)** ย้ายเข้า `tokens.css` แทน Verdure เพราะเป็นชุดที่อาจารย์เห็นและให้ความเห็นแล้ว |
| D-1 | ADMIN ทำอะไรได้ในรายวิชาที่ไม่ได้สอน | อ่านได้ เขียนไม่ได้ ([[api-design-plan]] §1) |
| D-4 | รับตารางที่ต้นแบบเสนอเข้า migration `0008` หรือไม่ | รับทั้งหมด |
| D-5 | v1 มี login ด้วยอีเมลและรหัสผ่านหรือไม่ | ไม่มี ต้นแบบมีหน้านี้ แต่แอปส่ง Google อย่างเดียว |

D-2 และ D-3 อยู่ใน [[api-design-plan]] §1

## 6. สถานะ ณ วันที่สร้าง

| | ต้นแบบ | แอป |
|---|---|---|
| หน้า | 10 หน้า ใช้งานได้ครบ | 4 route — หน้าแรก · login (Google) · รออนุมัติบัญชี · รายวิชา (มีแค่หัวข้อ) |
| Endpoint | — | 3 จาก 74 และ `/health` ([CMAS-API-Endpoints.xlsx](../../../excel/api/CMAS-API-Endpoints.xlsx)) |
| ข้อมูล | 17 ตาราง | 13 ตาราง · ฐานข้อมูลจริงค้างที่ migration `0003` เพราะ `0004` มีบั๊ก |
| ความปลอดภัย | แสดงพฤติกรรมเท่านั้น | มีโครง แต่มีช่องโหว่ที่ต้องแก้ก่อน (refresh token · log PII) — [[api-design-plan]] §2 |
