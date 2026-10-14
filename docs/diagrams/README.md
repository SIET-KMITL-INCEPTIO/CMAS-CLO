# diagrams/ — ไฟล์ทางการ หนึ่งไฟล์ต่อหนึ่งเรื่อง

> **ตรวจล่าสุด:** 2026-10-14 · `python scripts/check-diagrams.py` · เทียบกับ `docs/pages/index-q.html`, `database/schema.prisma` และ `package.json` ของ `app/`
> เปิดไฟล์ `.drawio` ด้วย [draw.io desktop](https://www.drawio.com/) หรือส่วนขยาย Draw.io Integration ใน VS Code

## ฉบับทางการ — ใช้ไฟล์ในตารางนี้เท่านั้นเวลานำเสนอหรือใส่รายงาน

| เรื่อง | ไฟล์ทางการ | หน้า | ตรวจแล้วว่า |
|---|---|---|---|
| **DFD** ระดับ 0, 1, 2 | [`dfd/DFD-INDEX-Q.drawio`](dfd/DFD-INDEX-Q.drawio) (v1.3) | ระดับ 0 · ระดับ 1 (6 process, 6 data store, 44 flow) · ระดับ 2 ของงาน 4.0 และ 6.0 | ผ่านกฎ R1–R9 ของสคริปต์ (เส้นไม่ตัดกัน, คำขอและคำตอบเป็นคู่, process ไม่ส่งข้อมูลหา process โดยตรง, ระดับ 1 กับ 2 สมดุล, ครอบคลุมทุกตาราง) |
| **ER diagram** | [`er/ER-INDEX-Q.pdf`](er/ER-INDEX-Q.pdf) (แก้ที่ [`.drawio`](er/ER-INDEX-Q.drawio) · เปิดในเบราว์เซอร์ที่ [`.html`](er/ER-INDEX-Q.html)) | 17 ตาราง = 13 ตารางใน `schema.prisma` + 4 ตารางที่ต้นแบบเสนอเพิ่ม | สร้างใหม่แล้วไม่เปลี่ยน · PDF มีครบ 17 ตาราง |
| **Use case** | [`usecase/index-q-usecase.drawio`](usecase/index-q-usecase.drawio) | ภาพรวม · ผู้ดูแลระบบ · ผู้สอน · รายการ use case (UML 2.5) | สร้างใหม่แล้วตรง · สิทธิ์อ่านจาก `PERM` ในต้นแบบ |
| **Flowchart ฟีเจอร์** | [`flowchart/CMAS-Flowcharts_Handwritten.drawio`](flowchart/CMAS-Flowcharts_Handwritten.drawio) | สารบัญ + 1 flow ต่อ 1 use case (1.1–9.5) | ครบทั้ง 34 use case ของต้นแบบ และมี flow เกรด (8.x) กับบัญชีของตนเอง (9.x) |
| **Flowchart tech stack / สถาปัตยกรรม** | [`architecture/CMAS-Architecture_Handwritten.drawio`](architecture/CMAS-Architecture_Handwritten.drawio) | หน้า **0 · Stack + Flow** (ขั้น ①–⑩) · หน้า **7 · Tool-level flow** | รุ่น library ตรงกับ `package.json` (React 19, Vite 7, Tailwind v4, Fastify 5, Zod 4, Prisma 6) · อายุ token ตรงกับ `env.schema.ts` · trigger 3 ตัว |

ภาพรวมว่าไดอะแกรมแต่ละตัวสกัดอะไรจากต้นแบบ: [`index-q-architecture.md`](index-q-architecture.md)

## ไฟล์ประกอบ — ไม่ใช่ฉบับทางการ

| ไฟล์ | คืออะไร |
|---|---|
| `usecase/UML-INDEX-Q.drawio` | ข้อมูลชุดเดียวกับ use case ทางการ ย่อเหลือหน้าเดียวสำหรับสไลด์ |
| `usecase/UML-Layer1_Handwritten.drawio` · `UML-Layer2_Handwritten.drawio` | ร่างแรก · Layer2 ใช้เลข use case คนละชุดกับต้นแบบ **อย่าฉายคู่กับไฟล์ทางการ** |
| `usecase/superseded/UML-INDEX-Q_2026-09-14_Handwritten.drawio` | สำเนาวาดมือรุ่น 14 ก.ย. |
| `architecture/CMAS-ARCH_Handwritten.drawio` · `CMAS-FE-BE-DB_Handwritten.drawio` | ร่างหัวข้อเดียวกับหน้า 0 ของไฟล์สถาปัตยกรรมทางการ |
| `architecture/Structure.drawio` | วาดมือหน้าเดียว · โครงสร้างผู้สอนแบบบทบาทเดียว |
| `threat-model/threat-model.tm7` · `report.htm` | Threat Modeling Tool · สร้างก่อน DFD v1.3 ต้องวาดใหม่ก่อนใช้ ([#18](https://github.com/SIET-KMITL-INCEPTIO/CMAS-CLO/issues/18)) |
| `../reference/db/mysql/index-q_er-diagram.pdf` | ER แบบ MySQL Workbench · ยังเป็น 16 ตาราง ต้อง export ใหม่จาก `index-q.sql` |
| `../reference/db/mysql/cmas_app_v4*` | ER รุ่น v4 (migration 0004) จาก Workbench · ค้างไว้ตามเดิม |

ไฟล์ที่ทีมวาดเองทุกไฟล์เก็บไว้ครบ ไม่ได้ลบ ส่วนไฟล์ที่สคริปต์สร้างเก็บเฉพาะรุ่นล่าสุด (2026-10-14 ลบหน้า 2–3 ของ `Structure.drawio` ที่ยังวาดบทบาท 3 แบบ และ Excel 2 ไฟล์ที่ค้างที่ v4 ออก ดู [`VERSIONS.md`](../VERSIONS.md) §3.2)

## กติกาเวลาแก้

1. **ไฟล์ที่ชื่อไม่ลงท้าย `_Handwritten`** (DFD, ER, use case) สคริปต์ใน `scripts/` เป็นตัวสร้าง ห้ามแก้ใน draw.io ให้แก้ต้นแบบหรือสคริปต์ แล้วรัน `python scripts/build-<ชื่อ>.py` ใหม่ ไม่อย่างนั้นสิ่งที่แก้จะหายตอนสร้างใหม่
2. เปิดไฟล์เหล่านั้นใน draw.io แล้วกดบันทึกได้ `check-diagrams.py` เทียบตามเนื้อหา ไม่ใช่ไบต์
3. **ไฟล์ `_Handwritten`** แก้ใน draw.io ได้เลย แต่ต้องเทียบกับต้นแบบเอง
4. **ก่อน pull ให้ปิดแท็บ draw.io ทุกแท็บ** แท็บรุ่นเก่าที่กดบันทึกจะทับไฟล์ใหม่ (เคยทำ DFD หายมาแล้วหนึ่งครั้ง)
5. ส่งออกรูปสำหรับรายงาน: draw.io → File → Export as → PNG (ติ๊ก *All pages*) หรือ PDF
