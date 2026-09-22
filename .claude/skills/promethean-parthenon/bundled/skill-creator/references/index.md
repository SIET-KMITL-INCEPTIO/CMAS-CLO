ไฟล์นี้เป็น registry ของ sub-skills ทั้งหมดที่ถูก forge มาจาก project-problem-solver
เมื่อเกิดปัญหาใหม่และแก้ไขแล้ว ให้เพิ่ม entry ที่นี่เสมอ

---

## How to Use

1. ค้นหาจาก **Trigger / Error** ว่าตรงกับปัญหาที่เจออยู่ไหม
2. ถ้าใช่ → เปิด skill นั้นและทำตาม steps ได้เลย
3. ถ้าไม่มี → ใช้ `project-problem-solver` เพื่อ debug และ forge skill ใหม่

---

## Registry

| Skill Name                                  | Trigger / Error Message | Category | File |
| ------------------------------------------- | ----------------------- | -------- | ---- |
| *(ยังไม่มี — เพิ่มหลังจาก forge skill แรก)* |                         |          |      |

---

## Categories

| Category | ใช้เมื่อ |
|---|---|
| `bug-fix` | logic error, off-by-one, null pointer, wrong output |
| `env-setup` | version mismatch, missing env var, path issue |
| `dependency` | broken package, API change, lockfile drift |
| `config` | wrong setting, missing secret, port conflict |
| `performance` | slow query, memory leak, infinite loop |
| `build` | compile error, missing asset, broken pipeline |
| `test` | flaky test, missing fixture, wrong mock |

---

## How to Add a New Entry

หลังจาก forge sub-skill แล้ว เพิ่มบรรทัดในตาราง Registry ด้านบน:

```
| `<skill-name>` | `<exact error or symptom>` | `<category>` | `skills/<skill-name>/SKILL.md` |
```
