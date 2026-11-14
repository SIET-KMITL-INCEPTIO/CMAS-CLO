# รายงานการแก้ไข: ถอดคอลัมน์รหัสผ่านออกจากฐานข้อมูล (migration 0009)

**วันที่:** 2026-11-12 · **Branch:** `refactor/drop-password-columns` (ตัดจาก `develop`)

## 1. ที่มา

ตรวจ ER diagram เทียบกับโค้ดของ `develop` และ `feature/api-endpoints` พบว่า ER ไม่วาดคอลัมน์รหัสผ่านของตาราง `User` (ตามการตัดสินใจ 2026-11-10 ว่าระบบไม่มีรหัสผ่าน) แต่ `schema.prisma` ยังมีคอลัมน์เหล่านั้น ภาพกับโค้ดจึงไม่ตรงกัน

ตรวจการใช้งานแล้วพบว่า **ไม่มีโค้ดฝั่งเซิร์ฟเวอร์หรือไคลเอนต์ใช้คอลัมน์เหล่านี้** เหลือเพียง `database/seed.ts` ที่ hash รหัสผ่านใส่ผู้ใช้ตัวอย่าง ทีมจึงเลือกแก้ที่โค้ดให้ตรงกับการออกแบบ แทนการเพิ่มคอลัมน์กลับใน ER

| คอลัมน์ | เพิ่มเมื่อ | ใช้งานจริง |
|---|---|---|
| `passwordHash` | baseline (24 ก.ค.) · เป็น nullable ใน 0005 | เฉพาะ `seed.ts` |
| `mustChangePassword` · `pwResetAt` · `pwChangedAt` | 0008 (22 ต.ค.) ตามข้อเสนอของต้นแบบ UC 1.5 | ไม่มี |

## 2. สิ่งที่แก้

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `database/migrations/0009_drop_password_columns/migration.sql` | ใหม่ (เขียนมือ) · ถอด CHECK `chk_user_has_credential` และ `chk_user_hash` แล้ว drop 4 คอลัมน์ |
| `database/schema.prisma` | ตัด 4 ฟิลด์ออกจาก `model User` |
| `database/seed.ts` | เลิกใช้ argon2 และ `SEED_PASSWORD` · ข้อความตอนจบบอกให้ล็อกอินด้วย Google |
| `scripts/check-diagrams.py` | `REMOVED_FROM_DESIGN` ว่างแล้ว ER-2 ต้องตรง `schema.prisma` ทุกคอลัมน์ |
| `docs/reference/db/mysql/index-q.sql` | แก้หมายเหตุหัวไฟล์ (ตัวตารางไม่เปลี่ยน เพราะไม่เคยวาดคอลัมน์เหล่านี้) |
| เอกสาร | `srs.md` (DC-14 ยกเลิก) · `dfd.md` · `schema.md` · `migrations.md` · `mysql-er-diagram.md` · flowchart AuthMethods ข้อ D2 (ปิดแล้ว) |

**ER diagram (`ER-INDEX-Q.drawio`, `index-q-v2.mwb`, `er-diagram-latest.*`) ไม่ต้องแก้** เพราะไม่มีคอลัมน์เหล่านี้อยู่แล้ว ตอนนี้ตรงกับโค้ดโดยอัตโนมัติ

### เหตุผลที่ถอด CHECK `chk_user_has_credential`

กฎเดิมบังคับให้ `passwordHash` หรือ `googleSub` มีอย่างน้อยหนึ่งอย่าง เมื่อไม่มี `passwordHash` กฎนี้จะปฏิเสธบัญชีที่ล็อกอินด้วยลิงก์อีเมล (ไม่มี `googleSub`) จึงถอดทิ้งแทนการเขียนใหม่

## 3. ผลการตรวจ

| รายการ | ผล |
|---|---|
| `prisma validate` · `prisma generate` | ผ่าน |
| `npm run typecheck` (client + server) | ผ่าน |
| `npm test` ฝั่งเซิร์ฟเวอร์ | ผ่าน 230 · ข้าม 64 (ชุดที่ต้องใช้ฐานข้อมูลจริง) |
| `check-diagrams.py` | ผ่าน · ER-2 ตรงกัน |
| `check-doc-links.py` | 0 ลิงก์เสีย |

## 4. สิ่งที่ยังไม่ได้ตรวจ / ข้อควรระวัง

1. **ยังไม่ได้รัน migration 0009 กับฐานข้อมูลจริง** (Docker ไม่ได้เปิดในเครื่องตอนทำ) ต้องรัน `npm run db:migrate:dev` บนฐานข้อมูลทดสอบ และชุดทดสอบที่ข้ามไป 64 ตัว ก่อน merge
2. **ชื่อ migration ชนกับ `feature/frontend-index-q`** ซึ่งมี `0009_lock_down_supabase_data_api` อยู่แล้ว ต้องตกลงลำดับก่อนรวม branch ทั้งสอง (ห้ามเปลี่ยนชื่อโฟลเดอร์ migration หลัง apply)
3. **ค่า enum `AuthEventAction`** (`PW_RESET` · `PW_CHANGE` · `VERIFY`) ยังอยู่ใน `schema.prisma` เพราะ Postgres ลบค่า enum ไม่ได้ง่าย ๆ ถ้าจะตัดต้องสร้าง type ใหม่ ไม่ได้ทำในงานนี้
4. **dependency `argon2`** ใน `app/server/package.json` ไม่มีโค้ดใช้แล้ว ยังไม่ได้ถอด เพราะต้องแก้ `package-lock.json`
5. **ฐานข้อมูลเดิมที่มีผู้ใช้อยู่:** migration จะลบ hash ที่เก็บไว้ถาวร ไม่มีทางกู้คืน (ระบบไม่ได้ใช้ล็อกอินอยู่แล้ว)
6. สคริปต์สร้าง Excel (`build-er-excel.py`, `build-tqf-presentation-workbook.py`, `build-ui-to-db-workbook.py`) ยังมีคอลัมน์ `passwordHash` ฝังในสคริปต์ ไม่ได้แก้เพราะผลลัพธ์ไม่ถูก commit
7. `npm run test:unit` ฝั่ง client ไม่ผ่านเกณฑ์ coverage (1.24% < 2%) **เป็นเหมือนกันบน `develop`** ไม่เกี่ยวกับงานนี้
