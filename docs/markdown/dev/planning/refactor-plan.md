# แผน Refactor และ Clean Code

See also: [[code-rule]] · [[dev]] · [[ci-cd-plan]] · [[system-test-plan]]

> **สร้าง:** 2026-11-22 · **สถานะ:** P0 กำลังทำบน branch `refactor/characterization-tests`
> **ตรวจกับ:** `develop` ที่ `1eb52a9` (สแกนด้วย grep/wc ณ วันที่สร้าง)

---

## 0. สรุปสั้น

โค้ด**สะอาดอยู่แล้วในภาพรวม**: ไม่มี `any`, `@ts-ignore`, `eslint-disable`, TODO หรือ FIXME ใน `app/`
และทุก service เรียก repository ยกเว้น `authorization.service.ts` ที่ CLAUDE.md บันทึกไว้แล้ว
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
| 2026-11-22 | P0 | test ของ `dashboard` (18) · `scores` (16) · `courses` (23) แต่ละไฟล์ fail เมื่อใส่ bug ทดลองหนึ่งจุด · unit coverage server จาก 45.3 / 86.8 / 33.7 เป็น 59.0 / 88.7 / 43.4 (lines / branches / functions) · เกณฑ์ขึ้นเป็น 58 / 88 / 42 · ที่เหลือของ P0: `activities` · `clos` · `grading` · `students` · `session` |
