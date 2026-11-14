#!/usr/bin/env node
/**
 * สร้างไฟล์ Word "สรุป Technology ที่ใช้ใน CMAS" ฉบับเพื่อนที่เพิ่งเริ่ม
 *
 *   node scripts/tech-stack-docx.mjs
 *
 * รูปแบบเลียนแบบเอกสารสรุปสอบ (หัวบทเป็นแถบสี, bullet ▪, ตาราง, ภาพลำดับขั้น, กล่องโค้ด)
 * ข้อความที่อยู่ในเครื่องหมายคำพูดภาษาอังกฤษคัดมาจากเว็บทางการของแต่ละเทคโนโลยี
 * (ดูรายการอ้างอิงท้ายไฟล์ REFS) เวอร์ชันมาจาก package.json / node_modules ของโปรเจกต์
 * ถ้าอัปเกรดแพ็กเกจ ให้แก้ตัวเลขใน STACK ให้ตรงกันแล้วรันใหม่
 */
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ExternalHyperlink,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const TARGET = join(root, "docs/word/CMAS-Tech-Stack-Starter.docx")

// ---------------------------------------------------------------------------
// รูปแบบ
// ---------------------------------------------------------------------------
const THAI = "TH Sarabun New"
const MONO = "Consolas"
const font = (name) => ({ ascii: name, hAnsi: name, cs: THAI, eastAsia: name })
const PT = (n) => n * 2
const PAGE_W = 11906
const MARGIN = 1134
const CONTENT_W = PAGE_W - 2 * MARGIN

const C = {
  blue: "1F5FAD",
  orange: "E8590C",
  purple: "5B47B0",
  green: "2E7D4F",
  teal: "0F7C8C",
  red: "B42318",
  gray: "6B7280",
  line: "D1D5DB",
  zebra: "F3F4F6",
  codeBg: "F5F7FA",
  quoteBg: "EEF4FB",
}
const CHAPTER_COLORS = [C.blue, C.orange, C.purple, C.green, C.teal, C.red, C.blue, C.orange]

/** ข้อความหนึ่งท่อน รองรับ **หนา** และ `โค้ด` */
function runs(text, base = {}) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith("**"))
        return new TextRun({
          text: chunk.slice(2, -2),
          bold: true,
          font: font(THAI),
          size: PT(15),
          ...base,
        })
      if (chunk.startsWith("`"))
        return new TextRun({
          text: chunk.slice(1, -1),
          font: font(MONO),
          size: PT(10),
          color: "1F3A68",
          ...base,
        })
      return new TextRun({ text: chunk, font: font(THAI), size: PT(15), ...base })
    })
}

const p = (text, opts = {}) =>
  new Paragraph({ spacing: { after: 60, line: 264 }, children: runs(text), ...opts })

const bullet = (text, level = 0) =>
  new Paragraph({
    indent: { left: 340 + level * 340, hanging: 300 },
    spacing: { after: 40, line: 264 },
    children: [
      new TextRun({ text: level ? "–\t" : "▪\t", font: font(THAI), size: PT(15) }),
      ...runs(text),
    ],
    tabStops: [{ type: "left", position: 340 + level * 340 }],
  })

let chapterNo = 0
let figureNo = 0
let sectionNo = 0
const chapter = (title) => {
  chapterNo += 1
  figureNo = 0
  sectionNo = 0
  return new Paragraph({
    pageBreakBefore: chapterNo > 1,
    shading: {
      type: ShadingType.CLEAR,
      color: "auto",
      fill: CHAPTER_COLORS[(chapterNo - 1) % CHAPTER_COLORS.length],
    },
    spacing: { before: 120, after: 160 },
    indent: { left: 60 },
    children: [
      new TextRun({
        text: `บทที่ ${chapterNo}  ${title}`,
        bold: true,
        color: "FFFFFF",
        font: font(THAI),
        size: PT(20),
      }),
    ],
  })
}

const h2 = (title, version) => {
  sectionNo += 1
  const color = CHAPTER_COLORS[(chapterNo - 1) % CHAPTER_COLORS.length]
  return new Paragraph({
    keepNext: true,
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 2 } },
    children: [
      new TextRun({
        text: `${chapterNo}.${sectionNo}  ${title}`,
        bold: true,
        color,
        font: font(THAI),
        size: PT(18),
      }),
      ...(version
        ? [new TextRun({ text: `   ${version}`, color: C.gray, font: font(THAI), size: PT(14) })]
        : []),
    ],
  })
}

/** กล่องคำนิยามจากเว็บทางการ: ภาษาอังกฤษตามต้นฉบับ + เลขอ้างอิง */
const quote = (english, ref) =>
  new Paragraph({
    shading: { type: ShadingType.CLEAR, color: "auto", fill: C.quoteBg },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: C.blue, space: 8 } },
    indent: { left: 200, right: 120 },
    spacing: { before: 60, after: 100 },
    children: [
      new TextRun({
        text: `“${english}”`,
        italics: true,
        font: font("Calibri"),
        size: PT(10.5),
        color: "1F2937",
      }),
      new TextRun({
        text: `  — เว็บทางการ [${ref}]`,
        font: font(THAI),
        size: PT(13),
        color: C.gray,
      }),
    ],
  })

const cellBorders = (color = C.line) => ({
  top: { style: BorderStyle.SINGLE, size: 4, color },
  bottom: { style: BorderStyle.SINGLE, size: 4, color },
  left: { style: BorderStyle.SINGLE, size: 4, color },
  right: { style: BorderStyle.SINGLE, size: 4, color },
})
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
}

/** ตาราง: แถวหัวสีตามบท แถวสลับสีเทาอ่อน */
function table(headers, rows, widths) {
  const color = CHAPTER_COLORS[(chapterNo - 1) % CHAPTER_COLORS.length]
  const total = widths.reduce((a, b) => a + b, 0)
  const cols = widths.map((w) => Math.round((w / total) * CONTENT_W))
  const cell = (text, i, fill, head) =>
    new TableCell({
      width: { size: cols[i], type: WidthType.DXA },
      shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
      borders: cellBorders(),
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: head ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: runs(text, head ? { bold: true, color: "FFFFFF" } : {}),
        }),
      ],
    })
  return [
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: cols,
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map((h, i) => cell(h, i, color, true)),
        }),
        ...rows.map(
          (r, ri) =>
            new TableRow({
              cantSplit: true,
              children: r.map((t, i) => cell(t, i, ri % 2 ? C.zebra : null)),
            }),
        ),
      ],
    }),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
  ]
}

/** กล่องโค้ด: พื้นเทา เส้นซ้ายสีน้ำเงิน — โค้ดจริงจากโปรเจกต์ */
function code(lines, file) {
  const paras = lines.map(
    (line) =>
      new Paragraph({
        spacing: { after: 0, line: 240 },
        children: [new TextRun({ text: line || " ", font: font(MONO), size: PT(9) })],
      }),
  )
  if (file)
    paras.unshift(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `ไฟล์: ${file}`, font: font(THAI), size: PT(12), color: C.gray }),
        ],
      }),
    )
  return [
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: CONTENT_W, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: C.codeBg },
              borders: {
                ...noBorders,
                left: { style: BorderStyle.SINGLE, size: 24, color: C.blue },
              },
              margins: { top: 80, bottom: 80, left: 160, right: 120 },
              children: paras,
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 80 }, children: [] }),
  ]
}

/** ภาพลำดับขั้น: กล่องสีต่อกันด้วยลูกศร + คำบรรยายใต้ภาพ */
function flow(boxes, caption) {
  figureNo += 1
  const palette = ["DBEAFE", "FFE8D6", "E9E3FF", "DCFCE7", "CFFAFE", "FEE2E2"]
  const edge = ["1F5FAD", "E8590C", "5B47B0", "2E7D4F", "0F7C8C", "B42318"]
  const arrowW = 360
  const boxW = Math.floor((CONTENT_W - arrowW * (boxes.length - 1)) / boxes.length)
  const cells = []
  const widths = []
  boxes.forEach((b, i) => {
    const [title, sub] = Array.isArray(b) ? b : [b, ""]
    widths.push(boxW)
    cells.push(
      new TableCell({
        width: { size: boxW, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: palette[i % palette.length] },
        borders: cellBorders(edge[i % edge.length]),
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: runs(title, { bold: true, size: PT(14) }),
          }),
          ...(sub
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: runs(sub, { size: PT(12), color: "374151" }),
                }),
              ]
            : []),
        ],
      }),
    )
    if (i < boxes.length - 1) {
      widths.push(arrowW)
      cells.push(
        new TableCell({
          width: { size: arrowW, type: WidthType.DXA },
          borders: noBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "➜",
                  font: font("Segoe UI Symbol"),
                  size: PT(14),
                  color: C.gray,
                }),
              ],
            }),
          ],
        }),
      )
    }
  })
  return [
    new Paragraph({ spacing: { before: 60 }, keepNext: true, children: [] }),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: widths,
      rows: [new TableRow({ cantSplit: true, children: cells })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 120 },
      children: runs(`ภาพ ${chapterNo}.${figureNo}  ${caption}`, { size: PT(13), color: C.gray }),
    }),
  ]
}

/** การ์ดเทคโนโลยีหนึ่งตัว: นิยามทางการ → แปลไทย → เปรียบเทียบ → ใช้ใน CMAS อย่างไร */
function tech({ name, version, ref, en, th, like, cmas = [], extra = [] }) {
  return [
    h2(name, version),
    quote(en, ref),
    bullet(`**แปลง่าย ๆ:** ${th}`),
    ...(like ? [bullet(`**เปรียบเหมือน:** ${like}`)] : []),
    ...cmas.map((t, i) => bullet(i === 0 ? `**ใน CMAS:** ${t}` : t)),
    ...extra,
  ]
}

// ---------------------------------------------------------------------------
// อ้างอิง (สืบค้นเมื่อ 4 พฤศจิกายน 2569)
// ---------------------------------------------------------------------------
const REFS = [
  ["React", "Quick Start", "react.dev", "https://react.dev/learn"],
  [
    "Microsoft",
    "TypeScript: JavaScript With Syntax For Types",
    "typescriptlang.org",
    "https://www.typescriptlang.org/",
  ],
  ["Vite", "Getting Started (v7)", "vite.dev", "https://v7.vite.dev/guide/"],
  ["Tailwind Labs", "Tailwind CSS", "tailwindcss.com", "https://tailwindcss.com/"],
  ["shadcn", "Introduction", "ui.shadcn.com", "https://ui.shadcn.com/docs"],
  ["Remix Software", "React Router Home", "reactrouter.com", "https://reactrouter.com/home"],
  [
    "TanStack",
    "TanStack Query: Overview",
    "tanstack.com",
    "https://tanstack.com/query/latest/docs/framework/react/overview",
  ],
  ["Poimandres", "Zustand", "zustand.docs.pmnd.rs", "https://zustand.docs.pmnd.rs/"],
  ["Recharts Group", "Recharts", "recharts.github.io", "https://recharts.github.io/"],
  ["E. Kowalski", "Sonner", "sonner.emilkowal.ski", "https://sonner.emilkowal.ski/"],
  ["OpenJS Foundation", "About Node.js", "nodejs.org", "https://nodejs.org/en/about"],
  [
    "npm, Inc.",
    "workspaces",
    "docs.npmjs.com",
    "https://docs.npmjs.com/cli/v11/using-npm/workspaces",
  ],
  [
    "Fastify",
    "Fast and low overhead web framework, for Node.js",
    "fastify.dev",
    "https://fastify.dev/",
  ],
  ["C. McDonnell", "Zod: Intro", "zod.dev", "https://zod.dev/"],
  [
    "M. Jones, J. Bradley, N. Sakimura",
    "RFC 7519: JSON Web Token (JWT)",
    "IETF",
    "https://www.rfc-editor.org/rfc/rfc7519",
  ],
  ["F. Skokan", "panva/jose", "GitHub", "https://github.com/panva/jose"],
  [
    "Google",
    "Sign in with Google for Web: Overview",
    "developers.google.com",
    "https://developers.google.com/identity/gsi/web/guides/overview",
  ],
  [
    "Password Hashing Competition",
    "phc-winner-argon2",
    "GitHub",
    "https://github.com/P-H-C/phc-winner-argon2",
  ],
  ["R. Salt", "node-argon2", "GitHub", "https://github.com/ranisalt/node-argon2"],
  ["SheetJS LLC", "SheetJS Community Edition", "docs.sheetjs.com", "https://docs.sheetjs.com/"],
  [
    "Mozilla",
    "Server-sent events",
    "MDN Web Docs",
    "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events",
  ],
  [
    "PostgreSQL Global Development Group",
    "About PostgreSQL",
    "postgresql.org",
    "https://www.postgresql.org/about/",
  ],
  [
    "PostgreSQL Global Development Group",
    "5.9 Row Security Policies",
    "postgresql.org",
    "https://www.postgresql.org/docs/current/ddl-rowsecurity.html",
  ],
  [
    "Supabase",
    "Supabase | The Postgres Development Platform",
    "supabase.com",
    "https://supabase.com/",
  ],
  [
    "Supabase",
    "Database Overview",
    "supabase.com",
    "https://supabase.com/docs/guides/database/overview",
  ],
  [
    "Prisma Data",
    "What is Prisma ORM?",
    "prisma.io",
    "https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma",
  ],
  ["Vitest", "Vitest: Next Generation Testing Framework", "vitest.dev", "https://vitest.dev/"],
  [
    "OpenJS Foundation",
    "ESLint: Find and fix problems in your JavaScript code",
    "eslint.org",
    "https://eslint.org/",
  ],
  ["Prettier", "Prettier: Opinionated Code Formatter", "prettier.io", "https://prettier.io/"],
  [
    "GitHub",
    "Understanding GitHub Actions",
    "docs.github.com",
    "https://docs.github.com/en/actions/get-started/understand-github-actions",
  ],
  [
    "Docker Inc.",
    "What is Docker?",
    "docs.docker.com",
    "https://docs.docker.com/get-started/docker-overview/",
  ],
]
const R = Object.fromEntries(
  [
    "react",
    "ts",
    "vite",
    "tailwind",
    "shadcn",
    "router",
    "tanstack",
    "zustand",
    "recharts",
    "sonner",
    "node",
    "npm",
    "fastify",
    "zod",
    "jwt",
    "jose",
    "google",
    "argon2",
    "nodeArgon2",
    "sheetjs",
    "sse",
    "pg",
    "rls",
    "supabase",
    "supabaseDb",
    "prisma",
    "vitest",
    "eslint",
    "prettier",
    "actions",
    "docker",
  ].map((k, i) => [k, i + 1]),
)

// ---------------------------------------------------------------------------
// เนื้อหา
// ---------------------------------------------------------------------------
const content = [
  // หน้าแรก --------------------------------------------------------------
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({
        text: "สรุป Technology ที่ใช้ในระบบ CMAS",
        bold: true,
        font: font(THAI),
        size: PT(28),
        color: C.blue,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: runs(
      "Course Monitoring and Assessment System (ระบบติดตามผลลัพธ์การเรียนรู้รายวิชา · CLO System) — ฉบับเพื่อนที่เพิ่งเริ่ม",
      {
        color: C.gray,
        size: PT(15),
      },
    ),
  }),
  p(
    "เอกสารนี้อธิบายว่าระบบ CMAS สร้างจากอะไรบ้าง ตั้งแต่หน้าจอที่ผู้ใช้เห็น (Frontend) ไปจนถึงเซิร์ฟเวอร์ (Backend) และฐานข้อมูล (Database) แต่ละหัวข้อเริ่มด้วย **คำนิยามจากเว็บทางการ** (กล่องสีฟ้า ภาษาอังกฤษตามต้นฉบับ) แล้วแปลเป็นภาษาง่าย ๆ และบอกว่า CMAS ใช้มันทำอะไร ตัวเลขในวงเล็บเหลี่ยม เช่น [1] คือเลขอ้างอิงท้ายเล่ม",
  ),
  bullet("**อ่านแบบเร็ว:** ดูภาพ 1.1 กับตาราง 1.2 ก่อน แล้วค่อยเลือกอ่านบทที่สนใจ"),
  bullet("**เวอร์ชัน** ทุกตัวมาจาก `package.json` ของโปรเจกต์ ณ วันที่ 4 พฤศจิกายน 2569"),
  bullet("**โค้ดตัวอย่าง** คัดมาจากไฟล์จริงในโปรเจกต์ (บอกชื่อไฟล์ไว้ทุกกล่อง)"),

  // บทที่ 1 --------------------------------------------------------------
  chapter("ภาพรวมระบบ: ข้อมูลเดินทางอย่างไร"),
  p(
    "CMAS เป็นเว็บแอปแบบ **Client-Server**: เบราว์เซอร์ของอาจารย์ (Client) ส่งคำขอผ่าน HTTP ไปที่เซิร์ฟเวอร์ เซิร์ฟเวอร์ตรวจสิทธิ์ ประมวลผล แล้วอ่าน/เขียนฐานข้อมูล จากนั้นตอบกลับเป็น JSON ให้หน้าจอแสดงผล",
  ),
  ...flow(
    [
      ["ผู้ใช้", "เปิดเว็บใน Browser"],
      ["Frontend", "React + Vite (พอร์ต 5173)"],
      ["Backend", "Fastify บน Node.js (พอร์ต 3001)"],
      ["Prisma", "แปลงโค้ดเป็น SQL"],
      ["PostgreSQL", "บน Supabase"],
    ],
    "เส้นทางข้อมูลจากหน้าจอถึงฐานข้อมูล",
  ),
  h2("เทคโนโลยีทั้งหมดในตารางเดียว"),
  ...table(
    ["ชั้น", "เทคโนโลยี", "เวอร์ชัน", "หน้าที่ (1 บรรทัด)"],
    [
      ["ภาษา", "TypeScript", "5.9", "JavaScript ที่ระบุชนิดข้อมูล จับผิดก่อนรัน"],
      ["Runtime", "Node.js", "24", "รัน JavaScript ฝั่งเซิร์ฟเวอร์"],
      ["Frontend", "React", "19.2", "สร้างหน้าจอจากชิ้นส่วน (Component)"],
      ["Frontend", "Vite", "7.3", "เปิด dev server และ build เว็บ"],
      [
        "Frontend",
        "Tailwind CSS · shadcn/ui",
        "4.3",
        "จัดหน้าตาด้วย class สำเร็จรูป · ชุดปุ่ม/ฟอร์ม",
      ],
      ["Frontend", "React Router", "7.18", "เปลี่ยนหน้าตาม URL"],
      [
        "Frontend",
        "TanStack Query · Zustand",
        "5.101 · 5.0",
        "ดึง/แคชข้อมูลจากเซิร์ฟเวอร์ · เก็บสถานะการล็อกอิน",
      ],
      ["Frontend", "Recharts · Sonner", "3.9 · 2.0", "กราฟผลการเรียน · ข้อความแจ้งเตือนมุมจอ"],
      ["Backend", "Fastify", "5.10", "รับ HTTP request และส่ง response"],
      ["Backend", "Zod", "4.4", "ตรวจข้อมูลที่ส่งเข้ามาทุกครั้ง"],
      ["Backend", "jose · Google Sign-In", "6.2", "ออก/ตรวจ JWT · ล็อกอินด้วยบัญชี Google"],
      ["Backend", "argon2", "0.44", "เข้ารหัสรหัสผ่าน (ใช้กับบัญชีทดสอบใน seed)"],
      ["Backend", "SheetJS (xlsx)", "0.20.3", "อ่าน/เขียนไฟล์ Excel คะแนน"],
      ["Database", "PostgreSQL บน Supabase", "—", "เก็บข้อมูลทั้งหมดแบบตาราง"],
      ["Database", "Prisma ORM", "6.19", "เขียนคำสั่งฐานข้อมูลด้วย TypeScript + จัดการ migration"],
      [
        "คุณภาพโค้ด",
        "Vitest · ESLint · Prettier",
        "3.2 · 10.6 · 3",
        "ทดสอบ · ตรวจโค้ด · จัดรูปแบบโค้ด",
      ],
      ["DevOps", "GitHub Actions · Docker", "—", "ตรวจโค้ดอัตโนมัติทุก PR · แพ็กแอปเป็น container"],
    ],
    [14, 30, 14, 42],
  ),
  h2("ศัพท์ที่ต้องรู้ก่อนอ่าน"),
  ...table(
    ["คำ", "ความหมายง่าย ๆ"],
    [
      ["Frontend", "ส่วนที่ผู้ใช้เห็นและกดได้ ทำงานในเบราว์เซอร์"],
      ["Backend", "ส่วนที่อยู่บนเซิร์ฟเวอร์ ตรวจสิทธิ์ คำนวณ และคุยกับฐานข้อมูล ผู้ใช้มองไม่เห็น"],
      ["Database", "ที่เก็บข้อมูลถาวร ปิดเครื่องแล้วข้อมูลไม่หาย"],
      ["API", "“ประตู” ที่ Frontend ใช้ขอข้อมูลจาก Backend เช่น `GET /courses/:courseId/clos`"],
      [
        "Library กับ Framework",
        "Library = เครื่องมือที่เราเรียกใช้เอง · Framework = โครงที่กำหนดว่าโค้ดเราต้องวางตรงไหน",
      ],
      ["JSON", 'รูปแบบข้อความที่ใช้ส่งข้อมูลไปมา เช่น `{ "number": 1, "weight": 30 }`'],
      ["CLO", "Course Learning Outcome = ผลลัพธ์การเรียนรู้ที่รายวิชาตั้งไว้ ซึ่งระบบนี้ติดตาม"],
    ],
    [25, 75],
  ),

  // บทที่ 2 --------------------------------------------------------------
  chapter("ภาษาและสภาพแวดล้อม (ใช้ทั้งสองฝั่ง)"),
  ...tech({
    name: "TypeScript",
    version: "v5.9",
    ref: R.ts,
    en: "TypeScript is JavaScript with syntax for types.",
    th: "คือ JavaScript ที่เพิ่มการบอกชนิดข้อมูล (type) เช่น ตัวนี้เป็นตัวเลข ตัวนั้นเป็นข้อความ ถ้าเราใช้ผิดชนิด editor จะขีดเส้นแดงทันทีก่อนรันโปรแกรม",
    like: "การกรอกฟอร์มที่มีช่องบังคับ “ใส่ได้เฉพาะตัวเลข” — ผิดตั้งแต่ตอนกรอก ไม่ต้องรอส่งแล้วค่อยรู้",
    cmas: [
      "ทั้ง client และ server เขียนด้วย TypeScript แบบ strict และ **ห้ามใช้ `any`** (กฎของโปรเจกต์)",
      "ตอน build โค้ดจะถูกแปลงเป็น JavaScript ธรรมดา เพราะเว็บทางการบอกว่า TypeScript “runs anywhere JavaScript runs” [2]",
    ],
  }),
  ...tech({
    name: "Node.js",
    version: "v24",
    ref: R.node,
    en: "As an asynchronous event-driven JavaScript runtime, Node.js is designed to build scalable network applications.",
    th: "โปรแกรมที่ทำให้ JavaScript รันนอกเบราว์เซอร์ได้ เช่น บนเซิร์ฟเวอร์ และทำงานแบบ “ไม่รอ” (asynchronous) จึงรับคำขอพร้อมกันได้หลายคน",
    like: "พนักงานร้านอาหารที่รับออร์เดอร์โต๊ะต่อไปได้เลยระหว่างรอครัวทำอาหาร",
    cmas: [
      "Backend ทั้งหมดรันบน Node.js 24 (กำหนดใน `.nvmrc` และ `engines` ของ `package.json`)",
      "เครื่องมือพัฒนา เช่น Vite, Prisma CLI, Vitest ก็รันบน Node.js",
    ],
  }),
  ...tech({
    name: "npm workspaces",
    version: "npm 10+",
    ref: R.npm,
    en: "managing multiple packages from your local file system from within a singular top-level, root package",
    th: "ให้โปรเจกต์เดียวมีหลายแพ็กเกจย่อย แต่สั่งติดตั้งและรันคำสั่งจากโฟลเดอร์บนสุดได้ในครั้งเดียว",
    cmas: [
      "มี 2 workspace คือ `app/client` และ `app/server`",
      "`npm run dev` เปิดทั้งสองฝั่งพร้อมกัน · `npm run verify` ตรวจทุกอย่างก่อน push",
    ],
  }),

  // บทที่ 3 --------------------------------------------------------------
  chapter("Frontend: หน้าจอที่ผู้ใช้เห็น"),
  p(
    "โค้ดฝั่งนี้อยู่ใน `app/client/src/` แบ่งเป็นโฟลเดอร์ตามฟีเจอร์ เช่น `features/clos/` `features/scores/` `features/dashboard/` แต่ละฟีเจอร์มีไฟล์ชุดเดียวกัน: หน้า (`*.page.tsx`) · ชิ้นส่วน (`*.tsx`) · hook (`useX.ts`) · ตัวเรียก API (`*.api.ts`) · ชนิดข้อมูล (`*.types.ts`)",
  ),
  ...tech({
    name: "React",
    version: "v19.2",
    ref: R.react,
    en: "React apps are made out of components. … React components are JavaScript functions that return markup.",
    th: "ไลบรารีสร้างหน้าเว็บโดยแบ่งหน้าจอเป็นชิ้นเล็ก ๆ เรียกว่า Component แต่ละชิ้นคือฟังก์ชันที่คืนค่าเป็นหน้าตา (markup) แล้วนำมาประกอบกัน",
    like: "ตัวต่อเลโก้ — ทำปุ่มครั้งเดียว เอาไปใช้ได้ทุกหน้า",
    cmas: [
      "ทุกหน้าของระบบ เช่น หน้ารายวิชา หน้า CLO หน้าผลการเรียน เป็น Component ของ React",
      "เขียนเป็นไฟล์ `.tsx` (TypeScript + JSX)",
    ],
  }),
  ...tech({
    name: "Vite",
    version: "v7.3",
    ref: R.vite,
    en: "a build tool that aims to provide a faster and leaner development experience for modern web projects",
    th: "เครื่องมือ 2 อย่างในตัวเดียว: (1) dev server ที่แก้โค้ดแล้วหน้าเว็บเปลี่ยนทันที (2) คำสั่ง build ที่รวมโค้ดเป็นไฟล์เล็ก ๆ พร้อมขึ้นระบบจริง (เวอร์ชัน 7 ใช้ Rollup รวมไฟล์) [3]",
    like: "ห้องครัวทดลอง (dev) กับสายพานบรรจุกล่อง (build)",
    cmas: [
      "`npm run dev` เปิดหน้าเว็บที่ `http://localhost:5173`",
      "`npm run build` สร้างไฟล์ใน `app/client/dist/`",
    ],
  }),
  ...tech({
    name: "Tailwind CSS และ shadcn/ui",
    version: "Tailwind v4.3",
    ref: R.tailwind,
    en: "A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.",
    th: "แทนที่จะเขียนไฟล์ CSS แยก เราใส่ class สั้น ๆ ลงใน HTML เลย เช่น `p-4` = ระยะขอบใน, `text-center` = จัดกลาง",
    like: "สติกเกอร์สำเร็จรูป แปะหลายแผ่นรวมกันเป็นดีไซน์",
    cmas: [
      "ใช้ Tailwind v4 ผ่าน plugin `@tailwindcss/vite`",
      "**shadcn/ui** ไม่ใช่ไลบรารีที่ติดตั้งแล้วแก้ไม่ได้ เว็บทางการเขียนว่า “This is not a component library. It is how you build your component library.” [5] คือคัดลอกโค้ดปุ่ม/ฟอร์มมาไว้ในโปรเจกต์ แล้วแก้ต่อเองได้ (ตั้งค่าใน `app/client/components.json`)",
    ],
  }),
  ...tech({
    name: "React Router",
    version: "v7.18",
    ref: R.router,
    en: "React Router is a multi-strategy router for React. You can use it maximally as a React framework or as minimally as you want.",
    th: "ตัวจับคู่ URL กับหน้าจอ พิมพ์ URL ไหนก็แสดง Component นั้น โดยไม่ต้องโหลดเว็บใหม่ทั้งหน้า",
    cmas: [
      "CMAS ใช้แบบเรียบง่ายที่สุด: รายการเส้นทางทั้งหมดเขียนไว้ชัด ๆ ในไฟล์เดียว `app/client/src/pages.config.ts`",
    ],
  }),
  ...tech({
    name: "TanStack Query",
    version: "v5.101",
    ref: R.tanstack,
    en: "fetching, caching, synchronizing and updating server state",
    th: "ผู้ช่วยดึงข้อมูลจากเซิร์ฟเวอร์ จำผลไว้ (cache) ไม่ให้ขอซ้ำโดยไม่จำเป็น และโหลดใหม่เมื่อข้อมูลเก่า พร้อมบอกสถานะ กำลังโหลด / สำเร็จ / ผิดพลาด ให้เอง",
    like: "เลขาที่จดคำตอบไว้ ถ้าถามซ้ำก็ตอบได้เลย ไม่ต้องโทรถามใหม่",
    cmas: ["ทุก hook ที่ดึงข้อมูล เช่น `useCloList` ใช้ `useQuery` (ตัวอย่างด้านล่าง)"],
    extra: code(
      [
        "export const useCloList = (courseId: string) =>",
        "  useQuery({ queryKey: cloKeys.list(courseId), queryFn: () => closApi.list(courseId) })",
      ],
      "app/client/src/features/clos/useClos.ts",
    ),
  }),
  ...tech({
    name: "Zustand",
    version: "v5.0",
    ref: R.zustand,
    en: "A tiny, predictable store with hooks-first ergonomics and escape hatches that stay out of your way.",
    th: "กล่องเก็บข้อมูลกลางขนาดเล็ก ที่ทุกหน้าหยิบไปใช้ได้",
    cmas: [
      "ใช้ **เฉพาะเรื่องการล็อกอิน** (ใครล็อกอินอยู่) ข้อมูลอื่นทั้งหมดให้ TanStack Query ดูแล",
    ],
  }),
  h2("ข้อมูลแต่ละแบบเก็บที่ไหน"),
  ...table(
    ["ข้อมูลแบบไหน", "ใช้อะไร", "ตัวอย่างใน CMAS"],
    [
      [
        "ข้อมูลจากเซิร์ฟเวอร์ (server state)",
        "TanStack Query",
        "รายการ CLO, คะแนนนักศึกษา, ผลการบรรลุ CLO",
      ],
      ["สถานะล็อกอิน", "Zustand", "ผู้ใช้ปัจจุบันและบทบาท"],
      ["ตำแหน่งหน้าปัจจุบัน", "React Router (URL)", "`/courses/:courseId/...`"],
      ["ค่าชั่วคราวในหน้าเดียว", "useState ของ React", "ข้อความที่พิมพ์ค้างในฟอร์ม"],
    ],
    [32, 22, 46],
  ),
  ...tech({
    name: "Recharts และ Sonner",
    version: "v3.9 · v2.0",
    ref: R.recharts,
    en: "A composable charting library built on React components.",
    th: "Recharts = ไลบรารีวาดกราฟที่ประกอบจาก Component ของ React · Sonner = “An opinionated toast component for React.” [10] คือข้อความเด้งแจ้งเตือนมุมจอ",
    cmas: [
      "Recharts วาดกราฟผลการบรรลุ CLO ในหน้า Dashboard",
      "Sonner แจ้ง “บันทึกแล้ว” หรือ “นำเข้าไม่สำเร็จ” หลังกดปุ่ม",
    ],
  }),

  // บทที่ 4 --------------------------------------------------------------
  chapter("Backend: เซิร์ฟเวอร์ที่อยู่เบื้องหลัง"),
  p(
    "โค้ดอยู่ใน `app/server/src/modules/` ชื่อโมดูลตรงกับฝั่ง client เช่น `features/clos/` ↔ `modules/clos/` ทุกคำขอเดินผ่าน 4 ชั้นเสมอ แต่ละชั้นมีหน้าที่เดียว",
  ),
  ...flow(
    [
      ["Route", "URL ไหน ใครเข้าได้"],
      ["Controller", "อ่าน request ตรวจด้วย Zod"],
      ["Service", "กฎทางธุรกิจ/คำนวณ"],
      ["Repository", "คุยกับ Prisma"],
      ["Database", "PostgreSQL"],
    ],
    "ชั้นของ Backend (Route → Controller → Service → Repository)",
  ),
  bullet(
    "**ทำไมต้องแยกชั้น:** เปลี่ยนวิธีเก็บข้อมูลได้โดยไม่ต้องแก้กฎการคำนวณ และทดสอบแต่ละชั้นแยกกันได้",
  ),
  bullet("**กฎ:** Service ห้ามเรียก `prisma` ตรง ต้องผ่าน Repository เท่านั้น"),
  ...tech({
    name: "Fastify",
    version: "v5.10",
    ref: R.fastify,
    en: "A fast, low-overhead web framework for Node.js.",
    th: "Framework สำหรับสร้าง API บน Node.js เน้นเร็วและเบา เว็บทางการบอกว่ารับได้ราว 90,000 request ต่อวินาที (ขึ้นกับความซับซ้อนของโค้ด) และต่อเติมได้ด้วย plugin",
    like: "พนักงานต้อนรับที่ดูว่าแขกจะไปห้องไหน แล้วพาไปส่งให้ถูกห้อง",
    cmas: [
      "ใช้ plugin ทางการ: `@fastify/cors` (อนุญาตให้หน้าเว็บเรียก API) · `@fastify/helmet` (header ความปลอดภัย) · `@fastify/multipart` (อัปโหลดไฟล์ Excel) · `@fastify/rate-limit` (กันยิงคำขอถี่เกิน)",
      "ทุก route ต้องประกาศ `config: { access }` ไม่อย่างนั้นเซิร์ฟเวอร์ไม่ยอมเปิด",
    ],
    extra: code(
      [
        'const view = { cap: "course.view" } as const',
        'const write = { cap: "clo.write" } as const',
        "",
        'app.get("/courses/:courseId/clos", { config: { access: view } }, c.list)',
        'app.post("/courses/:courseId/clos", { config: { access: write } }, c.create)',
        'app.delete("/clos/:cloId", { config: { access: write } }, c.remove)',
      ],
      "app/server/src/modules/clos/clos.route.ts",
    ),
  }),
  h2("ใครเข้าอะไรได้ (Access)"),
  ...table(
    ["ค่า access", "ใครเรียกได้", "ตัวอย่าง"],
    [
      ['"public"', "ทุกคน ไม่ต้องล็อกอิน", "ตรวจว่าเซิร์ฟเวอร์ยังทำงาน (health)"],
      ['"authenticated"', "ใครก็ได้ที่ล็อกอินแล้ว", "ดูข้อมูลบัญชีตัวเอง"],
      ["`{ cap }`", "เฉพาะคนที่มีสิทธิ์นั้นในรายวิชานั้น", "`clo.write` = แก้ CLO ได้"],
    ],
    [22, 38, 40],
  ),
  bullet(
    "ถ้าอาจารย์ขอดูรายวิชาที่ตัวเองไม่ได้สอน ระบบตอบ **404 (ไม่พบ)** ไม่ใช่ 403 (ไม่มีสิทธิ์) เพราะ 403 จะเผยว่ารายวิชานั้นมีอยู่จริง",
  ),
  ...tech({
    name: "Zod",
    version: "v4.4",
    ref: R.zod,
    en: "TypeScript-first schema validation with static type inference.",
    th: "เขียน “แม่แบบ” ของข้อมูลที่ยอมรับได้ แล้วให้ Zod ตรวจข้อมูลที่ส่งมา ผิดแบบก็ปฏิเสธพร้อมบอกเหตุผล และยังได้ type ของ TypeScript มาฟรี",
    like: "ยามหน้าประตูที่ตรวจบัตรทุกคนก่อนเข้า",
    cmas: [
      "**ทุก** ข้อมูลที่เข้าเซิร์ฟเวอร์ต้องผ่าน Zod (ไฟล์ `*.validator.ts`) รวมถึงไฟล์ Excel ที่ตรวจทีละแถว",
    ],
    extra: code(
      [
        "number: z.number().int().min(1).max(99),          // เลข CLO 1–99",
        "description: z.string().trim().min(1).max(1000),  // ห้ามว่าง ไม่เกิน 1000 ตัว",
        "weight: z.number().min(0).max(100).nullable(),    // น้ำหนัก 0–100 หรือยังไม่กรอก",
      ],
      "app/server/src/modules/clos/clos.validator.ts",
    ),
  }),
  h2("การล็อกอิน: Google Sign-In + JWT + jose"),
  quote(
    "JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties.",
    R.jwt,
  ),
  bullet(
    "**JWT แปลง่าย ๆ:** “บัตรผ่าน” ข้อความสั้น ๆ ที่เซิร์ฟเวอร์เซ็นรับรองไว้ ใครแก้ข้อมูลในบัตร ลายเซ็นจะไม่ตรงทันที",
  ),
  bullet(
    `**Sign in with Google:** “Sign in with Google helps you to quickly manage user authentication on your website.” [${R.google}] — CMAS ให้ล็อกอินด้วยบัญชี Google เท่านั้น`,
  ),
  bullet(
    `**jose:** ไลบรารีจัดการ JWT (“JWA, JWS, JWE, JWT, JWK, JWKS for Node.js, Browser, …” [${R.jose}]) CMAS ใช้ทั้งตรวจบัตรจาก Google และออกบัตรของระบบเอง (ลายเซ็นแบบ HS256)`,
  ),
  ...flow(
    [
      ["กดปุ่ม Google", "ได้ ID token"],
      ["ส่งให้ Server", "POST ไปที่ API"],
      ["ตรวจด้วย jose", "เช็กผู้ออก + ผู้รับ"],
      ["ออกบัตรของ CMAS", "Access + Refresh token"],
    ],
    "ขั้นตอนล็อกอิน",
  ),
  bullet(
    "**Refresh token** เก็บในคุกกี้แบบ `httpOnly` (JavaScript ในหน้าเว็บอ่านไม่ได้) และ `SameSite=Strict` (เว็บอื่นส่งแทนไม่ได้)",
  ),
  bullet(
    "ทุกคำขอ เซิร์ฟเวอร์ **อ่านข้อมูลผู้ใช้จากฐานข้อมูลใหม่** ไม่เชื่อบทบาทที่เขียนในบัตรอย่างเดียว ถ้าแอดมินถอนสิทธิ์ก็มีผลทันที",
  ),
  ...tech({
    name: "argon2",
    version: "v0.44",
    ref: R.argon2,
    en: "Argon2, the password-hashing function that won the Password Hashing Competition (PHC)",
    th: "วิธีแปลงรหัสผ่านเป็นข้อความที่ย้อนกลับไม่ได้ (hash) ฐานข้อมูลจึงไม่เคยเก็บรหัสผ่านจริง แพ็กเกจ `argon2` บน npm คือ “Node.js bindings for Argon2 hashing algorithm” [19]",
    cmas: ["ตอนนี้ใช้ใน `database/seed.ts` เพื่อสร้างบัญชีทดสอบ (การล็อกอินจริงใช้ Google)"],
  }),
  ...tech({
    name: "SheetJS (xlsx)",
    version: "v0.20.3",
    ref: R.sheetjs,
    en: "SheetJS presents a unified interface to every Excel file format as well as Lotus 1-2-3, Numbers, and Quattro Pro.",
    th: "ไลบรารีอ่าน/เขียนไฟล์ตารางคำนวณ เช่น Excel",
    cmas: [
      "อาจารย์อัปโหลดคะแนนจาก Excel → เซิร์ฟเวอร์อ่านด้วย SheetJS → ตรวจทีละแถวด้วย Zod → แถวที่ผิดจะถูกแจ้งกลับ ไม่บันทึก",
      "ติดตั้งจาก CDN ของ SheetJS โดยตรง (ไม่ใช่จาก npm registry) ตามที่ SheetJS แนะนำ",
    ],
  }),
  ...tech({
    name: "Server-Sent Events (อัปเดตสด)",
    version: "มาตรฐานเว็บ",
    ref: R.sse,
    en: "With server-sent events, it's possible for a server to send new data to a web page at any time, by pushing messages to the web page.",
    th: "ช่องทางที่เซิร์ฟเวอร์ “ส่งข่าว” มาที่หน้าเว็บเองได้ โดยหน้าเว็บไม่ต้องคอยถามซ้ำ",
    cmas: [
      "เมื่ออาจารย์อีกคนแก้ข้อมูลรายวิชาเดียวกัน หน้าจอของเราจะรู้และโหลดข้อมูลใหม่ (โมดูล `events`, header `text/event-stream`)",
    ],
  }),

  // บทที่ 5 --------------------------------------------------------------
  chapter("Database: ที่เก็บข้อมูล"),
  ...tech({
    name: "PostgreSQL",
    version: "ฐานข้อมูลเชิงสัมพันธ์",
    ref: R.pg,
    en: "PostgreSQL is a powerful, open source object-relational database system that uses and extends the SQL language …",
    th: "ฐานข้อมูลโอเพนซอร์สที่เก็บข้อมูลเป็นตาราง (แถว/คอลัมน์) และเชื่อมตารางกันด้วยความสัมพันธ์ เว็บทางการระบุว่าพัฒนามาเกือบ 40 ปี และรองรับ ACID มาตั้งแต่ปี 2001 (ข้อมูลไม่เสียครึ่ง ๆ กลาง ๆ แม้ระบบล่มกลางทาง)",
    like: "ตู้เอกสารที่มีลิ้นชักแยกเป็นหมวด และมีป้ายโยงว่าเอกสารไหนเกี่ยวกับอะไร",
    cmas: [
      "เก็บทุกอย่าง: ผู้ใช้ รายวิชา CLO กิจกรรมการประเมิน นักศึกษา คะแนน เกรด และบันทึกการล็อกอิน (19 ตารางใน `database/schema.prisma`)",
    ],
  }),
  ...flow(
    [
      ["Course", "รายวิชา"],
      ["CLO", "ผลลัพธ์การเรียนรู้"],
      ["Objective", "วัตถุประสงค์เชิงพฤติกรรม"],
      ["Activity", "งาน/สอบที่ใช้วัด"],
      ["Score", "คะแนนนักศึกษา"],
    ],
    "ความสัมพันธ์หลักของข้อมูลใน CMAS (อย่างย่อ)",
  ),
  ...tech({
    name: "Supabase",
    version: "บริการฐานข้อมูลบนคลาวด์",
    ref: R.supabase,
    en: "Build in a weekend. Scale to millions.",
    th: `แพลตฟอร์มที่ให้ฐานข้อมูล PostgreSQL บนคลาวด์ พร้อมบริการเสริม (Auth, Storage, Realtime ฯลฯ) เอกสารบอกว่าแต่ละโปรเจกต์ได้ “a full Postgres database, not a Postgres abstraction.” [${R.supabaseDb}]`,
    like: "เช่าห้องเก็บของที่มีคนดูแลความปลอดภัยและสำรองข้อมูลให้",
    cmas: [
      "CMAS ใช้ Supabase **เป็นที่ตั้งของ PostgreSQL เท่านั้น** เซิร์ฟเวอร์ของเราต่อฐานข้อมูลผ่าน Prisma ไม่ได้ใช้ Data API ของ Supabase",
      `เพื่อปิดประตูที่ไม่ใช้ migration \`0009_lock_down_supabase_data_api\` เปิด **Row Level Security** ทุกตารางโดยไม่สร้าง policy ซึ่งตามเอกสาร PostgreSQL แปลว่า “no rows are visible or can be modified” [${R.rls}] สำหรับผู้ใช้ที่ผ่าน Data API`,
    ],
  }),
  ...tech({
    name: "Prisma ORM",
    version: "v6.19",
    ref: R.prisma,
    en: "open-source next-generation ORM",
    th: "ORM คือตัวแปลระหว่างโค้ด TypeScript กับ SQL เราเขียน `prisma.clo.findMany(...)` แทนการเขียน SQL เอง และได้ type ที่ถูกต้องเสมอ",
    like: "ล่ามที่แปลภาษาเรา (TypeScript) เป็นภาษาฐานข้อมูล (SQL)",
    cmas: ["โครงสร้างตารางทั้งหมดเขียนในไฟล์เดียว `database/schema.prisma`"],
    extra: [
      ...code(
        [
          "model CLO {",
          "  id          String @id @default(cuid())",
          "  courseId    String",
          "  course      Course @relation(fields: [courseId], references: [id], onDelete: Cascade)",
          "  number      Int",
          "  description String",
          "  weight      Float?",
          "  ...",
          "}",
        ],
        "database/schema.prisma (ย่อ)",
      ),
      ...table(
        ["ส่วนของ Prisma", "นิยามจากเว็บทางการ [26]", "ใช้ใน CMAS ด้วยคำสั่ง"],
        [
          [
            "Prisma Client",
            "“Auto-generated and type-safe query builder for Node.js & TypeScript”",
            "`npm run db:generate` (Repository เรียกใช้)",
          ],
          ["Prisma Migrate", "“Migration system”", "`npm run db:migrate:dev -- --name add_x`"],
          ["Prisma Studio", "“GUI to view and edit data in your database”", "`npm run db:studio`"],
        ],
        [20, 45, 35],
      ),
    ],
  }),
  h2("Migration: ประวัติการแก้โครงสร้างฐานข้อมูล"),
  bullet(
    "**Migration** = ไฟล์ SQL ที่บันทึกว่าแก้ตารางอะไรเมื่อไร เรียงตามลำดับ ตอนนี้มี 9 ชุด (`0001_init` ถึง `0009_lock_down_supabase_data_api`) ใน `database/migrations/`",
  ),
  bullet(
    "บางชุดเขียน SQL เอง (เช่น `0002_constraints_and_triggers`) เพื่อสร้างเงื่อนไข CHECK และ trigger ที่ Prisma เขียนแทนไม่ได้",
  ),
  ...table(
    ["คำสั่ง", "ผล", "ใช้ใน CMAS ไหม"],
    [
      ["`prisma migrate`", "สร้างไฟล์ migration และรันตามลำดับ มีประวัติย้อนดูได้", "**ใช้เสมอ**"],
      [
        "`prisma db push`",
        "ดันโครงสร้างตรงเข้าฐานข้อมูล ไม่มีประวัติ และลบ CHECK/trigger ที่เขียนเองทิ้งเงียบ ๆ",
        "**ห้ามใช้** ทุกสภาพแวดล้อม",
      ],
      [
        "แก้/เปลี่ยนชื่อโฟลเดอร์ migration เก่า",
        "ฐานข้อมูลจำชื่อไว้ แก้แล้วประวัติไม่ตรง",
        "**ห้ามทำ**",
      ],
    ],
    [28, 52, 20],
  ),

  // บทที่ 6 --------------------------------------------------------------
  chapter("คุณภาพโค้ด: ทดสอบ ตรวจ จัดรูปแบบ"),
  ...tech({
    name: "Vitest",
    version: "v3.2",
    ref: R.vitest,
    en: "A Vite-native testing framework. It's fast!",
    th: "เครื่องมือเขียนเทสต์อัตโนมัติ ใช้การตั้งค่าเดียวกับ Vite และเขียนคล้าย Jest (expect, snapshot, coverage)",
    cmas: [
      "ไฟล์เทสต์วางข้างไฟล์ที่ทดสอบ เช่น `jwt.ts` คู่กับ `jwt.test.ts`",
      "`npm run test` รันทั้ง client (จำลองเบราว์เซอร์ด้วย happy-dom) และ server",
    ],
  }),
  ...tech({
    name: "ESLint และ Prettier",
    version: "ESLint v10.6 · Prettier v3",
    ref: R.eslint,
    en: "ESLint statically analyzes your code to quickly find problems.",
    th: `ESLint อ่านโค้ดโดยไม่ต้องรัน แล้วชี้จุดที่น่าจะผิด · Prettier คือ “An opinionated code formatter” [${R.prettier}] จัดย่อหน้า เว้นวรรค ให้ทุกคนในทีมเขียนหน้าตาเหมือนกัน`,
    like: "ESLint = ครูตรวจการบ้าน · Prettier = เครื่องจัดหน้ากระดาษ",
    cmas: [
      "`npm run lint` (ESLint) · `npm run format` (Prettier จัดให้) · `npm run format:check` (แค่ตรวจ)",
    ],
  }),
  h2("npm run verify: ด่านตรวจก่อน push"),
  ...flow(
    [
      ["format:check", "Prettier"],
      ["lint", "ESLint"],
      ["typecheck", "TypeScript"],
      ["test", "Vitest"],
      ["build", "Vite + tsc"],
    ],
    "ลำดับขั้นของ npm run verify (ขั้นไหนล้ม หยุดทันที)",
  ),

  // บทที่ 7 --------------------------------------------------------------
  chapter("DevOps: Git, CI และ Docker"),
  ...tech({
    name: "GitHub Actions (CI)",
    version: ".github/workflows/ci.yml",
    ref: R.actions,
    en: "GitHub Actions is a continuous integration and continuous delivery (CI/CD) platform",
    th: "ระบบที่ GitHub รันคำสั่งตรวจโค้ดให้อัตโนมัติทุกครั้งที่ push หรือเปิด Pull Request",
    cmas: [
      "**Workflow** = ไฟล์ YAML ที่บอกว่าจะรันอะไรเมื่อไร · **Job** = ชุดขั้นตอนบนเครื่องเดียวกัน · **Runner** = เครื่องที่รันให้ [30]",
      "ใน CMAS รันเมื่อ push หรือเปิด PR เข้า `main` บนเครื่อง `ubuntu-latest`",
    ],
    extra: code(
      [
        "on:",
        "  push:         { branches: [main] }",
        "  pull_request: { branches: [main] }",
        "jobs:",
        "  verify:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/checkout@v4",
        "      - run: npm ci",
        "      - run: npm run db:generate",
        "      - run: npm run format:check",
        "      - run: npm run lint",
        "      - run: npm run typecheck",
        "      - run: npm run test",
      ],
      ".github/workflows/ci.yml (ย่อ)",
    ),
  }),
  ...flow(
    [
      ["branch ใหม่", "feature/..."],
      ["commit + push", ""],
      ["Pull Request", "เข้า main"],
      ["CI ผ่าน", "+ เพื่อนรีวิว"],
      ["Merge", "เข้า main"],
    ],
    "เส้นทางโค้ดจากเครื่องเราถึง main",
  ),
  ...tech({
    name: "Docker",
    version: "docker-compose.yml",
    ref: R.docker,
    en: "an open platform for developing, shipping, and running applications",
    th: "แพ็กแอปพร้อมทุกอย่างที่ต้องใช้ลงใน “container” (เอกสารนิยามว่า “a runnable instance of an image”) เครื่องไหนก็รันได้เหมือนกัน",
    like: "ตู้คอนเทนเนอร์ขนส่งสินค้า ขนขึ้นเรือลำไหนก็ได้ ข้างในไม่เปลี่ยน",
    cmas: [
      "`npm run docker:up` เปิดระบบด้วย `docker-compose.yml` · มี `docker-compose.prod.yml` สำหรับระบบจริง",
    ],
  }),

  // บทที่ 8 --------------------------------------------------------------
  chapter("สรุปท้ายเล่ม: อยากทำอะไร ไปที่ไหน"),
  ...table(
    ["อยากทำ / อยากรู้", "ไปที่", "เทคโนโลยีที่เกี่ยว"],
    [
      ["ติดตั้งครั้งแรก", "`npm run setup` แล้ว `npm run dev`", "npm, Node.js"],
      ["แก้หน้าตาหน้าจอ", "`app/client/src/features/<ชื่อ>/`", "React, Tailwind"],
      ["เพิ่มหน้าใหม่", "`app/client/src/pages.config.ts`", "React Router"],
      ["เพิ่ม API ใหม่", "`app/server/src/modules/<ชื่อ>/`", "Fastify, Zod"],
      [
        "เพิ่ม/แก้ตาราง",
        "`database/schema.prisma` + `npm run db:migrate:dev`",
        "Prisma, PostgreSQL",
      ],
      ["ใส่ข้อมูลตัวอย่าง", "`npm run db:seed`", "Prisma, argon2"],
      ["ดูข้อมูลในฐานข้อมูล", "`npm run db:studio`", "Prisma Studio"],
      ["ตรวจก่อน push", "`npm run verify`", "Prettier, ESLint, TypeScript, Vitest"],
      ["อ่านกฎของโค้ด", "`docs/markdown/rule/code-rule.md`", "—"],
    ],
    [28, 44, 28],
  ),
  h2("จำ 5 ข้อนี้พอ"),
  bullet(
    "**React** วาดหน้าจอ · **Fastify** รับคำขอ · **Prisma** คุยกับ **PostgreSQL** ที่อยู่บน **Supabase**",
  ),
  bullet("ข้อมูลที่เข้าเซิร์ฟเวอร์ต้องผ่าน **Zod** ทุกครั้ง"),
  bullet("ทุก route ต้องบอกว่า **ใครเข้าได้** และรายวิชาที่ไม่มีสิทธิ์ตอบ **404**"),
  bullet("แก้ฐานข้อมูลด้วย **migrate** เท่านั้น ห้าม `db push`"),
  bullet("รัน **`npm run verify`** ให้ผ่านก่อน push ทุกครั้ง"),
]

// อ้างอิง -------------------------------------------------------------------
const references = [
  new Paragraph({
    pageBreakBefore: true,
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "374151" },
    spacing: { after: 160 },
    indent: { left: 60 },
    children: [
      new TextRun({
        text: "อ้างอิง (References)",
        bold: true,
        color: "FFFFFF",
        font: font(THAI),
        size: PT(20),
      }),
    ],
  }),
  p(
    "ข้อความภาษาอังกฤษในกล่องสีฟ้าคัดจากหน้าเว็บด้านล่าง สืบค้นเมื่อ 4 พฤศจิกายน 2569 · เวอร์ชันซอฟต์แวร์จากไฟล์ `package.json` ของโปรเจกต์ CMAS",
  ),
  ...REFS.map(
    ([author, title, site, url], i) =>
      new Paragraph({
        indent: { left: 560, hanging: 560 },
        spacing: { after: 50, line: 252 },
        children: [
          new TextRun({ text: `[${i + 1}]\t`, font: font(THAI), size: PT(14) }),
          new TextRun({ text: `${author}, “${title},” `, font: font(THAI), size: PT(14) }),
          new TextRun({ text: site, italics: true, font: font(THAI), size: PT(14) }),
          new TextRun({ text: `. [Online]. Available: `, font: font(THAI), size: PT(14) }),
          new ExternalHyperlink({
            link: url,
            children: [
              new TextRun({
                text: url,
                font: font(THAI),
                size: PT(14),
                color: "0563C1",
                underline: { type: "single", color: "0563C1" },
              }),
            ],
          }),
          new TextRun({ text: ` (สืบค้นเมื่อ 4 พ.ย. 2569)`, font: font(THAI), size: PT(14) }),
        ],
        tabStops: [{ type: "left", position: 560 }],
      }),
  ),
]

// ---------------------------------------------------------------------------
const doc = new Document({
  creator: "CMAS team",
  title: "สรุป Technology ที่ใช้ในระบบ CMAS",
  styles: { default: { document: { run: { font: font(THAI), size: PT(15) } } } },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: 16838 },
          margin: { top: 1000, bottom: 900, left: MARGIN, right: MARGIN, header: 450, footer: 450 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "สรุป Technology  |  CMAS — Course Monitoring and Assessment System  |  ฉบับเริ่มต้น",
                  font: font(THAI),
                  size: PT(12),
                  color: C.gray,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: ["หน้า ", PageNumber.CURRENT],
                  font: font(THAI),
                  size: PT(12),
                  color: C.gray,
                }),
              ],
            }),
          ],
        }),
      },
      children: [...content, ...references],
    },
  ],
})

writeFileSync(TARGET, await Packer.toBuffer(doc))
console.log(`เขียนแล้ว: ${TARGET}`)
