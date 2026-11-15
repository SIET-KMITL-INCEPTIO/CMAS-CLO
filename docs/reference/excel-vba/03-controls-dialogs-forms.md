# Excel VBA: ตัวควบคุม กล่องโต้ตอบ และฟอร์ม (Controls, Dialog Boxes, and Forms)

> ฉบับแปลภาษาไทยจาก Microsoft Learn ส่วน Concepts → Controls, dialog boxes, and forms
> สารบัญต้นทาง: <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/controls-dialog-boxes-and-forms>
> ต้นฉบับ Markdown: <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts/Controls-DialogBoxes-Forms>
> หน้า Overview: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>
>
> คงชื่อ object / property / method / ค่าคงที่เป็นอังกฤษ แปลคำอธิบายและคอมเมนต์ ทุกหัวข้อมีบรรทัด **อ้างอิง**

ฐานลิงก์อ้างอิง: `https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/<ชื่อหน้า>`

## สารบัญ

1. [ภาพรวมกระบวนการสร้างกล่องโต้ตอบแบบกำหนดเอง](#1-ภาพรวมกระบวนการสร้างกล่องโต้ตอบแบบกำหนดเอง)
2. [สร้าง User Form](#2-สร้าง-user-form)
3. [เพิ่มตัวควบคุมลงใน User Form](#3-เพิ่มตัวควบคุมลงใน-user-form)
4. [ตั้งค่า property ของตัวควบคุม (ช่วงออกแบบ)](#4-ตั้งค่า-property-ของตัวควบคุมช่วงออกแบบ)
5. [กำหนดค่าเริ่มต้นให้ตัวควบคุม](#5-กำหนดค่าเริ่มต้นให้ตัวควบคุม)
6. [แสดงกล่องโต้ตอบแบบกำหนดเอง](#6-แสดงกล่องโต้ตอบแบบกำหนดเอง)
7. [ใช้ค่าของตัวควบคุมขณะโค้ดทำงาน](#7-ใช้ค่าของตัวควบคุมขณะโค้ดทำงาน)
8. [ตัวควบคุม ActiveX (รายการ)](#8-ตัวควบคุม-activex)
9. [เพิ่มตัวควบคุมลงในเอกสาร](#9-เพิ่มตัวควบคุมลงในเอกสาร)
10. [ใช้ตัวควบคุม ActiveX บนเอกสาร](#10-ใช้ตัวควบคุม-activex-บนเอกสาร)
11. [ใช้ตัวควบคุม ActiveX บนชีต](#11-ใช้ตัวควบคุม-activex-บนชีต)
12. [เพิ่มรายการค่าที่ไม่ซ้ำลงใน Combo Box](#12-เพิ่มรายการค่าที่ไม่ซ้ำลงใน-combo-box)
13. [ปิด Message Box อัตโนมัติ](#13-ปิด-message-box-อัตโนมัติ)
14. [สร้างเมนูกำหนดเองที่เรียกมาโคร](#14-สร้างเมนูกำหนดเองที่เรียกมาโคร)
15. [รายการอาร์กิวเมนต์ของกล่องโต้ตอบในตัว](#15-รายการอาร์กิวเมนต์ของกล่องโต้ตอบในตัว)
16. [สรุปเทคนิค](#16-สรุปเทคนิค)

---

## 1. ภาพรวมกระบวนการสร้างกล่องโต้ตอบแบบกำหนดเอง

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/create-a-custom-dialog-box>

ขั้นตอนสร้างกล่องโต้ตอบแบบกำหนดเอง:

1. **สร้าง User Form** ที่เมนู **Insert** ใน Visual Basic Editor คลิก **UserForm** (หัวข้อ 2)
2. **เพิ่มตัวควบคุมลงใน User Form** หาตัวควบคุมใน **Toolbox** แล้วลากลงฟอร์ม (หัวข้อ 3)
3. **ตั้งค่า property ของตัวควบคุม** คลิกขวาที่ตัวควบคุมในโหมดออกแบบ แล้วคลิก **Properties** (หัวข้อ 4)
4. **กำหนดค่าเริ่มต้นให้ตัวควบคุม** ทำในโพรซีเดอร์ก่อนแสดงฟอร์ม หรือเพิ่มโค้ดใน event Initialize ของฟอร์ม (หัวข้อ 5)
5. **Control and Dialog Box Events** ตัวควบคุมทุกตัวมีชุด event ที่กำหนดไว้ล่วงหน้า เช่น command button มี event **Click** ที่เกิดเมื่อผู้ใช้คลิก เขียนโพรซีเดอร์ event ให้ทำงานเมื่อ event เกิดขึ้น (ดูไฟล์ `04-events-worksheet-functions-shapes.md` หัวข้อ Control and Dialog Box Events)
6. **แสดงกล่องโต้ตอบ** ใช้ method **Show** แสดง UserForm (หัวข้อ 6)
7. **ใช้ค่าของตัวควบคุมขณะโค้ดทำงาน** บาง property ตั้งได้ขณะรัน การเปลี่ยนแปลงที่ผู้ใช้ทำกับกล่องโต้ตอบจะหายไปเมื่อปิดกล่อง (หัวข้อ 7)

---

## 2. สร้าง User Form

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/create-a-user-form>

การสร้างกล่องโต้ตอบแบบกำหนดเองต้องสร้าง UserForm โดยคลิก **UserForm** ที่เมนู **Insert** ใน Visual Basic Editor

ใช้หน้าต่าง **Properties** เปลี่ยนชื่อ พฤติกรรม และรูปลักษณ์ของฟอร์ม เช่น เปลี่ยนคำบรรยายของฟอร์มด้วย property **Caption**

---

## 3. เพิ่มตัวควบคุมลงใน User Form

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/add-controls-to-a-user-form>

หาตัวควบคุมที่ต้องการใน **Toolbox** ลากลงบนฟอร์ม แล้วลาก adjustment handle จนเส้นขอบมีขนาดและรูปร่างตามต้องการ

> **หมายเหตุ:** ลากตัวควบคุม หรือกลุ่มตัวควบคุมที่ "จัดกลุ่ม" ไว้ จากฟอร์มกลับไปที่ **Toolbox** จะสร้างเทมเพลตของตัวควบคุมไว้ใช้ซ้ำ เป็นประโยชน์สำหรับทำอินเทอร์เฟซมาตรฐานของแอปพลิเคชัน

เมื่อเพิ่มตัวควบคุมแล้ว ใช้คำสั่งในเมนู **Format** ของ Visual Basic Editor ปรับการจัดแนวและระยะห่างของตัวควบคุม

---

## 4. ตั้งค่า property ของตัวควบคุม (ช่วงออกแบบ)

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/setting-control-properties>

ตั้ง property ของตัวควบคุมบางส่วนได้ตอนออกแบบ (ก่อนมีมาโครทำงาน) ในโหมดออกแบบ คลิกขวาที่ตัวควบคุมแล้วคลิก **Properties** เพื่อเปิดหน้าต่าง Properties ชื่อ property อยู่คอลัมน์ซ้าย ค่าอยู่คอลัมน์ขวา ตั้งค่าโดยพิมพ์ค่าใหม่ทางขวาของชื่อ property

---

## 5. กำหนดค่าเริ่มต้นให้ตัวควบคุม

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/initializing-control-properties>

กำหนดค่าเริ่มต้นให้ตัวควบคุมขณะรันได้ด้วยโค้ด VBA เช่น เติม list box ตั้งข้อความ หรือเลือก option button

ตัวอย่างใช้ method **AddItem** ใส่ข้อมูลใน list box แล้วตั้งค่า text box และแสดงฟอร์ม

```vb
Private Sub GetUserName()
 With UserForm1
 .lstRegions.AddItem "North"
 .lstRegions.AddItem "South"
 .lstRegions.AddItem "East"
 .lstRegions.AddItem "West"
 .txtSalesPersonID.Text = "00000"
 .Show
 ' ...
 End With
End Sub
```

อีกวิธีคือใช้โค้ดใน event **Initialize** ของฟอร์มเพื่อตั้งค่าเริ่มต้น ข้อดีคือโค้ดกำหนดค่าเริ่มต้นอยู่กับฟอร์ม คัดลอกฟอร์มไปโปรเจกต์อื่นแล้วเรียก `Show` ตัวควบคุมจะถูกกำหนดค่าเริ่มต้นเอง

```vb
Private Sub UserForm_Initialize()
 UserForm1.lstNames.AddItem "Test One"
 UserForm1.lstNames.AddItem "Test Two"
 UserForm1.txtUserName.Text = "Default Name"
End Sub
```

---

## 6. แสดงกล่องโต้ตอบแบบกำหนดเอง

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/displaying-a-custom-dialog-box>

ทดสอบกล่องโต้ตอบใน Visual Basic Editor โดยคลิก **Run Sub/UserForm** ที่เมนู **Run**

แสดงกล่องโต้ตอบจากโค้ด VBA ด้วย method **Show** ตัวอย่างแสดง UserForm1

```vb
Private Sub GetUserName()
 UserForm1.Show
End Sub
```

---

## 7. ใช้ค่าของตัวควบคุมขณะโค้ดทำงาน

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/using-control-values-while-code-is-running>

property ของตัวควบคุมบางตัวตั้งและอ่านได้ขณะโค้ดทำงาน ตัวอย่างตั้ง **Text** ของ text box เป็น "Hello"

```vb
TextBox1.Text = "Hello"
```

ข้อมูลที่ผู้ใช้กรอกในฟอร์มจะหายเมื่อปิดฟอร์ม ถ้าอ่านค่าตัวควบคุมหลังฟอร์มถูก unload จะได้ค่าเริ่มต้น ไม่ใช่ค่าที่ผู้ใช้กรอก

ถ้าต้องการเก็บข้อมูลที่กรอก ให้บันทึกลงตัวแปรระดับโมดูลขณะฟอร์มยังทำงานอยู่ ตัวอย่างแสดงฟอร์มและเก็บข้อมูล

```vb
' โค้ดในโมดูล: ประกาศตัวแปร public
Public strRegion As String
Public intSalesPersonID As Integer
Public blnCancelled As Boolean
' โค้ดในฟอร์ม
Private Sub cmdCancel_Click()
 Module1.blnCancelled = True
 Unload Me
End Sub
Private Sub cmdOK_Click()
 ' บันทึกข้อมูล
 intSalesPersonID = txtSalesPersonID.Text
 strRegion = lstRegions.List(lstRegions.ListIndex)
 Module1.blnCancelled = False
 Unload Me
End Sub
Private Sub UserForm_Initialize()
 Module1.blnCancelled = True
End Sub
' โค้ดในโมดูล: แสดงฟอร์ม
Sub LaunchSalesPersonForm()
 frmSalesPeople.Show
 If blnCancelled = True Then
 MsgBox "Operation Cancelled!", vbExclamation
 Else
 MsgBox "The Salesperson's ID is: " & _
 intSalesPersonID & _
 "The Region is: " & strRegion
 End If
End Sub
```

**เทคนิค (รูปแบบ OK/Cancel):** ตั้ง `blnCancelled = True` ใน `Initialize` เป็นค่าเริ่มต้น ปุ่ม OK เปลี่ยนเป็น `False` หลังเก็บค่า ส่วนปุ่ม Cancel คง `True` โค้ดที่เรียก `Show` ตรวจตัวแปรนี้หลังฟอร์มปิดเพื่อรู้ว่าผู้ใช้ยกเลิกหรือไม่ (หมายเหตุ: ในต้นฉบับ ข้อความใน `MsgBox` ถูกแบ่งบรรทัดโดยไม่มีตัวต่อบรรทัด `_` ซึ่งคอมไพล์ไม่ผ่าน ผู้แปลเติม `_` ให้ในโค้ดข้างต้น)

---

## 8. ตัวควบคุม ActiveX

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/activex-controls>

ดูข้อมูลของแต่ละตัวควบคุมได้จากรายการต่อไปนี้ (ลิงก์ไปเอกสาร User Interface Help):

| ตัวควบคุม | ลิงก์ |
| :-- | :-- |
| CheckBox | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/checkbox-control> |
| ComboBox | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/combobox-control> |
| CommandButton | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/commandbutton-control> |
| Image | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/image-control> |
| Label | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/label-control> |
| ListBox | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/listbox-control> |
| OptionButton | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/optionbutton-control> |
| ScrollBar | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/scrollbar-control> |
| SpinButton | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/spinbutton-control> |
| TextBox | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/textbox-control> |
| ToggleButton | <https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/togglebutton-control> |

---

## 9. เพิ่มตัวควบคุมลงในเอกสาร

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/add-controls-to-a-document>

เปิด **Control Toolbox** คลิกตัวควบคุมที่ต้องการ แล้วคลิกบนเอกสาร ลาก adjustment handle จนเส้นขอบมีขนาดและรูปร่างตามต้องการ

> **หมายเหตุ:** ลากตัวควบคุมหรือกลุ่มตัวควบคุมจากฟอร์มกลับไปที่ **Control Toolbox** จะสร้างเทมเพลตไว้ใช้ซ้ำ เหมาะกับการทำอินเทอร์เฟซมาตรฐาน

---

## 10. ใช้ตัวควบคุม ActiveX บนเอกสาร

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/using-activex-controls-on-a-document>

เช่นเดียวกับที่เพิ่มตัวควบคุม ActiveX ลงในกล่องโต้ตอบแบบกำหนดเองได้ คุณเพิ่มตัวควบคุมลงในเอกสารโดยตรงได้ เมื่ออยากให้ผู้ใช้โต้ตอบกับมาโครอย่างซับซ้อนโดยไม่ถูกรบกวนด้วยกล่องโต้ตอบ ขั้นตอน:

1. **เพิ่มตัวควบคุมลงเอกสาร** แสดง **Control Toolbox** คลิกตัวควบคุม แล้วคลิกเอกสาร
2. **ตั้งค่า property** คลิกขวาที่ตัวควบคุมในโหมดออกแบบ แล้วคลิก **Properties**
3. **กำหนดค่าเริ่มต้นให้ตัวควบคุม** ทำในโพรซีเดอร์ได้
4. **เขียนโพรซีเดอร์ event** ตัวควบคุมทุกตัวมีชุด event เช่น command button มี Click
5. **ใช้ค่าของตัวควบคุมขณะโค้ดทำงาน** บาง property ตั้งได้ขณะรัน

ข้อมูลเฉพาะของ Excel ดูหัวข้อถัดไป

---

## 11. ใช้ตัวควบคุม ActiveX บนชีต

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/using-activex-controls-on-sheets>

หัวข้อนี้ครอบคลุมการใช้ตัวควบคุม ActiveX บนเวิร์กชีตและชีตแผนภูมิ ข้อควรจำ:

- นอกจาก property มาตรฐานของ ActiveX แล้ว ใน Excel ใช้ property ต่อไปนี้ได้: **BottomRightCell, LinkedCell, ListFillRange, Placement, PrintObject, TopLeftCell, ZOrder** ตั้งและอ่านได้ผ่านชื่อตัวควบคุม ตัวอย่างเลื่อนหน้าต่างเวิร์กบุ๊กให้ CommandButton1 อยู่มุมบนซ้าย

  ```vb
  Set t = Sheet1.CommandButton1.TopLeftCell
  With ActiveWindow
      .ScrollRow = t.Row
      .ScrollColumn = t.Column
  End With
  ```

- method และ property ของ Excel VBA บางตัวถูกปิดเมื่อตัวควบคุม ActiveX กำลัง active เช่น ใช้ **Sort** ไม่ได้เมื่อตัวควบคุม active โค้ดต่อไปนี้จึงล้มเหลวใน event คลิกปุ่ม (เพราะตัวควบคุมยัง active หลังผู้ใช้คลิก)

  ```vb
  Private Sub CommandButton1.Click
      Range("a1:a10").Sort Key1:=Range("a1")
  End Sub
  ```

  แก้ปัญหาโดย activate องค์ประกอบอื่นบนชีตก่อนใช้ property/method ที่ล้มเหลว

  ```vb
  Private Sub CommandButton1.Click
      Range("a1").Activate
      Range("a1:a10").Sort Key1:=Range("a1")
      CommandButton1.Activate
  End Sub
  ```

- ตัวควบคุมในเวิร์กบุ๊ก Excel ที่ฝังในเอกสารของแอปอื่นจะไม่ทำงานถ้าผู้ใช้ดับเบิลคลิกเวิร์กบุ๊กเพื่อแก้ไข แต่ทำงานถ้าคลิกขวาที่เวิร์กบุ๊กแล้วเลือกคำสั่ง **Open** จากเมนูทางลัด
- เมื่อบันทึกเวิร์กบุ๊กด้วยรูปแบบไฟล์ Microsoft Excel 5.0/95 ข้อมูลตัวควบคุม ActiveX จะสูญหาย
- คีย์เวิร์ด **Me** ในโพรซีเดอร์ event ของตัวควบคุม ActiveX บนชีต หมายถึงชีต ไม่ใช่ตัวควบคุม

### เพิ่มตัวควบคุมด้วย VBA

ใน Excel ตัวควบคุม ActiveX แทนด้วยออบเจ็กต์ **OLEObject** ในคอลเลกชัน **OLEObjects** (ทุก OLEObject อยู่ในคอลเลกชัน **Shapes** ด้วย) เพิ่มตัวควบคุมลงชีตด้วย method **Add** ของ `OLEObjects` ตัวอย่างเพิ่ม command button ลงเวิร์กชีต 1

```vb
Worksheets(1).OLEObjects.Add "Forms.CommandButton.1", _
    Left:=10, Top:=10, Height:=20, Width:=100
```

### ใช้ property ของตัวควบคุมด้วย VBA

โค้ดส่วนใหญ่อ้างอิงตัวควบคุมด้วยชื่อ ตัวอย่างเปลี่ยน caption ของตัวควบคุม "CommandButton1"

```vb
Sheet1.CommandButton1.Caption = "Run"
```

เมื่อใช้ชื่อตัวควบคุมนอกคลาสโมดูลของชีตที่มีตัวควบคุม ต้องกำกับชื่อด้วยชื่อชีต เปลี่ยนชื่อที่ใช้ในโค้ดได้โดยเลือกตัวควบคุมแล้วตั้ง property **(Name)** ในหน้าต่าง Properties

เนื่องจากตัวควบคุมเป็น OLEObject ในคอลเลกชัน ตั้ง property ผ่านออบเจ็กต์ในคอลเลกชันได้ ตัวอย่างตั้งตำแหน่งซ้ายของ "CommandButton1"

```vb
Worksheets(1).OLEObjects("CommandButton1").Left = 10
```

property ที่ไม่แสดงเป็น property ของ OLEObject ตั้งได้โดยคืนออบเจ็กต์ตัวควบคุมจริงด้วย property **Object**

```vb
Worksheets(1).OLEObjects("CommandButton1"). _
    Object.Caption = "run me"
```

เพราะ OLE object ทุกตัวเป็นสมาชิกของ **Shapes** ใช้คอลเลกชันนี้ตั้ง property ให้หลายตัวควบคุมได้ ตัวอย่างจัดขอบซ้ายของตัวควบคุมทั้งหมดบนเวิร์กชีต 1

```vb
For Each s In Worksheets(1).Shapes
    If s.Type = msoOLEControlObject Then s.Left = 10
Next
```

### ชื่อตัวควบคุมกับคอลเลกชัน Shapes และ OLEObjects

ตัวควบคุม ActiveX บนชีตมีสองชื่อ: **ชื่อ shape** (ดูได้ในกล่อง **Name** ตอนดูชีต) และ **code name** (ดูในเซลล์ทางขวาของ **(Name)** ในหน้าต่าง Properties) เมื่อเพิ่มตัวควบคุมครั้งแรก ทั้งสองชื่อตรงกัน แต่ถ้าเปลี่ยนชื่อใดชื่อหนึ่ง อีกชื่อไม่เปลี่ยนตาม

ใช้ **code name** ในชื่อโพรซีเดอร์ event แต่เมื่อคืนตัวควบคุมจากคอลเลกชัน **Shapes** หรือ **OLEObjects** ของชีต ต้องใช้ **ชื่อ shape** เช่น เพิ่ม check box ที่ชื่อ shape และ code name เป็น CheckBox1 แล้วเปลี่ยน code name เป็น `chkFinished` ต้องใช้ chkFinished ในชื่อโพรซีเดอร์ event แต่ยังต้องใช้ CheckBox1 เพื่อคืนตัวควบคุมจากคอลเลกชัน

```vb
Private Sub chkFinished_Click()
    ActiveSheet.OLEObjects("CheckBox1").Object.Value = 1
End Sub
```

---

## 12. เพิ่มรายการค่าที่ไม่ซ้ำลงใน Combo Box

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/add-a-unique-list-of-values-to-a-combo-box>
*โค้ดตัวอย่างโดย Dennis Wallentin, VSTO & .NET & Excel*

ตัวอย่างสองวิธีนำรายการจากสเปรดชีตมาเติม combo box เฉพาะค่าที่ไม่ซ้ำ วิธีแรกใช้ **AdvancedFilter** ของ Range วิธีที่สองใช้ออบเจ็กต์ **Collection**

### วิธีที่ 1: AdvancedFilter

```vb
Sub Populate_Combobox_Worksheet()
    'เวิร์กบุ๊กและเวิร์กชีตที่มีข้อมูล รวมทั้งช่วงที่ครอบข้อมูล
    Dim wbBook As Workbook
    Dim wsSheet As Worksheet
    Dim rnData As Range
    'Variant เก็บข้อมูลที่จะใส่ใน combo box
    Dim vaData As Variant
    'กำหนดค่าเริ่มต้นให้ออบเจ็กต์ Excel
    Set wbBook = ThisWorkbook
    Set wsSheet = wbBook.Worksheets("Sheet1")
    'ตั้งช่วงเป็นข้อมูล แล้วคัดลอกค่าที่ไม่ซ้ำ (ชั่วคราว) ไปคอลัมน์ L
    With wsSheet
        Set rnData = .Range(.Range("A1"), .Range("A100").End(xlUp))
        rnData.AdvancedFilter Action:=xlFilterCopy, _
                          CopyToRange:=.Range("L1"), _
                          Unique:=True
        'เก็บค่าที่ไม่ซ้ำไว้ใน vaData
        vaData = .Range(.Range("L2"), .Range("L100").End(xlUp)).Value
        'ล้างที่เก็บข้อมูลชั่วคราว
        .Range(.Range("L1"), .Range("L100").End(xlUp)).ClearContents
    End With
    'แสดงค่าที่ไม่ซ้ำใน vaData ใน combo box ที่มีอยู่บนเวิร์กชีต
    With wsSheet.OLEObjects("ComboBox1").Object
        .Clear
        .List = vaData
        .ListIndex = -1
    End With
End Sub
```

### วิธีที่ 2: Collection

```vb
Sub Populate_Combobox_Worksheet_Collection()
    'เวิร์กบุ๊กและเวิร์กชีตที่มีข้อมูล รวมทั้งช่วงที่ครอบข้อมูล
    Dim wbBook As Workbook
    Dim wsSheet As Worksheet
    Dim rnData As Range
    Dim vaData As Variant               'รายการที่เก็บใน variant
    Dim ncData As New VBA.Collection    'รายการที่เก็บใน collection
    Dim lnCount As Long                 'ตัวนับสำหรับลูป On Error Resume Next
    Dim vaItem As Variant               'variant แทนชนิดของรายการใน ncData
    'สร้างออบเจ็กต์ Excel
    Set wbBook = ThisWorkbook
    Set wsSheet = wbBook.Worksheets("Sheet2")
    'ใช้ Sheet2 ดึงช่วงของรายการในคอลัมน์ A
    With wsSheet
        Set rnData = .Range(.Range("A2"), .Range("A100").End(xlUp))
    End With
    'ใส่ค่าของรายการลงใน vaData
    vaData = rnData.Value
    'ใส่ค่าจาก vaData ลงใน VBA.Collection
    On Error Resume Next
        For lnCount = 1 To UBound(vaData)
        ncData.Add vaData(lnCount, 1), CStr(vaData(lnCount, 1))
    Next lnCount
    On Error GoTo 0
    'ล้าง combo box (เผื่อเคยรันมาโครมาก่อน)
    'แล้วเพิ่มแต่ละรายการที่ไม่ซ้ำจาก ncData ลง combo box
    With wsSheet.OLEObjects("ComboBox1").Object
        .Clear
        For Each vaItem In ncData
            .AddItem ncData(vaItem)
        Next vaItem
    End With
End Sub
```

**เทคนิค:** วิธีที่ 2 อาศัยคุณสมบัติของ `Collection` ที่ **key ต้องไม่ซ้ำ** การ `Add` ค่าซ้ำจึงเกิด error และ `On Error Resume Next` ข้ามไป เหลือเฉพาะค่าไม่ซ้ำ ส่วนวิธีที่ 1 ใช้ชีตเป็นที่พักชั่วคราว (คอลัมน์ L) จึงต้องล้างทุกครั้ง

---

## 13. ปิด Message Box อัตโนมัติ

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/automatically-dismiss-a-message-box>
*โค้ดตัวอย่างโดย Tom Urtis, Atlas Programming Management*

ตัวอย่างแสดง message box แล้วปิดอัตโนมัติหลังเวลาที่กำหนด (10 วินาที)

```vb
Sub MessageBoxTimer()
    Dim AckTime As Integer, InfoBox As Object
    Set InfoBox = CreateObject("WScript.Shell")
    'ตั้งให้ message box ปิดหลัง 10 วินาที
    AckTime = 10
    Select Case InfoBox.Popup("Click OK (this window closes automatically after 10 seconds).", _
    AckTime, "This is your Message Box", 0)
        Case 1, -1
            Exit Sub
    End Select
End Sub
```

**เทคนิค:** `MsgBox` ของ VBA ไม่มีตัวจับเวลา จึงใช้เมธอด `Popup` ของออบเจ็กต์ `WScript.Shell` (ผ่าน `CreateObject`) แทน พารามิเตอร์ที่สองคือจำนวนวินาที ค่าที่คืน 1 = ผู้ใช้กด OK, -1 = หมดเวลา

---

## 14. สร้างเมนูกำหนดเองที่เรียกมาโคร

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/create-a-custom-menu-that-calls-a-macro>
*โค้ดตัวอย่างโดย Holy Macro! Books*

ตัวอย่างสร้างเมนูกำหนดเองที่มีสี่ตัวเลือก ซึ่งแต่ละตัวเลือกเรียกมาโครหนึ่งตัว โค้ดต่อไปนี้ (วางในโมดูล `ThisWorkbook`) สร้างเมนูเมื่อเปิดเวิร์กบุ๊กและลบเมื่อปิด

```vb
Option Explicit
Private Sub Workbook_BeforeClose(Cancel As Boolean)
   With Application.CommandBars("Worksheet Menu Bar")
      On Error Resume Next
      .Controls("&MyFunction").Delete
      On Error GoTo 0
   End With
End Sub
Private Sub Workbook_Open()
   Dim objPopUp As CommandBarPopup
   Dim objBtn As CommandBarButton
   With Application.CommandBars("Worksheet Menu Bar")
      On Error Resume Next
      .Controls("MyFunction").Delete
      On Error GoTo 0
      Set objPopUp = .Controls.Add( _
         Type:=msoControlPopup, _
         before:=.Controls.Count, _
         temporary:=True)
   End With
   objPopUp.Caption = "&MyFunction"
   Set objBtn = objPopUp.Controls.Add
   With objBtn
      .Caption = "Formula Entry"
      .OnAction = "Cbm_Active_Formula"
      .Style = msoButtonCaption
   End With
   Set objBtn = objPopUp.Controls.Add
   With objBtn
      .Caption = "Value Entry"
      .OnAction = "Cbm_Active_Value"
      .Style = msoButtonCaption
   End With
   Set objBtn = objPopUp.Controls.Add
   With objBtn
      .Caption = "Formula Selection"
      .OnAction = "Cbm_Formula_Select"
      .Style = msoButtonCaption
   End With
   Set objBtn = objPopUp.Controls.Add
   With objBtn
      .Caption = "Value Selection"
      .OnAction = "Cbm_Value_Select"
      .Style = msoButtonCaption
   End With
End Sub
```

เมนู "MyFunction" ถูกเพิ่มเมื่อเปิดเวิร์กบุ๊กและลบเมื่อปิด มีสี่ตัวเลือก แต่ละตัวผูกกับมาโคร ฟังก์ชันที่ผู้ใช้กำหนด (UDF) "MyFunction" คูณสามค่าในช่วงเข้าด้วยกันแล้วคืนผลลัพธ์

```vb
Function MyFunction(rng As Range) As Double
   MyFunction = rng(1) * rng(2) * rng(3)
End Function
```

**Formula Entry:** ผูกกับมาโคร `Cbm_Active_Formula` ซึ่งเรียก UDF คูณตัวเลข 3 เซลล์ก่อนหน้าและเก็บผลใน active cell ต้องมีค่าในช่วง B6:D6 และเลือกเซลล์ E6 ก่อนคลิก

```vb
Sub Cbm_Active_Formula()
   'ตั้งค่าตัวแปร
   Dim intLen As Integer, strRng As String
   'ใช้ active cell คือ E6
   With ActiveCell
      'ตรวจว่า offset ก่อนหน้ามีข้อมูลที่ใช้ได้ และมีสามค่า
      If IsEmpty(.Offset(0, -1)) Or .Column < 4 Then
          'ถ้าข้อมูลใช้ไม่ได้ เรียก MyFunction เป็นสูตรโดยตรง แต่ไม่มีพารามิเตอร์
         .Formula = "=MyFunction()"
          Application.SendKeys "{ENTER}"
      Else
         'ถ้าข้อมูลใช้ได้ สร้างช่วงของ 3 เซลล์ก่อนหน้า
         strRng = Range(Cells(.Row, .Column - 3), _
            Cells(.Row, .Column - 1)).Address
         intLen = Len(strRng)
         'เรียก MyFunction เป็นสูตร โดยมีช่วงเป็นพารามิเตอร์
         .Formula = "=MyFunction(" & strRng & ")"
            Application.SendKeys "{ENTER}"
      End If
   End With
End Sub
```

**Value Entry:** ผูกกับ `Cbm_Active_Value` ซึ่งใส่ **ค่า** ที่ UDF คำนวณลงใน active cell (ไม่ใช่สูตร) ต้องมีค่าใน B6:D6 และเลือก E6 ก่อน

```vb
Sub Cbm_Active_Value()
   'ตั้งค่าตัวแปร
   Dim intLen As Integer, strRng As String
   'ใช้ active cell คือ E6
   With ActiveCell
      'ถ้าที่ว่างในคอลัมน์ไม่พอ ให้เตือน
      If .Column < 4 Then
         Beep
         MsgBox "The function can be used only starting from column D!"
      'มิฉะนั้นเรียก MyFunction โดยใช้ช่วงของ 3 เซลล์ก่อนหน้า
      Else
         ActiveCell.Value = MyFunction(Range(ActiveCell.Offset(0, -3), _
            ActiveCell.Offset(0, -1)))
      End If
   End With
End Sub
```

**Formula Selection:** ผูกกับ `Cbm_Formula_Select` ใช้ InputBox ให้ผู้ใช้เลือกช่วงที่ UDF จะคำนวณ แล้วเก็บเป็นสูตรใน active cell

```vb
Sub Cbm_Formula_Select()
   'ตั้งค่าตัวแปร
   Dim rng As Range
   'ใช้ InputBox ตั้งช่วงสำหรับ MyFunction พร้อมการจัดการ error อย่างง่าย
   Set rng = Application.InputBox("Range:", Type:=8)
   If rng.Cells.Count <> 3 Then
      MsgBox "Length, width and height are needed -" & _
         vbLf & "please select three cells!"
      Exit Sub
   End If
   'เรียก MyFunction ใน active cell คือ E6
   ActiveCell.Formula = "=MyFunction(" & rng.Address & ")"
End Sub
```

**Value Selection:** ผูกกับ `Cbm_Value_Select` ใช้ InputBox เลือกช่วงเช่นกัน แต่เก็บ **ค่า** ลง active cell โดยตรง

```vb
Sub Cbm_Value_Select()
   'ตั้งค่าตัวแปร
   Dim rng As Range
   'ใช้ InputBox ตั้งช่วงสำหรับ MyFunction พร้อมการจัดการ error อย่างง่าย
   Set rng = Application.InputBox("Range:", Type:=8)
   If rng.Cells.Count <> 3 Then
     MsgBox "Length, width and height are needed -" & _
         vbLf & "please select three cells!"
      Exit Sub
   End If
   'เรียก MyFunction แบบส่งค่า โดยใช้ active cell คือ E6
   ActiveCell.Value = MyFunction(rng)
End Sub
```

**เทคนิค:** เมนูสร้างด้วย `CommandBars("Worksheet Menu Bar").Controls.Add(Type:=msoControlPopup, temporary:=True)` ผูกมาโครด้วย property `OnAction` ลบเมนูตอนปิดเวิร์กบุ๊กและก่อนสร้างใหม่ทุกครั้งเพื่อกันเมนูซ้ำ และ `Application.InputBox(..., Type:=8)` ให้ผู้ใช้เลือกช่วงเซลล์ได้ (หมายเหตุผู้แปล: `CommandBars` ใช้ได้กับ Excel แบบ Ribbon ในรูปแบบเมนูแท็บ **Add-ins** เท่านั้น ส่วนการปรับแต่ง Ribbon จริงต้องใช้ RibbonX)

---

## 15. รายการอาร์กิวเมนต์ของกล่องโต้ตอบในตัว

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/controls-dialogboxes-forms/built-in-dialog-box-argument-lists>

ตารางนี้แสดง **ค่าคงที่ของกล่องโต้ตอบในตัวของ Excel** (ใช้กับ `Application.Dialogs(xlDialog...).Show` ซึ่งรับอาร์กิวเมนต์ตามรายการ) กับ **รายการอาร์กิวเมนต์** ของกล่องนั้น ตารางทั้งหมดเป็นตัวระบุภาษาอังกฤษ จึงคงไว้ตามต้นฉบับทุกบรรทัด (คัดลอกอัตโนมัติจากไฟล์ต้นฉบับ เพื่อไม่ให้พิมพ์ผิด)

ตัวอย่างการใช้งาน (ผู้แปลเพิ่มเอง ไม่ได้อยู่ในต้นฉบับหน้านี้ ตรวจสอบกับเอกสาร `Dialogs.Show` ก่อนใช้งานจริง):

```vb
' เปิดกล่องโต้ตอบ Open พร้อมกำหนดอาร์กิวเมนต์แรก (file_text)
Application.Dialogs(xlDialogOpen).Show "C:\MyFolder\*.xls"
```

| ค่าคงที่ของกล่องโต้ตอบ | รายการอาร์กิวเมนต์ |
| :-- | :-- |
| `xlDialogActivate` | `window_text, pane_num` |
| `xlDialogActiveCellFont` | `font, font_style, size, strikethrough, superscript, subscript, outline, shadow, underline, color, normal, background, start_char, char_count` |
| `xlDialogAddChartAutoformat` | `name_text, desc_text` |
| `xlDialogAddinManager` | `operation_num, addinname_text, copy_logical` |
| `xlDialogAlignment` | `horiz_align, wrap, vert_align, orientation, add_indent` |
| `xlDialogApplyNames` | `name_array, ignore, use_rowcol, omit_col, omit_row, order_num, append_last` |
| `xlDialogApplyStyle` | `style_text` |
| `xlDialogAppMove` | `x_num, y_num` |
| `xlDialogAppSize` | `x_num, y_num` |
| `xlDialogArrangeAll` | `arrange_num, active_doc, sync_horiz, sync_vert` |
| `xlDialogAssignToObject` | `macro_ref` |
| `xlDialogAssignToTool` | `bar_id, position, macro_ref` |
| `xlDialogAttachText` | `attach_to_num, series_num, point_num` |
| `xlDialogAttachToolbars` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogAutoCorrect` | `correct_initial_caps, capitalize_days` |
| `xlDialogAxes` | `x_primary, y_primary, x_secondary, y_secondary` |
| `xlDialogAxes` | `x_primary, y_primary, z_primary` |
| `xlDialogBorder` | `outline, left, right, top, bottom, shade, outline_color, left_color, right_color, top_color, bottom_color` |
| `xlDialogCalculation` | `type_num, iter, max_num, max_change, update, precision, date_1904, calc_save, save_values, alt_exp, alt_form` |
| `xlDialogCellProtection` | `locked, hidden` |
| `xlDialogChangeLink` | `old_text, new_text, type_of_link` |
| `xlDialogChartAddData` | `ref, rowcol, titles, categories, replace, series` |
| `xlDialogChartLocation` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogChartOptionsDataLabels` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogChartOptionsDataTable` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogChartSourceData` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogChartTrend` | `type, ord_per, forecast, backcast, intercept, equation, r_squared, name` |
| `xlDialogChartType` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogChartWizard` | `long, ref, gallery_num, type_num, plot_by, categories, ser_titles, legend, title, x_title, y_title, z_title, number_cats, number_titles` |
| `xlDialogCheckboxProperties` | `value, link, accel_text, accel2_text, 3d_shading` |
| `xlDialogClear` | `type_num` |
| `xlDialogColorPalette` | `file_text` |
| `xlDialogColumnWidth` | `width_num, reference, standard, type_num, standard_num` |
| `xlDialogCombination` | `type_num` |
| `xlDialogConditionalFormatting` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogConsolidate` | `source_refs, function_num, top_row, left_col, create_links` |
| `xlDialogCopyChart` | `size_num` |
| `xlDialogCopyPicture` | `appearance_num, size_num, type_num` |
| `xlDialogCreateNames` | `top, left, bottom, right` |
| `xlDialogCreatePublisher` | `file_text, appearance, size, formats` |
| `xlDialogCustomizeToolbar` | `category` |
| `xlDialogCustomViews` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogDataDelete` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogDataLabel` | `show_option, auto_text, show_key` |
| `xlDialogDataSeries` | `rowcol, type_num, date_num, step_value, stop_value, trend` |
| `xlDialogDataValidation` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogDefineName` | `name_text, refers_to, macro_type, shortcut_text, hidden, category, local` |
| `xlDialogDefineStyle` | `style_text, number, font, alignment, border, pattern, protection` |
| `xlDialogDefineStyle` | `style_text, attribute_num, additional_def_args, ...` |
| `xlDialogDeleteFormat` | `format_text` |
| `xlDialogDeleteName` | `name_text` |
| `xlDialogDemote` | `row_col` |
| `xlDialogDisplay` | `formulas, gridlines, headings, zeros, color_num, reserved, outline, page_breaks, object_num` |
| `xlDialogDisplay` | `cell, formula, value, format, protection, names, precedents, dependents, note` |
| `xlDialogEditboxProperties` | `validation_num, multiline_logical, vscroll_logical, password_logical` |
| `xlDialogEditColor` | `color_num, red_value, green_value, blue_value` |
| `xlDialogEditDelete` | `shift_num` |
| `xlDialogEditionOptions` | `edition_type, edition_name, reference, option, appearance, size, formats` |
| `xlDialogEditSeries` | `series_num, name_ref, x_ref, y_ref, z_ref, plot_order` |
| `xlDialogErrorbarX` | `include, type, amount, minus` |
| `xlDialogErrorbarY` | `include, type, amount, minus` |
| `xlDialogExternalDataProperties` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogExtract` | `unique` |
| `xlDialogFileDelete` | `file_text` |
| `xlDialogFileSharing` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogFillGroup` | `type_num` |
| `xlDialogFillWorkgroup` | `type_num` |
| `xlDialogFilter` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogFilterAdvanced` | `operation, list_ref, criteria_ref, copy_ref, unique` |
| `xlDialogFindFile` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogFont` | `name_text, size_num` |
| `xlDialogFontProperties` | `font, font_style, size, strikethrough, superscript, subscript, outline, shadow, underline, color, normal, background, start_char, char_count` |
| `xlDialogFormatAuto` | `format_num, number, font, alignment, border, pattern, width` |
| `xlDialogFormatChart` | `layer_num, view, overlap, angle, gap_width, gap_depth, chart_depth, doughnut_size, axis_num, drop, hilo, up_down, series_line, labels, vary` |
| `xlDialogFormatCharttype` | `apply_to, group_num, dimension, type_num` |
| `xlDialogFormatFont` | `color, backgd, apply, name_text, size_num, bold, italic, underline, strike, outline, shadow, object_id, start_num, char_num` |
| `xlDialogFormatFont` | `name_text, size_num, bold, italic, underline, strike, color, outline, shadow` |
| `xlDialogFormatFont` | `name_text, size_num, bold, italic, underline, strike, color, outline, shadow, object_id_text, start_num, char_num` |
| `xlDialogFormatLegend` | `position_num` |
| `xlDialogFormatMain` | `type_num, view, overlap, gap_width, vary, drop, hilo, angle, gap_depth, chart_depth, up_down, series_line, labels, doughnut_size` |
| `xlDialogFormatMove` | `x_offset, y_offset, reference` |
| `xlDialogFormatMove` | `x_pos, y_pos` |
| `xlDialogFormatMove` | `explosion_num` |
| `xlDialogFormatNumber` | `format_text` |
| `xlDialogFormatOverlay` | `type_num, view, overlap, gap_width, vary, drop, hilo, angle, series_dist, series_num, up_down, series_line, labels, doughnut_size` |
| `xlDialogFormatSize` | `width, height` |
| `xlDialogFormatSize` | `x_off, y_off, reference` |
| `xlDialogFormatText` | `x_align, y_align, orient_num, auto_text, auto_size, show_key, show_value, add_indent` |
| `xlDialogFormulaFind` | `text, in_num, at_num, by_num, dir_num, match_case, match_byte` |
| `xlDialogFormulaGoto` | `reference, corner` |
| `xlDialogFormulaReplace` | `find_text, replace_text, look_at, look_by, active_cell, match_case, match_byte` |
| `xlDialogFunctionWizard` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogGallery3dArea` | `type_num` |
| `xlDialogGallery3dBar` | `type_num` |
| `xlDialogGallery3dColumn` | `type_num` |
| `xlDialogGallery3dLine` | `type_num` |
| `xlDialogGallery3dPie` | `type_num` |
| `xlDialogGallery3dSurface` | `type_num` |
| `xlDialogGalleryArea` | `type_num, delete_overlay` |
| `xlDialogGalleryBar` | `type_num, delete_overlay` |
| `xlDialogGalleryColumn` | `type_num, delete_overlay` |
| `xlDialogGalleryCustom` | `name_text` |
| `xlDialogGalleryDoughnut` | `type_num, delete_overlay` |
| `xlDialogGalleryLine` | `type_num, delete_overlay` |
| `xlDialogGalleryPie` | `type_num, delete_overlay` |
| `xlDialogGalleryRadar` | `type_num, delete_overlay` |
| `xlDialogGalleryScatter` | `type_num, delete_overlay` |
| `xlDialogGoalSeek` | `target_cell, target_value, variable_cell` |
| `xlDialogGridlines` | `x_major, x_minor, y_major, y_minor, z_major, z_minor, 2D_effect` |
| `xlDialogImportTextFile` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogInsert` | `shift_num` |
| `xlDialogInsertHyperlink` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogInsertNameLabel` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogInsertObject` | `object_class, file_name, link_logical, display_icon_logical, icon_file, icon_number, icon_label` |
| `xlDialogInsertPicture` | `file_name, filter_number` |
| `xlDialogInsertTitle` | `chart, y_primary, x_primary, y_secondary, x_secondary` |
| `xlDialogLabelProperties` | `accel_text, accel2_text, 3d_shading` |
| `xlDialogListboxProperties` | `range, link, drop_size, multi_select, 3d_shading` |
| `xlDialogMacroOptions` | `macro_name, description, menu_on, menu_text, shortcut_on, shortcut_key, function_category, status_bar_text, help_id, help_file` |
| `xlDialogMailEditMailer` | `to_recipients, cc_recipients, bcc_recipients, subject, enclosures, which_address` |
| `xlDialogMailLogon` | `name_text, password_text, download_logical` |
| `xlDialogMailNextLetter` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogMainChart` | `type_num, stack, 100, vary, overlap, drop, hilo, overlap%, cluster, angle` |
| `xlDialogMainChartType` | `type_num` |
| `xlDialogMenuEditor` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogMove` | `x_pos, y_pos, window_text` |
| `xlDialogNew` | `type_num, xy_series, add_logical` |
| `xlDialogNewWebQuery` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogNote` | `add_text, cell_ref, start_char, num_chars` |
| `xlDialogObjectProperties` | `placement_type, print_object` |
| `xlDialogObjectProtection` | `locked, lock_text` |
| `xlDialogOpen` | `file_text, update_links, read_only, format, prot_pwd, write_res_pwd, ignore_rorec, file_origin, custom_delimit, add_logical, editable, file_access, notify_logical, converter` |
| `xlDialogOpenLinks` | `document_text1, document_text2, ..., read_only, type_of_link` |
| `xlDialogOpenMail` | `subject, comments` |
| `xlDialogOpenText` | `file_name, file_origin, start_row, file_type, text_qualifier, consecutive_delim, tab, semicolon, comma, space, other, other_char, field_info` |
| `xlDialogOptionsCalculation` | `type_num, iter, max_num, max_change, update, precision, date_1904, calc_save, save_values` |
| `xlDialogOptionsChart` | `display_blanks, plot_visible, size_with_window` |
| `xlDialogOptionsEdit` | `incell_edit, drag_drop, alert, entermove, fixed, decimals, copy_objects, update_links, move_direction, autocomplete, animations` |
| `xlDialogOptionsGeneral` | `R1C1_mode, dde_on, sum_info, tips, recent_files, old_menus, user_info, font_name, font_size, default_location, alternate_location, sheet_num, enable_under` |
| `xlDialogOptionsListsAdd` | `string_array` |
| `xlDialogOptionsListsAdd` | `import_ref, by_row` |
| `xlDialogOptionsME` | `def_rtl_sheet, crsr_mvmt, show_ctrl_char, gui_lang` |
| `xlDialogOptionsTransition` | `menu_key, menu_key_action, nav_keys, trans_eval, trans_entry` |
| `xlDialogOptionsView` | `formula, status, notes, show_info, object_num, page_breaks, formulas, gridlines, color_num, headers, outline, zeros, hor_scroll, vert_scroll, sheet_tabs` |
| `xlDialogOutline` | `auto_styles, row_dir, col_dir, create_apply` |
| `xlDialogOverlay` | `type_num, stack, 100, vary, overlap, drop, hilo, overlap%, cluster, angle, series_num, auto` |
| `xlDialogOverlayChartType` | `type_num` |
| `xlDialogPageSetup` | `head, foot, left, right, top, bot, hdng, grid, h_cntr, v_cntr, orient, paper_size, scale, pg_num, pg_order, bw_cells, quality, head_margin, foot_margin, notes, draft` |
| `xlDialogPageSetup` | `head, foot, left, right, top, bot, size, h_cntr, v_cntr, orient, paper_size, scale, pg_num, bw_chart, quality, head_margin, foot_margin, draft` |
| `xlDialogPageSetup` | `head, foot, left, right, top, bot, orient, paper_size, scale, quality, head_margin, foot_margin, pg_num` |
| `xlDialogParse` | `parse_text, destination_ref` |
| `xlDialogPasteNames` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPasteSpecial` | `paste_num, operation_num, skip_blanks, transpose` |
| `xlDialogPasteSpecial` | `rowcol, titles, categories, replace, series` |
| `xlDialogPasteSpecial` | `paste_num` |
| `xlDialogPasteSpecial` | `format_text, pastelink_logical, display_icon_logical, icon_file, icon_number, icon_label` |
| `xlDialogPatterns` | `apattern, afore, aback, newui` |
| `xlDialogPatterns` | `lauto, lstyle, lcolor, lwt, hwidth, hlength, htype` |
| `xlDialogPatterns` | `bauto, bstyle, bcolor, bwt, shadow, aauto, apattern, afore, aback, rounded, newui` |
| `xlDialogPatterns` | `bauto, bstyle, bcolor, bwt, shadow, aauto, apattern, afore, aback, invert, apply, newfill` |
| `xlDialogPatterns` | `lauto, lstyle, lcolor, lwt, tmajor, tminor, tlabel` |
| `xlDialogPatterns` | `lauto, lstyle, lcolor, lwt, apply, smooth` |
| `xlDialogPatterns` | `lauto, lstyle, lcolor, lwt, mauto, mstyle, mfore, mback, apply, smooth` |
| `xlDialogPatterns` | `type, picture_units, apply` |
| `xlDialogPhonetic` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPivotCalculatedField` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPivotCalculatedItem` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPivotClientServerSet` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPivotFieldGroup` | `start, end, by, periods` |
| `xlDialogPivotFieldProperties` | `name, pivot_field_name, new_name, orientation, function, formats` |
| `xlDialogPivotFieldUngroup` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPivotShowPages` | `name, page_field` |
| `xlDialogPivotSolveOrder` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPivotTableOptions` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPivotTableWizard` | `type, source, destination, name, row_grand, col_grand, save_data, apply_auto_format, auto_page, reserved` |
| `xlDialogPlacement` | `placement_type` |
| `xlDialogPrint` | `range_num, from, to, copies, draft, preview, print_what, color, feed, quality, y_resolution, selection, printer_text, print_to_file, collate` |
| `xlDialogPrinterSetup` | `printer_text` |
| `xlDialogPrintPreview` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPromote` | `rowcol` |
| `xlDialogProperties` | `title, subject, author, keywords, comments` |
| `xlDialogProtectDocument` | `contents, windows, password, objects, scenarios` |
| `xlDialogProtectSharing` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPublishAsWebPage` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogPushbuttonProperties` | `default_logical, cancel_logical, dismiss_logical, help_logical, accel_text, accel_text2` |
| `xlDialogReplaceFont` | `font_num, name_text, size_num, bold, italic, underline, strike, color, outline, shadow` |
| `xlDialogRoutingSlip` | `recipients, subject, message, route_num, return_logical, status_logical` |
| `xlDialogRowHeight` | `height_num, reference, standard_height, type_num` |
| `xlDialogRun` | `reference, step` |
| `xlDialogSaveAs` | `document_text, type_num, prot_pwd, backup, write_res_pwd, read_only_rec` |
| `xlDialogSaveCopyAs` | `document_text` |
| `xlDialogSaveNewObject` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogSaveWorkbook` | `document_text, type_num, prot_pwd, backup, write_res_pwd, read_only_rec` |
| `xlDialogSaveWorkspace` | `name_text` |
| `xlDialogScale` | `cross, cat_labels, cat_marks, between, max, reverse` |
| `xlDialogScale` | `min_num, max_num, major, minor, cross, logarithmic, reverse, max` |
| `xlDialogScale` | `cat_labels, cat_marks, reverse, between` |
| `xlDialogScale` | `series_labels, series_marks, reverse` |
| `xlDialogScale` | `min_num, max_num, major, minor, cross, logarithmic, reverse, min` |
| `xlDialogScenarioAdd` | `scen_name, value_array, changing_ref, scen_comment, locked, hidden` |
| `xlDialogScenarioCells` | `changing_ref` |
| `xlDialogScenarioEdit` | `scen_name, new_scenname, value_array, changing_ref, scen_comment, locked, hidden` |
| `xlDialogScenarioMerge` | `source_file` |
| `xlDialogScenarioSummary` | `result_ref, report_type` |
| `xlDialogScrollbarProperties` | `value, min, max, inc, page, link, 3d_shading` |
| `xlDialogSelectSpecial` | `type_num, value_type, levels` |
| `xlDialogSendMail` | `recipients, subject, return_receipt` |
| `xlDialogSeriesAxes` | `axis_num` |
| `xlDialogSeriesOptions` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogSeriesOrder` | `chart_num, old_series_num, new_series_num` |
| `xlDialogSeriesShape` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogSeriesX` | `x_ref` |
| `xlDialogSeriesY` | `name_ref, y_ref` |
| `xlDialogSetBackgroundPicture` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogSetPrintTitles` | `titles_for_cols_ref, titles_for_rows_ref` |
| `xlDialogSetUpdateStatus` | `link_text, status, type_of_link` |
| `xlDialogShowDetail` | `rowcol, rowcol_num, expand, show_field` |
| `xlDialogShowToolbar` | `bar_id, visible, dock, x_pos, y_pos, width, protect, tool_tips, large_buttons, color_buttons` |
| `xlDialogSize` | `width, height, window_text` |
| `xlDialogSort` | `orientation, key1, order1, key2, order2, key3, order3, header, custom, case` |
| `xlDialogSort` | `orientation, key1, order1, type, custom` |
| `xlDialogSortSpecial` | `sort_by, method, key1, order1, key2, order2, key3, order3, header, order, case` |
| `xlDialogSplit` | `col_split, row_split` |
| `xlDialogStandardFont` | `name_text, size_num, bold, italic, underline, strike, color, outline, shadow` |
| `xlDialogStandardWidth` | `standard_num` |
| `xlDialogStyle` | `bold, italic` |
| `xlDialogSubscribeTo` | `file_text, format_num` |
| `xlDialogSubtotalCreate` | `at_change_in, function_num, total, replace, pagebreaks, summary_below` |
| `xlDialogSummaryInfo` | `title, subject, author, keywords, comments` |
| `xlDialogTable` | `row_ref, column_ref` |
| `xlDialogTabOrder` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogTextToColumns` | `destination_ref, data_type, text_delim, consecutive_delim, tab, semicolon, comma, space, other, other_char, field_info` |
| `xlDialogUnhide` | `window_text` |
| `xlDialogUpdateLink` | `link_text, type_of_link` |
| `xlDialogVbaInsertFile` | `filename_text` |
| `xlDialogVbaMakeAddIn` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogVbaProcedureDefinition` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogView3d` | `elevation, perspective, rotation, axes, height%, autoscale` |
| `xlDialogWebOptionsEncoding` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogWebOptionsFiles` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogWebOptionsFonts` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogWebOptionsGeneral` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogWebOptionsPictures` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogWindowMove` | `x_pos, y_pos, window_text` |
| `xlDialogWindowSize` | `width, height, window_text` |
| `xlDialogWorkbookAdd` | `name_array, dest_book, position_num` |
| `xlDialogWorkbookCopy` | `name_array, dest_book, position_num` |
| `xlDialogWorkbookInsert` | `type_num` |
| `xlDialogWorkbookMove` | `name_array, dest_book, position_num` |
| `xlDialogWorkbookName` | `oldname_text, newname_text` |
| `xlDialogWorkbookNew` | (ไม่มีอาร์กิวเมนต์) |
| `xlDialogWorkbookOptions` | `sheet_name, bound_logical, new_name` |
| `xlDialogWorkbookProtect` | `structure, windows, password` |
| `xlDialogWorkbookTabSplit` | `ratio_num` |
| `xlDialogWorkbookUnhide` | `sheet_text` |
| `xlDialogWorkgroup` | `name_array` |
| `xlDialogWorkspace` | `fixed, decimals, r1c1, scroll, status, formula, menu_key, remote, entermove, underlines, tools, notes, nav_keys, menu_key_action, drag_drop, show_info` |
| `xlDialogZoom` | `magnification` |

> ข้างต้นมี 258 แถว บางค่าคงที่ปรากฏหลายแถวเพราะมีรายการอาร์กิวเมนต์หลายรูปแบบตามบริบท (เช่น `xlDialogPatterns`, `xlDialogFormatFont`)

---

## 16. สรุปเทคนิค

ข้อ 1–4 มาจากตัวอย่างในต้นฉบับ ข้อ 5 เป็นข้อสังเกตของผู้แปล

1. เก็บค่าที่ผู้ใช้กรอกลงตัวแปรระดับโมดูลก่อน `Unload Me` เพราะค่าของตัวควบคุมหายเมื่อฟอร์มถูก unload (หัวข้อ 7)
2. กำหนดค่าเริ่มต้นของตัวควบคุมใน event `UserForm_Initialize` เพื่อให้ฟอร์มพกพาไปโปรเจกต์อื่นได้ (หัวข้อ 5)
3. บนชีต ใช้ **code name** ในชื่อ event แต่ใช้ **ชื่อ shape** เมื่อคืนตัวควบคุมจาก `Shapes`/`OLEObjects` (หัวข้อ 11)
4. ใช้ `Collection` ที่มี key ไม่ซ้ำร่วมกับ `On Error Resume Next` เพื่อกรองค่าซ้ำ (หัวข้อ 12)
5. หากต้องการเรียกกล่องโต้ตอบในตัวของ Excel ให้ใช้ `Application.Dialogs(xlDialog...)` ตามรายการในหัวข้อ 15

---

> ต้นฉบับ © Microsoft เผยแพร่บน Microsoft Learn (MicrosoftDocs/VBA-Docs) เอกสารนี้เป็นฉบับแปลเพื่อการศึกษา โปรดเทียบกับต้นฉบับเมื่อใช้งานจริง
