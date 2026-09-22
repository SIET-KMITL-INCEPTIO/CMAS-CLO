# docs/

เอกสารทั้งหมดของโครงงาน CMAS แบ่งตาม **บทบาทของไฟล์** ไม่ใช่ตามหัวข้อ —
เพื่อให้ตอบได้เสมอว่าไฟล์ไหน "แก้ได้" ไฟล์ไหน "ห้ามแก้เพราะ build ทับ"

```
docs/
├── markdown/     ← source of truth — แก้ที่นี่เท่านั้น (.md ล้วน)
├── html/         ← generated — build ทับทุกครั้ง ห้ามแก้มือ (gitignored)
├── pages/        ← หน้า HTML ที่เขียนมือ ไม่ได้มาจาก markdown
├── reference/    ← artifact อ้างอิง (SQL dump, .mwb) ไม่ใช่เอกสาร
├── generated/    ← ไฟล์ที่ script สร้าง (gitignored)
├── excel/  word/  pdf/   ← ไฟล์ส่งมอบ (สร้างจาก scripts/ บางส่วน)
└── _generator/   ← ตัว build เอง
```

## กฎเดียวที่ต้องจำ

> **แก้ `.md` เสมอ ไม่เคยแก้ `.html` ใน `docs/html/`**

`docs/_generator/build.mjs` ลบ `docs/html/` ทิ้งทั้งโฟลเดอร์แล้วสร้างใหม่ทุกครั้ง
ที่รัน การแก้ HTML ตรง ๆ จะหายทันทีที่ build รอบถัดไป — ด้วยเหตุนี้
`docs/html/` จึงถูก gitignore ไว้ ไม่ commit

```bash
npm run docs:build     # docs/markdown/**/*.md  ->  docs/html/
```

เปิดดูผลลัพธ์: mermaid ทำงานไม่ได้บน `file://` ต้อง serve ก่อน

```bash
python -m http.server 8899 --directory docs/html
```

## แต่ละโฟลเดอร์คืออะไร

| โฟลเดอร์ | เนื้อหา | แก้ได้ไหม | อยู่ใน git ไหม |
|---|---|---|---|
| `markdown/` | เอกสารต้นฉบับ **`.md` เท่านั้น** | ✅ แก้ที่นี่ | ✅ |
| `html/` | เว็บที่ generate ออกมา | ❌ build ทับ | ❌ gitignored |
| `pages/` | หน้า HTML เขียนมือ (evaluation-criteria, tech-stack-review, design-system-preview, database-preview) | ✅ | ✅ |
| `reference/db/` | SQL dump, `.mwb`, ER PDF — artifact ที่เอกสารอ้างถึง | ✅ | ✅ |
| `generated/` | `project-plan.csv` จาก `npm run plan:csv` | ❌ script ทับ | ❌ gitignored |
| `excel/` | workbook ส่งมอบ — บางไฟล์สร้างจาก `scripts/build-*.py` | ⚠️ ดูตาราง | ✅ |
| `word/` | `CMAS-chapter-2-theory.docx` จาก `npm run thesis:ch2` | ❌ script ทับ | ✅ |
| `pdf/` | เอกสารอ้างอิงภายนอก + ไฟล์ส่งมอบของทีม | ✅ | ⚠️ ไฟล์หลักสูตร 2567 (135 MB) ไม่ commit |
| `_generator/` | ตัว build (`build.mjs`, `style.css`) | ✅ | ✅ |

## ทำไม `markdown/` ต้องมีแต่ `.md`

`build.mjs` เดินหา `.md` อย่างเดียว ไฟล์ชนิดอื่นที่วางปนไว้จึงไม่ถูก build
ไม่ปรากฏบนเว็บ และไม่มีใครรู้ว่ามันยังใช้อยู่หรือตายแล้ว — SQL dump, `.mwb`,
หน้า HTML เขียนมือ และ CSV ที่ script สร้าง จึงย้ายออกไปอยู่ `reference/`,
`pages/`, `generated/` ตามบทบาทของมัน

เอกสารที่อธิบาย artifact เหล่านั้นยังอยู่ใน `markdown/` ตามเดิม เช่น
`markdown/sql/mysql-dumps.md` อธิบายไฟล์ใน `reference/db/mysql/` — **คำอธิบาย
เป็นเอกสาร ตัวไฟล์เป็น artifact** คนละบทบาทกัน

## ไฟล์ที่สร้างจาก script

| คำสั่ง | ผลลัพธ์ |
|---|---|
| `npm run docs:build` | `docs/html/` ทั้งโฟลเดอร์ |
| `npm run plan:csv` | `docs/generated/project-plan.csv` |
| `npm run thesis:ch2` | `docs/word/CMAS-chapter-2-theory.docx` |
| `python scripts/build-ui-to-db-workbook.py` | `docs/excel/CMAS-UI-to-Database.xlsx` |
| `python scripts/build-er-excel.py` | `docs/excel/CMAS-ER-Diagram.xlsx` |
| `python scripts/build-score-import-template.py` | `docs/excel/CMAS-Score-Import-Template.xlsx` |
| `python scripts/build-tqf-presentation-workbook.py` | `docs/excel/CMAS-TQF-Data-Entry.xlsx` |
| `python scripts/build-usecase-drawio.py` | `docs/uml/index-q/index-q-usecase.drawio` — use case diagram ของ `index-q.html` 6 หน้า สัญกรณ์ UML 2.5 เต็มรูป อ่านสิทธิ์จาก `PERM` ในหน้านั้น |
| `python scripts/build-index-q-uml-drawio.py` | `docs/uml/index-q/UML-INDEX-Q.drawio` — ข้อมูลชุดเดียวกัน หน้าเดียว วาดด้วยสัญกรณ์เดียวกับ `docs/uml/CMAS/UML-Layer2.drawio` · ใช้โมเดลจากสคริปต์บรรทัดบนโดยตรง ไม่ได้คัดลอกมา |
| `python scripts/build-structure-pages.py` | `docs/uml/CMAS/Struture.drawio` — **เพิ่มหน้า 2 และ 3** ต่อจากหน้าที่วาดด้วยมือ · หน้า 2 โครงสร้างสิทธิ์ปัจจุบัน หน้า 3 ภาพสมมุติถ้ายุบเหลือผู้สอนคนเดียว · หน้า 1 ไม่ถูกแตะ และรันซ้ำได้ไม่บวมขึ้น |
| `python scripts/build-er-index-q-drawio.py` | `docs/uml/index-q/ER-INDEX-Q.drawio` (แก้ไขได้) **และ** `ER-INDEX-Q.html` (สำหรับนำเสนอ) — **ER diagram ของ `index-q.html`** 15 ตาราง 19 ความสัมพันธ์ แบบ crow's foot · อ่านจาก `docs/reference/db/mysql/index-q.sql` ทุกคอลัมน์ ทุก FK · ทุกเส้นมีเลนของตัวเอง ไม่ทับกัน · ของที่ต้นแบบเสนอเพิ่ม `[index-q]` พื้นเหลือง · สองไฟล์ใช้พิกัดชุดเดียวกัน · ภาพเดียวที่แสดง `AuthEvent` และ `UploadReject` |
| `msedge --headless=new --no-pdf-header-footer --print-to-pdf=docs\uml\index-q\ER-INDEX-Q.pdf docs\uml\index-q\ER-INDEX-Q.html` | `docs/uml/index-q/ER-INDEX-Q.pdf` — PDF หน้าเดียวขนาดพอดีภาพ สำหรับฉายหรือแนบรายงาน · **รันใหม่ทุกครั้งหลังรันบรรทัดบน** เพราะ `check-diagrams.py` ตรวจความสดของ `.drawio` เท่านั้น ไม่ได้ตรวจ PDF |
| `python scripts/check-diagrams.py` | **ตรวจ** ว่า UML และ ER พร้อมนำเสนอ — เลข use case ตรงกันข้ามไฟล์ · `schema.prisma` ↔ `cmas_app_mysql_v4.sql` ทั้งตารางและคอลัมน์ · ไฟล์ที่สร้างด้วยสคริปต์ยังไม่เก่า · ไฟล์ที่กำกวมบนโต๊ะนำเสนอ · `exit 1` = ยังไม่พร้อม |
| `node scripts/check-perm-matrix.js` | **ตรวจ** เมทริกซ์ `PERM` ใน `index-q.html` เทียบกับ `can()` จริง — 4 บทบาท × 18 capability ทุกช่อง |
| `node scripts/check-action-caps.js` | **ตรวจ** ว่าทุก `data-act` map ไปหา capability ที่ถูกต้องผ่าน `capOf()` — SEC-1/SEC-2 |
| `node scripts/check-auth-events.js` | **ตรวจ** ว่า `FORMS.user.save()` เขียน `AuthEvent` ครบทุกทาง — สร้างบัญชี/เปลี่ยนบทบาท/ระงับผ่านฟอร์มแก้ไข/แก้ชื่อ-อีเมล (UC 1.1/1.2/1.4) · ก่อนแก้ 2569-09-13 ฟังก์ชันนี้ไม่เขียน AuthEvent เลยสักบรรทัด |
| `python scripts/build-import-test-workbooks.py` | `docs/excel/import-test/*.xlsx` — ไฟล์ทดสอบตัวนำเข้า Excel |

script ทั้งหมดรันจาก **root ของ repo** ไม่ใช่จาก `scripts/`

## source of truth ที่แท้จริง

เอกสารใน `docs/` อธิบายระบบ แต่ไม่ใช่ตัวระบบ — เมื่อขัดกัน **โค้ดชนะเสมอ**

| เรื่อง | ของจริงอยู่ที่ |
|---|---|
| Schema ฐานข้อมูล | `database/schema.prisma` |
| Migration | `database/migrations/` |
| Schema เวอร์ชัน MySQL/PostgreSQL ใน `docs/reference/db/` | **mirror เท่านั้น** ใช้ทำ ER diagram ไม่ใช่ของรัน |
