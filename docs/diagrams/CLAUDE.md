# docs/diagrams/ — context

ไดอะแกรมในโฟลเดอร์นี้แสดง **ระบบตอนทำเสร็จแล้ว (to-be)** ไม่ใช่สภาพโค้ดตอนนี้ (as-is)
ต้นแบบของระบบที่เสร็จคือ `docs/index-q/index-q.html` ซึ่งนำหน้าแอปจริงอยู่

## หลักการ

1. **วาดจากต้นแบบ ไม่ใช่จากโค้ด** use case, DFD, ER, flowchart ต้องครบทุกฟีเจอร์ที่ `index-q.html`
   มี แม้แอปยังไม่ได้ทำ ห้ามตัดของทิ้งเพราะ "ยังไม่ implement"
2. **ข้อยกเว้นที่ยึดโค้ด:** ตารางใน `schema.prisma` และ stack/เวอร์ชัน library (`package.json`)
   ซึ่งเป็นสิ่งที่ตัดสินใจแล้ว ถ้าต้นแบบเสนอเพิ่ม (เช่นตาราง `[index-q]` พื้นเหลืองใน ER)
   ให้ทำเครื่องหมายแยกให้เห็นว่าเป็นส่วนที่เสนอ
3. **ห้ามใส่สิ่งที่ไม่อยู่ในต้นแบบหรือ SRS** DFD ที่วาดจากความตั้งใจลอย ๆ จะให้ threat list ผิด
4. **ห้ามใส่สถานะความคืบหน้า** (เช่น "ทำแล้ว 18 จาก 23", "ยังไม่ implement", hash commit)
   ลงในตัวไดอะแกรม สถานะอยู่ใน `docs/markdown/dev/progress/` และตารางสถานะของ README นี้
5. ไดอะแกรมที่ยังบรรยายสภาพโค้ดปัจจุบัน ให้ระบุหัวเรื่องว่า **as-is** หรือย้ายออก
   (ตอนนี้คือ `architecture/CMAS-Architecture_Handwritten*.drawio` ที่อ้างโค้ดที่ commit `ff6ed7c`
   ต้องทบทวนว่าจะวาดใหม่เป็น to-be หรือป้ายเป็น as-is)

## ใครสร้างไฟล์ไหน

| ชื่อไฟล์ | วิธีแก้ |
|---|---|
| ไม่ลงท้าย `_Handwritten` (DFD, ER, use case, flowchart ยกโครงปี) | สคริปต์ใน `scripts/build-*.py` สร้าง **ห้ามแก้ใน draw.io** แก้ต้นแบบหรือสคริปต์แล้วรันใหม่ |
| ลงท้าย `_Handwritten` | แก้ใน draw.io ได้ แต่ต้องเทียบกับต้นแบบเอง |
| `threat-model/threat-model.tm7` | แก้ด้วย Microsoft Threat Modeling Tool แล้วสร้าง `threat-report.htm` ใหม่ |

ชื่อที่มี `-INDEX-Q` สกัดจาก `index-q.html` ทั้งหมด

## ก่อนแก้หรือเพิ่มไฟล์

- รัน `python scripts/check-diagrams.py` แล้วดู `git status` เพราะมันอาจเขียนทับ `.drawio` ที่ commit ไว้ (exit 1 เป็นเรื่องปกติถ้ามี warning ที่รู้แล้ว)
- เปิดแต่ละไฟล์ต้องอ่าน [`../VERSIONS.md`](../VERSIONS.md) ก่อน ว่าตัวไหนคือฉบับปัจจุบัน
- ไฟล์ที่ถูกแทนที่ให้ **ลบ** ใน commit เดียวกับที่เพิ่มตัวใหม่ ประวัติอยู่ใน git ไม่ต้องมี `superseded/`
- ก่อน pull ให้ปิดแท็บ draw.io ทุกแท็บ แท็บเก่าที่กดบันทึกจะทับไฟล์ใหม่
- ตารางไฟล์ทางการและรายการที่ตรวจแล้วอยู่ใน [`README.md`](README.md) ส่วนภาพรวมว่าไดอะแกรมแต่ละตัวสกัดอะไรอยู่ใน [`index-q-architecture.md`](index-q-architecture.md)

## ที่เกี่ยวข้อง

- ต้นแบบ: `docs/index-q/index-q.html` · สิ่งที่แอปรับ/ไม่รับจากต้นแบบ: `docs/markdown/dev/architecture/prototype-to-app.md`
- ข้อกำหนด: `docs/markdown/dev/requirements/srs.md` · ER ของ SQL: `docs/reference/db/mysql/index-q.sql`
