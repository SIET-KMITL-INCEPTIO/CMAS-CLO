# diagrams/ — ไฟล์ทางการ หนึ่งไฟล์ต่อหนึ่งเรื่อง

> **ตรวจล่าสุด:** 2026-11-09 · `python scripts/check-diagrams.py` · เทียบกับ `docs/index-q/index-q.html`, `database/schema.prisma` และ `package.json` ของ `app/`
> เปิดไฟล์ `.drawio` ด้วย [draw.io desktop](https://www.drawio.com/) หรือส่วนขยาย Draw.io Integration ใน VS Code

## ฉบับทางการ — ใช้ไฟล์ในตารางนี้เท่านั้นเวลานำเสนอหรือใส่รายงาน

| เรื่อง | ไฟล์ทางการ | หน้า | ตรวจแล้วว่า |
|---|---|---|---|
| **DFD** ระดับ 0, 1, 2 | [`dfd/DFD-INDEX-Q.drawio`](dfd/DFD-INDEX-Q.drawio) (v1.4 · เพิ่ม `RefreshToken` ใน D1 เมื่อ 2026-11-10 โดยไม่เปลี่ยนโครงสร้าง) | ระดับ 0 · ระดับ 1 (6 process, 6 data store, 44 flow) · ระดับ 2 ของงาน 4.0 และ 6.0 | ผ่านกฎ R1–R9 ของสคริปต์ (เส้นไม่ตัดกัน, คำขอและคำตอบเป็นคู่, process ไม่ส่งข้อมูลหา process โดยตรง, ระดับ 1 กับ 2 สมดุล, ครอบคลุมทุกตาราง) |
| **ER diagram** | [`er/ER-INDEX-Q.drawio`](er/ER-INDEX-Q.drawio) · Workbench: [`../reference/db/mysql/index-q-v2.mwb`](../reference/db/mysql/index-q-v2.mwb) | 19 ตาราง = ตรงกับ `schema.prisma` หลัง migration 0008 ทุกตารางทุกคอลัมน์ (ไม่มีส่วนที่ต้นแบบเสนอเพิ่มเหลืออยู่) · 27 ความสัมพันธ์ · คอลัมน์รหัสผ่านของ `User` ยังอยู่เพราะ schema ยังมี ระบุไว้ใน COMMENT ว่าตัดจากการออกแบบแล้ว | ER-2 ของ `check-diagrams.py` ตรวจว่า `index-q.sql` = `schema.prisma` · โมเดล Workbench นับตารางตรงกับ SQL |
| **Threat model** | [`threat-model/report.htm`](threat-model/report.htm) (แก้ที่ [`threat-model.tm7`](threat-model/threat-model.tm7) ด้วย Microsoft Threat Modeling Tool แล้วสร้างรายงานใหม่) | 4 หน้า: `Layer0` · `Layer1` · `Layer2-P4` · `Layer2-P6` · **695 threat** (Layer0 17 · Layer1 356 · P4 134 · P6 188 โดย Layer1 ได้จากการลบ) | ป้ายตรง DFD v1.4 (ตรวจ 2026-10-20): P4 16 จาก 16, P6 19 จาก 22, Layer1 39 จาก 44 และ Layer0 3 จาก 6 · ที่ไม่ตรงต่างแค่ถ้อยคำ ยกเว้นเส้น 6.0/6.1 ↔ D5 ที่ยังไม่มีคำว่า แผนพัฒนาผู้เรียน · มี trust boundary ทุกหน้า รายงานมีครบทั้ง 6 หมวด STRIDE · **ยังไม่ได้ประเมินสถานะ:** ทั้ง 695 ข้อเป็น Not Started และ High (ค่าเริ่มต้นของเครื่องมือ) ห้ามอ้างว่าได้ป้องกันแล้วจนกว่าจะกรอก ([#18](https://github.com/SIET-KMITL-INCEPTIO/CMAS-CLO/issues/18)) |
| **Use case** | [`usecase/index-q-usecase.drawio`](usecase/index-q-usecase.drawio) | ภาพรวม · ผู้ดูแลระบบ · ผู้สอน · รายการ use case (UML 2.5) | สร้างใหม่แล้วตรง · สิทธิ์อ่านจาก `PERM` ในต้นแบบ |
| **Flowchart ฟีเจอร์** | [`flowchart/CMAS-Flowcharts_Handwritten.drawio`](flowchart/CMAS-Flowcharts_Handwritten.drawio) | สารบัญ + 1 flow ต่อ 1 use case (1.1–9.3) · 48 flow | ครอบคลุม use case 48 จาก 49 ข้อใน `index-q-usecase.drawio` (ยังไม่มี flow ของ 1.6 อนุมัติบัญชีที่รออนุมัติ) · เลขเลื่อนเมื่อ 2026-11-10 หลังตัดรหัสผ่าน: ตัด 1.5 รีเซ็ตรหัสผ่าน · 9.2 เปลี่ยนรหัสผ่าน · 9.4 ยืนยันอีเมล · 9.2 ใหม่ = ลงทะเบียนด้วยลิงก์อีเมล · 9.3 = Google รวม 5.7 บันทึกแผนพัฒนาผู้เรียน · เพิ่ม 2.9 ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่ (2569-11-07): ขั้นตอนคัดลอกทีละตาราง (CLO · วัตถุประสงค์ · กิจกรรม · เกณฑ์) สิ่งที่ไม่คัดลอก (นักศึกษา · คะแนน · เกรด) และ edge case · ปรับตามต้นแบบ 2569-10-19: 4.2 (อื่น ๆ / กำหนดเอง · วิธีประเมินอัตโนมัติ · สัดส่วนรวมไม่เกิน 100%) · 5.4 (ป้ายใหม่ · ช่องแผนพัฒนา) · 8.1 (เกณฑ์ผ่านจากขั้นบันไดเกรด) |
| **Flowchart ยกโครงทั้งชั้นปี (UC 2.9)** | [`flowchart/CMAS-Flowchart-CopyYearLevel.drawio`](flowchart/CMAS-Flowchart-CopyYearLevel.drawio) · **สร้างจากสคริปต์** `python scripts/build-copy-year-flowchart-drawio.py` | 4 หน้า: **0 ภาพรวม** · **1 ขั้นตอนหลัก** (swimlane ผู้ใช้/ระบบ/ข้อมูล · S1–S15, D1–D2, F1–F4, K1) · **2 คัดลอกโครงรายวิชา** (T1–T8 ทีละตาราง) · **3 Edge case** (E01–E23 พร้อมสถานะ) | สคริปต์ตรวจเอง: เส้นทุกเส้นชี้โหนดที่มีจริง · โหนดไม่โดดเดี่ยว · ทุก edge case อ้างขั้น S#/T#/D# ที่มีจริง · ทุกเงื่อนไขมี edge case รองรับ · ต้นแบบต้องมีฟังก์ชันที่ไดอะแกรมอ้างถึง · ทำแล้ว 18 จาก 23 กรณี |
| **Flowchart เข้าสู่ระบบ 2 ทางเลือก (Google · ลิงก์อีเมล)** | [`flowchart/CMAS-Flowchart-AuthMethods.drawio`](flowchart/CMAS-Flowchart-AuthMethods.drawio) · **สร้างจากสคริปต์** `python scripts/build-auth-methods-flowchart-drawio.py` | 3 หน้า: **0 ภาพรวม** (2 ทาง + กฎร่วม FR-08) · **1 ผังลำดับงาน** (A เลือกทาง · G Google · M ลิงก์อีเมล · C กฎร่วม · D1–D2 · F1–F3) · **2 คำถามที่ต้องตัดสิน** (Q1–Q8: มติแล้ว 5 · ยังต้องตัดสิน 3) | ไม่มีรหัสผ่านในระบบ (SRS v2.5.0 · 2026-11-10) · ต้นแบบทำครบทั้งสองทาง · สคริปต์ตรวจเอง: เส้นชี้โหนดที่มีจริง · ไม่มีโหนดโดดเดี่ยว · ทุกเงื่อนไขมีทางออก ≥ 2 · ทุกคำถามอ้างโหนดที่มีจริง |
| **Flowchart tech stack / สถาปัตยกรรม** | [`architecture/CMAS-Architecture_Handwritten.drawio`](architecture/CMAS-Architecture_Handwritten.drawio) | หน้า **0 · Stack + Flow** (ขั้น ①–⑩) · หน้า **7 · Tool-level flow** | รุ่น library ตรงกับ `package.json` (React 19, Vite 7, Tailwind v4, Fastify 5, Zod 4, Prisma 6) · อายุ token ตรงกับ `env.schema.ts` · trigger 3 ตัว |

ภาพรวมว่าไดอะแกรมแต่ละตัวสกัดอะไรจากต้นแบบ: [`index-q-architecture.md`](index-q-architecture.md)

## ไฟล์ประกอบ — ไม่ใช่ฉบับทางการ

| ไฟล์ | คืออะไร |
|---|---|
| `usecase/UML-INDEX-Q.drawio` | **ไม่ได้ commit** · สร้างได้ด้วย `python scripts/build-index-q-uml-drawio.py` (ข้อมูลชุดเดียวกับ use case ทางการ ย่อเหลือหน้าเดียวสำหรับสไลด์) |
| `architecture/Structure.drawio` | วาดมือหน้าเดียว · โครงสร้างผู้สอนแบบบทบาทเดียว |
| `../reference/db/mysql/index-q-v2.mwb` · `index-q-er-diagram.pdf` | ER แบบ MySQL Workbench 19 ตาราง · โมเดลสร้างจาก `index-q.sql` ด้วย `python scripts/build-index-q-workbench.py` · PDF export ด้วยมือ: File → Export → Export as Single Page PDF |
| `../reference/db/mysql/cmas_app_v4*` | ER รุ่น v4 (migration 0004) จาก Workbench · ค้างไว้ตามเดิม |

ไฟล์ที่ทีมวาดเองทุกไฟล์เก็บไว้ครบ ไม่ได้ลบ ส่วนไฟล์ที่สคริปต์สร้างเก็บเฉพาะรุ่นล่าสุด (2026-10-14 ลบหน้า 2–3 ของ `Structure.drawio` ที่ยังวาดบทบาท 3 แบบ และ Excel 2 ไฟล์ที่ค้างที่ v4 ออก ดู [`VERSIONS.md`](../VERSIONS.md) §3.2)

## กติกาเวลาแก้

1. **ไฟล์ที่ชื่อไม่ลงท้าย `_Handwritten`** (DFD, ER, use case) สคริปต์ใน `scripts/` เป็นตัวสร้าง ห้ามแก้ใน draw.io ให้แก้ต้นแบบหรือสคริปต์ แล้วรัน `python scripts/build-<ชื่อ>.py` ใหม่ ไม่อย่างนั้นสิ่งที่แก้จะหายตอนสร้างใหม่
2. เปิดไฟล์เหล่านั้นใน draw.io แล้วกดบันทึกได้ `check-diagrams.py` เทียบตามเนื้อหา ไม่ใช่ไบต์
3. **ไฟล์ `_Handwritten`** แก้ใน draw.io ได้เลย แต่ต้องเทียบกับต้นแบบเอง
4. **ก่อน pull ให้ปิดแท็บ draw.io ทุกแท็บ** แท็บรุ่นเก่าที่กดบันทึกจะทับไฟล์ใหม่ (เคยทำ DFD หายมาแล้วหนึ่งครั้ง)
5. ส่งออกรูปสำหรับรายงาน: draw.io → File → Export as → PNG (ติ๊ก *All pages*) หรือ PDF
