# Security Rules — CMAS (ทีม 3 คน)

See also: [[git-rule]] · [[code-rule]] · [[features-pages]] · [[dev]]

> **Scope:** CMAS เก็บข้อมูลจริงของนักศึกษา (ชื่อ, รหัสนักศึกษา, คะแนน) และบัญชีอาจารย์/แอดมิน — ต้องปฏิบัติตามกฎนี้เคร่งครัด เพราะทีมมีแค่ 3 คน ไม่มีทีม security แยก ทุกคนต้องเป็นคนตรวจกันเอง

---

## 1. Secrets & Environment Variables

```
DO    เก็บ secret ทั้งหมดใน .env / .env.local เท่านั้น (DATABASE_URL, JWT_SECRET, SUPABASE_SERVICE_KEY)
DO    ใช้ .env.example เป็น template ที่ไม่มีค่าจริง (ค่า placeholder เท่านั้น)
DO    ใช้ random string 256-bit ขึ้นไปสำหรับ JWT_SECRET ใน production (สร้างด้วย openssl rand -base64 32)
DO    หมุนเวียน (rotate) secret ทันทีถ้ามีความสงสัยว่ารั่วไหล (เช่น commit หลุด, แชร์ผิดที่)

DON'T commit .env, .env.local, .env.production ลง git เด็ดขาด
DON'T hardcode secret/credential ในโค้ด (const JWT_SECRET = "...")
DON'T แชร์ .env ผ่าน chat/email — ใช้ password manager หรือ secret store ของทีมเท่านั้น
DON'T ใช้ secret เดียวกันระหว่าง dev/staging/production
```

**ก่อน commit ทุกครั้ง** — เช็คว่าไม่มีไฟล์ secret ติดไปกับ `git status` / `git diff --staged` (ดู [[git-rule]] §6)

---

## 2. Authentication & Authorization

### 2.1 JWT

- Token ต้อง sign ด้วย secret จาก `process.env.JWT_SECRET` เท่านั้น ห้าม hardcode
- กำหนด `JWT_EXPIRES_IN` เสมอ (ห้าม token ไม่มีวันหมดอายุ)
- เก็บ token ฝั่ง client ใน memory/httpOnly cookie เท่านั้น — **ห้าม** เก็บใน `localStorage` แบบ raw ถ้าเลี่ยงได้ (ถ้าจำเป็นต้องใช้ localStorage ให้บันทึกเหตุผลใน PR)
- ทุก request ที่ต้อง auth ต้องผ่าน `authMiddleware` ก่อนเข้าถึง route — ห้าม verify token เองใน controller

### 2.2 Authorization (RBAC)

- Role มี 2 ระดับ: `ADMIN`, `INSTRUCTOR` — ทุก endpoint ที่แก้ไขข้อมูลต้องระบุ role ที่อนุญาตชัดเจนผ่าน `rbac()` middleware
- **Authentication ≠ Authorization** — มี token ที่ valid ไม่ได้แปลว่ามีสิทธิ์ทำทุกอย่าง ต้องเช็ค role/ownership ทุกครั้ง (เช่น instructor แก้ได้เฉพาะ course ของตัวเอง)
- ตรวจสอบ ownership ที่ชั้น Service เสมอ (เช่น `course.instructorId === userId`) ไม่ใช่เชื่อ `courseId` จาก request อย่างเดียว

```typescript
// ❌ ผิด — เชื่อ courseId จาก client ไม่เช็คว่าเป็นของ instructor คนนี้จริงไหม
async updateClo(courseId: string, cloId: string, data: UpdateCloInput) {
  return this.cloRepo.update(cloId, data)
}

// ✅ ถูก — เช็ค ownership ก่อนแก้ไขเสมอ
async updateClo(userId: string, courseId: string, cloId: string, data: UpdateCloInput) {
  const course = await this.courseRepo.findById(courseId)
  if (course.instructorId !== userId) throw new ForbiddenError()
  return this.cloRepo.update(cloId, data)
}
```

### 2.3 Password

- Hash ด้วย `argon2` (หรือ `bcrypt` ถ้าเปลี่ยน) เท่านั้น — ห้าม plain text หรือ hash เอง (MD5/SHA เปล่าๆ)
- บังคับความยาวขั้นต่ำ 8 ตัวอักษรตอนสร้างบัญชี (validate ด้วย Zod ที่ validator layer)
- ห้าม log password หรือ password hash ออกมาใน console/log ไม่ว่ากรณีใด

---

## 3. Input Validation & Injection

```
DO    validate ทุก request body/param/query ด้วย Zod ที่ validator layer ก่อนถึง service
DO    ใช้ Prisma query builder เท่านั้น (parameterized โดย default)
DO    validate ไฟล์ Excel ที่ upload เข้ามา (นามสกุล, ขนาด, จำนวนแถวสูงสุด) ก่อนประมวลผล

DON'T ใช้ $queryRaw / $executeRaw โดยไม่จำเป็น ถ้าจำเป็นต้องใช้ ต้องใช้ parameterized query เท่านั้น
       (Prisma.sql`...` ห้าม string concatenation แบบ template literal ตรงๆ)
DON'T เชื่อ input จาก client โดยไม่ validate (รวมถึงข้อมูลจากไฟล์ Excel/CSV)
DON'T render ข้อมูลจาก user ใน HTML โดยไม่ผ่าน React's default escaping (ห้าม dangerouslySetInnerHTML กับ user input)
```

---

## 4. Data Exposure & Logging

- Response API ต้อง **ไม่มี** field ที่ sensitive เช่น `passwordHash` — ใช้ Prisma `select` เลือกเฉพาะ field ที่จำเป็นเสมอ (ตาม [[dev]] §8.2)
- Error message ที่ส่งกลับ client ต้องไม่เผย stack trace หรือ query จริงใน production (`NODE_ENV=production` ต้อง return generic message)
- Log ฝั่ง server ห้ามมี: password, JWT token เต็ม, ข้อมูลนักศึกษาแบบละเอียด (เก็บแค่ id พอสำหรับ debug)
- ข้อมูลนักศึกษา (ชื่อ, รหัสนักศึกษา, คะแนน) ถือเป็นข้อมูลส่วนบุคคล — เข้าถึงได้เฉพาะผู้ใช้ที่ login และมีสิทธิ์ตาม course เท่านั้น ห้ามมี endpoint แบบ public ที่ดึงข้อมูลนักศึกษาได้

---

## 5. CORS & Network

- `CORS_ORIGIN` ต้อง whitelist เฉพาะ domain ของ frontend จริง (dev/preview/prod แยกค่ากัน) — ห้ามตั้ง `*` ใน production
- ใช้ HTTPS เท่านั้นใน production (Vercel/Railway/Fly.io จัดการให้อัตโนมัติ — ห้าม downgrade เป็น HTTP)
- Rate limit endpoint ที่ sensitive อย่างน้อย `POST /auth/login` และ `POST /scores/batch` เพื่อกัน brute-force / abuse

---

## 6. Dependency & Supply Chain

- ก่อนเพิ่ม dependency ใหม่ — เช็ค `npm audit` / จำนวน weekly download / วันที่ update ล่าสุด อย่างน้อยคร่าวๆ ก่อน merge
- รัน `pnpm audit` เป็นระยะ (อย่างน้อยก่อน release ใหญ่) และแก้ไข vulnerability ระดับ high/critical ก่อน deploy
- ห้าม pin dependency จาก fork ที่ไม่รู้จักหรือ URL แปลกๆ ใน `package.json`

---

## 7. Security Checklist (เพิ่มใน PR ที่แตะ auth/data/upload)

- [ ] ไม่มี secret หลุดในโค้ดหรือ log
- [ ] Endpoint ใหม่มี auth + rbac middleware ครบ (ถ้าควรมี)
- [ ] มีการเช็ค ownership ไม่ใช่แค่ role
- [ ] Input validate ด้วย Zod ครบทุกจุดเข้า (body/param/query/ไฟล์ upload)
- [ ] Response ไม่มี field sensitive หลุดออกไป
- [ ] ไม่มี raw SQL แบบ string concatenation
- [ ] Error handling ไม่เผย stack trace ใน production

---

## 8. เมื่อพบช่องโหว่หรือเหตุการณ์ผิดปกติ (Incident)

1. **หยุดและแจ้งทันที** ในกลุ่มทีม + เจ้าของโปรเจกต์ — ห้ามเงียบแล้วแก้เอง
2. ถ้า secret หลุด (เช่น commit ไป GitHub) — หมุนเวียน secret นั้นทันที (ไม่ใช่แค่ revert commit เพราะ history ยังเห็นได้)
3. บันทึกว่าเกิดอะไรขึ้น สาเหตุ และวิธีแก้ไว้ในรายงานประจำสัปดาห์ (ดู [[code-rule]] §7)
4. ห้าม deploy โค้ดที่แก้ security bug โดยไม่ผ่าน review จากอีก 1 คนในทีม แม้จะเป็นเรื่องด่วนก็ตาม (ใช้ hotfix flow ใน [[git-rule]] §2.1)

---

_เอกสารนี้มีผลบังคับใช้ร่วมกับ [[code-rule]] และ [[git-rule]] — ทุก PR ที่แตะ auth, data access, หรือ file upload ต้องผ่าน checklist ข้อ 7 ก่อน merge_
