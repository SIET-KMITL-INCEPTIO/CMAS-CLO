# หลักฐานรายงานความก้าวหน้า ครั้งที่ 4 (22 ต.ค. 2026)

## หน้าจอต้นแบบ (แทนหน้าจอจริง) — `docs/pages/index-q.html`
| ไฟล์ | หน้า |
|---|---|
| proto-06-courses.jpg | จัดการรายวิชา |
| proto-01-overview.jpg | ภาพรวมรายวิชา + ผู้ผ่านราย CLO |
| proto-02-clo.jpg | กำหนด CLO |
| proto-03-activities.jpg | กิจกรรมและวิธีประเมิน |
| proto-04-roster-scores.jpg | นักศึกษาและคะแนน (นำเข้า/ส่งออก Excel) |
| proto-05-grading.jpg | การตัดเกรด |

## ผลทดสอบ client ↔ server (ภาพ console)
ทดสอบ 22 ต.ค. 2026 ด้วย `npm run dev` (client :5173, server :3001) แล้วยิง `curl` ไปที่ server แต่ละคำสั่งมีภาพคู่ (ฝั่ง curl + log ฝั่ง server)

| API | ผลที่คาด | ผลจริง | ภาพ curl | ภาพ log server |
|---|---|---|---|---|
| `GET /api/v1/health` | 200 | 200 · 6.0 ms | console-01-curl-health.png | console-02-server-log-health-200.png |
| `GET /api/v1/users` (ไม่มี token) | 401 | 401 · 9.8 ms | console-03-curl-users.png | console-04-server-log-users-401.png |
| `GET /api/v1/courses` | 404 (ยังไม่ทำ API) | 404 · 5.3 ms | console-05-curl-courses.png | console-06-server-log-courses-404.png |

หมายเหตุ: แต่ละภาพ log เป็นการรัน `npm run dev` คนละรอบ จึงมี `reqId: req-1` ซ้ำกัน

## ยิง API จริงครบทุก endpoint (branch `feature/api-endpoints`)
- `api-smoke-output.txt` — HTTP จริง 78 ครั้งครอบคลุม 72 endpoint ในขอบเขต กับฐานข้อมูล Supabase จริง ผ่าน 78/78 ทั้งสองรอบ
  - รอบ A ใช้ `.env` ปัจจุบัน (transaction pooler :6543 + `pgbouncer=true`) — 2–12 วินาทีต่อ request
  - รอบ B ใช้ session pooler :5432 — เร็วขึ้นราว 2–3 เท่า
- `api-smoke-server-log.txt` — log ฝั่ง server ของรอบ B: `incoming request` → `db query` → `request completed` ทุก request (ไม่มี token ไม่มีค่าของ query)
- ข้อมูลทดสอบ (`@cmas.test`, `TEST-`) ถูกลบหลังจบทุกรอบ

## ผลทดสอบอัตโนมัติ
- `unit-test-output.txt` — `npm run test` ทั้ง client และ server: server 134 ผ่าน / 5 ข้าม, client 6 ผ่าน
- `client-server-test-output.txt` — เรียก API จริง (`/health` 200, `/users` 401 เมื่อไม่มี token, `/courses` 404 เพราะยังไม่ทำ) พร้อมตรวจ CORS ของ client :5173

## ข้อจำกัด
- `/health` ไม่ได้แตะฐานข้อมูล จึงยังไม่ยืนยันการเชื่อม Supabase ด้วยข้อมูลจริง
- `course-scope.isolation.test.ts` (5 เทสต์) ถูกข้าม
