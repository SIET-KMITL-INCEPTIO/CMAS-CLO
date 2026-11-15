# Excel VBA: Sparklines และการทำงานร่วมกับแอปพลิเคชันอื่น (Sparklines and Working with Other Applications)

> ฉบับแปลภาษาไทยจาก Microsoft Learn ส่วน Concepts → Sparklines และ Working with other applications
> สารบัญต้นทาง: <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/sparklines> และ <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/working-with-other-applications>
> ต้นฉบับ Markdown: <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts/Sparklines> และ <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts/Working-with-Other-Applications>
> สัญญาอนุญาต: ต้นฉบับ © Microsoft ใช้ [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (ตัวอย่างโค้ดใช้ MIT) · ไฟล์นี้เป็นงานแปล ไม่ใช่เอกสารทางการของ Microsoft
> หน้า Overview: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>
>
> คงชื่อ object / property / method เป็นอังกฤษ ทุกหัวข้อมีบรรทัด **อ้างอิง**

## สารบัญ

**ส่วน A: Sparklines**
1. [สร้างภาพเคลื่อนไหวให้ Sparkline](#1-สร้างภาพเคลื่อนไหวให้-sparkline)
2. [เปลี่ยนสีของแกนนอนของ Sparkline](#2-เปลี่ยนสีของแกนนอนของ-sparkline)
3. [ค้นหา Sparkline ทั้งหมดบนชีต](#3-ค้นหา-sparkline-ทั้งหมดบนชีต)

**ส่วน B: ทำงานร่วมกับแอปอื่น**

4. [ควบคุมแอป Office หนึ่งจากอีกแอปหนึ่ง](#4-ควบคุมแอป-office-หนึ่งจากอีกแอปหนึ่ง)
5. [ส่งออกแผนภูมิไปยังเอกสาร Word](#5-ส่งออกแผนภูมิไปยังเอกสาร-word)
6. [ส่งออกช่วงข้อมูลไปยังตารางในเอกสาร Word](#6-ส่งออกช่วงข้อมูลไปยังตารางในเอกสาร-word)
7. [ส่งออก Table ไปยังเอกสาร Word](#7-ส่งออก-table-ไปยังเอกสาร-word)
8. [นำเข้ารายชื่อติดต่อจาก Outlook ลงเวิร์กชีต](#8-นำเข้ารายชื่อติดต่อจาก-outlook-ลงเวิร์กชีต)
9. [ส่งอีเมลถึงรายชื่อผู้รับด้วย Excel และ Outlook](#9-ส่งอีเมลถึงรายชื่อผู้รับด้วย-excel-และ-outlook)
10. [สรุปเทคนิค](#10-สรุปเทคนิค)

---

# ส่วน A: Sparklines

## 1. สร้างภาพเคลื่อนไหวให้ Sparkline

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/sparklines/animate-a-sparkline>

สร้างภาพเคลื่อนไหวให้ sparkline ได้โดยใช้ method **ModifySourceData** ของออบเจ็กต์ **SparklineGroup** วนผ่านช่วงข้อมูล ตัวอย่างนี้ใช้ข้อมูล 36 เดือน แล้วทำภาพเคลื่อนไหวโดยแสดงข้อมูลปีแรก จากนั้นวนผ่านแต่ละเดือนถัดไปจนถึงเดือนสุดท้าย ใช้ตัวนับเพื่อหน่วงภาพเคลื่อนไหวให้ดูง่ายขึ้น ตัวอย่างต้องมีกลุ่ม sparkline ที่มีสาม sparkline ในช่วง A2:A4 ซึ่งแทนข้อมูลในช่วง B2:AK4

```vb
Sub SparkAnimation()
    ' กลุ่ม sparkline ที่จะทำภาพเคลื่อนไหว
    Dim oSparkGroup As SparklineGroup
    ' ตัวแปรสำหรับลูป
    Dim i As Integer, j As Integer
    ' ตั้งค่าตัวแปรกลุ่ม sparkline
    Set oSparkGroup = Sheet1.Range("A2").SparklineGroups(1)
    ' ตั้งแหล่งข้อมูลเป็นข้อมูลปีแรก
    oSparkGroup.ModifySourceData "B2:M4"
    ' วนผ่านจุดข้อมูลของสองปีถัดไป
    For i = 1 To 24
        ' เลื่อนการอ้างอิงของกลุ่ม sparkline ไปหนึ่งเซลล์
        oSparkGroup.ModifySourceData Range(oSparkGroup.SourceData).Offset(, 1).Address
        ' หน่วงภาพเคลื่อนไหว
        j = 1
        Do
            j = j + 1: DoEvents
        Loop Until j = 4000
    Next i
End Sub
```

**เทคนิค:** ใช้ `Range(SourceData).Offset(, 1)` เลื่อนหน้าต่างข้อมูลทีละคอลัมน์ และ `DoEvents` ให้ Excel วาดหน้าจอระหว่างลูปหน่วง

ดูเพิ่มเติม: [SparklineGroup Object](https://learn.microsoft.com/en-us/office/vba/api/excel.sparklinegroup), [Programming With Sparklines In Excel](https://learn.microsoft.com/en-us/office/vba/api/overview/excel)

---

## 2. เปลี่ยนสีของแกนนอนของ Sparkline

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/sparklines/change-the-color-of-the-horizontal-axis-of-a-sparkline>

เปลี่ยนสีของแกนนอนได้โดยใช้ property **Color** ของออบเจ็กต์ **SparkColor** ตัวอย่างวนผ่านกลุ่ม sparkline สามกลุ่ม และตั้งสีของแกนนอนให้เท่ากับสีเติมของเซลล์ A8 ต้องมีกลุ่ม sparkline สามกลุ่มเริ่มที่เซลล์ A2, B2 และ C2 เซลล์ A8 ต้องถูกเติมด้วยสีที่ต้องการใช้เป็นสีแกนนอน ตัวอย่างใช้ property **Color** ของออบเจ็กต์ **Interior** เพื่ออ่านสีของเซลล์ A8

```vb
Sub AxisColor()
    ' กลุ่ม sparkline
    Dim oSparkGroup As SparklineGroup
    ' วนผ่านกลุ่ม sparkline บนชีต
    For Each oSparkGroup In Range("A2:C2").SparklineGroups
        ' แสดงแกน
        oSparkGroup.Axes.Horizontal.Axis.Visible = True
        ' ตั้งสีของแกนเป็นสีของเซลล์ A8
        oSparkGroup.Axes.Horizontal.Axis.Color.Color = Range("A8").Interior.Color
    Next oSparkGroup
End Sub
```

ดูเพิ่มเติม: [SparklineGroup Object](https://learn.microsoft.com/en-us/office/vba/api/excel.sparklinegroup), [SparkColor.Color](https://learn.microsoft.com/en-us/office/vba/api/excel.sparkcolor.color)

---

## 3. ค้นหา Sparkline ทั้งหมดบนชีต

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/sparklines/find-all-the-sparklines-on-a-sheet>

ตัวอย่างใช้ list box บน user form แสดงกลุ่ม sparkline ทั้งหมดบนชีตที่ active เมื่อคลิกกลุ่ม sparkline หนึ่งใน list box กลุ่มนั้นจะถูกเลือกบนชีต

ต้องมี user form ชื่อ **SparklineForm**, list box บนฟอร์มชื่อ **SparklineListBox** และปุ่มบนฟอร์มชื่อ **CloseBtn**

ใน Visual Basic Editor แทรก **Module** แล้วคัดลอกโค้ดต่อไปนี้ ซึ่งแสดง user form

```vb
Sub ShowUserForm()
    SparklineForm.Show
End Sub
```

ใน Visual Basic Editor คลิกขวาที่ฟอร์ม **SparklineForm** เลือก **View Code** แล้ววางโค้ดต่อไปนี้

- โพรซีเดอร์ **UserForm_Activate** วนผ่านกลุ่ม sparkline ทั้งหมดบนชีตที่ active และอ่านแอดเดรสของกลุ่มด้วย property **Address** ของ **Range** แล้วเพิ่มแอดเดรสลงใน list box
- โพรซีเดอร์ **SparklineListBox_Click** ถูกเรียกเมื่อคลิกแอดเดรสของกลุ่ม sparkline ใน list box ทำให้กลุ่มที่เลือก active บนชีตด้วย method **Activate** ของ **Range**
- โพรซีเดอร์ **CloseBtn_Click** ถูกเรียกเมื่อคลิกปุ่มบนฟอร์ม และปิดฟอร์ม

```vb
Private Sub UserForm_Activate()
    ' กลุ่ม sparkline
    Dim oSparkGroup As SparklineGroup
    ' วนผ่านกลุ่ม sparkline ทั้งหมดบนชีต
    For Each oSparkGroup In ActiveSheet.Range("A:XFD").SparklineGroups
        ' สำหรับแต่ละกลุ่มที่พบ เพิ่มแอดเดรสลงใน listbox
        SparklineListBox.AddItem oSparkGroup.Location.Address(, , , True)
    Next oSparkGroup
End Sub
Private Sub SparklineListBox_Click()
    ' activate ช่วงที่เลือกซึ่งมี sparkline
    Range(SparklineListBox.Value).Activate
End Sub
Private Sub CloseBtn_Click()
    ' ปิด userform
    Unload Me
End Sub
```

ดูเพิ่มเติม: [SparklineGroup Object](https://learn.microsoft.com/en-us/office/vba/api/excel.sparklinegroup), [Range.Address](https://learn.microsoft.com/en-us/office/vba/api/excel.range.address), [Range.Activate](https://learn.microsoft.com/en-us/office/vba/api/excel.range.activate)

---

# ส่วน B: ทำงานร่วมกับแอปพลิเคชันอื่น

ฐานลิงก์อ้างอิง: `https://learn.microsoft.com/en-us/office/vba/excel/concepts/working-with-other-applications/<ชื่อหน้า>`

## 4. ควบคุมแอป Office หนึ่งจากอีกแอปหนึ่ง

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/working-with-other-applications/controlling-one-microsoft-office-application-from-another>

ถ้าต้องการรันโค้ดในแอป Microsoft Office หนึ่งที่ทำงานกับออบเจ็กต์ในอีกแอป ให้ทำตามขั้นตอนนี้

**ขั้นตอนการรันโค้ด**

1. **ตั้งการอ้างอิง (reference)** ไปยัง type library ของแอปอื่นในกล่องโต้ตอบ **References** (เมนู **Tools**) แล้วออบเจ็กต์ property และ method จะปรากฏใน Object Browser และตรวจไวยากรณ์ตอนคอมไพล์ รวมทั้งมี Help ตามบริบทด้วย
2. **ประกาศตัวแปรออบเจ็กต์** ที่จะอ้างถึงออบเจ็กต์ในแอปอื่นเป็นชนิดเฉพาะ ระบุชนิดด้วยชื่อแอปที่ให้ออบเจ็กต์นั้น เช่น คำสั่งต่อไปประกาศตัวแปรชี้ไปที่เอกสาร Word และอีกตัวชี้ไปที่เวิร์กบุ๊ก Excel

   ```vb
     Dim appWD As Word.Application, wbXL As Excel.Workbook
   ```

   > **หมายเหตุ:** ต้องทำตามขั้นตอนข้างต้นถ้าต้องการให้โค้ดเป็น **early bound**

3. **ใช้ฟังก์ชัน CreateObject** กับ OLE Programmatic Identifier ของออบเจ็กต์ที่ต้องการในแอปอื่น ดังตัวอย่าง หากต้องการเห็นเซสชันของแอปอื่น ให้ตั้ง property **Visible** เป็น **True**

   ```vb
     Dim appWD As Word.Application
   Set appWD = CreateObject("Word.Application")
   appWd.Visible = True
   ```

4. **ใช้ property และ method** กับออบเจ็กต์ในตัวแปร เช่น คำสั่งต่อไปสร้างเอกสาร Word ใหม่

   ```vb
   Dim appWD As Word.Application
   Set appWD = CreateObject("Word.Application")
   appWD.Documents.Add
   ```

5. **เมื่อทำงานกับแอปอื่นเสร็จ** ใช้ method **Quit** ปิด แล้วตั้งตัวแปรออบเจ็กต์เป็น **Nothing** เพื่อคืนหน่วยความจำที่ใช้อยู่

   ```vb
   appWd.Quit
   Set appWd = Nothing
   ```

อ้างอิง OLE Programmatic Identifiers: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>

### ตัวอย่าง: สร้างไฟล์ Word หนึ่งไฟล์ต่อหนึ่งแถว

*โค้ดตัวอย่างโดย Bill Jelen, MrExcel.com*

ตัวอย่างสร้างไฟล์ Microsoft Office Word ใหม่สำหรับแต่ละแถวข้อมูลในสเปรดชีต

```vb
' ต้องเลือก Microsoft Word Object Library จาก Tools>References
' ใน VB editor เพื่อรันคำสั่งของ Word
Sub ControlWord()
    Dim appWD As Word.Application
    ' สร้างอินสแตนซ์ใหม่ของ Word และทำให้มองเห็นได้
    Set appWD = CreateObject("Word.Application.12")
    appWD.Visible = True
    ' หาแถวสุดท้ายที่มีข้อมูลในสเปรดชีต
    FinalRow = Range("A9999").End(xlUp).Row
    For i = 1 To FinalRow
        ' คัดลอกแถวปัจจุบัน
        Worksheets("Sheet1").Rows(i).Copy
        ' สั่ง Word สร้างเอกสารใหม่
        appWD.Documents.Add
        ' สั่ง Word วางเนื้อหาในคลิปบอร์ดลงในเอกสารใหม่
        appWD.Selection.Paste
        ' บันทึกเอกสารใหม่ด้วยชื่อไฟล์ลำดับเลข
        appWD.ActiveDocument.SaveAs Filename:="File" & i
        ' ปิดเอกสาร Word ใหม่
        appWD.ActiveDocument.Close
    Next i
    ' ปิดแอปพลิเคชัน Word
    appWD.Quit
End Sub
```

### ตัวอย่าง: ใส่ค่าจาก named range ลงใน bookmark ของ Word

*โค้ดตัวอย่างโดย Dennis Wallentin, VSTO & .NET & Excel*

ตัวอย่างนำค่าเซลล์จาก named range **W_Data** ที่มีสามค่า ไปใส่ในเอกสาร Word ที่ตำแหน่ง bookmark ชื่อ **td1, td2, td3**

**เงื่อนไขก่อนรัน:** ต้องมี range ชื่อ **W_Data** ที่มีสามค่าบน **Sheet1** ของเวิร์กบุ๊ก ต้องมีเอกสาร Word ชื่อ **Test.docx** บันทึกไว้ที่เดียวกับเวิร์กบุ๊ก Excel และเอกสาร Word ต้องมี bookmark สามอัน ชื่อ **td1, td2, td3**

```vb
' ต้องเลือก Microsoft Word Object Library จาก Tools>References
' ใน Visual Basic editor เพื่อรันคำสั่งของ Word
Option Explicit
Sub Add_Single_Values_Word()
Dim wdApp As Word.Application
Dim wdDoc As Word.Document
Dim wdRange1 As Word.Range
Dim wdRange2 As Word.Range
Dim wdRange3 As Word.Range
Dim wbBook As Workbook
Dim wsSheet As Worksheet
Dim vaData As Variant
Set wbBook = ThisWorkbook
Set wsSheet = wbBook.Worksheets("Sheet1")
vaData = wsSheet.Range("W_Data").Value
' สร้างออบเจ็กต์ Word
Set wdApp = New Word.Application
Set wdDoc = wdApp.Documents.Open(wbBook.Path & "\Test.docx")
With wdDoc
    Set wdRange1 = .Bookmarks("td1").Range
    Set wdRange2 = .Bookmarks("td2").Range
    Set wdRange3 = .Bookmarks("td3").Range
End With
' เขียนค่าลงใน bookmark
wdRange1.Text = vaData(1, 1)
wdRange2.Text = vaData(2, 1)
wdRange3.Text = vaData(3, 1)
With wdDoc
    .Save
    .Close
End With
wdApp.Quit
' คืนออบเจ็กต์จากหน่วยความจำ
Set wdRange1 = Nothing
Set wdRange2 = Nothing
Set wdRange3 = Nothing
Set wdDoc = Nothing
Set wdApp = Nothing
End Sub
```

**ผู้เขียน:** Bill Jelen (MVP ผู้เขียนหนังสือ Excel กว่าสองโหล เจ้าของ MrExcel.com) และ Dennis Wallentin (บล็อก VSTO & .NET & Excel)

**เทคนิค:** อ่านช่วงเป็น `Variant` ครั้งเดียว (`vaData = Range(...).Value`) แล้วใช้ค่าจากอาร์เรย์ เป็นการถ่ายโอนข้อมูลก้อนเดียวระหว่างแอป (ตรงกับแนวทางในหมวด Performance) การใช้ `New Word.Application` ต้องมี reference (early binding) ส่วน `CreateObject` ใช้ได้ทั้ง early และ late binding

---

## 5. ส่งออกแผนภูมิไปยังเอกสาร Word

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/working-with-other-applications/exporting-a-chart-to-a-word-document>
*โค้ดตัวอย่างโดย Dennis Wallentin*

ตัวอย่างนำแผนภูมิชื่อ "Chart 1" จาก Sheet 1 ส่งออกเป็นไฟล์ .gif แล้วแทรกไฟล์ .gif ลงในเอกสาร Word ที่มีอยู่ชื่อ "Chart Report" ที่ตำแหน่ง bookmark ชื่อ "ChartReport"

```vb
Sub Export_Chart_Word()
    'ชื่อเอกสาร Word ที่มีอยู่ และชื่อที่แผนภูมิจะใช้ตอนส่งออก
    Const stWordDocument As String = "Chart Report.docx"
    Const stChartName As String = "ChartReport.gif"
    'ออบเจ็กต์ Word
    Dim wdApp As Word.Application
    Dim wdDoc As Word.Document
    Dim wdbmRange As Word.Range
    'ออบเจ็กต์ Excel
    Dim wbBook As Workbook
    Dim wsSheet As Worksheet
    Dim ChartObj As ChartObject
    'กำหนดค่าเริ่มต้นให้ออบเจ็กต์ Excel
    Set wbBook = ThisWorkbook
    Set wsSheet = wbBook.Worksheets("Sheet1")
    Set ChartObj = wsSheet.ChartObjects("Chart 1")
    'ปิดการอัปเดตหน้าจอ
    Application.ScreenUpdating = False
    'ส่งออกแผนภูมิไปยังไดเรกทอรีปัจจุบันด้วยชื่อที่ระบุ และบันทึกเป็น .gif
    ChartObj.Chart.Export _
                   Filename:=wbBook.Path & "\" & stChartName, _
                   FilterName:="GIF"
    'กำหนดค่าเริ่มต้นให้ออบเจ็กต์ Word กับเอกสารและ bookmark ที่มีอยู่
    Set wdApp = New Word.Application
    Set wdDoc = wdApp.Documents.Open(wbBook.Path & "\" & stWordDocument)
    Set wdbmRange = wdDoc.Bookmarks("ChartReport").Range
    'ถ้ามี inline shape อยู่แล้ว แปลว่าเคยรันมาโครมาก่อน ให้ล้างสิ่งที่ค้างอยู่
    On Error Resume Next
    With wdDoc.InlineShapes(1)
        .Select
        .Delete
    End With
    On Error GoTo 0
    'เพิ่มไฟล์ .gif ลงในเอกสารที่ตำแหน่ง bookmark
    'และตรวจให้แน่ใจว่าบันทึกไว้ภายในเอกสาร Word
    With wdbmRange
        .Select
        .InlineShapes.AddPicture _
        Filename:=wbBook.Path & "\" & stChartName, _
        LinkToFile:=False, _
        savewithdocument:=True
    End With
    'บันทึกและปิดเอกสาร Word
    With wdDoc
        .Save
        .Close
    End With
    'ปิด Word
    wdApp.Quit
    'ล้างตัวแปร
    Set wdbmRange = Nothing
    Set wdDoc = Nothing
    Set wdApp = Nothing
    'ลบไฟล์ .gif ชั่วคราว
    On Error Resume Next
    Kill wbBook.Path & "\" & stChartName
    On Error GoTo 0
    MsgBox "Chart exported successfully to " & stWordDocument
End Sub
```

**กระบวนการ:** ส่งออกแผนภูมิเป็นรูปชั่วคราว → เปิดเอกสาร Word ผ่าน automation → ลบรูปเก่า (ถ้ารันซ้ำ) → แทรกรูปที่ bookmark (`LinkToFile:=False, savewithdocument:=True` เพื่อฝังรูปในเอกสาร) → บันทึก ปิด → ลบไฟล์ชั่วคราวด้วย `Kill`

---

## 6. ส่งออกช่วงข้อมูลไปยังตารางในเอกสาร Word

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/working-with-other-applications/exporting-a-range-to-a-table-in-a-word-document>
*โค้ดตัวอย่างโดย Dennis Wallentin*

ตัวอย่างนำช่วง A1:A10 บน Sheet 1 ส่งออกไปยังตารางแรกในเอกสาร Word ที่มีอยู่ชื่อ "Table Report"

```vb
Sub Export_Table_Data_Word()
    'ชื่อเอกสาร Word ที่มีอยู่
    Const stWordDocument As String = "Table Report.docx"
    'ออบเจ็กต์ Word
    Dim wdApp As Word.Application
    Dim wdDoc As Word.Document
    Dim wdCell As Word.Cell
    'ออบเจ็กต์ Excel
    Dim wbBook As Workbook
    Dim wsSheet As Worksheet
    'ตัวนับที่ใช้ในลูป FOR เพื่อเติมตาราง Word
    Dim lnCountItems As Long
    'Variant เก็บข้อมูลที่จะส่งออก
    Dim vaData As Variant
    'กำหนดค่าเริ่มต้นให้ออบเจ็กต์ Excel
    Set wbBook = ThisWorkbook
    Set wsSheet = wbBook.Worksheets("Sheet1")
    vaData = wsSheet.Range("A1:A10").Value
    'สร้าง Word และเปิดเอกสาร "Table Report"
    Set wdApp = New Word.Application
    Set wdDoc = wdApp.Documents.Open(wbBook.Path & "\" & stWordDocument)
    lnCountItems = 1
    'ใส่ข้อมูลจาก variant ลงในตารางในเอกสาร Word
    For Each wdCell In wdDoc.Tables(1).Columns(1).Cells
        wdCell.Range.Text = vaData(lnCountItems, 1)
        lnCountItems = lnCountItems + 1
    Next wdCell
    'บันทึกและปิดเอกสาร Word
    With wdDoc
        .Save
        .Close
    End With
    wdApp.Quit
    'ตั้งตัวแปรเป็น Nothing
    Set wdCell = Nothing
    Set wdDoc = Nothing
    Set wdApp = Nothing
    MsgBox "The " & stWordDocument & "'s table has successfully " & vbNewLine & _
           "been updated!", vbInformation
End Sub
```

**ข้อควรระวัง (ข้อสังเกตของผู้แปล):** ตารางแรกของเอกสาร Word ต้องมีอย่างน้อย 10 เซลล์ในคอลัมน์แรก ไม่เช่นนั้นลูปจะอ่านนอกขอบเขตอาร์เรย์ `vaData`

---

## 7. ส่งออก Table ไปยังเอกสาร Word

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/working-with-other-applications/exporting-a-table-to-a-word-document>
*โค้ดตัวอย่างโดย Dennis Wallentin*

ตัวอย่างนำตารางชื่อ "Table1" บน Sheet 1 ไปคัดลอกลงในเอกสาร Word ที่มีอยู่ชื่อ "Quarter Report" ที่ตำแหน่ง bookmark ชื่อ "Report"

```vb
Sub Export_Table_Word()
    'ชื่อเอกสาร Word ที่มีอยู่
    Const stWordReport As String = "Quarter Report.docx"
    'ออบเจ็กต์ Word
    Dim wdApp As Word.Application
    Dim wdDoc As Word.Document
    Dim wdbmRange As Word.Range
    'ออบเจ็กต์ Excel
    Dim wbBook As Workbook
    Dim wsSheet As Worksheet
    Dim rnReport As Range
    'กำหนดค่าเริ่มต้นให้ออบเจ็กต์ Excel
    Set wbBook = ThisWorkbook
    Set wsSheet = wbBook.Worksheets("Sheet1")
    Set rnReport = wsSheet.Range("Table1")
    'กำหนดค่าเริ่มต้นให้ออบเจ็กต์ Word
    Set wdApp = New Word.Application
    Set wdDoc = wdApp.Documents.Open(wbBook.Path & "\" & stWordReport)
    Set wdbmRange = wdDoc.Bookmarks("Report").Range
    'ถ้าเคยรันมาโครมาก่อน ให้ล้างสิ่งที่ค้างอยู่ก่อนวางตารางอีกครั้ง
    On Error Resume Next
    With wdDoc.InlineShapes(1)
        .Select
        .Delete
    End With
    On Error GoTo 0
    'ปิดการอัปเดตหน้าจอ
    Application.ScreenUpdating = False
    'คัดลอกรายงานไปยังคลิปบอร์ด
    rnReport.Copy
    'เลือกช่วงที่กำหนดโดย bookmark "Report" แล้ววางรายงานจากคลิปบอร์ด
    With wdbmRange
        .Select
        .PasteSpecial Link:=False, _
                      DataType:=wdPasteMetafilePicture, _
                      Placement:=wdInLine, _
                      DisplayAsIcon:=False
    End With
    'บันทึกและปิดเอกสาร Word
    With wdDoc
        .Save
        .Close
    End With
    'ปิด Word
    wdApp.Quit
    'ตั้งตัวแปรเป็น Nothing
    Set wdbmRange = Nothing
    Set wdDoc = Nothing
    Set wdApp = Nothing
    'ล้างคลิปบอร์ด และเปิดการอัปเดตหน้าจอกลับ
    With Application
        .CutCopyMode = False
        .ScreenUpdating = True
    End With
    MsgBox "The report has successfully been " & vbNewLine & _
           "transferred to " & stWordReport, vbInformation
End Sub
```

**เทคนิค:** วางเป็นภาพเมตาไฟล์ (`wdPasteMetafilePicture`) แบบ inline จึงลบ/แทนที่ได้ผ่านคอลเลกชัน `InlineShapes` ตอนรันซ้ำ และตั้ง `CutCopyMode = False` เพื่อล้างคลิปบอร์ดหลังใช้

---

## 8. นำเข้ารายชื่อติดต่อจาก Outlook ลงเวิร์กชีต

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/working-with-other-applications/import-outlook-contacts-to-a-worksheet>
*โค้ดตัวอย่างโดย Dennis Wallentin*

ตัวอย่างนำเข้ารายชื่อติดต่อจากโฟลเดอร์ผู้ติดต่อเริ่มต้นของ Outlook ลงใน Sheet 1 ของเวิร์กบุ๊กที่ active (ต้องตั้ง reference ไปยัง Microsoft Outlook Object Library)

```vb
Sub Import_Contacts()
    'ออบเจ็กต์ Outlook
    Dim olApp As Outlook.Application
    Dim olNamespace As Outlook.Namespace
    Dim olFolder As Outlook.MAPIFolder
    Dim olConItems As Outlook.Items
    Dim olItem As Object
    'ออบเจ็กต์ Excel
    Dim wbBook As Workbook
    Dim wsSheet As Worksheet
    'ตำแหน่งในรายชื่อผู้ติดต่อที่นำเข้า
    Dim lnContactCount As Long
    Dim strDummy As String
    'ปิดการอัปเดตหน้าจอ
    Application.ScreenUpdating = False
    'กำหนดค่าเริ่มต้นให้ออบเจ็กต์ Excel
    Set wbBook = ThisWorkbook
    Set wsSheet = wbBook.Worksheets(1)
    'จัดรูปแบบเวิร์กชีตปลายทาง
    With wsSheet
        .Range("A1").CurrentRegion.Clear
        .Cells(1, 1).Value = "Company / Private Person"
        .Cells(1, 2).Value = "Street Address"
        .Cells(1, 3).Value = "Postal Code"
        .Cells(1, 4).Value = "City"
        .Cells(1, 5).Value = "Contact Person"
        .Cells(1, 6).Value = "Email"
        With .Range("A1:F1")
            .Font.Bold = True
            .Font.ColorIndex = 10
            .Font.Size = 11
        End With
    End With
    wsSheet.Activate
    'กำหนดตัวแปร Outlook ด้วย MAPI namespace และโฟลเดอร์เริ่มต้นของ Outlook ของผู้ใช้ปัจจุบัน
    Set olApp = New Outlook.Application
    Set olNamespace = olApp.GetNamespace("MAPI")
    Set olFolder = olNamespace.GetDefaultFolder(10)
    Set olConItems = olFolder.Items
    'หมายเลขแถวที่จะใส่ข้อมูลใหม่ เริ่มที่ 2 เพื่อไม่เขียนทับส่วนหัว
    lnContactCount = 2
    'สำหรับแต่ละผู้ติดต่อ: ถ้าเป็นผู้ติดต่อทางธุรกิจ ให้เขียนข้อมูลธุรกิจลงเวิร์กชีต Excel
    'มิฉะนั้นเขียนข้อมูลส่วนตัว
    For Each olItem In olConItems
        If TypeName(olItem) = "ContactItem" Then
            With olItem
                If InStr(olItem.CompanyName, strDummy) > 0 Then
                    Cells(lnContactCount, 1).Value = .CompanyName
                    Cells(lnContactCount, 2).Value = .BusinessAddressStreet
                    Cells(lnContactCount, 3).Value = .BusinessAddressPostalCode
                    Cells(lnContactCount, 4).Value = .BusinessAddressCity
                    Cells(lnContactCount, 5).Value = .FullName
                    Cells(lnContactCount, 6).Value = .Email1Address
                Else
                    Cells(lnContactCount, 1) = .FullName
                    Cells(lnContactCount, 2) = .HomeAddressStreet
                    Cells(lnContactCount, 3) = .HomeAddressPostalCode
                    Cells(lnContactCount, 4) = .HomeAddressCity
                    Cells(lnContactCount, 5) = .FullName
                    Cells(lnContactCount, 6) = .Email1Address
                End If
                wsSheet.Hyperlinks.Add Anchor:=Cells(lnContactCount, 6), _
                                       Address:="mailto:" & Cells(lnContactCount, 6).Value, _
                                       TextToDisplay:=Cells(lnContactCount, 6).Value
            End With
            lnContactCount = lnContactCount + 1
        End If
    Next olItem
    'ตั้งตัวแปรเป็น Nothing
    Set olItem = Nothing
    Set olConItems = Nothing
    Set olFolder = Nothing
    Set olNamespace = Nothing
    Set olApp = Nothing
    'เรียงแถวตามตัวอักษรโดยใช้ CompanyName หรือ FullName ตามความเหมาะสม แล้ว autofit
    With wsSheet
        .Range("A2", Cells(2, 6).End(xlDown)).Sort key1:=Range("A2"), order1:=xlAscending
        .Range("A:F").EntireColumn.AutoFit
    End With
    'เปิดการอัปเดตหน้าจอกลับ
    Application.ScreenUpdating = True
    MsgBox "The list has successfully been created!", vbInformation
End Sub
```

**เทคนิค:** `GetDefaultFolder(10)` = `olFolderContacts` (โฟลเดอร์ผู้ติดต่อ) ตรวจ `TypeName(olItem) = "ContactItem"` เพราะในโฟลเดอร์อาจมีรายการชนิดอื่น เงื่อนไข `InStr(olItem.CompanyName, strDummy) > 0` เมื่อ `strDummy` เป็นสตริงว่าง จะคืน 0 เสมอ (ข้อสังเกตของผู้แปล: InStr กับสตริงว่างที่ค้นหาคืนตำแหน่งเริ่มต้น แต่ถ้า `CompanyName` ว่างจะคืน 0 จึงใช้แยกผู้ติดต่อที่มี/ไม่มีชื่อบริษัท)

---

## 9. ส่งอีเมลถึงรายชื่อผู้รับด้วย Excel และ Outlook

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/working-with-other-applications/sending-email-to-a-list-of-recipients-using-excel-and-outlook>
*โค้ดตัวอย่างโดย Holy Macro! Books*

ตัวอย่างส่งอีเมลถึงรายชื่อผู้รับตามข้อมูลที่เก็บในเวิร์กบุ๊ก อีเมลผู้รับต้องอยู่ในคอลัมน์ A และเนื้อหาอีเมลต้องอยู่ใน text box แรกบนชีตที่ active

```vb
Sub Sample()
   'ตั้งค่าตัวแปร Excel
   Dim olApp As Object
   Dim olMailItm As Object
   Dim iCounter As Integer
   Dim Dest As Variant
   Dim SDest As String
   'สร้างแอปพลิเคชัน Outlook และอีเมลเปล่า
   Set olApp = CreateObject("Outlook.Application")
   Set olMailItm = olApp.CreateItem(0)
   'ใช้อีเมลเพิ่มผู้รับหลายคนโดยใช้รายการที่อยู่ในคอลัมน์ A
   With olMailItm
       SDest = ""
       For iCounter = 1 To WorksheetFunction.CountA(Columns(1))
           If SDest = "" Then
               SDest = Cells(iCounter, 1).Value
           Else
               SDest = SDest & ";" & Cells(iCounter, 1).Value
           End If
       Next iCounter
    'จัดรูปแบบบรรทัด BCC และ Subject เพิ่มเติม ใส่เนื้อหาจากสเปรดชีต แล้วส่ง
       .BCC = SDest
       .Subject = "FYI"
       .Body = ActiveSheet.TextBoxes(1).Text
       .Send
   End With
   'ล้างแอปพลิเคชัน Outlook
   Set olMailItm = Nothing
   Set olApp = Nothing
End Sub
```

**หมายเหตุด้านความปลอดภัยและกระบวนการ (ผู้แปลสรุป):** โค้ดนี้ใส่ผู้รับทั้งหมดใน **BCC** (ผู้รับไม่เห็นรายชื่อของกันและกัน) และเรียก `.Send` ทันที ไม่มีขั้นตอนให้ตรวจก่อนส่ง ถ้าทดสอบ ควรเปลี่ยน `.Send` เป็น `.Display` เพื่อดูร่างอีเมลก่อน และทดสอบกับที่อยู่ของตัวเอง

**ผู้เขียน:** Holy Macro! Books (สำนักพิมพ์หนังสือสำหรับผู้ใช้ Microsoft Office ดูแคตตาล็อกที่ MrExcel.com)

---

## 10. สรุปเทคนิค

ข้อ 1–3 มาจากต้นฉบับ ข้อ 4–5 เป็นข้อสังเกตของผู้แปล

1. ทำงานข้ามแอปด้วยลำดับ: ตั้ง reference (early binding) → ประกาศตัวแปรชนิดเฉพาะ → `CreateObject`/`New` → ใช้ property/method → `Quit` และตั้ง `Nothing` (หัวข้อ 4)
2. ส่งข้อมูลไป Word ด้วย bookmark (`Bookmarks("ชื่อ").Range`) เพื่อกำหนดตำแหน่งแทรกที่แน่นอน (หัวข้อ 4, 5, 7)
3. ออกแบบมาโครให้รันซ้ำได้: ลบ inline shape เก่าก่อนแทรกใหม่ ลบไฟล์ชั่วคราว (หัวข้อ 5, 7)
4. ปิดแอปอื่นและคืนหน่วยความจำทุกครั้ง ถ้าเกิด error กลางทางอาจมีโปรเซส Word/Outlook ค้างอยู่เบื้องหลัง
5. การทดลองระบบที่ส่งอีเมล/ลบไฟล์จริง ให้ทดสอบกับข้อมูลจำลองก่อนเสมอ

---

> ต้นฉบับ © Microsoft เผยแพร่บน Microsoft Learn (MicrosoftDocs/VBA-Docs) เอกสารนี้เป็นฉบับแปลเพื่อการศึกษา โปรดเทียบกับต้นฉบับเมื่อใช้งานจริง
