# แหล่งอ้างอิงบนเว็บสำหรับเล่มปริญญานิพนธ์ — CMAS

See also: [[theory]] · [[thesis-toc]] · [[srs]] · [[dev]]

> **สร้าง:** 2026-11-15 · รวบรวมจาก URL ที่มีอยู่แล้วในเอกสารของโปรเจกต์ ไม่ได้เพิ่มแหล่งจากความจำ
> **"ตรวจแล้ว 2569-11-15"** หมายถึงเปิด URL ได้ (HTTP 200) เท่านั้น ยังไม่ได้อ่านเนื้อหาซ้ำ ผู้เขียนเล่มต้องเปิดอ่านหน้าที่อ้างจริงก่อนใส่ลงบรรณานุกรม
> **รูปแบบการอ้างอิง** ให้ปรับตามคู่มือปริญญานิพนธ์ของคณะ (งาน 2.3.2) · เว็บต้องมี **วันที่สืบค้น** ทุกรายการ (ใช้ 15 พฤศจิกายน 2569 ถ้าไม่ได้เปิดใหม่)
> เวอร์ชันในตารางอ่านจาก `package.json` ณ วันที่สร้าง ถ้าเปลี่ยนต้องแก้ตารางและ [[theory]] §2.4 ให้ตรงกัน

## 1. เอกสารทางการของเทคโนโลยีที่ใช้ (บทที่ 2 §2.4 และบทที่ 3 §3.5.1)

| เทคโนโลยี | เวอร์ชันในโค้ด | URL | ใช้ในหัวข้อ | ตรวจแล้ว |
|---|---|---|---|---|
| React | ^19.0.0 | <https://react.dev> | §2.4.2 | ✓ |
| Vite | ^7.3.6 | <https://vite.dev> | §2.4.2 | ✓ |
| React Router | 7 (ตาม CLAUDE.md) | <https://reactrouter.com> | §2.4.2 | ✓ |
| TanStack Query | ^5.62.0 | <https://tanstack.com/query> | §2.4.2 | ✓ |
| Tailwind CSS | ^4.3.2 | <https://tailwindcss.com> | §2.4.2 | ✓ |
| Recharts | ^3.9.2 | <https://recharts.org> | §2.4.2 | ✓ |
| Fastify | ^5.10.0 | <https://fastify.dev> | §2.4.3 | ✓ |
| Prisma | ^6.19.3 (ค้าง v6 โดยตั้งใจ ดู [[dev]] §Prisma) | <https://www.prisma.io/docs> | §2.4.3 | ✓ |
| PostgreSQL | ผ่าน Supabase | <https://www.postgresql.org/docs> | §2.4.3 | ✓ |
| Zod | ^4.4.3 | <https://zod.dev> | §2.4.3 | ✓ |
| SheetJS (`xlsx`) | 0.20.3 | <https://docs.sheetjs.com> | §2.4.3 · อ่านไฟล์นำเข้า | ✓ |
| Vitest | ^3.2.4 | <https://vitest.dev> | §2.4.4 · §3.6.1 กล่องขาว | ✓ |

ตัวอย่างรูปแบบ (ปรับตามคู่มือคณะ):
`Fastify. (ม.ป.ป.). Fastify documentation. สืบค้นเมื่อ 15 พฤศจิกายน 2569, จาก https://fastify.dev`

## 2. แหล่งอ้างอิงด้านสถิติ (ใช้กับ CR-10 คะแนนมาตรฐาน T ในหัวข้อตัดเกรด)

| แหล่ง | URL | ใช้เรื่อง | หมายเหตุ | ตรวจแล้ว |
|---|---|---|---|---|
| Salkind, N. J. (Ed.). (2008). T Scores. *Encyclopedia of Educational Psychology*. SAGE | <https://sk.sagepub.com/ency/edvol/embed/educationalpsychology/chpt/t-scores> | ค่าเฉลี่ย 50 · SD 10 · linear กับ normalized T | อ้างต้นทาง McCall (1922) ผ่านบทนี้ ยังไม่ได้เปิดต้นฉบับ McCall — ถ้าจะอ้างต้องไปเปิดเอง ไม่งั้นอ้างเป็น "อ้างถึงใน Salkind (2008)" | ✓ |
| GraphPad Software. *Computing the SD*. GraphPad Prism Statistics Guide | <https://graphpad.com/guides/prism/latest/statistics/stat_computing_the_sd.htm> | ตัวหาร N ต่อ N − 1 ของ SD | ใช้เหตุผลว่าทำไมระบบเลือก SD แบบใด | ✓ |

ที่มา: [[srs]] §1.4 · ต้องเขียนในเล่มว่าระบบใช้ N หรือ N − 1 ตาม CR-10 ให้ตรงกับที่แหล่งนี้อธิบาย

## 3. Excel และไฟล์นำเข้า (บทที่ 3 §3.5.3 ส่วนตรวจไฟล์นำเข้า — ใช้เป็นพื้นหลังเท่านั้น)

ระบบไม่ใช้ VBA จึง **ไม่ต้องมีหัวข้อทฤษฎี VBA** ในเล่ม อ้างได้อย่างมาก 1–2 ประโยคเพื่อบอกว่าทำไมระบบไม่รับไฟล์ที่มีสูตรหรือ Macro

| แหล่ง | URL | ใช้เรื่อง | ตรวจแล้ว |
|---|---|---|---|
| Microsoft. *Excel VBA reference* (Concepts) | <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/concepts-excel-vba-reference> | พฤติกรรมของ Excel ที่ครูใช้ทำไฟล์คะแนน: ค่า error ของเซลล์ · ชื่อชีตไม่เกิน 31 ตัวอักษร · ขีดจำกัดแถวของ XLS เทียบ XLSX | ✓ |
| Microsoft. *Excel VBA object model overview* | <https://learn.microsoft.com/en-us/office/vba/api/overview/excel> | หน้าตั้งต้นของชุดเดียวกัน | ✓ |

ฉบับแปลไทยของชุดนี้อยู่ใน [`docs/reference/excel-vba/`](../../../reference/excel-vba/00-index.md) (commit แล้ว: ต้นฉบับ [MicrosoftDocs/VBA-Docs](https://github.com/MicrosoftDocs/VBA-Docs) ใช้สัญญาอนุญาต CC BY 4.0 ซึ่งยอมให้แปลได้ถ้าระบุที่มา บอกว่าแปล และแนบลิงก์สัญญาอนุญาต ทุกไฟล์ทำครบแล้ว) **ในเล่มให้อ้าง URL ต้นฉบับ ไม่อ้างฉบับแปล**

## 4. ไม่ใช้เป็นบรรณานุกรม (ใช้ในโปรเจกต์ ไม่ใช่แหล่งวิชาการ)

| รายการ | URL | ที่อยู่ |
|---|---|---|
| Figma `Project CLOs` | <https://www.figma.com/design/GLnvjhq5ENaQXy35cZtKII/Project-CLOs> | [[srs]] §1.4 · เป็นงานออกแบบของทีมเอง ใส่ในภาคผนวกหรือบทที่ 3 §3.5.2 ได้ ไม่ใช่เอกสารอ้างอิง |
| Learn Git Branching | <https://learngitbranching.js.org/> | `git-rule.md` · สื่อฝึกของทีม |
| Prisma datasource config | <https://pris.ly/d/config-datasource> | [[dev]] · อธิบายเหตุที่ค้าง Prisma 6 |

## 5. แหล่งเว็บที่ควรเพิ่ม (ยังไม่อยู่ในเอกสาร แต่เล่มพูดถึงเทคโนโลยีนี้)

[[theory]] อธิบายการยืนยันตัวตนด้วย Google, JWT และฐานข้อมูล Supabase แต่รายการอ้างอิงยังไม่มีเว็บของสามเรื่องนี้ ตรวจแล้วว่า URL เปิดได้ 15 พ.ย. 2569:

| เรื่อง | URL | ใช้ในหัวข้อ |
|---|---|---|
| Google Identity Services (Sign in with Google) | <https://developers.google.com/identity/gsi/web> | §2.3.8 · `lib/google.ts` |
| RFC 7519 JSON Web Token | <https://www.rfc-editor.org/rfc/rfc7519> | §2.3.8 · มีใน theory เป็นเอกสาร RFC อยู่แล้ว ใส่ URL เพิ่มได้ |
| Supabase documentation | <https://supabase.com/docs> | §2.4.3 · §3.4.1 |

## 6. สิ่งที่ยังต้องหาเอง (ไม่ใช่เว็บที่รวบรวมได้จากโค้ด)

[[theory]] ระบุ `[ต้องเติม]` ไว้แล้ว และผมไม่เติมจากความจำ:

- ประกาศกระทรวงฯ ว่าด้วยกรอบมาตรฐานคุณวุฒิระดับอุดมศึกษาแห่งชาติ และแนวปฏิบัติ มคอ.3 / มคอ.5
- มคอ.2 หลักสูตร ค.อ.บ. เทคโนโลยีคอมพิวเตอร์ (ปรับปรุง พ.ศ. 2567) — ไฟล์อยู่ใน `docs/pdf/` ใช้อ้างเป็นเอกสารได้
- งานวิจัยไทยด้าน OBE / CLO จากงาน 1.2 (บทที่ 1–2)
- เอกสารบทที่ 4 ตามที่ [[thesis-toc]] ระบุ: E-02 E-07 E-08
