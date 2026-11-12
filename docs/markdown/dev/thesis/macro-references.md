# แหล่งอ้างอิง: การใช้ Macro (VBA) กับไฟล์ Excel ของระบบ

เอกสารประกอบการตัดสินใจว่าระบบติดตามและประเมินผลลัพธ์การเรียนรู้ระดับรายวิชา (CMAS) ควรใช้ Macro หรือไม่
รวบรวมเมื่อ 12 พฤศจิกายน 2569 (2026-11-12)

**ข้อสรุป:** ระบบไม่ใช้ Macro ไฟล์ที่ส่งออกเป็น `.xlsx` ธรรมดา การให้หน้าเว็บอัปเดตตาม Excel ใช้ความสามารถของเบราว์เซอร์อ่านไฟล์ที่ผู้ใช้เลือก
Macro ทำได้ในทางเทคนิค แต่ต้องตั้งค่าเพิ่มที่เครื่องผู้ใช้หรือฝ่าย IT, ใช้ไม่ได้บน Excel บนเว็บ และต้องเก็บสิทธิ์เข้าระบบไว้กับไฟล์

## ระดับความน่าเชื่อถือของแหล่ง

| ระดับ | ความหมาย |
| --- | --- |
| **ก** | เอกสารทางการของ Microsoft ที่ผู้จัดทำอ่านทั้งหน้าแล้ว |
| **ข** | เอกสารทางการของ Microsoft ที่ตรวจจากสรุปผลการค้นหา ควรเปิดอ่านต้นฉบับก่อนอ้างในเล่ม |
| **ค** | ความเห็นจากชุมชนผู้ใช้ (Microsoft Q&A, บทความ, ฟอรัม) ไม่ใช่เอกสารทางการ ใช้ประกอบได้เท่านั้น |

---

## 1. Office บล็อก Macro ในไฟล์ที่มาจากอินเทอร์เน็ต และวิธีปลดบล็อก

| ระดับ | แหล่ง | สาระสำคัญ |
| --- | --- | --- |
| ก | [Macros from the internet are blocked by default in Office](https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked) (Microsoft Learn) | ดูรายละเอียดด้านล่าง |

**สาระสำคัญ**

- Windows ติดเครื่องหมาย **Mark of the Web** ให้ไฟล์ที่มาจากตำแหน่งที่ไม่น่าเชื่อถือ เช่น ไฟล์ที่ดาวน์โหลดผ่านเบราว์เซอร์หรือไฟล์แนบอีเมล
  ไฟล์ที่ส่งออกจากระบบแล้วดาวน์โหลดลงเครื่องจึงเข้าข่ายนี้
- เมื่อเปิดไฟล์ที่มี Macro ผู้ใช้เห็นแถบ **SECURITY RISK** และ **ไม่มีปุ่ม Enable Content** แบบเดิมแล้ว
- วิธีที่ Microsoft ระบุให้ Macro ในไฟล์ที่เชื่อถือทำงานได้:

  | กรณี | วิธี |
  | --- | --- |
  | ไฟล์ทีละไฟล์ | Properties → แท็บ General → **Unblock** หรือคำสั่ง PowerShell `Unblock-File` |
  | ไฟล์จากเครือข่ายหรือเว็บไซต์ที่เชื่อถือ | ปลดบล็อกทีละไฟล์ หรือกำหนดตำแหน่งนั้นเป็น **Trusted site** / เพิ่มเข้า **Local intranet** zone |
  | ไฟล์บน OneDrive / SharePoint | เปิดด้วย **Open in Desktop App** · ไฟล์ที่โปรแกรม OneDrive ซิงก์ลงเครื่องไม่มี Mark of the Web · หรือกำหนดโดเมนเป็น Trusted site |
  | ไฟล์ในโฟลเดอร์บนเครื่อง | กำหนดโฟลเดอร์เป็น **Trusted Location** |
  | Macro ที่เซ็นชื่อ | ติดตั้งใบรับรองของผู้เผยแพร่ที่เชื่อถือบนเครื่องผู้ใช้ (Microsoft แนะนำให้ผู้ดูแลระบบเป็นผู้จัดการ) |
  | Excel add-in (`.xla`, `.xlam`) | ปลด Mark of the Web หรือวางใน Trusted Location · **การเซ็นชื่อใช้ไม่ได้กับ Excel add-in ที่มี Mark of the Web** |

- ผู้ดูแลระบบตั้งค่าให้ทั้งองค์กรได้ด้วย Group Policy (Site to Zone Assignment List) · Cloud Policy · Intune
- ถ้าองค์กรเปิดนโยบาย **Block macros from running in Office files from the Internet** ผู้ใช้จะเปิดเองไม่ได้
- การกำหนด Trusted site ให้สิทธิ์ยกระดับกับทั้งไซต์ ไม่ใช่เฉพาะ Office · Trusted Location ข้ามการตรวจทั้งหมด จึงควรใช้เท่าที่จำเป็น
- การเปลี่ยนแปลงนี้มีผลกับ **Office บน Windows** เท่านั้น ไม่กระทบ Office บน Mac มือถือ หรือเว็บ

**ผลต่อระบบ:** Macro ใช้ได้ แต่ต้องมีขั้นตอนเพิ่มที่เครื่องผู้ใช้หรือฝ่าย IT ซึ่งขัดกับเป้าหมายที่ผู้สอนต้องนำเข้าคะแนนได้ภายใน 10 นาทีโดยไม่ต้องมีคู่มือ (NFR-09)

---

## 2. Excel บนเว็บกับ VBA

| ระดับ | แหล่ง | สาระสำคัญ |
| --- | --- | --- |
| ข | [Excel for the web – Service Descriptions](https://learn.microsoft.com/en-us/office365/servicedescriptions/office-online-service-description/excel-online) (Microsoft Learn) | Excel บนเว็บ **สร้างหรือรัน Macro VBA ไม่ได้** เปิดไฟล์ที่มี VBA ได้โดยโค้ดไม่หาย |
| ข | [Differences between Office Scripts and VBA macros](https://learn.microsoft.com/en-us/office/dev/scripts/resources/vba-differences) (Microsoft Learn) | ทางเลือกบนเว็บคือ Office Scripts (TypeScript) · ไม่มีอีเวนต์ระดับ Excel · ต้องมีไลเซนส์องค์กรหรือการศึกษา |

**ผลต่อระบบ:** ผู้สอนที่เปิดไฟล์ผ่าน Excel บนเว็บจะใช้ Macro ไม่ได้

---

## 3. VBA บน Excel สำหรับ Mac

| ระดับ | แหล่ง | สาระสำคัญ |
| --- | --- | --- |
| ข | [Office for Mac for Visual Basic for Applications (VBA)](https://learn.microsoft.com/en-us/office/vba/api/overview/office-mac) (Microsoft Learn) | Excel บน Mac **รัน VBA ได้** · Office บน Mac ทำงานใน sandbox จำกัดการเข้าถึงไฟล์และโปรแกรมอื่น (เอกสารยุค Office 2016) |
| ข | [Run an AppleScript with VB](https://learn.microsoft.com/en-us/office/vba/office-mac/applescripttask) (Microsoft Learn) | เรียกสิ่งนอก Excel ต้องใช้ `AppleScriptTask` · คำสั่ง `MacScript` เดิมเลิกใช้แล้ว |
| ข | [Assign a macro to a Form or a Control button](https://support.microsoft.com/en-us/office/assign-a-macro-to-a-form-or-a-control-button-d58edd7d-cb04-4964-bead-9c72c843a283) (Microsoft Support) | ปุ่มแบบ ActiveX ไม่รองรับบน Mac ต้องใช้ Form controls |
| ค | [Excel 2016 Mac WinHttpRequest replacement](https://learn.microsoft.com/en-us/answers/questions/4907849/excel-2016-mac-winhttprequest-replacement) (Microsoft Q&A) | `WinHttpRequest` ที่ใช้เรียก API บน Windows ไม่ทำงานบน Mac |
| ค | [Send Excel table data to Power Automate using VBA on Mac](https://medium.com/@lance_raeper/send-excel-table-data-to-power-automate-using-vba-on-mac-930329ccfe2e) (Medium) | ทางเลี่ยง: VBA → AppleScript → `curl` |

**ผลต่อระบบ:** Macro ที่ต้องเรียก API ของระบบต้องเขียนแยกสำหรับ Windows และ Mac และบน Mac ต้องติดตั้งไฟล์ AppleScript ไว้ในเครื่องผู้ใช้
(เรื่องการเรียก API บน Mac มีเฉพาะแหล่งระดับ ค ที่ค่อนข้างเก่า ยังไม่พบเอกสารทางการ)

---

## 4. AutoSave

| ระดับ | แหล่ง | สาระสำคัญ |
| --- | --- | --- |
| ข | [What is AutoSave?](https://support.microsoft.com/en-us/office/collab-files/what-is-autosave) (Microsoft Support) | AutoSave ทำงานกับไฟล์ใน **OneDrive, OneDrive for Business หรือ SharePoint Online** · ปิดเมื่อไฟล์อยู่ในเครื่อง (เช่น `C:\`), เป็นรูปแบบเก่า (`.xls`) หรือยังไม่ได้บันทึก |

**ผลต่อระบบ:** การให้หน้าเว็บอัปเดตเองโดยไม่ต้องกด Ctrl+S ต้องเก็บไฟล์ในโฟลเดอร์ OneDrive และเปิด AutoSave
ไฟล์ที่โปรแกรม OneDrive ซิงก์ลงเครื่องยังไม่มี Mark of the Web ด้วย (ข้อ 1)

---

## 5. Power Query (ทางเลือกให้ข้อมูลไหลจากเว็บไป Excel โดยไม่ใช้ Macro)

| ระดับ | แหล่ง | สาระสำคัญ |
| --- | --- | --- |
| ข | [Connection properties](https://support.microsoft.com/en-us/office/connection-properties-9d3599a9-e9b3-461d-99b2-c5505ddae6e0) (Microsoft Support) | ตั้ง **Refresh every N minutes** และ **Enable background refresh** ได้ที่แท็บ Usage |
| ข | [Refresh an external data connection in Excel](https://support.microsoft.com/en-us/office/refresh-an-external-data-connection-in-excel-1524175f-777a-48fc-8fc7-c8514b984440) (Microsoft Support) | วิธีรีเฟรชข้อมูลจากแหล่งภายนอก |
| ข | [Power Query Web connector](https://learn.microsoft.com/en-us/power-query/connectors/web/web) (Microsoft Learn) | ดึงข้อมูลจากเว็บหรือ API · มีวิธียืนยันตัวตนแบบ Web API (API key) ใน Power Query บน Excel |
| ข | [Handling authentication for Power Query connectors](https://learn.microsoft.com/en-us/power-query/handling-authentication) (Microsoft Learn) | รูปแบบการยืนยันตัวตนของ Power Query |
| ค | Microsoft Q&A (จากผลการค้นหา) | การรีเฟรชอัตโนมัติทำงานเฉพาะเมื่อเปิดไฟล์ค้างไว้ |

**ผลต่อระบบ:** ถ้าต้องการให้การแก้ในเว็บไปปรากฏใน Excel ทำได้โดยไม่ใช้ Macro เมื่อแอปจริงมี API สำหรับอ่านคะแนน
ข้อจำกัดที่ผู้จัดทำประเมิน (ยังไม่ได้ทดลอง): Power Query ดึงข้อมูลเข้าเป็นตารางของตัวเอง ไม่ได้เติมลงช่องในแบบฟอร์มคะแนนที่ป้องกันแผ่นงานไว้

---

## สรุปข้อความกับระดับหลักฐาน

| ข้อความ | ระดับ |
| --- | --- |
| Office บล็อก Macro ในไฟล์ที่ดาวน์โหลดมาโดยค่าเริ่มต้น | ก |
| ปลดบล็อกได้ด้วย Unblock / Trusted Location / Trusted site / OneDrive / เซ็นชื่อ | ก |
| การเซ็นชื่อใช้ไม่ได้กับ Excel add-in ที่ดาวน์โหลดมา | ก |
| Excel บนเว็บรัน VBA ไม่ได้ | ข |
| Excel บน Mac รัน VBA ได้ แต่มี sandbox และไม่มี ActiveX | ข |
| VBA บน Mac เรียก API ด้วยวิธีแบบ Windows ไม่ได้ | ค |
| AutoSave ต้องใช้ OneDrive / SharePoint | ข |
| Power Query รีเฟรชอัตโนมัติทุก N นาทีได้ | ข |

เอกสารภายในโปรเจกต์ที่เกี่ยวข้อง: [excel-sync-plan.md](../planning/excel-sync-plan.md) (การเชื่อมไฟล์ Excel: การใช้งาน ข้อจำกัด ความปลอดภัย) ·
[office-addin-plan.md](../planning/office-addin-plan.md) (เหตุผลที่ไม่เลือก Office Add-in) ·
[srs.md](../requirements/srs.md) (NFR-05, NFR-08, NFR-09, NFR-12, NFR-16)
