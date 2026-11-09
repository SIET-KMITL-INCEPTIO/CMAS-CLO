# Verdure Design System — Interaction & Domain Patterns

See also: [[design-system]] · [[user-flow]] · [[features-pages]]

> แยกออกจาก [[design-system]] (เดิมคือ §12–15 ของไฟล์เดียว) เพื่อให้ไฟล์หลักเหลือเฉพาะโทเคนและคอมโพเนนต์ · เลขหัวข้อ 12–15 คงเดิมเพื่อไม่ให้การอ้างอิงเก่าเสีย

---

## สารบัญ

12. [Educational Domain — Google Color Semantic Usage](#12-educational-domain--google-color-semantic-usage)
13. [Drag & Drop — CLOs and Tasks](#13-drag--drop--clos-and-tasks)
14. [UX Interaction Principles — Desktop App Feel](#14-ux-interaction-principles--desktop-app-feel)
15. [Right-Click Context Menu — CRUD & Clipboard](#15-right-click-context-menu--crud--clipboard)

---

## 12. Educational Domain — Google Color Semantic Usage

ระบบนี้ออกแบบสำหรับ Platform การศึกษา (CLOs / Tasks / Student Performance) โดยใช้ Google Color System เป็น semantic layer ที่ทุกคนเข้าใจได้ทันที — ไม่ต้องเรียนรู้ใหม่

### Semantic Intent Map

|Color|Hex|Intent|ความหมายในบริบทการศึกษา|
|---|---|---|---|
|**Blue**|`#4285F4`|Status / In Progress / Neutral Info|รายวิชาที่กำลังดำเนินการ, ข้อมูลจำนวนนักเรียนปกติ, CLO ที่กำลัง active|
|**Green**|`#34A853`|Performance High / Completed|คะแนนผ่านเกณฑ์, สถานะ Completed, ผลลัพธ์ระดับดีมาก, CLO บรรลุเป้าหมาย|
|**Yellow**|`#FBBC05`|Risk Medium / Warning / Watch|คะแนนอยู่ในเกณฑ์เฝ้าระวัง, งานใกล้ Deadline, สถานะที่ต้องตรวจสอบ|
|**Red**|`#EA4335`|Risk High / Critical / Overdue|คะแนนต่ำกว่าเกณฑ์มาตรฐาน, สถานะ Overdue, ข้อผิดพลาดร้ายแรง|

### Application by UI Element

#### 1. Student Score / Performance Badge

```css
/* Score thresholds — ปรับ cutoff ตาม rubric ของแต่ละรายวิชา */
.score-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-caption);
  font-weight: var(--weight-bold);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

/* >= 80%  — High Performance */
.score-badge--high {
  background: var(--status-success-bg);
  color: var(--status-success-text);
  border: 1px solid var(--status-success-border);
}

/* 60–79%  — Watch / Warning */
.score-badge--medium {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
  border: 1px solid var(--status-warning-border);
}

/* < 60%   — Critical / At Risk */
.score-badge--low {
  background: var(--status-danger-bg);
  color: var(--status-danger-text);
  border: 1px solid var(--status-danger-border);
}

/* In Progress / No data yet */
.score-badge--inprogress {
  background: var(--status-info-bg);
  color: var(--status-info-text);
  border: 1px solid var(--status-info-border);
}
```

```tsx
/* Score Badge Component */
function ScoreBadge({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  const variant =
    pct >= 80 ? 'high' :
    pct >= 60 ? 'medium' :
    score === -1 ? 'inprogress' : 'low';

  const label =
    variant === 'high'       ? 'Passed' :
    variant === 'medium'     ? 'Watch'  :
    variant === 'inprogress' ? 'In Progress' : 'At Risk';

  return (
    <span className={`score-badge score-badge--${variant}`}>
      <span className="score-value">{score}/{maxScore}</span>
      <span className="score-label">{label}</span>
    </span>
  );
}
```

#### 2. Task / CLO Status Chip

```css
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: var(--radius-full);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

/* สถานะ Task/CLO */
.status-chip--inprogress {
  background: var(--status-info-bg);
  color: var(--status-info-text);
}
.status-chip--inprogress .chip-dot {
  background: var(--google-blue);
  animation: pulse 2s ease infinite;
}

.status-chip--completed {
  background: var(--status-success-bg);
  color: var(--status-success-text);
}
.status-chip--completed .chip-dot { background: var(--google-green); }

.status-chip--warning {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
}
.status-chip--warning .chip-dot { background: var(--google-yellow); }

.status-chip--overdue {
  background: var(--status-danger-bg);
  color: var(--status-danger-text);
}
.status-chip--overdue .chip-dot { background: var(--google-red); }

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

#### 3. Progress Bar — CLO Attainment Rate

```css
/*
  CLO Attainment: % นักเรียนที่บรรลุ CLO นั้น
  เช่น  >= 75% นักเรียนผ่าน = Green
        50–74%              = Yellow
        < 50%               = Red
        ยังไม่มีข้อมูล      = Blue (neutral / loading)
*/
.clo-progress-fill[data-level="high"]       { background: var(--google-green); }
.clo-progress-fill[data-level="medium"]     { background: var(--google-yellow); }
.clo-progress-fill[data-level="low"]        { background: var(--google-red); }
.clo-progress-fill[data-level="inprogress"] { background: var(--google-blue); }

/* Striped — indicates partial/in-progress data */
.clo-progress-fill[data-level="inprogress"] {
  background-image: repeating-linear-gradient(
    45deg,
    var(--google-blue) 0px,
    var(--google-blue) 6px,
    rgba(66, 133, 244, 0.4) 6px,
    rgba(66, 133, 244, 0.4) 12px
  );
  animation: none;
}
```

#### 4. Dashboard Stat Card — Student Count / KPI

```css
.stat-card {
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  position: relative;
  overflow: hidden;
  transition: box-shadow 180ms ease;
}
.stat-card:hover { box-shadow: var(--shadow-2); }

/* Left accent stripe — color indicates status */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 4px;
}
.stat-card--blue::before   { background: var(--google-blue); }
.stat-card--green::before  { background: var(--google-green); }
.stat-card--yellow::before { background: var(--google-yellow); }
.stat-card--red::before    { background: var(--google-red); }

.stat-label  { font-size: var(--text-caption); font-weight: var(--weight-semibold); color: var(--color-neutral-400); text-transform: uppercase; letter-spacing: var(--tracking-wider); }
.stat-value  { font-family: var(--font-serif); font-size: 32px; font-weight: var(--weight-bold); color: var(--color-neutral-900); line-height: 1; }
.stat-sub    { font-size: var(--text-caption); color: var(--color-neutral-600); }
.stat-delta  { font-size: var(--text-caption); font-weight: var(--weight-semibold); display: inline-flex; align-items: center; gap: 3px; }
.stat-delta--up   { color: var(--status-success-text); }
.stat-delta--down { color: var(--status-danger-text); }
.stat-delta--flat { color: var(--color-neutral-400); }
```

#### 5. Heatmap Cell — Cohort Performance Grid

```css
/*
  ใช้สำหรับ Grid แสดงผลนักเรียน x CLO
  แต่ละ cell = ผลสัมฤทธิ์ของนักเรียน 1 คน ใน CLO 1 ข้อ
*/
.heatmap-cell {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: transform 100ms ease, box-shadow 100ms ease;
  display: grid;
  place-items: center;
  font-size: 9px;
  font-weight: var(--weight-bold);
  color: rgba(255,255,255,0.9);
}
.heatmap-cell:hover {
  transform: scale(1.25);
  box-shadow: var(--shadow-2);
  z-index: var(--z-raised);
}

.heatmap-cell--high       { background: var(--google-green); }
.heatmap-cell--medium     { background: var(--google-yellow); color: rgba(0,0,0,0.65); }
.heatmap-cell--low        { background: var(--google-red); }
.heatmap-cell--inprogress { background: var(--google-blue); }
.heatmap-cell--empty      { background: var(--color-neutral-100); }
```

#### 6. Deadline Proximity — Visual Time Warning

```css
/*
  งานที่ใกล้ deadline ให้แสดงสีและ urgency
  > 7 วัน   = Neutral (ไม่เน้น)
  3–7 วัน  = Yellow Warning
  < 3 วัน  = Red Critical
  Overdue  = Red + strikethrough label
*/
.deadline-label { font-size: var(--text-caption); font-weight: var(--weight-semibold); display: inline-flex; align-items: center; gap: 4px; }
.deadline-label--normal   { color: var(--color-neutral-400); }
.deadline-label--warning  { color: var(--status-warning-text); }
.deadline-label--critical { color: var(--status-danger-text); }
.deadline-label--overdue  { color: var(--status-danger-text); text-decoration: line-through; }
```

### Color Decision Tree

```
นักเรียน / Task / CLO ต้องแสดงสีอะไร?

                [มีข้อมูลแล้วหรือยัง?]
                      |
          ไม่มี / กำลังดำเนินการ
                      |
                   BLUE (#4285F4)
                "In Progress / Active"

                      |
                [มีข้อมูลแล้ว — ดูผลลัพธ์]
                      |
         ─────────────────────────────
         |                           |
    [ผ่านเกณฑ์?]              [ไม่ผ่านเกณฑ์]
         |                           |
      GREEN (#34A853)        [ใกล้เกณฑ์หรือวิกฤต?]
    "Completed / High"               |
                          ───────────────────────
                          |                     |
                    ใกล้เกณฑ์             ต่ำกว่าเกณฑ์มาก
                  YELLOW (#FBBC05)        RED (#EA4335)
                  "Watch / Warning"    "At Risk / Overdue"
```

### Usage Rules — Color Discipline

```
DO    ใช้สีเดียวกันให้ consistent ข้ามทุก component ใน session เดียวกัน
DO    แสดง legend หรือ tooltip อธิบายความหมายของสีเสมอ (hover หรือ info icon)
DO    ใช้ icon ประกอบสีเสมอ — อย่าพึ่งพาสีเพียงอย่างเดียว (เพื่อ accessibility)
DO    ใช้ font-weight: 700 กับ status text เพื่อให้อ่านได้โดยไม่ต้องพึ่งสีอย่างเดียว

DON'T ใช้ Red สำหรับ branding หรือ decorative element ใดๆ — Red = Critical เท่านั้น
DON'T ใช้ Yellow บน background สีอ่อน โดยไม่มี border หรือ text สีเข้ม
DON'T สลับ semantic ของสี เช่น ใช้ Red = success หรือ Green = danger
DON'T ใช้ทั้ง 4 สีในหน้าเดียวโดยไม่จำเป็น — ทำให้สายตาล้า
```

---

## 13. Drag & Drop — CLOs and Tasks

### Overview

Drag & Drop ใน Platform นี้ใช้สำหรับ:

- **CLO Reorder** — จัดเรียงลำดับ Course Learning Outcomes ภายใน course
- **Task Reorder** — จัดเรียง Tasks ภายใน CLO เดียวกัน
- **Task Move** — ย้าย Task ข้าม CLO (cross-list move)
- **CLO Group Collapse** — ย่อ/ขยาย CLO group โดยไม่ต้อง drag

### Visual States — Drag & Drop Lifecycle

```
[IDLE]        → ไม่มีอะไรเกิดขึ้น — item แสดงปกติ
[HOVER]       → เมาส์วางบน item — แสดง drag handle icon
[DRAG START]  → กดค้างและเริ่ม drag — item กลายเป็น ghost
[DRAGGING]    → item ลอยตาม cursor — พร้อม drop zone highlight
[OVER TARGET] → item ลอยอยู่เหนือ drop zone ที่ valid
[DROP]        → ปล่อย — animate เข้าตำแหน่งใหม่
[CANCELLED]   → กด Escape — item กลับตำแหน่งเดิม animate
```

### CSS — Drag & Drop

```css
/* ── DRAG HANDLE ──────────────────────────────────── */
.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--color-neutral-200);
  cursor: grab;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
  transition: color 150ms ease, background 150ms ease;
  opacity: 0;                       /* hidden until row hover */
}
.drag-handle:active { cursor: grabbing; }

/* Show handle only on parent hover */
.clo-row:hover   .drag-handle,
.task-row:hover  .drag-handle { opacity: 1; color: var(--color-neutral-400); }
.drag-handle:hover             { background: var(--color-neutral-100); color: var(--color-neutral-600); }

/* ── DRAGGABLE ITEM ───────────────────────────────── */
.draggable-item {
  position: relative;
  transition: box-shadow 180ms ease, transform 180ms ease, opacity 180ms ease;
  user-select: none;
}

/* Ghost — the item being dragged */
.draggable-item.is-dragging {
  opacity: 0.45;
  box-shadow: none;
  transform: none;
  pointer-events: none;
}

/* Drag mirror — floating clone following cursor */
.drag-mirror {
  position: fixed;
  pointer-events: none;
  z-index: var(--z-tooltip);
  transform: rotate(1.5deg) scale(1.02);
  box-shadow: var(--shadow-4);
  opacity: 0.95;
  transition: transform 80ms var(--ease-spring);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-0);
}

/* ── DROP ZONE ────────────────────────────────────── */
.drop-zone {
  transition: all 180ms ease;
  border-radius: var(--radius-md);
}

/* Active drop zone — item hovering over it */
.drop-zone.is-over-valid {
  background: rgba(75, 93, 22, 0.06);
  outline: 2px dashed var(--color-primary-400);
  outline-offset: -2px;
}

/* Invalid drop zone */
.drop-zone.is-over-invalid {
  background: rgba(234, 67, 53, 0.05);
  outline: 2px dashed var(--google-red);
  outline-offset: -2px;
  cursor: no-drop;
}

/* ── DROP INDICATOR LINE ──────────────────────────── */
/*
  เส้นแนวนอนที่แสดงตำแหน่ง insert ก่อน/หลัง item
  ใช้ pseudo-element บน sibling ที่ถูก hover ขณะ drag
*/
.draggable-item.is-drop-before::before,
.draggable-item.is-drop-after::after {
  content: '';
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  height: 2px;
  background: var(--color-primary-600);
  border-radius: var(--radius-full);
  pointer-events: none;
  animation: fadeIn 100ms ease;
}
.draggable-item.is-drop-before::before { top: -1px; }
.draggable-item.is-drop-after::after   { bottom: -1px; }

/* Drop indicator dot caps */
.draggable-item.is-drop-before::before,
.draggable-item.is-drop-after::after {
  box-shadow: -6px 0 0 3px var(--color-primary-600),
               6px 0 0 3px var(--color-primary-600);
}
```

### CLO Row Structure

```tsx
/* CLO Row — draggable group header */
interface CLORowProps {
  clo: CLO;
  index: number;
  isDragging: boolean;
}

function CLORow({ clo, index, isDragging }: CLORowProps) {
  return (
    <div
      className={`clo-row draggable-item ${isDragging ? 'is-dragging' : ''}`}
      data-id={clo.id}
    >
      {/* Drag Handle */}
      <button
        className="drag-handle"
        aria-label={`ลาก CLO ${index + 1} เพื่อจัดเรียง`}
        tabIndex={-1}
      >
        {/* GripVertical icon — 6 dots */}
        <GripVertical size={14} />
      </button>

      {/* CLO Number */}
      <span className="clo-index">CLO {index + 1}</span>

      {/* CLO Title */}
      <span className="clo-title">{clo.title}</span>

      {/* Attainment Rate */}
      <span className={`score-badge score-badge--${getLevel(clo.attainment)}`}>
        {clo.attainment}%
      </span>

      {/* Task Count */}
      <span className="clo-task-count">{clo.tasks.length} tasks</span>

      {/* Collapse Toggle */}
      <button className="clo-collapse-btn" aria-expanded={clo.expanded}>
        <ChevronDown size={14} className={clo.expanded ? 'rotated' : ''} />
      </button>
    </div>
  );
}
```

### Task Row Structure

```tsx
/* Task Row — draggable item inside CLO */
interface TaskRowProps {
  task: Task;
  cloId: string;
  isDragging: boolean;
}

function TaskRow({ task, cloId, isDragging }: TaskRowProps) {
  const deadline = getDeadlineLevel(task.dueDate); /* 'normal' | 'warning' | 'critical' | 'overdue' */

  return (
    <div
      className={`task-row draggable-item ${isDragging ? 'is-dragging' : ''}`}
      data-id={task.id}
      data-clo-id={cloId}
    >
      <button className="drag-handle" tabIndex={-1}>
        <GripVertical size={12} />
      </button>

      {/* Task type icon */}
      <span className="task-type-icon" aria-label={task.type}>
        {TASK_TYPE_ICON[task.type]}
      </span>

      {/* Task title — editable inline on double-click */}
      <span
        className="task-title"
        onDoubleClick={() => startInlineEdit(task.id)}
      >
        {task.title}
      </span>

      {/* Weight */}
      <span className="task-weight">{task.weight}%</span>

      {/* Deadline */}
      <span className={`deadline-label deadline-label--${deadline}`}>
        <Clock size={11} />
        {formatRelativeDate(task.dueDate)}
      </span>

      {/* Status */}
      <span className={`status-chip status-chip--${task.status}`}>
        <span className="chip-dot" />
        {STATUS_LABEL[task.status]}
      </span>
    </div>
  );
}
```

### Cross-CLO Move — Drag Task Between CLOs

```css
/* CLO container ที่รับ task จาก CLO อื่น */
.clo-drop-container {
  min-height: 40px;              /* ให้มีพื้นที่ drop แม้ว่า CLO จะว่าง */
  transition: min-height 200ms ease;
}
.clo-drop-container.is-over-valid {
  min-height: 60px;
  background: rgba(75, 93, 22, 0.04);
  border-radius: var(--radius-md);
}

/* Empty CLO drop area — placeholder text */
.clo-drop-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: var(--text-caption);
  color: var(--color-neutral-200);
  border: 1.5px dashed var(--color-neutral-200);
  border-radius: var(--radius-md);
  transition: all 180ms ease;
  pointer-events: none;
}
.clo-drop-container.is-over-valid .clo-drop-empty {
  color: var(--color-primary-400);
  border-color: var(--color-primary-400);
}
```

### Keyboard Drag & Drop

```
Space / Enter    เมื่อ focus ที่ drag handle — เข้าสู่ drag mode
Arrow Up/Down    ขยับ item ขึ้น/ลงใน list เดียวกัน
Arrow Left/Right ย้าย task ไปยัง CLO ก่อน/หลัง (cross-CLO move)
Escape           ยกเลิก drag กลับตำแหน่งเดิม
Enter / Space    วาง item ที่ตำแหน่งปัจจุบัน (confirm drop)
```

```css
/* Keyboard drag mode — selected item highlight */
.draggable-item.is-keyboard-drag {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
  box-shadow: var(--shadow-3);
  z-index: var(--z-raised);
}
```

### Animation — Drop Completion

```css
/* Item settling into new position */
@keyframes dropSettle {
  0%   { transform: scale(1.02); box-shadow: var(--shadow-3); }
  60%  { transform: scale(0.99); }
  100% { transform: scale(1);    box-shadow: none; }
}
.draggable-item.just-dropped {
  animation: dropSettle 380ms var(--ease-spring) both;
}

/* Item sliding to make room for incoming item */
@keyframes slideApart {
  from { transform: translateY(0); }
  to   { transform: translateY(var(--slide-offset, 48px)); }
}
```

### Implementation Notes (React DnD / dnd-kit)

```tsx
/* dnd-kit recommended — เบากว่า react-beautiful-dnd */
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* Sortable hook usage */
function SortableTaskRow({ task }: { task: Task }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-row draggable-item ${isDragging ? 'is-dragging' : ''}`}
    >
      {/* Only the handle gets listeners */}
      <button className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={12} />
      </button>
      {/* ... rest of task row */}
    </div>
  );
}
```

---

## 14. UX Interaction Principles — Desktop App Feel

Platform นี้ออกแบบให้รู้สึกเหมือน **native desktop application** ไม่ใช่ website ทั่วไป หลักการสำคัญ:

### Core Philosophy

```
"One screen = One complete workflow"
ผู้ใช้ไม่ควรต้องออกจากหน้าปัจจุบันเพื่อทำงานหลักให้เสร็จ
```

### Principle 1 — Minimal Click Depth

**เป้าหมาย:** งานหลักทุกอย่างต้องทำได้ใน 1–2 click

```
WORKFLOW CLICK BUDGET:
  View data        = 0 click  (แสดงทันทีที่โหลดหน้า)
  Edit inline      = 1 click  (double-click to edit)
  Create new item  = 1 click  (+ button หรือ keyboard shortcut)
  Delete item      = 2 clicks (right-click → Delete หรือ select + Del key)
  Move/Reorder     = drag     (ไม่ใช่ click)
  Filter/Sort      = 1 click  (header click หรือ toolbar)

NEVER require:
  - เปิด modal เพื่อดูข้อมูลที่ควร show inline
  - Navigate ไปหน้าใหม่เพื่อ edit field เดียว
  - 3+ clicks สำหรับ action ที่ทำบ่อยที่สุด
```

### Principle 2 — Data Density (Information-First Layout)

แสดงข้อมูลให้ครบในหน้าเดียว ไม่ต้อง scroll หรือ paginate สำหรับ data ที่ผู้ใช้ต้องการเห็นพร้อมกัน

```css
/* Compact Table Row — dense mode */
.table-row--compact {
  height: 40px;                       /* ลดจาก default 52px */
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border-bottom: 1px solid var(--color-neutral-100);
  transition: background 120ms ease;
}
.table-row--compact:hover { background: var(--color-neutral-50); }

/* Normal density */
.table-row--normal { height: 52px; }

/* Comfortable (default for reading) */
.table-row--comfortable { height: 64px; }
```

```css
/* Density Toggle — ผู้ใช้เลือกได้ */
.density-toggle {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--color-neutral-100);
  border-radius: var(--radius-sm);
}
.density-btn {
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-neutral-400);
  transition: all 120ms ease;
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
}
.density-btn.active { background: var(--color-neutral-0); color: var(--color-neutral-800); box-shadow: var(--shadow-1); }
```

### Principle 3 — Inline Editing (No Modal for Simple Edits)

```css
/* Inline editable cell */
.editable-cell {
  cursor: default;
  border-radius: var(--radius-xs);
  padding: 2px 6px;
  margin: -2px -6px;
  transition: background 120ms ease;
}
.editable-cell:hover { background: var(--color-neutral-100); cursor: text; }

/* Active edit state */
.editable-cell.is-editing {
  background: var(--color-neutral-0);
  outline: 2px solid var(--color-primary-600);
  outline-offset: 0;
  cursor: text;
  box-shadow: var(--shadow-focus-primary);
}

/* Editable field — looks like text until focused */
.inline-input {
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  width: 100%;
  padding: 0;
}
.inline-input:focus { background: var(--color-neutral-0); }
```

### Principle 4 — Selection & Multi-Select

```css
/* Row selection */
.selectable-row { position: relative; }

.selectable-row.is-selected {
  background: rgba(75, 93, 22, 0.06);
}
.selectable-row.is-selected::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--color-primary-600);
  border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
}

/* Checkbox — show on hover or when any row selected */
.row-checkbox {
  opacity: 0;
  transition: opacity 120ms ease;
}
.selectable-row:hover .row-checkbox,
.selectable-row.is-selected .row-checkbox,
.table-body.has-selection .row-checkbox { opacity: 1; }

/* Multi-select toolbar — appears when items selected */
.selection-toolbar {
  position: sticky;
  bottom: 0;
  background: var(--color-neutral-900);
  color: var(--color-neutral-50);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  animation: fadeUp 200ms var(--ease-enter) both;
  box-shadow: var(--shadow-4);
  z-index: var(--z-sticky);
}
.selection-count { font-size: var(--text-body-sm); font-weight: var(--weight-semibold); opacity: 0.7; }
```

### Principle 5 — Keyboard Shortcuts

```css
/* Keyboard shortcut hint — shown in tooltips and menus */
.kbd {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-bottom: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: var(--weight-medium);
  color: var(--color-neutral-600);
  line-height: 1.4;
  white-space: nowrap;
}
```

|Action|Shortcut|Context|
|---|---|---|
|New CLO|`N`|Global|
|New Task|`T`|CLO focused|
|Delete selected|`Del` / `Backspace`|Row selected|
|Duplicate|`Ctrl+D`|Row selected|
|Undo|`Ctrl+Z`|Global|
|Redo|`Ctrl+Shift+Z`|Global|
|Select all|`Ctrl+A`|Table focused|
|Focus search|`/`|Global|
|Escape|`Esc`|Close any panel / cancel edit|
|Save inline edit|`Enter`|Editing cell|
|Newline in textarea|`Shift+Enter`|Editing multiline|
|Move row up|`Alt+Up`|Row selected|
|Move row down|`Alt+Down`|Row selected|

### Principle 6 — Persistent Layout State

```ts
/* บันทึก UI state ใน localStorage ให้ layout คง state ไว้ระหว่าง session */
interface LayoutState {
  sidebarWidth: number;           /* user-resizable sidebar */
  tableDensity: 'compact' | 'normal' | 'comfortable';
  collapsedCLOs: string[];        /* CLO ids ที่ถูก collapse */
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  visibleColumns: string[];       /* column visibility toggle */
}

const LAYOUT_STATE_KEY = 'verdure:layout';
```

### Principle 7 — Resizable Panels

```css
/* Resizable divider — drag to resize sidebar / detail panel */
.resize-handle {
  width: 4px;
  background: transparent;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 150ms ease;
  position: relative;
}
.resize-handle:hover,
.resize-handle.is-resizing { background: var(--color-primary-400); }

/* Snap indicator */
.resize-handle::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 2px; height: 32px;
  background: var(--color-primary-600);
  border-radius: var(--radius-full);
  opacity: 0;
  transition: opacity 150ms;
}
.resize-handle:hover::after { opacity: 1; }
```

---

## 15. Right-Click Context Menu — CRUD & Clipboard

Context Menu ปรากฏเมื่อผู้ใช้ right-click บน CLO row, Task row, หรือ selected items ใดๆ แทนที่การกด button แยกต่างหาก — ลดจำนวน click และทำให้ interface สะอาด

### Design Spec

```css
/* ── CONTEXT MENU CONTAINER ──────────────────────── */
.context-menu {
  position: fixed;
  z-index: var(--z-tooltip);
  min-width: 200px;
  max-width: 260px;
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-3);
  padding: var(--space-1) 0;
  animation: scaleIn 140ms var(--ease-spring) both;
  transform-origin: top left;          /* adjusts to bottom/right near viewport edge */
  outline: none;
}

/* ── MENU ITEM ────────────────────────────────────── */
.context-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 7px 14px;
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: var(--weight-regular);
  color: var(--color-neutral-800);
  cursor: pointer;
  transition: background 100ms ease;
  white-space: nowrap;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  user-select: none;
}
.context-menu-item:hover  { background: var(--color-neutral-50); }
.context-menu-item:active { background: var(--color-neutral-100); }

/* Icon */
.context-menu-item .menu-icon {
  width: 15px; height: 15px;
  color: var(--color-neutral-400);
  flex-shrink: 0;
}

/* Keyboard shortcut hint */
.context-menu-item .menu-shortcut {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-neutral-200);
  padding-left: var(--space-6);
}

/* ── DESTRUCTIVE ITEM ─────────────────────────────── */
.context-menu-item--danger {
  color: var(--status-danger-text);
}
.context-menu-item--danger .menu-icon { color: var(--google-red); opacity: 0.7; }
.context-menu-item--danger:hover { background: var(--status-danger-bg); }

/* ── DISABLED ITEM ────────────────────────────────── */
.context-menu-item--disabled {
  opacity: 0.38;
  pointer-events: none;
  cursor: default;
}

/* ── SEPARATOR ────────────────────────────────────── */
.context-menu-separator {
  height: 1px;
  background: var(--color-neutral-100);
  margin: var(--space-1) 0;
}

/* ── SECTION LABEL ────────────────────────────────── */
.context-menu-label {
  padding: 5px 14px 3px;
  font-size: var(--text-overline);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  color: var(--color-neutral-200);
  user-select: none;
}

/* ── SUBMENU TRIGGER ──────────────────────────────── */
.context-menu-item--submenu::after {
  content: '';
  margin-left: auto;
  width: 12px; height: 12px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239AA668' stroke-width='2'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: contain;
  flex-shrink: 0;
}

/* Submenu panel */
.context-submenu {
  position: absolute;
  left: calc(100% + 2px);
  top: -4px;
  min-width: 180px;
  background: var(--color-neutral-0);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-3);
  padding: var(--space-1) 0;
  animation: scaleIn 120ms var(--ease-spring) both;
  transform-origin: top left;
}
```

### Context Menu — Item Schema

```tsx
import {
  Copy, Scissors, Clipboard, Files,
  Pencil, Trash2, Plus, ArrowUpDown,
  MoveUp, MoveDown, Link2, ExternalLink,
  ChevronRight
} from 'lucide-react';

/* Full menu structure for CLO and Task rows */
const CLO_CONTEXT_MENU: ContextMenuItem[] = [
  /* ── EDIT ───────────────────────────── */
  {
    id: 'rename',
    label: 'Rename',
    icon: Pencil,
    shortcut: 'F2',
    action: (id) => startInlineRename(id),
  },
  { type: 'separator' },

  /* ── REORDER ─────────────────────────── */
  { type: 'label', text: 'Reorder' },
  {
    id: 'move-up',
    label: 'Move Up',
    icon: MoveUp,
    shortcut: 'Alt+Up',
    action: (id) => moveItem(id, 'up'),
    disabled: (id) => isFirstItem(id),
  },
  {
    id: 'move-down',
    label: 'Move Down',
    icon: MoveDown,
    shortcut: 'Alt+Down',
    action: (id) => moveItem(id, 'down'),
    disabled: (id) => isLastItem(id),
  },
  { type: 'separator' },

  /* ── CLIPBOARD ───────────────────────── */
  { type: 'label', text: 'Clipboard' },
  {
    id: 'copy',
    label: 'Copy',
    icon: Copy,
    shortcut: 'Ctrl+C',
    action: (id) => copyToClipboard(id),
  },
  {
    id: 'cut',
    label: 'Cut',
    icon: Scissors,
    shortcut: 'Ctrl+X',
    action: (id) => cutItem(id),
  },
  {
    id: 'paste',
    label: 'Paste Below',
    icon: Clipboard,
    shortcut: 'Ctrl+V',
    action: (id) => pasteBelow(id),
    disabled: () => !hasClipboardContent(),
  },
  { type: 'separator' },

  /* ── CLONE ───────────────────────────── */
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: Files,
    shortcut: 'Ctrl+D',
    action: (id) => duplicateItem(id),
  },
  {
    id: 'duplicate-with-tasks',
    label: 'Duplicate with Tasks',
    icon: Files,
    action: (id) => duplicateWithChildren(id),
  },
  { type: 'separator' },

  /* ── CREATE ──────────────────────────── */
  {
    id: 'add-task',
    label: 'Add Task Below',
    icon: Plus,
    shortcut: 'T',
    action: (id) => addTaskToCLO(id),
  },
  { type: 'separator' },

  /* ── DANGER ──────────────────────────── */
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    shortcut: 'Del',
    variant: 'danger',
    action: (id) => confirmAndDelete(id),
  },
];

const TASK_CONTEXT_MENU: ContextMenuItem[] = [
  {
    id: 'rename',
    label: 'Rename',
    icon: Pencil,
    shortcut: 'F2',
    action: (id) => startInlineRename(id),
  },
  { type: 'separator' },
  { type: 'label', text: 'Move to CLO' },
  {
    id: 'move-to-clo',
    label: 'Move to...',
    icon: ArrowUpDown,
    type: 'submenu',
    submenu: () => buildCLOTargetMenu(),   /* dynamic — list of available CLOs */
  },
  { type: 'separator' },
  { type: 'label', text: 'Clipboard' },
  { id: 'copy',      label: 'Copy',          icon: Copy,      shortcut: 'Ctrl+C',  action: copyToClipboard },
  { id: 'cut',       label: 'Cut',           icon: Scissors,  shortcut: 'Ctrl+X',  action: cutItem },
  { id: 'paste',     label: 'Paste Below',   icon: Clipboard, shortcut: 'Ctrl+V',  action: pasteBelow, disabled: () => !hasClipboardContent() },
  { type: 'separator' },
  { id: 'duplicate', label: 'Duplicate',     icon: Files,     shortcut: 'Ctrl+D',  action: duplicateItem },
  { type: 'separator' },
  { id: 'delete',    label: 'Delete',        icon: Trash2,    shortcut: 'Del',     variant: 'danger', action: confirmAndDelete },
];
```

### Context Menu — React Implementation

```tsx
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string;
  targetType: 'clo' | 'task' | 'selection';
}

function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, targetId: '', targetType: 'clo' });
  const menuRef = useRef<HTMLDivElement>(null);

  const open = useCallback((e: React.MouseEvent, targetId: string, targetType: 'clo' | 'task' | 'selection') => {
    e.preventDefault();
    e.stopPropagation();

    /* Viewport edge detection — flip menu if too close to edge */
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = 220;
    const menuH = 320;

    const x = e.clientX + menuW > vw ? e.clientX - menuW : e.clientX;
    const y = e.clientY + menuH > vh ? e.clientY - menuH : e.clientY;

    setMenu({ visible: true, x, y, targetId, targetType });
  }, []);

  const close = useCallback(() => setMenu(m => ({ ...m, visible: false })), []);

  /* Close on outside click, Escape, or scroll */
  useEffect(() => {
    if (!menu.visible) return;
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent && menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handler);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('scroll', close, true);
    };
  }, [menu.visible, close]);

  return { menu, menuRef, open, close };
}

/* Context menu renderer */
function ContextMenu({ menu, menuRef, items, onClose }: ContextMenuProps) {
  if (!menu.visible) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      aria-label="Context actions"
      tabIndex={-1}
      style={{ top: menu.y, left: menu.x }}
    >
      {items.map((item, i) => {
        if (item.type === 'separator') return <div key={i} className="context-menu-separator" />;
        if (item.type === 'label')    return <div key={i} className="context-menu-label">{item.text}</div>;

        const isDisabled = typeof item.disabled === 'function' ? item.disabled(menu.targetId) : item.disabled;

        return (
          <button
            key={item.id}
            className={[
              'context-menu-item',
              item.variant === 'danger'  ? 'context-menu-item--danger'   : '',
              item.type    === 'submenu' ? 'context-menu-item--submenu'  : '',
              isDisabled                 ? 'context-menu-item--disabled' : '',
            ].join(' ')}
            role="menuitem"
            aria-disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) {
                item.action?.(menu.targetId);
                onClose();
              }
            }}
          >
            {item.icon && <item.icon className="menu-icon" size={15} aria-hidden="true" />}
            <span>{item.label}</span>
            {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
```

### Context Menu Attachment — CLO & Task Rows

```tsx
/* On CLO row */
<div
  className="clo-row draggable-item"
  onContextMenu={(e) => contextMenu.open(e, clo.id, 'clo')}
>
  ...
</div>

/* On Task row */
<div
  className="task-row draggable-item"
  onContextMenu={(e) => contextMenu.open(e, task.id, 'task')}
>
  ...
</div>

/* On multi-selection (selected count > 1) */
<div
  className="selectable-row is-selected"
  onContextMenu={(e) => contextMenu.open(e, 'selection', 'selection')}
>
  ...
</div>
```

### Multi-Select Context Menu

```tsx
/* เมื่อ select หลาย items แล้ว right-click */
const MULTI_SELECT_CONTEXT_MENU: ContextMenuItem[] = [
  { type: 'label', text: `{count} items selected` },
  { id: 'copy-all',      label: 'Copy All',          icon: Copy,     action: copyAllSelected },
  { id: 'cut-all',       label: 'Cut All',            icon: Scissors, action: cutAllSelected },
  { id: 'duplicate-all', label: 'Duplicate All',      icon: Files,    action: duplicateAllSelected },
  { type: 'separator' },
  { id: 'move-to',       label: 'Move All to CLO...', icon: ArrowUpDown, type: 'submenu', submenu: buildCLOTargetMenu },
  { type: 'separator' },
  { id: 'delete-all',    label: 'Delete All',         icon: Trash2, variant: 'danger', action: confirmAndDeleteAll },
];
```

### Delete Confirmation — Inline (not modal)

```css
/*
  ไม่ใช้ Modal popup สำหรับ delete confirmation
  ใช้ inline confirmation bar แทน — ไม่ block workflow
*/
.delete-confirm-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px var(--space-4);
  background: var(--status-danger-bg);
  border: 1px solid var(--status-danger-border);
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm);
  color: var(--status-danger-text);
  animation: slideRight 200ms var(--ease-enter) both;
}
.delete-confirm-bar .confirm-label { flex: 1; font-weight: var(--weight-medium); }
.delete-confirm-bar .btn-confirm   { background: var(--google-red); color: #fff; padding: 4px 12px; border-radius: var(--radius-sm); font-size: var(--text-caption); font-weight: var(--weight-bold); border: none; cursor: pointer; }
.delete-confirm-bar .btn-cancel    { background: transparent; border: none; color: var(--status-danger-text); opacity: 0.7; cursor: pointer; padding: 4px 8px; font-size: var(--text-caption); }
.delete-confirm-bar .btn-cancel:hover { opacity: 1; }

/* Auto-dismiss timer bar */
.delete-confirm-timer {
  position: absolute;
  bottom: 0; left: 0;
  height: 2px;
  background: var(--google-red);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  animation: shrinkWidth 5s linear forwards;   /* 5s undo window */
}
@keyframes shrinkWidth {
  from { width: 100%; }
  to   { width: 0%; }
}
```

### Clipboard Internal State

```ts
/* Internal clipboard — ไม่ใช้ system clipboard สำหรับ CLO/Task objects */
interface ClipboardEntry {
  type: 'copy' | 'cut';
  itemType: 'clo' | 'task';
  payload: CLO[] | Task[];
  timestamp: number;
}

/* ตัวอย่าง implementation */
class InternalClipboard {
  private entry: ClipboardEntry | null = null;

  copy(items: CLO[] | Task[], itemType: 'clo' | 'task') {
    this.entry = { type: 'copy', itemType, payload: deepClone(items), timestamp: Date.now() };
    this.showCopyIndicator(items.length);
  }

  cut(items: CLO[] | Task[], itemType: 'clo' | 'task') {
    this.entry = { type: 'cut', itemType, payload: deepClone(items), timestamp: Date.now() };
    this.markAsCut(items);               /* dim original items visually */
  }

  paste(targetId: string): ClipboardEntry | null {
    if (!this.entry) return null;
    if (this.entry.type === 'cut') {
      this.clearCutMarks();
      this.entry = null;                 /* cut = single use */
    }
    return this.entry;
  }

  has(): boolean { return this.entry !== null; }
  clear() { this.entry = null; this.clearCutMarks(); }
}
```

```css
/* Cut visual indicator — dimmed + dashed border */
.draggable-item.is-cut {
  opacity: 0.45;
  outline: 1.5px dashed var(--color-neutral-200);
  outline-offset: 2px;
}

/* Copy flash feedback */
@keyframes copyFlash {
  0%   { background: rgba(66, 133, 244, 0.15); }
  100% { background: transparent; }
}
.draggable-item.just-copied {
  animation: copyFlash 600ms var(--ease-default) both;
}
```
