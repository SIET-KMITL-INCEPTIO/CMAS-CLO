See also: [[dev]] · [[Summary Project]] · [[concept-clo MOC]]

> ⚠️ **สรุปย่อเท่านั้น — ของจริงอยู่ที่ `database/schema.prisma`**
> ไฟล์นี้เคยหลุดจากของจริงมาแล้ว (เช่นเคยมี `Curriculum.createdBy` ที่ไม่มีอยู่จริง)
> ถ้าสองไฟล์ขัดกัน ให้ยึด `schema.prisma` เสมอ
> DDL ที่ใช้งานจริง: [`mysql/cmas_app_production.sql`](./mysql/cmas_app_production.sql)

```sql
enum Role { ADMIN  INSTRUCTOR }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  role         Role     @default(INSTRUCTOR)
  isActive     Boolean  @default(true)
  courses      Course[]
  createdAt    DateTime @default(now())
}

model Curriculum {
  id          String             @id @default(cuid())
  name        String
  year        Int
  institution String
  courses     CurriculumCourse[]
  clonedFrom  String?
  createdBy   User               @relation(...)
}

model CurriculumCourse {
  id           String       @id @default(cuid())
  curriculum   Curriculum   @relation(...)
  courseCode   String
  courseName   String
  credits      Int
}

model Course {
  id          String     @id @default(cuid())
  code        String
  name        String
  semester    Int
  year        Int
  section     String     @default("01")   // แยกกลุ่มเรียน (เดิม instructorId ทำหน้าที่นี้)
  instructors CourseInstructor[]          // M:N — สอนร่วมกันได้หลายคน
  clos        CLO[]
  students    Student[]
  activities  Activity[]
  @@unique([code, semester, year, section])
}

// อาจารย์หลายคน สอนได้หลายวิชา — role เป็นคุณสมบัติของ "คู่"
// จึงต้องเป็นตาราง ไม่ใช่ FK สองตัว
model CourseInstructor {
  id       String     @id @default(cuid())
  course   Course     @relation(...)
  user     User       @relation(...)
  role     CourseRole @default(CO)        // LEAD | CO | ASSISTANT
  @@unique([courseId, userId])
}

model CLO {
  id          String               @id @default(cuid())
  courseId    String
  course      Course               @relation(...)
  number      Int                  // ลำดับที่ (drag-reorder อัปเดตค่านี้)
  description String
  threshold   Float @default(60)
  objectives  BehavioralObjective[]
  criteria    AssessmentCriteria[]
}

model Activity {
  id        String               @id @default(cuid())
  courseId  String
  course    Course               @relation(...)
  name      String
  method    String
  maxScore  Float
  order     Int                  // drag-reorder อัปเดตค่านี้
  weight    Float
  criteria  AssessmentCriteria[]
  scores    Score[]
}

model AssessmentCriteria {
  id         String   @id @default(cuid())
  activityId String
  activity   Activity @relation(...)
  cloId      String
  clo        CLO      @relation(...)
  weight     Float
  @@unique([activityId, cloId])
}

model Student {
  id          String  @id @default(cuid())
  studentCode String
  name        String
  courseId    String
  course      Course  @relation(...)
  scores      Score[]
  @@unique([studentCode, courseId])
}

model Score {
  id         String   @id @default(cuid())
  studentId  String
  student    Student  @relation(...)
  activityId String
  activity   Activity @relation(...)
  score      Float
  uploadedAt DateTime @default(now())
  @@unique([studentId, activityId])
}

model ScoreUploadLog {
  id         String   @id @default(cuid())
  courseId   String
  uploadedBy String
  fileName   String
  recordsOk  Int
  recordsFail Int
  createdAt  DateTime @default(now())
}
```

