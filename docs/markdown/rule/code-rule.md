# Code Rules — CMAS (ทีม 3 คน)

See also: [[git-rule]] · [[security-rule]] · [[features-pages]] · [[dev]]

> **Scope:** กฎการเขียนโค้ดของโปรเจกต์ CMAS (Course-level Learning Outcome Assessment & Tracking System) — ทีม 3 คน (67030098 / 67030110 / 67030120) เขียนทับ/เสริมจาก [[dev]] ให้เข้มงวดขึ้นในสองเรื่องหลัก: **OOP** และ **1 ไฟล์ : 1 หน้าที่**

---

## 1. หลักการหลัก

1. **OOP-first** — logic ที่มีสถานะ (state) หรือ dependency (เช่น Prisma client, config) ต้องอยู่ใน **class** เสมอ ห้ามกระจาย logic ไว้เป็นฟังก์ชันลอยในไฟล์เดียวกันหลายตัว
2. **1 File : 1 Function/Class** — ไฟล์หนึ่งไฟล์ต้อง export ของอย่างเดียวเป็น "หน่วยหลัก" (1 class หรือ 1 pure function เท่านั้น) ชื่อไฟล์ = ชื่อสิ่งที่ export
3. **Single Responsibility** — ทุก class มีหน้าที่เดียว ทุก method ทำสิ่งเดียว ถ้าเมธอดเริ่มยาวเกิน ~30 บรรทัด หรือมีมากกว่า 1 เหตุผลที่จะแก้ไข ให้แตกออก
4. **ห้าม default export** — ใช้ named export เท่านั้น (ยกเว้น React Route lazy-loaded files ที่ framework บังคับ)

---

## 2. โครงสร้าง "1 ไฟล์ : 1 หน้าที่"

### 2.1 กติกาไฟล์

| ประเภทของ | อยู่ใน 1 ไฟล์ | ชื่อไฟล์ |
|---|---|---|
| Class (Service / Controller / Repository) | 1 class ต่อไฟล์ | `kebab-case.<layer>.ts` export class `PascalCase` (เช่น `courses.service.ts` → `CourseService`) — ดู [[dev]] §4.2 |
| Pure function (helper / computation) | 1 function ต่อไฟล์ | `camelCase.ts` ตรงกับชื่อ function |
| React Component | 1 component ต่อไฟล์ | `PascalCase.tsx` |
| React Hook | 1 hook ต่อไฟล์ | `useXxx.ts` |
| Type/Interface ของ entity เดียว | อยู่รวมกันได้ถ้าเป็น type ของ entity เดียวกัน (เช่น `CourseInput`, `CourseResponse` ใน `course.types.ts`) | `camelCase.types.ts` |

```typescript
// ❌ ผิด — 2 ฟังก์ชันไม่เกี่ยวข้องกันอยู่ไฟล์เดียว
// utils.ts
export function computeCloScore() { ... }
export function formatDate() { ... }

// ✅ ถูก — แยกไฟล์ตามหน้าที่
// computation/computeCloScore.ts
export function computeCloScore(input: CloScoreInput): number | null { ... }

// utils/formatDate.ts
export function formatDate(date: Date): string { ... }
```

```typescript
// ❌ ผิด — class ใหญ่ทำหลายหน้าที่ (score + excel + email)
export class CourseService {
  computeScore() { ... }
  exportExcel() { ... }
  sendEmail() { ... }
}

// ✅ ถูก — แยกเป็นคนละ class คนละไฟล์ ประกอบกันด้วย composition
// services/CourseService.ts
export class CourseService {
  constructor(
    private readonly scoreService: ScoreService,
    private readonly excelService: ExcelService,
  ) {}
}
```

### 2.2 ข้อยกเว้นที่อนุญาต

- `index.ts` — ใช้ re-export รวม module เท่านั้น (barrel file) ห้ามมี logic
- `*.types.ts` — รวม type ที่เกี่ยวข้องกับ entity เดียวกันได้
- `*.test.ts` — รวม test case หลายเคสของหน่วยเดียวกันได้
- `constants.ts` — รวม constant ที่เกี่ยวข้องกันได้ (เช่น `CLO_COLORS`, `MAX_CLO_COUNT`)

---

## 3. OOP Layer Pattern (Backend — Fastify)

ทุก endpoint ไหลผ่าน 4 ชั้น class เสมอ ห้ามข้ามชั้น:

```
Route (ลงทะเบียน path)
  → Controller class (รับ/ส่ง request-response เท่านั้น ไม่มี logic)
    → Service class (business logic ทั้งหมด)
      → Repository class (คุยกับ Prisma เท่านั้น — ไม่มี business rule)
```

```typescript
// modules/courses/course.repository.ts — 1 class, คุยกับ DB อย่างเดียว
export class CourseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.course.findUniqueOrThrow({ where: { id } })
  }

  listByInstructor(instructorId: string) {
    return this.prisma.course.findMany({ where: { instructorId } })
  }
}

// modules/courses/courses.service.ts — 1 class, business logic
export class CourseService {
  constructor(private readonly courseRepo: CourseRepository) {}

  async getCourseOverview(courseId: string) {
    const course = await this.courseRepo.findById(courseId)
    // business rule ต่างๆ อยู่ตรงนี้
    return course
  }
}

// modules/courses/courses.controller.ts — 1 class, ผอมมาก
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  getOverview = async (
    request: FastifyRequest<{ Params: { courseId: string } }>,
    reply: FastifyReply,
  ) => {
    const data = await this.courseService.getCourseOverview(request.params.courseId)
    return ok(reply, data)   // lib/response.ts
  }
}
```

- **ห้าม** เรียก `prisma.*` ตรงๆ ใน Service หรือ Controller — ต้องผ่าน Repository เท่านั้น
- **ห้าม** เขียน business rule ใน Repository — Repository คืน data ดิบเท่านั้น
- Constructor injection เท่านั้น (ไม่ใช้ Service Locator / global singleton ที่ซ่อน dependency)

---

## 4. OOP Pattern (Frontend — React)

React component ยังคงเป็น function component (ตาม [[dev]] §6.1) — "OOP" ฝั่ง frontend ใช้กับ **domain logic / API client** เท่านั้น ไม่ใช้กับ component:

```typescript
// api/CourseApiClient.ts — 1 class ต่อ 1 resource
export class CourseApiClient {
  constructor(private readonly http: ApiClient) {}

  list() {
    return this.http.get<CourseResponse[]>("/courses")
  }

  create(input: CreateCourseInput) {
    return this.http.post<CourseResponse>("/courses", input)
  }
}
```

```
DO    ใช้ class สำหรับ: API client, store logic ที่ซับซ้อน, computation ที่มี config/state
DO    ใช้ function component + hook สำหรับ UI ทั้งหมด (ตาม dev.md)
DON'T สร้าง class component
DON'T ใส่ business logic ไว้ใน component — เรียกผ่าน hook → class/service เท่านั้น
```

---

## 5. Naming — เสริมจาก [[dev]] §4

| ประเภท | รูปแบบ | ตัวอย่าง |
|---|---|---|
| Class | `PascalCase` + suffix บอกบทบาท | `CourseService`, `CourseRepository`, `CourseController` |
| Interface สำหรับ dependency (ถ้าจำเป็น) | `PascalCase` ไม่ใช้ `I` prefix | `CourseRepositoryContract` (ใช้เท่าที่จำเป็นจริงๆ เท่านั้น) |
| Pure function file | ชื่อไฟล์ = ชื่อฟังก์ชัน | `computeCloScore.ts` → `export function computeCloScore()` |
| Private field | `private readonly` + camelCase | `private readonly prisma: PrismaClient` |

---

## 6. Code Review Checklist (เพิ่มเติมจาก [[dev]] §13)

- [ ] ไฟล์นี้ export **สิ่งเดียว** เท่านั้น (1 class หรือ 1 function)
- [ ] ชื่อไฟล์ตรงกับชื่อ class/function ที่ export
- [ ] ไม่มี business logic หลุดเข้าไปใน Controller หรือ Repository
- [ ] Service ไม่เรียก `prisma` ตรงๆ (ต้องผ่าน Repository)
- [ ] Class ใหม่มี dependency ชัดเจนผ่าน constructor เท่านั้น
- [ ] ไม่มี default export (ยกเว้น route lazy-load ที่ framework บังคับ)

---

## 7. การรายงานงาน (บังคับทุกคน)

> ทีมนี้มี 3 คน ทุกคนต้อง **รายงานทุก task ที่ทำเสร็จกลับให้เจ้าของโปรเจกต์ (Project Owner)** — ไม่ใช่แค่เปิด PR เฉยๆ

**กติกา:**

1. ก่อนเริ่ม task ใหม่ — แจ้งในกลุ่มทีมว่ากำลังทำอะไร (ชื่อ feature/บั๊ก + branch)
2. เมื่อ task เสร็จ (commit + push + เปิด PR แล้ว) — ต้องส่งรายงานสรุปให้เจ้าของโปรเจกต์ ประกอบด้วย:
   - Task/Feature ที่ทำ
   - ไฟล์/module ที่แก้ไข (list สั้นๆ)
   - ลิงก์ PR
   - สถานะ (รอ review / ติด blocker / เสร็จสมบูรณ์)
3. ถ้าเจอ blocker หรือ decision ที่กระทบ scope/architecture — ต้องรายงานทันที ไม่ต้องรอจน task เสร็จ
4. สรุปงานรายสัปดาห์ (weekly) ส่งให้เจ้าของโปรเจกต์ทุกสัปดาห์ แม้ไม่มี PR ใหม่ก็ต้องแจ้งความคืบหน้า

**เหตุผล:** โปรเจกต์นี้มีเจ้าของ (Project Owner) ที่ต้องติดตามภาพรวมทั้งหมดของทีม 3 คน การรายงานสม่ำเสมอช่วยให้ตัดสินใจเรื่อง scope/timeline ได้ทันเวลา ไม่ใช่มารู้ตอนใกล้ deadline

---

_เอกสารนี้มีผลบังคับใช้ร่วมกับ [[dev]] และ [[git-rule]] — หากขัดแย้งกัน ให้เอกสารนี้ (code-rule) เป็นหลักในเรื่อง OOP/file structure_
