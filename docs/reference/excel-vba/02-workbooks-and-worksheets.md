# Excel VBA: เวิร์กบุ๊กและเวิร์กชีต (Workbooks and Worksheets)

> ฉบับแปลภาษาไทยจาก Microsoft Learn ส่วน Concepts → Workbooks and worksheets
> สารบัญต้นทาง: <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/workbooks-and-worksheets>
> ต้นฉบับ Markdown: <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts/Workbooks-and-Worksheets>
> สัญญาอนุญาต: ต้นฉบับ © Microsoft ใช้ [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (ตัวอย่างโค้ดใช้ MIT) · ไฟล์นี้เป็นงานแปล ไม่ใช่เอกสารทางการของ Microsoft
> หน้า Overview: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>
>
> ชื่อ object / property / method / ค่าคงที่ คงเป็นอังกฤษ แปลคำอธิบายและคอมเมนต์ในโค้ด ทุกหัวข้อมีบรรทัด **อ้างอิง**

ฐานลิงก์อ้างอิง: `https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/<ชื่อหน้า>`

## สารบัญ

1. [สร้างเวิร์กบุ๊ก](#1-สร้างเวิร์กบุ๊ก)
2. [เปิดเวิร์กบุ๊ก](#2-เปิดเวิร์กบุ๊ก)
3. [อ้างอิงชีตด้วยชื่อ](#3-อ้างอิงชีตด้วยชื่อ)
4. [อ้างอิงชีตด้วยหมายเลขดัชนี](#4-อ้างอิงชีตด้วยหมายเลขดัชนี)
5. [อ้างอิงมากกว่าหนึ่งชีต](#5-อ้างอิงมากกว่าหนึ่งชีต)
6. [คืนออบเจ็กต์จากคอลเลกชัน](#6-คืนออบเจ็กต์จากคอลเลกชัน)
7. [สร้างหรือแทนที่เวิร์กชีต](#7-สร้างหรือแทนที่เวิร์กชีต)
8. [ตั้งชื่อเวิร์กชีตจากค่าในเซลล์](#8-ตั้งชื่อเวิร์กชีตจากค่าในเซลล์)
9. [เรียงเวิร์กชีตตามชื่อ](#9-เรียงเวิร์กชีตตามชื่อ)
10. [เพิ่มสารบัญในเวิร์กบุ๊ก](#10-เพิ่มสารบัญในเวิร์กบุ๊ก)
11. [รหัสจัดรูปแบบและรหัส VBA สำหรับหัวกระดาษ/ท้ายกระดาษ](#11-รหัสจัดรูปแบบหัวท้ายกระดาษ)
12. [บันทึกเอกสารเป็นหน้าเว็บ](#12-บันทึกเอกสารเป็นหน้าเว็บ)
13. [สร้างป้ายชื่อที่อยู่จากสเปรดชีต](#13-สร้างป้ายชื่อที่อยู่จากสเปรดชีต)
14. [สร้างเวิร์กบุ๊กปฏิทินนัดหมาย](#14-สร้างเวิร์กบุ๊กปฏิทินนัดหมาย)
15. [สรุปเทคนิค](#15-สรุปเทคนิค)

---

## 1. สร้างเวิร์กบุ๊ก

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/create-a-workbook>

สร้างเวิร์กบุ๊กด้วย method **Workbooks.Add** Excel ตั้งชื่ออัตโนมัติเป็น Book*N* (N คือเลขถัดไปที่ว่าง) และเวิร์กบุ๊กใหม่จะเป็นเวิร์กบุ๊กที่ active

```vb
Sub AddOne()
 Workbooks.Add
End Sub
```

วิธีที่ดีกว่าคือกำหนดผลลัพธ์ให้ตัวแปรวัตถุ ตัวอย่างนี้เก็บ **Workbook** ที่ `Add` คืนมาไว้ใน `newBook` แล้วตั้ง property ต่าง ๆ ควบคุมเวิร์กบุ๊กใหม่ผ่านตัวแปรได้สะดวก

```vb
Sub AddNew()
Set NewBook = Workbooks.Add
 With NewBook
 .Title = "All Sales"
 .Subject = "Sales"
 .SaveAs Filename:="Allsales.xls"
 End With
End Sub
```

---

## 2. เปิดเวิร์กบุ๊ก

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/opening-a-workbook>

เมื่อเปิดเวิร์กบุ๊กด้วย method **Workbooks.Open** เวิร์กบุ๊กนั้นจะเป็นสมาชิกของคอลเลกชัน **Workbooks** ตัวอย่างเปิดไฟล์ MyBook.xls ในโฟลเดอร์ MyFolder ไดรฟ์ C

```vb
Sub OpenUp()
 Workbooks.Open("C:\MyFolder\MyBook.xls")
End Sub
```

---

## 3. อ้างอิงชีตด้วยชื่อ

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/refer-to-sheets-by-name>

ระบุชีตด้วยชื่อผ่าน property **Worksheets** และ **Charts** คำสั่งต่อไปนี้ activate ชีตต่าง ๆ ในเวิร์กบุ๊กที่ active

```vb
Worksheets("Sheet1").Activate
Charts("Chart1").Activate
```

```vb
DialogSheets("Dialog1").Activate
```

ใช้ property **Sheets** เพื่อคืนเวิร์กชีต แผนภูมิ โมดูล หรือ dialog sheet ก็ได้ เพราะคอลเลกชัน `Sheets` มีชีตทุกชนิด

```vb
Sub ActivateChart()
 Sheets("Chart1").Activate
End Sub
```

> **หมายเหตุ:** แผนภูมิที่ฝังในเวิร์กชีตเป็นสมาชิกของคอลเลกชัน **ChartObjects** ส่วนแผนภูมิที่อยู่บนชีตของตัวเองเป็นสมาชิกของคอลเลกชัน **Charts**

---

## 4. อ้างอิงชีตด้วยหมายเลขดัชนี

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/refer-to-sheets-by-index-number>

หมายเลขดัชนีคือเลขลำดับของชีต นับจากแท็บซ้ายสุด ในกลุ่มชีตประเภทเดียวกัน ตัวอย่างใช้ **Worksheets** activate เวิร์กชีตแรก

```vb
Sub FirstOne()
 Worksheets(1).Activate
End Sub
```

ถ้าต้องการทำงานกับชีตทุกชนิด (worksheet, chart, module, dialog sheet) ให้ใช้ **Sheets** ตัวอย่าง activate ชีตที่สี่

```vb
Sub FourthOne()
 Sheets(4).Activate
End Sub
```

> **หมายเหตุ:** ลำดับดัชนีเปลี่ยนได้เมื่อย้าย เพิ่ม หรือลบชีต

---

## 5. อ้างอิงมากกว่าหนึ่งชีต

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/refer-to-more-than-one-sheet>

ใช้ฟังก์ชัน **Array** ระบุกลุ่มของชีต ตัวอย่างเลือกสามชีตในเวิร์กบุ๊กที่ active

```vb
Sub Several()
 Worksheets(Array("Sheet1", "Sheet2", "Sheet4")).Select
End Sub
```

---

## 6. คืนออบเจ็กต์จากคอลเลกชัน

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/returning-an-object-from-a-collection-excel>

property **Item** ของคอลเลกชันคืนออบเจ็กต์หนึ่งตัวจากคอลเลกชันนั้น ตัวอย่างกำหนด `FirstBook` เป็น **Workbook** แรกในคอลเลกชัน **Workbooks**

```vb
Set FirstBook = Workbooks.Item(1)
```

`Item` เป็น property เริ่มต้นของคอลเลกชันส่วนใหญ่ จึงละคำว่า `Item` ได้

```vb
Set FirstBook = Workbooks(1)
```

### ออบเจ็กต์ที่มีชื่อ (Named Objects)

ปกติระบุ `Item` ด้วยเลขจำนวนเต็มได้ แต่การคืนด้วยชื่อสะดวกกว่า ก่อนใช้ชื่อกับ `Item` ต้องตั้งชื่อให้ออบเจ็กต์ก่อน ซึ่งมักทำโดยตั้ง property **Name** ตัวอย่างสร้างเวิร์กชีตที่มีชื่อแล้วอ้างอิงด้วยชื่อ

```vb
ActiveWorkbook.Worksheets.Add.Name = "A New Sheet"
With Worksheets("A New Sheet")
 .Range("A5:A10").Formula = "=RAND()"
End With
```

### ค่าดัชนีที่กำหนดไว้ล่วงหน้า (Predefined Index Values)

บางคอลเลกชันมีค่าดัชนีที่กำหนดไว้ล่วงหน้าในรูปค่าคงที่ เช่น ระบุค่าคงที่ **xlBordersIndex** กับ `Item` ของคอลเลกชัน **Borders** เพื่อคืนเส้นขอบเส้นเดียว ตัวอย่างตั้งเส้นขอบล่างของ A1:G1 บน Sheet1 เป็นเส้นคู่

```vb
Worksheets("Sheet1").Range("A1:A1"). _
 Borders.Item(xlEdgeBottom).LineStyle = xlDouble
```

---

## 7. สร้างหรือแทนที่เวิร์กชีต

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/create-or-replace-a-worksheet>
*โค้ดตัวอย่างโดย Tom Urtis, Atlas Programming Management*

### ตรวจว่ามีเวิร์กชีตอยู่หรือไม่

ใช้ property **Name** ของ **Worksheet** ตรวจว่ามีชีตชื่อ "Sheet4" อยู่หรือไม่ ชื่อชีตเก็บในตัวแปร `mySheetName`

```vb
Sub TestSheetYesNo()
    Dim mySheetName As String, mySheetNameTest As String
    mySheetName = "Sheet4"
    On Error Resume Next
    mySheetNameTest = Worksheets(mySheetName).Name
    If Err.Number = 0 Then
        MsgBox "ชีตชื่อ ''" & mySheetName & "'' มีอยู่ในเวิร์กบุ๊กนี้"
    Else
        Err.Clear
        MsgBox "ชีตชื่อ ''" & mySheetName & "'' ไม่มีอยู่ในเวิร์กบุ๊กนี้"
    End If
End Sub
```

### สร้างเวิร์กชีต

ถ้าไม่มีชีตชื่อนั้น ใช้ method **Worksheets.Add** สร้างขึ้นใหม่

```vb
Sub TestSheetCreate()
    Dim mySheetName As String, mySheetNameTest As String
    mySheetName = "Sheet4"
    On Error Resume Next
    mySheetNameTest = Worksheets(mySheetName).Name
    If Err.Number = 0 Then
        MsgBox "ชีตชื่อ ''" & mySheetName & "'' มีอยู่ในเวิร์กบุ๊กนี้"
    Else
        Err.Clear
        Worksheets.Add.Name = mySheetName
        MsgBox "ไม่มีชีตชื่อ ''" & mySheetName & "'' มาก่อน ขณะนี้สร้างให้แล้ว"
    End If
End Sub
```

### แทนที่เวิร์กชีต

ถ้ามีชีตอยู่แล้ว ใช้ method **Delete** ลบชีตเดิมแล้วสร้างชีตใหม่ชื่อเดียวกัน

> **สำคัญ:** ข้อมูลทั้งหมดบนชีต "Sheet4" เดิมจะถูกลบไปพร้อมกับชีต

```vb
Sub TestSheetReplace()
    Dim mySheetName As String
    mySheetName = "Sheet4"
    Application.DisplayAlerts = False
    On Error Resume Next
    Worksheets(mySheetName).Delete
    Err.Clear
    Application.DisplayAlerts = True
    Worksheets.Add.Name = mySheetName
    MsgBox "ชีตชื่อ ''" & mySheetName & "'' ถูกแทนที่แล้ว"
End Sub
```

**เทคนิค:** รูปแบบ "ลองอ้างอิงชีต แล้วดูค่า `Err.Number`" ใช้ตรวจการมีอยู่ของออบเจ็กต์ได้ ปิด `DisplayAlerts` ชั่วคราวเพื่อไม่ให้ Excel ถามยืนยันตอนลบ และเปิดกลับทุกครั้ง

---

## 8. ตั้งชื่อเวิร์กชีตจากค่าในเซลล์

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/name-a-worksheet-by-using-a-cell-value>
*โค้ดตัวอย่างโดย Tom Urtis*

ตัวอย่างตั้งชื่อชีตจากค่าในเซลล์ A1 ตรวจว่าค่านั้นเป็นชื่อชีตที่ใช้ได้ ถ้าใช้ได้จึงเปลี่ยนชื่อชีตที่ active (โค้ดวางในโมดูลของชีตนั้น)

```vb
Private Sub Worksheet_Change(ByVal Target As Range)
    'ระบุเซลล์เป้าหมายที่ค่าในเซลล์จะกลายเป็นชื่อแท็บ
    If Target.Address <> "$A$1" Then Exit Sub
        'ถ้าเซลล์ว่าง (ถูกล้าง) ไม่ต้องเปลี่ยนชื่อชีต
    If IsEmpty(Target) Then Exit Sub
    'ถ้าความยาวเกิน 31 ตัวอักษร ไม่อนุญาตให้ใช้
    If Len(Target.Value) > 31 Then
        MsgBox "ชื่อแท็บของเวิร์กชีตต้องยาวไม่เกิน 31 ตัวอักษร" & vbCrLf & _
        "คุณกรอก " & Target.Value & " ซึ่งมี " & Len(Target.Value) & " ตัวอักษร", , "ต้องไม่เกิน 31 ตัวอักษร"
        Application.EnableEvents = False
        Target.ClearContents
        Application.EnableEvents = True
        Exit Sub
    End If
    'ชื่อแท็บห้ามมีอักขระ /, \, [, ], *, ? หรือ :
    'ตรวจว่าไม่มีอักขระเหล่านี้อยู่ในค่าที่กรอก
    Dim IllegalCharacter(1 To 7) As String, i As Integer
    IllegalCharacter(1) = "/"
    IllegalCharacter(2) = "\"
    IllegalCharacter(3) = "["
    IllegalCharacter(4) = "]"
    IllegalCharacter(5) = "*"
    IllegalCharacter(6) = "?"
    IllegalCharacter(7) = ":"
    For i = 1 To 7
        If InStr(Target.Value, (IllegalCharacter(i))) > 0 Then
            MsgBox "คุณใช้อักขระที่ผิดกฎการตั้งชื่อชีต" & vbCrLf & vbCrLf & _
            "กรุณากรอกชื่อชีตใหม่โดยไม่มีอักขระ ''" & IllegalCharacter(i) & "''", 48, "ใช้เป็นชื่อชีตไม่ได้ !!"
            Application.EnableEvents = False
            Target.ClearContents
            Application.EnableEvents = True
            Exit Sub
        End If
    Next i
    'ตรวจว่าชื่อที่เสนอยังไม่มีในเวิร์กบุ๊ก
    Dim strSheetName As String, wks As Worksheet, bln As Boolean
    strSheetName = Trim(Target.Value)
    On Error Resume Next
    Set wks = ActiveWorkbook.Worksheets(strSheetName)
    On Error Resume Next
    If Not wks Is Nothing Then
        bln = True
    Else
        bln = False
        Err.Clear
    End If
    'ถ้ายังไม่มีชื่อนี้ ให้ตั้งชื่อชีตที่ active เป็นค่าของเซลล์เป้าหมาย
    'ถ้ามีแล้ว แจ้งผู้ใช้ว่าห้ามตั้งชื่อชีตซ้ำ
    If bln = False Then
        ActiveSheet.Name = strSheetName
    Else
        MsgBox "มีชีตชื่อ " & strSheetName & " อยู่แล้ว" & vbCrLf & _
        "กรุณากรอกชื่อที่ไม่ซ้ำกับชีตอื่น"
        Application.EnableEvents = False
        Target.ClearContents
        Application.EnableEvents = True
    End If
End Sub
```

**กฎชื่อชีต (จากโค้ดตัวอย่าง):** ยาวไม่เกิน 31 ตัวอักษร ห้ามมี `/ \ [ ] * ? :` และห้ามซ้ำกับชีตอื่นในเวิร์กบุ๊ก

---

## 9. เรียงเวิร์กชีตตามชื่อ

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/sort-worksheets-alphanumerically-by-name>
*โค้ดตัวอย่างโดย Tom Urtis*

ตัวอย่างเรียงเวิร์กชีตตามตัวอักษร/ตัวเลขของชื่อ โดยใช้ property **Name** ของ **Worksheet**

```vb
Sub SortSheetsTabName()
    Application.ScreenUpdating = False
    Dim iSheets%, i%, j%
    iSheets = Sheets.Count
    For i = 1 To iSheets - 1
        For j = i + 1 To iSheets
            If Sheets(j).Name < Sheets(i).Name Then
                Sheets(j).Move before:=Sheets(i)
            End If
        Next j
    Next i
    Application.ScreenUpdating = True
End Sub
```

**เทคนิค:** เป็นการเรียงแบบเปรียบเทียบทีละคู่ (คล้าย selection sort) เทียบสตริงด้วย `<` แล้วย้ายชีตด้วย `Move before:=`

---

## 10. เพิ่มสารบัญในเวิร์กบุ๊ก

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/add-a-table-of-contents-to-a-workbook>

มีสองแนวทาง

### แนวทาง A: ใช้ Pages.Count และไฮเปอร์ลิงก์ (Dennis Wallentin)

ใช้ property **Pages.Count** นับจำนวนหน้าพิมพ์ของแต่ละชีต และทำรายการในสารบัญให้ลิงก์ไปยังชีตนั้นเพื่อนำทางบนหน้าจอ

```vb
Option Explicit
Sub Create_TOC()
Dim wbBook As Workbook
Dim wsActive As Worksheet
Dim wsSheet As Worksheet
Dim lnRow As Long
Dim lnPages As Long
Dim lnCount As Long
Set wbBook = ActiveWorkbook
With Application
    .DisplayAlerts = False
    .ScreenUpdating = False
End With
'ถ้ามีชีต TOC อยู่แล้วให้ลบ แล้วเพิ่มเวิร์กชีตใหม่
On Error Resume Next
With wbBook
    .Worksheets("TOC").Delete
    .Worksheets.Add Before:=.Worksheets(1)
End With
On Error GoTo 0
Set wsActive = wbBook.ActiveSheet
With wsActive
    .Name = "TOC"
    With .Range("A1:B1")
        .Value = VBA.Array("Table of Contents", "Sheet # - # of Pages")
        .Font.Bold = True
    End With
End With
lnRow = 2
lnCount = 1
'วนผ่านเวิร์กชีตทั้งหมด สร้างชื่อชีต เพิ่มไฮเปอร์ลิงก์ นับจำนวนหน้าที่จะพิมพ์
'ของแต่ละชีต แล้วเขียนลงชีต TOC
For Each wsSheet In wbBook.Worksheets
    If wsSheet.Name <> wsActive.Name Then
        wsSheet.Activate
        With wsActive
            .Hyperlinks.Add .Cells(lnRow, 1), "", _
            SubAddress:="'" & wsSheet.Name & "'!A1", _
            TextToDisplay:=wsSheet.Name
            lnPages = wsSheet.PageSetup.Pages().Count
            .Cells(lnRow, 2).Value = "'" & lnCount & "-" & lnPages
        End With
        lnRow = lnRow + 1
        lnCount = lnCount + 1
    End If
Next wsSheet
wsActive.Activate
wsActive.Columns("A:B").EntireColumn.AutoFit
With Application
    .DisplayAlerts = True
    .ScreenUpdating = True
End With
End Sub
```

### แนวทาง B: ใช้ Print Preview คำนวณเลขหน้า (Bill Jelen, MrExcel.com)

ตรวจว่ามีชีต "TOC" หรือไม่ ถ้ามีจะอัปเดตสารบัญ ถ้าไม่มีจะสร้างไว้ต้นเวิร์กบุ๊ก แสดงชื่อชีตพร้อมเลขหน้าที่พิมพ์ ตัวอย่างเปิดกล่อง Print Preview เพื่อให้ Excel คำนวณตัวแบ่งหน้า ผู้ใช้ต้องปิดกล่องนั้นก่อน จึงจะสร้างสารบัญต่อ

```vb
Sub CreateTableOfContents()
    ' ตรวจว่ามีสารบัญอยู่แล้วหรือไม่
    ' สมมติว่ามี ถ้าไม่มีจะเกิด error
    ' ถ้า Err > 0 แปลว่าไม่มีชีตนั้น
    Dim WST As Worksheet
    On Error Resume Next
    Set WST = Worksheets("TOC")
    If Not Err = 0 Then
        ' ไม่มีสารบัญ ให้เพิ่มขึ้นใหม่
        Set WST = Worksheets.Add(Before:=Worksheets(1))
        WST.Name = "TOC"
    End If
    On Error GoTo 0
    ' ตั้งค่าหน้าสารบัญ
    WST.[A2] = "Table of Contents"
    With WST.[A6]
        .CurrentRegion.Clear
        .Value = "Subject"
    End With
    WST.[B6] = "Page(s)"
    WST.Range("A1:B1").ColumnWidth = Array(36, 12)
    TOCRow = 7
    PageCount = 0
    ' ทำ print preview ทุกชีตเพื่อให้ Excel คำนวณตัวแบ่งหน้า
    ' ผู้ใช้ต้องปิดหน้าต่าง PrintPreview เอง
    Msg = "Excel ต้องทำ print preview เพื่อคำนวณจำนวนหน้า "
    Msg = Msg & "กรุณาปิด print preview โดยคลิก close"
    MsgBox Msg
    ActiveWindow.SelectedSheets.PrintPreview
    ' วนผ่านแต่ละชีตเพื่อรวบรวมข้อมูลสารบัญ
    For Each S In Worksheets
        If S.Visible = -1 Then
            S.Select
            ThisName = ActiveSheet.Name
            HPages = ActiveSheet.HPageBreaks.Count + 1
            VPages = ActiveSheet.VPageBreaks.Count + 1
            ThisPages = HPages * VPages
            ' ใส่ข้อมูลของชีตนี้ลงใน TOC
            Sheets("TOC").Select
            Range("A" & TOCRow).Value = ThisName
            Range("B" & TOCRow).NumberFormat = "@"
            If ThisPages = 1 Then
                Range("B" & TOCRow).Value = PageCount + 1 & " "
            Else
                Range("B" & TOCRow).Value = PageCount + 1 & " - " & PageCount + ThisPages
            End If
        PageCount = PageCount + ThisPages
        TOCRow = TOCRow + 1
        End If
    Next S
End Sub
```

**เทคนิค:** จำนวนหน้าของชีต = (จำนวนตัวแบ่งหน้าแนวนอน + 1) × (จำนวนตัวแบ่งหน้าแนวตั้ง + 1) และ `Hyperlinks.Add ... SubAddress:="'ชื่อชีต'!A1"` ใช้สร้างลิงก์ภายในเวิร์กบุ๊ก

**ผู้เขียน:** Dennis Wallentin (บล็อก VSTO & .NET & Excel) และ Bill Jelen (MVP ผู้เขียนหนังสือ Excel กว่าสองโหล เจ้าของ MrExcel.com)

---

## 11. รหัสจัดรูปแบบหัวท้ายกระดาษ

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/formatting-and-vba-codes-for-headers-and-footers>

รหัสพิเศษต่อไปนี้ใส่ใน property หัวกระดาษ/ท้ายกระดาษได้: **LeftHeader, CenterHeader, RightHeader, LeftFooter, CenterFooter, RightFooter**

### รหัสจัดรูปแบบ (Format code)

| รหัส | คำอธิบาย |
| :-- | :-- |
| `&L` | จัดชิดซ้ายอักขระที่ตามมา |
| `&C` | จัดกึ่งกลางอักขระที่ตามมา |
| `&R` | จัดชิดขวาอักขระที่ตามมา |
| `&E` | เปิด/ปิดการพิมพ์ขีดเส้นใต้สองชั้น |
| `&X` | เปิด/ปิดตัวยก |
| `&Y` | เปิด/ปิดตัวห้อย |
| `&B` | เปิด/ปิดตัวหนา |
| `&I` | เปิด/ปิดตัวเอียง |
| `&U` | เปิด/ปิดขีดเส้นใต้ |
| `&S` | เปิด/ปิดขีดฆ่า |
| `&"fontname"` | พิมพ์อักขระที่ตามมาด้วยฟอนต์ที่ระบุ ต้องใส่เครื่องหมายคำพูดคู่ |
| `&nn` | พิมพ์ด้วยขนาดฟอนต์ที่ระบุ ใช้เลขสองหลักเป็นพอยต์ |
| `&color` | พิมพ์ด้วยสีที่ระบุ ผู้ใช้ให้ค่าสีเลขฐานสิบหก |
| `&"+"` | พิมพ์ด้วยฟอนต์ **Heading** ของธีมปัจจุบัน ต้องใส่เครื่องหมายคำพูดคู่ |
| `&"-"` | พิมพ์ด้วยฟอนต์ **Body** ของธีมปัจจุบัน ต้องใส่เครื่องหมายคำพูดคู่ |
| `&K xx.S nnn` | พิมพ์ด้วยสีจากธีมปัจจุบัน `xx` คือเลขสองหลัก 1–12 ระบุสีของธีม `S` คือเฉดสี (`+` สว่างขึ้น `-` เข้มขึ้น) `nnn` คือเลขเต็มสามหลักเป็นเปอร์เซ็นต์ 0–100 ถ้าค่าเกินขอบเขต Excel ใช้ค่าที่ใกล้ที่สุดที่ใช้ได้ |

### รหัส VBA

| รหัส | คำอธิบาย |
| :-- | :-- |
| `&D` | พิมพ์วันที่ปัจจุบัน |
| `&T` | พิมพ์เวลาปัจจุบัน |
| `&F` | พิมพ์ชื่อเอกสาร |
| `&A` | พิมพ์ชื่อแท็บของเวิร์กบุ๊ก |
| `&P` | พิมพ์เลขหน้า |
| `&P+number` | พิมพ์เลขหน้าบวกจำนวนที่ระบุ |
| `&P-number` | พิมพ์เลขหน้าลบจำนวนที่ระบุ |
| `&&` | พิมพ์เครื่องหมาย & หนึ่งตัว |
| `&N` | พิมพ์จำนวนหน้าทั้งหมดของเอกสาร |
| `&Z` | พิมพ์เส้นทางไฟล์ |
| `&G` | แทรกรูปภาพ |

### ตัวอย่าง

```vb
Sub Date_Time()
 ActiveSheet.PageSetup.CenterHeader = "&D &B&ITime:&I&B&T"
End Sub
```

---

## 12. บันทึกเอกสารเป็นหน้าเว็บ

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/saving-documents-as-web-pages>

ใน Excel บันทึกเวิร์กบุ๊ก เวิร์กชีต แผนภูมิ ช่วงข้อมูล query table รายงาน PivotTable พื้นที่พิมพ์ หรือช่วง AutoFilter เป็นหน้าเว็บได้ และแก้ไฟล์ HTML ใน Excel โดยตรงได้

### บันทึกเอกสารเป็นหน้าเว็บ

คือการสร้างและบันทึกไฟล์ HTML พร้อมไฟล์สนับสนุน ใช้ method **SaveAs** ตัวอย่างบันทึกเวิร์กบุ๊กที่ active เป็น C:\Reports\myfile.htm

```vb
ActiveWorkbook.SaveAs _
 Filename:="C:\Reports\myfile.htm", _
 FileFormat:=xlHTML
```

### ปรับแต่งหน้าเว็บ

ปรับรูปลักษณ์ เนื้อหา การรองรับเบราว์เซอร์ การรองรับการแก้ไข รูปแบบกราฟิก ความละเอียดหน้าจอ การจัดไฟล์ และการเข้ารหัสของเอกสาร HTML ได้โดยตั้ง property ของออบเจ็กต์ **DefaultWebOptions** (ระดับแอปพลิเคชัน) และ **WebOptions** (ระดับเวิร์กบุ๊ก ซึ่งชื่อ property ตรงกันและมีผลเหนือกว่า)

หลังตั้งค่าแล้ว ใช้ method **Publish** บันทึกเป็นหน้าเว็บ ตัวอย่างตั้งค่าระดับแอปพลิเคชัน แล้วตั้ง **AllowPNG** ของเวิร์กบุ๊กที่ active เพื่อเขียนทับค่าเริ่มต้น แล้วบันทึกช่วงเป็น "C:\Reports\1998_Q1.htm"

```vb
With Application.DefaultWebOptions
 .RelyonVML = True
 .AllowPNG = True
 .PixelsPerInch = 96
End With
With ActiveWorkbook
 .WebOptions.AllowPNG = False
 With .PublishObjects(1)
 .FileName = "C:\Reports\1998_Q1.htm"
 .Publish
 End With
End With
```

บันทึกตรงไปยังเว็บเซิร์ฟเวอร์ได้ ตัวอย่างบันทึกช่วงข้อมูลไปที่ URL `https://example.homepage.com/annualreport.htm`

```vb
With ActiveWorkbook
 With .WebOptions
 .RelyonVML = True
 .PixelsPerInch = 96
 End With
 With .PublishObjects(1)
 .FileName = _
 "https://example.homepage.com/annualreport.htm"
 .Publish
 End With
End With
```

### เปิดเอกสาร HTML ใน Excel

เปิดด้วย method **Open** ก่อนแก้ไข ตัวอย่างเปิดไฟล์ "C:\Reports\1997_Q4.htm"

```vb
Workbooks.Open Filename:="C:\Reports\1997_Q4.htm"
```

หลังเปิดไฟล์ ปรับแต่งเอกสารด้วย property ของ **DefaultWebOptions** และ **WebOptions** ได้เช่นเดียวกัน

---

## 13. สร้างป้ายชื่อที่อยู่จากสเปรดชีต

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/create-address-labels-from-a-spreadsheet>
*โค้ดตัวอย่างโดย Bill Jelen, MrExcel.com*

ตัวอย่างนำรายการที่อยู่ (หนึ่งที่อยู่ต่อหนึ่งแถว) ไปคัดลอกลงอีกชีตโดยจัดให้พอดีกับป้ายชื่อที่พิมพ์ได้ เวิร์กบุ๊กต้องมีสองชีตชื่อ "Addresses" และ "Labels" บนชีต Addresses: คอลัมน์ A = ชื่อ, B = ที่อยู่บรรทัด 1, C = ที่อยู่บรรทัด 2, D = เมือง/รัฐ/ประเทศ/รหัสไปรษณีย์ ข้อมูลถูกจัดใหม่แล้วคัดลอกลงชีต Labels

```vb
Sub CreateLabels()
    ' ล้างข้อมูลทั้งหมดบน Labels
    Dim LabelSheet As Worksheet
    Set LabelSheet = Worksheets("Labels")
    LabelSheet.Cells.ClearContents
    ' ตั้งความกว้างคอลัมน์สำหรับป้าย
    LabelSheet.Cells(1, 1).ColumnWidth = 35
    LabelSheet.Cells(1, 2).ColumnWidth = 36
    LabelSheet.Cells(1, 3).ColumnWidth = 30
    ' วนผ่านทุกระเบียน
    Dim AddressSheet As Worksheet
    Set AddressSheet = Worksheets("Addresses")
    FinalRow = AddressSheet.Cells(65536, 1).End(xlUp).Row
    If FinalRow > 1 Then
        NextRow = 1
        NextCol = 1
        For i = 2 To FinalRow
            ' ตั้งความสูงแถว
            If NextCol = 1 Then
                LabelSheet.Cells(NextRow, 1).Resize(4, 1).RowHeight = 15.25
                LabelSheet.Cells(NextRow + 4, 1).RowHeight = 13.25
            End If
            ' ใส่ชื่อในแถวที่ 1
            ThisRow = NextRow
            LabelSheet.Cells(ThisRow, NextCol).Value = AddressSheet.Cells(i, 1) & "   " & AddressSheet.Cells(i, 7)
            ' ใส่ที่อยู่บรรทัด 1 ในแถวที่ 2
            If AddressSheet.Cells(i, 2).Value > "" Then
                ThisRow = ThisRow + 1
                LabelSheet.Cells(ThisRow, NextCol).Value = AddressSheet.Cells(i, 2)
            End If
            ' ใส่ที่อยู่บรรทัด 2 ในแถวที่ 3
            If AddressSheet.Cells(i, 3).Value > "" Then
                ThisRow = ThisRow + 1
                LabelSheet.Cells(ThisRow, NextCol).Value = AddressSheet.Cells(i, 3)
            End If
            ' ใส่เมือง รัฐ ประเทศ และรหัสไปรษณีย์ในแถวที่ 4
            If AddressSheet.Cells(i, 4).Value > "" Then
                CitySt = AddressSheet.Cells(i, 4)
            End If
            ThisRow = ThisRow + 1
            LabelSheet.Cells(ThisRow, NextCol).Value = CitySt
            ' อัปเดตแถวและคอลัมน์สำหรับป้ายถัดไป
            If NextCol = 1 Then
                NextCol = 2
            ElseIf NextCol = 2 Then
                NextCol = 3
            Else
                NextCol = 1
                NextRow = NextRow + 5
            End If
        Next i
        LabelSheet.Activate
    Else
        MsgBox "ไม่มีระเบียนที่ตรงกับเงื่อนไข"
    End If
End Sub
```

**หมายเหตุผู้แปล:** โค้ดต้นฉบับอ้างคอลัมน์ 7 (`Cells(i, 7)`) ต่อท้ายชื่อ ทั้งที่คำอธิบายพูดถึงเพียงคอลัมน์ A–D ซึ่งเป็นรายละเอียดตามต้นฉบับ ควรปรับให้ตรงกับข้อมูลของคุณ และ `Cells(65536, 1)` ถูกเขียนสำหรับ Excel รุ่นเก่า (65,536 แถว) ใน Excel ปัจจุบันควรใช้ `Rows.Count`

---

## 14. สร้างเวิร์กบุ๊กปฏิทินนัดหมาย

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/workbooks-and-worksheets/create-a-scheduling-calendar-workbook>
*โค้ดตัวอย่างโดย Holy Macro! Books, "Holy Macro! It's 2,500 Excel VBA Examples"*

ตัวอย่างใช้ข้อมูลจากเวิร์กบุ๊กหนึ่งสร้างเวิร์กบุ๊กปฏิทินนัดหมาย แยกหนึ่งเดือนต่อหนึ่งเวิร์กชีต เลือกใส่วันหยุดสุดสัปดาห์และวันหยุดนักขัตฤกษ์ได้

**สิ่งที่ต้องมีก่อนรัน:**

- ชีตชื่อ "Cover" ที่มี: spin control รายการปี ชื่อ `SpinButton1`, option button "มีวันหยุดสุดสัปดาห์" ชื่อ `OptionButton1`, "ไม่มีวันหยุดสุดสัปดาห์" ชื่อ `OptionButton2`, "มีวันหยุดนักขัตฤกษ์" ชื่อ `OptionButton3`, "ไม่มีวันหยุดนักขัตฤกษ์" ชื่อ `OptionButton4`
- ชีตชื่อ "Employee" ที่แสดงรายชื่อพนักงานในคอลัมน์ A เริ่มที่เซลล์ A3
- ชีตชื่อ "Holidays" ที่แสดงวันที่ในคอลัมน์ A เริ่มที่ A2 และชื่อวันหยุดในคอลัมน์ B เริ่มที่ B2

```vb
Sub CreateCalendar()
   'กำหนดตัวแปร
   Dim wks As Worksheet
   Dim var As Variant
   Dim datDay As Date
   Dim iMonth As Integer, iCol As Integer, iCounter As Integer, iYear As Integer
   Dim sMonth As String
   Dim bln As Boolean
   'ในแอปพลิเคชันปัจจุบัน ปิดการอัปเดตหน้าจอ บันทึกสถานะเดิมของแถบสถานะ
   'แล้วเปิดแถบสถานะ
   With Application
      .ScreenUpdating = False
      bln = .DisplayStatusBar
      .DisplayStatusBar = True
   End With
   'กำหนด iYear จากค่าใน spin button แรกบนเวิร์กชีต
   iYear = Cover.SpinButton1.Value
   'สร้างเวิร์กบุ๊กใหม่สำหรับเก็บปฏิทิน
   Workbooks.Add
   'ในเวิร์กบุ๊กใหม่ ล้างเวิร์กชีตทั้งหมดเหลือไว้หนึ่งชีต
   Application.DisplayAlerts = False
   For iCounter = 1 To Worksheets.Count - 1
      Worksheets(2).Delete
   Next iCounter
   Application.DisplayAlerts = True
   Set wks = ThisWorkbook.Worksheets("Employee")
   'สำหรับแต่ละเดือนของปี
   For iMonth = 1 To 12
      'สร้างเวิร์กชีตใหม่และตั้งชื่อแท็บเป็นชื่อเดือน
      sMonth = Format(DateSerial(1, iMonth, 1), "mmmm")
      Application.StatusBar = "Place month " & sMonth & " on..."
      Worksheets.Add after:=Worksheets(Worksheets.Count)
      ActiveSheet.Name = sMonth
      'คัดลอกชื่อพนักงานไปคอลัมน์แรก และเพิ่มวันที่ในคอลัมน์ที่เหลือ
      wks.Range(wks.Cells(3, 1), wks.Cells( _
         WorksheetFunction.CountA(wks.Columns(1)) + 1, 1)).Copy Range("A2")
      Range("A1").Value = "'" & ActiveSheet.Name & " " & iYear
      'เรียก private sub ตามตัวเลือกที่เลือกสำหรับปฏิทิน
      'มีวันหยุดสุดสัปดาห์และวันหยุดนักขัตฤกษ์
      If Cover.OptionButton1.Value And Cover.OptionButton3.Value Then
         Call WithHW(iMonth)
      'มีวันหยุดสุดสัปดาห์ แต่ไม่มีวันหยุดนักขัตฤกษ์
      ElseIf Cover.OptionButton1.Value And Cover.OptionButton3.Value = False Then
         Call WithWsansH(iMonth)
      'มีวันหยุดนักขัตฤกษ์ แต่ไม่มีวันหยุดสุดสัปดาห์
      ElseIf Cover.OptionButton1.Value = False And Cover.OptionButton3.Value Then
         Call WithHsansW(iMonth)
      'ไม่มีทั้งสองอย่าง
      Else
         Call SansWH(iMonth)
      End If
      'จัดรูปแบบ
      Rows(2).Value = Rows(1).Value
      Rows(2).NumberFormat = "ddd"
      Range("A2").Value = "Weekdays"
      Rows("1:2").Font.Bold = True
      Columns.AutoFit
   Next iMonth
   'ลบเวิร์กชีตแรกเพราะไม่มีข้อมูล
   Application.DisplayAlerts = False
   Worksheets(1).Delete
   Application.DisplayAlerts = True
   'ตั้งชื่อหน้าต่าง
   Worksheets(1).Select
   ActiveWindow.Caption = "Yearly calendar " & iYear
   'ทำความสะอาดขั้นสุดท้าย แล้วจบ sub
   With Application
      .ScreenUpdating = True
      .DisplayStatusBar = bln
      .StatusBar = False
   End With
End Sub
'ชื่อ: WithWH (มีวันหยุดสุดสัปดาห์และวันหยุดนักขัตฤกษ์)
'คำอธิบาย: สร้างปฏิทินของเดือนที่ระบุ รวมทั้งวันหยุดสุดสัปดาห์และวันหยุดนักขัตฤกษ์
Private Sub WithHW(ByVal iMonth As Integer)
   Dim cmt As Comment
   Dim rng As Range
   Dim var As Variant
   Dim datDay As Date
   Dim iYear As Integer, iCol As Integer
   iCol = 1
   iYear = Cover.SpinButton1.Value
   'วนทุกวันของเดือนและใส่วันที่ในแถวแรกของปฏิทิน
   For datDay = DateSerial(iYear, iMonth, 1) To DateSerial(iYear, iMonth + 1, 0)
      iCol = iCol + 1
      Set rng = Range(Cells(1, iCol), Cells(WorksheetFunction.CountA(Columns(1)), iCol))
      'ตรวจว่าวันนั้นเป็นวันหยุดหรือไม่
      var = Application.Match(CDbl(datDay), ThisWorkbook.Worksheets("Holidays").Columns(1), 0)
      Cells(1, iCol).Value = datDay
      'ใส่การจัดรูปแบบที่แสดงวันหยุดหรือสุดสัปดาห์
      With rng.Interior
         Select Case Weekday(datDay)
            Case 1
               .ColorIndex = 35
            Case 7
               .ColorIndex = 36
         End Select
         If Not IsError(var) Then
            .ColorIndex = 34
            Set cmt = Cells(1, iCol).AddComment( _
               ThisWorkbook.Worksheets("Holidays").Cells(var, 2).Value)
            cmt.Shape.TextFrame.AutoSize = True
         End If
      End With
   Next datDay
End Sub
'ชื่อ: WithHsansW (มีวันหยุดนักขัตฤกษ์ ไม่มีวันหยุดสุดสัปดาห์)
Private Sub WithHsansW(ByVal iMonth As Integer)
   Dim datDay As Date
   Dim iYear As Integer, iCol As Integer
   iCol = 1
   iYear = Cover.SpinButton1.Value
   'ทุกวันในเดือน ตรวจว่าเป็นวันหยุดสุดสัปดาห์หรือไม่
   For datDay = DateSerial(iYear, iMonth, 1) To DateSerial(iYear, iMonth + 1, 0)
      'ถ้าไม่ใช่วันหยุดสุดสัปดาห์ ใส่ลงปฏิทิน
      If WorksheetFunction.Weekday(datDay, 2) < 6 Then
         iCol = iCol + 1
         Cells(1, iCol).Value = datDay
      End If
   Next datDay
End Sub
'ชื่อ: WithWsansH (มีวันหยุดสุดสัปดาห์ ไม่มีวันหยุดนักขัตฤกษ์)
Private Sub WithWsansH(ByVal iMonth As Integer)
   Dim var As Variant
   Dim datDay As Date
   Dim iYear As Integer, iCol As Integer
   iCol = 1
   iYear = Cover.SpinButton1.Value
   'ทุกวันในเดือน ตรวจว่าเป็นวันหยุดนักขัตฤกษ์หรือไม่
   For datDay = DateSerial(iYear, iMonth, 1) To DateSerial(iYear, iMonth + 1, 0)
      var = Application.Match(CDbl(datDay), ThisWorkbook.Worksheets("Holidays").Columns(1), 0)
      'ถ้าไม่ใช่วันหยุด ใส่ลงปฏิทิน
      If IsError(var) Then
         iCol = iCol + 1
         Cells(1, iCol).Value = datDay
      End If
   Next datDay
End Sub
'ชื่อ: SansWH (ไม่มีวันหยุดสุดสัปดาห์และวันหยุดนักขัตฤกษ์)
Private Sub SansWH(ByVal iMonth As Integer)
   Dim var As Variant
   Dim datDay As Date
   Dim iYear As Integer, iCol As Integer
   iCol = 1
   iYear = Cover.SpinButton1.Value
   'ทุกวันในเดือน ตรวจว่าเป็นวันหยุดสุดสัปดาห์หรือวันหยุดนักขัตฤกษ์หรือไม่
   For datDay = DateSerial(iYear, iMonth, 1) To DateSerial(iYear, iMonth + 1, 0)
      If WorksheetFunction.Weekday(datDay, 2) < 6 Then
         var = Application.Match(CDbl(datDay), ThisWorkbook.Worksheets("Holidays").Columns(1), 0)
         'ถ้าไม่ใช่ทั้งวันหยุดสุดสัปดาห์และวันหยุด ใส่ลงปฏิทิน
         If IsError(var) Then
            iCol = iCol + 1
            Cells(1, iCol).Value = datDay
         End If
      End If
   Next datDay
End Sub
```

**กระบวนการ:** อ่านปีจาก spin button → สร้างเวิร์กบุ๊กใหม่เหลือชีตเดียว → วนสิบสองเดือน สร้างชีตต่อเดือน คัดลอกรายชื่อพนักงาน → เรียก sub ย่อยหนึ่งใน 4 ตัวตามตัวเลือก (วันที่เป็นหัวคอลัมน์ ใช้ `DateSerial(iYear, iMonth + 1, 0)` เป็นวันสุดท้ายของเดือน, `Weekday(d, 2) < 6` กรองวันจันทร์–ศุกร์, `Application.Match` เทียบกับรายการวันหยุด) → จัดรูปแบบ แล้วลบชีตว่างแรก

---

## 15. สรุปเทคนิค

ข้อ 1–4 มาจากตัวอย่างในต้นฉบับ ข้อ 5 เป็นข้อสังเกตของผู้แปล

1. เก็บเวิร์กบุ๊กที่ `Add` ไว้ในตัวแปรวัตถุเพื่อควบคุมได้ตรง ๆ (หัวข้อ 1)
2. อ้างอิงชีตด้วย **ชื่อ** ทนทานกว่าด้วยดัชนี เพราะดัชนีเปลี่ยนเมื่อย้าย/เพิ่ม/ลบชีต (หัวข้อ 3–4)
3. ตรวจการมีอยู่ของชีตด้วย `On Error Resume Next` + `Err.Number` และปิด `DisplayAlerts` เมื่อลบชีต (หัวข้อ 7)
4. เมื่อโค้ดใน event เปลี่ยนค่าเซลล์เอง ให้ปิด `EnableEvents` ก่อนและเปิดคืนหลัง (หัวข้อ 8)
5. ปิด `ScreenUpdating` ในงานที่สร้าง/ย้ายชีตจำนวนมากและคืนค่าเมื่อจบ (หัวข้อ 9, 10, 14)

---

> ต้นฉบับ © Microsoft เผยแพร่บน Microsoft Learn (MicrosoftDocs/VBA-Docs) เอกสารนี้เป็นฉบับแปลเพื่อการศึกษา โปรดเทียบกับต้นฉบับเมื่อใช้งานจริง
