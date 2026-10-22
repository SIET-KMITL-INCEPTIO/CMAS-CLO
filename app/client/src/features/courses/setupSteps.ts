/**
 * The state of each setup step (index-q.html `readiness`): pure, so the rules
 * are tested without a server. The step bar, its footer and the overview all
 * read this one table.
 */
import type { Activity, Criteria, CriteriaMeta } from "../activities/activity.types.ts"
import type { Clo } from "../clos/clo.types.ts"

export type StepState = "ok" | "warn" | "block" | "doing"
export type StepKey = "clo" | "obj" | "act" | "crit" | "roster"

export const READY: Record<StepState, { tone: "ok" | "warn" | "bad" | "info"; label: string }> = {
  ok: { tone: "ok", label: "เสร็จแล้ว" },
  warn: { tone: "warn", label: "ควรตรวจสอบ" },
  block: { tone: "bad", label: "ยังไม่เสร็จ" },
  doing: { tone: "info", label: "กำลังทำ" },
}

const r2 = (v: number) => String(Math.round(v * 100) / 100)
const near = (a: number, b: number) => Math.abs(a - b) < 0.01

export type StepInputs = {
  clos: Clo[]
  criteria: Criteria & { meta: CriteriaMeta }
  activities: Activity[]
  students: number
}

export function stepStates(d: StepInputs): Record<StepKey, { state: StepState; detail: string }> {
  const { clos, criteria, activities } = d
  const objs = criteria.objectives
  const meta = criteria.meta
  const weightSum = clos.reduce((s, c) => s + (c.weight ?? 0), 0)
  const objCount = (cloId: string) => objs.filter((o) => o.cloId === cloId).length
  const objSum = (cloId: string) => meta.objectiveWeightSums[cloId] ?? 0
  const noObjClos = clos.filter((c) => objCount(c.id) === 0)
  const badObjClos = clos.filter((c) => objCount(c.id) > 0 && !near(objSum(c.id), 100))
  const actSum = meta.totalWeight
  const rowSum = (id: string) => meta.activityWeightSums[id] ?? 0
  const badRows = criteria.activities.filter((a) => !near(rowSum(a.id), 100))
  const unlinked = criteria.activities.filter((a) => meta.unlinkedActivityIds.includes(a.id))
  const unmeasured = objs.filter((o) => meta.unmeasuredObjectiveIds.includes(o.id))
  // E2: planned against computed; 0.5% apart or more warns.
  const gap = clos.filter((c) => c.weight !== null && Math.abs(c.weight - c.computedWeight) >= 0.5)
  const enrolled = activities[0]?.studentCount ?? d.students
  const filled = activities.reduce((s, a) => s + a.scoredCount, 0)
  const cells = enrolled * activities.length

  return {
    clo: {
      state: clos.length === 0 ? "block" : near(weightSum, 100) ? "ok" : "warn",
      detail:
        clos.length === 0
          ? "ยังไม่มี CLO — ระบบคำนวณผลไม่ได้"
          : `${clos.length} ข้อ · น้ำหนักตามแผนรวม ${r2(weightSum)}%` +
            (near(weightSum, 100) ? "" : " (ควรเท่ากับ 100%)"),
    },
    obj: {
      state: objs.length === 0 || badObjClos.length ? "block" : noObjClos.length ? "warn" : "ok",
      detail:
        clos.length === 0
          ? "รอ CLO ก่อน"
          : objs.length === 0
            ? "ยังไม่มีจุดประสงค์ — แตก CLO แต่ละข้อเป็นจุดประสงค์ที่วัดได้"
            : badObjClos.length
              ? "น้ำหนักจุดประสงค์ยังไม่ครบ 100% — " +
                badObjClos.map((c) => `CLO ${c.number} รวม ${r2(objSum(c.id))}%`).join(" · ")
              : noObjClos.length
                ? `CLO ${noObjClos.map((c) => c.number).join(", ")} ยังไม่มีจุดประสงค์ — ข้ออื่นคำนวณได้ตามปกติ`
                : `${objs.length} ข้อ · น้ำหนักครบ 100% ทุก CLO`,
    },
    // Q3: activity weights not summing to 100 lock the results — a block, not a warning.
    act: {
      state: activities.length === 0 || !near(actSum, 100) ? "block" : "ok",
      detail:
        activities.length === 0
          ? "ยังไม่มีกิจกรรม"
          : `${activities.length} กิจกรรม · สัดส่วนรวม ${r2(actSum)}%` +
            (near(actSum, 100) ? "" : " (ต้องเท่ากับ 100%)"),
    },
    crit: {
      state:
        activities.length === 0 || objs.length === 0
          ? "block"
          : badRows.length || unmeasured.length
            ? "block"
            : gap.length
              ? "warn"
              : "ok",
      detail:
        activities.length === 0
          ? "รอสร้างกิจกรรมก่อน"
          : objs.length === 0
            ? "รอกำหนดจุดประสงค์ก่อน"
            : unlinked.length
              ? `${unlinked.map((a) => a.name).join(" · ")} ยังไม่ได้ผูก CLO — ทุกกิจกรรมต้องวัดอย่างน้อย 1 ข้อ`
              : badRows.length
                ? "สัดส่วนยังไม่ครบ 100% — " +
                  badRows.map((a) => `${a.name} รวมได้ ${r2(rowSum(a.id))}%`).join(" · ")
                : unmeasured.length
                  ? `จุดประสงค์ ${unmeasured.map((o) => o.label).join(", ")} ยังไม่มีกิจกรรมวัด`
                  : gap.length
                    ? "น้ำหนัก CLO ตามแผนไม่ตรงกับที่คำนวณจากกิจกรรม — " +
                      gap
                        .map(
                          (c) =>
                            `CLO ${c.number} ตามแผน ${r2(c.weight ?? 0)}% · คำนวณได้ ${r2(c.computedWeight)}%`,
                        )
                        .join(" · ")
                    : "ทุกกิจกรรมผูก CLO ครบ และน้ำหนัก CLO ตรงกับแผน",
    },
    roster: {
      state:
        d.students === 0 || activities.length === 0 ? "block" : filled >= cells ? "ok" : "doing",
      detail:
        d.students === 0
          ? "ยังไม่มีรายชื่อ — เพิ่มทีละคนหรือนำเข้าจาก Excel"
          : activities.length === 0
            ? `${d.students} คน · รอสร้างกิจกรรมก่อนกรอกคะแนน`
            : `${d.students} คน · กรอกคะแนนแล้ว ${filled} / ${cells} ช่อง`,
    },
  }
}
