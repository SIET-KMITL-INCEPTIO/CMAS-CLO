# Excel VBA: เหตุการณ์ ฟังก์ชันเวิร์กชีต และรูปร่าง (Events, Worksheet Functions, and Shapes)

> ฉบับแปลภาษาไทยจาก Microsoft Learn ส่วน Concepts → Events, worksheet functions, and shapes
> สารบัญต้นทาง: <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/events-worksheet-functions-and-shapes>
> ต้นฉบับ Markdown: <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts/Events-WorksheetFunctions-Shapes>
> หน้า Overview: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>
>
> คงชื่อ object / property / method / event เป็นอังกฤษ ทุกหัวข้อมีบรรทัด **อ้างอิง**

ฐานลิงก์อ้างอิง: `https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/<ชื่อหน้า>`

## สารบัญ

**ส่วน A: เหตุการณ์ (Events)**
1. [การใช้ event กับออบเจ็กต์ Excel (ภาพรวมและ EnableEvents)](#1-การใช้-event-กับออบเจ็กต์-excel)
2. [Event ของ Worksheet](#2-event-ของ-worksheet)
3. [Event ของ Chart](#3-event-ของ-chart)
4. [การใช้ event กับแผนภูมิที่ฝัง (Embedded Charts)](#4-การใช้-event-กับแผนภูมิที่ฝัง)
5. [การใช้ event กับออบเจ็กต์ Application](#5-การใช้-event-กับออบเจ็กต์-application)
6. [Event ของ QueryTable](#6-event-ของ-querytable)
7. [การใช้ event กับออบเจ็กต์ QueryTable](#7-การใช้-event-กับออบเจ็กต์-querytable)
8. [Event ของตัวควบคุมและกล่องโต้ตอบ](#8-event-ของตัวควบคุมและกล่องโต้ตอบ)
9. [ข้อผิดพลาด Invalid procedure name](#9-ข้อผิดพลาด-invalid-procedure-name)

**ส่วน B: ฟังก์ชันเวิร์กชีต**

10. [ใช้ฟังก์ชันเวิร์กชีตของ Excel ใน VBA](#10-ใช้ฟังก์ชันเวิร์กชีตของ-excel-ใน-vba)
11. [รายการฟังก์ชันเวิร์กชีตที่เรียกจาก VBA ได้](#11-รายการฟังก์ชันเวิร์กชีตที่เรียกจาก-vba-ได้)
12. [รายการฟังก์ชันที่รองรับสตริงยาว](#12-รายการฟังก์ชันที่รองรับสตริงยาว)

**ส่วน C: รูปร่าง**

13. [ทำงานกับรูปร่าง (Shapes / Drawing Objects)](#13-ทำงานกับรูปร่าง)
14. [สรุปเทคนิค](#14-สรุปเทคนิค)

---

# ส่วน A: เหตุการณ์ (Events)

## 1. การใช้ event กับออบเจ็กต์ Excel

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/using-events-with-excel-objects>

เขียนโพรซีเดอร์ event ใน Excel ได้ที่ระดับเวิร์กชีต แผนภูมิ query table เวิร์กบุ๊ก หรือแอปพลิเคชัน เช่น event **Activate** เกิดระดับชีต ส่วน **SheetActivate** มีทั้งระดับเวิร์กบุ๊กและแอปพลิเคชัน **SheetActivate** ระดับเวิร์กบุ๊กเกิดเมื่อชีตใดก็ตามในเวิร์กบุ๊กนั้นถูก activate ส่วนระดับแอปพลิเคชันเกิดเมื่อชีตใดก็ตามในเวิร์กบุ๊กใดก็ตามที่เปิดอยู่ถูก activate

โพรซีเดอร์ event ของ Worksheet, Chart (ชีตแผนภูมิ) ใช้ได้กับทุกชีตหรือเวิร์กบุ๊กที่เปิดอยู่ แต่การเขียนโพรซีเดอร์ event สำหรับ **แผนภูมิที่ฝัง** ออบเจ็กต์ **QueryTable** หรือออบเจ็กต์ **Application** ต้องสร้างออบเจ็กต์ใหม่ด้วยคีย์เวิร์ด **WithEvents** ในคลาสโมดูล

ใช้ property **EnableEvents** เปิด/ปิด event เช่น การใช้ method **Save** บันทึกเวิร์กบุ๊กทำให้เกิด event BeforeSave ป้องกันได้โดยตั้ง `EnableEvents` เป็น **False** ก่อนเรียก `Save`

```vb
Application.EnableEvents = False
ActiveWorkbook.Save
Application.EnableEvents = True
```

---

## 2. Event ของ Worksheet

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/worksheet-object-events>

event บนชีตเปิดใช้โดยค่าเริ่มต้น ดูโพรซีเดอร์ event ของชีตโดยคลิกขวาที่แท็บชีต เลือก **View Code** แล้วเลือก event จากรายการ **Procedure**

| Event | เอกสาร API |
| :-- | :-- |
| Activate | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.activate(even)> |
| BeforeDoubleClick | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.beforedoubleclick> |
| BeforeRightClick | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.beforerightclick> |
| Calculate | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.calculate(even)> |
| Change | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.change> |
| Deactivate | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.deactivate> |
| FollowHyperlink | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.followhyperlink> |
| PivotTableUpdate | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.pivottableupdate> |
| SelectionChange | <https://learn.microsoft.com/en-us/office/vba/api/excel.worksheet.selectionchange> |

event ระดับเวิร์กชีตเกิดเมื่อชีตถูก activate เมื่อผู้ใช้เปลี่ยนเซลล์ หรือเมื่อ PivotTable เปลี่ยน ตัวอย่างปรับความกว้างคอลัมน์ A ถึง F ทุกครั้งที่ชีตถูกคำนวณใหม่

```vb
Private Sub Worksheet_Calculate()
    Columns("A:F").AutoFit
End Sub
```

event บางตัวใช้แทนพฤติกรรมเริ่มต้นของแอปพลิเคชัน หรือปรับเปลี่ยนเล็กน้อยได้ ตัวอย่างดักการคลิกขวาและเพิ่มรายการเมนูใหม่ในเมนูทางลัดของเซลล์ B1:B10

```vb
Private Sub Worksheet_BeforeRightClick(ByVal Target As Range, _
        Cancel As Boolean)
    For Each icbc In Application.CommandBars("cell").Controls
        If icbc.Tag = "brccm" Then icbc.Delete
    Next icbc
    If Not Application.Intersect(Target, Range("b1:b10")) _
            Is Nothing Then
        With Application.CommandBars("cell").Controls _
            .Add(Type:=msoControlButton, before:=6, _
                temporary:=True)
           .Caption = "New Context Menu Item"
           .OnAction = "MyMacro"
           .Tag = "brccm"
        End With
    End If
End Sub
```

**เทคนิค:** ลบรายการเมนูที่เคยเพิ่ม (ค้นด้วย `Tag`) ก่อนเพิ่มใหม่ทุกครั้ง เพื่อไม่ให้เมนูซ้ำสะสม และใช้ `temporary:=True` เพื่อให้เมนูหายเมื่อปิด Excel

---

## 3. Event ของ Chart

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/chart-object-events>

event ของแผนภูมิเกิดเมื่อผู้ใช้ activate หรือเปลี่ยนแผนภูมิ event บนชีตแผนภูมิเปิดใช้โดยค่าเริ่มต้น ดูโพรซีเดอร์ event ของชีตโดยคลิกขวาที่แท็บชีต เลือก **View Code** แล้วเลือกชื่อ event จากรายการ **Procedure**

รายการ event: Activate, BeforeDoubleClick, BeforeRightClick, Calculate, Deactivate, MouseDown, MouseMove, MouseUp, Resize, Select, SeriesChange

เอกสาร API ของแต่ละ event: <https://learn.microsoft.com/en-us/office/vba/api/excel.chart.serieschange> (และหน้าอื่นในรูปแบบ `excel.chart.<ชื่อ event>`; Activate และ Select ใช้ `excel.chart.activate(even)` และ `excel.chart.select(even)`)

> **หมายเหตุ:** การเขียนโพรซีเดอร์ event สำหรับ **แผนภูมิที่ฝัง** ต้องสร้างออบเจ็กต์ใหม่ด้วย **WithEvents** ในคลาสโมดูล ดูหัวข้อ 4

ตัวอย่างเปลี่ยนสีเส้นขอบของจุดข้อมูลเมื่อผู้ใช้เปลี่ยนค่าของจุดนั้น

```vb
Private Sub Chart_SeriesChange(ByVal SeriesIndex As Long, _
        ByVal PointIndex As Long)
    Set p = ActiveChart.SeriesCollection(SeriesIndex). _
        Points(PointIndex)
    p.Border.ColorIndex = 3
End Sub
```

---

## 4. การใช้ event กับแผนภูมิที่ฝัง

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/using-events-with-embedded-charts>

event เปิดใช้กับชีตแผนภูมิโดยค่าเริ่มต้น ก่อนใช้ event กับออบเจ็กต์ **Chart** ที่แทนแผนภูมิที่ฝัง ต้องสร้างคลาสโมดูลใหม่ แล้วประกาศออบเจ็กต์ชนิด **Chart** แบบมี event เช่น สร้างคลาสโมดูลชื่อ EventClassModule ที่มีโค้ด

```vb
Public WithEvents myChartClass As Chart
```

เมื่อประกาศออบเจ็กต์แบบมี event แล้ว ออบเจ็กต์จะปรากฏในรายการ **Object** ของคลาสโมดูล และเขียนโพรซีเดอร์ event ได้ (เมื่อเลือกออบเจ็กต์ใหม่ในกล่อง **Object** event ที่ใช้ได้จะแสดงในรายการ **Procedure**)

ก่อนที่โพรซีเดอร์จะทำงาน ต้องเชื่อมออบเจ็กต์ที่ประกาศในคลาสโมดูลกับแผนภูมิที่ฝัง ด้วยโค้ดนี้จากโมดูลใดก็ได้

```vb
Dim myClassModule As New EventClassModule
Sub InitializeChart()
 Set myClassModule.myChartClass = _
 Charts(1).ChartObjects(1).Chart
End Sub
```

หลังรันโพรซีเดอร์ InitializeChart ออบเจ็กต์ **myChartClass** ในคลาสโมดูลจะชี้ไปที่แผนภูมิฝังหมายเลข 1 บนเวิร์กชีต 1 และโพรซีเดอร์ event ในคลาสโมดูลจะทำงานเมื่อ event เกิดขึ้น

> **หมายเหตุผู้แปล:** ในต้นฉบับ `Charts(1).ChartObjects(1).Chart` อ้างถึง `Charts` (ชีตแผนภูมิ) ซึ่งตามความหมายของข้อความ "แผนภูมิฝังหมายเลข 1 บนเวิร์กชีต 1" น่าจะต้องเป็น `Worksheets(1).ChartObjects(1).Chart` ควรตรวจเทียบกับต้นฉบับก่อนนำไปใช้

---

## 5. การใช้ event กับออบเจ็กต์ Application

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/using-events-with-the-application-object>

ก่อนใช้ event กับออบเจ็กต์ **Application** ต้องสร้างคลาสโมดูลและประกาศออบเจ็กต์ชนิด **Application** แบบมี event เช่น คลาสโมดูลชื่อ EventClassModule มีโค้ด

```vb
Public WithEvents App As Application
```

เมื่อประกาศแล้ว ออบเจ็กต์จะปรากฏในรายการ **Object** ของคลาสโมดูลและเขียนโพรซีเดอร์ event ได้ ก่อนโพรซีเดอร์จะทำงาน ต้องเชื่อมออบเจ็กต์นี้กับออบเจ็กต์ **Application** ด้วยโค้ดจากโมดูลใดก็ได้

```vb
Dim X As New EventClassModule
Sub InitializeApp()
 Set X.App = Application
End Sub
```

หลังรัน **InitializeApp** ออบเจ็กต์ **App** ในคลาสโมดูลจะชี้ไปที่ออบเจ็กต์ **Application** ของ Excel และโพรซีเดอร์ event ในคลาสโมดูลจะทำงานเมื่อ event เกิดขึ้น

**เทคนิค:** ตัวแปร `X` ต้องมีอายุอยู่ตลอดการใช้งาน (ประกาศระดับโมดูล ดังตัวอย่าง) ถ้าเป็นตัวแปรโลคัลในโพรซีเดอร์ ออบเจ็กต์จะถูกทำลายเมื่อโพรซีเดอร์จบ และ event จะหยุดทำงาน (ข้อสังเกตของผู้แปล)

---

## 6. Event ของ QueryTable

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/querytable-object-events>

event ของ **QueryTable** เกิดเมื่อมีการรีเฟรชออบเจ็กต์ QueryTable และเปิดใช้โดยค่าเริ่มต้น ดูโพรซีเดอร์ event ของชีตโดยคลิกขวาแท็บชีต เลือก **View Code** แล้วเลือกชื่อ event จากรายการ **Procedure** ในหน้าต่างโค้ด

- **AfterRefresh** — <https://learn.microsoft.com/en-us/office/vba/api/excel.querytable.afterrefresh>
- **BeforeRefresh** — <https://learn.microsoft.com/en-us/office/vba/api/excel.querytable.beforerefresh>

> **หมายเหตุ:** ต้องสร้างออบเจ็กต์ใหม่ด้วย **WithEvents** ในคลาสโมดูลก่อน ดูหัวข้อ 7

---

## 7. การใช้ event กับออบเจ็กต์ QueryTable

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/using-events-with-the-querytable-object>

ก่อนใช้ event กับ **QueryTable** ต้องสร้างคลาสโมดูลและประกาศ **QueryTable** แบบมี event เช่น คลาสโมดูลชื่อ `ClsModQT` มีโค้ด

```vb
Public WithEvents qtQueryTable As QueryTable
```

เมื่อประกาศแล้ว ออบเจ็กต์ปรากฏในรายการ **Object** ของคลาสโมดูล ก่อนโพรซีเดอร์จะทำงาน ต้องเชื่อมออบเจ็กต์กับ **QueryTable** ที่ต้องการ โดยใส่โค้ดนี้ในคลาสโมดูล

```vb
Sub InitQueryEvent(QT as Object)
 Set qtQueryTable = QT
End Sub
```

หลังรันโพรซีเดอร์เริ่มต้นนี้ ออบเจ็กต์ที่ประกาศในคลาสโมดูลจะชี้ไปที่ QueryTable ที่ระบุ เริ่มต้น event ในโมดูลได้โดยเรียก ตัวอย่างนี้เชื่อม query table ตัวแรกบนเวิร์กชีตที่ active กับออบเจ็กต์ **qtQueryTable**

```vb
Dim clsQueryTable as New ClsModQT
Sub RunInitQTEvent()
 clsQueryTable.InitQueryEvent _
 QT:=ActiveSheet.QueryTables(1)
End Sub
```

เขียนโพรซีเดอร์ event อื่นในคลาสของออบเจ็กต์ได้ เมื่อคลิกออบเจ็กต์ใหม่ในกล่อง **Object** event ที่ใช้ได้จะแสดงในรายการ **Procedure**

**กระบวนการร่วมของ Application / Embedded Chart / QueryTable:** (1) สร้างคลาสโมดูล (2) ประกาศตัวแปร `Public WithEvents ... As <ชนิด>` (3) เขียนโพรซีเดอร์ event ในคลาสนั้น (4) ในโมดูลปกติ สร้างอินสแตนซ์ `Dim x As New <คลาส>` ที่มีอายุยืน แล้ว `Set x.<ตัวแปร> = <ออบเจ็กต์จริง>` เพื่อเชื่อมต่อ

---

## 8. Event ของตัวควบคุมและกล่องโต้ตอบ

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/control-and-dialog-box-events>

หลังเพิ่มตัวควบคุม (controls) ลงกล่องโต้ตอบหรือเอกสารแล้ว คุณเพิ่มโพรซีเดอร์ event เพื่อกำหนดว่าตัวควบคุมตอบสนองต่อการกระทำของผู้ใช้อย่างไร

User form และตัวควบคุมมีชุด event ที่กำหนดไว้ล่วงหน้า เช่น command button มี event **Click** ที่เกิดเมื่อผู้ใช้คลิก และ UserForm มี event **Initialize** ที่ทำงานเมื่อโหลดฟอร์ม

การเขียนโพรซีเดอร์ event ของตัวควบคุมหรือฟอร์ม: เปิดโมดูลโดยดับเบิลคลิกฟอร์มหรือตัวควบคุม แล้วเลือก event จากรายการ **Procedure**

ชื่อโพรซีเดอร์ event มีชื่อตัวควบคุมรวมอยู่ เช่น ชื่อโพรซีเดอร์ event **Click** ของ command button ที่ชื่อ `Command1` คือ `Command1_Click`

ถ้าเพิ่มโค้ดในโพรซีเดอร์ event แล้วเปลี่ยนชื่อตัวควบคุม โค้ดจะยังอยู่ในโพรซีเดอร์ที่ใช้ชื่อเดิม เช่น เพิ่มโค้ดใน Click ของ `Command1` แล้วเปลี่ยนชื่อตัวควบคุมเป็น `Command2` เมื่อดับเบิลคลิก `Command2` จะไม่เห็นโค้ดใน event Click ต้องย้ายโค้ดจาก `Command1_Click` ไป `Command2_Click`

**แนวปฏิบัติที่ดี:** ตั้งชื่อตัวควบคุมก่อนเขียนโค้ด

---

## 9. ข้อผิดพลาด Invalid procedure name

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/invalid-procedure-name-error>

คุณระบุชื่อโพรซีเดอร์ไม่ถูกต้อง หรือไม่ได้ใส่ชื่อโพรซีเดอร์เมื่อพยายามสร้าง

ชื่อมาโครที่ใช้ได้:

- ต้องขึ้นต้นด้วยตัวอักษร
- ห้ามมีช่องว่างหรืออักขระที่ไม่ใช่ตัวอักษรและตัวเลข (เช่น &, *, /)
- ห้ามมีจุด ใช้จุด (.) ในชื่อมาโครได้เพียงเพื่อกำหนดโพรซีเดอร์ในโมดูลโดยชัดเจน เช่น พิมพ์ชื่อมาโครใหม่ "my.test" จะได้โมดูลใหม่ชื่อ "my" ที่มีโพรซีเดอร์ชื่อ "test"
- ยาวไม่เกิน 80 ตัวอักษร
- ห้ามซ้ำกับตัวระบุหรือคีย์เวิร์ดที่สงวนไว้ของโปรแกรม เช่น คำว่า "print"

---

# ส่วน B: ฟังก์ชันเวิร์กชีต

## 10. ใช้ฟังก์ชันเวิร์กชีตของ Excel ใน VBA

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/using-excel-worksheet-functions-in-visual-basic>

ใช้ฟังก์ชันเวิร์กชีตของ Excel ส่วนใหญ่ในคำสั่ง VBA ได้ รายการฟังก์ชันที่ใช้ได้อยู่ในหัวข้อ 11

> **หมายเหตุ:** บางฟังก์ชันไม่มีประโยชน์ใน VBA เช่น **Concatenate** ไม่จำเป็น เพราะใน VBA ใช้ตัวดำเนินการ **&** ต่อข้อความได้

### เรียกฟังก์ชันเวิร์กชีตจาก VBA

ใน VBA ฟังก์ชันเวิร์กชีตของ Excel เรียกผ่านออบเจ็กต์ **WorksheetFunction**

โพรซีเดอร์นี้ใช้ฟังก์ชัน **Min** หาค่าน้อยที่สุดในช่วงเซลล์ ขั้นแรกประกาศ `myRange` เป็น **Range** แล้วกำหนดเป็น A1:C10 ของ Sheet1 ตัวแปร `answer` เก็บผลของ **Min** ที่ใช้กับ `myRange` สุดท้ายแสดง `answer` ใน message box

```vb
Sub UseFunction()
 Dim myRange As Range
 Set myRange = Worksheets("Sheet1").Range("A1:C10")
 answer = Application.WorksheetFunction.Min(myRange)
 MsgBox answer
End Sub
```

ถ้าใช้ฟังก์ชันที่ต้องการช่วงเซลล์เป็นอาร์กิวเมนต์ ต้องระบุออบเจ็กต์ **Range** เช่น ฟังก์ชัน **Match** ค้นหาในช่วงเซลล์ ในเซลล์จะพิมพ์สูตร `=MATCH(9,A1:A10,0)` แต่ในโพรซีเดอร์ VBA ระบุออบเจ็กต์ **Range** เพื่อให้ได้ผลเดียวกัน

```vb
Sub FindFirst()
 myVar = Application.WorksheetFunction _
 .Match(9, Worksheets(1).Range("A1:A10"), 0)
 MsgBox myVar
End Sub
```

> **หมายเหตุ:** ฟังก์ชันของ VBA เองไม่ใช้ตัวกำกับ **WorksheetFunction** ฟังก์ชันอาจชื่อเหมือนฟังก์ชันของ Excel แต่ทำงานต่างกัน เช่น `Application.WorksheetFunction.Log` กับ `Log` คืนค่าต่างกัน

### ใส่ฟังก์ชันเวิร์กชีตลงในเซลล์

กำหนดฟังก์ชันเป็นค่าของ property **Formula** ของ **Range** ตัวอย่างกำหนด RAND ให้ **Formula** ของ A1:B3 บน Sheet1

```vb
Sub InsertFormula()
 Worksheets("Sheet1").Range("A1:B3").Formula = "=RAND()"
End Sub
```

### ตัวอย่าง: คำนวณค่างวดสินเชื่อบ้านด้วย Pmt

ตัวอย่างนี้ใช้ **Pmt** คำนวณเงินผ่อนสินเชื่อบ้าน สังเกตว่าใช้ **method** `InputBox` (ของ Application) แทน **ฟังก์ชัน** `InputBox` เพื่อให้ตรวจชนิดข้อมูลได้ คำสั่ง **Static** ทำให้ VBA จำค่าของตัวแปรสามตัว และแสดงเป็นค่าเริ่มต้นเมื่อรันโปรแกรมครั้งถัดไป

```vb
Static loanAmt
Static loanInt
Static loanTerm
loanAmt = Application.InputBox _
 (Prompt:="Loan amount (100,000 for example)", _
 Default:=loanAmt, Type:=1)
loanInt = Application.InputBox _
 (Prompt:="Annual interest rate (8.75 for example)", _
 Default:=loanInt, Type:=1)
loanTerm = Application.InputBox _
 (Prompt:="Term in years (30 for example)", _
 Default:=loanTerm, Type:=1)
payment = Application.WorksheetFunction _
 .Pmt(loanInt / 1200, loanTerm * 12, loanAmt)
MsgBox "Monthly payment is " & Format(payment, "Currency")
```

**เทคนิค:** `Pmt(อัตราต่อเดือน, จำนวนงวด, เงินต้น)` จึงหาร 1200 (12 เดือน × 100%) และคูณ 12 ให้เป็นงวดรายเดือน ผลที่ได้เป็นค่าติดลบ (เงินจ่ายออก) ตามข้อตกลงของฟังก์ชันทางการเงิน

---

## 11. รายการฟังก์ชันเวิร์กชีตที่เรียกจาก VBA ได้

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/list-of-worksheet-functions-available-to-visual-basic>

รายการต่อไปนี้คือฟังก์ชันเวิร์กชีตทั้งหมดที่เรียกได้ผ่านออบเจ็กต์ **WorksheetFunction** รายละเอียดของแต่ละฟังก์ชันดูที่ [Excel functions (by category)](https://support.office.com/article/excel-functions-by-category-5f91f4e9-7b42-46d2-9bd1-63f26a86c0eb) ชื่อฟังก์ชันทั้งหมดเป็นภาษาอังกฤษตามต้นฉบับ

| | | | | | |
|:--|:--|:--|:--|:--|:--|
| `vbaxl10.chm5202691` | `AccrInt` | `AccrIntM` | `Acos` | `Acosh` | `Aggregate` |
| `AmorDegrc` | `AmorLinc` | `And` | `Application` | `Asc` | `Asin` |
| `Asinh` | `Atan2` | `Atanh` | `AveDev` | `Average` | `AverageIf` |
| `AverageIfs` | `BahtText` | `BesselI` | `BesselJ` | `BesselK` | `BesselY` |
| `BetaDist` | `BetaInv` | `Bin2Dec` | `Bin2Hex` | `Bin2Oct` | `Binom_Dist` |
| `Binom_Inv` | `BinomDist` | `Ceiling` | `Ceiling_Precise` | `ChiDist` | `ChiInv` |
| `ChiSq_Dist` | `ChiSq_Dist_RT` | `ChiSq_Inv` | `ChiSq_Inv_RT` | `ChiSq_Test` | `ChiTest` |
| `Choose` | `Clean` | `Combin` | `Complex` | `Confidence` | `Confidence_Norm` |
| `Confidence_T` | `Convert` | `Correl` | `Cosh` | `Count` | `CountA` |
| `CountBlank` | `CountIf` | `CountIfs` | `CoupDayBs` | `CoupDays` | `CoupDaysNc` |
| `CoupNcd` | `CoupNum` | `CoupPcd` | `Covar` | `Covariance_P` | `Covariance_S` |
| `CritBinom` | `CumIPmt` | `CumPrinc` | `DAverage` | `Days360` | `Db` |
| `Dbcs` | `DCount` | `DCountA` | `Ddb` | `Dec2Bin` | `Dec2Hex` |
| `Dec2Oct` | `Degrees` | `Delta` | `DevSq` | `DGet` | `Disc` |
| `DMax` | `DMin` | `Dollar` | `DollarDe` | `DollarFr` | `DProduct` |
| `DStDev` | `DStDevP` | `DSum` | `Duration` | `DVar` | `DVarP` |
| `EDate` | `Effect` | `EoMonth` | `Erf` | `Erf_Precise` | `ErfC` |
| `Even` | `Expon_Dist` | `ExponDist` | `F_Dist` | `F_Dist_RT` | `F_Inv` |
| `F_Inv_RT` | `F_Test` | `Fact` | `FactDouble` | `FDist` | `Find` |
| `FindB` | `FInv` | `Fisher` | `FisherInv` | `Fixed` | `Floor` |
| `Forecast` | `Frequency` | `FTest` | `Fv` | `FVSchedule` | `Gamma_Dist` |
| `Gamma_Inv` | `GammaDist` | `GammaInv` | `GammaLn` | `GammaLn_Precise` | `Gcd` |
| `GeoMean` | `GeStep` | `Growth` | `HarMean` | `Hex2Bin` | `Hex2Dec` |
| `Hex2Oct` | `HLookup` | `HypGeom_Dist` | `HypGeomDist` | `IfError` | `ImAbs` |
| `Imaginary` | `ImArgument` | `ImConjugate` | `ImCos` | `ImDiv` | `ImExp` |
| `ImLn` | `ImLog10` | `ImLog2` | `ImPower` | `ImProduct` | `ImReal` |
| `ImSin` | `ImSqrt` | `ImSub` | `ImSum` | `Index` | `Intercept` |
| `IntRate` | `Ipmt` | `Irr` | `IsErr` | `IsError` | `IsEven` |
| `IsLogical` | `IsNA` | `IsNonText` | `IsNumber` | `IsOdd` | `Ispmt` |
| `IsText` | `Kurt` | `Large` | `Lcm` | `LinEst` | `Ln` |
| `Log` | `Log10` | `LogEst` | `LogInv` | `LogNorm_Dist` | `LogNorm_Inv` |
| `LogNormDist` | `Lookup` | `Match` | `Max` | `MDeterm` | `MDuration` |
| `Median` | `Min` | `MInverse` | `MIrr` | `MMult` | `Mode` |
| `Mode_Mult` | `Mode_Sngl` | `MRound` | `MultiNomial` | `NegBinom_Dist` | `NegBinomDist` |
| `NetworkDays` | `Nominal` | `Norm_Dist` | `Norm_Inv` | `Norm_S_Dist` | `Norm_S_Inv` |
| `NormDist` | `NormInv` | `NormSDist` | `NormSInv` | `NPer` | `Npv` |
| `Oct2Bin` | `Oct2Dec` | `Oct2Hex` | `Odd` | `OddFPrice` | `OddFYield` |
| `OddLPrice` | `OddLYield` | `Or` | `Pearson` | `Percentile` | `Percentile_Exc` |
| `Percentile_Inc` | `PercentRank` | `PercentRank_Exc` | `PercentRank_Inc` | `Permut` | `Phonetic` |
| `Pi` | `Pmt` | `Poisson` | `Poisson_Dist` | `Power` | `Ppmt` |
| `Price` | `PriceDisc` | `PriceMat` | `Prob` | `Product` | `Proper` |
| `Pv` | `Quartile` | `Quartile_Exc` | `Quartile_Inc` | `Quotient` | `Radians` |
| `RandBetween` | `Rank` | `Rank_Avg` | `Rank_Eq` | `Rate` | `Received` |
| `Replace` | `ReplaceB` | `Rept` | `Roman` | `Round` | `RoundDown` |
| `RoundUp` | `RSq` | `RTD` | `Search` | `SearchB` | `SeriesSum` |
| `Sinh` | `Skew` | `Sln` | `Slope` | `Small` | `SqrtPi` |
| `Standardize` | `StDev` | `StDev_P` | `StDev_S` | `StDevP` | `StEyx` |
| `Substitute` | `Subtotal` | `Sum` | `SumIf` | `SumIfs` | `SumProduct` |
| `SumSq` | `SumX2MY2` | `SumX2PY2` | `SumXMY2` | `Syd` | `T_Dist` |
| `T_Dist_2t` | `T_Dist_RT` | `T_Inv` | `T_Inv_2T` | `T_Test` | `Tanh` |
| `TBillEq` | `TBillPrice` | `TBillYield` | `TDist` | `Text` | `TInv` |
| `Transpose` | `Trend` | `Trim` | `TrimMean` | `TTest` | `USDollar` |
| `Var` | `Var_P` | `Var_S` | `VarP` | `Vdb` | `VLookup` |
| `Weekday` | `WeekNum` | `Weibull` | `Weibull_Dist` | `WorkDay` | `WorkDay_Intl` |
| `Xirr` | `Xnpv` | `YearFrac` | `YieldDisc` | `YieldMat` | `Z_Test` |
| `ZTest` |  |  |  |  |  |

(รวม 331 ฟังก์ชัน)

---

## 12. รายการฟังก์ชันที่รองรับสตริงยาว

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/list-of-worksheet-functions-that-support-long-strings>

ฟังก์ชันเวิร์กชีตต่อไปนี้รองรับสตริงที่ยาวกว่า 255 ตัวอักษร ความยาวสตริงสูงสุดของฟังก์ชันเหล่านี้คือ 32767

| | | | | | |
|:--|:--|:--|:--|:--|:--|
| `ASC` | `CHAR` | `CLEAN` | `DATEVALUE` | `DBCS` | `DOLLAR` |
| `EXACT` | `FIND` | `FINDB` | `FIXED` | `ISBLANK` | `ISERR` |
| `ISERROR` | `ISLOGICAL` | `ISNA` | `ISNONTEXT` | `ISNUMBER` | `ISREF` |
| `ISTEXT` | `LEFT` | `LEFTB` | `LEN` | `LENB` | `LOWER` |
| `MID` | `MIDB` | `PROPER` | `REPLACE` | `REPLACEB` | `REPT` |
| `RIGHT` | `RIGHTB` | `SEARCH` | `SEARCHB` | `SUBSTITUTE` | `TEXT` |
| `TIMEVALUE` | `TRIM` | `UPPER` | `USDOLLAR` | `VALUE` |  |

(รวม 41 ฟังก์ชัน)

---

# ส่วน C: รูปร่าง

## 13. ทำงานกับรูปร่าง

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/events-worksheetfunctions-shapes/working-with-shapes-drawing-objects>

รูปร่าง (shapes) หรือออบเจ็กต์วาดภาพ แทนด้วยออบเจ็กต์สามชนิด:

| ออบเจ็กต์ | คำอธิบาย |
| :-- | :-- |
| คอลเลกชัน **Shapes** | ใช้สร้างรูปร่างและวนผ่านรูปร่างทั้งหมดบนเวิร์กชีตหนึ่ง ๆ |
| คอลเลกชัน **ShapeRange** | ใช้แก้ไขหลายรูปร่างพร้อมกัน เหมือนทำงานกับหลายรูปร่างใน UI |
| ออบเจ็กต์ **Shape** | ใช้จัดรูปแบบหรือแก้ไขรูปร่างเดียว |

### ตั้งค่า property ของรูปร่าง

property การจัดรูปแบบของรูปร่างหลายตัวไม่ได้ตั้งที่ **Shape** หรือ **ShapeRange** โดยตรง แต่แอตทริบิวต์ที่เกี่ยวข้องถูกจัดกลุ่มไว้ภายใต้ออบเจ็กต์รอง เช่น **FillFormat** (property ที่เกี่ยวกับการเติมสี) หรือ **LinkFormat** (property เฉพาะของออบเจ็กต์ OLE ที่ลิงก์)

การตั้ง property ของรูปร่าง ต้องคืนออบเจ็กต์ที่แทนกลุ่มแอตทริบิวต์ที่เกี่ยวข้องก่อน แล้วจึงตั้ง property ของออบเจ็กต์นั้น เช่น ใช้ property **Fill** คืน **FillFormat** แล้วตั้ง **ForeColor** เพื่อกำหนดสีเติมด้านหน้า

```vb
Worksheets(1).Shapes(1).Fill.ForeColor.RGB = RGB(255, 0, 0)
```

### ใช้ property หรือ method กับหลายรูปร่างพร้อมกัน

ใน UI บางการทำงานทำได้กับหลายรูปร่างที่เลือกพร้อมกัน (เช่น ตั้งสีเติมทีเดียว) บางอย่างทำได้เมื่อเลือกรูปร่างเดียวเท่านั้น (เช่น แก้ข้อความในรูปร่าง)

ใน VBA มีสองวิธีใช้ property และ method กับชุดของรูปร่าง ทำให้ทำสิ่งที่ทำกับรูปร่างเดียวได้กับช่วงของรูปร่าง ไม่ว่าจะทำใน UI ได้หรือไม่

- ถ้าการทำงานนั้นใช้กับหลายรูปร่างที่เลือกใน UI ได้ ให้สร้างคอลเลกชัน **ShapeRange** ที่มีรูปร่างที่ต้องการ แล้วใช้ property/method กับ **ShapeRange** โดยตรง
- ถ้าการทำงานนั้นใช้กับหลายรูปร่างที่เลือกใน UI ไม่ได้ ให้วนผ่านคอลเลกชัน **Shapes** หรือ **ShapeRange** แล้วใช้ property/method กับแต่ละออบเจ็กต์ **Shape**

property และ method หลายตัวของ **Shape** และ **ShapeRange** ล้มเหลวถ้าใช้กับรูปร่างบางชนิด เช่น **TextFrame** ล้มเหลวกับรูปร่างที่ใส่ข้อความไม่ได้ ถ้าไม่แน่ใจว่าทุกรูปร่างใน **ShapeRange** ใช้ property/method นั้นได้ อย่าใช้กับ **ShapeRange** ตรง ๆ ให้วนทีละรูปร่างและตรวจชนิดก่อนใช้

### สร้าง ShapeRange ที่มีรูปร่างทั้งหมดบนชีต

เลือกรูปร่างทั้งหมด แล้วใช้ property **ShapeRange** คืนออบเจ็กต์ที่มีรูปร่างที่เลือก

```vb
Worksheets(1).Shapes.Select
Set sr = Selection.ShapeRange
```

ใน Excel อาร์กิวเมนต์ ***Index*** ของ property **Range** ในคอลเลกชัน **Shapes** ไม่ใช่ตัวเลือก ดังนั้นสร้าง ShapeRange ของรูปร่างทั้งหมดโดยไม่ใส่อาร์กิวเมนต์ไม่ได้

### ใช้ property หรือ method กับ ShapeRange

ถ้าทำการทำงานกับหลายรูปร่างที่เลือกใน UI ได้ ทำเทียบเท่าได้ด้วยการสร้าง **ShapeRange** ตัวอย่างสร้าง shape range ของรูปร่างชื่อ "Big Star" และ "Little Star" บน `myDocument` แล้วใช้การไล่สีเติม

```vb
Set myDocument = Worksheets(1)
Set myRange = myDocument.Shapes.Range(Array("Big Star", _
 "Little Star"))
myRange.Fill.PresetGradient _
 msoGradientHorizontal, 1, msoGradientBrass
```

แนวทางทั่วไปเมื่อใช้ property และ method กับ **ShapeRange**:

- ใช้ method กับคอลเลกชัน เทียบเท่าใช้ method กับ **Shape** แต่ละตัวในคอลเลกชัน
- ตั้งค่า property ของคอลเลกชัน เทียบเท่าตั้ง property ของแต่ละรูปร่างในช่วง
- property ของคอลเลกชันที่คืนค่าคงที่ จะคืนค่า property ของรูปร่างตัวหนึ่งถ้าทุกรูปร่างมีค่าเดียวกัน ถ้าไม่เหมือนกันจะคืนค่าคงที่ "mixed"
- property ของคอลเลกชันที่คืนชนิดข้อมูลธรรมดา (เช่น **Long, Single, String**) คืนค่าของรูปร่างตัวหนึ่งถ้าทุกรูปร่างมีค่าเหมือนกัน
- property บางตัวอ่านหรือตั้งได้เมื่อมีรูปร่างในคอลเลกชันเพียงหนึ่งเดียว ถ้ามีมากกว่าหนึ่งเกิด run-time error มักเป็นกรณีที่การกระทำเทียบเท่าใน UI ทำได้เพียงรูปร่างเดียว (เช่น แก้ข้อความในรูปร่างหรือแก้จุดของ freeform)

แนวทางข้างต้นใช้กับการตั้ง property ของออบเจ็กต์รอง เช่น **FillFormat** ของ **ShapeRange** ด้วย ถ้าออบเจ็กต์รองแทนการทำงานที่ทำกับหลายออบเจ็กต์ที่เลือกใน UI ได้ ก็คืนออบเจ็กต์จาก ShapeRange และตั้ง property ได้ เช่น property **Fill** คืน **FillFormat** ที่แทนการเติมสีของทุกรูปร่างใน ShapeRange การตั้ง property ของ FillFormat นี้จะตั้งให้ทุกรูปร่างเหมือนกัน

### วนผ่านคอลเลกชัน Shapes หรือ ShapeRange

แม้ใน UI จะเลือกหลายรูปร่างพร้อมกันทำคำสั่งไม่ได้ ก็ทำเทียบเท่าด้วยโปรแกรมได้โดยวนผ่านคอลเลกชัน ตัวอย่างวนทุกรูปร่างบน `myDocument` และเปลี่ยนสีด้านหน้าของ AutoShape ทุกตัว

```vb
Set myDocument = Worksheets(1)
For Each sh In myDocument.Shapes
 If sh.Type = msoAutoShape Then
 sh.Fill.ForeColor.RGB = RGB(255, 0, 0)
 End If
Next
```

ตัวอย่างสร้าง **ShapeRange** ของรูปร่างที่เลือกอยู่ในหน้าต่างที่ active แล้วตั้งสีด้านหน้าของแต่ละรูปร่างที่เลือก

```vb
For Each sh in ActiveWindow.Selection.ShapeRange
 sh.Fill.ForeColor.RGB = RGB(255, 0, 0)
Next
```

### จัดแนว กระจาย และจัดกลุ่มรูปร่างใน ShapeRange

ใช้ method **Align** และ **Distribute** วางตำแหน่งชุดรูปร่างเทียบกันหรือเทียบกับเอกสาร ใช้ method **Group** หรือ **Regroup** รวมชุดรูปร่างเป็นรูปร่างกลุ่มเดียว

API: [ShapeRange.Align](https://learn.microsoft.com/en-us/office/vba/api/excel.shaperange.align) · [ShapeRange.Distribute](https://learn.microsoft.com/en-us/office/vba/api/excel.shaperange.distribute) · [ShapeRange.Group](https://learn.microsoft.com/en-us/office/vba/api/excel.shaperange.group) · [ShapeRange.Regroup](https://learn.microsoft.com/en-us/office/vba/api/excel.shaperange.regroup)

---

## 14. สรุปเทคนิค

ข้อ 1–5 มาจากต้นฉบับ ข้อ 6 เป็นข้อสังเกตของผู้แปล

1. ปิด `EnableEvents` ก่อนทำงานที่จะกระตุ้น event ซ้ำ (เช่น `Save`) แล้วเปิดคืนทุกครั้ง (หัวข้อ 1)
2. event ของ Application, แผนภูมิฝัง, QueryTable ต้องผ่านคลาสโมดูล + `WithEvents` + ขั้นตอน "เชื่อมต่อ" (หัวข้อ 4, 5, 7)
3. ตั้งชื่อตัวควบคุมก่อนเขียนโค้ด event เพราะโค้ดไม่ย้ายตามเมื่อเปลี่ยนชื่อ (หัวข้อ 8)
4. เรียกฟังก์ชันเวิร์กชีตผ่าน `Application.WorksheetFunction` และส่งช่วงเป็นออบเจ็กต์ `Range` (หัวข้อ 10)
5. กับหลายรูปร่าง: ใช้ `ShapeRange` ถ้า UI ทำพร้อมกันได้ มิฉะนั้นวนทีละ `Shape` และตรวจ `Type` (หัวข้อ 13)
6. `WorksheetFunction.X` จะ error ถ้าไม่พบค่า (เช่น `Match`) ต่างจาก `Application.X` ที่คืนค่า error ให้ตรวจด้วย `IsError` (ข้อสังเกตทั่วไปของ VBA ไม่ได้อยู่ในหน้าต้นฉบับ)

---

> ต้นฉบับ © Microsoft เผยแพร่บน Microsoft Learn (MicrosoftDocs/VBA-Docs) เอกสารนี้เป็นฉบับแปลเพื่อการศึกษา โปรดเทียบกับต้นฉบับเมื่อใช้งานจริง
