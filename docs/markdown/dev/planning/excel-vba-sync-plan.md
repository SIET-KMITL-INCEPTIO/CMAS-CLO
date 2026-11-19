# แผน Excel add-in (VBA) — ซิงก์คะแนนสองทาง

See also: [[srs]] · [[api-design]] · [[code-rule]]

> **Branch:** `feature/excel-vba-sync` (ตัดจาก `develop` ที่ `16add74`, 2026-11-19) · P0–P2 อยู่ใน branch เดียวตามที่ทีมเลือก
> **ข้อกำหนด:** FR-73–FR-76 · NFR-20 ใน [[srs]] · endpoint ใน [[api-design]] §3.9a · add-in: [`app/excel-addin/`](../../../../app/excel-addin/README.md)

## 1. ข้อตัดสินใจที่ใช้

| ข้อ | ค่าที่ใช้ | เหตุผล / ผลที่ตามมา |
|---|---|---|
| ใช้ VBA | ใช่ (ทีมกำหนด) | ใช้ได้เฉพาะ Excel desktop · Excel บนเว็บใช้หน้าเว็บ CMAS หรือนำเข้าไฟล์แทน |
| ระบบปฏิบัติการ | Windows และ Mac desktop | Mac ไม่มี ActiveX และ `Scripting.Dictionary` → แยกชั้น `HttpClient` (`#If Mac`) และใช้ VBA-Dictionary |
| เซ็นโค้ด | ไม่มี certificate | แจกจากหน้า CMAS ที่ต้องล็อกอิน + SHA-256 · สคริปต์ติดตั้งลบ MOTW / quarantine · "CMAS ไม่ส่ง add-in ทางอีเมล" |
| real time | polling ทุก 10 วินาที | VBA รับ SSE ไม่ได้ · CMAS → Excel ≈ 12 วินาที · Excel → CMAS ≤ 3 วินาที |
| แยกโค้ดจากข้อมูล | `CMAS.xlam` + `.xlsx` | ไฟล์คะแนนไม่มีมาโคร จึงไม่ต้องกด Enable Content · ปฏิเสธ `.xlsm` ตอนนำเข้าได้เหมือนเดิม |
| การเข้าสู่ระบบ | device code | ไม่มีความลับให้พิมพ์หรือคัดลอก จึงไม่หลุดไปอยู่ในเซลล์ อีเมล หรือภาพหน้าจอ |

## 2. เฟส

| เฟส | งาน | สถานะ |
|---|---|---|
| **P0** spike | ซอร์ส VBA + AppleScript + สคริปต์ติดตั้ง · checklist S1–S9 | ✅ โค้ด · ⬜ **ต้องรันบน Excel จริงทั้งสองระบบ** (README ของ add-in) |
| **P1** นำเข้าแน่นขึ้น | `lib/xlsx-container.ts`: ปฏิเสธมาโคร · ZIP ที่ไม่ใช่ .xlsx · zip bomb (วัดขนาดจริงตอนแตก) | ✅ unit test 10 ข้อ |
| **P2** auth | `modules/excel/*` · migration 0011 · `excelTokenAllows` ใน access.middleware · หน้า `/excel/link` | ✅ unit test · ⬜ db/isolation test · ⬜ migration ยังไม่ apply |
| **P3** สัญญาการซิงก์ | `Score.version` · `Course.scoreRevision` · `GET …/scores/revision` · PUT รับ `expectedVersion` → 409 ทั้งชุด | ⬜ |
| **P4** add-in Windows | ดึง/ส่งคะแนน · ช่องที่ชน · ยืนยันการลบ · VBA-JSON · ข้อความไทยด้วย `ChrW` | ⬜ |
| **P5** add-in Mac | `HttpClient` ฝั่ง Mac · VBA-Dictionary · `install.sh` | ⬜ |

## 3. ข้อจำกัดของ VBA และวิธีแก้ (ที่ทำแล้วใน P0–P2)

| ข้อจำกัด | วิธีแก้ | ที่ไหน |
|---|---|---|
| token ในไฟล์หลุดไปกับไฟล์ | token อยู่ในตัวแปรของโมดูลเท่านั้น · ปิด Excel = หาย | `modCmasAuth.bas` |
| token สิทธิ์กว้างเกิน | 1 รายวิชา · `course.view` + `score.edit` · 8 ชม. · route อื่น 404 · ตัดได้จากเว็บ | `excelTokenAllows` · `ExcelLink` |
| token ใช้สร้าง token ใหม่ | `POST /courses/:courseId/excel-links` ตั้ง `webSessionOnly` · route `"authenticated"` (links) ก็ปฏิเสธ token ของ add-in | `access.middleware.ts` · `excel-token-access.test.ts` |
| ผู้สอนถูกถอดหรือถูกระงับ | ทุก request ยังอ่านแถว User สด และ `authorize()` ตรวจรายวิชาซ้ำ | `auth.middleware.ts` |
| เดารหัส 8 ตัว | 32⁸ รหัส · 10 ครั้ง/15 นาทีต่อ IP · อายุ 10 นาที · ใช้ครั้งเดียว | `excel.route.ts` |
| Mac: token โผล่ใน `ps` | AppleScript เขียน curl config ใน `~/Library/Caches/CMAS` (700/600) แล้วลบ | `CMAS.applescript` |
| ข้อความจากเซิร์ฟเวอร์กลายเป็นสูตร | `NumberFormat = "@"` ก่อนเขียนทุกครั้ง | `WriteText` |
| ภาษาไทยในซอร์ส VBA เพี้ยนข้าม locale | ซอร์ส ASCII เท่านั้น · P4 ใช้ `ChrW` | README ของ add-in |
| `.bas`/`.cls` แบบ LF import ไม่ได้ | `.gitattributes`: `eol=crlf` | `.gitattributes` |

## 4. ยังไม่ได้ยืนยัน (ต้องตอบใน P0)

- โฟลเดอร์ AddIns ของผู้ใช้ทั้งสองระบบเปิดมาโครได้โดยไม่ถามซ้ำหลังลบ MOTW / quarantine หรือไม่ (S1, S2)
- path โฟลเดอร์ add-in ของ Office บน Mac ใน `install.sh` ตรงกับเวอร์ชันที่ใช้หรือไม่
- `AppleScriptTask` + `curl` ทำงานใน sandbox และ token ไม่โผล่ใน `ps` (S8)

## 5. งานที่ต้องทำก่อน merge

1. apply migration 0011 กับฐานข้อมูลทดสอบ (`npm run db:migrate:dev` บน DB ที่ทิ้งได้) แล้วรัน `npm run test:db`
2. เพิ่ม test `*.db.test.ts` ของ `modules/excel` และแถวใน `course-scope.isolation.test.ts` (S-8): token วิชา A → วิชา B = 404
3. เพิ่มหน้า "เชื่อมต่อ Excel" ในต้นแบบ `index-q.html` (ต้นแบบนำหน้าแอป)
4. เพิ่ม ST-XL-01…05 ใน system-test-plan
