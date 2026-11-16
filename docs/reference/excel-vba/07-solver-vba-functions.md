# Excel VBA: ฟังก์ชัน Solver (Solver VBA Functions)

> ฉบับแปลภาษาไทยจาก Microsoft Learn ส่วน Concepts → Functions (Solver)
> สารบัญต้นทาง: <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/functions-excel>
> ต้นฉบับ Markdown: <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts/Functions>
> หน้า Overview: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>
>
> คงชื่อฟังก์ชัน/อาร์กิวเมนต์เป็นอังกฤษ ทุกหัวข้อมีบรรทัด **อ้างอิง**
> ฐานลิงก์อ้างอิง: `https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/<ชื่อหน้า>`

## สารบัญ

1. [การใช้ฟังก์ชัน Solver ของ VBA (ขั้นตอนเตรียมการ)](#1-การใช้ฟังก์ชัน-solver-ของ-vba)
2. [ภาพรวมกระบวนการทำงาน](#2-ภาพรวมกระบวนการทำงาน)
3. [SolverOk](#3-solverok)
4. [SolverOkDialog](#4-solverokdialog)
5. [SolverAdd](#5-solveradd)
6. [SolverChange](#6-solverchange)
7. [SolverDelete](#7-solverdelete)
8. [SolverOptions](#8-solveroptions)
9. [SolverSolve](#9-solversolve)
10. [SolverFinish](#10-solverfinish)
11. [SolverFinishDialog](#11-solverfinishdialog)
12. [SolverGet](#12-solverget)
13. [SolverSave](#13-solversave)
14. [SolverLoad](#14-solverload)
15. [SolverReset](#15-solverreset)

---

## 1. การใช้ฟังก์ชัน Solver ของ VBA

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/using-the-solver-vba-functions>

ก่อนใช้ฟังก์ชัน Solver จาก VBA ต้องเปิดใช้ add-in Solver ในกล่องโต้ตอบ **Excel Options**

1. คลิกแท็บ **File** แล้วคลิก **Options** ใต้แท็บ **Excel**
2. ในกล่อง **Excel Options** คลิก **Add-Ins**
3. ในกล่อง **Manage** แบบดรอปดาวน์ เลือก **Excel Add-ins** แล้วคลิก **Go**
4. ในกล่อง **Add-Ins** เลือก **Solver Add-in** แล้วคลิก OK

หลังเปิดใช้ add-in Solver แล้ว Excel จะติดตั้ง add-in อัตโนมัติถ้ายังไม่ได้ติดตั้ง และคำสั่ง **Solver** จะถูกเพิ่มในกลุ่ม **Analysis** ของแท็บ **Data** บน Ribbon

ก่อนใช้ฟังก์ชัน Solver ของ VBA ใน Visual Basic Editor ต้องสร้างการอ้างอิง (reference) ไปยัง add-in Solver ใน Visual Basic Editor ขณะที่มีโมดูลที่ active อยู่ ให้คลิก **References** ในเมนู **Tools** แล้วเลือก **Solver** ใต้ **Available References** ถ้า **Solver** ไม่ปรากฏใต้ **Available References** ให้คลิก **Browse** แล้วเปิดไฟล์ Solver.xlam ในโฟลเดอร์ย่อย \Program Files\Microsoft Office\Office14\Library\SOLVER

(หมายเหตุผู้แปล: เส้นทางข้างต้นตามต้นฉบับซึ่งเป็นของ Office 2010 `Office14` สำหรับ Office รุ่นใหม่ เส้นทางจะต่างออกไป ใช้ **Browse** ค้นหา `Solver.xlam` แทน)

ฟังก์ชันต่อไปนี้ใช้ควบคุม add-in Solver จาก VBA แต่ละฟังก์ชันตรงกับการทำงานที่ทำแบบโต้ตอบได้ผ่านกล่องโต้ตอบ **Solver Parameters, Solver Options** และ **Solver Results**

---

## 2. ภาพรวมกระบวนการทำงาน

(ผู้แปลสรุปจากตัวอย่างในต้นฉบับ)

กระบวนการมาตรฐานในการแก้ปัญหาด้วย Solver จาก VBA:

```
1. เปิด add-in + ตั้ง reference (หัวข้อ 1)
2. SolverReset                      ล้างการตั้งค่าเดิมทั้งหมด
3. SolverOptions ...                ตั้งตัวเลือกขั้นสูง (ไม่บังคับ)
4. SolverOk SetCell, MaxMinVal, ByChange   กำหนดเป้าหมายและเซลล์ที่เปลี่ยนได้
5. SolverAdd ... (ซ้ำตามจำนวนเงื่อนไข)    เพิ่มข้อจำกัด
6. SolverSolve UserFinish:=...       เริ่มแก้ปัญหา → ได้รหัสผลลัพธ์ 0–20
7. SolverFinish / SolverFinishDialog จัดการผลลัพธ์และรายงาน
8. SolverSave                        บันทึกแบบจำลองลงชีต (ไม่บังคับ) → โหลดกลับด้วย SolverLoad
```

| ต้องการ | ใช้ |
| :-- | :-- |
| นิยามปัญหา | `SolverOk`, `SolverAdd`, `SolverOptions` |
| แก้ไขปัญหาที่มี | `SolverChange`, `SolverDelete`, `SolverReset` |
| เก็บ/โหลดแบบจำลอง | `SolverSave`, `SolverLoad` |
| อ่านการตั้งค่า | `SolverGet` |
| รัน | `SolverSolve` |
| จัดการผลลัพธ์ | `SolverFinish`, `SolverFinishDialog` |
| ให้ผู้ใช้เห็น/ปรับเองในกล่องโต้ตอบ | `SolverOkDialog`, `SolverFinishDialog` |

**หมายเหตุร่วมของทุกฟังก์ชัน:** add-in Solver ไม่ได้เปิดใช้โดยค่าเริ่มต้น ต้องเปิดและติดตั้งก่อน แล้วตั้ง reference ตามหัวข้อ 1

---

## 3. SolverOk

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverok-function>

กำหนดแบบจำลอง Solver พื้นฐาน เทียบเท่าการคลิก **Solver** ในกลุ่ม **Data | Analysis** แล้วระบุตัวเลือกในกล่อง **Solver Parameters**

**ไวยากรณ์:** `SolverOk(SetCell, MaxMinVal, ValueOf, ByChange, Engine, EngineDesc)`

| อาร์กิวเมนต์ | ชนิด | คำอธิบาย |
| :-- | :-- | :-- |
| **SetCell** | Variant (ไม่บังคับ) | อ้างถึงเซลล์เดียวบนเวิร์กชีตที่ active ตรงกับกล่อง **Set Target Cell** ในกล่อง Solver Parameters |
| **MaxMinVal** | Variant (ไม่บังคับ) | ตรงกับตัวเลือก **Max, Min, Value** ในกล่อง Solver Parameters |
| **ValueOf** | Variant (ไม่บังคับ) | ถ้า `MaxMinVal` เป็น 3 ต้องระบุค่าที่เซลล์เป้าหมายต้องเท่ากับ |
| **ByChange** | Variant (ไม่บังคับ) | เซลล์หรือช่วงเซลล์ที่จะเปลี่ยนเพื่อให้ได้ผลลัพธ์ที่ต้องการในเซลล์เป้าหมาย ตรงกับกล่อง **By Changing Cells** |
| **Engine** | Variant (ไม่บังคับ) | วิธีแก้ปัญหา: 2 = Simplex LP, 1 = GRG Nonlinear, 3 = Evolutionary ตรงกับรายการดรอปดาวน์ **Select a Solving Method** |
| **EngineDesc** | Variant (ไม่บังคับ) | อีกวิธีระบุวิธีแก้ปัญหาเป็นสตริง: "Simplex LP", "GRG Nonlinear" หรือ "Evolutionary" |

| MaxMinVal | ความหมาย |
| :-- | :-- |
| 1 | Maximize (หาค่าสูงสุด) |
| 2 | Minimize (หาค่าต่ำสุด) |
| 3 | Match a specific value (ให้เท่ากับค่าที่ระบุ) |

> **ข้อสังเกตของผู้แปล:** หน้าต้นฉบับของ `SolverOk` ระบุ Engine "2 for Simplex LP, 1 for GRG Nonlinear" แต่หน้าต้นฉบับของ `SolverOkDialog` ระบุตรงข้าม ("1 for Simplex LP, 2 for GRG Nonlinear") ซึ่งขัดแย้งกัน ควรทดสอบหรือใช้ `EngineDesc` ด้วยสตริงชื่อวิธีแทนเพื่อความชัดเจน

**ตัวอย่าง:** ใช้ฟังก์ชัน Solver หาค่ากำไรขั้นต้นสูงสุดในปัญหาธุรกิจ `SolverOK` กำหนดปัญหาโดยระบุอาร์กิวเมนต์ `SetCell`, `MaxMinVal` และ `ByChange`

```vb
Worksheets("Sheet1").Activate
SolverReset
SolverOptions precision:=0.001
SolverOK SetCell:=Range("TotalProfit"), _
 MaxMinVal:=1, _
 ByChange:=Range("C4:E6")
SolverAdd CellRef:=Range("F4:F6"), _
 Relation:=1, _
 FormulaText:=100
SolverAdd CellRef:=Range("C4:E6"), _
 Relation:=3, _
 FormulaText:=0
SolverAdd CellRef:=Range("C4:E6"), _
 Relation:=4
SolverSolve UserFinish:=False
SolverSave SaveArea:=Range("A33")
```

---

## 4. SolverOkDialog

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverokdialog-function>

เหมือนฟังก์ชัน **SolverOK** แต่แสดงกล่องโต้ตอบ **Solver** ด้วย

**ไวยากรณ์:** `SolverOkDialog(SetCell, MaxMinVal, ValueOf, ByChange, Engine, EngineDesc)` อาร์กิวเมนต์และความหมายเหมือน `SolverOk` ในหัวข้อ 3 (ต้นฉบับพิมพ์ชื่ออาร์กิวเมนต์สุดท้ายซ้ำเป็น `ByChange` ทั้งที่หมายถึง `EngineDesc`)

**ตัวอย่าง:** โหลดแบบจำลอง Solver ที่คำนวณไว้แล้วจาก Sheet1 รีเซ็ตตัวเลือกทั้งหมด แล้วแสดงกล่อง **Solver Parameters** จากจุดนี้ใช้ Solver ด้วยตนเองต่อได้

```vb
Worksheets("Sheet1").Activate
SolverLoad LoadArea:=Range("A33:A38")
SolverReset
SolverOKDialog SetCell:=Range("TotalProfit")
SolverSolve UserFinish:=False
```

---

## 5. SolverAdd

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solveradd-function>

เพิ่มข้อจำกัด (constraint) ให้ปัญหาปัจจุบัน เทียบเท่าการคลิก **Solver** ในกลุ่ม **Data | Analysis** แล้วคลิก **Add** ในกล่อง **Solver Parameters**

**ไวยากรณ์:** `SolverAdd(CellRef, Relation, FormulaText)`

| อาร์กิวเมนต์ | ชนิด | คำอธิบาย |
| :-- | :-- | :-- |
| **CellRef** | Variant (จำเป็น) | การอ้างอิงถึงเซลล์หรือช่วงเซลล์ที่เป็นด้านซ้ายของข้อจำกัด |
| **Relation** | Integer (จำเป็น) | ความสัมพันธ์ทางคณิตศาสตร์ระหว่างด้านซ้ายและขวาของข้อจำกัด ถ้าเลือก 4, 5 หรือ 6 `CellRef` ต้องอ้างถึงเซลล์ตัวแปรตัดสินใจ (decision variable) และไม่ควรระบุ `FormulaText` |
| **FormulaText** | Variant (ไม่บังคับ) | ด้านขวาของข้อจำกัด |

| Relation | ความสัมพันธ์ |
| :-- | :-- |
| 1 | <= |
| 2 | = |
| 3 | >= |
| 4 | เซลล์ที่ `CellRef` อ้างถึงต้องมีค่าสุดท้ายเป็นจำนวนเต็ม |
| 5 | เซลล์ที่ `CellRef` อ้างถึงต้องมีค่าสุดท้ายเป็น 0 หรือ 1 |
| 6 | เซลล์ที่ `CellRef` อ้างถึงต้องมีค่าสุดท้ายเป็นจำนวนเต็มที่ต่างกันทั้งหมด |

**หมายเหตุ:** หลังเพิ่มข้อจำกัดแล้ว จัดการด้วย `SolverChange` และ `SolverDelete`

**ตัวอย่าง:** ใช้ฟังก์ชัน Solver หากำไรขั้นต้นสูงสุด `SolverAdd` เพิ่มข้อจำกัดสามข้อ (F4:F6 ≤ 100, C4:E6 ≥ 0, C4:E6 เป็นจำนวนเต็ม)

```vb
Worksheets("Sheet1").Activate
SolverReset
SolverOptions precision:=0.001
SolverOk setCell:=Range("TotalProfit"), _
 maxMinVal:=1, _
 byChange:=Range("C4:E6")
SolverAdd cellRef:=Range("F4:F6"), _
 relation:=1, _
 formulaText:=100
SolverAdd cellRef:=Range("C4:E6"), _
 relation:=3, _
 formulaText:=0
SolverAdd cellRef:=Range("C4:E6"), _
 relation:=4
SolverSolve userFinish:=False
SolverSave saveArea:=Range("A33")
```

---

## 6. SolverChange

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverchange-function>

เปลี่ยนข้อจำกัดที่มีอยู่ เทียบเท่าการคลิก **Change** ในกล่อง **Solver Parameters**

**ไวยากรณ์:** `SolverChange(CellRef, Relation, FormulaText)` อาร์กิวเมนต์และตาราง `Relation` 1–6 เหมือน `SolverAdd` (ต้นฉบับของฟังก์ชันนี้ระบุว่าถ้าเลือก 4 หรือ 5 `CellRef` ต้องอ้างถึงเซลล์ที่ปรับเปลี่ยนได้ และไม่ควรระบุ `FormulaText`)

**หมายเหตุ:** ถ้า `CellRef` และ `Relation` ไม่ตรงกับข้อจำกัดที่มีอยู่ ต้องใช้ `SolverDelete` และ `SolverAdd` เพื่อเปลี่ยนข้อจำกัด

**ตัวอย่าง:** โหลดแบบจำลอง Solver ที่คำนวณไว้จาก Sheet1 เปลี่ยนข้อจำกัดหนึ่งข้อ (F4:F6 ≤ 200) แล้วแก้ปัญหาอีกครั้ง

```vb
Worksheets("Sheet1").Activate
SolverLoad loadArea:=Range("A33:A38")
SolverChange cellRef:=Range("F4:F6"), _
 relation:=1, _
 formulaText:=200
SolverSolve userFinish:=False
```

---

## 7. SolverDelete

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverdelete-function>

ลบข้อจำกัดที่มีอยู่ เทียบเท่าการคลิก **Delete** ในกล่อง **Solver Parameters**

**ไวยากรณ์:** `SolverDelete(CellRef, Relation, FormulaText)` อาร์กิวเมนต์และตาราง `Relation` เหมือน `SolverAdd`

**ตัวอย่าง:** โหลดแบบจำลองจาก Sheet1 ลบข้อจำกัด "C4:E6 ต้องเป็นจำนวนเต็ม" แล้วแก้ปัญหาอีกครั้ง

```vb
Worksheets("Sheet1").Activate
SolverLoad loadArea:=Range("A33:A38")
SolverDelete cellRef:=Range("C4:E6"), _
 relation:=4
SolverSolve userFinish:=False
```

---

## 8. SolverOptions

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solveroptions-function>

ระบุตัวเลือกขั้นสูงของแบบจำลอง Solver ฟังก์ชันและอาร์กิวเมนต์ตรงกับตัวเลือกในกล่อง **Solver Options**

**ไวยากรณ์:** `SolverOptions(MaxTime, Iterations, Precision, AssumeLinear, StepThru, Estimates, Derivatives, SearchOption, IntTolerance, Scaling, Convergence, AssumeNonNeg, PopulationSize, RandomSeed, MultiStart, RequireBounds, MutationRate, MaxSubproblems, MaxIntegerSols, SolveWithout, MaxTimeNoImp)` — ทุกอาร์กิวเมนต์เป็น Variant ที่ไม่บังคับ

| อาร์กิวเมนต์ | คำอธิบาย |
| :-- | :-- |
| **MaxTime** | เวลาสูงสุด (วินาที) ที่ Solver ใช้แก้ปัญหา ต้องเป็นจำนวนเต็มบวก |
| **Iterations** | จำนวนรอบ (iteration) สูงสุดที่ Solver ใช้ ต้องเป็นจำนวนเต็มบวก |
| **Precision** | ตัวเลข 0 ถึง 1 ระบุระดับความแม่นยำที่ข้อจำกัด (รวมข้อจำกัดจำนวนเต็ม) ต้องเป็นไปตาม ค่าเริ่มต้น 0.000001 จำนวนทศนิยมน้อย (เช่น 0.0001) แปลว่าความแม่นยำต่ำกว่า โดยทั่วไป ยิ่งความแม่นยำสูง (ตัวเลขยิ่งเล็ก) Solver ยิ่งใช้เวลานาน |
| **AssumeLinear** | **True** ให้ Solver สมมติว่าแบบจำลองเป็นเชิงเส้น เร่งกระบวนการแก้ปัญหา แต่ใช้เฉพาะเมื่อความสัมพันธ์ทั้งหมดในแบบจำลองเป็นเชิงเส้น ค่าเริ่มต้น **False** |
| **StepThru** | **True** ให้ Solver หยุดที่ผลทดลองแต่ละครั้ง ส่งมาโครให้ Solver รันทุกครั้งที่หยุดได้ด้วยอาร์กิวเมนต์ `ShowRef` ของ `SolverSolve` **False** ไม่ให้หยุด ค่าเริ่มต้น **False** |
| **Estimates** | วิธีหาค่าประมาณเริ่มต้นของตัวแปรหลักในการค้นหาแบบมิติเดียวแต่ละครั้ง: 1 = tangent estimates (การประมาณเชิงเส้นจากเวกเตอร์สัมผัส), 2 = quadratic estimates (ประมาณแบบกำลังสอง อาจให้ผลดีกับปัญหาไม่เชิงเส้นมาก) ค่าเริ่มต้น 1 |
| **Derivatives** | ระบุการหาผลต่างแบบไปข้างหน้า (forward) หรือตรงกลาง (central) เพื่อประมาณอนุพันธ์ย่อยของฟังก์ชันเป้าหมายและข้อจำกัด: 1 = forward, 2 = central Central ต้องคำนวณเวิร์กชีตใหม่มากกว่า แต่อาจช่วยปัญหาที่ได้ข้อความว่า Solver ปรับปรุงผลเฉลยไม่ได้ สำหรับข้อจำกัดที่ค่าเปลี่ยนเร็วใกล้ขีดจำกัด ควรใช้ central ค่าเริ่มต้น 1 |
| **SearchOption** | อัลกอริทึมค้นหาที่ใช้ในแต่ละ iteration เพื่อตัดสินทิศทางค้นหา: 1 = Newton (quasi-Newton เป็นค่าเริ่มต้น), 2 = conjugate |
| **IntTolerance** | เลขทศนิยม 0 ถึง 100 ระบุเปอร์เซ็นต์ความคลาดเคลื่อน **Integer Optimality** ใช้เมื่อมีข้อจำกัดจำนวนเต็ม Solver หยุดได้ถ้าพบผลเฉลยจำนวนเต็มที่เป็นไปได้ซึ่งค่าเป้าหมายอยู่ในเปอร์เซ็นต์นี้ของขอบเขตที่ดีที่สุดที่ทราบ เปอร์เซ็นต์ยิ่งมาก ยิ่งเร็ว |
| **Scaling** | ถ้าค่าเป้าหมายหรือข้อจำกัดต่างกันหลายระดับขนาด (เช่น หาเปอร์เซ็นต์กำไรจากการลงทุนระดับล้านดอลลาร์) ตั้ง **True** ให้ Solver ปรับขนาดค่าภายในให้ใกล้เคียงกัน ถ้า **False** ใช้ค่าดั้งเดิม ค่าเริ่มต้น **True** |
| **Convergence** | ตัวเลข 0 ถึง 1 ระบุความคลาดเคลื่อนการลู่เข้าของวิธี **GRG Nonlinear** และ **Evolutionary** สำหรับ GRG ถ้าการเปลี่ยนแปลงสัมพัทธ์ของค่าเซลล์เป้าหมายน้อยกว่าค่านี้ในห้า iteration ล่าสุด Solver หยุด สำหรับ Evolutionary เมื่อสมาชิกประชากร 99% ขึ้นไปมีค่า "fitness" ที่ต่างกันเป็นสัดส่วนน้อยกว่าค่านี้ Solver หยุด ทั้งสองกรณีแสดงข้อความ "Solver converged to the current solution. All constraints are satisfied." |
| **AssumeNonNeg** | **True** ให้ Solver สมมติขอบล่าง 0 สำหรับเซลล์ตัวแปรตัดสินใจที่ไม่มีขอบล่างระบุชัดในรายการ **Constraint** **False** ใช้เฉพาะขอบเขตที่ระบุในรายการ Constraint |
| **PopulationSize** | (ต้นฉบับใช้คำอธิบายซ้ำกับ `AssumeNonNeg`) ตัวเลือกขนาดประชากรของวิธี GRG Nonlinear/Evolutionary ตามหัวข้อ `SolverGet` TypeNum 21 |
| **RandomSeed** | จำนวนเต็มบวกกำหนด seed คงที่ของตัวสร้างเลขสุ่มที่วิธี **Evolutionary** และวิธี multistart ใช้ ทำให้ Solver ได้ผลเฉลยเดิมทุกครั้งกับแบบจำลองที่ไม่เปลี่ยน ค่าศูนย์ให้ใช้ seed ต่างกันทุกครั้ง ซึ่งอาจได้ผลเฉลยต่างกัน |
| **MultiStart** | **True** ให้ใช้วิธี multistart สำหรับการหาค่าเหมาะสมที่สุดแบบ global กับวิธี **GRG Nonlinear** เมื่อเรียก `SolverSolve` **False** ให้รันวิธี GRG เพียงครั้งเดียว |
| **RequireBounds** | **True** ให้วิธี Evolutionary และ multistart คืนจาก `SolverSolve` ทันทีด้วยค่า 18 ถ้ามีตัวแปรใดไม่มีทั้งขอบล่างและขอบบน **False** ให้พยายามแก้ปัญหาโดยไม่ต้องมีขอบเขตทุกตัวแปร |
| **MutationRate** | ตัวเลข 0 ถึง 1 ระบุอัตราที่วิธี **Evolutionary** ทำ "การกลายพันธุ์" กับสมาชิกประชากรที่มีอยู่ อัตราสูงมักเพิ่มความหลากหลายของประชากรและอาจได้ผลเฉลยดีขึ้น |
| **MaxSubproblems** | จำนวนปัญหาย่อยสูงสุดที่ Solver สำรวจในปัญหาที่มีข้อจำกัดจำนวนเต็มและปัญหาที่แก้ด้วยวิธี Evolutionary ต้องเป็นจำนวนเต็มบวก |
| **MaxIntegerSols** | จำนวนผลเฉลยที่เป็นไปได้ (หรือเป็นจำนวนเต็มที่เป็นไปได้) สูงสุดที่ Solver พิจารณาในปัญหาที่มีข้อจำกัดจำนวนเต็มและปัญหา Evolutionary ต้องเป็นจำนวนเต็มบวก |
| **SolveWithout** | **True** ให้ Solver ละเว้นข้อจำกัดจำนวนเต็มทั้งหมดและแก้ปัญหา "relaxation" **False** ให้ใช้ข้อจำกัดจำนวนเต็ม |
| **MaxTimeNoImp** | เมื่อใช้วิธี Evolutionary เวลาสูงสุด (วินาที) ที่ Solver แก้ปัญหาต่อไปโดยไม่พบผลเฉลยที่ดีขึ้นอย่างมีนัยสำคัญเพิ่มเข้าประชากร ต้องเป็นจำนวนเต็มบวก |

**ตัวอย่าง:** ตั้งตัวเลือก **Precision** เป็น .001

```vb
Worksheets("Sheet1").Activate
SolverReset
SolverOptions Precision:=0.001
SolverOK SetCell:=Range("TotalProfit"), _
    MaxMinVal:=1, _
    ByChange:=Range("C4:E6")
SolverAdd CellRef:=Range("F4:F6"), _
    Relation:=1, _
    FormulaText:=100
SolverAdd CellRef:=Range("C4:E6"), _
    Relation:=3, _
    FormulaText:=0
SolverAdd CellRef:=Range("C4:E6"), _
    Relation:=4
SolverSolve UserFinish:=False
SolverSave SaveArea:=Range("A33")
```

---

## 9. SolverSolve

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solversolve-function>

เริ่มการแก้ปัญหาด้วย Solver เทียบเท่าการคลิก **Solve** ในกล่อง **Solver Parameters**

**ไวยากรณ์:** `SolverSolve(UserFinish, ShowRef)`

- **UserFinish** (Variant ไม่บังคับ): **True** คืนผลโดยไม่แสดงกล่อง **Solver Results** **False** หรือละไว้ คืนผลและแสดงกล่อง **Solver Results**
- **ShowRef** (Variant ไม่บังคับ): ส่งชื่อมาโคร (เป็นสตริง) เป็นอาร์กิวเมนต์ `ShowRef` มาโครนี้จะถูกเรียกแทนการแสดงกล่อง **Show Trial Solution** ทุกครั้งที่ Solver หยุดด้วยเหตุผลต่อไปนี้ มาโคร `ShowRef` ต้องมีรูปแบบ `Function name (Reason As Integer)` โดย `Reason` เป็นจำนวนเต็ม 1 ถึง 5:

  1. ถูกเรียก (ทุก iteration) เพราะเลือกกล่อง **Show Iteration Results** ใน Solver Options หรือเพราะผู้ใช้กด ESC เพื่อขัดจังหวะ Solver
  2. ถูกเรียกเพราะเกินขีดจำกัด **Max Time**
  3. ถูกเรียกเพราะเกินขีดจำกัด **Iterations**
  4. ถูกเรียกเพราะเกินขีดจำกัด **Maximum Subproblems**
  5. ถูกเรียกเพราะเกินขีดจำกัด **Maximum Feasible Solutions**

  ฟังก์ชันมาโครต้องคืน **1** ถ้า Solver ควรหยุด (เหมือนปุ่ม **Stop**) หรือ **0** ถ้า Solver ควรทำงานต่อ (เหมือนปุ่ม **Continue**) มาโคร `ShowRef` ตรวจดูค่าผลเฉลยปัจจุบันบนเวิร์กชีตหรือทำอย่างอื่นได้ เช่น บันทึกหรือสร้างกราฟค่าระหว่างทาง แต่ไม่ควรเปลี่ยนค่าในเซลล์ตัวแปร หรือเปลี่ยนสูตรในเซลล์เป้าหมายและข้อจำกัด เพราะอาจส่งผลเสียต่อกระบวนการแก้ปัญหา

### ค่าที่ SolverSolve คืน

ถ้ายังนิยามปัญหา Solver ไม่ครบ `SolverSolve` คืนค่า error #N/A ถ้าไม่ใช่ Solver จะรัน และ `SolverSolve` คืนจำนวนเต็มที่ตรงกับข้อความที่ปรากฏในกล่อง **Solver Results**:

| ค่าที่คืน | ข้อความ |
| :-- | :-- |
| 0 | Solver found a solution. All constraints and optimality conditions are satisfied. (พบผลเฉลย) |
| 1 | Solver has converged to the current solution. All constraints are satisfied. (ลู่เข้าสู่ผลเฉลยปัจจุบัน) |
| 2 | Solver cannot improve the current solution. All constraints are satisfied. (ปรับปรุงผลเฉลยไม่ได้อีก) |
| 3 | Stop chosen when the maximum iteration limit was reached. (หยุดเมื่อถึงขีดจำกัด iteration) |
| 4 | The Objective Cell values don't converge. (ค่าเซลล์เป้าหมายไม่ลู่เข้า) |
| 5 | Solver could not find a feasible solution. (ไม่พบผลเฉลยที่เป็นไปได้) |
| 6 | Solver stopped at user's request. (หยุดตามคำขอของผู้ใช้) |
| 7 | The linearity conditions required by this LP Solver are not satisfied. (เงื่อนไขเชิงเส้นไม่เป็นไปตามที่ LP Solver ต้องการ) |
| 8 | The problem is too large for Solver to handle. (ปัญหาใหญ่เกินไป) |
| 9 | Solver encountered an error value in a target or constraint cell. (พบค่า error ในเซลล์เป้าหมายหรือข้อจำกัด) |
| 10 | Stop chosen when the maximum time limit was reached. (หยุดเมื่อถึงขีดจำกัดเวลา) |
| 11 | There is not enough memory available to solve the problem. (หน่วยความจำไม่พอ) |
| 13 | Error in model. Please verify that all cells and constraints are valid. (แบบจำลองผิดพลาด) |
| 14 | Solver found an integer solution within tolerance. All constraints are satisfied. (พบผลเฉลยจำนวนเต็มภายในความคลาดเคลื่อน) |
| 15 | Stop chosen when the maximum number of feasible [integer] solutions was reached. |
| 16 | Stop chosen when the maximum number of feasible [integer] subproblems was reached. |
| 17 | Solver converged in probability to a global solution. (ลู่เข้าสู่ผลเฉลย global ในเชิงความน่าจะเป็น) |
| 18 | All variables must have both upper and lower bounds. (ตัวแปรทุกตัวต้องมีขอบบนและขอบล่าง) |
| 19 | Variable bounds conflict in binary or all different constraint. |
| 20 | Lower and upper bounds on variables allow no feasible solution. |

**ตัวอย่าง:** `SolverSolve` เริ่มการแก้ปัญหา Solver เรียกฟังก์ชัน `ShowTrial` เมื่อเกิดเงื่อนไขทั้งห้าข้อใดข้อหนึ่ง ฟังก์ชันนี้เพียงแสดงข้อความด้วยจำนวนเต็ม 1 ถึง 5

```vb
Worksheets("Sheet1").Activate
SolverReset
SolverOptions Precision:=0.001
SolverOK SetCell:=Range("TotalProfit"), _
    MaxMinVal:=1, _
    ByChange:=Range("C4:E6")
SolverAdd CellRef:=Range("F4:F6"), _
    Relation:=1, _
    FormulaText:=100
SolverAdd CellRef:=Range("C4:E6"), _
    Relation:=3, _
    FormulaText:=0
SolverAdd CellRef:=Range("C4:E6"), _
    Relation:=4
SolverSolve UserFinish:=False, ShowRef:= "ShowTrial"
SolverSave SaveArea:=Range("A33")

Function ShowTrial(Reason As Integer)
  Msgbox Reason
  ShowTrial = 0
End Function
```

**เทคนิค:** ตรวจค่าที่คืนจาก `SolverSolve` เสมอ (0, 1, 2, 14, 17 โดยทั่วไปถือว่าสำเร็จ; 5, 7, 8 ฯลฯ เป็นปัญหา) แล้วจึงตัดสินใจใน `SolverFinish` ว่าจะเก็บหรือทิ้งผลเฉลย

---

## 10. SolverFinish

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverfinish-function>

บอก Microsoft Office Excel ว่าจะทำอย่างไรกับผลลัพธ์ และสร้างรายงานชนิดใดเมื่อกระบวนการแก้ปัญหาเสร็จสิ้น

**ไวยากรณ์:** `SolverFinish(KeepFinal, ReportArray, OutlineReports)`

- **KeepFinal** (Variant ไม่บังคับ): 1 หรือ 2 ถ้า 1 หรือละไว้ ค่าผลเฉลยสุดท้ายถูกเก็บในเซลล์ที่เปลี่ยน แทนที่ค่าเดิม ถ้า 2 ค่าผลเฉลยสุดท้ายถูกทิ้ง และคืนค่าเดิม
- **ReportArray** (Variant ไม่บังคับ): ชนิดรายงานที่ Excel จะสร้างเมื่อ Solver เสร็จ
  - เมื่อใช้วิธี Simplex LP หรือ GRG Nonlinear: 1 = Answer report, 2 = Sensitivity report, 3 = Limit report
  - เมื่อใช้วิธี Evolutionary: 1 = Answer report, 2 = Population report
  - เมื่อ `SolverSolve` คืน 5 (หาผลเฉลยที่เป็นไปได้ไม่ได้): 1 = Feasibility Report, 2 = Feasibility-Bounds report
  - เมื่อ `SolverSolve` คืน 7 (ไม่เป็นไปตามเงื่อนไขเชิงเส้น): 1 = Linearity report

  ใช้ฟังก์ชัน **Array** ระบุรายงานที่ต้องการ เช่น `ReportArray:= Array(1,3)`
- **OutlineReports** (Variant ไม่บังคับ): **True** หรือ **False** ถ้า **False** หรือละไว้ รายงานอยู่ในรูปแบบ "ปกติ" ไม่มี outline ถ้า **True** รายงานมีกลุ่ม outline ตรงกับช่วงเซลล์ที่ป้อนสำหรับตัวแปรตัดสินใจและข้อจำกัด

**ตัวอย่าง:** โหลดแบบจำลองจาก Sheet1 แก้ปัญหาอีกครั้ง แล้วสร้างรายงาน Answer บนเวิร์กชีตใหม่

```vb
Worksheets("Sheet1").Activate
SolverLoad LoadArea:=Range("A33:A38")
SolverSolve UserFinish:=True
SolverFinish KeepFinal:=1, ReportArray:=Array(1)
```

---

## 11. SolverFinishDialog

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverfinishdialog-function>

เหมือน **SolverFinish** แต่แสดงกล่อง **Solver Results** หลังแก้ปัญหาด้วย

**ไวยากรณ์:** `SolverFinishDialog(KeepFinal, ReportArray, OutlineReports)` อาร์กิวเมนต์และความหมายเหมือน `SolverFinish` ในหัวข้อ 10

**ตัวอย่าง:** โหลดแบบจำลองจาก Sheet1 แก้ปัญหาอีกครั้ง แล้วแสดงกล่อง **Finish** พร้อมตัวเลือกที่ตั้งไว้ล่วงหน้าสองตัว

```vb
Worksheets("Sheet1").Activate
SolverLoad loadArea:=Range("A33:A38")
SolverSolve userFinish:=True
SolverFinishDialog keepFinal:=1, reportArray:=Array(1)
```

---

## 12. SolverGet

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverget-function>

คืนข้อมูลการตั้งค่าปัจจุบันของ Solver ซึ่งระบุในกล่อง **Solver Parameters** และ **Solver Options**

**ไวยากรณ์:** `SolverGet(TypeNum, SheetName)`

- **TypeNum** (Integer จำเป็น): ตัวเลขที่ระบุชนิดข้อมูลที่ต้องการ
- **SheetName** (Variant ไม่บังคับ): ชื่อชีตที่มีแบบจำลอง Solver ที่ต้องการข้อมูล ถ้าละไว้ จะถือว่าเป็นชีตที่ active

**การตั้งค่าที่ระบุในกล่อง Solver Parameters:**

| TypeNum | คืนค่า |
| :-- | :-- |
| 1 | การอ้างอิงในกล่อง **Set Target Cell** หรือค่า error #N/A ถ้ายังไม่เคยใช้ Solver บนชีตที่ active |
| 2 | ตัวเลขตรงกับตัวเลือก **Equal To**: 1 = Max, 2 = Min, 3 = Value Of |
| 3 | ค่าในกล่อง **Value Of** |
| 4 | การอ้างอิง (เป็น multiple reference ถ้าจำเป็น) ในกล่อง **By Changing Cells** |
| 5 | จำนวนข้อจำกัด |
| 6 | อาร์เรย์ของด้านซ้ายของข้อจำกัด ในรูปข้อความ |
| 7 | อาร์เรย์ของตัวเลขแทนความสัมพันธ์ระหว่างด้านซ้ายและขวา: 1 = <=, 2 = =, 3 = >=, 4 = int, 5 = bin |
| 8 | อาร์เรย์ของด้านขวาของข้อจำกัด ในรูปข้อความ |
| 13 | **True** ถ้าเลือกวิธี **Simple LP Solving**; **False** ถ้าเลือกวิธีอื่น |
| 20 | **True** ถ้าเลือกช่องกาเครื่องหมาย **Make Unconstrained Variables Non-Negative**; **False** ถ้าไม่ได้เลือก |

**การตั้งค่าที่ระบุในกล่อง Solver Options:**

| TypeNum | คืนค่า |
| :-- | :-- |
| 9 | ตัวเลือก **Max Time (Seconds)** (แท็บ All Methods) |
| 10 | ตัวเลือก **Iterations** (แท็บ All Methods) |
| 11 | ตัวเลือก **Constraint Precision** (แท็บ All Methods) |
| 12 | ตัวเลือก **Integer Optimality (%)** (แท็บ All Methods) |
| 14 | **True** ถ้าเลือก **Show Iteration Results** |
| 15 | **True** ถ้าเลือก **Use Automatic Scaling** (แท็บ All Methods) |
| 16 | ชนิดการประมาณ: 1 = Tangent, 2 = Quadratic |
| 17 | ตัวเลือก **Derivatives** ในแท็บ GRG Nonlinear: 1 = Forward, 2 = Central |
| 18 | ชนิดการค้นหา: 1 = Newton, 2 = Conjugate |
| 19 | ค่าคลาดเคลื่อน **Convergence** (แท็บ GRG Nonlinear และ Evolutionary) |
| 21 | ตัวเลือก **Population Size** (แท็บ GRG Nonlinear และ Evolutionary) |
| 22 | ตัวเลือก **Random Seed** (แท็บ GRG Nonlinear และ Evolutionary) |
| 23 | **True** ถ้าเลือก **Use Multistart** (แท็บ GRG Nonlinear) |
| 24 | **True** ถ้าเลือก **Require Bounds on Variables** (แท็บ GRG Nonlinear และ Evolutionary) |
| 25 | ตัวเลือก **Mutation Rate** (แท็บ Evolutionary) |
| 26 | ตัวเลือก **Max Subproblems** (แท็บ All Methods) |
| 27 | ตัวเลือก **Max Feasible Solutions** (แท็บ All Methods) |
| 28 | ตัวเลือก **Ignore Integer Constraints** (แท็บ All Methods) |
| 29 | ตัวเลือก **Maximum Time without Improvement** (แท็บ Evolutionary) |

**ตัวอย่าง:** แสดงข้อความถ้ายังไม่เคยใช้ Solver บน Sheet1

```vb
Worksheets("Sheet1").Activate
state = SolverGet(TypeNum:=1)
If IsError(State) Then
 MsgBox "You have not used Solver on the active sheet"
End If
```

---

## 13. SolverSave

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solversave-function>

บันทึกข้อกำหนดของปัญหา Solver ลงบนเวิร์กชีต

**ไวยากรณ์:** `SolverSave(SaveArea)`

- **SaveArea** (Variant จำเป็น): ช่วงเซลล์ที่จะบันทึกแบบจำลอง Solver ถ้าเป็นช่วงเซลล์เดียว Solver ใช้เซลล์เท่าที่ต้องการในคอลัมน์เริ่มจากเซลล์ที่ระบุ ถ้าเป็นช่วงหลายเซลล์ Solver ใช้เฉพาะเซลล์ในช่วงนั้น แม้บันทึกแบบจำลองไม่ครบ ช่วงที่แทนด้วย `SaveArea` อยู่บนเวิร์กชีตใดก็ได้ แต่ต้องระบุชื่อเวิร์กชีตถ้าไม่ใช่ชีตที่ active เช่น `SolverSave("Sheet2!A1:A3")` บันทึกแบบจำลองบน Sheet2 แม้ Sheet2 ไม่ใช่ชีตที่ active

**ตัวอย่าง:** `SolverSave` บันทึกปัญหาปัจจุบันลงช่วงบนเวิร์กชีตที่ active

```vb
Worksheets("Sheet1").Activate
SolverReset
SolverOptions Precision:=0.001
SolverOK SetCell:=Range("TotalProfit"), _
 MaxMinVal:=1, _
 ByChange:=Range("C4:E6")
SolverAdd CellRef:=Range("F4:F6"), _
 Relation:=1, _
 FormulaText:=100
SolverAdd CellRef:=Range("C4:E6"), _
 Relation:=3, _
 FormulaText:=0
SolverAdd CellRef:=Range("C4:E6"), _
 Relation:=4
SolverSolve UserFinish:=False
SolverSave SaveArea:=Range("A33")
```

---

## 14. SolverLoad

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverload-function>

โหลดพารามิเตอร์แบบจำลอง Solver ที่บันทึกไว้บนเวิร์กชีต

**ไวยากรณ์:** `SolverLoad(LoadArea, Merge)`

- **LoadArea** (Variant จำเป็น): การอ้างอิงบนเวิร์กชีตที่ active ไปยังช่วงเซลล์ที่ต้องการโหลดข้อกำหนดปัญหาทั้งหมด เซลล์แรกใน `LoadArea` เก็บสูตรสำหรับกล่อง **Set Target Cell** เซลล์ที่สองเก็บสูตรสำหรับกล่อง **By Changing Cells** เซลล์ถัดไปเก็บข้อจำกัดในรูปสูตรตรรกะ เซลล์สุดท้ายอาจเก็บอาร์เรย์ของค่าตัวเลือก Solver (ดู `SolverOptions`) ช่วงที่แทนด้วย `LoadArea` อยู่บนเวิร์กชีตใดก็ได้ แต่ต้องระบุชื่อเวิร์กชีตถ้าไม่ใช่ชีตที่ active เช่น `SolverLoad("Sheet2!A1:A3")` โหลดแบบจำลองจาก Sheet2 แม้ไม่ active
- **Merge** (Variant ไม่บังคับ): ค่าตรรกะที่ตรงกับปุ่ม **Merge** หรือ **Replace** ในกล่องโต้ตอบที่ปรากฏหลังเลือกการอ้างอิง **LoadArea** แล้วคลิก **OK** ถ้า **True** ตัวแปรและข้อจำกัดจาก LoadArea จะถูกรวมกับตัวแปรและข้อจำกัดที่กำหนดอยู่ปัจจุบัน ถ้า **False** หรือละไว้ ข้อกำหนดและตัวเลือกของแบบจำลองปัจจุบันจะถูกลบ (เทียบเท่าเรียก `SolverReset`) ก่อนโหลดข้อกำหนดใหม่

**ตัวอย่าง:** โหลดแบบจำลองที่คำนวณไว้จาก Sheet1 เปลี่ยนข้อจำกัดหนึ่งข้อ แล้วแก้ปัญหาอีกครั้ง

```vb
Worksheets("Sheet1").Activate
SolverLoad loadArea:=Range("A33:A38")
SolverChange cellRef:=Range("F4:F6"), _
 relation:=1, _
 formulaText:=200
SolverSolve userFinish:=False
```

---

## 15. SolverReset

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/functions/solverreset-function>

รีเซ็ตการเลือกเซลล์และข้อจำกัดทั้งหมดในกล่อง **Solver Parameters** และคืนการตั้งค่าทั้งหมดในกล่อง **Solver Options** เป็นค่าเริ่มต้น เทียบเท่าการคลิก **Reset All** ในกล่อง Solver Parameters ฟังก์ชัน **SolverReset** ถูกเรียกอัตโนมัติเมื่อเรียก **SolverLoad** ถ้าอาร์กิวเมนต์ **Merge** เป็น **False** หรือละไว้

**ไวยากรณ์:** `SolverReset()`

**ตัวอย่าง:** รีเซ็ตการตั้งค่า Solver เป็นค่าเริ่มต้นก่อนนิยามปัญหาใหม่

```vb
Worksheets("Sheet1").Activate
SolverReset
SolverOptions Precision:=0.001
SolverOK SetCell:=Range("TotalProfit"), _
 MaxMinVal:=1, _
 ByChange:=Range("C4:E6")
SolverAdd CellRef:=Range("F4:F6"), _
 Relation:=1, _
 FormulaText:=100
SolverAdd CellRef:=Range("C4:E6"), _
 Relation:=3, _
 FormulaText:=0
SolverAdd CellRef:=Range("C4:E6"), _
 Relation:=4
SolverSolve UserFinish:=False
SolverSave SaveArea:=Range("A33")
```

---

> ต้นฉบับ © Microsoft เผยแพร่บน Microsoft Learn (MicrosoftDocs/VBA-Docs) เอกสารนี้เป็นฉบับแปลเพื่อการศึกษา โปรดเทียบกับต้นฉบับเมื่อใช้งานจริง
