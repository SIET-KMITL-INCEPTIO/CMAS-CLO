# บทเรียนและปัญหาของโครงงาน CMAS-CLO (ก่อน dev → SDLC)

> **สร้าง:** 2026-10-25 · **ที่มา:** บทสนทนาใน Claude Code (session "ปัญหาและบทเรียนจากโปรเจกต์") ที่อ่านจาก
> - git history 112 commit (2026-07-24 → 2026-10-23)
> - เอกสารใน repo: fishbone, รายงานความก้าวหน้า 02/03, `api-design-plan.md`, `mockup-feedback-2569-10-19.md`, `diagrams/README.md`
> - transcript เต็มของ 6 session: Grading page review, CI/CD testing plan, สถานะโครงการหลัก, API endpoints + frontend F0–F4, Google Auth linking, Index-q and drawio planning
> - snippet ของ session อื่น (ยังไม่ได้อ่านเต็ม ราว 15 session ช่วงวางแผน เช่น Chapter 3 report review, UML folder in docs)
>
> **ข้อควรระวัง:** ตัวเลขและข้อสรุปในไฟล์นี้มาจากการอ่านข้อความบทสนทนา ยังไม่ได้รันซ้ำเพื่อยืนยัน ตรวจกับโค้ดก่อนอ้างในเล่ม

---

## 1. ก่อน dev (วางแผน, ออกแบบ, diagram)

### 1.1 Pain point ที่เป็นที่มาของโครงงาน

ปัญหาหลัก: **อาจารย์ช่วยนักศึกษากลุ่มเสี่ยงไม่ทันก่อนจบเทอม** เจาะ 5 Why ได้สามสาย ชี้ไปที่รากเดียวกัน

| สาย | อาการ | ราก |
|---|---|---|
| เครื่องมือ | กรอกคะแนนทีละช่อง ทีละคน ระบบเดิมออกแบบไว้บันทึกคะแนนปลายทาง | ไม่มีระบบรวมการกรอกคะแนนกับการติดตามผล |
| วิธีประเมิน | ประเมินรวบยอดปลายภาค เพราะกรอกต่อเนื่องใช้เวลามาก | ขาดการเชื่อม Excel กับการประมวลผลอัตโนมัติ |
| มองไม่เห็นความเสี่ยง | ไม่มีภาพรวมราย CLO ไม่มีสัญญาณเตือน | ยังไม่มี Early Warning System |

อ้างงานวิจัย: Chefrour (2024), Helal (2018), Jisc (2016, Purdue Signals), Seliwati & Al Razaq (2024)

**เอาไปใช้ต่อ:** ทำ fishbone แล้วเจาะ 5 Why จนถึงราก แล้วทำตาราง ราก → ฟีเจอร์ที่แก้ เพื่อให้ทุกฟีเจอร์ตอบได้ว่าแก้ปัญหาข้อไหน

### 1.2 ขอบเขตระบบผิด (ปัญหาใหญ่สุด)

- `schema.prisma` เดิมออกแบบหลายสถาบัน (`Institution`, `Membership`, `Curriculum`) แต่วัตถุประสงค์ระบุสถาบันเดียว
- ต้องหยุดงานแทรก 2.7 ตัดเหลือ 13 ตาราง (4 ส.ค.) กระทบเอกสารทุกฉบับ งาน CLO 4 เลื่อนราว 1 sprint
- เจอก่อนเขียนโค้ดจึงเสียหายน้อย ถ้าเจอทีหลังต้องรื้อทุก query และทุกหน้าจอ

**บทเรียน:** เทียบ schema กับวัตถุประสงค์ทีละข้อก่อนออกแบบ DB ความซับซ้อนที่ requirement ไม่ได้ขอคือหนี้

### 1.3 กฎธุรกิจที่ยังไม่นิ่ง

| รหัส | เรื่อง | ผลกระทบ |
|---|---|---|
| OI-10 | คำว่า "น้ำหนัก" ตีความได้ 2 แบบ ผลต่างกัน ~20 จุดบนข้อมูลชุดเดียวกัน | เขียน test ส่วนคำนวณไม่ได้ บล็อก H1 |
| OI-12 | นักศึกษาที่ยังไม่มีคะแนนเลย นับเป็นกลุ่มเสี่ยงไหม | กระทบ FR-83 และ H2 |
| E-02 | ไม่มีใบคำนวณด้วยมือที่อาจารย์รับรอง | ไม่มีเกณฑ์ตรวจว่าระบบคำนวณถูก |
| E-01 | ไม่มีตัวเลขเวลาที่ใช้กับ Excel ก่อนมีระบบ | พิสูจน์ว่าลดภาระไม่ได้ |

**แนวปฏิบัติที่ทีมตั้ง:** ไม่เขียนโค้ดส่วนไหนจนกว่ากฎของส่วนนั้นได้รับการยืนยันจากอาจารย์ที่ปรึกษา · ถ้าเรื่องต้องให้อาจารย์ชี้ขาด ให้เตรียมตารางเปรียบเทียบตัวเลขไปด้วย · เก็บ baseline ก่อนเริ่มพัฒนา

### 1.4 ออกแบบสิทธิ์

- **ยุบ LEAD/CO/TA เหลือ "ผู้สอน" ได้ไหม:** วัดจาก `PERM` จริง 18 สิทธิ์ = 6 เท่ากันอยู่แล้ว · **9 ต่างกัน** · 3 ของ ADMIN
  - ถ้ายุบ ผู้ช่วยสอนที่เพิ่งถูกเชิญจะตรึงเกรด ปรับเกรด ลบนักศึกษา และเชิญคนอื่นได้เท่าตัวเอง
  - SEC-4 (กันยกระดับสิทธิ์ตัวเอง) และ EX-7 (ไฟล์ Excel ที่ระบุผู้สร้าง) ใช้ไม่ได้
  - โครงงานเคยเป็นแบบนี้แล้วยกเลิก (ASM-03, 10 ก.ย.) · ทางกลางที่เสนอ: เหลือ 2 บทบาท (ผู้สอน / ผู้ช่วยสอน)
- **ADMIN ทำงานในรายวิชาแค่ไหน (F-1 → D-1):** เอกสาร 3 ที่เขียนไม่ตรงกัน ตัดสิน 2026-10-15 ว่า ADMIN อ่านได้ทุกวิชา แต่ไม่ทำงานของผู้สอน
- **หลาย section ใน 1 วิชา:** รองรับแบบ 1 section = 1 `Course` (unique ที่ code + semester + year + section) รวมหลาย section เป็นภาพเดียวไม่ได้ ถ้าต้องการต้องเพิ่มชั้น `CourseOffering` ซึ่งควรตัดสินก่อนเขียนระบบจริง

### 1.5 Diagram และเอกสารไม่ตรงกัน (เกิดซ้ำหลายรอบ)

- เลข use case ต่างกันระหว่างไฟล์ (UML.md กับ UML-Layer2.drawio ต่างกัน 11 ข้อ, เลขซ้ำ 1, ไม่มีเลข 13)
- UML เขียน "ลบบัญชี" แต่ `onDelete: Restrict` ห้ามลบ ทำได้แค่ระงับ
- ER PDF หลายรุ่นปนกัน (ฉบับเก่ายังมี `GradeScheme`/`GradeRun` ที่ยุบไปแล้ว)
- รายงานบทที่ 3: จำนวนกระบวนการไม่ตรงกัน
- จำนวน endpoint เขียนไม่ตรงกันในเอกสารเดียว (57 / 58 / 68)
- ไฟล์ UML.md ที่แก้ไว้หายไปตอนจัดโฟลเดอร์
- DFD ถูก save เวอร์ชันเก่าทับ · เปิดไฟล์ใน draw.io แล้วบันทึกทำให้ตัวตรวจฟ้องทุกครั้ง (เทียบไบต์)
- Threat model 695 รายการทั้งหมดยังเป็น Not Started / High (ค่าเริ่มต้นของเครื่องมือ) ห้ามอ้างว่าป้องกันแล้ว
- `docs/` ปนกัน 4 ประเภทไฟล์ · `docs/html/` ถูก commit ทั้งที่ build ใหม่ทุกครั้ง · PDF หลักสูตร 135 MB ทำให้ repo หนัก 99%

### 1.6 ช่องว่างที่เจอเมื่อตรวจ prototype (`index-q.html`)

- `FORMS.user.save()` ไม่เคยเขียน `AuthEvent` ใน 3 จาก 4 การกระทำ ทั้งที่หน้า UC 1.6 แสดงว่าทำงานแล้ว
- `index-q.sql` ไม่มีคอลัมน์แยกว่า import เป็นคะแนนหรือรายชื่อ (`ScoreUploadLog.kind`)
- เมนูความหนาแน่นของตารางมีแค่ tooltip อธิบาย ซึ่งเปิดบนมือถือไม่ได้
- การ์ด CLO วางข้อมูลรอง 7 ชิ้นก่อนตัวข้อความ CLO · ปัญหาที่วัดได้คือ "ลำดับความสำคัญและความหนาแน่น" ไม่ใช่เลย์เอาต์ (ล้นแนวนอน 0 ทุกหน้า)
- `--dim` คอนทราสต์ 3.26:1 ไม่ผ่าน AA (`--ink-soft` ได้ 6.06:1)
- marker "คลิกเพื่อขยาย" ขึ้นทุกเซลล์ เพราะวัดความกว้างก่อน table มีขนาดจริง · ต้องรอ `requestAnimationFrame`

### 1.7 ฟีดแบ็กอาจารย์ 19 ต.ค. (P1–P8)

ถ้อยคำ, กราฟ, ประเภท OTHER vs CUSTOM, แผนพัฒนาผู้เรียน, เกณฑ์ผ่านจากบันไดเกรด, น้ำหนักห้ามเกิน 100% ต้องแก้ SQL, ER, DFD, UML, flowchart, SRS และ api-design ตามเป็นทอด ๆ

### 1.8 ออกแบบ API

- 76 endpoint (72 ในขอบเขต, 4 เลื่อนไปหลัง v1 ตาม D-5)
- ช่องว่าง F-1…F-9 เช่น F-2 refresh token ใช้แทน access token ได้, F-3 `CourseNotFoundError` ตอบ 500, F-9 endpoint ที่ใช้ leaf id ลงทะเบียนไม่ได้ 20 ตัว
- ตัดสินใจ D-1…D-5 · กฎ A-6…A-10 (หนึ่ง route หนึ่ง capability, ลำดับ preHandler ตายตัว, Zod `.strict()`, ตอบด้วย DTO, ค่าที่คำนวณไม่รับจาก client)

### 1.9 บริหารโครงงาน

- ทะเบียนความเสี่ยง E-01…E-06 (E-06 ขอบเขตขัดกัน ปิดแล้ว 7 ส.ค.)
- งานแทรกทำให้แผนเลื่อน · ไฟล์แผน (.xlsx) บันทึก % ต่ำกว่าความจริง
- บันทึกแบบคำถาม → คำตอบช่วยให้เห็นว่าคำถามไหนค้างและบล็อกงานอะไร

---

## 2. SDLC (พัฒนา ทดสอบ ส่งมอบ)

### 2.1 ตั้งโปรเจกต์

- clone ใหม่แล้วรันไม่ได้: `db:seed` ชี้ไฟล์ที่ไม่มี, README ลิงก์เสียและเขียนว่า Hono, ESLint ไม่ข้าม `dist/` (error 1,159), ไฟล์ test หลุดเข้า production image, `start` ฝัง `--env-file=.env`
- CRLF/LF ปนกัน (diff ปลอม 113 ไฟล์) · `happy-dom` มีช่องโหว่ critical
- แก้ด้วย `npm run setup` ที่รันซ้ำได้, `.gitattributes`, `.editorconfig`, `.nvmrc`, Node 24

### 2.2 Backend

- ด่านสิทธิ์กลาง: ทุก route ต้องประกาศ `config.access` ไม่ประกาศ server ไม่ยอมบูต
- token มี `typ` (S-1) · ตอบ 404 แทน 403 · log เก็บแค่ชื่อและรหัส error · อ่าน role จาก DB ทุก request
- ADMIN_EMAILS bootstrap (FR-05a) · pending-approval (FR-08)
- migration: 0004 พัง (`RAISE` ไม่ส่งค่า), 0008 (ตาราง/คอลัมน์ของ prototype + RefreshToken), 0009 (ล็อก Supabase Data API)
- CORS ค่า default อนุญาตแค่ GET/HEAD/POST ทำให้เบราว์เซอร์ปฏิเสธ PATCH/PUT/DELETE

### 2.3 Frontend (F0–F6)

design system, app frame, course management, CLO/objectives, activities/matrix, score grid, Excel import/export, grading · รูปโปรไฟล์ Google · F5 และ F7 มอบให้เพื่อนผ่าน issue · Google Sign-In ไม่ตอบสนองเมื่อกด (ต้องตรวจ Authorized JavaScript origins และ origin ของเบราว์เซอร์)

### 2.4 ฐานข้อมูล / Supabase

| ประเด็น | รายละเอียด |
|---|---|
| Region | Tokyo ~250 ms ต่อ query → Singapore ~50 ms (ย้าย region ไม่ได้ ต้องสร้างโปรเจกต์ใหม่) |
| Pooler | transaction pooler (6543 + `pgbouncer=true`) ทำให้ 1 query = 4 รอบ → ใช้ session pooler พอร์ต 5432 |
| ความปลอดภัย | RLS ปิดทั้ง 20 ตาราง `anon` อ่าน `User` ได้ → migration 0009 · โปรเจกต์ Tokyo เก่ายังเปิดโล่ง (ลบหรือล็อกใน Dashboard เอง) |
| Free plan | ถูกพักถ้าไม่มีใครใช้เกิน 7 วัน · ไม่มี backup อัตโนมัติ · เพดาน 500 MB (จำลอง 3 เดือน ~50–310 MB) · `VACUUM` ต้องผ่านพอร์ต 5432 |
| `.env` | URL เก่าพร้อมรหัสผ่านค้างในไฟล์ · `.dockerignore` กันได้แค่ `.env` ที่ root ทำให้ `app/server/.env` เข้า builder stage |
| MCP | `.mcp.json` ที่ commit ถ้าตัด `read_only=true` ทุกคนที่ pull จะได้ MCP แบบเขียนได้ |

### 2.5 ประสิทธิภาพ

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| ทุก request ช้า 0.5–2 s | DB อยู่ Tokyo | ย้ายไป Singapore |
| `localhost` ช้า ~216 ms | Windows ลอง IPv6 ก่อน server ฟังแค่ IPv4 | server ฟังที่ `::` (~5 ms) |
| หน้า grading ~12 รอบ | `$transaction([...])` รัน query ต่อกัน | `Promise.all` ใน 15 จุดที่เป็นการอ่านล้วน |
| หน้าภาพรวมโหลดซ้ำ 3 รอบ (30 query) | 3 endpoint โหลดทั้งวิชาเอง | `dashboard/summary` 1 call |
| หน้านักศึกษา 40 คน = 400 query | ยิงทีละคน + เปลืองโควตา rate limit | `dashboard/students` 1 call |
| `/auth/me` ซ้ำ | React StrictMode | ทำ `resumeSession()` ให้รันทีละรอบ |
| Lighthouse 40 | วัดบน Vite dev | วัดบน production build ได้ 71 |

**ข้อสรุป:** ความช้ามาจากจำนวนรอบไป-กลับ ไม่ใช่ขนาดข้อมูล (5,000 แถวใน INSERT เดียว 320 ms แต่ 20 แถวแยก INSERT 1,080 ms) · rate limit 100/นาทีต่อ IP ผู้ใช้หลังเครือข่าย NAT เดียวกันใช้โควตาร่วมกัน (ยังไม่แก้)

### 2.6 ทดสอบ

- DB test รันขนานกันลบ user `@cmas.test` ของกันและกัน → `fileParallelism: false` เมื่อ `CMAS_DB_TESTS=1`
- test ที่ยิงทุก route ติด rate limit → ตั้ง `RATE_LIMIT_MAX` สูงตอนรัน test
- DB ระยะไกล + Prisma transaction default 5 s ชน P2028 → timeout 30 s
- `it.fails` เก็บ gap ที่ยังไม่แก้ · contract test boot Fastify จริง · `check-api-design.py` เทียบแบบกับระบบ · S-8 isolation test (ยิงทุก route ด้วยผู้สอนวิชาอื่น ต้องได้ 404)

### 2.7 CI/CD

- CI ล้มเงียบตั้งแต่ 24 ก.ย. ถึง 15 ต.ค. (`.nvmrc` Node 20 แต่ `concurrently@10` ต้อง 22+)
- แผน CI/CD P1–P6 (PR #38): ป้องกัน repo/pipeline, แยก job ขนาน + `CI gate`, สแกนความปลอดภัย (CodeQL, gitleaks, Grype, dependency review), Playwright E2E, deploy (ข้าม), nightly + mutation testing
- zizmor เจอ 14 จุดใน workflow เดิม (high 7) → 0 · `main` ไม่มี branch protection · coverage 60% ไม่เคยบังคับ · action ไม่ pin SHA
- ช่องโหว่ HIGH 10 ตัวใน production dependencies (fastify, zod, react-router, prisma ฯลฯ) + CRITICAL 3 ในเครื่องมือ dev
- E2E จับบั๊ก CORS ได้จริง · mutation testing จับ test ที่ขาดใน `jwt.ts` (9 mutants → 100%)

### 2.8 ความปลอดภัย

- Google auth ไม่ใช่ช่องทาง injection: client ส่งแค่ `idToken` server ตรวจ signature/iss/aud/exp/email_verified เอง body ผ่าน Zod, SQL ผ่าน Prisma
- ที่ยังมี: access token เพิกถอนไม่ได้จนหมดอายุ 15 นาที, ไม่มี CSP ฝั่ง client, rate limit เก็บใน memory
- ไม่มี 2FA ของระบบ (ใช้ 2FA ของ Google ได้) · ผู้ใช้แก้โปรไฟล์ตัวเองไม่ได้ (F7 / issue #34)
- การลบ `ADMIN_EMAILS` ไม่ลดสิทธิ์ ADMIN ที่มีอยู่แล้ว ต้องแก้ `role` ใน DB

### 2.9 Git / ทำงานเป็นทีม

- commit ชื่อ "Refactor code structure for improved readability and maintainability" 9 ตัว ไม่สื่อ (หนึ่งในนั้นเขียนทับไฟล์ DFD ที่ generate ไว้)
- งานค้างที่ยังไม่ commit ราว 40 ไฟล์
- PR #32 (branch `feature/frontend-index-q`) ยังเปิดอยู่ · ใช้ worktree แยก (`CMAS-ci-harden`) สำหรับงานที่ไม่เกี่ยวกัน
- คู่มือให้เพื่อน: clone → setup → ใส่ `.env` → run · **ห้ามรัน** `db:seed` และ `db:migrate:dev` (DB ใช้ร่วมกัน)
- ปัญหาที่เพื่อนอาจเจอ: Node เก่า, `EADDRINUSE`, `prisma generate` ล้ม `EPERM` (Windows ถือไฟล์), `origin_mismatch` ของ Google

### 2.10 วิธีทำงานกับ Claude

- session ยาวจน context เต็มต้องสรุปต่อ · ชน usage limit ระหว่างทำ F2 · สลับโมเดลบ่อย (Opus ↔ Sonnet ↔ Haiku)
- ข้อความที่ส่งมาแบบ "Here is what I saw:" ไม่มีรายละเอียดต่อท้าย ต้องเดาจากสิ่งที่ตรวจเองได้
- export transcript ได้ไม่เกิน 6 ครั้งต่อชั่วโมง

---

## 3. สิ่งที่ทำแล้วดี เอาไปใช้ต่อได้

1. **วัดก่อนแก้ วัดซ้ำหลังแก้** (query log, ตาราง ก่อน/หลัง, Lighthouse บน production build) ไม่เดาว่าช้าที่ DB
2. **กฎแบบ "ลืมแล้ว server ไม่ยอมบูต"** (ทุก route ต้องประกาศสิทธิ์) แทนการจำเอา
3. **ตัวตรวจถาวรแทนการแก้ครั้งเดียว** (`check-diagrams.py`, `check-perm-matrix.js`, `check-action-caps.js`, `check-auth-events.js`, `check-api-design.py`) พร้อมพิสูจน์ว่าจับได้จริง (เปลี่ยนชื่อคอลัมน์แล้วฟ้อง, รันกับโค้ดก่อนแก้ต้องล้ม 4/5 สถานการณ์)
4. **ตัวตรวจดึงโค้ดจริงมารัน ไม่พิมพ์ซ้ำ** เพราะสำเนาจะผ่านทั้งที่ของจริงพัง
5. **ให้ test เทียบเอกสารกับโค้ดอัตโนมัติ** (`capabilities.ts` เทียบ `PERM` ของ prototype)
6. **`it.fails` เก็บ gap** พอแก้แล้ว test จะแดงเตือนให้ย้ายเข้าชุดปกติ
7. **ไฟล์ derived generate จากต้นทางเดียว** (ER/DFD/use case จาก `index-q.sql` และ prototype) กติกา "ห้ามแก้ใน draw.io ให้แก้ที่สคริปต์"
8. **ไม่ไล่แก้เลขของคนอื่นให้ตรง** ใส่ `STATUS:SUPERSEDED` ในหัวไฟล์แทน ตัดสินใจที่เอกสารที่คนอ่าน
9. **พิสูจน์ว่าการตรวจ "ล้มได้จริง"** (เพิ่ม schema โดยไม่สร้าง migration ให้ CI จับ, จงใจทำโค้ดผิดแล้วดูว่า test ล้ม)
10. **แยก worktree** สำหรับงานที่ไม่เกี่ยวกัน ไม่แตะไฟล์ค้างของ branch หลัก
11. **ไม่ลบของเก่าจนกว่าของใหม่ใช้งานได้จริง** (Tokyo ไม่ลบจนกว่า Singapore ทำงาน) · บอกก่อนว่าจะแก้ `.env` ตรงไหน ไม่พิมพ์ URL หรือรหัสผ่าน
12. **งานที่ย้อนกลับไม่ได้ให้คนกดเอง** (สร้าง/ลบโปรเจกต์ Supabase, authorize MCP, รหัส superuser)
13. **แบ่งงานให้เพื่อนผ่าน GitHub issue** พร้อมคู่มือและรายการคำสั่งที่ห้ามรัน
14. **PR ที่บอกตรง ๆ ว่าอะไรยังไม่ได้ทดสอบ** แทนการติ๊กทุกข้อ
15. **ตอบคำถามเชิงออกแบบด้วยข้อมูลจริง** (นับจาก `PERM`) พร้อมบอกข้อดีที่จะได้ ไม่เอนเอียงฝั่งเดียว
16. **เขียนเป้าหมาย ข้อจำกัด และวิธีพิสูจน์ก่อนลงมือ** (ดู `index-q-ux-pass.md` §1)

---

## 4. Checklist สำหรับโปรเจกต์อื่น

**ก่อนเริ่ม**
- [ ] เทียบ schema กับวัตถุประสงค์ทีละข้อ
- [ ] ล็อกกฎคำนวณ ใบคำนวณด้วยมือ และ baseline ก่อนเขียนโค้ด
- [ ] fishbone + 5 Why แล้วจับคู่ ราก → ฟีเจอร์
- [ ] ตัดสินเรื่องสิทธิ์ (บทบาท, ADMIN) และ section/offering ก่อนออกแบบ DB

**Day 0**
- [ ] `npm run setup` คำสั่งเดียวรันซ้ำได้ · `.gitattributes` · Node เวอร์ชันเดียวกันทุกที่ (เครื่อง, CI, Dockerfile)
- [ ] CI ที่ผ่านก่อน merge ได้เท่านั้น (branch protection) · pin action ด้วย SHA · `permissions` ขั้นต่ำ
- [ ] DB อยู่ region ใกล้ผู้ใช้ · session pooler · วัด latency สัปดาห์แรก · เปิด RLS (Supabase)
- [ ] `.env` ไม่เข้า Docker image · ไม่เก็บ URL เก่าพร้อมรหัสผ่านในไฟล์

**ระหว่างพัฒนา**
- [ ] ด่านสิทธิ์กลาง · token มี `typ` · ตอบ 404 · log ไม่รั่วข้อมูล
- [ ] ตัวตรวจเอกสาร ↔ โค้ดอัตโนมัติ
- [ ] จำนวนรอบไป-กลับของ DB ต่อ request (ใช้ `Promise.all`, endpoint รวม, bulk insert)
- [ ] DB test รันทีละไฟล์ หรือแยกข้อมูลของแต่ละไฟล์

**ทีม**
- [ ] commit ทีละเรื่อง ชื่อบอกสิ่งที่เปลี่ยนจริง · ไม่ปล่อยงานค้างจำนวนมาก
- [ ] แยก session ตามเฟส ก่อน context เต็ม
- [ ] เขียนคู่มือ "คำสั่งที่ห้ามรัน" ให้เพื่อนที่ใช้ DB ร่วมกัน

---

## 5. สิ่งที่ยังไม่ได้ทำ / ยังไม่ตรวจ

- ยังไม่ได้อ่านเต็มราว 15 session ช่วงวางแผน (เช่น Chapter 3 report review, UML folder in docs, System documentation and project scope, CMAS MySQL schema questions) และ session ช่วง dev ที่เหลือ
- ยังไม่ได้ยืนยันซ้ำกับโค้ดปัจจุบันว่าปัญหาที่ระบุว่า "แก้แล้ว" ยังคงแก้อยู่
- งานค้างจากบทสนทนา: DB ใหม่ว่าง (ยังไม่ copy ข้อมูลจาก Tokyo), โปรเจกต์ Tokyo ยังเปิดโล่ง, PR #38 รอเปิด Dependency graph, ช่องโหว่ HIGH 10 ตัวรอ task แยก, D-2/D-3 ยังไม่ตัดสิน
