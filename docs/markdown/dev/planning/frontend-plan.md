# แผนหน้าจอจริง — ทำ React ให้เหมือน `index-q.html` บน API ที่เสร็จแล้ว

See also: [[prototype-to-app]] · [[features-pages]] · [[user-flow]] · [[api-design]] · [[sprint-plan-2026]] · [[system-test-plan]]

> **สร้าง:** 2026-10-22 · **branch:** `feature/frontend-index-q` (แตกจาก `feature/api-endpoints` ที่ API ครบ 72/72)
> **เป้าหมาย:** ทุกหน้าของแอปมีหน้าตา flow และข้อความเหมือน `docs/pages/index-q.html` · ข้อมูลทุกตัวมาจาก API · ไม่คำนวณคะแนนหรือเกรดในเบราว์เซอร์ (FR-88)
> **หลักที่ใช้ทุกหน้า:** ข้อความสั้น ตัวเลขแต่ละตัวแสดงที่เดียว ไม่เพิ่มฟีเจอร์ที่ต้นแบบไม่มี (เป้าหมาย terse UI ของต้นแบบ, W1)

---

## 1. จุดเริ่มต้น

| | ตอนนี้ | ต้องเป็น |
|---|---|---|
| หน้า | 4 route: `/` · `/auth/login` · `/admin/users` · `/courses` (หัวข้ออย่างเดียว) | 9 หน้าตามต้นแบบ + login + รออนุมัติ |
| Design system | Verdure (`styles/tokens.css`) | **Nocturnal Atelier v3.2** ของต้นแบบ — ตัดสินแล้ว (DS, [[prototype-to-app]] §5) |
| ฟอนต์ | IBM Plex Sans Thai อย่างเดียว | Inter + IBM Plex Sans Thai น้ำหนักไม่เกิน 600 |
| `lib/apiClient.ts` | ไม่มี `PUT`, ทิ้ง `meta`, toast ทุก error, ไม่ส่ง cookie, ไม่ต่ออายุ token | ดู §3.2 |
| สิทธิ์บนหน้าจอ | ไม่มี | ซ่อนปุ่มตาม capability เดียวกับ `PERM` (เซิร์ฟเวอร์ตรวจจริงทุก route อยู่แล้ว) |

## 2. แผนที่ route — hash ของต้นแบบ → path ของแอป

| ต้นแบบ | แอป | แท็บย่อย |
|---|---|---|
| `#courses` จัดการรายวิชา | `/courses` | — |
| `#overview/:c` ภาพรวม | `/courses/:courseId` | — |
| `#clos/:c` CLO | `/courses/:courseId/clos` | — |
| `#objectives/:c` จุดประสงค์ | `/courses/:courseId/objectives` | — |
| `#activities/:c` กิจกรรมและวิธีประเมิน | `/courses/:courseId/activities` | `?view=list` · `?view=matrix` (ตรวจการเชื่อมกับ CLO) |
| `#roster/:c` นักศึกษาและคะแนน | `/courses/:courseId/roster` | — |
| `#dashboard/:c` ผลรายนักศึกษา | `/courses/:courseId/results` | `?view=percent` · `?view=raw` |
| `#grading/:c` การตัดเกรด | `/courses/:courseId/grading` | — |
| `#users` จัดการผู้ใช้งาน | `/admin/users` (มีแล้ว) | ทั้งหมด · ผู้สอน · ผู้ดูแลระบบ · ระงับ |
| `#coverage` | **ไม่ทำ** — เครื่องมือตรวจต้นแบบ ([[prototype-to-app]] §2) | — |

แถบขั้นตอน 6 ขั้นของต้นแบบ (`STEP_HOME`) ชี้ไปที่ route ข้างบน: ผู้สอน → ตั้งค่ารายวิชา · CLO → `/clos` · จุดประสงค์ → `/objectives` ·
กิจกรรม → `/activities?view=list` · ตรวจการเชื่อม → `/activities?view=matrix` · นักศึกษาและคะแนน → `/roster`

## 3. งานฐาน (ทำก่อนทุกหน้า)

### 3.1 Shell — ตามโครงของต้นแบบ

| ส่วน | ในต้นแบบ | ไฟล์ในแอป |
|---|---|---|
| แถบบน: ค้นหา (Ctrl K) · ช่วยเหลือ `?` · เมนูบัญชี | `paletteBtn` · `acctBtn` | `components/shell/TopBar.tsx` |
| แถบไอคอนซ้าย: รายวิชา · จัดการรายวิชา · ผู้ใช้ (ADMIN) | rail | `components/shell/Rail.tsx` |
| รายการรายวิชาจัดตามภาค ปรับความกว้างได้ จำค่า (`--listw`) | list pane | `components/shell/CoursePane.tsx` |
| หน้าในรายวิชา + แถบขั้นตอน 6 ขั้น (ขั้นที่ต้องทำต่อมีเครื่องหมาย) | `stepList` · `nextStep` | `features/courses/CourseSteps.tsx` |
| Modal · Drawer · scrim · toast · tooltip `?` | `#modal` `#drawer` `#toasts` `#tipbox` | `components/overlay/*` + `sonner` |
| ตั้งค่าการแสดงผล: ขนาดตัวอักษร · ความหนาแน่นแถว (จำใน localStorage) | Principle 2 | `components/shell/DisplaySettings.tsx` (มีบางส่วนแล้วจาก PR #31) |

### 3.2 `lib/apiClient.ts`
- เพิ่ม `put` และคืน `{ data, meta }` แทน `data` อย่างเดียว
- **ไม่ toast ทุก error** ส่ง error ที่มี `status`, `message`, `errors` ให้หน้าตัดสินเอง (422 แสดงใต้ช่อง · 409 ของตารางคะแนนต้องแสดงช่องที่ชน)
- `credentials: "include"` และเมื่อได้ 401 ให้เรียก `POST /auth/refresh` ครั้งเดียว (single-flight) แล้วลองซ้ำ · ไม่ได้ → กลับหน้า login
- ดาวน์โหลดไฟล์ (`Content-Disposition`) และอัปโหลด `multipart` สำหรับ Excel

### 3.3 สิทธิ์บนหน้าจอ
`hooks/useCan.ts` คืน `can(cap)` จาก role ของ `/auth/me` + การเป็นผู้สอนของรายวิชา · ใช้ซ่อนปุ่มเท่านั้น
(ADMIN อ่านได้ทุกวิชาแต่ไม่เห็นปุ่มงานสอน — D-1) · ตารางเดียวกับ `capabilities.ts` ฝั่งเซิร์ฟเวอร์

### 3.4 Design tokens
ย้าย `tailwind.config` และ `:root` ของต้นแบบ (สี `ink` `edge` `wash` `sel` `ok/warn/bad/info` · radius 6–28 px · เงา 3 ระดับ · พื้นหลัง gradient)
เข้า `styles/tokens.css` แทน Verdure ทั้งชุด · ห้ามพิมพ์ค่า hex ในคอมโพเนนต์ ([[prototype-to-app]] §4 ข้อ 4)

## 4. หน้าเทียบ endpoint

| หน้า / ส่วนในต้นแบบ | endpoint ที่ใช้ | ช่องว่างของ API |
|---|---|---|
| **จัดการรายวิชา** (`viewCourses`) การ์ด/ตาราง จัดกลุ่มตามภาค ค้นหา | `GET /courses` | — |
| `modalCourse` สร้าง · แก้ · ตั้งค่า · ผู้สอน | `POST`/`PATCH /courses/:id` · `GET`/`POST`/`DELETE …/instructors` · `GET /users` (ADMIN เลือกผู้สอน) | ~~ผู้สอนเลือกเพื่อนร่วมสอนไม่ได้ เพราะ `GET /users` เป็นของ ADMIN~~ — **G1** ✅ ใช้ `GET /users/instructors?q=` |
| ทำสำเนา · ลบพร้อมผลกระทบ | `POST …/duplicate` · `GET …/impact` · `DELETE …?confirm=true` | — |
| **ภาพรวม** (`viewOverview`) การ์ดผ่านวิชา · เรดาร์ผู้ผ่านราย CLO · ผ่าน/ไม่ผ่านรายกิจกรรม · การกระจายคะแนนรวม · ขั้นถัดไป | `GET …/dashboard/attainment` · `GET …/dashboard/at-risk` · `GET …/criteria` (ความพร้อม) | การกระจายคะแนนรวม และผ่าน/ไม่ผ่านรายกิจกรรม ยังไม่มี — **G2** · ขั้นถัดไป คำนวณจาก meta ของ endpoint ที่มี (ไม่ใช่สูตรคะแนน) |
| **CLO** (`viewClos`) ลาก เรียง Bloom/SOLO น้ำหนักแผน vs คำนวณ | `GET`/`POST /courses/:id/clos` · `PATCH …/reorder` · `PATCH`/`DELETE /clos/:id` | — |
| **จุดประสงค์** (`viewObjectives`) แบ่งเท่ากัน | `GET`/`POST /clos/:id/objectives` · `PATCH`/`DELETE /objectives/:id` | "แบ่งเท่ากัน" = หลาย PATCH (ไม่มี bulk) ยอมรับได้ |
| **กิจกรรม** แท็บรายการ จัดกลุ่มตามประเภท น้ำหนักรายกลุ่ม ทำสำเนา | `GET`/`POST …/activities` · `PATCH …/reorder` · `PATCH`/`DELETE /activities/:id` · `POST …/duplicate` · `PUT …/group-weights` | — |
| **กิจกรรม** แท็บตรวจการเชื่อม (เมทริกซ์) | `GET`/`PUT /courses/:id/criteria` | — |
| **นักศึกษาและคะแนน** (`viewRoster`) ตารางกรอกคะแนน · วาง · เติมคะแนนเต็ม · เลิกทำ · ยกเว้น · ปิดรับ | `GET`/`PUT …/scores` (ส่ง `from`, `source`) · `POST /activities/:id/close|reopen` | — เลิกทำ = PUT ค่าเดิมกลับ `source: UNDO` |
| รายชื่อ: เพิ่ม · แก้ · ลบ · ถอน · คืนสถานะ | `POST …/students` · `PATCH`/`DELETE /students/:id` · `POST …/withdraw|restore` | — |
| `modalImport` 3 ขั้น (เลือกไฟล์ → ตรวจ → ยืนยัน) ทั้งรายชื่อและคะแนน · `modalErrReport` | `GET …/template` · `POST …/import/preview|commit` · `GET /uploads/:id/errors` | — |
| ประวัติการแก้คะแนน · `modalExcuse` | `GET …/score-changes` · `PUT …/scores` | — |
| `studentDrawer` รายบุคคล + แผนพัฒนาผู้เรียน | `GET …/dashboard/students/:sid` · `PUT`/`DELETE /students/:sid/remediation-plans/:cloId` | — |
| **ผลรายนักศึกษา** (`viewDashboard`) ตารางทั้งชั้น ร้อยละราย CLO · คะแนนดิบราย CLO · ส่งออกตารางสอบทาน | `GET …/dashboard/export` | ไม่มี endpoint ตารางทั้งชั้น (มีแต่รายคนและเฉพาะคนที่เสี่ยง) และไม่มี "คะแนนดิบราย CLO" — **G3** |
| **การตัดเกรด** (`viewGrading`) · `modalGrading` · `modalOverride` | `GET …/grading` · `PUT …/grade-bands` · `POST …/grading/run` · `DELETE …/grading` · `PUT`/`DELETE /students/:id/grade-override` · `GET …/grades/export` | — |
| **จัดการผู้ใช้งาน** (`viewUsers`) · `userDrawer` | `GET /users` · `GET`/`PATCH /users/:id` · `PATCH …/status` · `PATCH …/approve` · `GET …/auth-events` | — |
| `modalProfile` บัญชีของฉัน | `GET /auth/me` · `POST /auth/logout` | `modalPwChange` / `modalPwReset` ไม่ทำ (D-5) |
| `modalPalette` ค้นหา (Ctrl K) | `GET /courses?q=` + route ในแอป | ค้นนักศึกษาข้ามวิชาไม่ได้ — ค้นเฉพาะรายวิชาที่เปิดอยู่ (`GET …/students?q=`) ยอมรับได้ |
| แดชบอร์ดรวมทุกวิชา | `GET /dashboard/overview` | ช้าตามจำนวนวิชา (โหลดทีละวิชา) — **G4** |

### 4.1 ช่องว่างของ API ที่ต้องปิดก่อนทำหน้านั้น

| # | เพิ่มอะไร | ใช้ที่หน้า | หมายเหตุ |
|---|---|---|---|
| **G1** ✅ | `GET /users/instructors?q=` — ผู้สอนที่ใช้งานได้ (INSTRUCTOR · เปิดใช้ · ACTIVE) คืนแค่ id · ชื่อ · อีเมล สูงสุด 10 คน · สิทธิ์ `course.create` (ADMIN และผู้สอน) | ตั้งค่ารายวิชา › ผู้สอน | ไม่ส่งข้อมูลอื่นของบัญชี (A-9) |
| **G2** | เพิ่มใน `GET …/dashboard/attainment`: `activities[{id, passed, failed, pending}]` และ `distribution[{from, to, count}]` | ภาพรวม | คำนวณใน `lib/attainment.ts` ตัวเดียว (FR-88) |
| **G3** | `GET /courses/:courseId/dashboard/students` — ทุกคนในชั้น: คะแนนร้อยละและคะแนนดิบราย CLO · ผ่านกี่ CLO · คะแนนรวม · สถานะ | ผลรายนักศึกษา | ต้องนิยาม "คะแนนดิบราย CLO" จากต้นแบบ (`cloRaw`) ลง SRS ก่อน |
| **G4** | `GET /dashboard/overview` โหลดทุกวิชาในชุด query เดียว | หน้าแรกหลังล็อกอิน | ตอนนี้ราว 5 วินาทีต่อวิชา |

ทุกข้อเพิ่มแถวในชีตออกแบบ API ก่อน (`scripts/build-api-endpoints-workbook.py`) แล้วจึงเขียนโค้ด ตามกติกาของ [[api-design-plan]]

## 5. ลำดับงาน — หนึ่ง commit ต่อขั้น

แบ่งตามสิ่งที่ขั้นถัดไปต้องใช้ · ทุกขั้นจบด้วยการเทียบหน้าจอกับต้นแบบบนข้อมูลชุดเดียวกัน (ST-UI ใน [[system-test-plan]] §5.8)

| ขั้น | งาน | ต้องเสร็จก่อนเพราะ | ผ่านเมื่อ |
|---|---|---|---|
| **F0 ฐาน** ✅ | tokens Nocturnal Atelier · ฟอนต์ · shell (แถบบน · rail · รายการรายวิชา) · overlay · `apiClient` ใหม่ + refresh · `useCan` · route ใหม่ใน `pages.config.ts` · ค้นหา Ctrl K · การแสดงผล · ~~seed 4 รายวิชาจากต้นแบบ~~ ย้ายไป F1 | ทุกหน้าใช้ | ล็อกอินแล้วเห็น shell เหมือนต้นแบบ · token หมดอายุแล้วต่ออายุเองไม่เด้งออก |
| **F1 รายวิชา** ✅ | จัดการรายวิชา (การ์ด/ตาราง · จัดกลุ่ม 5 แบบ · ค้นหา) · `modalCourse` (`?new=1`) · ทำสำเนา · ลบพร้อมผลกระทบและวลียืนยัน · **G1** · `readiness.blockers` ใน `GET /courses` · seed 4 รายวิชาจากต้นแบบ (`database/seed-prototype.ts`) · แก้ CORS ให้ส่ง PATCH/PUT/DELETE ได้ | ทุกหน้าในรายวิชาต้องมีรายวิชา | สร้าง–แก้–ทำสำเนา–ลบได้ครบจากหน้าจอ · ADMIN ไม่เห็นปุ่มงานสอน |
| **F2 CLO และจุดประสงค์** ✅ | หน้า CLO (การ์ด · Bloom/SOLO · น้ำหนักตามแผนเทียบค่าคำนวณ · ใช้ค่าที่คำนวณได้ · เรียง · เกณฑ์ผ่าน CLO) · หน้าจุดประสงค์ (แบ่งเท่ากัน · กิจกรรมที่วัด) · แถบขั้นตอนบอกสถานะ + ปุ่มก่อนหน้า/ถัดไป · ตรวจบน Supabase แล้ว | กิจกรรมต้องผูกกับจุดประสงค์ | น้ำหนักแผนกับค่าคำนวณเตือนตรงกับต้นแบบ |
| **F3 กิจกรรม** ✅ | รายการตามประเภท · น้ำหนักรายกลุ่ม · เมทริกซ์ตรวจการเชื่อม | คะแนนต้องมีกิจกรรม | เมทริกซ์ครบ 100% → ขั้นที่ 5 ผ่าน เหมือนต้นแบบ | · ตรวจบน Supabase แล้ว · แก้ transaction timeout 30 วินาทีฝั่ง server (`PUT /group-weights` ล้มด้วย P2028 บน pooler)
| **F4 นักศึกษาและคะแนน** ✅ | ตารางคะแนน (คีย์บอร์ด · วาง · เติม · เลิกทำ · ยกเว้น · ปิดรับ) · รายชื่อ · นำเข้า/ส่งออก Excel · ประวัติ · `studentDrawer` | ผลและเกรดอ่านคะแนน | 409 แสดงช่องที่ชนและโหลดใหม่ได้ · ช่องว่างไม่กลายเป็น 0 (FR-62) | · ตรวจบน Supabase แล้ว · **ที่เหลือ:** คอลัมน์ รวม (%) และ `studentDrawer` รอ G3 (issue #33) เพราะคะแนนรวมคำนวณที่ server ที่เดียว (FR-88)
| **F5 ภาพรวมและผลรายนักศึกษา** | **G2 · G3** แล้วหน้าภาพรวม (recharts: เรดาร์ · แท่ง · histogram) · ผลรายนักศึกษา 2 แท็บ · ส่งออก | — | ทุกตัวเลขตรงกับต้นแบบบน seed เดียวกัน (ST-UI-8) |
| **F6 ตัดเกรด** | หน้าเกรด · `modalGrading` · `modalOverride` · ส่งออก | — | ตรึง → ปรับ → ยกเลิกปรับ → ยกเลิกตรึง ตรงกับต้นแบบ รวมวิชาอิงกลุ่มที่มีคนถอน |
| **F7 ผู้ใช้และบัญชี** | หน้าผู้ใช้ 4 แท็บ · `userDrawer` + ประวัติบัญชี · `modalProfile` · ค้นหา Ctrl K · `modalShortcuts` · **G4** | — | ADMIN อนุมัติ/ปิดบัญชี/เปลี่ยนบทบาทได้จากหน้าจอ |

F1 ถึง F4 ต่อกันตามลำดับ · F5 F6 F7 ทำขนานกันได้หลัง F4 · ตามกติกาของ [[api-design-plan]] §6 แต่ละขั้นควรเป็นหนึ่ง branch —
ถ้าทำใน `feature/frontend-index-q` branch เดียว ให้แยกหนึ่ง commit ต่อขั้นเพื่อย้อนทีละขั้นได้

## 6. วิธีตรวจ

- **เทียบกับต้นแบบ:** เปิด `index-q.html` คู่กับแอปบน seed 4 รายวิชาเดียวกัน (`database/seed.ts` ต้องย้ายข้อมูลตัวอย่างจาก `db` ของต้นแบบ) ภาพหน้าจอคู่กันเก็บใน `docs/evidence/`
- **component test** (Vitest + Testing Library) เฉพาะส่วนที่มีตรรกะ: ตารางคะแนน (คีย์บอร์ด วาง เลิกทำ 409) · ตัวนำเข้า · `apiClient` refresh
- **ตรวจในเบราว์เซอร์** ผ่าน preview ทุกขั้น: console ไม่มี error · มือถือ 375 px ไม่ล้น · ความต่างสีผ่าน (ST-UI-6, ST-UI-7)
- `npm run verify` ผ่านก่อนทุก commit

## 7. ความเสี่ยง

| ความเสี่ยง | ผล | ทางแก้ |
|---|---|---|
| request ช้า 2–5 วินาที (`pgbouncer=true` + โตเกียว) | ตารางคะแนนรู้สึกค้าง | เปลี่ยน `DATABASE_URL` เป็นพอร์ต 5432 · บันทึกแบบ optimistic แล้วแก้กลับเมื่อ error · ปุ่มบันทึกแสดงสถานะ |
| ตารางคะแนนซับซ้อนที่สุด (คีย์บอร์ด วาง เลิกทำ 409 ยกเว้น) | ใช้เวลาเกินขั้นอื่น | ทำ F4 ให้เสร็จก่อน F5–F7 · เขียน test ของตารางก่อนหน้าจอส่วนอื่น |
| G3 ยังไม่มีนิยามใน SRS | ตัวเลขคะแนนดิบราย CLO ไม่ตรงต้นแบบ | อ่านสูตร `cloRaw` จากต้นแบบแล้วเขียนเป็นข้อใน SRS ก่อนเขียนโค้ด |
| สลับ design system ทั้งชุด | หน้าที่มีอยู่ (`Users`, `Login`) เพี้ยนชั่วคราว | ทำใน F0 ครั้งเดียว แล้วไล่ปรับสองหน้านั้นในขั้นเดียวกัน |
| feature freeze อา. 13 ธ.ค. ([[sprint-plan-2026]]) | ไม่ทันครบ 7 ขั้น | ตัดตามลำดับ: F7 ค้นหา/ทางลัด → F5 histogram → F6 อิงกลุ่ม |
