# Excel VBA (ฉบับแปลไทย): สารบัญและคู่มือค้นหา

> แปลจาก **Excel Visual Basic for Applications (VBA) reference** บน Microsoft Learn
> หน้าตั้งต้น: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>
> หน้า Concepts: <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/concepts-excel-vba-reference>
> ต้นฉบับ Markdown: <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts>
> แปลเมื่อ: 2026-11 | อ่านต้นฉบับเมื่อวันที่แปล (ต้นฉบับอาจเปลี่ยนภายหลัง)
> สัญญาอนุญาต: ต้นฉบับ © Microsoft ใช้ [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (ตัวอย่างโค้ดใช้ MIT) · ฉบับนี้เป็นงานแปล (ดัดแปลง) จากต้นฉบับ ไม่ใช่เอกสารทางการของ Microsoft และใช้สัญญาอนุญาตเดียวกัน

หน้าตั้งต้นที่ให้มาเป็นแค่หน้าสารบัญที่ชี้ไป 3 ส่วน:

| ส่วนบนหน้าตั้งต้น | สถานะการแปล |
| :-- | :-- |
| **Concepts** (แนวคิดและวิธีทำงาน) | **แปลครบทั้ง 13 หัวข้อ (ประมาณ 90 บทความ)** อยู่ในโฟลเดอร์นี้ |
| **Object model reference** (<https://learn.microsoft.com/en-us/office/vba/api/overview/excel/object-model>) | **ยังไม่ได้แปล** เป็นเอกสารอ้างอิงออบเจ็กต์/method/property นับพันหน้า |
| **Graph Visual Basic reference** (<https://learn.microsoft.com/en-us/office/vba/api/overview/excel/graph-visual-basic-reference>) | **ยังไม่ได้แปล** |

## ไฟล์ในชุดนี้

| ไฟล์ | หมวดบนหน้า Concepts | จำนวนบทความ | เนื้อหาหลัก |
| :-- | :-- | :-- | :-- |
| [01-cells-and-ranges.md](01-cells-and-ranges.md) | Cells and ranges | 24 | อ้างอิงเซลล์/ช่วง, Select/Activate, Formula vs Formula2, ลบค่าซ้ำ, event ไฮไลต์เซลล์ |
| [02-workbooks-and-worksheets.md](02-workbooks-and-worksheets.md) | Workbooks and worksheets | 14 | สร้าง/เปิดเวิร์กบุ๊ก, อ้างอิงชีต, สร้าง/แทนที่ชีต, สารบัญ, หัวท้ายกระดาษ, บันทึกเป็นเว็บ |
| [03-controls-dialogs-forms.md](03-controls-dialogs-forms.md) | Controls, dialog boxes, and forms | 15 | UserForm, ActiveX บนชีต, combo box ค่าไม่ซ้ำ, เมนูกำหนดเอง, รายการ xlDialog 258 แถว |
| [04-events-worksheet-functions-shapes.md](04-events-worksheet-functions-shapes.md) | Events, worksheet functions, and shapes | 13 | Event ของ Worksheet/Chart/QueryTable/Application, WorksheetFunction 331 ตัว, Shapes |
| [05a-performance-and-limit-improvements.md](05a-performance-and-limit-improvements.md) | Excel performance (1/3) | 1 | การปรับปรุงประสิทธิภาพ/ขีดจำกัดแต่ละรุ่น LAA, 64 บิต |
| [05b-improving-calculation-performance.md](05b-improving-calculation-performance.md) | Excel performance (2/3) | 1 | โหมดคำนวณ, วัดเวลา (MicroTimer/CalcTimer), กระบวนการ drill-down, กฎ 4 ข้อ |
| [05c-tips-for-optimizing-performance-obstructions.md](05c-tips-for-optimizing-performance-obstructions.md) | Excel performance (3/3) | 1 | Lookup, array/SUMPRODUCT, UDF, มาโครเร็ว, รูปแบบไฟล์ XLS/XLSB/XLSX |
| [06-sparklines-and-other-applications.md](06-sparklines-and-other-applications.md) | Sparklines + Working with other applications | 3 + 6 | Sparkline VBA, ควบคุม Word/Outlook จาก Excel |
| [07-solver-vba-functions.md](07-solver-vba-functions.md) | Functions (Solver) | 14 | SolverOk/Add/Solve/Options ฯลฯ และรหัสผลลัพธ์ 0–20 |
| [08-advanced-concepts.md](08-advanced-concepts.md) | PowerPivot, coauthoring, language-specific, OLE DB for OLAP, SDI | 5 | PowerPivot Model OM, `AfterRemoteChange`, SDI |

## ค้นหาตามงานที่ต้องการทำ

| ต้องการ... | ดู |
| :-- | :-- |
| อ่าน/เขียนช่วงข้อมูลอย่างถูกวิธี | 01 หัวข้อ 3–14, 05c หัวข้อ 7 ("อ่านและเขียนข้อมูลก้อนใหญ่") |
| หาแถว/คอลัมน์สุดท้ายที่มีข้อมูล | 01 หัวข้อ 12 |
| วนลูปทุกเซลล์ / ลบแถวว่าง | 01 หัวข้อ 11, 16 |
| ตรวจ/ป้องกันค่าซ้ำ | 01 หัวข้อ 18, 23 |
| ค้นหาด้วย Find ทุกผลลัพธ์ | 01 หัวข้อ 20 |
| ตรวจว่ามีชีตชื่อนี้หรือไม่ / สร้างหรือแทนที่ชีต | 02 หัวข้อ 7 |
| ตั้งชื่อชีตให้ถูกกฎ (31 ตัวอักษร ห้ามอักขระพิเศษ) | 02 หัวข้อ 8 |
| ทำให้มาโครเร็ว (ScreenUpdating, Value2, อาร์เรย์) | 05c หัวข้อ 7 |
| วัดเวลาการคำนวณ | 05b หัวข้อ 6–7 |
| ปรับสูตรให้คำนวณเร็ว | 05b หัวข้อ 8–9, 05c หัวข้อ 4–6 |
| ทำฟอร์ม/กล่องโต้ตอบ | 03 หัวข้อ 1–7 |
| ทำปุ่ม/ตัวควบคุมบนชีต | 03 หัวข้อ 11 |
| ดัก event ของชีต/เวิร์กบุ๊ก/แอป | 04 หัวข้อ 1–9 |
| เรียกฟังก์ชันเวิร์กชีต (`WorksheetFunction`) | 04 หัวข้อ 10–12 |
| ส่งข้อมูลจาก Excel ไป Word / Outlook | 06 หัวข้อ 4–9 |
| เขียนมาโครที่ใช้ได้เมื่อหลายคนแก้ไฟล์พร้อมกัน | 08 หัวข้อ 2 |
| ใช้ Solver จากโค้ด | 07 |

## หมายเหตุสำหรับผู้อ่าน

1. **วิธีแปล:** แปลคำอธิบายและคอมเมนต์ในโค้ด คงชื่อ object, property, method, ค่าคงที่ และโค้ด VBA ไว้ตามต้นฉบับ ตารางรายชื่อ (เช่น ฟังก์ชันเวิร์กชีต, `xlDialog…`) คัดลอกด้วยสคริปต์จากไฟล์ต้นฉบับเพื่อไม่ให้พิมพ์ผิด
2. **ลิงก์อ้างอิง:** ทุกหัวข้อมีบรรทัด **อ้างอิง** ชี้ไปหน้าต้นฉบับบน Microsoft Learn ตรวจแล้วบางส่วนว่าเปิดได้ ไม่ได้ตรวจครบทุกลิงก์ ลิงก์หน้า API ใช้รูปแบบ `https://learn.microsoft.com/en-us/office/vba/api/excel.<ออบเจ็กต์>.<สมาชิก>`
3. **รูปภาพ:** ไม่ได้คัดลอกรูปจากต้นฉบับ ข้อความระบุตำแหน่งที่อ้างถึงรูปไว้ ให้ดูที่หน้าต้นฉบับ
4. **หมายเหตุผู้แปล:** ข้อความที่ขึ้นต้นด้วย "หมายเหตุผู้แปล" / "ข้อสังเกตของผู้แปล" / "ผู้แปลสรุป" คือสิ่งที่ผู้แปลเพิ่มเอง ไม่ได้อยู่ในต้นฉบับ รวมถึงจุดที่ต้นฉบับมีความไม่สอดคล้อง (เช่น ชื่อตัวแปรไม่ตรงกัน, ค่า `Engine` ของ Solver สองหน้าขัดกัน, โค้ดที่ไม่ compile)
5. **อายุของเนื้อหา:** หลายบทความเขียนสำหรับ Excel 2007–2016 (เช่น `CommandBars`, ไฟล์ `.xls`, เส้นทาง `Office14`) ใช้เป็นแนวคิดได้ แต่ตรวจสอบกับ Excel/Windows รุ่นปัจจุบันก่อนใช้จริง
6. **ลิขสิทธิ์:** ต้นฉบับเป็นของ Microsoft เผยแพร่ผ่านที่เก็บ MicrosoftDocs/VBA-Docs เอกสารชุดนี้ทำเพื่อการศึกษา/ประกอบรายงานโครงงาน ตรวจเงื่อนไขการอ้างอิงก่อนนำไปเผยแพร่ต่อ
7. **โค้ดตัวอย่างบางส่วนมาจากผู้เขียนภายนอก** (Tom Urtis, Dennis Wallentin, Bill Jelen, Holy Macro! Books) ซึ่งต้นฉบับระบุชื่อผู้เขียนไว้ และไฟล์นี้คงการระบุชื่อไว้ตามเดิม

## ความเกี่ยวข้องกับโปรเจกต์ CMAS (ผู้แปลสรุป)

โปรเจกต์นี้นำเข้าคะแนนจากไฟล์ Excel ด้วยเซิร์ฟเวอร์ (ไม่ได้ใช้ VBA) เอกสารชุดนี้จึงเกี่ยวข้องในฐานะ **ความเข้าใจพฤติกรรมของ Excel ที่ครูอาจใช้ทำไฟล์คะแนน** มากกว่าเป็นโค้ดที่โปรเจกต์ใช้ตรง ๆ เช่น

- ค่า error ของเซลล์ (`#DIV/0!`, `#N/A` ฯลฯ) ในไฟล์ที่ผู้ใช้อัปโหลด: 01 หัวข้อ 1
- สูตรที่ไฟล์เก็บเป็น IIE/AE ต่างกันตามรุ่น Excel: 01 หัวข้อ 17
- ชื่อชีตต้องไม่เกิน 31 ตัวอักษรและห้ามมีอักขระบางตัว: 02 หัวข้อ 8
- ขีดจำกัดจำนวนแถว/คอลัมน์ของ XLS เทียบกับ XLSX: 05c หัวข้อ 8

หากต้องการให้ย้ายไฟล์เหล่านี้ไปไว้ใน `docs/markdown/` (เพื่อให้ `npm run docs:build` สร้าง HTML) ต้องปรับตามรูปแบบของ `docs/README.md` ก่อน
