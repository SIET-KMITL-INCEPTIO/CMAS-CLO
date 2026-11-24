# แผน Excel add-in (VBA) — ซิงก์คะแนนสองทาง

See also: [[srs]] · [[api-design]] · [[code-rule]]

> **Branch:** `feature/excel-vba-sync` (ตัดจาก `develop` ที่ `16add74`, 2026-11-19) · P0–P5 อยู่ใน branch เดียวตามที่ทีมเลือก (PR #93)
> **ข้อกำหนด:** FR-73–FR-76 · NFR-20 ใน [[srs]] · endpoint ใน [[api-design]] §3.9a · add-in: [`app/excel-addin/`](../../../../app/excel-addin/README.md)

## 1. ข้อตัดสินใจที่ใช้

| ข้อ | ค่าที่ใช้ | เหตุผล / ผลที่ตามมา |
|---|---|---|
| ใช้ VBA | ใช่ (ทีมกำหนด) | ใช้ได้เฉพาะ Excel desktop · Excel บนเว็บใช้หน้าเว็บ CMAS หรือนำเข้าไฟล์แทน |
| ระบบปฏิบัติการ | Windows และ Mac desktop | Mac ไม่มี ActiveX และ `Scripting.Dictionary` → แยกชั้น HTTP (`#If Mac`) · เขียน `clsCmasMap` + `modCmasJson` เองแทน VBA-JSON/VBA-Dictionary (ไม่ต้องนำโค้ดภายนอกเข้ามา) |
| ตรวจชนกัน | ใช้ `from` ของ PUT ที่มีอยู่ (D-3) | ไม่ต้องเพิ่ม `Score.version`: PUT ตอบ 409 ทั้งชุดเมื่อค่าในฐานข้อมูลไม่ตรงกับ `from` อยู่แล้ว (ค่าเดิมซ้ำแบบ A→B→A ถือว่าไม่ชน ซึ่งปลอดภัยเพราะค่าเท่ากัน) |
| ตรวจการเปลี่ยนแปลง | `Course.revision` | ขยับที่ `publishCourseChange` จุดเดียว ซึ่งทุกการเขียนที่สำเร็จผ่านอยู่แล้ว · ไม่ต้องตามแก้ทุก service |
| เซ็นโค้ด | ไม่มี certificate | แจกจากหน้า CMAS ที่ต้องล็อกอิน + SHA-256 · สคริปต์ติดตั้งลบ MOTW / quarantine · "CMAS ไม่ส่ง add-in ทางอีเมล" |
| real time | polling ทุก 3 วินาทีขณะใช้งาน (2 นาทีหลังมีการแก้ฝั่งใดฝั่งหนึ่ง) · ทุก 10 วินาทีเมื่อว่าง (ปรับ 21 พ.ย. 2569 จากเดิมทุก 10 วินาที) | VBA รับ SSE ไม่ได้ และคำขอแต่ละครั้งทำให้ Excel ค้างชั่วครู่ จึงไม่ถามถี่ตลอดเวลา · CMAS → Excel ≈ 4 วินาทีขณะใช้งาน, ≈ 12 วินาทีเมื่อว่าง · Excel → CMAS ≤ 2 วินาที · คำขอที่มีโทเคน Excel นับ rate limit แยกจากหน้าเว็บ (ต่อ IP, `RATE_LIMIT_EXCEL_MAX` 1200/นาที) ไม่งั้นหลายเครื่องหลัง NAT เดียวจะกินโควตา 100/นาทีของหน้าเว็บ · หลัง reverse proxy ต้องตั้ง `TRUST_PROXY` · PUT คะแนนตอบเลข revision ของการเขียนนั้น Excel จึงไม่โหลดตารางซ้ำหลังเขียนเอง |
| แยกโค้ดจากข้อมูล | `CMAS.xlam` + `.xlsx` | ไฟล์คะแนนไม่มีมาโคร จึงไม่ต้องกด Enable Content · ปฏิเสธ `.xlsm` ตอนนำเข้าได้เหมือนเดิม |
| การเข้าสู่ระบบ | device code | ไม่มีความลับให้พิมพ์หรือคัดลอก จึงไม่หลุดไปอยู่ในเซลล์ อีเมล หรือภาพหน้าจอ |

## 2. เฟส

| เฟส | งาน | สถานะ |
|---|---|---|
| **P0** spike | ซอร์ส VBA + AppleScript + สคริปต์ติดตั้ง (`spike/`) | ✅ โค้ด · checklist ย้ายไปรวมใน S1–S16 ของ README add-in |
| **P1** นำเข้าแน่นขึ้น | `lib/xlsx-container.ts`: ปฏิเสธมาโคร · ZIP ที่ไม่ใช่ .xlsx · zip bomb (วัดขนาดจริงตอนแตก) | ✅ unit test 18 ข้อ |
| **P2** auth | `modules/excel/*` · migration 0011 · `excelTokenAllows` · หน้า `/excel/link` | ✅ unit test · ✅ migration ผ่าน CI · ⬜ เทสต์ DB ใหม่ (`excel.db.test.ts`, isolation) ยังไม่เคยรัน |
| **P3** สัญญาการซิงก์ | migration 0012: `Course.revision` + `ScoreChangeSource.EXCEL` · `GET /courses/:courseId/revision` · ขยับเลขใน `publishCourseChange` · PUT จาก token ติดป้าย `EXCEL` เอง | ✅ unit test · ⬜ เทสต์ DB ยังไม่เคยรัน |
| **P4** add-in (Windows) | `modCmasSync`: ชีตรายวิชา · ดึงทุก 3 วิขณะใช้งาน / 10 วิเมื่อว่าง · ส่ง 1 วิหลังแก้ · ช่องแดงเมื่อชน · ยืนยันการลบ · ช่องเทาแก้ไม่ได้ · แก้ตอนออฟไลน์แล้วส่งภายหลัง · ribbon · ข้อความไทยจาก `text/th.json` | ✅ เขียนแล้ว · ✅ `build-excel-addin.py check` (CI) · ⬜ **ยังไม่เคยคอมไพล์หรือรันใน Excel** |
| **P5** add-in (Mac) | โค้ดชุดเดียวกับ P4 (ไม่มี ActiveX ไม่มี Dictionary) · HTTP ผ่าน `CMAS.applescript` · `install.sh` | ✅ เขียนแล้ว · ⬜ **ยังไม่เคยรันบน Mac** |

## 3. ข้อจำกัดของ VBA และวิธีแก้ (ที่ทำแล้วใน P0–P5)

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
| `.bas`/`.cls` แบบ LF import ไม่ได้ | `.gitattributes`: `eol=crlf` · `build-excel-addin.py check` ตรวจซ้ำใน CI | `.gitattributes` |
| ไม่มีอะไรคอมไพล์ VBA นอก Excel | `build-excel-addin.py check`: ASCII · CRLF · ชื่อโมดูล · procedure ปิดครบ · ห้าม `Scripting.Dictionary` / `Shell` / ปิดตรวจใบรับรอง · โมดูลข้อความตรงกับ `th.json` | CI ขั้น "Excel add-in sources" |
| ribbon ต้องอยู่ใน ZIP ของ `.xlam` | `build-excel-addin.py package` ใส่ `customUI14.xml` ให้ แล้วพิมพ์ SHA-256 | `ribbon/customUI14.xml` |
| validation ของ Excel ใช้สูตรอ้างช่องที่ active อยู่ (กับดัก) และไม่ตรวจตอนวาง | ตรวจค่าในโค้ดทุกครั้งที่เซลล์เปลี่ยน · ค่าผิดคืนค่าเดิม | `OnSheetChange` |
| แถวถูกเรียงใหม่หรือแทรก = จับคู่นักศึกษาผิดแถว | ป้องกันชีต (ไม่ใช่ความปลอดภัย) ห้ามเรียงและแทรกแถว · id อยู่ในชีตซ่อน `_cmas` | `Protect` |
| add-in เวอร์ชันในเครื่องไม่ตรงกับที่ประกาศ | เทสต์ฝั่งเซิร์ฟเวอร์เทียบ `modCmasInfo.bas` กับ `addin-release.ts` | `addin-release.test.ts` |

## 4. ยังไม่ได้ยืนยัน (ต้องตอบด้วย checklist S1–S16 ใน README ของ add-in)

- โค้ด VBA ทั้งหมด **ยังไม่เคยคอมไพล์** (Debug → Compile) และยังไม่เคยรันใน Excel ทั้งสองระบบ
- โฟลเดอร์ AddIns ของผู้ใช้ทั้งสองระบบเปิดมาโครได้โดยไม่ถามซ้ำหลังลบ MOTW / quarantine หรือไม่ (S1, S2)
- path โฟลเดอร์ add-in ของ Office บน Mac ใน `install.sh` ตรงกับเวอร์ชันที่ใช้หรือไม่
- `AppleScriptTask` + `curl` ทำงานใน sandbox และ token ไม่โผล่ใน `ps` (S15)
- `imageMso` ของปุ่มใน ribbon (`HyperlinkInsert`, `Cancel`, `Refresh`) แสดงบนทั้งสองระบบหรือไม่

## 5. งานที่ต้องทำก่อน merge

1. ✅ ~~เขียน `excel.db.test.ts` และแถว isolation~~ — เขียนแล้ว **รอรันใน CI** (เครื่องพัฒนาไม่มี Postgres)
2. ✅ ~~ST-XL ใน system-test-plan~~ — ST-XL-01…06
3. build `CMAS.xlam` ใน Excel แล้วทำ checklist S1–S16 บน Windows และ Mac
4. เพิ่มหน้า "เชื่อมต่อ Excel" ในต้นแบบ `index-q.html` และสองตาราง + `Course.revision` ใน `index-q.sql` (ต้นแบบนำหน้าแอป)

## 6. นอกขอบเขต (ตั้งใจไม่ทำ)

- Excel บนเว็บ (รัน VBA ไม่ได้) · ปุ่มนี้ใช้หน้าเว็บ CMAS หรือนำเข้าไฟล์แทน
- add-in ตัด token ของตัวเองที่เซิร์ฟเวอร์ตอนกด "ตัดการเชื่อมต่อ" — ตอนนี้แค่ลืม token ในเครื่อง token หมดอายุเองใน 8 ชั่วโมง หรือตัดได้จาก `/excel/link`
- token ที่อ่านได้แคบกว่า `course.view` (เช่น เฉพาะคะแนน) — ต้องเพิ่ม capability ใหม่ในต้นแบบก่อน
