# diagrams/ — ไดอะแกรมพร้อมส่งต่อ

> **ตรวจล่าสุด:** 2026-10-14 · `python scripts/check-diagrams.py` · เทียบกับ `docs/pages/index-q.html`, `database/schema.prisma` และ `package.json` ของ `app/`
> เปิดไฟล์ `.drawio` ด้วย [draw.io desktop](https://www.drawio.com/) หรือส่วนขยาย Draw.io Integration ใน VS Code

## พร้อมใช้

| ไดอะแกรม | ไฟล์ | หน้า | สร้างจาก | ตรวจแล้วว่า |
|---|---|---|---|---|
| **DFD** ระดับ 0, 1, 2 | [`dfd/DFD-INDEX-Q.drawio`](dfd/DFD-INDEX-Q.drawio) (v1.3) | 4 หน้า: ระดับ 0 · ระดับ 1 (6 process, 6 data store, 44 flow) · ระดับ 2 ของงาน 4.0 และ 6.0 | `scripts/build-dfd-index-q-drawio.py` | ผ่านกฎ R1–R9 ของสคริปต์ (เส้นไม่ตัดกัน, คำขอและคำตอบเป็นคู่, process ไม่ส่งข้อมูลหา process โดยตรง, ระดับ 1 กับ 2 สมดุล, ครอบคลุมทุกตาราง) · สร้างใหม่แล้วเนื้อหาตรงกับที่เก็บไว้ |
| **ER diagram** | [`er/ER-INDEX-Q.drawio`](er/ER-INDEX-Q.drawio) · [`.html`](er/ER-INDEX-Q.html) · [`.pdf`](er/ER-INDEX-Q.pdf) | 17 ตาราง = 13 ตารางใน `schema.prisma` + 4 ตารางที่ต้นแบบเสนอเพิ่ม (`AuthEvent`, `UploadReject`, `ScoreChange`, `CourseGroupWeight`) | `scripts/build-er-index-q-drawio.py` | สร้างใหม่แล้วไม่มีอะไรเปลี่ยน · PDF มีครบทั้ง 17 ตาราง |
| **Flowchart ฟีเจอร์** | [`flowchart/CMAS-Flowcharts_Handwritten.drawio`](flowchart/CMAS-Flowcharts_Handwritten.drawio) | 50 หน้า: สารบัญ + 1 flow ต่อ 1 use case (1.1–9.5) | วาดตามขั้นตอนและข้อความ error ในต้นแบบ | มีครบทั้ง 34 use case ของต้นแบบ และมี flow ของเกรด (8.x) กับบัญชีของตนเอง (9.x) เพิ่ม · ต่างจากต้นแบบแค่การแยกหน้า "แก้ไข / ลบ" เป็น 2 หน้า (3.2/3.5, 4.5/4.6) |
| **Flowchart tech stack** | [`architecture/CMAS-Architecture_Handwritten.drawio`](architecture/CMAS-Architecture_Handwritten.drawio) | หน้า **0 · Stack + Flow** (ขั้น ①–⑩ จากหน้าเว็บถึงฐานข้อมูล) · หน้า **7 · Tool-level flow** (Fastify → jose → Zod → Prisma → Postgres) | วาดมือ | รุ่นของ library ตรงกับ `package.json` (React 19, Vite 7, Tailwind v4, Fastify 5, Zod 4, Prisma 6) · อายุ token 15 นาที / 7 วัน ตรงกับ `env.schema.ts` · แก้จำนวน trigger เป็น 3 ตัวแล้ว |
| **Use case** | [`usecase/index-q-usecase.drawio`](usecase/index-q-usecase.drawio) · [`usecase/UML-INDEX-Q.drawio`](usecase/UML-INDEX-Q.drawio) | ภาพรวม · ผู้ดูแลระบบ · ผู้สอน · รายการ use case | `scripts/build-usecase-drawio.py` · `scripts/build-index-q-uml-drawio.py` | สร้างใหม่แล้วตรง |

ภาพรวมว่าไดอะแกรมแต่ละตัวสกัดอะไรจากต้นแบบ: [`index-q-architecture.md`](index-q-architecture.md)

## ยังไม่ควรใช้

| ไฟล์ | เหตุผล |
|---|---|
| `architecture/Structure.drawio` หน้า 2–3 | สคริปต์ยังวาดบทบาทในรายวิชา 3 แบบ (ASSISTANT / CO / LEAD) แต่ต้นแบบรวมเหลือ `INSTRUCTOR` บทบาทเดียวแล้ว สคริปต์จึงไม่ยอมเขียนไฟล์ (กล่องทับกัน) ไฟล์ที่เก็บไว้คือรุ่นก่อนรวมบทบาท |
| `usecase/UML-Layer1_Handwritten.drawio` · `UML-Layer2_Handwritten.drawio` | ฉบับร่าง เลข use case 11 เลขไม่ตรงกับ `UML.md` และมี 13 ข้อที่ไม่มีเลข · ใช้ `UML-INDEX-Q.drawio` แทน |
| `threat-model/threat-model.tm7` · `report.htm` | สร้างก่อน DFD v1.3 ต้องวาดใหม่ใน Threat Modeling Tool ตาม DFD ระดับ 1 ก่อนใช้ในรายงาน |
| `architecture/CMAS-ARCH_Handwritten.drawio` · `CMAS-FE-BE-DB_Handwritten.drawio` | ร่างหัวข้อเดียวกับหน้า 0 ของ `CMAS-Architecture_Handwritten.drawio` ใช้ไฟล์นั้นแทน (รายละเอียดใน [`architecture/README.md`](architecture/README.md)) |

## กติกาเวลาแก้

1. **ไฟล์ที่มีสคริปต์สร้าง (DFD, ER, use case)** ห้ามแก้ใน draw.io ให้แก้ต้นแบบหรือสคริปต์ แล้วรัน `python scripts/build-<ชื่อ>.py` ใหม่ ถ้าแก้ในไฟล์ตรง ๆ ครั้งถัดไปที่สร้างใหม่ สิ่งที่แก้จะหายหมด
2. เปิดไฟล์ที่สร้างจากสคริปต์ใน draw.io แล้วกดบันทึกได้ `check-diagrams.py` เทียบตามเนื้อหา ไม่เทียบไบต์ จึงไม่ฟ้องว่าไฟล์เก่า
3. **ไฟล์ `_Handwritten`** แก้ใน draw.io ได้เลย แต่ต้องเทียบกับต้นแบบเอง เพราะไม่มีสคริปต์ตรวจให้
4. **ก่อน pull ให้ปิดแท็บ draw.io ทุกแท็บ** ถ้าแท็บที่เปิดค้างไว้เป็นรุ่นเก่าแล้วกดบันทึก จะทับไฟล์ใหม่ (เคยทำ DFD หายมาแล้วหนึ่งครั้ง)
5. ส่งออกเป็นรูปสำหรับรายงาน: draw.io → File → Export as → PNG (ติ๊ก *All pages*) หรือ PDF
