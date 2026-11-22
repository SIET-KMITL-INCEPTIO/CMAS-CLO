# แผน Refactor และ Clean Code

See also: [[code-rule]] · [[dev]] · [[ci-cd-plan]] · [[system-test-plan]]

> **สร้าง:** 2026-11-22 · **สถานะ:** P0 เสร็จ (PR #100) · P1 และ P2 เสร็จ (PR #101) · P3 เสร็จ (PR #102) · P4 และ P5 ทำรวมใน branch `refactor/parity-and-ratchet`
> **ตรวจกับ:** `develop` ที่ `1eb52a9` (สแกนด้วย grep/wc ณ วันที่สร้าง)

---

## 0. สรุปสั้น

โค้ด**สะอาดอยู่แล้วในภาพรวม**: ไม่มี `any`, `@ts-ignore`, `eslint-disable`, TODO หรือ FIXME ใน `app/`
และทุก service เรียก repository (ข้อยกเว้นเดิมของ `authorization.service.ts` ปิดแล้วใน P3)
งานนี้จึงเป็นการแก้เฉพาะจุด ไม่ใช่เขียนใหม่ และ**ห้ามเปลี่ยนพฤติกรรม**ของระบบในทุกเฟส

ทุกเฟสคือหนึ่ง branch `refactor/*` ตัดจาก `develop` และ merge กลับเข้า `develop` (git-rule)

## 1. สิ่งที่พบ (วัดแล้ว)

| # | ปัญหา | ที่ไหน |
|---|---|---|
| A | logic เดียวกันเขียนสองที่ (client/server) และเริ่มต่างกันแล้ว (`GradeMethod` กับ `GradingMethod`) | `defaultBands` · `groupKey` · `near` · `termTh` · `sameValue` |
| B | service 8 จาก 14 ตัวไม่มี test | `activities` · `clos` · `courses` · `dashboard` · `grading` · `scores` · `students` · `session` |
| C | หน้าที่เป็น component ใหญ่ก้อนเดียว | `Grading.page.tsx` (494 บรรทัด) · `CourseOverview.page.tsx` (466) · `ActivityForm.tsx` (464) · `CourseList.page.tsx` (443) · `Activities.page.tsx` (437) |
| D | เรียก API นอก `useXxx.ts` ผิดสัญญาของ feature | `CopyLevel.tsx` · `ChangesDrawer.tsx` · `ImportExcel.tsx` |
| E | module หนึ่งใช้ repository ของอีก module | `grading` → `dashboard/course-data.repository` · `scores` → `excel/course-revision.repository` |
| F | จุดเล็ก | `authorization.service.ts` เรียก `prisma` ตรง · `email-link.service.ts` ใช้ `console.error` · ฟังก์ชัน `when` ซ้ำสองที่ · inline `style={{}}` ใน 3 หน้า |
| G | เกณฑ์ coverage ต่ำ และไม่มีอะไรกันไฟล์โตขึ้น | client lines 10% · server 35% · ไม่มีกฎ `max-lines` / `complexity` |

## 2. เฟส

| เฟส | Branch | งาน | เสร็จเมื่อ |
|---|---|---|---|
| **P0** ตาข่ายนิรภัย | `refactor/characterization-tests` | test ที่จับพฤติกรรมปัจจุบันของ service ที่ไม่มี test เริ่มจาก `dashboard` · `scores` · `courses` (ไฟล์ที่ P3 จะแตะ) | test ผ่าน · แต่ละ test เคยถูกทำให้ fail อย่างน้อยหนึ่งครั้ง · เกณฑ์ coverage server ขึ้นตามค่าที่วัดได้ |
| **P1** สัญญาฝั่ง client | `refactor/client-hooks` | ย้าย query ในข้อ D ไป `useXxx.ts` · ย้าย `when` ไป `lib/` · เปลี่ยน `console.error` เป็น logger ของ Fastify | verify ผ่าน |
| **P2** แยกหน้าใหญ่ | `refactor/split-pages` | แยกไฟล์ในข้อ C เป็น component ย่อยในโฟลเดอร์ feature เดิม · ย้าย tone จาก inline style ไป theme token | Playwright smoke ผ่าน · dark mode ไม่เพี้ยน · ไม่มีไฟล์เกิน ~250 บรรทัด |
| **P3** ขอบเขตฝั่ง server | `refactor/server-boundaries` | ให้ `authorization.service.ts` มี repository · ย้าย repository ที่ใช้ร่วม (`course-data`, `course-revision`) ไปที่กลาง · แยก `dashboard.service.ts` ตาม read model | test ของ P0 ยังผ่านโดยไม่แก้ |
| **P4** ความตรงกัน client/server | `refactor/shared-domain-logic` | เก็บสองสำเนาไว้ แต่เพิ่ม parity test ที่ป้อน input ชุดเดียวกันให้ทั้งสองฝั่ง (แบบเดียวกับ `capabilities.ts`) | parity test ผ่านและจับความต่างได้ |
| **P5** ล็อกผลไว้ | `refactor/lint-ratchet` | เพิ่มคำเตือน `max-lines` / `complexity` ใน ESLint ทั้งสองฝั่งตามค่าหลัง P2 · ขึ้นเกณฑ์ coverage อีกรอบ | CI บังคับใช้ |

**ลำดับ:** P0 ต้องมาก่อน P3 (P3 อาศัย test ของ P0) · P1, P2, P4 ไม่แตะไฟล์ของกันและกัน ทำขนานได้หลัง P0

**ทำไม P4 ไม่ทำ `packages/shared`:** มีแค่ 5 ฟังก์ชันเล็ก ส่วน workspace ใหม่เพิ่มภาระ build ระหว่าง NodeNext ESM กับ Vite
ทางเลือกนี้จะเปลี่ยนถ้าจำนวน logic ที่ใช้ร่วมโตเกินราว 10 ฟังก์ชัน

## 3. นอกขอบเขต

`docs/` · template `.xlsm` · สคริปต์ Python ใน `scripts/`

## 4. บันทึกการทำงาน

| วันที่ | เฟส | สิ่งที่ทำ |
|---|---|---|
| 2026-11-22 | P0 | สร้าง branch และแผนนี้ |
| 2026-11-22 | P0 | test ของ `dashboard` (18) · `scores` (16) · `courses` (23) แต่ละไฟล์ fail เมื่อใส่ bug ทดลองหนึ่งจุด · unit coverage server จาก 45.3 / 86.8 / 33.7 เป็น 59.0 / 88.7 / 43.4 (lines / branches / functions) |
| 2026-11-22 | P0 เสร็จ | เพิ่ม test ของ `grading` (28) · `students` (18) · `activities` (26) · `clos` (19) · `session` (24) ทดลองใส่ bug ทีละ service แล้ว fail ทุกตัว · ทั้ง 8 service ครอบคลุม 98–100% ของบรรทัด · unit coverage server 69.5 / 91.1 / 54.2 · เกณฑ์ขึ้นเป็น 68 / 90 / 53 |
| 2026-11-22 | P0 พบ | `reorder` ของ `clos` และ `activities` ตรวจแค่จำนวนและสมาชิก ไม่ตรวจว่าซ้ำ → ส่ง `["c1","c1"]` ผ่านเมื่อวิชามี 2 CLO · ยังไม่แก้ (P0 ห้ามเปลี่ยนพฤติกรรม) · มี test แบบ `it.fails` ล็อกไว้ ถอด `.fails` ตอนแก้ |
| 2026-11-22 | P1 | ย้าย query ของ `CopyLevel` · `ChangesDrawer` · `ImportExcel` เข้า `useCopyLevelPreview` · `useScoreChanges` · `useImportPreview` · ส่ง `app.log` ให้ `EmailLinkService` แทน `console.error` (เหลือ console เป็น fallback ตอนสร้างโดยไม่มี logger) |
| 2026-11-22 | P1 แก้แผน | `when` ใน `ExcelLink` กับ `UserDrawer` **ไม่ใช่ฟังก์ชันซ้ำ**: ตัวหนึ่งจัดวันที่แบบไทยและคืน "ยังไม่ได้ใช้" เมื่อ null อีกตัวตัด ISO string — รวมกันจะเปลี่ยนสิ่งที่เห็นบนจอ จึงไม่รวม |
| 2026-11-22 | P2 | แยก `Grading.page` (494→204) · `CourseOverview.page` (466→128) · `CourseList.page` (443→225) · `Activities.page` (437→236) · `ActivityForm` (464→386) เป็น component ย่อยในโฟลเดอร์ feature เดิม · ย้ายตรรกะบริสุทธิ์ออกมาเขียน test: `gradingView` · `overviewView` · `activityValidation` · `coursePrefs` · `courseListParts` · ใส่ test render ให้ component ที่แยก แล้วทดลองทำพังทีละตัวเพื่อดูว่า fail · client 82→174 test · เกณฑ์ coverage client ขึ้นเป็น 21 / 80 / 39 |
| 2026-11-22 | P2 แก้แผน | "inline style tone" ไม่ใช่ปัญหา: `TONE` เป็น CSS variable อยู่แล้ว (PR #97) จึงไม่แตะ · `ActivityForm` ยังเกิน 250 บรรทัด (386) เพราะส่วนใหญ่เป็น markup ของช่องกรอก ไม่แยกต่อ · ยังไม่ได้เปิดหน้าจริงในเบราว์เซอร์ (ต้องล็อกอินกับฐานข้อมูล) จึงยืนยันด้วย test render แทน |
| 2026-11-22 | P3 | `authorization.service.ts` ไม่เรียก `prisma` แล้ว: ย้ายเป็น `course-access.repository.ts` (+ test 8 ข้อ ทดลองทำพังแล้ว fail) · ย้าย `course-data` และ `course-revision` ไป `src/repositories/` · แยก Excel export ออกจาก `dashboard.service.ts` (523→305) ไปเป็น `dashboard-export.service.ts` (230) + `dashboard-format.ts` · test เดิมของ P0 ผ่านครบ มีแก้เฉพาะ path ของ import และย้าย test ของ export ไปไฟล์ใหม่พร้อม fixture ร่วม · เติมการยืนยันข้อความสถานะใน export รายบุคคล (ทดลองเปลี่ยนคำแล้ว test เดิมไม่จับ) |
| 2026-11-22 | P4 | เพิ่ม `app/client/src/lib/domain-parity.test.ts` (16 ข้อ) import ไฟล์ฝั่ง server ตรง ๆ (`grade-ladder` · `weights` · `study-plan` ไม่มี import ของตัวเอง) แล้วป้อน input ชุดเดียวกันให้ `defaultBands` · `groupKey` · `near` · `termTh` · ตรวจตอน compile ว่า `GradeScale` / `GradeMethod` ของ client ตรงกับ `GradeScale` / `GradingMethod` ของ server · ย้าย `termTh` ของ client จาก `CopyLevel.tsx` ไป `courseView.ts` และ export `near` จาก `setupSteps.ts` เพื่อให้ test เรียกได้ · ทดลองทำพัง 6 แบบ (ทั้งสองฝั่ง) ถูกจับครบ |
| 2026-11-22 | P4 แก้แผน | `sameValue` ไม่ใช่สำเนา: client เทียบค่าในช่องตาราง (`number` / `"EXCUSED"` / `null`) ส่วน server เทียบ object ของคะแนนพร้อมเหตุผลการยกเว้น จึงไม่ใส่ใน parity test · ชื่อ type ยังต่างกัน (`GradeMethod` กับ `GradingMethod`) แต่ test บังคับให้ค่าตรงกัน จึงไม่เปลี่ยนชื่อ |
| 2026-11-22 | P5 | ESLint ทั้งสองฝั่งมีกฎ `max-lines` และ `complexity` ระดับ error (CI จึงบังคับ) ตั้งที่เพดานของวันนี้: client 390 บรรทัด / 35 (ไฟล์ใหญ่สุด `ActivityForm.tsx` 386 · `CourseOverview.page.tsx` 35) · server 410 / 34 (`lib/attainment.ts` 406 · 34) · ยกเว้นไฟล์ test · ลองลดเกณฑ์แล้วกฎแจ้งจริง · ขึ้นเกณฑ์ coverage client เป็น 22 / 81 / 40 และ server เป็น 70 / 91 / 54 (lines / branches / functions) |
| 2026-11-22 | P5 แก้แผน | เป้า "ไม่มีไฟล์เกิน ~250 บรรทัด" ยังไม่ถึง: client มี 8 ไฟล์ และ server มี 8 ไฟล์ที่เกิน 280 · ตั้งกฎเป็น ratchet ที่เพดานปัจจุบันแทนการบังคับ 250 ซึ่งจะทำให้ CI แดงทันที · ลดเกณฑ์ลงเมื่อแยกไฟล์เหล่านั้น |
