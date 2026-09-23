#!/usr/bin/env node
/**
 * สร้าง docs/generated/project-plan.csv จากตาราง WBS ใน project-plan.md
 * รันใหม่ทุกครั้งที่แก้แผนงาน: `npm run plan:csv`
 *
 * ไฟล์ผลลัพธ์เป็น UTF-8 with BOM เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง ประกอบด้วย
 *   บรรทัดที่ 1  timestamp ว่าไฟล์นี้สร้างเมื่อไร
 *   บรรทัดที่ 2  หัวคอลัมน์ + ชื่อเดือน (เดือนละ 4 ช่องสัปดาห์)
 *   บรรทัดที่ 3  เลขสัปดาห์ 1–4 ของแต่ละเดือน
 *   บรรทัดที่ 4+ งานแต่ละแถว โดยช่องสัปดาห์ที่งานคาบเกี่ยวจะเป็น '█' (แถบ Gantt)
 *
 * นิยามสัปดาห์ในเดือน: 1 = วันที่ 1–7, 2 = 8–14, 3 = 15–21, 4 = 22–สิ้นเดือน
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE = join(root, "docs/markdown/dev/planning/project-plan.md")
const TARGET = join(root, "docs/generated/project-plan.csv")

/**
 * หัวคอลัมน์เขียนคำเต็มของอักษรย่อไว้ในหัวเลย เพื่อให้ไฟล์อ่านเข้าใจได้โดยไม่ต้องเปิด .md ควบ
 * (ระยะเวลานับเป็นวันตามปฏิทิน = วันที่เสร็จ − วันที่เริ่ม จึงเป็น 0 สำหรับงานหมุดหมายวันเดียว)
 */
const COLUMNS = [
  "ลำดับที่",
  "งาน/กิจกรรม",
  "ผู้รับผิดชอบ (ธ = ธีรณัฎฐ์ · น = นัจญมา · นู = นูรีน)",
  "วันที่เริ่ม (ด/ว/ป ค.ศ.)",
  "วันที่ต้องเสร็จ (ด/ว/ป ค.ศ.)",
  "ระยะเวลา (วัน)",
  "ร้อยละที่เสร็จ (%)",
]

/** ผู้รับผิดชอบที่รู้จัก — ใช้ตรวจว่าไม่มีอักษรย่อหลุดเข้ามา */
const PEOPLE = {
  ธ: "ธีรณัฎฐ์ (Dev A / Lead — Architect, Backend, สูตรคำนวณ)",
  น: "นัจญมา (Dev B — Frontend, CLO/Activity module)",
  นู: "นูรีน (Dev C — Frontend, Student/Score/Report module)",
}

/** สัญลักษณ์ที่ใช้ในคอลัมน์งาน/กิจกรรม และในแถบ Gantt */
const SYMBOLS = {
  "█": "ช่วงสัปดาห์ที่งานนั้นดำเนินอยู่ (แถบ Gantt)",
  "🚩": "หมุดหมาย — วันส่งรายงานความก้าวหน้าของรายวิชา เลื่อนไม่ได้",
  "⚠": "งานบังคับ ต้องเสร็จก่อนจึงจะเริ่มงานถัดไปได้ (blocker)",
  "✅": "งานที่เสร็จเรียบร้อยแล้ว",
}

/**
 * อักษรย่อทั้งหมดที่ปรากฏในคอลัมน์งาน/กิจกรรม
 * ถ้าเพิ่มอักษรย่อใหม่ในแผน ต้องเพิ่มที่นี่ด้วย — สคริปต์จะเตือนถ้าลืม
 */
const GLOSSARY = [
  ["CLO", "Course Learning Outcome — ผลลัพธ์การเรียนรู้ระดับรายวิชา"],
  ["PLO", "Program Learning Outcome — ผลลัพธ์การเรียนรู้ระดับหลักสูตร"],
  ["OBE", "Outcome-Based Education — การจัดการศึกษาที่มุ่งผลลัพธ์"],
  ["TQF", "Thai Qualifications Framework — กรอบมาตรฐานคุณวุฒิระดับอุดมศึกษา (มคอ.)"],
  ["มคอ.", "มาตรฐานคุณวุฒิระดับอุดมศึกษาแห่งชาติ — เอกสาร มคอ.2 / มคอ.3 / มคอ.5"],
  ["FR", "Functional Requirement — ความต้องการเชิงหน้าที่ (ดู srs.md §4)"],
  ["NFR", "Non-Functional Requirement — ความต้องการที่ไม่ใช่เชิงหน้าที่ (srs.md §6)"],
  ["CR", "Calculation Rule — กฎการคำนวณ CR-01…CR-07 (srs.md §8)"],
  ["UC", "Use Case — กรณีใช้งานตามแผนภาพ UML"],
  ["OI", "Open Issue — ประเด็นค้างที่ยังไม่ตัดสินใจ ต้อง sign-off ก่อนพัฒนา"],
  ["E-xx", "Evaluation Gap — ช่องว่างของการประเมิน (objectives-hypotheses-evaluation.md)"],
  ["H1–H7", "Hypothesis — สมมติฐานของโครงงานที่ต้องพิสูจน์ 7 ข้อ"],
  ["OBJ", "Objective — วัตถุประสงค์ของโครงงาน"],
  ["ER", "Entity-Relationship Diagram — แผนภาพความสัมพันธ์ระหว่างเอนทิตี"],
  ["DFD", "Data Flow Diagram — แผนภาพกระแสข้อมูล (L0 = Context, L1, L2)"],
  ["UML", "Unified Modeling Language — ภาษาสัญลักษณ์มาตรฐานสำหรับออกแบบระบบ"],
  ["SDLC", "Software Development Life Cycle — วงจรการพัฒนาซอฟต์แวร์"],
  ["UX/UI", "User Experience / User Interface — ประสบการณ์และส่วนต่อประสานผู้ใช้"],
  ["API", "Application Programming Interface — ช่องทางให้ระบบเรียกใช้กันผ่าน HTTP"],
  ["CRUD", "Create, Read, Update, Delete — การจัดการข้อมูลพื้นฐาน 4 อย่าง"],
  ["RBAC", "Role-Based Access Control — การให้สิทธิ์ตามบทบาทผู้ใช้"],
  ["JWT", "JSON Web Token — โทเคนที่ใช้ยืนยันตัวตนหลังเข้าสู่ระบบ"],
  ["ADMIN / INSTRUCTOR", "บทบาทผู้ใช้ 2 แบบในระบบ — ผู้ดูแลระบบ / อาจารย์ผู้สอน"],
  ["LEAD / CO / ASSISTANT", "บทบาทอาจารย์ในรายวิชา — ผู้รับผิดชอบหลัก / ผู้สอนร่วม / ผู้ช่วยสอน"],
  ["LETTER / PASS_FAIL", "รูปแบบการตัดเกรด — เกรดตัวอักษร (A–F) / ผ่าน-ไม่ผ่าน (S/U)"],
  ["at-risk", "นักศึกษาที่มีแนวโน้มไม่บรรลุ CLO ต้องได้รับการช่วยเหลือก่อนจบภาคเรียน"],
  ["attainment", "ระดับการบรรลุ CLO — สัดส่วนนักศึกษาที่ผ่านเกณฑ์ของ CLO นั้น"],
  ["baseline", "ตัวเลขตั้งต้นจากวิธีทำงานเดิม (Excel) ใช้เปรียบเทียบว่าระบบใหม่ดีขึ้นจริง"],
  ["Sprint", "รอบพัฒนา 2 สัปดาห์ จบด้วยโค้ดที่ merge แล้วและใช้งานได้จริง"],
  ["MUST", "ระดับความสำคัญสูงสุดของ FR — ไม่มีไม่ได้ ต้องเสร็จก่อนส่งมอบ"],
  ["IOC", "Index of Item-Objective Congruence — ค่าความสอดคล้องของข้อคำถามกับวัตถุประสงค์"],
  ["Likert", "มาตรวัดทัศนคติแบบ 5 ระดับ (น้อยที่สุด → มากที่สุด)"],
  ["S.D.", "Standard Deviation — ส่วนเบี่ยงเบนมาตรฐาน"],
  ["Black Box", "การทดสอบโดยดูเฉพาะผลลัพธ์ ไม่ดูโครงสร้างภายในโค้ด"],
  ["N+1", "ปัญหาการ query ฐานข้อมูลซ้ำเกินจำเป็น ทำให้ระบบช้า"],
  ["CI", "Continuous Integration — ระบบตรวจโค้ดอัตโนมัติทุกครั้งที่ push"],
  ["as-built", "เอกสารที่ปรับให้ตรงกับระบบจริงหลังพัฒนาเสร็จ (ตรงข้ามกับ as-designed)"],
  ["single-tenant", "ระบบติดตั้งให้ 1 หน่วยงานใช้ ไม่มีการแบ่งข้อมูลข้ามสถาบัน"],
]

const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
]

/** ช่วงเวลาที่ตารางเวลาครอบคลุม — ก.ค. 2026 ถึง มี.ค. 2027 */
const TIMELINE_START = { year: 2026, month: 6 } // 6 = ก.ค. (0-based)
const TIMELINE_END = { year: 2027, month: 2 } // 2 = มี.ค.
const WEEKS_PER_MONTH = 4
const BAR = "█"

/** `2026-08-04 22:51` ตามเวลาเครื่องที่รัน */
function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, "0")
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

function csvCell(value) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** รายการเดือนในไทม์ไลน์ เรียงจากต้นถึงปลาย */
function timelineMonths() {
  const months = []
  let { year, month } = TIMELINE_START
  while (year < TIMELINE_END.year || (year === TIMELINE_END.year && month <= TIMELINE_END.month)) {
    months.push({ year, month })
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
  }
  return months
}

/** แปลง `8/18/26` (M/D/YY) เป็น Date — คืน null ถ้ารูปแบบไม่ตรง */
function parsePlanDate(text) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(text.trim())
  if (!m) return null
  return new Date(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2]))
}

/** กลับด้านของ parsePlanDate — คืนรูปแบบ `8/18/26` ให้ตรงกับที่เขียนใน .md */
function fmtPlanDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}`
}

/** จำนวนวันตามปฏิทินระหว่างสองวัน — งานที่เริ่มและเสร็จวันเดียวกันได้ 0 (หมุดหมาย) */
function dayDiff(from, to) {
  return Math.round((to - from) / 86_400_000)
}

/** ช่วงวันที่ของสัปดาห์ที่ n (1-4) ในเดือนนั้น — สัปดาห์ที่ 4 กินถึงสิ้นเดือน */
function weekRange({ year, month }, week) {
  const from = new Date(year, month, (week - 1) * 7 + 1)
  const to =
    week === WEEKS_PER_MONTH
      ? new Date(year, month + 1, 0) // วันสุดท้ายของเดือน
      : new Date(year, month, week * 7)
  return { from, to }
}

/** แถบ Gantt ของงานหนึ่งแถว: '█' ในสัปดาห์ที่งานคาบเกี่ยว */
function ganttCells(startText, endText, months) {
  const start = parsePlanDate(startText)
  const end = parsePlanDate(endText)
  const cells = months.flatMap(() => Array(WEEKS_PER_MONTH).fill(""))
  if (!start || !end) return cells

  let i = 0
  for (const month of months) {
    for (let week = 1; week <= WEEKS_PER_MONTH; week += 1, i += 1) {
      const { from, to } = weekRange(month, week)
      if (start <= to && end >= from) cells[i] = BAR
    }
  }
  return cells
}

function parsePlan(markdown) {
  const rows = []
  const seenClo = new Set()

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^### (CLO \d) — (.+)$/)
    if (heading && !seenClo.has(heading[1])) {
      seenClo.add(heading[1])
      rows.push([heading[1], heading[2], "", "", "", "", ""])
      continue
    }

    if (!line.startsWith("|")) continue
    const cells = line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim())
    if (cells.length !== 8) continue // ไม่ใช่ตาราง WBS
    // เลขงาน: 1.1 · 4.2.2 · 4.2.2b (ตัวอักษรต่อท้าย = งานที่แทรกภายหลัง)
    if (!/^\*{0,2}\d+(\.\d+){1,2}[a-z]?\*{0,2}$/.test(cells[0])) continue // ข้ามหัวตาราง

    rows.push(cells.slice(0, 7).map((c) => c.replace(/\*\*|\[\[|\]\]/g, "")))
  }

  return rows
}

/**
 * เติมช่วงเวลาและร้อยละให้แถวหัวข้อ CLO จากงานลูก แทนที่จะปล่อยว่าง
 * ร้อยละ = ค่าเฉลี่ยถ่วงน้ำหนักด้วยจำนวนวันของ **งานหลัก (x.y)** เท่านั้น
 * ไม่นับงานย่อย (x.y.z) ซ้ำ มิฉะนั้นงานที่ซอยละเอียดจะมีน้ำหนักเกินจริง
 */
function fillCloRows(rows) {
  let head = null
  let members = []

  const close = () => {
    if (!head || members.length === 0) return
    const starts = members.map((m) => m.start).filter(Boolean)
    const ends = members.map((m) => m.end).filter(Boolean)
    const from = new Date(Math.min(...starts))
    const to = new Date(Math.max(...ends))
    const tops = members.filter((m) => m.top)
    const total = tops.reduce((sum, m) => sum + m.days, 0)
    const pct = total ? Math.round(tops.reduce((sum, m) => sum + m.days * m.pct, 0) / total) : 0
    head[2] = Object.keys(PEOPLE)
      .filter((person) => members.some((m) => m.who.includes(person)))
      .join(" ")
    head[3] = fmtPlanDate(from)
    head[4] = fmtPlanDate(to)
    head[5] = String(dayDiff(from, to))
    head[6] = `${pct}%`
  }

  for (const row of rows) {
    if (/^CLO \d$/.test(row[0])) {
      close()
      head = row
      members = []
      continue
    }
    const start = parsePlanDate(row[3])
    const end = parsePlanDate(row[4])
    if (!start || !end) continue
    members.push({
      start,
      end,
      who: row[2].split(/\s+/).filter(Boolean),
      days: dayDiff(start, end),
      pct: Number.parseInt(row[6], 10) || 0,
      // งานหลัก = เลข 2 ระดับ (2.4) · งานย่อย = 3 ระดับ (2.4.1 หรือ 4.4.0a)
      top: row[0].replace(/[a-z]$/, "").split(".").length === 2,
    })
  }
  close()
  return rows
}

/** ตรวจความสอดคล้องของตัวเลขก่อนเขียนไฟล์ — ผิดเมื่อไรให้ล้มทันที อย่าปล่อยไฟล์เสียออกไป */
function validate(rows) {
  const errors = []
  const parents = new Map()

  for (const [id, , who, s, e, dur] of rows) {
    if (/^CLO \d$/.test(id)) continue
    const start = parsePlanDate(s)
    const end = parsePlanDate(e)
    if (!start || !end) {
      errors.push(`${id}: วันที่ผิดรูปแบบ (${s} → ${e})`)
      continue
    }
    if (end < start) errors.push(`${id}: วันที่ต้องเสร็จมาก่อนวันที่เริ่ม`)
    const actual = dayDiff(start, end)
    if (String(actual) !== dur) errors.push(`${id}: ระยะเวลาเขียน ${dur} แต่ควรเป็น ${actual}`)
    for (const person of who.split(/\s+/).filter(Boolean)) {
      if (!(person in PEOPLE)) errors.push(`${id}: ผู้รับผิดชอบไม่รู้จัก "${person}"`)
    }

    const key = id.replace(/[a-z]$/, "")
    if (key.split(".").length === 2) parents.set(key, { start, end })
  }

  // งานย่อยต้องอยู่ในกรอบของงานหลัก และงานหลักต้องกว้างเท่ากรอบของงานย่อยพอดี
  for (const [key, parent] of parents) {
    const kids = rows
      .filter((r) => r[0].replace(/[a-z]$/, "").startsWith(`${key}.`))
      .map((r) => ({ id: r[0], start: parsePlanDate(r[3]), end: parsePlanDate(r[4]) }))
      .filter((k) => k.start && k.end)
    if (kids.length === 0) continue
    for (const kid of kids) {
      if (kid.start < parent.start) errors.push(`${kid.id}: เริ่มก่อนงานหลัก ${key}`)
      if (kid.end > parent.end) errors.push(`${kid.id}: เสร็จหลังงานหลัก ${key}`)
    }
    const first = new Date(Math.min(...kids.map((k) => +k.start)))
    const last = new Date(Math.max(...kids.map((k) => +k.end)))
    if (+first !== +parent.start)
      errors.push(
        `${key}: งานหลักเริ่ม ${fmtPlanDate(parent.start)} แต่งานย่อยเริ่ม ${fmtPlanDate(first)}`,
      )
    if (+last !== +parent.end)
      errors.push(
        `${key}: งานหลักเสร็จ ${fmtPlanDate(parent.end)} แต่งานย่อยเสร็จ ${fmtPlanDate(last)}`,
      )
  }

  return errors
}

const months = timelineMonths()
const rows = fillCloRows(parsePlan(readFileSync(SOURCE, "utf8")))
if (rows.length === 0) {
  console.error("ไม่พบตาราง WBS ใน project-plan.md — ยกเลิกการเขียนไฟล์")
  process.exit(1)
}

const errors = validate(rows)
if (errors.length > 0) {
  console.error(`พบข้อผิดพลาดในแผนงาน ${errors.length} จุด — ยกเลิกการเขียนไฟล์`)
  for (const error of errors) console.error(`  - ${error}`)
  console.error("แก้ที่ project-plan.md แล้วรันใหม่")
  process.exit(1)
}

const generatedAt = timestamp()
const pad = COLUMNS.map(() => "")

// บรรทัดที่ 2: ชื่อเดือนวางไว้ที่ช่องสัปดาห์แรกของเดือนนั้น
const monthHeader = [
  ...COLUMNS,
  ...months.flatMap(({ year, month }) => [
    `เดือน ${THAI_MONTHS[month]} ${String((year + 543) % 100).padStart(2, "0")}`,
    ...Array(WEEKS_PER_MONTH - 1).fill(""),
  ]),
]

// บรรทัดที่ 3: เลขสัปดาห์ 1–4 ซ้ำทุกเดือน
const weekHeader = [...pad, ...months.flatMap(() => ["1", "2", "3", "4"])]

const body = rows.map((row) => [...row, ...ganttCells(row[3], row[4], months)])

// ท้ายไฟล์: คำอธิบายอักษรย่อทั้งหมด เพื่อให้ CSV อ่านรู้เรื่องโดยไม่ต้องเปิดเอกสารอื่นควบ
// วางไว้ท้ายไฟล์ ไม่ใช่หัวไฟล์ เพื่อไม่ให้จำนวนแถวที่ต้องข้ามตอน import เปลี่ยนไป
const legend = [
  [],
  ["คำอธิบายสัญลักษณ์และอักษรย่อ"],
  ["สัญลักษณ์", "ความหมาย"],
  ...Object.entries(SYMBOLS),
  [],
  ["ผู้รับผิดชอบ", "ชื่อ-บทบาท"],
  ...Object.entries(PEOPLE),
  [],
  ["อักษรย่อ", "คำเต็มและความหมาย"],
  ...GLOSSARY,
  [],
  ["หมายเหตุ", "แถว CLO 1–5 คำนวณช่วงเวลาและร้อยละจากงานลูกอัตโนมัติ ไม่ได้กรอกมือ"],
  ["", "ร้อยละของ CLO = ค่าเฉลี่ยถ่วงน้ำหนักด้วยจำนวนวันของงานหลัก (เลข 2 ระดับ) เท่านั้น"],
  ["", "ระยะเวลา = วันที่ต้องเสร็จ − วันที่เริ่ม (วันตามปฏิทิน) งานหมุดหมายวันเดียวจึงเป็น 0"],
  ["", "ห้ามแก้ไฟล์ CSV โดยตรง — แก้ที่ project-plan.md แล้วรัน npm run plan:csv"],
]

const lines = [
  [
    `แผนงานโครงงาน CMAS — สร้างจาก project-plan.md เมื่อ ${generatedAt} (คำอธิบายอักษรย่ออยู่ท้ายไฟล์)`,
  ],
  monthHeader,
  weekHeader,
  ...body,
  ...legend,
].map((row) => row.map(csvCell).join(","))

// TARGET อยู่ใน docs/generated/ ซึ่ง gitignore ไว้ — clone ใหม่จะยังไม่มีโฟลเดอร์นี้
mkdirSync(dirname(TARGET), { recursive: true })
writeFileSync(TARGET, `﻿${lines.join("\r\n")}\r\n`, "utf8")

const undefinedTerms = GLOSSARY.filter(([term]) => {
  const probe = term.split(/[–—/]/)[0].trim().replace(/-xx$/, "-")
  return !rows.some((row) => row[1].includes(probe))
}).map(([term]) => term)

console.log(
  `เขียน ${TARGET} แล้ว — ${rows.length} แถว · ` +
    `ไทม์ไลน์ ${months.length} เดือน (${months.length * WEEKS_PER_MONTH} ช่องสัปดาห์) · ` +
    `อักษรย่อ ${GLOSSARY.length} รายการ · สร้างเมื่อ ${generatedAt}`,
)
if (undefinedTerms.length > 0) {
  console.warn(`อักษรย่อที่อธิบายไว้แต่ไม่ปรากฏในแผนแล้ว: ${undefinedTerms.join(", ")}`)
}
