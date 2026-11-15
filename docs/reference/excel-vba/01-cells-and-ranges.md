# Excel VBA: เซลล์และช่วงข้อมูล (Cells and Ranges)

> ฉบับแปลภาษาไทยจากเอกสาร Microsoft Learn ส่วน Concepts → Cells and ranges
> หน้าสารบัญต้นทาง: <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/cells-and-ranges>
> หน้า Overview ต้นทาง: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>
> ต้นฉบับ Markdown (GitHub): <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts/Cells-and-Ranges>
>
> หมายเหตุการแปล: แปลเนื้อหาและคอมเมนต์ในโค้ดเป็นไทย คงชื่อ object / property / method / ค่าคงที่ของ VBA เป็นภาษาอังกฤษตามต้นฉบับ
> ทุกหัวข้อมีบรรทัด **อ้างอิง** ชี้กลับไปยังหน้าต้นฉบับ

## สารบัญ

1. [ค่าข้อผิดพลาดของเซลล์ (Cell Error Values)](#1-ค่าข้อผิดพลาดของเซลล์)
2. [การอ้างอิงเซลล์และช่วงข้อมูล (ภาพรวม)](#2-การอ้างอิงเซลล์และช่วงข้อมูล-ภาพรวม)
3. [อ้างอิงเซลล์ทั้งหมดบนเวิร์กชีต](#3-อ้างอิงเซลล์ทั้งหมดบนเวิร์กชีต)
4. [อ้างอิงด้วยสัญกรณ์ A1](#4-อ้างอิงด้วยสัญกรณ์-a1)
5. [อ้างอิงด้วยวัตถุ Range](#5-อ้างอิงด้วยวัตถุ-range)
6. [อ้างอิงด้วยหมายเลขดัชนี (Cells)](#6-อ้างอิงด้วยหมายเลขดัชนี)
7. [อ้างอิงด้วยสัญกรณ์ลัด](#7-อ้างอิงด้วยสัญกรณ์ลัด)
8. [อ้างอิงเซลล์สัมพัทธ์กับเซลล์อื่น (Offset)](#8-อ้างอิงเซลล์สัมพัทธ์กับเซลล์อื่น)
9. [อ้างอิงหลายช่วงพร้อมกัน](#9-อ้างอิงหลายช่วงพร้อมกัน)
10. [อ้างอิง Named Range](#10-อ้างอิง-named-range)
11. [อ้างอิงแถวและคอลัมน์](#11-อ้างอิงแถวและคอลัมน์)
12. [เลือกช่วงข้อมูล (Select a Range)](#12-เลือกช่วงข้อมูล)
13. [การเลือกและการทำให้เซลล์ Active](#13-การเลือกและการทำให้เซลล์-active)
14. [ทำงานกับ Active Cell](#14-ทำงานกับ-active-cell)
15. [ช่วงข้อมูลแบบ 3 มิติ (3-D Ranges)](#15-ช่วงข้อมูลแบบ-3-มิติ)
16. [วนลูปผ่านช่วงของเซลล์](#16-วนลูปผ่านช่วงของเซลล์)
17. [Formula กับ Formula2](#17-formula-กับ-formula2)
18. [ลบรายการซ้ำในช่วงข้อมูล](#18-ลบรายการซ้ำในช่วงข้อมูล)
19. [เติมค่าลงในเซลล์ว่างในคอลัมน์](#19-เติมค่าลงในเซลล์ว่างในคอลัมน์)
20. [ซ่อน/แสดงคอลัมน์](#20-ซ่อนแสดงคอลัมน์)
21. [ไฮไลต์เซลล์ แถว หรือคอลัมน์ที่ Active](#21-ไฮไลต์เซลล์-แถว-หรือคอลัมน์ที่-active)
22. [ทำให้เซลล์กะพริบ](#22-ทำให้เซลล์กะพริบ)
23. [ป้องกันการกรอกค่าซ้ำในช่วงข้อมูล](#23-ป้องกันการกรอกค่าซ้ำในช่วงข้อมูล)
24. [สร้างไฟล์ HTML สารบัญจากข้อมูลในเซลล์](#24-สร้างไฟล์-html-สารบัญจากข้อมูลในเซลล์)
25. [สรุปเทคนิคและแนวปฏิบัติที่ดี](#25-สรุปเทคนิคและแนวปฏิบัติที่ดี)

---

## 1. ค่าข้อผิดพลาดของเซลล์

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/cell-error-values>

ใช้ฟังก์ชัน **CVErr** เพื่อใส่ค่า error ลงในเซลล์ หรือทดสอบว่าเซลล์มีค่า error หรือไม่ ค่า error ระบุด้วยค่าคงที่ชุด **xlCVError**

| ค่าคงที่ | หมายเลข error | ค่า error ในเซลล์ |
| :-- | :-- | :-- |
| `xlErrDiv0` | 2007 | #DIV/0! |
| `xlErrNA` | 2042 | #N/A |
| `xlErrName` | 2029 | #NAME? |
| `xlErrNull` | 2000 | #NULL! |
| `xlErrNum` | 2036 | #NUM! |
| `xlErrRef` | 2023 | #REF! |
| `xlErrValue` | 2015 | #VALUE! |

**ตัวอย่างที่ 1** ใส่ error ทั้งเจ็ดชนิดลงในเซลล์ A1:A7 ของ Sheet1

```vb
myArray = Array(xlErrDiv0, xlErrNA, xlErrName, xlErrNull, _
 xlErrNum, xlErrRef, xlErrValue)
For i = 1 To 7
 Worksheets("Sheet1").Cells(i, 1).Value = CVErr(myArray(i - 1))
Next i
```

**ตัวอย่างที่ 2** แสดงข้อความถ้า active cell ของ Sheet1 มีค่า error ใช้เป็นโครงตั้งต้นของตัวจัดการ error ระดับเซลล์ได้

```vb
Worksheets("Sheet1").Activate
If IsError(ActiveCell.Value) Then
 errval = ActiveCell.Value
 Select Case errval
 Case CVErr(xlErrDiv0)
 MsgBox "#DIV/0! error"
 Case CVErr(xlErrNA)
 MsgBox "#N/A error"
 Case CVErr(xlErrName)
 MsgBox "#NAME? error"
 Case CVErr(xlErrNull)
 MsgBox "#NULL! error"
 Case CVErr(xlErrNum)
 MsgBox "#NUM! error"
 Case CVErr(xlErrRef)
 MsgBox "#REF! error"
 Case CVErr(xlErrValue)
 MsgBox "#VALUE! error"
 Case Else
 MsgBox "ไม่ควรเกิดกรณีนี้!!"
 End Select
End If
```

**เทคนิค:** ตรวจด้วย `IsError()` ก่อนเสมอ แล้วจึงเทียบกับ `CVErr(...)` เพราะค่า error เทียบตรง ๆ กับตัวเลขไม่ได้

---

## 2. การอ้างอิงเซลล์และช่วงข้อมูล (ภาพรวม)

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/reference-cells-and-ranges>

คุณสามารถระบุเซลล์หรือช่วงของเซลล์ได้ในคำสั่งเดียว ซึ่งทั้งระบุช่วงและเปลี่ยน property หรือเรียก method ไปพร้อมกัน

วัตถุ **Range** ใน VBA เป็นได้ทั้งเซลล์เดียวหรือหลายเซลล์ หัวข้อต่อไปนี้แสดงวิธีที่พบบ่อยที่สุดในการระบุและใช้งาน Range

วิธีอ้างอิงเซลล์ (แต่ละข้อมีหัวข้อของตัวเองด้านล่าง):

- อ้างอิงเซลล์ทั้งหมดบนเวิร์กชีต → หัวข้อ 3
- อ้างอิงด้วยสัญกรณ์ A1 → หัวข้อ 4
- อ้างอิงด้วยวัตถุ Range → หัวข้อ 5
- อ้างอิงด้วยหมายเลขดัชนี → หัวข้อ 6
- อ้างอิงด้วยสัญกรณ์ลัด → หัวข้อ 7
- อ้างอิงสัมพัทธ์กับเซลล์อื่น → หัวข้อ 8
- อ้างอิงหลายช่วง → หัวข้อ 9
- อ้างอิง Named Range → หัวข้อ 10
- อ้างอิงแถวและคอลัมน์ → หัวข้อ 11

---

## 3. อ้างอิงเซลล์ทั้งหมดบนเวิร์กชีต

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-all-the-cells-on-the-worksheet>

เมื่อใช้ property **Cells** กับเวิร์กชีตโดยไม่ระบุหมายเลขดัชนี จะได้วัตถุ **Range** ที่แทนเซลล์ทั้งหมดบนชีต โพรซีเดอร์ต่อไปนี้ล้างเนื้อหาของทุกเซลล์ใน Sheet1 ของเวิร์กบุ๊กที่ active

```vb
Sub ClearSheet()
 Worksheets("Sheet1").Cells.ClearContents
End Sub
```

---

## 4. อ้างอิงด้วยสัญกรณ์ A1

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-cells-and-ranges-by-using-a1-notation>

ใช้ property **Range** เพื่ออ้างอิงเซลล์ด้วยรูปแบบ A1 ตัวอย่างนี้ตั้งตัวหนาให้เซลล์ A1:D5

```vb
Sub FormatRange()
 Workbooks("Book1").Sheets("Sheet1").Range("A1:D5") _
 .Font.Bold = True
End Sub
```

| การอ้างอิง | ความหมาย |
| :-- | :-- |
| `Range("A1")` | เซลล์ A1 |
| `Range("A1:B5")` | เซลล์ A1 ถึง B5 |
| `Range("C5:D9,G9:H16")` | การเลือกหลายพื้นที่ (multiple-area) |
| `Range("A:A")` | คอลัมน์ A |
| `Range("1:1")` | แถว 1 |
| `Range("A:C")` | คอลัมน์ A ถึง C |
| `Range("1:5")` | แถว 1 ถึง 5 |
| `Range("1:1,3:3,8:8")` | แถว 1, 3 และ 8 |
| `Range("A:A,C:C,F:F")` | คอลัมน์ A, C และ F |

---

## 5. อ้างอิงด้วยวัตถุ Range

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-cells-by-using-a-range-object>

ถ้าตั้งตัวแปรวัตถุให้เป็น **Range** ก็จัดการช่วงนั้นผ่านชื่อตัวแปรได้สะดวก

โพรซีเดอร์นี้สร้างตัวแปร `myRange` แล้วกำหนดให้ชี้ไปที่ A1:D5 ของ Sheet1 คำสั่งถัดมาเปลี่ยน property ของช่วงผ่านชื่อตัวแปร

```vb
Sub Random()
 Dim myRange As Range
 Set myRange = Worksheets("Sheet1").Range("A1:D5")
 myRange.Formula = "=RAND()"
 myRange.Font.Bold = True
End Sub
```

**เทคนิค:** ตัวแปรวัตถุต้องกำหนดด้วย `Set` เสมอ

---

## 6. อ้างอิงด้วยหมายเลขดัชนี

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-cells-by-using-index-numbers>

ใช้ property **Cells** อ้างอิงเซลล์เดียวด้วยเลขแถวและเลขคอลัมน์ ซึ่งคืนวัตถุ **Range** ของเซลล์เดียว ตัวอย่าง `Cells(6,1)` คือเซลล์ A6 ของ Sheet1 แล้วตั้ง **Value** เป็น 10

```vb
Sub EnterValue()
 Worksheets("Sheet1").Cells(6, 1).Value = 10
End Sub
```

`Cells` เหมาะกับการวนลูป เพราะแทนเลขดัชนีด้วยตัวแปรได้

```vb
Sub CycleThrough()
 Dim Counter As Integer
 For Counter = 1 To 20
 Worksheets("Sheet1").Cells(Counter, 3).Value = Counter
 Next Counter
End Sub
```

> **หมายเหตุ:** ถ้าต้องการเปลี่ยน property หรือเรียก method กับหลายเซลล์พร้อมกัน ให้ใช้ property **Range** (ดูหัวข้อ 4)

---

## 7. อ้างอิงด้วยสัญกรณ์ลัด

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-cells-by-using-shortcut-notation>

ใช้รูปแบบ A1 หรือชื่อ named range ภายในวงเล็บเหลี่ยมเป็นทางลัดแทน property **Range** ไม่ต้องพิมพ์คำว่า "Range" และไม่ต้องใส่เครื่องหมายคำพูด

```vb
Sub ClearRange()
 Worksheets("Sheet1").[A1:B5].ClearContents
End Sub

Sub SetValue()
 [MyRange].Value = 30
End Sub
```

---

## 8. อ้างอิงเซลล์สัมพัทธ์กับเซลล์อื่น

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-cells-relative-to-other-cells>

วิธีทั่วไปคือใช้ property **Offset** ตัวอย่างนี้จัดรูปแบบเซลล์ที่อยู่ลงไป 1 แถว และไปทางขวา 3 คอลัมน์จาก active cell ให้เป็นขีดเส้นใต้สองชั้น

```vb
Sub Underline()
 ActiveCell.Offset(1, 3).Font.Underline = xlDouble
End Sub
```

> **หมายเหตุ:** บันทึกมาโครที่ใช้ `Offset` (การอ้างอิงสัมพัทธ์) แทนการอ้างอิงแบบสัมบูรณ์ได้ โดยที่แท็บ **Developer** คลิก **Use Relative References** แล้วจึงคลิก **Record Macro**

วนลูปโดยใช้ตัวแปรกับ `Cells` ตัวอย่างเติมค่า 5 ถึง 100 (เพิ่มทีละ 5) ลงใน 20 เซลล์แรกของคอลัมน์ที่สาม โดย `counter` เป็นเลขแถว

```vb
Sub CycleThrough()
 Dim counter As Integer
 For counter = 1 To 20
 Worksheets("Sheet1").Cells(counter, 3).Value = counter * 5
 Next counter
End Sub
```

---

## 9. อ้างอิงหลายช่วงพร้อมกัน

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-multiple-ranges>

เลือก method ที่เหมาะสมเพื่ออ้างอิงหลายช่วง ใช้ **Range** และ **Union** กับกลุ่มของช่วงใด ๆ และใช้ **Areas** อ้างอิงกลุ่มช่วงที่ผู้ใช้เลือกไว้บนชีต

### ใช้ property Range

คั่นการอ้างอิงด้วยเครื่องหมายจุลภาค ตัวอย่างล้างเนื้อหาสามช่วงบน Sheet1

```vb
Sub ClearRanges()
 Worksheets("Sheet1").Range("C5:D9,G9:H16,B14:D18"). _
 ClearContents
End Sub
```

Named range ทำให้ทำงานกับหลายช่วงง่ายขึ้น ตัวอย่างนี้ใช้ได้เมื่อ named range ทั้งสามอยู่ในชีตเดียวกัน

```vb
Sub ClearNamed()
 Range("MyRange, YourRange, HisRange").ClearContents
End Sub
```

### ใช้ method Union

รวมหลายช่วงเป็นวัตถุ **Range** เดียวด้วย **Union** ตัวอย่างสร้าง `myMultipleRange` จาก A1:B2 และ C3:D4 แล้วตั้งตัวหนาให้ทั้งสองช่วง

```vb
Sub MultipleRange()
 Dim r1 As Range, r2 As Range, myMultipleRange As Range
 Set r1 = Sheets("Sheet1").Range("A1:B2")
 Set r2 = Sheets("Sheet1").Range("C3:D4")
 Set myMultipleRange = Union(r1, r2)
 myMultipleRange.Font.Bold = True
End Sub
```

### ใช้ property Areas

ใช้ **Areas** อ้างอิงช่วงที่เลือก หรือชุดของช่วงในการเลือกหลายพื้นที่ โพรซีเดอร์ต่อไปนี้นับจำนวนพื้นที่ในส่วนที่เลือก ถ้ามีมากกว่าหนึ่งจะแสดงคำเตือน

```vb
Sub FindMultiple()
 If Selection.Areas.Count > 1 Then
 MsgBox "ไม่สามารถทำสิ่งนี้กับการเลือกหลายพื้นที่ได้"
 End If
End Sub
```

---

## 10. อ้างอิง Named Range

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-named-ranges>

การระบุช่วงด้วยชื่อง่ายกว่าสัญกรณ์ A1 วิธีตั้งชื่อ: เลือกช่วง คลิกที่ Name Box ทางซ้ายสุดของ formula bar พิมพ์ชื่อ แล้วกด ENTER

> **หมายเหตุ:** Named range มี 2 ประเภท คือ Workbook Named Range และ Worksheet-Specific Named Range

### Workbook Named Range

อ้างอิงช่วงเฉพาะจากที่ใดก็ได้ในเวิร์กบุ๊ก (ใช้ได้ทั้งเวิร์กบุ๊ก) โดยปกติสร้างด้วยการพิมพ์ชื่อใน Name Box ชื่อห้ามมีช่องว่าง

### Worksheet-Specific Named Range

อ้างอิงช่วงในชีตใดชีตหนึ่ง ไม่ใช่ global ทั้งเวิร์กบุ๊ก ในชีตเดียวกันอ้างด้วยชื่ออย่างเดียว แต่จากชีตอื่นต้องมีชื่อชีตและเครื่องหมาย `!` นำหน้า เช่น `=Sheet1!Name`

ข้อดี: โค้ด VBA สร้างชีตใหม่ที่ใช้ชื่อช่วงเดียวกันได้ โดยไม่เกิด error ว่าชื่อถูกใช้แล้ว

**วิธีสร้าง:**

1. เลือกช่วงที่ต้องการตั้งชื่อ
2. คลิกแท็บ **Formulas** บน Ribbon
3. คลิกปุ่ม **Define Name**
4. ในกล่อง **New Name** ที่ช่อง **Scope** เลือกชีตที่ช่วงนั้นอยู่ (เช่น "Sheet1") จะได้ชื่อเฉพาะชีต ถ้าเลือก "Workbook" จะเป็นชื่อระดับเวิร์กบุ๊ก

ตัวอย่าง: เลือก A1:A10 ตั้งชื่อ "name" ในชีตเดียวกันอ้างด้วย `=name` ส่วนจากชีตอื่นอ้างด้วย `=Sheet1!name`

### การอ้างอิง Named Range ใน VBA

อ้างช่วงชื่อ "MyRange" ในเวิร์กบุ๊ก "MyBook.xls"

```vb
Sub FormatRange()
    Range("MyBook.xls!MyRange").Font.Italic = True
End Sub
```

อ้างช่วงเฉพาะชีตชื่อ "Sheet1!Sales" ในเวิร์กบุ๊ก "Report.xls"

```vb
Sub FormatSales()
    Range("[Report.xls]Sheet1!Sales").BorderAround Weight:=xlthin
End Sub
```

ใช้ method **GoTo** เพื่อเลือก named range ซึ่งจะ activate เวิร์กบุ๊กและชีตแล้วเลือกช่วง

```vb
Sub ClearRange()
    Application.Goto Reference:="MyBook.xls!MyRange"
    Selection.ClearContents
End Sub
```

สำหรับเวิร์กบุ๊กที่ active เขียนได้ดังนี้

```vb
Sub ClearRange()
    Application.Goto Reference:="MyRange"
    Selection.ClearContents
End Sub
```

### ตัวอย่าง: Data Validation จาก named range

*โค้ดตัวอย่างโดย Dennis Wallentin, VSTO & .NET & Excel (<https://xldennis.wordpress.com/>)*

ตัวอย่างใช้ named range เป็นสูตรของ data validation ข้อมูลตรวจสอบต้องอยู่ที่ Sheet 2 ช่วง A2:A100 และใช้ตรวจค่าที่กรอกใน Sheet 1 ช่วง D2:D10

```vb
Sub Add_Data_Validation_From_Other_Worksheet()
'เวิร์กบุ๊กและชีตปัจจุบัน ช่วงที่กำหนดข้อมูลสำหรับตรวจสอบ และช่วงปลายทาง
Dim wbBook As Workbook
Dim wsTarget As Worksheet
Dim wsSource As Worksheet
Dim rnTarget As Range
Dim rnSource As Range
'กำหนดค่าเริ่มต้นให้ออบเจ็กต์ และลบชื่อที่ค้างจากการรันครั้งก่อน
Set wbBook = ThisWorkbook
With wbBook
    Set wsSource = .Worksheets("Sheet2")
    Set wsTarget = .Worksheets("Sheet1")
    On Error Resume Next
    .Names("Source").Delete
    On Error GoTo 0
End With
'บนชีตต้นทาง สร้างช่วงในคอลัมน์ A ยาวไม่เกิน 98 เซลล์ แล้วตั้งชื่อ "Source"
With wsSource
    .Range(.Range("A2"), .Range("A100").End(xlUp)).Name = "Source"
End With
'บนชีตปลายทาง กำหนดช่วง 8 เซลล์ในคอลัมน์ D
Set rnTarget = wsTarget.Range("D2:D10")
'ล้างสิ่งที่ค้างจากการรันก่อนหน้า แล้วตั้งค่า validation ให้ช่วงปลายทาง
With rnTarget
    .ClearContents
    With .Validation
        .Delete
        .Add Type:=xlValidateList, _
             AlertStyle:=xlValidAlertStop, _
             Formula1:="=Source"
'ตั้งหัวข้อและข้อความของกล่อง error
        .ErrorTitle = "Value Error"
        .ErrorMessage = "เลือกได้เฉพาะค่าในรายการเท่านั้น"
    End With
End With
End Sub
```

### วนลูปผ่านเซลล์ใน named range

ตัวอย่างวนด้วย **For Each...Next** ถ้าค่าของเซลล์ใดเกิน `Limit` จะเปลี่ยนสีเซลล์เป็นสีเหลือง

```vb
Sub ApplyColor()
    Const Limit As Integer = 25
    For Each c In Range("MyRange")
        If c.Value > Limit Then
            c.Interior.ColorIndex = 27
        End If
    Next c
End Sub
```

---

## 11. อ้างอิงแถวและคอลัมน์

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/refer-to-rows-and-columns>

ใช้ property **Rows** หรือ **Columns** เพื่อทำงานกับทั้งแถวหรือทั้งคอลัมน์ ซึ่งคืนวัตถุ **Range** ตัวอย่าง `Rows(1)` คือแถวที่หนึ่งของ Sheet1 แล้วตั้ง **Bold** ของ **Font** เป็น **True**

```vb
Sub RowBold()
    Worksheets("Sheet1").Rows(1).Font.Bold = True
End Sub
```

| การอ้างอิง | ความหมาย |
| :-- | :-- |
| `Rows(1)` | แถวที่ 1 |
| `Rows` | ทุกแถวบนเวิร์กชีต |
| `Columns(1)` | คอลัมน์ที่ 1 |
| `Columns("A")` | คอลัมน์ที่ 1 |
| `Columns` | ทุกคอลัมน์บนเวิร์กชีต |

ถ้าต้องการทำงานกับหลายแถวหรือหลายคอลัมน์พร้อมกัน ให้สร้างตัวแปรวัตถุแล้วใช้ **Union** รวมการเรียก **Rows**/**Columns** หลายครั้ง ตัวอย่างตั้งตัวหนาให้แถว 1, 3 และ 5

```vb
Sub SeveralRows()
    Worksheets("Sheet1").Activate
    Dim myUnion As Range
    Set myUnion = Union(Rows(1), Rows(3), Rows(5))
    myUnion.Font.Bold = True
End Sub
```

*โค้ดตัวอย่างโดย Dennis Wallentin, VSTO & .NET & Excel*

### ลบแถวว่างจากช่วงที่เลือก

```vb
Sub Delete_Empty_Rows()
    'ช่วงที่จะลบแถวว่าง
    Dim rnSelection As Range
    'ตัวแปรแถวและตัวนับที่ใช้ในการลบ
    Dim lnLastRow As Long
    Dim lnRowCount As Long
    Dim lnDeletedRows As Long
    'กำหนดจำนวนแถวที่ลบเริ่มต้นเป็น 0
    lnDeletedRows = 0
    'ตรวจว่าเลือกช่วงอยู่ และเป็นช่วงต่อเนื่อง
    If TypeName(Selection) = "Range" Then
        If Selection.Areas.Count = 1 Then
            'ตั้งค่าเริ่มต้นเป็นช่วงที่ผู้ใช้เลือก และตัวนับสำหรับลูป FOR
            Set rnSelection = Application.Selection
            lnLastRow = rnSelection.Rows.Count
            'เริ่มจากแถวล่างสุดแล้วไล่ขึ้นบน ถ้าแถวว่างให้ลบ
            'แล้วเพิ่มตัวนับจำนวนแถวที่ลบ
            For lnRowCount = lnLastRow To 1 Step -1
                If Application.CountA(rnSelection.Rows(lnRowCount)) = 0 Then
                    rnSelection.Rows(lnRowCount).Delete
                    lnDeletedRows = lnDeletedRows + 1
                End If
            Next lnRowCount
            rnSelection.Resize(lnLastRow - lnDeletedRows).Select
         Else
            MsgBox "กรุณาเลือกเพียงพื้นที่เดียว", vbInformation
         End If
    Else
        MsgBox "กรุณาเลือกช่วงข้อมูล", vbInformation
    End If
    'เปิดการอัปเดตหน้าจอกลับ
    Application.ScreenUpdating = True
End Sub
```

### ลบคอลัมน์ว่างจากช่วงที่เลือก

```vb
Sub Delete_Empty_Columns()
    'ช่วงที่จะลบคอลัมน์ว่าง
    Dim rnSelection As Range
    'ตัวแปรคอลัมน์และตัวนับที่ใช้ในการลบ
    Dim lnLastColumn As Long
    Dim lnColumnCount As Long
    Dim lnDeletedColumns As Long
    lnDeletedColumns = 0
    'ตรวจว่าเลือกช่วงอยู่ และเป็นช่วงต่อเนื่อง
    If TypeName(Selection) = "Range" Then
        If Selection.Areas.Count = 1 Then
            'ตั้งค่าเริ่มต้นเป็นช่วงที่ผู้ใช้เลือก และตัวนับสำหรับลูป FOR
            Set rnSelection = Application.Selection
            lnLastColumn = rnSelection.Columns.Count
            'เริ่มจากคอลัมน์ขวาสุดแล้วไล่ไปทางซ้าย ถ้าคอลัมน์ว่างให้ลบ
            'แล้วเพิ่มตัวนับ
            For lnColumnCount = lnLastColumn To 1 Step -1
                If Application.CountA(rnSelection.Columns(lnColumnCount)) = 0 Then
                    rnSelection.Columns(lnColumnCount).Delete
                    lnDeletedColumns = lnDeletedColumns + 1
                End If
            Next lnColumnCount
            rnSelection.Resize(lnLastColumn - lnDeletedColumns).Select
        Else
            MsgBox "กรุณาเลือกเพียงพื้นที่เดียว", vbInformation
        End If
    Else
        MsgBox "กรุณาเลือกช่วงข้อมูล", vbInformation
    End If
    'เปิดการอัปเดตหน้าจอกลับ
    Application.ScreenUpdating = True
End Sub
```

**เทคนิค:** เวลาลบแถว/คอลัมน์ในลูป ให้วนจาก **ท้ายไปต้น** (`Step -1`) เพราะการลบทำให้ดัชนีของรายการถัดไปเลื่อน

---

## 12. เลือกช่วงข้อมูล

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/select-a-range>

ตัวอย่างแสดงการเลือก *used range* (รวมเซลล์ที่จัดรูปแบบแต่ไม่มีข้อมูล) และ *data range* (เฉพาะเซลล์ที่มีข้อมูลจริง)

*โค้ดตัวอย่างโดย Tom Urtis, Atlas Programming Management*

### เลือก Used Range

ใช้ property **UsedRange** ของ **Worksheet** กับ method **Select** ของ **Range** แล้วแสดงที่อยู่ของช่วงให้ผู้ใช้เห็น

```vb
Sub SelectUsedRange()
    ActiveSheet.UsedRange.Select
    MsgBox "ที่อยู่ของ used range คือ " & ActiveSheet.UsedRange.Address(0, 0) & ".", 64, "Used range address:"
End Sub
```

### เลือก Data Range ที่เริ่มจาก A1

หาแถวสุดท้ายและคอลัมน์สุดท้ายที่มีข้อมูลจริงด้วย method **Find** ของ **Range** ช่วงนี้ไม่รวมเซลล์ที่จัดรูปแบบแต่ว่างเปล่า

```vb
Sub SelectDataRange()
    Dim LastRow As Long, LastColumn As Long
    LastRow = Cells.Find(What:="*", After:=Range("A1"), SearchOrder:=xlByRows, SearchDirection:=xlPrevious).Row
    LastColumn = Cells.Find(What:="*", After:=Range("A1"), SearchOrder:=xlByColumns, SearchDirection:=xlPrevious).Column
    Range("A1").Resize(LastRow, LastColumn).Select
    MsgBox "ที่อยู่ของ data range คือ " & Selection.Address(0, 0) & ".", 64, "Data-containing range address:"
End Sub
```

### เลือก Data Range เมื่อไม่รู้จุดเริ่มต้น

หาแถวและคอลัมน์แรก/สุดท้ายที่มีข้อมูลด้วย **Find**

```vb
Sub UnknownRange()
    If WorksheetFunction.CountA(Cells) = 0 Then
        MsgBox "ไม่มีช่วงให้เลือก", , "ไม่มีเซลล์ใดมีค่า"
        Exit Sub
    Else
        Dim FirstRow&, FirstCol&, LastRow&, LastCol&
        Dim myUsedRange As Range
        FirstRow = Cells.Find(What:="*", SearchDirection:=xlNext, SearchOrder:=xlByRows).Row
        On Error Resume Next
        FirstCol = Cells.Find(What:="*", SearchDirection:=xlNext, SearchOrder:=xlByColumns).Column
        If Err.Number <> 0 Then
            Err.Clear
            MsgBox _
            "มีเซลล์ที่ merge ตามแนวนอนอยู่บนชีต" & vbCrLf & _
            "ต้องยกเลิกการ merge ก่อนจึงจะหาช่วงได้", 64, "กรุณายกเลิก merge ทุกเซลล์"
            Exit Sub
        End If
        LastRow = Cells.Find(What:="*", SearchDirection:=xlPrevious, SearchOrder:=xlByRows).Row
        LastCol = Cells.Find(What:="*", SearchDirection:=xlPrevious, SearchOrder:=xlByColumns).Column
        Set myUsedRange = Range(Cells(FirstRow, FirstCol), Cells(LastRow, LastCol))
        myUsedRange.Select
        MsgBox "data range บนชีตนี้คือ " & myUsedRange.Address(0, 0) & ".", 64, "Range address:"
    End If
End Sub
```

**เทคนิค:** `UsedRange` อาจใหญ่เกินจริงเพราะรวมเซลล์ที่มีแต่การจัดรูปแบบ ถ้าต้องการขอบเขตของข้อมูลจริงให้ใช้ `Find(What:="*", ...)` ไล่จากท้าย (`xlPrevious`)

---

## 13. การเลือกและการทำให้เซลล์ Active

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/selecting-and-activating-cells>

ใน Excel ปกติเราเลือกเซลล์ก่อนแล้วจึงทำงาน เช่น จัดรูปแบบหรือกรอกค่า แต่ใน VBA **โดยทั่วไปไม่จำเป็นต้องเลือกเซลล์ก่อนแก้ไข**

เช่น ใส่สูตรในเซลล์ D6 ไม่ต้องเลือก D6 เพียงคืนวัตถุ **Range** ของเซลล์นั้นแล้วตั้ง **Formula**

```vb
Sub EnterFormula()
    Worksheets("Sheet1").Range("D6").Formula = "=SUM(D2:D5)"
End Sub
```

ดูวิธีควบคุมเซลล์โดยไม่ต้องเลือกเพิ่มเติมที่หัวข้อ 2

### การใช้ Select และ Selection

method **Select** ทำให้ชีตหรือวัตถุบนชีต active ส่วน property **Selection** คืนวัตถุที่แทนส่วนที่เลือกอยู่บนชีตที่ active ของเวิร์กบุ๊กที่ active ก่อนใช้ `Selection` ต้อง activate เวิร์กบุ๊ก activate หรือเลือกชีต แล้วเลือกช่วงด้วย `Select`

ตัวบันทึกมาโครมักสร้างโค้ดที่ใช้ `Select` และ `Selection` ดังตัวอย่าง

```vb
Sub Macro1()
    Sheets("Sheet1").Select
    Range("A1").Select
    ActiveCell.FormulaR1C1 = "Name"
    Range("B1").Select
    ActiveCell.FormulaR1C1 = "Address"
    Range("A1:B1").Select
    Selection.Font.Bold = True
End Sub
```

ตัวอย่างต่อไปนี้ทำงานเดียวกันโดย **ไม่** activate หรือเลือกชีตและเซลล์

```vb
Sub Labels()
    With Worksheets("Sheet1")
        .Range("A1") = "Name"
        .Range("B1") = "Address"
        .Range("A1:B1").Font.Bold = True
    End With
End Sub
```

### เลือกเซลล์บนชีตที่ active

`Select` ใช้ได้เฉพาะกับชีตที่ active ถ้ารันโพรซีเดอร์จากโมดูล `Select` จะล้มเหลว เว้นแต่โพรซีเดอร์ activate ชีตก่อน ตัวอย่างคัดลอกแถวจาก Sheet1 ไป Sheet2

```vb
Sub CopyRow()
    Worksheets("Sheet1").Rows(1).Copy
    Worksheets("Sheet2").Select
    Worksheets("Sheet2").Rows(1).Select
    Worksheets("Sheet2").Paste
End Sub
```

### Activate เซลล์ภายในส่วนที่เลือก

ใช้ **Activate** ทำให้เซลล์หนึ่งใน selection เป็น active ได้เพียงหนึ่งเซลล์เสมอแม้เลือกหลายเซลล์ ตัวอย่างเลือกช่วงแล้ว activate เซลล์ภายในโดยไม่เปลี่ยนส่วนที่เลือก

```vb
Sub MakeActive()
    Worksheets("Sheet1").Activate
    Range("A1:D4").Select
    Range("B2").Activate
End Sub
```

**เทคนิค:** เขียนโค้ดแบบไม่ `Select` (ใช้ `With ... .Range(...)`) เร็วกว่า ไม่กระพริบหน้าจอ และไม่พึ่งว่าชีตไหน active อยู่

---

## 14. ทำงานกับ Active Cell

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/working-with-the-active-cell>

property **ActiveCell** คืนวัตถุ **Range** ของเซลล์ที่ active ใช้ property/method ของ Range ได้ทั้งหมด แม้จะเลือกหลายเซลล์ แต่ ActiveCell มีได้เพียงเซลล์เดียว

```vb
Sub SetValue()
 Worksheets("Sheet1").Activate
 ActiveCell.Value = 35
End Sub
```

> **หมายเหตุ:** ทำงานกับ active cell ได้เฉพาะเมื่อชีตที่เซลล์นั้นอยู่เป็นชีตที่ active

### ย้าย Active Cell

ใช้ method **Activate** ของ Range กำหนดว่าเซลล์ใดเป็น active ตัวอย่างทำให้ B5 เป็น active แล้วตั้งตัวหนา

```vb
Sub SetActive_MakeBold()
 Worksheets("Sheet1").Activate
 Worksheets("Sheet1").Range("B5").Activate
 ActiveCell.Font.Bold = True
End Sub
```

> **หมายเหตุ:** เลือกช่วงของเซลล์ใช้ `Select` แต่ถ้าต้องการให้เซลล์เดียวเป็น active ใช้ `Activate`

ใช้ **Offset** เพื่อย้าย active cell ตัวอย่างใส่ข้อความใน active cell ของช่วงที่เลือก แล้วย้าย active cell ไปทางขวาหนึ่งเซลล์โดยไม่เปลี่ยนส่วนที่เลือก

```vb
Sub MoveActive()
 Worksheets("Sheet1").Activate
 Range("A1:D10").Select
 ActiveCell.Value = "Monthly Totals"
 ActiveCell.Offset(0, 1).Activate
End Sub
```

### เลือกเซลล์รอบ ๆ Active Cell

property **CurrentRegion** คืนช่วงหรือ "เกาะ" ของเซลล์ที่ล้อมด้วยแถวและคอลัมน์ว่าง ตัวอย่างขยายส่วนที่เลือกให้ครอบคลุมเซลล์ข้อมูลที่ติดกับ active cell แล้วจัดรูปแบบเป็น Currency

```vb
Sub Region()
 Worksheets("Sheet1").Activate
 ActiveCell.CurrentRegion.Select
 Selection.Style = "Currency"
End Sub
```

---

## 15. ช่วงข้อมูลแบบ 3 มิติ

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/working-with-3-d-ranges>

เมื่อทำงานกับช่วงเดียวกันในหลายชีต ใช้ฟังก์ชัน **Array** ระบุชีตที่ต้องการเลือก ตัวอย่างจัดรูปแบบเส้นขอบของช่วง 3 มิติ

```vb
Sub FormatSheets()
 Sheets(Array("Sheet2", "Sheet3", "Sheet5")).Select
 Range("A1:H1").Select
 Selection.Borders(xlBottom).LineStyle = xlDouble
End Sub
```

ตัวอย่างต่อไปใช้ method **FillAcrossSheets** เพื่อถ่ายโอนรูปแบบและข้อมูลจากช่วงใน Sheet2 ไปยังช่วงที่ตรงกันในทุกเวิร์กชีตของเวิร์กบุ๊กที่ active

```vb
Sub FillAll()
 Worksheets("Sheet2").Range("A1:H1") _
 .Borders(xlBottom).LineStyle = xlDouble
 Worksheets.FillAcrossSheets (Worksheets("Sheet2") _
 .Range("A1:H1"))
End Sub
```

อ้างอิง API: [Worksheets.FillAcrossSheets](https://learn.microsoft.com/en-us/office/vba/api/excel.worksheets.fillacrosssheets)

---

## 16. วนลูปผ่านช่วงของเซลล์

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/looping-through-a-range-of-cells>

เมื่อใช้ VBA มักต้องรันกลุ่มคำสั่งเดิมกับแต่ละเซลล์ในช่วง ให้ผสมคำสั่งวนลูปกับ method ที่ระบุเซลล์ทีละเซลล์

**วิธีที่ 1: For...Next กับ Cells** แทนตัวนับลูปในเลขดัชนีของ `Cells` ตัวอย่างวนช่วง C1:C20 ตั้งเป็น 0 เมื่อค่าสัมบูรณ์น้อยกว่า 0.01

```vb
Sub RoundToZero1()
 For Counter = 1 To 20
 Set curCell = Worksheets("Sheet1").Cells(Counter, 3)
 If Abs(curCell.Value) < 0.01 Then curCell.Value = 0
 Next Counter
End Sub
```

**วิธีที่ 2: For Each...Next กับคอลเลกชันของเซลล์** VBA ตั้งตัวแปรวัตถุเป็นเซลล์ถัดไปให้เองทุกรอบ ตัวอย่างวน A1:D10

```vb
Sub RoundToZero2()
 For Each c In Worksheets("Sheet1").Range("A1:D10").Cells
 If Abs(c.Value) < 0.01 Then c.Value = 0
 Next
End Sub
```

**วิธีที่ 3: ไม่รู้ขอบเขตของช่วง** ใช้ **CurrentRegion** คืนช่วงรอบ active cell

```vb
Sub RoundToZero3()
 For Each c In ActiveCell.CurrentRegion.Cells
 If Abs(c.Value) < 0.01 Then c.Value = 0
 Next
End Sub
```

**เทคนิค:** ใช้ `For...Next` เมื่อต้องควบคุมลำดับหรือขอบเขตเอง ใช้ `For Each` เมื่อต้องการทุกเซลล์ในช่วง และใช้ `CurrentRegion` เมื่อไม่ทราบขนาดข้อมูล (หมายเหตุ: ถ้าข้อมูลมีมาก การวนทีละเซลล์ช้า ดูหัวข้อประสิทธิภาพของ Excel ในไฟล์ถัดไปของชุดนี้)

---

## 17. Formula กับ Formula2

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/range-formula-vs-formula2>

`Range.Formula` และ `Range.Formula2` เป็นสองวิธีแทนตรรกะของสูตร เปรียบได้กับ "สองสำเนียง" ของภาษาสูตร Excel

### พื้นหลัง

Excel รองรับการประเมินสูตรสองแบบมาตลอด:

- **Implicit Intersection Evaluation (IIE)**: ก่อนมี Dynamic Arrays นี่คือค่าเริ่มต้นสำหรับสูตรในเซลล์
- **Array Evaluation (AE)**: ใช้ในที่อื่นทั้งหมด (Conditional Formatting, Data Validation, สูตร CSE array ฯลฯ)

ความต่างหลักคือพฤติกรรมเมื่อส่งช่วงหลายเซลล์ (เช่น A1:A10) ให้ฟังก์ชันที่คาดหวังค่าเดียว:

- **IIE** เลือกเซลล์ที่อยู่แถวหรือคอลัมน์เดียวกับสูตร เรียกว่า "implicit intersection"
- **AE** เรียกฟังก์ชันกับทุกเซลล์ในช่วงแล้วคืนอาร์เรย์ของผลลัพธ์ เรียกว่า "lifting"

เมื่อตั้งสูตรด้วย `Range.Formula` จะประเมินแบบ IIE

เมื่อมี Dynamic Arrays (DA) Excel คืนหลายค่าลงตารางได้ และ AE เป็นค่าเริ่มต้น ใช้ `Range.Formula2` อ่าน/เขียนสูตรแบบ AE ซึ่งมาแทน `Range.Formula` อย่างไรก็ตามเพื่อความเข้ากันได้ `Range.Formula` ยังทำงานและยังตั้ง/คืนสูตรแบบ IIE สูตรที่ตั้งด้วย `Range.Formula` จะเกิด implicit intersection และไม่มีวัน spill และเมื่ออ่านด้วย `Range.Formula` จะไม่บอกว่า implicit intersection เกิดตรงไหน

`Range.Formula` รายงานสิ่งที่จะแสดงใน formula bar ของ Excel ก่อน DA ส่วน `Range.Formula2` รายงานสิ่งที่ formula bar ของ Excel ยุค DA แสดง

Excel แปลงระหว่างสองรูปแบบให้อัตโนมัติ อ่านและเขียนได้ทั้งคู่ เมื่อแปลง `Formula` (IIE) เป็น `Formula2` (AE) Excel จะแสดงจุดที่อาจเกิด implicit intersection ด้วยตัวดำเนินการใหม่ `@` และเมื่อแปลงจาก `Formula2` เป็น `Formula` Excel จะลบ `@` ที่ทำงานโดยเงียบอยู่แล้ว หลายครั้งทั้งสองไม่ต่างกัน

### แปลงจาก Range.Formula เป็น Range.Formula2

ตัวอย่างเขียน `Range.Formula` แล้วอ่าน `Range.Formula2`

```vb
Dim cell As Range
Dim str As String
Set cell = Worksheets("Sheet1").Cells(2, 1)
ArrayOfFormulas = Array("=SQRT(A1)", "=SQRT(A1:A4)")
For i = LBound(ArrayOfFormulas) To UBound(ArrayOfFormulas)
 cell.Formula = ArrayOfFormulas(i)
 str = "เขียน Range.Formula:" & vbCr & cell.Formula & _
    vbCr & vbCr & _
    "อ่าน Range.Formula2:" & vbCr & cell.Formula2
 MsgBox (str)
Next i
```

| เขียน Range.Formula | อ่าน Range.Formula2 | หมายเหตุ |
| -- | -- | -- |
| `=SQRT(A1)` | `=SQRT(A1)` | เหมือนกัน เพราะไม่มีโอกาสเกิด implicit intersection |
| `=SQRT(A1:A4)` | `=SQRT(@A1:A4)` | SQRT คาดหวังค่าเดียวแต่ได้ช่วงหลายเซลล์ ใน IIE จะเกิด implicit intersection จึงแสดงด้วย `@` เมื่อแปลงเป็น AE |

### แปลงจาก Range.Formula2 เป็น Range.Formula

สูตรที่ตั้งด้วย `Range.Formula2` ใช้ AE เมื่อบันทึกไฟล์ Excel ยุค DA จะตรวจสูตรในเวิร์กบุ๊กว่าคำนวณเหมือนกันทั้ง AE และ IIE หรือไม่ ถ้าเหมือน Excel อาจบันทึกเป็น IIE เพื่อลดจำนวนสูตรอาร์เรย์ที่ Excel รุ่นเก่าเห็น ทดสอบว่าสูตรจะถูกบันทึกเป็นอาร์เรย์หรือไม่ได้ด้วย `Range.SavedAsArray()`

```vb
Dim cell As Range
Dim str As String
Set cell = Worksheets("Sheet1").Cells(2, 1)
ArrayOfFormulas = Array("=SQRT(A1)", "=SQRT(@A1:A4)", "=SQRT(A1:A4)", "=SQRT(A1:A4)+SQRT(@A1:A4)")
For i = LBound(ArrayOfFormulas) To UBound(ArrayOfFormulas)
 cell.Formula2 = ArrayOfFormulas(i)
 str = "เขียน Range.Formula2:" & vbCr & cell.Formula2 & _
    vbCr & vbCr & _
    "อ่าน Range.Formula:" & vbCr & cell.Formula & _
    vbCr & vbCr & _
    "อ่าน Range.IsSavedAsArray:" & vbCr & cell.SavedAsArray
 MsgBox (str)
Next i
```

| เขียน Formula2 | อ่าน Formula | อ่าน SavedAsArray | หมายเหตุ |
| -- | -- | -- | -- |
| `=SQRT(A1)` | `=SQRT(A1)` | FALSE | SQRT ต้องการค่าเดียว A1 คือค่าเดียว จึงไม่ต่างกันระหว่าง IIE และ AE บันทึกเป็น IIE และลบ `@` |
| `=SQRT(@A1:A4)` | `=SQRT(A1:A4)` | FALSE | `@A1:A4` คือค่าเดียว จึงไม่ต่างกัน บันทึกเป็น IIE และลบ `@` |
| `=SQRT(A1:A4)` | `=SQRT(A1:A4)` | TRUE | A1:A4 เป็นช่วงหลายเซลล์ IIE กับ AE อาจให้ผลต่างกัน จึงบันทึกเป็นอาร์เรย์ |
| `=SQRT(A1:A4)+SQRT(@A1:A4)` | `=SQRT(A1:A4)+SQRT(@A1:A4)` | TRUE | SQRT ตัวแรกได้ช่วงหลายเซลล์ ผลอาจต่างกัน จึงบันทึกเป็นอาร์เรย์ |

### แนวปฏิบัติที่ดี

- ถ้าเป้าหมายคือ Excel ที่มี DA ให้ใช้ `Range.Formula2` แทน `Range.Formula`
- ถ้าเป้าหมายคือทั้ง Excel ก่อนและหลัง DA ให้ใช้ `Range.Formula` ต่อไป แต่ถ้าต้องการควบคุมการปรากฏของสูตรใน formula bar อย่างใกล้ชิด ให้ตรวจว่ารองรับ `.Formula2` หรือไม่ ถ้ารองรับใช้ `.Formula2` ถ้าไม่ใช้ `.Formula`

### หมายเหตุ

OfficeJS ไม่มี `Range.Formula2` แต่ `Range.Formula` รายงานสิ่งที่อยู่ใน formula bar เสมอ เนื่องจากเป็นภาษาใหม่และ add-in ปรับปรุงได้เร็ว นักพัฒนาควรอัปเดต add-in เองถ้าพบปัญหาความเข้ากันได้ระหว่าง AE กับ IIE

---

## 18. ลบรายการซ้ำในช่วงข้อมูล

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/delete-duplicate-entries-in-a-range>
*โค้ดตัวอย่างโดย Tom Urtis, Atlas Programming Management*

ตัวอย่างลบรายการซ้ำของข้อมูลในคอลัมน์ A ใช้ method **AdvancedFilter** ของ **Range** โดยตั้ง `Unique:=True` และ `Action:=xlFilterInPlace` (กรองในที่เดิม) ถ้าต้องการเก็บข้อมูลต้นฉบับ ให้ตั้ง `Action:=xlFilterCopy` แล้วระบุตำแหน่งปลายทางใน `CopyToRange` เมื่อกรองค่าไม่ซ้ำแล้ว ใช้ **SpecialCells** หาแถวว่างที่เหลือและลบทิ้ง

```vb
Sub DeleteDuplicates()
    With Application
        ' ปิดการอัปเดตหน้าจอเพื่อเพิ่มประสิทธิภาพ
        .ScreenUpdating = False
        Dim LastColumn As Integer
        LastColumn = Cells.Find(What:="*", After:=Range("A1"), SearchOrder:=xlByColumns, SearchDirection:=xlPrevious).Column + 1
        With Range("A1:A" & Cells(Rows.Count, 1).End(xlUp).Row)
            ' ใช้ AdvancedFilter กรองค่าที่ไม่ซ้ำ
            .AdvancedFilter Action:=xlFilterInPlace, Unique:=True
            .SpecialCells(xlCellTypeVisible).Offset(0, LastColumn - 1).Value = 1
            On Error Resume Next
            ActiveSheet.ShowAllData
            ' ลบแถวว่าง
            Columns(LastColumn).SpecialCells(xlCellTypeBlanks).EntireRow.Delete
            Err.Clear
        End With
        Columns(LastColumn).Clear
        .ScreenUpdating = True
    End With
End Sub
```

**ขั้นตอนการทำงาน:** (1) หาคอลัมน์ว่างถัดจากข้อมูลไว้เป็นคอลัมน์ช่วย (2) กรองค่าไม่ซ้ำในที่เดิม (3) ใส่เลข 1 ที่คอลัมน์ช่วยเฉพาะแถวที่มองเห็น (4) แสดงข้อมูลทั้งหมดกลับ (5) แถวที่คอลัมน์ช่วยว่าง คือแถวซ้ำที่ถูกซ่อนไว้ จึงลบทั้งแถว (6) ล้างคอลัมน์ช่วย

**ผู้เขียน:** Tom Urtis (MVP) ผู้ก่อตั้ง Atlas Programming Management ผู้เชี่ยวชาญโซลูชัน Microsoft Office และ Excel ใน Silicon Valley ประสบการณ์กว่า 25 ปี และเป็นผู้เขียนร่วมหนังสือ "Holy Macro! It's 2,500 Excel VBA Examples"

---

## 19. เติมค่าลงในเซลล์ว่างในคอลัมน์

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/fill-a-value-down-into-blank-cells-in-a-column>
*โค้ดตัวอย่างโดย Tom Urtis*

ตัวอย่างนี้ดูที่คอลัมน์ A ถ้าเจอเซลล์ว่างจะตั้งค่าให้เท่ากับเซลล์ด้านบน ทำต่อไปตลอดคอลัมน์

```vb
Sub FillCellsFromAbove()
    ' ปิดการอัปเดตหน้าจอเพื่อเพิ่มประสิทธิภาพ
    Application.ScreenUpdating = False
    On Error Resume Next
    ' ดูที่คอลัมน์ A
    With Columns(1)
        ' เซลล์ว่างให้เท่ากับเซลล์ด้านบน
        .SpecialCells(xlCellTypeBlanks).Formula = "=R[-1]C"
        ' แปลงสูตรเป็นค่า
        .Value = .Value
    End With
    Err.Clear
    Application.ScreenUpdating = True
End Sub
```

**เทคนิค:** `SpecialCells(xlCellTypeBlanks)` เลือกเฉพาะเซลล์ว่างทั้งหมดในครั้งเดียว สูตร `=R[-1]C` เป็นสัญกรณ์ R1C1 หมายถึง "เซลล์ถัดขึ้นไปหนึ่งแถว คอลัมน์เดียวกัน" แล้ว `.Value = .Value` แปลงสูตรเป็นค่าคงที่ (ถ้าไม่มีเซลล์ว่างเลย `SpecialCells` จะ error จึงใช้ `On Error Resume Next`)

---

## 20. ซ่อนแสดงคอลัมน์

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/hide-and-unhide-columns>
*โค้ดตัวอย่างโดย Dennis Wallentin, VSTO & .NET & Excel*

ตัวอย่างหาเซลล์ในสี่คอลัมน์แรกที่มีค่าคงที่ "X" แล้วซ่อนคอลัมน์ที่มี X อยู่

```vb
Sub Hide_Columns()
    'ออบเจ็กต์ Excel
    Dim m_wbBook As Workbook
    Dim m_wsSheet As Worksheet
    Dim m_rnCheck As Range
    Dim m_rnFind As Range
    Dim m_stAddress As String
    'กำหนดค่าเริ่มต้นให้ออบเจ็กต์
    Set m_wbBook = ThisWorkbook
    Set m_wsSheet = m_wbBook.Worksheets("Sheet1")
    'ค้นหาค่าคงที่ในสี่คอลัมน์
    Set m_rnCheck = m_wsSheet.Range("A1:D1").SpecialCells(xlCellTypeConstants)
    'หาทุกคอลัมน์ที่มี X ถ้ามีอย่างน้อยหนึ่งให้เริ่มลูป DO/WHILE
    With m_rnCheck
        Set m_rnFind = .Find(What:="X")
        If Not m_rnFind Is Nothing Then
            m_stAddress = m_rnFind.Address
            'ซ่อนคอลัมน์ แล้วหา X ตัวถัดไป
            Do
                m_rnFind.EntireColumn.Hidden = True
                Set m_rnFind = .FindNext(m_rnFind)
            Loop While Not m_rnFind Is Nothing And m_rnFind.Address <> m_stAddress
        End If
    End With
End Sub
```

ตัวอย่างต่อไปหาเซลล์ที่มี "X" แล้ว **แสดง** คอลัมน์นั้น

```vb
Sub Unhide_Columns()
    Dim m_wbBook As Workbook
    Dim m_wsSheet As Worksheet
    Dim m_rnCheck As Range
    Dim m_rnFind As Range
    Dim m_stAddress As String
    Set m_wbBook = ThisWorkbook
    Set m_wsSheet = m_wbBook.Worksheets("Sheet1")
    'ค้นหาค่าคงที่ในสี่คอลัมน์
    Set m_rnCheck = m_wsSheet.Range("A1:D1").SpecialCells(xlCellTypeConstants)
    'หาทุกคอลัมน์ที่มี X ถ้ามีอย่างน้อยหนึ่งให้เริ่มลูป DO/WHILE
    With m_rnCheck
        Set m_rnFind = .Find(What:="X", LookIn:=xlFormulas)
        If Not m_rnFind Is Nothing Then
            m_stAddress = m_rnFind.Address
            'แสดงคอลัมน์ แล้วหา X ตัวถัดไป
            Do
                m_rnFind.EntireColumn.Hidden = False
                Set m_rnFind = .FindNext(m_rnFind)
            Loop While Not m_rnFind Is Nothing And m_rnFind.Address <> m_stAddress
        End If
    End With
End Sub
```

**เทคนิค:** รูปแบบ `Find` → `Do ... FindNext ... Loop While <> ที่อยู่แรก` คือรูปแบบมาตรฐานของการวนหาทุกผลลัพธ์ โดยจำที่อยู่ของผลแรกไว้เพื่อหยุดเมื่อวนครบรอบ

**ผู้เขียน:** Dennis Wallentin ผู้เขียนบล็อก VSTO & .NET & Excel พัฒนาโซลูชัน Excel มากกว่า 20 ปี และเป็นผู้เขียนร่วมหนังสือ "Professional Excel Development" (ฉบับที่ 2)

---

## 21. ไฮไลต์เซลล์ แถว หรือคอลัมน์ที่ Active

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/highlight-the-active-cell-row-or-column>
*โค้ดตัวอย่างโดย Tom Urtis*

ตัวอย่างใช้ event **SelectionChange** ของ **Worksheet** (ต้องวางโค้ดในโมดูลของชีตนั้น)

### ไฮไลต์ active cell

ล้างสีทุกเซลล์ด้วย **ColorIndex** = 0 แล้วไฮไลต์ active cell ด้วย ColorIndex = 8 (Turquoise)

```vb
Private Sub Worksheet_SelectionChange(ByVal Target As Range)
    Application.ScreenUpdating = False
    ' ล้างสีของทุกเซลล์
    Cells.Interior.ColorIndex = 0
    ' ไฮไลต์ active cell
    Target.Interior.ColorIndex = 8
    Application.ScreenUpdating = True
End Sub
```

### ไฮไลต์ทั้งแถวและทั้งคอลัมน์ที่มี active cell

ใช้ property **EntireRow** และ **EntireColumn**

```vb
Private Sub Worksheet_SelectionChange(ByVal Target As Range)
    If Target.Cells.Count > 1 Then Exit Sub
    Application.ScreenUpdating = False
    ' ล้างสีของทุกเซลล์
    Cells.Interior.ColorIndex = 0
    With Target
        ' ไฮไลต์ทั้งแถวและทั้งคอลัมน์ที่มี active cell
        .EntireRow.Interior.ColorIndex = 8
        .EntireColumn.Interior.ColorIndex = 8
    End With
    Application.ScreenUpdating = True
End Sub
```

### ไฮไลต์แถวและคอลัมน์ภายใน Current Region

ใช้ property **CurrentRegion** ของ **Range**

```vb
Private Sub Worksheet_SelectionChange(ByVal Target As Range)
    ' ล้างสีของทุกเซลล์
    Cells.Interior.ColorIndex = 0
    If IsEmpty(Target) Or Target.Cells.Count > 1 Then Exit Sub
    Application.ScreenUpdating = False
    With ActiveCell
        ' ไฮไลต์แถวและคอลัมน์ภายใน current region
        Range(Cells(.Row, .CurrentRegion.Column), Cells(.Row, .CurrentRegion.Columns.Count + .CurrentRegion.Column - 1)).Interior.ColorIndex = 8
        Range(Cells(.CurrentRegion.Row, .Column), Cells(.CurrentRegion.Rows.Count + .CurrentRegion.Row - 1, .Column)).Interior.ColorIndex = 8
    End With
    Application.ScreenUpdating = True
End Sub
```

**ข้อควรระวัง:** การตั้ง `Cells.Interior.ColorIndex = 0` จะล้างสีพื้นที่ผู้ใช้ตั้งไว้เองทั้งชีตด้วย ใช้เฉพาะกับชีตที่ไม่มีสีพื้นหลังที่ต้องรักษาไว้

---

## 22. ทำให้เซลล์กะพริบ

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/make-a-cell-blink>
*โค้ดตัวอย่างโดย Tom Urtis*

ตัวอย่างทำให้ B2 บน Sheet1 กะพริบโดยสลับสีและข้อความระหว่างแดงกับขาวในโพรซีเดอร์ **StartBlinking** ส่วน **StopBlinking** หยุดกะพริบโดยล้างค่าและตั้ง ColorIndex เป็นสีขาว

```vb
Option Explicit
Public NextBlink As Double
'เซลล์ที่ต้องการให้กะพริบ
Public Const BlinkCell As String = "Sheet1!B2"
'เริ่มกะพริบ
Private Sub StartBlinking()
    Application.Goto Range("A1"), 1
    'ถ้าเป็นสีแดง ให้เปลี่ยนสีและข้อความเป็นขาว
    If Range(BlinkCell).Interior.ColorIndex = 3 Then
        Range(BlinkCell).Interior.ColorIndex = 0
        Range(BlinkCell).Value = "White"
    'ถ้าเป็นสีขาว ให้เปลี่ยนสีและข้อความเป็นแดง
    Else
        Range(BlinkCell).Interior.ColorIndex = 3
        Range(BlinkCell).Value = "Red"
    End If
    'รอหนึ่งวินาทีก่อนเปลี่ยนสีอีกครั้ง
    NextBlink = Now + TimeSerial(0, 0, 1)
    Application.OnTime NextBlink, "StartBlinking", , True
End Sub
'หยุดกะพริบ
Private Sub StopBlinking()
    'ตั้งเป็นสีขาว
    Range(BlinkCell).Interior.ColorIndex = 0
    'ล้างค่าในเซลล์
    Range(BlinkCell).ClearContents
    On Error Resume Next
    Application.OnTime NextBlink, "StartBlinking", , False
    Err.Clear
End Sub
```

**เทคนิค:** `Application.OnTime` ตั้งเวลาให้ VBA เรียกโพรซีเดอร์ตัวเองซ้ำ (ลักษณะ timer) การหยุดต้องเรียก `OnTime` ด้วยเวลาเดิมและตั้งพารามิเตอร์สุดท้ายเป็น `False` เพื่อยกเลิกคิว

---

## 23. ป้องกันการกรอกค่าซ้ำในช่วงข้อมูล

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/prevent-duplicate-entries-in-a-range>
*โค้ดตัวอย่างโดย Holy Macro! Books, "Holy Macro! It's 2,500 Excel VBA Examples"*

ตัวอย่างตรวจว่าค่าที่กรอกในช่วง A1:B20 มีอยู่แล้วในช่วงนั้นของชีตใดก็ได้ในเวิร์กบุ๊กหรือไม่ ถ้ามีจะป้องกันการกรอกซ้ำ (โค้ดอยู่ในโมดูล `ThisWorkbook`)

```vb
Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    'กำหนดตัวแปร
    Dim ws As Worksheet, EvalRange As Range
    'ตั้งช่วงที่ต้องการป้องกันค่าซ้ำ
    Set EvalRange = Range("A1:B20")
    'ถ้าเซลล์ที่กรอกอยู่นอกช่วง ค่าที่วางใหญ่กว่าหนึ่งเซลล์
    'หรือไม่มีค่าที่กรอก ให้ออกจากมาโคร
    If Intersect(Target, EvalRange) Is Nothing Or Target.Cells.Count > 1 Then Exit Sub
    If IsEmpty(Target) Then Exit Sub
    'ถ้าค่าที่กรอกมีอยู่แล้วในช่วงของชีตปัจจุบัน ให้แจ้งข้อผิดพลาดและเลิกทำการกรอก
    If WorksheetFunction.CountIf(EvalRange, Target.Value) > 1 Then
        MsgBox Target.Value & " มีอยู่แล้วในชีตนี้"
        Application.EnableEvents = False
        Application.Undo
        Application.EnableEvents = True
    End If
    'ตรวจชีตอื่นในเวิร์กบุ๊ก
    For Each ws In Worksheets
        With ws
            If .Name <> Target.Parent.Name Then
                'ถ้าค่าที่กรอกมีอยู่แล้วในชีตอื่น ให้แจ้งข้อผิดพลาดและเลิกทำ
                If WorksheetFunction.CountIf(Sheets(.Name).Range("A1:B20"), Target.Value) > 0 Then
                    MsgBox Target.Value & " มีอยู่แล้วในชีตชื่อ " & .Name & ".", _
                    16, "ห้ามมีค่าซ้ำใน " & EvalRange.Address(0, 0) & "."
                    Application.EnableEvents = False
                    Application.Undo
                    Application.EnableEvents = True
                    Exit For
                End If
            End If
        End With
    Next ws
End Sub
```

**เทคนิค:** ก่อน `Application.Undo` ต้องตั้ง `EnableEvents = False` เพื่อไม่ให้การ Undo เรียก event ซ้ำวนไม่รู้จบ และต้องตั้งกลับเป็น `True` ทุกครั้ง

---

## 24. สร้างไฟล์ HTML สารบัญจากข้อมูลในเซลล์

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/create-an-html-file-with-a-table-of-contents-based-on-cell-data>
*โค้ดตัวอย่างโดย Holy Macro! Books*

ตัวอย่างนำข้อมูลจากเวิร์กชีตมาสร้างสารบัญในไฟล์ HTML เวิร์กชีตต้องมีข้อมูลในคอลัมน์ A, B, C ซึ่งตรงกับลำดับชั้นที่ 1, 2, 3 ของสารบัญ ไฟล์ HTML ถูกบันทึกในโฟลเดอร์เดียวกับเวิร์กบุ๊กที่ active

```vb
Sub CreateHTML()
   'กำหนดตัวแปร
   Dim iRow As Long
   Dim iStage As Integer
   Dim iCounter As Integer
   Dim iPage As Integer
   'สร้างไฟล์ .htm ในโฟลเดอร์เดียวกับเวิร์กบุ๊กที่ active
   Dim sFile As String
   sFile = ActiveWorkbook.Path & "\test.htm"
   Close
   'เปิดไฟล์ HTML ชั่วคราวและเขียนส่วนหัว
   Open sFile For Output As #1
   Print #1, "<html>"
   Print #1, "<head>"
   Print #1, "<style type=""text/css"">"
   Print #1, "  body { font-size:12px;font-family:tahoma } "
   Print #1, "</style>"
   Print #1, "</head>"
   Print #1, "<body>"
   'เริ่มที่แถวที่ 2 เพื่อข้ามหัวตาราง
   iRow = 2
   'แปลคอลัมน์แรกเป็นลำดับชั้นที่ 1
   Do While WorksheetFunction.CountA(Rows(iRow)) > 0
      If Not IsEmpty(Cells(iRow, 1)) Then
         For iCounter = 1 To iStage
            Print #1, "</ul>"
            iStage = iStage - 1
         Next iCounter
         Print #1, "<ul>"
         Print #1, "<li><a href=""" & iPage & ".html"">" & Cells(iRow, 1).Value & "</a>"
         iPage = iPage + 1
         If iStage < 1 Then
            iStage = iStage + 1
         End If
      End If
    'แปลคอลัมน์ที่สองเป็นลำดับชั้นที่ 2
      If Not IsEmpty(Cells(iRow, 2)) Then
         For iCounter = 2 To iStage
            Print #1, "</ul>"
            iStage = iStage - 1
         Next iCounter
         Print #1, "<ul>"
         Print #1, "<li><a href=""" & iPage & ".html"">" & Cells(iRow, 2).Value & "</a>"
         iPage = iPage + 1
         If iStage < 2 Then
            iStage = iStage + 1
         End If
      End If
      'แปลคอลัมน์ที่สามเป็นลำดับชั้นที่ 3
      If Not IsEmpty(Cells(iRow, 3)) Then
         If iStage < 3 Then
            Print #1, "<ul>"
         End If
         Print #1, "<li><a href=""" & iPage & ".html"">" & Cells(iRow, 3).Value & "</a>"
         iPage = iPage + 1
         If iStage < 3 Then
            iStage = iStage + 1
         End If
      End If
      iRow = iRow + 1
   Loop
   'เพิ่มแท็กปิดท้าย
   For iCounter = 2 To iStage
      Print #1, "    </ul>"
      iStage = iStage - 1
   Next iCounter
   Print #1, "</body>"
   Print #1, "</html>"
   Close
   Shell "hh " & vbLf & sFile, vbMaximizedFocus
End Sub
```

**กระบวนการ:** วนทีละแถวจนเจอแถวว่าง (`CountA = 0`) → ดูว่าข้อมูลอยู่คอลัมน์ไหนเพื่อกำหนดระดับ → ถ้าระดับลดลงให้ปิด `</ul>` ตามจำนวนที่ลด → เปิด `<ul>` เมื่อลงระดับ → เขียน `<li><a>` → ปิดแท็กที่ค้างเมื่อจบ → เปิดไฟล์ด้วย `Shell`

---

## 25. สรุปเทคนิคและแนวปฏิบัติที่ดี

สรุปจากทั้งหมวด (ข้อ 1–4 มาจากต้นฉบับโดยตรง ข้อ 5–6 เป็นข้อสังเกตของผู้แปลจากตัวอย่างในหมวด)

1. **ไม่จำเป็นต้อง Select ก่อนทำงาน** อ้างอิงวัตถุ Range ตรง ๆ แล้วแก้ property ได้เลย (หัวข้อ 13)
2. **เลือกวิธีอ้างอิงให้เหมาะกับงาน** `Range` สำหรับช่วงแบบ A1, `Cells` สำหรับเลขดัชนีที่วนลูป, `Rows`/`Columns` สำหรับทั้งแถว/คอลัมน์, `Offset` สำหรับตำแหน่งสัมพัทธ์ (หัวข้อ 4–8, 11)
3. **หาขอบเขตข้อมูลด้วย `Find` ย้อนจากท้าย** แทนการเดาแถวสุดท้าย (หัวข้อ 12)
4. **ใช้ `Formula2` กับ Excel ที่มี Dynamic Arrays** (หัวข้อ 17)
5. **ปิด `ScreenUpdating`** ระหว่างทำงานหนักและเปิดกลับเมื่อจบ ตัวอย่างหลายข้อในหมวดนี้ทำเช่นนั้น (หัวข้อ 11, 18, 19, 21)
6. **ลบเป็นลำดับย้อนกลับ** และ **ปิด/เปิด `EnableEvents` ให้ครบคู่** เมื่อโค้ดเปลี่ยนค่าที่ทำให้ event ทำงานซ้ำ (หัวข้อ 11, 23)

---

> ต้นฉบับ © Microsoft, เผยแพร่บน Microsoft Learn ภายใต้ซอร์ส MicrosoftDocs/VBA-Docs เอกสารนี้เป็นการแปลเพื่อการศึกษา โปรดตรวจเทียบกับต้นฉบับเมื่อใช้งานจริง
