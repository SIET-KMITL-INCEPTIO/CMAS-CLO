# Excel VBA: แนวคิดขั้นสูง (PowerPivot Model, Coauthoring, ภาษาเฉพาะ, OLE DB for OLAP, SDI)

> ฉบับแปลภาษาไทยจาก Microsoft Learn ส่วน Concepts ห้าหัวข้อแรกในสารบัญ
> สารบัญต้นทาง: <https://learn.microsoft.com/en-us/office/vba/excel/concepts/miscellaneous/concepts-excel-vba-reference>
> หน้า Overview: <https://learn.microsoft.com/en-us/office/vba/api/overview/excel>
> ต้นฉบับ Markdown: <https://github.com/MicrosoftDocs/VBA-Docs/tree/main/excel/Concepts> (ไฟล์ระดับบนสุดของโฟลเดอร์)
>
> คงชื่อ object / property / method เป็นอังกฤษ ทุกหัวข้อมีบรรทัด **อ้างอิง**
> **รูปภาพ** ในต้นฉบับไม่ได้คัดลอกมา ดูได้ที่หน้าต้นฉบับ

## สารบัญ

1. [PowerPivot Model object ใน Excel](#1-powerpivot-model-object-ใน-excel)
2. [Coauthoring ใน Excel](#2-coauthoring-ใน-excel)
3. [ฟังก์ชัน method และ property เฉพาะภาษา](#3-ฟังก์ชัน-method-และ-property-เฉพาะภาษา)
4. [คุณสมบัติ OLE DB for OLAP ที่ Excel ใช้](#4-คุณสมบัติ-ole-db-for-olap-ที่-excel-ใช้)
5. [การเขียนโปรแกรมสำหรับ Single Document Interface (SDI)](#5-การเขียนโปรแกรมสำหรับ-single-document-interface-sdi)

---

## 1. PowerPivot Model object ใน Excel

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/about-the-powerpivot-model-object-in-excel>

เรียนรู้เกี่ยวกับโมเดลของ add-in PowerPivot และออบเจ็กต์โมเดลของมันใน Excel

add-in PowerPivot ช่วยให้สร้างลูกบาศก์ข้อมูล (cube) ของตัวเองแบบมองเห็นภาพได้ data cube คืออาร์เรย์ของข้อมูลที่กำหนดเป็นมิติหรือเลเยอร์ ออบเจ็กต์ **Model** ใน Excel ที่ add-in PowerPivot ทำให้เกิดขึ้น เป็นพื้นฐานในการโหลดและรวมข้อมูลต้นทางจากหลายแหล่งเพื่อวิเคราะห์ข้อมูลบนเดสก์ท็อป ได้แก่ ฐานข้อมูลเชิงสัมพันธ์ แหล่งหลายมิติ บริการคลาวด์ data feed ไฟล์ Excel ไฟล์ข้อความ และข้อมูลจากเว็บ Excel รวมแหล่งข้อมูลเพิ่มเติมและทำให้รวมข้อมูลจากหลายแหล่งได้

การสร้างและลบ PowerPivot Model (PPM) ถูกกระตุ้นด้วยการกระทำของผู้ใช้ และ **นักพัฒนาสร้างโดยตรงไม่ได้**

### ความสัมพันธ์ (Relationships)

ในบทความนี้ เรียกการเชื่อมต่อระหว่างสองตารางที่กำหนดวิธีสัมพันธ์ของข้อมูลว่า *relationships* ความสัมพันธ์ผูกข้อมูลจากแหล่งที่เดิมไม่เกี่ยวข้องกันเข้าด้วยกัน แต่ละความสัมพันธ์มี *Primary Key* และ *Foreign Key* ช่วยให้ข้อมูลรวมเป็นโมเดลเดียว ซึ่งทำให้:

- กรองข้อมูลในตารางหนึ่งด้วยข้อมูลของตารางที่สัมพันธ์กัน
- กรองข้อมูลด้วยคอลัมน์ที่สัมพันธ์กัน
- รวมคอลัมน์จากหลายตารางไว้ใน PivotTable/PivotChart
- เวิร์กบุ๊กเล็กลง เพราะไม่ต้องทำซ้ำข้อมูล

### มีโมเดลได้เพียงโมเดลเดียว

Excel ที่มี add-in PowerPivot สร้างโมเดลเดียวในเวิร์กบุ๊ก ซึ่งเพิ่มแหล่งข้อมูล สร้าง แก้ไข และเชื่อมโยงตารางได้ **มีโมเดลได้เพียงโมเดลเดียวต่อเวิร์กบุ๊ก**

### ทำงานกับแหล่งข้อมูล OLAP

เมื่อเชื่อมต่อแหล่งข้อมูล OLAP เช่น Analysis Services และสร้าง OLAP PivotTable, PivotChart, Slicer หรือฟังก์ชัน Cube จะ **ไม่มีการสร้างโมเดล** เวิร์กบุ๊กที่สร้างด้วย add-in PowerPivot อัปโหลดไปยัง SharePoint โหลดในหน่วยความจำบนเซิร์ฟเวอร์ และให้เวิร์กบุ๊กอื่นเข้าถึงได้เหมือนอินสแตนซ์ปกติของ SQL Server Analysis Services

### สิ่งที่กระตุ้นการสร้าง PowerPivot Model

โดยค่าเริ่มต้น ไฟล์ XLSX ใน Excel 2010 และ Excel ไม่มี PPM ที่ถูกกำหนดค่าเริ่มต้นจนกว่าจะเห็นว่าจำเป็น การกระทำบางอย่างกระตุ้นการสร้าง PPM ถ้ายังไม่มีโมเดลในเวิร์กบุ๊ก

**1) เพิ่มแหล่งข้อมูลใหม่ที่ไม่ใช่แบบ legacy**

ทุกครั้งที่นำเข้าข้อมูลบางชนิด จะสร้างโมเดลใหม่ในเวิร์กบุ๊ก (ถ้ายังไม่มี) ที่เก็บคุณสมบัติการเชื่อมต่อ การแสดงแหล่งข้อมูลของเวิร์กบุ๊กเป็นตาราง และความสัมพันธ์ระหว่างกัน รวมถึงแหล่งข้อมูลภายในอย่างช่วงและตาราง ตารางต่อไปนี้แสดงแหล่งข้อมูลที่ผสานกับ PPM ได้

| แหล่งข้อมูล | คำอธิบาย | ดูตัวอย่างตาราง | รองรับ Query |
| :-- | :-- | :-- | :-- |
| Microsoft SQL Server | รองรับใน Excel อยู่แล้ว | ได้ | ได้ |
| Microsoft SQL Azure Data Market | รองรับเป็น data feed ใหม่ | ได้ | ไม่ |
| Microsoft SQL Server Parallel Data Warehouse | รองรับผ่านไดรเวอร์ OLE DB ที่ติดตั้ง | ได้ | ได้ |
| Microsoft Access | รองรับใน Excel อยู่แล้ว | ได้ | ได้ |
| Oracle | รองรับใน Excel อยู่แล้ว | ได้ | ได้ |
| Teradata | ใช้ได้ถ้าติดตั้งไดรเวอร์ OLE DB หรือ ODBC | ไม่ | ไม่ |
| Sybase | ใช้ได้ถ้าติดตั้งไดรเวอร์ OLE DB หรือ ODBC | ไม่ | ไม่ |
| Informix | ใช้ได้ถ้าติดตั้งไดรเวอร์ OLE DB หรือ ODBC | ไม่ | ไม่ |
| IBM Db2 | ใช้ได้ถ้าติดตั้งไดรเวอร์ OLE DB หรือ ODBC | ไม่ | ไม่ |
| Microsoft Analysis Services | รองรับใน Excel อยู่แล้ว | ได้ | ได้ |
| Report (SSRS) | อ่านและใช้การเชื่อมต่อได้ แต่สร้างใน Excel client ไม่ได้ | ได้ | ไม่ |
| Text | จากกล่องโต้ตอบ Excel ใน Ribbon | ได้ | ไม่ |
| Data Feeds (OData) | รองรับเป็นแหล่งข้อมูลใหม่ | ได้ | ได้ |
| XML | รองรับใน Excel อยู่แล้ว | ไม่ | ไม่ |
| SharePoint Lists | รองรับใน Excel อยู่แล้ว Excel ใช้ผู้ให้บริการ **DataFeed** เชื่อมต่อ SharePoint | ไม่ | ไม่ |
| SharePoint | ฟีเจอร์ใหม่ใน Excel | ได้ | ได้ |
| Excel Tables | ตารางที่ผู้ใช้กำหนดใน Excel ใช้กับฟีเจอร์ข้อมูลใหม่ การเชื่อมต่อข้อมูลเวิร์กชีตถูกสร้างกับตารางเมื่อสร้างตาราง | N/A | N/A |
| Excel Ranges | ช่วงที่ผู้ใช้กำหนดใน Excel ใช้กับฟีเจอร์ข้อมูลใหม่ การเชื่อมต่อข้อมูลเวิร์กชีตถูกสร้างเฉพาะเมื่อฟีเจอร์ข้อมูล เช่น แผนภูมิหรือ PivotTable ใช้ช่วงนั้น | N/A | N/A |

**2) สร้าง PivotTable ใหม่ที่ไม่ใช่ OLAP** — PivotTable ใหม่ของ Excel ที่ไม่ได้สร้างจากแหล่ง OLAP จะอิง PPM ดังนั้นถ้าไฟล์ไม่มี PPM จะสร้างใหม่ระหว่างสร้าง PivotTable ซึ่งรวมถึง: ใช้ UI แทรก PivotTable, ใช้ UI สรุปข้อมูลด้วย PivotTable, และ PivotTable ที่อิงแหล่งที่ไม่ใช่ OLAP ซึ่งสร้างผ่านออบเจ็กต์โมเดล VBA

**3) สร้าง PivotChart ใหม่ที่ไม่ใช่ OLAP** — ใน Excel PivotTable และ PivotChart ไม่ต้องผูกกันอีกต่อไป ดังนั้นเมื่อแทรก PivotChart ในเวิร์กบุ๊กที่ไม่มีโมเดล จะสร้าง PPM

**4) วาง PivotTable ที่ไม่ใช่ OLAP จากเวิร์กบุ๊กอื่น** — เมื่อวาง PivotTable หรือ PivotChart จากเวิร์กบุ๊กอื่นที่อิง PPM ลงในเวิร์กบุ๊กที่ไม่มี PPM จะสร้าง PPM ใหม่ในเวิร์กบุ๊กปลายทาง และเพิ่มแหล่งข้อมูลใหม่ในโมเดลที่ชี้ไปยังข้อมูลพื้นฐานของ PivotTable/PivotChart ต้นทาง

### ยกเลิก (Undo) การสร้าง PowerPivot Model

การกระทำทั้งหมดที่นำไปสู่การสร้าง PPM ยกเลิกได้ ถ้าเลือกจากเมนู Undo การสร้างโมเดลจริงจะไม่ถูกยกเลิก แต่จะไม่มีอะไรถูกเพิ่มเข้าไป โมเดลจึงว่างอยู่ เมื่อบันทึกเวิร์กบุ๊ก ถ้าโมเดลว่าง โมเดลจะไม่ถูกบันทึกไปกับไฟล์ **ไม่มีวิธีลบโมเดลที่สร้างในเวิร์กบุ๊กด้วยตนเองอย่างชัดเจน**

> **หมายเหตุ:** เช่นเดียวกับ Excel 2010 มีข้อจำกัดเรื่องขนาดโมเดลที่ Undo ได้ เมื่อโมเดลโตถึงขนาดจำกัด จะไม่มี Undo สำหรับการกระทำเช่นรีเฟรช ขีดจำกัดปัจจุบันของ PivotTable แบบเนทีฟคือ 300,000 แถว ที่ 28 ไบต์ต่อเซลล์ ราวประมาณ 8 MB ในหน่วยความจำ ตั้งค่าเหล่านี้ได้ที่ **Advanced Options** ของ Excel *(รูปในต้นฉบับ)*

### ออบเจ็กต์โมเดลของ PowerPivot Model

เวิร์กบุ๊กมีออบเจ็กต์ **Model** ได้หนึ่งตัวเท่านั้น ออบเจ็กต์ **Model** เป็นออบเจ็กต์ระดับบนสุดที่มีการเชื่อมต่อ ความสัมพันธ์ และตารางทั้งหมด

สร้างโมเดลในเวิร์กบุ๊กด้วยตนเองไม่ได้ การสร้างถูกกระตุ้นด้วยการกระทำที่อธิบายข้างต้น ถ้าทำการกระทำเหล่านี้ผ่านออบเจ็กต์โมเดล (OM) จะสร้างโมเดลใหม่ จุดประสงค์ของ OM นี้คือสร้างความสัมพันธ์ระหว่างตารางในโมเดลด้วยโปรแกรม ทำให้ได้ตารางที่ join กัน รวม PivotTable และอื่น ๆ ซึ่งต้องสำรวจโมเดลเพื่อหาตารางที่เหมาะสม และคอลัมน์ในตารางที่จะใช้สร้างความสัมพันธ์

#### Model Object

เก็บการอ้างอิงถึงการเชื่อมต่อของเวิร์กบุ๊กและข้อมูลเกี่ยวกับตารางและความสัมพันธ์ใน PPM

| Property | อ่าน/เขียน | ชนิด | คำอธิบาย |
| :-- | :-- | :-- | :-- |
| Application | อ่านอย่างเดียว | Application | คืนออบเจ็กต์ที่แทนแอปพลิเคชัน Microsoft Excel |
| Creator | อ่านอย่างเดียว | xlCreator | คืนจำนวนเต็ม 32 บิตที่บอกแอปพลิเคชันที่สร้างออบเจ็กต์ |
| Parent | อ่านอย่างเดียว | Object | คืนออบเจ็กต์ที่แทนออบเจ็กต์แม่ของ **Model** |
| ModelTables | อ่านอย่างเดียว | ModelTable | คอลเลกชันของตารางใน PPM |
| ModelRelationships | อ่านอย่างเดียว | ModelRelationships | คอลเลกชันของความสัมพันธ์ระหว่างตารางของ PPM |
| DataModelConnection | N/A | WorkbookConnection | คืนออบเจ็กต์การเชื่อมต่อเวิร์กบุ๊กของโมเดลจากคอลเลกชันการเชื่อมต่อเวิร์กบุ๊กที่เชื่อมต่อกับโมเดล |

**Method ของ Model:**

| Method | พารามิเตอร์ | คำอธิบาย |
| :-- | :-- | :-- |
| **AddConnection** | `ConnectionToDataSource` (บังคับ, WorkbookConnection) | เพิ่มการเชื่อมต่อเวิร์กบุ๊กใหม่ลงในโมเดลด้วยคุณสมบัติเหมือนที่ส่งเป็นอาร์กิวเมนต์ ใช้ได้เฉพาะกับการเชื่อมต่อภายนอกที่ไม่ใช่โมเดล และคืน error ถ้าเรียกด้วยการเชื่อมต่อภายนอกของโมเดล เมื่อเรียก จะสร้างการเชื่อมต่อโมเดลใหม่ ตั้งชื่อเหมือนการเชื่อมต่อ legacy พร้อมเลขจำนวนเต็มต่อท้ายให้ไม่ซ้ำ |
| **CreateModelWorkbookConnection** | `ModelTable` (บังคับ, Variant: ชื่อตารางโมเดลหรือออบเจ็กต์ตารางโมเดล) | คืน **WorkbookConnection** ชนิด **ModelConnection** ซึ่งเชื่อมต่อกับตารางที่ระบุ ใช้ได้เฉพาะกับ query table ใน Excel |
| **Initialize** | ไม่มี | กำหนดค่าเริ่มต้น PPM ถูกเรียกโดยค่าเริ่มต้นเมื่อใช้โมเดลครั้งแรก |
| **Refresh** | ไม่มี | รีเฟรชแหล่งข้อมูลทั้งหมดที่เกี่ยวข้องกับโมเดล ประมวลผลโมเดลใหม่ทั้งหมด และอัปเดตฟีเจอร์ข้อมูลของ Excel ทั้งหมดที่เกี่ยวข้องกับ **Model** |

#### ModelChanges Object

แทนการเปลี่ยนแปลงที่ทำกับ PPM ออบเจ็กต์นี้มีข้อมูลว่าการเปลี่ยนแปลงใดเกิดกับ data model เมื่อ event **Workbook.ModelChange** เกิดหลังการดำเนินการกับโมเดล เมื่อ Excel เปลี่ยน data model อาจมีหลายการเปลี่ยนแปลงในการดำเนินการเดียว และออบเจ็กต์ **ModelChanges** จะรวมข้อมูลของทุกการเปลี่ยนแปลงในการดำเนินการนั้น

| Property | ชนิด | คำอธิบาย |
| :-- | :-- | :-- |
| Application | Application | คืนออบเจ็กต์ที่แทนแอป Excel |
| ColumnsAdded | ModelColumnNames | คอลเลกชันของ **ModelColumnName** ที่แทนทุกคอลัมน์ที่เพิ่มในการดำเนินการกับโมเดล |
| ColumnsChanged | ModelColumnChanges | คอลเลกชันของ **ModelColumnChange** ที่แทนชื่อตารางและชื่อคอลัมน์ของทุกคอลัมน์ที่ชนิดข้อมูลถูกเปลี่ยน |
| ColumnsDeleted | ModelColumnNames | คอลเลกชันของ **ModelColumnName** ที่แทนทุกคอลัมน์ที่ถูกลบ |
| MeasuresAdded | ModelMeasureNames | คอลเลกชันของ **ModelMeasureName** ที่แทนทุก measure ที่เพิ่ม |
| Parent | Object | ออบเจ็กต์แม่ของ **ModelChanges** |
| RelationshipChange | Boolean | **True** เมื่อความสัมพันธ์อย่างน้อยหนึ่งรายการในโมเดลถูกเปลี่ยน (เพิ่ม ลบ หรือแก้ไข) **False** เมื่อไม่มีความสัมพันธ์ใดเปลี่ยน |
| TableNamesChanged | ModelTableNameChanges | คอลเลกชันของ **ModelTableNameChange** ที่แทนชื่อเก่าและใหม่ของทุกตารางที่ถูกเปลี่ยนชื่อ |
| TablesAdded | ModelTableNames | คอลเลกชันชื่อตาราง (สตริง) ของทุกตารางที่เพิ่ม |
| TablesDeleted | ModelTableNames | คอลเลกชันชื่อตาราง (สตริง) ของทุกตารางที่ถูกลบ |
| TablesModified | ModelTableNames | คอลเลกชันชื่อตาราง (สตริง) ของทุกตารางที่ถูกรีเฟรชหรือคำนวณใหม่ |
| UnknownChange | Boolean | **True** เมื่อมีการเปลี่ยนแปลงที่ไม่ได้ระบุเกิดขึ้นกับโมเดลในธุรกรรมโมเดล |

(ทุก property ของ ModelChanges เป็นอ่านอย่างเดียว)

#### คอลเลกชันและออบเจ็กต์สนับสนุน

ทุกคอลเลกชันด้านล่างมี property อ่านอย่างเดียวร่วมกัน: **Application** (คืนออบเจ็กต์ Excel), **Count** (Long: จำนวนออบเจ็กต์ในคอลเลกชัน), **Creator** (xlCreator), **Parent** (ออบเจ็กต์แม่) และ method **Item(Index)** (บังคับ, Variant: หมายเลขหรือชื่อของออบเจ็กต์) ที่คืนออบเจ็กต์หนึ่งตัวจากคอลเลกชัน

| คอลเลกชัน | ออบเจ็กต์ที่เก็บ | คำอธิบาย |
| :-- | :-- | :-- |
| **ModelColumnChanges** | **ModelColumnChange** | คอลัมน์ที่ชนิดข้อมูลเปลี่ยนใน PPM |
| **ModelColumnNames** | **ModelColumnName** | คอลัมน์ของตารางใน PPM |
| **ModelMeasureNames** | **ModelMeasureName** | measure ใน PPM |
| **ModelRelationships** | **ModelRelationship** | ความสัมพันธ์ใน PPM (มี method **Add**) |
| **ModelTables** | **ModelTable** | ตารางใน PPM |
| **ModelTableColumns** | **ModelTableColumn** | คอลัมน์ของ **ModelTable** |
| **ModelTableNames** | **ModelTableName** | ชื่อตารางใน PPM |
| **ModelTableNameChanges** | **ModelTableNameChange** | ตารางที่ถูกเปลี่ยนชื่อใน PPM |

| ออบเจ็กต์ | Property (ทั้งหมดอ่านอย่างเดียวเว้นแต่ระบุ) | คำอธิบาย |
| :-- | :-- | :-- |
| **ModelColumnChange** | ColumnName (String), TableName (String) | แทนคอลัมน์ในตารางใน PPM ที่ชนิดข้อมูลถูกเปลี่ยน |
| **ModelColumnName** | ColumnName (String), TableName (String) | แทนชื่อคอลัมน์ใน PPM |
| **ModelConnection** | ADOConnection, CommandText (อ่าน/เขียน), CommandType (อ่าน/เขียน, xlCmdType) | ข้อมูลของชนิดการเชื่อมต่อโมเดลใหม่ที่ใช้โต้ตอบกับ PPM ที่ผสานในตัว `ADOConnection` ใช้สร้างการเชื่อมต่อแบบเปิดไปยังแหล่งข้อมูล ให้ add-in เช่น PowerViewer สร้างการเชื่อมต่อตรงไปยังเอนจินและโมเดลข้อมูล |
| **ModelMeasureName** | MeasureName (String), TableName (String) | แทนชื่อ measure ใน PPM |
| **ModelRelationship** | Active (อ่าน/เขียน, Boolean), ForeignKeyColumn, ForeignKeyTable, PrimaryKeyColumn, PrimaryKeyTable | แทนความสัมพันธ์ระหว่างออบเจ็กต์ **ModelTableColumn** ใช้ตอนสร้างความสัมพันธ์ด้วยโปรแกรม มี method **Delete** (ไม่มีพารามิเตอร์) ลบความสัมพันธ์ |
| **ModelTable** | ModelTableColumns, Name, RecordCount (Integer: จำนวนแถวทั้งหมด), SourceName (ชื่อตารางที่แหล่งข้อมูล ถ้าตารางไม่มีแหล่งข้อมูลจะคืน error), SourceWorkbookConnection | แทนตารางในออบเจ็กต์ **Model** เป็น **อ่านอย่างเดียว** สร้างหรือแก้ผ่าน OM ไม่ได้ มี method **Refresh** (ไม่มีพารามิเตอร์) รีเฟรชการเชื่อมต่อแหล่งของตารางโมเดล |
| **ModelTableColumn** | DataType (xlParameterDataType), Name | แทนคอลัมน์เดียวในออบเจ็กต์ **ModelTable** ใช้ตอนสร้างความสัมพันธ์ด้วยโปรแกรม |
| **ModelTableNameChange** | TableNameNew, TableNameOld | แทนชื่อเก่าและใหม่ของตารางที่ถูกเปลี่ยนชื่อใน PPM |

**ModelRelationships.Add** (method): เพิ่มความสัมพันธ์ลงในคอลเลกชัน พารามิเตอร์ **ForeignKeyColumn** (บังคับ, ModelTableColumn: คอลัมน์ foreign key ในตารางด้าน "many" ของความสัมพันธ์แบบ one-to-many) และ **PrimaryKeyColumn** (บังคับ, ModelTableColumn: คอลัมน์ primary key ในตารางด้าน "one")

### บทสรุป

add-in PowerPivot ช่วยสร้าง cube ของตัวเองแทนที่จะใช้ cube เริ่มต้นที่ Excel สร้างให้เบื้องหลัง Power tables ด้วย add-in นี้ เห็น cube ในบริบทภาพและเปลี่ยนคุณสมบัติเฉพาะ cube ได้ ออบเจ็กต์ **Model** เก็บการอ้างอิงการเชื่อมต่อเวิร์กบุ๊กและข้อมูลเกี่ยวกับตารางและความสัมพันธ์ใน PowerPivot Model

ดูเพิ่มเติม: [PowerPivot for Excel Tutorial Introduction](https://learn.microsoft.com/en-us/previous-versions/sql/sql-server-2012/gg413497(v=sql.110)), [PowerPivot for Excel Tutorial Sample Data](https://archive.codeplex.com/?p=powerpivotsdr)

---

## 2. Coauthoring ใน Excel

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/about-coauthoring-in-excel>

เรียนรู้ว่า coauthoring ทำงานอย่างไรใน Excel และอาจต้องปรับ add-in หรือมาโครอย่างไรเพื่อให้ผสานกับ coauthoring ได้ราบรื่น

Coauthoring ใช้ได้กับผู้ใช้ Excel Online ทุกคน ฟีเจอร์นี้ใช้ได้กับ Excel for Windows Desktop ด้วย แต่เฉพาะลูกค้า Office 365

### ความรู้เบื้องต้น

[Coauthoring](https://support.office.com/article/Collaborate-on-Excel-workbooks-at-the-same-time-with-co-authoring-7152aa8b-b791-414c-a3bb-3024e46fb104) ให้แก้ไขเวิร์กบุ๊กที่โฮสต์บนคลาวด์ (OneDrive, OneDrive for Business หรือ SharePoint Online) พร้อมกับผู้ใช้อื่นได้ ทุกครั้งที่บันทึก ทุกคนที่แก้เวิร์กบุ๊กอยู่ในขณะนั้นจะเห็นการเปลี่ยนแปลง เมื่อเปิด [AutoSave](https://learn.microsoft.com/en-us/office/vba/library-reference/concepts/how-autosave-impacts-addins-and-macros) จะเห็นการเปลี่ยนแปลงของทุกคนแบบเรียลไทม์ ถ้ายังไม่พร้อมให้คนอื่นเห็นการเปลี่ยนแปลง ปิด AutoSave ได้จนกว่าจะพร้อมแชร์และรับการเปลี่ยนแปลงของผู้อื่น

### หลักการของ coauthoring

Excel ซิงโครไนซ์การเปลี่ยนแปลงที่ทำกับเวิร์กบุ๊กโดยอัตโนมัติ (ไม่ว่าโดยผู้ใช้หรือโค้ดของคุณ) เช่น โค้ดที่รันบนอินสแตนซ์ของผู้ใช้คนหนึ่งแก้เนื้อหาเซลล์: `Range("A1").Value = "myNewValue"` Excel จะส่งการเปลี่ยนแปลงนี้ไปยัง coauthor คนอื่น แล้วถ้าโค้ดที่รันบนอินสแตนซ์ของผู้ใช้อีกคนตรวจเนื้อหาเซลล์นั้น: `MsgBox Range("A1").Value` ผู้ใช้คนที่สองจะเห็นค่า `"myNewValue"` ที่ผู้ใช้คนแรกตั้งไว้

อย่างไรก็ตาม Excel จะ **ไม่** ซิงโครไนซ์ตัวแปรที่โค้ดของคุณสร้างนอกเนื้อหาเวิร์กบุ๊กโดยอัตโนมัติ เช่น โค้ดอ่านค่าจากเซลล์แล้วโหลดเข้าตัวแปร:

```vb
Dim myVariable
myVariable = Range("A1").Value
```

Excel จะไม่อัปเดตค่าของ `myVariable` อัตโนมัติ แปลว่า `myVariable` จะไม่ซิงก์กับตัวแปรชื่อเดียวกันที่โค้ดบนอินสแตนซ์ Excel ของ coauthor คนอื่นสร้าง

### สถานการณ์ที่อาจต้องปรับโซลูชันให้เข้ากับ coauthoring

เพราะ add-in และมาโครที่มีอยู่พึ่ง Excel ในการส่งการเปลี่ยนแปลงไปยัง coauthor อย่างราบรื่น โดยปกติใช้โค้ดในสภาพแวดล้อมใหม่นี้ได้โดยไม่ต้องแก้ไข แต่มีสองกรณีที่อาจต้องปรับโค้ดเพื่อให้ทำงานราบรื่นใน coauthoring:

1. add-in ที่มีสถานะภายในในหน่วยความจำนอกเนื้อหาเวิร์กบุ๊ก
2. add-in ที่ใช้ event

event [**BeforeRemoteChange**](https://learn.microsoft.com/en-us/office/vba/api/excel.workbook.beforeremotechange) และ [**AfterRemoteChange**](https://learn.microsoft.com/en-us/office/vba/api/excel.workbook.afterremotechange) ถูกเพิ่มเพื่อจัดการการเปลี่ยนแปลงจากระยะไกลเมื่อเหมาะสม

#### กรณี 1: add-in ที่มีสถานะภายในนอกเนื้อหาเวิร์กบุ๊ก

ลองนึกถึง add-in ที่ให้ผู้ใช้สร้างแผนภูมิที่กำหนดเองจากข้อมูลในเวิร์กบุ๊ก add-in นี้โหลดข้อมูลของแผนภูมิลงในชีตที่ซ่อนในเวิร์กบุ๊ก เมื่อผู้ใช้เปิดไฟล์ที่มีแผนภูมิที่กำหนดเอง add-in อ่านข้อมูลบนชีตที่ซ่อนและโหลดแผนภูมิเข้าหน่วยความจำ เมื่อผู้ใช้แก้ไขแผนภูมิ โครงสร้างในหน่วยความจำจะอัปเดตและเขียนกลับไฟล์ก่อนบันทึกทุกครั้ง add-in นี้สมมติว่าเวลาเดียวที่ต้องอ่านชีตที่ซ่อนและโหลดเข้าหน่วยความจำคือตอนเปิดไฟล์

Coauthoring เปิดความเป็นไปได้อีกอย่าง: ชีตที่ซ่อนอาจถูกแก้โดยผู้ใช้อีกคนที่รัน add-in เดียวกันพร้อมกัน ถ้าเกิดเช่นนี้ แผนภูมิที่ผู้ใช้เห็นอาจไม่ซิงก์กัน เช่น:

- ผู้ใช้ A เปิดไฟล์และเริ่มดูแผนภูมิที่กำหนดเองที่มีอยู่
- ขณะนั้น ผู้ใช้ B เปิดไฟล์เดียวกันและเริ่มแก้แผนภูมิ (เช่น เปลี่ยนชนิดแผนภูมิ)
- add-in บนคอมพิวเตอร์ของผู้ใช้ B บันทึกการเปลี่ยนแปลงลงชีต แต่ผู้ใช้ A จะไม่เห็นการเปลี่ยนจนกว่าจะโหลดไฟล์ใหม่

**วิธีแก้:** หลีกเลี่ยงการสมมติว่าข้อมูลเวิร์กบุ๊กเปลี่ยนเมื่อใดให้มากที่สุด ในกรณีนี้ ปรับ add-in ให้ตอบสนองต่อ event **AfterRemoteChange** แล้วตรวจค่าบนชีตที่ซ่อนว่าต้องให้ add-in อ่านใหม่หรือไม่ เพื่อให้ผู้ใช้ A เห็นการเปลี่ยนแปลงแผนภูมิของผู้ใช้ B add-in ถูกออกแบบให้รันทุกครั้งที่ช่วงแผนภูมิเปลี่ยน ซึ่งเกิดตอนโหลดและเกิดได้เมื่อมีการเปลี่ยนแปลงจากระยะไกล ดังนั้นตรรกะใน **AfterRemoteChange** ควรรัน add-in ใหม่

#### กรณี 2: add-in ที่ใช้ event

add-in หรือมาโครของคุณอาจสมัครรับ event บันทึกหรือเปลี่ยนแปลงอยู่แล้ว เมื่อมี coauthoring อาจเกิดปัญหากับ:

- **Save events (BeforeSave, AfterSave):** อาจพบปัญหาเมื่อโค้ดใช้ event บันทึก ข้อมูลเพิ่มเติม: [Potential issues with save events and AutoSave](https://learn.microsoft.com/en-us/office/vba/library-reference/concepts/how-autosave-impacts-addins-and-macros#IssuesWithSaveEventsAndAutoSave)
- **Change events:** โดยปกติโค้ดไม่ต้องจัดการการเปลี่ยนแปลงจากผู้ใช้ระยะไกล แต่มีบางกรณีที่การจัดการอาจก่อปัญหา มีตัวอย่างสองสถานการณ์ด้านล่าง

**สถานการณ์ตัวอย่าง: การตรวจสอบข้อมูล (Data validation)**

event เปลี่ยนแปลงถูกกระตุ้นเมื่อมีการแก้ไขช่วงเฉพาะในเวิร์กบุ๊ก โค้ด add-in ตรวจสอบการเปลี่ยนแปลง และถ้าตรวจไม่ผ่านจะแจ้งผู้ใช้ผ่านหน้าต่างป๊อปอัป แต่ถ้าผู้ใช้ระยะไกลทุกคนที่ทำงานร่วมกันถูกแจ้งความล้มเหลวของการตรวจสอบที่ไม่เกี่ยวกับการเปลี่ยนแปลงของตนเอง จะเป็นประสบการณ์ที่แย่

*ตัวอย่าง:* สร้างแผนภูมิแสดงรายได้จากการขายขนมหวานต่าง ๆ ทั้งต้นทุนและจำนวนที่ขายไม่ควรติดลบ จึงมีการตรวจสอบที่แสดงข้อความให้ผู้ใช้ เมื่อค่าที่ไม่ถูกต้องถูกส่งไปยังผู้ใช้ระยะไกล ไม่ควรแสดงข้อความตรวจสอบให้พวกเขา

```vb
Public Sub ValidateFigures()
    Dim rangeToValidate As Range
    Set rangeToValidate = ActiveWorkbook.Worksheets("Chart").Range("B2:C6")
    For Each cell In rangeToValidate.Cells
        If (cell.Value < 0) Then
            MsgBox ("Error: Value should not be negative. " & cell.Address)
        End If
    Next
End Sub
Private Sub Worksheet_Change(ByVal Target As Range)
    ActiveWorkbook.Worksheets("Chart").ValidateFigures
End Sub
```

ดังนั้นไม่ต้องสมัครรับ event **BeforeRemoteChange** หรือ **AfterRemoteChange** ในกรณีนี้

```vb
Private Sub Workbook_AfterRemoteChange()
    ' อย่าเรียกการตรวจสอบจาก event RemoteChange
    'ActiveWorkbook.Worksheets("Chart").ValidateFigures
End Sub
```

**สถานการณ์ตัวอย่าง: ความสอดคล้องของข้อมูล (Data consistency)**

event เปลี่ยนแปลงถูกกระตุ้น และโค้ด add-in ซิงโครไนซ์ข้อมูลในเวิร์กบุ๊กกับข้อมูลในส่วนอื่นของเวิร์กบุ๊กหรือระบบภายนอก ถ้าผู้ใช้ระยะไกลได้รับการเปลี่ยนแปลงที่ทำให้โค้ด add-in ซิงโครไนซ์ข้อมูลเดียวกัน อาจทำให้ประสิทธิภาพของผู้ใช้ระยะไกลลดลงหรือข้อมูลซ้ำในระบบภายนอก

#### ปัญหาที่อาจเกิดกับ change events

แม้ปกติไม่ต้องการให้โค้ดตัวจัดการ event ทำงานตอบสนองการเปลี่ยนแปลงจากผู้ใช้ระยะไกล แต่พฤติกรรมเริ่มต้นที่ *ไม่* ยก change event อาจก่อปัญหา ตัวอย่างต่อไปนี้แสดงปัญหาและวิธีแก้ด้วย **BeforeRemoteChange** และ **AfterRemoteChange**

**สถานการณ์ตัวอย่าง: การแสดงภาพข้อมูล (Data visualization)**

add-in วางจุดข้อมูลบนแผนที่ตามข้อมูลตำแหน่งที่อยู่ในช่วงในเวิร์กบุ๊ก ถ้าผู้ใช้แก้ข้อมูลตำแหน่งใด ๆ ผู้ใช้ระยะไกลทุกคนควรได้รับการเปลี่ยนแปลงนี้เพื่อให้แผนที่ของแต่ละคนอัปเดตได้

*ตัวอย่าง:* สมมติสร้างแผนที่ที่กำหนดเอง เพิ่มโค้ดเปลี่ยนข้อมูลตำแหน่งแล้วอัปเดตแผนที่ได้ เวิร์กบุ๊กถูกแชร์ให้ผู้ใช้ในอีกเมืองหนึ่ง เมื่อเปิด AutoSave การเปลี่ยนแปลงถูกส่งไปยังผู้ใช้ระยะไกล แต่แผนที่ของผู้ใช้นั้นจะไม่อัปเดต

```vb
Public Sub UpdateMap()
    'โค้ดที่อัปเดตแผนที่
End Sub
Private Sub Worksheet_Change(ByVal Target As Range)
    'เรียกโพรซีเดอร์ที่อัปเดตแผนที่
End Sub
```

ใช้ event **AfterRemoteChange** เพิ่มโค้ดที่อัปเดตแผนที่ การเปลี่ยนแปลงที่ส่งถึงผู้ใช้ระยะไกลครั้งต่อไปจะถูกใช้อัปเดตแผนที่

```vb
Private Sub Workbook_AfterRemoteChange()
    'เรียกโพรซีเดอร์ที่อัปเดตแผนที่
End Sub
```

**สถานการณ์ตัวอย่าง: Navigation task pane**

add-in แสดงแท็บเวิร์กบุ๊กปัจจุบันทั้งหมดใน task pane เพื่อนำทางสะดวก ถ้าผู้ใช้เพิ่มเวิร์กชีต ผู้ใช้ระยะไกลทุกคนควรได้รับการเปลี่ยนแปลงนี้ เพื่อให้ task pane ของแต่ละคนแสดงลิงก์ไปยังเวิร์กชีตใหม่ได้

**ดูเพิ่มเติม:** [AutoSave](https://learn.microsoft.com/en-us/office/vba/library-reference/concepts/how-autosave-impacts-addins-and-macros), [Collaborate on Excel workbooks at the same time with coauthoring](https://support.office.com/article/Collaborate-on-Excel-workbooks-at-the-same-time-with-co-authoring-7152aa8b-b791-414c-a3bb-3024e46fb104)

**สรุปแนวปฏิบัติ (ผู้แปล):** (1) อย่าเก็บสถานะสำคัญไว้ในตัวแปรหน่วยความจำนอกเวิร์กบุ๊กแล้วสมมติว่าไม่มีใครแก้ข้อมูลต้นทาง (2) ใช้ `AfterRemoteChange` เมื่อ UI ต้องตามการเปลี่ยนจากผู้อื่น (3) อย่าให้การตรวจสอบหรือการซิงก์ภายนอกทำงานซ้ำเพราะการเปลี่ยนจากระยะไกล

---

## 3. ฟังก์ชัน method และ property เฉพาะภาษา

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/language-specific-properties-methods-and-functions>

ออบเจ็กต์โมเดล VBA ของ Excel มีองค์ประกอบเฉพาะภาษาสำหรับภาษาเอเชียและภาษาที่เขียนจากขวาไปซ้าย

ตารางต่อไปนี้แสดง method ที่มีอาร์กิวเมนต์เฉพาะภาษา method ที่มีอาร์กิวเมนต์ใหม่หรือน้อยลงเมื่อเทียบกับ Excel รุ่นก่อนมีหมายเหตุไว้

| Method | ออบเจ็กต์ | หมายเหตุ |
| :-- | :-- | :-- |
| **Add** | Phonetics | |
| **AddLabel** | Shapes | |
| **AddTextbox** | Shapes | |
| **AutoFormat** | Range | |
| **CheckSpelling** | Application, Chart, Range, Worksheet | เพิ่ม *SpellLang* และลบ *IgnoreInitialAlefHamza*, *IgnoreFinalYaa* |
| **Find** | Application, Range | ลบ *MatchControlCharacters*, *MatchDiacritics*, *MatchKashida*, *MatchAlefHamza* |
| **GetPhonetic** | Application | |
| **Replace** | Range | ลบ *MatchControlCharacters*, *MatchDiacritics*, *MatchKashida*, *MatchAlefHamza* |
| **SetPhonetic** | Range | |
| **Sort** | Range | ลบ *IgnoreControlCharacters*, *IgnoreDiacritics*, *IgnoreKashida* |
| **SortSpecial** | Range | |

Property ที่คืนหรือตั้งแอตทริบิวต์เฉพาะภาษามีดังนี้

| Property | ออบเจ็กต์ |
| :-- | :-- |
| **AddIndent** | Range, Style |
| **AddressLocal** | Range |
| **Alignment** | Phonetic, Phonetics, TextEffectFormat, TickLabels |
| **CharacterType** | Phonetic, Phonetics |
| **ControlCharacters** | Application |
| **CursorMovement** | Application |
| **DefaultSheetDirection** | Application |
| **DisplayRightToLeft** | Window, Worksheet |
| **FileFormat** | Workbook |
| **HorizontalAlignment** | AxisTitle, ChartTitle, DataLabel, DataLabels, DisplayUnitLabel, Range, Style, TextFrame |
| **IMEMode** | Validation |
| **International** | Application |
| **Item** | Phonetics |
| **Length** | Phonetics |
| **Phonetic** | Range |
| **PhoneticCharacters** | Characters |
| **Phonetics** | Range |
| **ReadingOrder** | AxisTitle, ChartTitle, DataLabel, DataLabels, DisplayUnitLabel, Range, Style, TextFrame, TickLabels |
| **Start** | Phonetics |
| **VerticalAlignment** | AxisTitle, ChartTitle, DataLabel, DataLabels, DisplayUnitLabels, Range, Style, TextFrame |

ฟังก์ชันเวิร์กชีตเฉพาะภาษา: **FindB, ReplaceB, SearchB, USDollar** (รายการเต็มของฟังก์ชันที่เรียกจาก VBA ได้ ดูไฟล์ `04-events-worksheet-functions-shapes.md` หัวข้อ 11) หมายเหตุผู้แปล: รายการฟังก์ชันเวิร์กชีตมี `BahtText` ซึ่งเกี่ยวกับภาษาไทย (แปลงตัวเลขเป็นข้อความบาทไทย) แต่หน้าต้นฉบับนี้ไม่ได้ระบุไว้ในรายการเฉพาะภาษา

**ข้อสังเกตสำหรับงานภาษาไทย (ผู้แปล):** ตารางข้างต้นเกี่ยวกับภาษาเอเชียแบบ CJK และภาษาขวาไปซ้ายเป็นหลัก ข้อความภาษาไทยทำงานกับ `Range.Find`, `Sort`, `ReadingOrder` ตามปกติ แต่ควรทดสอบการเรียงลำดับ (`Sort`) กับข้อมูลภาษาไทยเสมอ

---

## 4. คุณสมบัติ OLE DB for OLAP ที่ Excel ใช้

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/ole-db-for-olap-properties-used-by-excel>

Microsoft Excel ใช้ผู้ให้บริการ OLE DB for OLAP (OnLine Analytical Processing) เชื่อมต่อกับ OLAP cube เมื่อเชื่อมต่อกับ cube Excel อ่านและตั้งคุณสมบัติ OLE DB และ OLE DB for OLAP หลายตัว Excel พิจารณา Connection properties, Data Source Information Properties, Schema Rowset Queries และ Cell properties

หัวข้อนี้ไม่ได้ครอบคลุมทุกคุณสมบัติที่มี แต่เน้นเฉพาะคุณสมบัติที่มีความสัมพันธ์เฉพาะกับ Excel การเชื่อมต่อ OLAP ใน Excel ใช้สำหรับ PivotTable และสูตร OLAP เมื่อทดสอบผู้ให้บริการ OLAP ที่มีอยู่ แนะนำให้ให้ Excel อ่านชุดคุณสมบัติของผู้ให้บริการเพื่อตรวจว่าผู้ให้บริการ OLAP รองรับฟีเจอร์ที่จำเป็นสำหรับการออกแบบและการทำงานของ OLAP PivotTable หรือไม่ ถ้าผู้ให้บริการไม่รองรับความสามารถบางอย่าง ฟีเจอร์ที่ขึ้นกับความสามารถเหล่านั้นจะถูกปิดหรือจำกัด คุณสมบัติอื่นถูกตั้งเพื่อให้ได้พฤติกรรมที่ต้องการ และถ้าไม่ได้ implement คุณสมบัติเหล่านี้สำหรับผู้ให้บริการ OLAP Excel อาจใช้งานด้วยไม่ได้

> เนื้อหาหัวข้อนี้เป็นข้อมูลอ้างอิงเชิงเทคนิคสำหรับผู้พัฒนาผู้ให้บริการ OLAP ชื่อคุณสมบัติและค่าคงที่ (DBPROP_*, MDPROP_*, MDSCHEMA_*) คงเป็นภาษาอังกฤษตามต้นฉบับ แปลเฉพาะคำอธิบายที่ใช้เป็นหลัก

### 4.1 Connection properties (คุณสมบัติการเชื่อมต่อ)

| Property set | Property | ตั้งเมื่อ | ตั้งเป็น |
| :-- | :-- | :-- | :-- |
| DBPROPSET_MSOLAPINIT | DBPROP_MSMD_SAFETY_OPTIONS | รองรับ | reg key OLAPUDFSecurity หรือ DBPROPVAL_MSMD_SAFETY_OPTIONS_ALLOW_SAFE |
| DBPROPSET_MSOLAPINIT | DBPROP_MSMD_MDXCOMPATIBILITY | รองรับ | DBPROP_MSMD_MDXCOMPATIBILITY_70 |
| DBPROPSET_MSOLAPINIT | DBPROP_MSMD_SOURCE_DSN_SUFFIX | มี DBPROP_MSMD_SOURCE_DSN ใน DBPROPSET_MSOLAPINIT | สตริง "Prompt=CompleteRequired;Window Handle=0x<hwnd>" |
| DBPROPSET_MSOLAPINIT | DBPROP_MSMD_MDX_MISSING_MEMBER_MODE | รองรับ | ถ้ารองรับ Excel ตั้งเป็นสตริง "Error" ถ้าไม่รองรับจะถูกละเว้น |
| DBPROPSET_DBINIT | DBPROP_INIT_LCID | รองรับ | ตั้งก่อนเชื่อมต่อ ระบุ LCID ใดก็ได้สำหรับการเชื่อมต่อ ถ้าเปิดการแปลภาษาสำหรับการเชื่อมต่อ Excel ตั้งเป็นภาษา UI (ค่าเริ่มต้น) ถ้าไม่รองรับ Excel ไม่มีปัญหา เพียงสูญเสียฟังก์ชันการแปลตามภาษา UI |
| DBPROPSET_DBINIT | DBPROP_INIT_PROMPT | รองรับ | ไม่เฉพาะ OLAP ตั้งก่อนเชื่อมต่อ ถ้าตั้งล้มเหลวเพราะไม่รองรับค่า Excel ละเว้นความล้มเหลว |
| DBPROPSET_DBINIT | DBPROP_AUTH_PERSIST_SENSITIVE_AUTHINFO | รองรับ | ไม่เฉพาะ OLAP ตั้งก่อนเชื่อมต่อ Excel ดูเหมือนตั้งเป็น True เสมอ |
| DBPROPSET_DBINIT | DBPROP_INIT_HWND | รองรับ | ไม่เฉพาะ OLAP ตั้งก่อนเชื่อมต่อ Excel ตั้งเป็นหน้าต่างหลักของแอป เพื่อให้ผู้ให้บริการแสดงการแจ้งเตือนด้วยหน้าต่างแม่ที่ถูกต้อง |
| DBPROPSET_DBINIT | DBPROP_INIT_ASYNCH | รองรับ | ไม่เฉพาะ OLAP ตั้งก่อนเชื่อมต่อ Excel ตั้งเป็น DBPROPVAL_ASYNCH_INITIALIZE ตามการตั้งค่า registry (ปิดได้ด้วย registry) ถ้าไม่รองรับ Excel ละเว้นและไม่ตั้ง |
| DBPROPSET_DBINIT | DBPROP_CMD_PROMPT | รองรับ | ไม่เฉพาะ OLAP ตั้งก่อนเชื่อมต่อ |
| DBPROPSET_DBINIT | DBPROP_CMD_HWND | รองรับ | ไม่เฉพาะ OLAP ตั้งก่อนเชื่อมต่อ |

### 4.2 Data source information (ข้อมูลแหล่งข้อมูล)

| Property set | Property | ค่า | การใช้งาน |
| :-- | :-- | :-- | :-- |
| DBPROPSET_MDX_EXTENSIONS | DBPROP_MSMD_MDX_DDL_EXTENSIONS | ถ้าตั้งบิต DBPROPVAL_MDX_DLL_CREATESESSIONCUBE | เปิดฟีเจอร์การจัดกลุ่ม (grouping) ของ OLAP PivotTable ถ้ารองรับ `CREATE SESSION CUBE` |
| DBPROPSET_MDX_EXTENSIONS | DBPROP_MSMD_MDX_DDL_EXTENSIONS | ถ้าตั้งบิต DBPROPVAL_MDX_DDL_REFRESHCUBE | ถ้ารองรับคำสั่ง `REFRESH CUBE` Excel รันคำสั่งนี้เมื่อรีเฟรช OLAP PivotTable |
| DBPROPSET_MDX_EXTENSIONS | DBPROP_MSMD_MDX_CALCMEMB_EXTENSIONS | ถ้าตั้งบิต DBPROPVAL_MDX_CALCMEMB_ADD | เปิดฟีเจอร์แสดง calculated member ใน OLAP PivotTable ถ้า MDX (Multidimensional Expressions) รองรับ `ADDCALCULATEDMEMBERS` |
| DBPROPSET_DATASOURCEINFO | MDPROP_MDX_FORMULAS | ถ้าตั้งทั้งสองบิต MDPROPVAL_MF_SCOPE_SESSION และ MDPROPVAL_MF_CREATE_CALCMEMBERS | ถ้าผู้ให้บริการรองรับการสร้าง session member (`CREATE SESSION MEMBER`) Excel เปิดฟีเจอร์นี้ใน OLAP PivotTable (ใช้ได้เฉพาะในออบเจ็กต์โมเดลของ Excel) |
| DBPROPSET_SESSION | DBPROP_VISUALMODE | ถ้ารองรับ (และไม่รองรับ subselect ดู MDPROP_MDX_SUBQUERIES) | เปิดการควบคุม Include hidden items in totals (สลับ visual totals) |
| DBPROPSET_DATASOURCEINFO | MDPROP_MDX_SUBQUERIES | ถ้าตั้งสองบิตต่ำสุด (เมื่อตั้ง Excel ไม่รองรับ non-visual totals) | เปิดการกรองแบบ Label, Date และ Value ใน Excel PivotTable โดยทั่วไปใช้การสร้างคิวรี MDX ของ Excel คุณสมบัตินี้เริ่มใน SQL Server 2005 Service Pack 2 ค่าเป็น `VARIANT_TRUE` เสมอใน msolap90.dll |
| DBPROPSET_DATASOURCEINFO | MDPROP_MDX_DRILL_FUNCTIONS | | ถ้าตั้งสองบิตต่ำสุด Excel ตีความว่าเซิร์ฟเวอร์รองรับการ drill แบบ tuple ด้วยฟังก์ชัน `DrillDownLevel` และ `DrillDownMember` แต่ Excel อนุญาต attribute drilling ก็ต่อเมื่อสองบิตต่ำสุดของ `MDPROP_MDX_SUBQUERIES` ถูกตั้งด้วย (รองรับ subselect) |
| DBPROPSET_DATASOURCEINFO | MDPROP_FLATTENING_SUPPORT | ตรวจว่าตั้งเป็น MDPROPVAL_FS_FULL_SUPPORT | Excel อ่านค่านี้ และถ้าไม่ได้ตั้งเป็น `MDPROPVAL_FS_FULL_SUPPORT` จะเกิด error เพราะ Excel ไม่ถือว่าเป็นผู้ให้บริการ OLAP |
| DBPROPSET_DATASOURCEINFO | MDPROP_NAMED_LEVELS | Excel ตรวจว่าตั้งบิตต่ำสุด (MDPROPVAL_NL_NAMEDLEVELS) | ถ้าไม่ตั้งบิตต่ำสุด Excel ล้มเหลว |
| DBPROPSET_DATASOURCEINFO | MDPROP_MDX_SET_FUNCTIONS | | Excel สอบถามคุณสมบัตินี้ แต่ไม่มีผลต่อฟีเจอร์ |
| DBPROPSET_DATASOURCEINFO | DBPROP_DBMSVER | Excel ตรวจว่าเป็นสตริงหรือไม่ | Excel ไม่ตรวจค่าจริง ตรวจเพียงว่าเป็นสตริง ถ้าไม่ใช่สตริง Excel เชื่อมต่อไม่ได้ |
| DBPROPSET_DATASOURCEINFO | DBPROP_DATASOURCE_TYPE | Excel ตรวจว่าตั้งบิตต่ำสุดอันดับสอง (DBPROPVAL_DST_MDP) | ถ้าตั้งบิตต่ำสุด ผู้ให้บริการถือเป็นผู้ให้บริการหลายมิติ (OLAP) |
| DBPROPSET_ROWSET | DBPROP_ROWSET_ASYNCH | ถ้ารองรับ | Excel พยายามตั้งเป็น `DBPROPVAL_ASYNCH_INITIALIZE` ถ้าล้มเหลว จะถอยกลับเป็นโหมดซิงโครนัส ถ้ารองรับ ทำให้ผู้ใช้กดปุ่ม **Esc** หยุดการรันคิวรีก่อนเสร็จได้ |

### 4.3 Schema rowset queries

| Schema rowset | Column | ค่า | ควบคุมอะไร |
| :-- | :-- | :-- | :-- |
| MDSCHEMA_CUBES | IS_DRILLTHROUGH_ENABLED | TRUE | ถ้า TRUE เปิดฟีเจอร์ drill-through (Show Details) สำหรับเซลล์ในพื้นที่ค่าของ OLAP PivotTable |
| MDSCHEMA_HIERARCHIES | STRUCTURE | MD_STRUCTURE_UNBALANCED | Excel มีการจัดการพิเศษสำหรับการกรองของ hierarchy ที่ไม่สมดุล จึงทำเครื่องหมายไว้เพื่อควบคุม |
| MDSCHEMA_HIERARCHIES | HIERARCHY_ORIGIN | ตั้ง MD_ORIGIN_ATTRIBUTE และไม่ใช่ MD_ORIGIN_USER_DEFINED | Excel มีการจัดการพิเศษสำหรับ attribute hierarchy ใน OLAP PivotTable จึงทำเครื่องหมายไว้ |
| MDSCHEMA_HIERARCHIES | HIERARCHY_DISPLAY_FOLDER | | ตามคุณสมบัตินี้ PivotTable Field List แสดง hierarchy ในโฟลเดอร์ใต้มิติของมัน |
| MDSCHEMA_MEASUREGROUPS | MEASUREGROUP_NAME | | **Measures** แสดงในโฟลเดอร์ที่แทน measure group ใน PivotTable Field List |
| MDSCHEMA_MEASUREGROUPS | MEASUREGROUP_CAPTION | | **Measures** แสดงในโฟลเดอร์ที่แทน measure group ด้วย caption นี้ใน PivotTable Field List |
| MDSCHEMA_SETS | SET_DISPLAY_FOLDER | | Excel อ่านคุณสมบัติ display folder เพื่อวาง set ในโฟลเดอร์แสดงผลใน PivotTable Field List |
| MDSCHEMA_SETS | SET_CAPTION | | Excel อ่าน set caption เพื่อแสดงในรายงาน PivotTable และ PivotTable Field List |
| MDSCHEMA_KPIS | KPI_DISPLAY_FOLDER | | KPI (key performance indicators) ที่กำหนดบนเซิร์ฟเวอร์แสดงใน PivotTable Field List และเพิ่มองค์ประกอบ (value, goal, status, trend) ลงพื้นที่ค่าได้ Excel อ่านคุณสมบัตินี้เพื่อวาง KPI ในโฟลเดอร์แสดงผลที่ถูกต้อง |
| MDSCHEMA_KPIS | KPI_PARENT_KPI_NAME | | Excel อ่านเพื่อวาง KPI ลูกในโฟลเดอร์ย่อยใต้ KPI แม่ใน PivotTable Field List (ถ้ากำหนด display folder จะใช้แทน) |
| MDSCHEMA_KPIS | KPI_TREND_GRAPHIC | | Excel อ่านและจับคู่ค่ากับชุดไอคอน conditional formatting ที่ใกล้ที่สุดเมื่อเพิ่ม Trend ลง PivotTable |
| MDSCHEMA_KPIS | KPI_STATUS_GRAPHIC | | Excel อ่านและจับคู่ค่ากับชุดไอคอน conditional formatting ที่ใกล้ที่สุดเมื่อเพิ่ม Status ลง PivotTable |
| MDSCHEMA_ACTIONS | | | ฟีเจอร์ Additional Actions: Excel แสดง action ที่เซิร์ฟเวอร์กำหนดในเมนูทางลัดของรายงาน OLAP PivotTable เมื่อมี action บนเซิร์ฟเวอร์สำหรับบริบทที่เลือก |
| MDSCHEMA_MEASURES | MEASURE_DISPLAY_FOLDER | | Excel อ่านเพื่อวาง measure ในโฟลเดอร์แสดงผลที่ถูกต้องใน PivotTable Field List |
| MDSCHEMA_MEASURES | EXPRESSION | | Excel อ่านเพื่อตัดสินว่า measure เป็น calculated หรือไม่ ถ้าเป็นสตริงที่ไม่ว่าง Excel ถือเป็น calculated measure |
| MDSCHEMA_PROPERTIES | PROPERTY_NAME | "MEMBER_VALUE" (schema นี้ใช้ดึงคุณสมบัติ member ปกติด้วย "MEMBER_VALUE" เป็นกรณีพิเศษ) | Excel ดึงคุณสมบัติ member value ของ key attribute ในมิติ โดยจำกัดที่ "MEMBER_VALUE" ในคอลัมน์ PROPERTY_NAME ถ้าชนิดข้อมูล (DATA_TYPE) ของ MEMBER_VALUE ของ key attribute ของมิติ Time เป็น **Date** PivotTable จะเสนอการกรองด้วยวันที่แทนการกรองด้วย label การกรองด้วยวันที่ทำตาม member value ของ key ไม่ว่า hierarchy ใดของมิตินั้นถูกกรอง *(หมายเหตุ: การกรองด้วยวันที่ต้องรองรับ subselect ดู MDPROP_MDX_SUBQUERIES)* |
| MDSCHEMA_DISCOVER | RESTRICTIONS | | ขึ้นกับการใช้งาน Excel จำกัดที่ hierarchy, level หรือ measure เมื่ออ่าน rowset MDSCHEMA_DISCOVER เพื่อดึง RESTRICTIONS Excel อ่าน schema ทีละแถวและหารายการ restriction ของ schema ที่เกี่ยวข้องอื่นทั้งหมด เพื่อหาดัชนีของ restriction ที่กระทบ Excel คอลัมน์ RESTRICTIONS มี chapter handle ไปยัง rowset อื่นที่ Excel ดูคอลัมน์ NAME ในคอลัมน์ NAME Excel คาดว่าจะพบสตริง HIERARCHY_VISIBILITY, MEASURE_VISIBILITY, LEVEL_VISIBILITY (ถ้าผู้ให้บริการรองรับ restriction ด้าน visibility) ถ้า Excel ไม่พบสตริง `<xxx>_VISIBILITY` (หรือถ้าไม่รองรับ MDSCHEMA_DISCOVER) จะสมมติว่าผู้ให้บริการไม่รองรับการคืนรายการที่ซ่อน และจะไม่สอบถามรายการเหล่านั้น |
| MDSCHEMA_LEVELS | LEVEL_ATTRIBUTE_HIERARCHY_NAME | | Excel ใช้ซ่อน grouping level พิเศษที่มีชื่อที่ระบบสร้าง ไม่จำเป็นกับ Microsoft SQL Server 2005 Analysis Services Service Pack 2 |
| MDSCHEMA_LEVELS | CUSTOM_ROLLUP_SETTINGS | 0 | ถ้าไม่ใช่ 0 Excel สมมติว่า level มี custom rollup Excel ตรวจทุก level ของแต่ละ hierarchy และถ้ามี custom rollup การดำเนินการบางอย่างถูกปิด (เช่น grouping) |

### 4.4 Cell properties

**ชื่อ property: Language**

**การใช้งาน:** LCID สำหรับตัดสินว่าจะตีความ `FORMAT_STRING` อย่างไรเมื่อเป็น **CURRENCY** Excel ใช้คุณสมบัตินี้ตัดสินว่าจะใช้สัญลักษณ์สกุลเงินใดเมื่อจัดรูปแบบค่าที่ตั้ง `FORMAT_STRING` เป็น **Currency** ข้อมูลเพิ่มเติม: [Retrieving cell properties](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ms715853(v=vs.85))

ตัวอย่างนิยาม calculated measure ที่ระบุคุณสมบัติ LANGUAGE ให้แอปไคลเอนต์นำไปใช้:

```
CREATE MEMBER CURRENTCUBE.[Measures].[Internet Gross Profit]
AS
[Measures].[Internet Sales Amount]
-
[Measures].[Internet Total Product Cost],
FORMAT_STRING = "Currency",
BACK_COLOR = 12615680 /*R=0, G=128, B=192*/,
FORE_COLOR = 65408 /*R=128, G=255, B=0*/,
FONT_FLAGS = 3 /*Bold, Italic*/,
NON_EMPTY_BEHAVIOR = { [Internet Sales Amount], [Internet Total Product Cost] },
VISIBLE = 1,
LANGUAGE = 1033 /*บอกแอปไคลเอนต์ให้แสดงสัญลักษณ์สกุลเงินสหรัฐ*/;
```

(เป็นโค้ด MDX ไม่ใช่ VBA)

---

## 5. การเขียนโปรแกรมสำหรับ Single Document Interface (SDI)

**อ้างอิง:** <https://learn.microsoft.com/en-us/office/vba/excel/concepts/programming-for-the-single-document-interface-in-excel>

เรียนรู้ข้อควรพิจารณาด้านการเขียนโปรแกรมสำหรับ Single Document Interface ใน Excel

### เปรียบเทียบ Single และ Multiple Document Interface ใน Excel 2010 และ Excel 2013

ฟีเจอร์ใหม่ใน Excel 2013 คือ single document interface (SDI) SDI เป็นวิธีจัดระเบียบแอปพลิเคชัน UI แบบกราฟิกเป็นหน้าต่างแยก ซึ่งตัวจัดการหน้าต่างของระบบปฏิบัติการจัดการแยกกัน ใน Excel 2013 หน้าต่าง Excel แต่ละหน้าต่างมีได้เพียงหนึ่งเวิร์กบุ๊ก และแต่ละหน้าต่างมี UI ribbon ของตัวเอง (รูปที่ 1) โดยค่าเริ่มต้นเมื่อเปิดเวิร์กบุ๊กใหม่ จะแสดงในหน้าต่าง Excel อีกหน้าต่าง แม้เป็นอินสแตนซ์ Excel เดียวกัน

ต่างจาก multiple document interface (MDI) ซึ่งใช้หน้าต่างแม่หน้าต่างเดียวบรรจุหน้าต่างลูกซ้อนกันหลายหน้าต่าง โดยมีเฉพาะหน้าต่างแม่ที่มีเมนูหรือแถบเครื่องมือ ใน Excel 2010 เวิร์กบุ๊กแต่ละเล่มในอินสแตนซ์ Excel เดียวใช้ UI ribbon ร่วมกัน (รูปที่ 2)

Excel 2010 ใช้ MDI หมายความว่ามีหน้าต่างระดับแอปพลิเคชันเดียวที่ถือเวิร์กบุ๊กทั้งหมดที่เปิดอยู่ในอินสแตนซ์ Excel หนึ่ง หน้าต่างเวิร์กบุ๊กจัดเรียงในหน้าต่างแอป Excel โดยใช้ Ribbon UI เดียวกัน SDI ใน Excel หมายถึงเวิร์กบุ๊กแต่ละเล่มมีหน้าต่างแอประดับบนสุดของตัวเอง และมี Ribbon UI ของตัวเอง

> **หมายเหตุ:** Excel ไม่มีตัวเลือกความเข้ากันได้กับ MDI

ในระบบจอภาพคู่ SDI ใน Excel ช่วยให้เปรียบเทียบเวิร์กบุ๊กสองเล่มเคียงกันโดยลากเวิร์กบุ๊กแต่ละเล่มไปคนละจอ แต่ละเวิร์กบุ๊กทำงานอิสระต่อกัน

**ทดลองเปรียบเทียบจำนวนโปรเซสของ MDI และ SDI** (ถ้ามีทั้ง Excel 2010 และ 2013):

1. จากเมนู Start ของ Windows เปิด Excel 2010
2. เปิด Excel ครั้งที่สอง ตรวจว่าแสดงหน้าต่าง Excel สองหน้าต่าง
3. บน Windows Task Bar เลือก **Start Task Manager**
4. เลือกแท็บ **Processes** แล้วเลื่อนจนเห็นรายการ **Excel.exe** สองรายการ แปลว่าโดยค่าเริ่มต้น Excel เปิดอินสแตนซ์ใหม่ทุกครั้งที่ถูกเรียก (สองอินสแตนซ์)
5. ปิด Excel ทั้งสองอินสแตนซ์
6. จากเมนู Start เปิด Excel 2013
7. เปิด Excel ครั้งที่สอง ตรวจว่าแสดงหน้าต่าง Excel สองหน้าต่าง
8. เปิด Task Manager อีกครั้ง
9. ในแท็บ **Processes** เลื่อนจนเห็น **Excel.exe** แม้เปิด Excel สองครั้ง เวิร์กบุ๊กทั้งสองอยู่ในอินสแตนซ์ Excel เดียว

**ทดลองดูวิธีทำงานของ SDI และ MDI ภายในอินสแตนซ์ Excel หนึ่ง:**

1. เปิด Excel 2010 เลือกหน้าต่าง Excel ให้ active ตรวจว่า **Book1** เป็นเวิร์กบุ๊กปัจจุบัน
2. กด CTRL + N เปิดเวิร์กบุ๊กอีกเล่ม ตรวจว่า **Book2** เป็นเวิร์กบุ๊กปัจจุบัน
3. ย่อ **Book2** แล้วดู Book1 เวิร์กบุ๊กทั้งสองอยู่ในอินสแตนซ์ Excel เดียวกัน
4. ปิด Excel
5. เปิด Excel 2013 เลือกหน้าต่าง Excel ให้ active ตรวจว่า **Book1** เป็นเวิร์กบุ๊กปัจจุบัน
6. กด CTRL + N ตรวจว่า **Book2** เปิดในหน้าต่างแยก (แต่ยังอยู่ในอินสแตนซ์ Excel เดียวกัน)
7. ปิด Excel

> **หมายเหตุ:** เปิดหลายอินสแตนซ์ของ Excel ได้ด้วยสวิตช์บรรทัดคำสั่ง **excel.exe /x** ซึ่งเริ่ม Excel ในโปรเซสใหม่

### อะไรเปลี่ยนใน User Interface

เมื่อมองใกล้ ๆ หลังเปิดเวิร์กบุ๊ก Excel จะไม่เห็นปุ่มสถานะหน้าต่าง (*minimize, maximize, restore*) ที่มุมขวาบนของ ribbon อีกต่อไป (รูปที่ 3 แสดงปุ่มใน Excel 2010 และ 2007) เพราะหน้าต่างระดับบนสุดผูกโดยตรงกับเวิร์กบุ๊กหรือมุมมองเวิร์กบุ๊กเดียว จึงไม่ต้องมี UI จัดการหน้าต่างอีก

นอกจากนี้ ใน Excel ไม่มีหน้าต่างเวิร์กบุ๊กหลายหน้าต่างภายในหน้าต่างอินสแตนซ์ Excel เดียวอีกต่อไป (รูปที่ 4)

### การคำนวณใหม่และสูตร

การคำนวณใหม่ใน Excel ยังคงเป็น "global" หมายถึงเกิดข้ามเวิร์กบุ๊กในอินสแตนซ์ Excel เดียวกัน สูตรที่อ้างข้ามเวิร์กบุ๊กที่เปิดในอินสแตนซ์เดียวกันจะคำนวณร่วมกัน และใช้โหมดการคำนวณเวิร์กบุ๊กร่วมกัน (automatic, automatic except for data tables, manual)

ใน MDI มี formula bar เดียวสำหรับทุกเวิร์กบุ๊กที่เปิดในอินสแตนซ์นั้น ใน SDI มี formula bar หนึ่งอันต่อเวิร์กบุ๊ก ใน SDI เมื่อแก้การอ้างอิงข้ามเวิร์กบุ๊กในสูตร formula bar ของทั้งเวิร์กบุ๊กต้นทางและปลายทางจะแสดงสูตรที่กำลังแก้ (รูปที่ 5)

### Custom Task Panes

Custom Task Pane ที่ผูกกับหน้าต่างระดับบนสุดใน MDI จะผูกกับหน้าต่างของเวิร์กบุ๊กหนึ่งใน SDI การสลับไปเวิร์กบุ๊กอื่นจะ activate หน้าต่างเวิร์กบุ๊กนั้น ซึ่งไม่จำเป็นต้องมี custom task pane ผูกอยู่ เว้นแต่โค้ดของนักพัฒนาถูกอัปเดตให้แสดง custom task pane สำหรับเวิร์กบุ๊กนั้นโดยเฉพาะ

สรุป นักพัฒนาควร:

- ตรวจว่าเวิร์กบุ๊กใดที่ต้องการแสดง custom task pane ให้เขียนโค้ดแสดงอย่างชัดเจน
- จัดการอัปเดตสถานะ custom task pane ข้ามทุกอินสแตนซ์อย่างชัดเจน ถ้าต้องการให้ทุก task pane สะท้อนสถานะเดียวกัน เช่น ผู้ใช้เปิดช่องกาเครื่องหมายเป็น ON และต้องการให้สะท้อนใน task pane ทั้งหมดในทุกอินสแตนซ์ของ Excel

### Custom Ribbons

แท็บและตัวควบคุม ribbon ที่กำหนดเองซึ่งสมมติว่ามี UI ribbon เดียวต่ออินสแตนซ์แอปในรุ่นก่อน ๆ ตอนนี้จะถูกกระจายไปยัง ribbon ของทุกเวิร์กบุ๊กใน Excel ใน MDI ผู้พัฒนา custom ribbon ไม่ต้องคิดถึงหลายอินสแตนซ์ของตัวควบคุมบน UI ribbon ของ Excel หลายอินสแตนซ์ แต่ใน SDI ต้องคำนึงถึงสถานการณ์นี้

ถ้าต้องการให้ตัวควบคุม UI ribbon ทั้งหมดอยู่ในสถานะเดียวกันข้ามเวิร์กบุ๊กที่เปิดอยู่ ต้อง:

- ตรวจว่าโค้ดวนผ่านหน้าต่างเวิร์กบุ๊กและอัปเดตสถานะของตัวควบคุมได้ **หรือ**
- แคชสถานะของตัวควบคุม เพื่อว่าเมื่อผู้ใช้สลับไปเวิร์กบุ๊กอื่น จับ event นั้นแล้วอัปเดตตัวควบคุมเป็นส่วนหนึ่งของการสลับหน้าต่าง

นอกจากนี้ ถ้าพัฒนาโค้ดเพิ่มตัวควบคุม UI ที่กำหนดเองโดยใช้ `Application.Commandbar` เข้าถึง ribbon เมื่อพยายามเข้าถึงตัวควบคุมนั้นภายหลัง โค้ดต้องคำนึงว่าเวิร์กบุ๊กที่ active อาจไม่ใช่เวิร์กบุ๊กเดียวกับที่เพิ่มตัวควบคุม

### ข้อควรพิจารณาสำหรับโค้ด VBA

เมื่อย้ายมาเป็น SDI เมธอด event และ property ของหน้าต่าง *ระดับแอปพลิเคชัน* ทั้งหมดของ Excel ไม่ได้รับผลกระทบและทำงานเหมือนรุ่นก่อน (เช่น `Application.ActiveWindow`, `Application.Windows`)

ใน Excel เมธอด event และ property ของหน้าต่าง *ระดับเวิร์กบุ๊ก* ทั้งหมดตอนนี้ทำงานกับหน้าต่างระดับบนสุด (เช่น event `Workbook.WindowActivate` ยังถูกกระตุ้นเมื่อสลับไปเวิร์กบุ๊กหนึ่ง event `Workbook.Resize` ยังถูกกระตุ้นเมื่อเวิร์กบุ๊กนั้นถูกปรับขนาด และ `ThisWorkbook.Windows(1).Height`, `.Width`, `.Left`, `.Right`, `.Minimize`, `.Maximize` ฯลฯ ทำงานกับหน้าต่างระดับบนสุดของเวิร์กบุ๊กที่ active)

กรณีพิเศษแสดงในตารางต่อไปนี้ **(ตารางที่ 1: พฤติกรรมของออบเจ็กต์โมเดลกับ SDI)**

| ฟังก์ชัน | คำอธิบาย | ผลกระทบกับ SDI |
| :-- | :-- | :-- |
| `Application.Visible` | คืนหรือตั้งค่า Boolean ที่กำหนดว่าออบเจ็กต์มองเห็นหรือไม่ อ่าน/เขียน | ถ้าหน้าต่างทั้งหมดถูกซ่อน: `Application.Visible` กลายเป็น **False**; ตั้ง `Application.Visible` เป็น **True** จะแสดงหน้าต่างที่ซ่อนทั้งหมด; เปิดเอกสารผ่าน shell จะแสดงเฉพาะหน้าต่างนั้น และ `Application.Visible` เป็น **True** นอกจากนี้: `Application.Visible = False` ซ่อนทุกอย่างและ `= True` แสดงทุกอย่าง โดยไม่สนการตั้งค่าระดับเอกสาร; ถ้าหน้าต่างทั้งหมดถูกซ่อนผ่านการตั้งค่าระดับหน้าต่าง การตั้งค่าระดับแอปพลิเคชันจะสลับตาม; การมีอย่างน้อยหนึ่งหน้าต่างแสดงอยู่หมายถึงการตั้งค่าระดับแอปเป็น **True** |
| `Application.ShowWindowsInTaskbar` | **True** ถ้ามีปุ่ม taskbar ของ Windows แยกสำหรับแต่ละเวิร์กบุ๊กที่เปิด ค่าเริ่มต้น **True** อ่าน/เขียน Boolean | การตั้งค่านี้เลิกใช้ (deprecated) ใน Excel |
| `Application.Caption` | คืนหรือตั้ง String ชื่อที่ปรากฏในแถบชื่อเรื่องของหน้าต่างหลัก Excel | อัปเดตทุกหน้าต่างของอินสแตนซ์ Excel นั้น |
| `Application.Hwnd` | คืน Long ของ handle หน้าต่างระดับบนสุดของ Excel อ่านอย่างเดียว | จะคืน handle ของหน้าต่างที่ active |
| `Application.FormulaBarHeight` | ให้ผู้ใช้ระบุความสูงของ formula bar เป็นจำนวนบรรทัด อ่าน/เขียน Long | ทำงานกับหน้าต่างเวิร์กบุ๊กที่ active ในปัจจุบัน ไม่ใช่ทุกหน้าต่างของอินสแตนซ์ Excel นี้ |
| `Application.DisplayFormulaBar` | **True** ถ้า formula bar แสดงอยู่ อ่าน/เขียน Boolean | ทำงานกับทุกหน้าต่างของอินสแตนซ์ Excel นี้ |
| `Workbook.Windows` | คืนคอลเลกชัน Windows ที่แทนหน้าต่างทั้งหมดของเวิร์กบุ๊กที่ระบุ อ่านอย่างเดียว | พฤติกรรมไม่เปลี่ยน คืนคอลเลกชันของหน้าต่างของเวิร์กบุ๊กนี้ เช่น task pane มุมมองเพิ่มเติม |
| `Workbook.WindowResize` | เกิดเมื่อหน้าต่างเวิร์กบุ๊กใด ๆ ถูกปรับขนาด | พฤติกรรมไม่เปลี่ยน ถูกกระตุ้นเมื่อหน้าต่างเวิร์กบุ๊ก (ระดับบนสุด) ถูกปรับขนาด |
| `Window.Caption` | คืนหรือตั้งค่า Variant ชื่อที่ปรากฏในแถบชื่อเรื่องของหน้าต่างเอกสาร | พฤติกรรมไม่เปลี่ยน |
| `Workbook.Protect(Password, Structure, Windows)` | ป้องกันเวิร์กบุ๊กไม่ให้ถูกแก้ไข | ไม่ว่าค่าพารามิเตอร์ *Windows* จะเป็น **True** หรือ **False** การป้องกันโครงสร้างหน้าต่างจะ **ไม่** เปิดใช้ ไม่มี run-time error ถ้าระบุ **True** แต่ส่วนนั้นของการเรียกโพรซีเดอร์จะเป็น **NO-OP** |

> **หมายเหตุ:** ไม่ต้องแก้โค้ดที่กำหนดเองเพื่อให้คำสั่ง XLM ทำงานตามที่คาดใน Excel แบบ SDI

### การเลิกใช้ Protect Workbook Windows

ใน SDI เวิร์กบุ๊กแต่ละเล่มมีหน้าต่างระดับบนสุดของตัวเองที่ restore, minimize และปิดได้ เพื่อลดความสับสนที่อาจเกิดจากการย้าย ปรับขนาด หรือปิดหน้าต่างระดับบนสุดนี้ไม่ได้ ตัวเลือก Windows ในฟีเจอร์ Protect Workbook ของ Excel ไม่มีให้ใช้อีกต่อไป (รูปที่ 6)

| การกระทำ | พฤติกรรม |
| :-- | :-- |
| เปิดเวิร์กบุ๊กที่สร้างใน Excel รุ่นก่อนซึ่งเปิดใช้ Window Protection | Excel จะจดจำแอตทริบิวต์ตำแหน่งและขนาดหน้าต่าง แต่จะไม่ป้องกันผู้ใช้จัดเรียงหรือปิดหน้าต่างเหล่านี้ |
| ดูกล่องโต้ตอบ **Protect Structure and Windows** | Excel จะแสดงกล่องโต้ตอบ แต่ตัวเลือก **Windows** ถูกปิดใช้งาน |

### วิธีแก้ปัญหาที่เกี่ยวกับ SDI

ส่วนนี้ให้วิธีแก้เฉพาะหน้าสำหรับปัญหาที่อาจพบเมื่อใช้ SDI

**ปัญหา 1: ปิดเวิร์กบุ๊กด้วยปุ่ม "X" สีแดงไม่ได้ เมื่อเวิร์กบุ๊กถูกเปิดด้วยโปรแกรมผ่าน user form แบบ modal**

แนะนำเพิ่มโค้ดต่อไปนี้ใน event procedure **Layout** ของ user form แล้วเปิด user form เป็นแบบ modeless

```vb
Private Sub UserForm_Layout()
    Static fSetModal As Boolean
    If fSetModal = False Then
        fSetModal = True
        Me.Hide
        Me.Show 1
    End If
End Sub
```

อีกทางเลือกคือเปิดหน้าต่างเวิร์กบุ๊ก activate หน้าต่างอื่น แล้ว activate หน้าต่างเวิร์กบุ๊กอีกครั้ง แล้วจะปิดเวิร์กบุ๊กด้วยปุ่ม **Close** ได้

**ปัญหา 2: ใช้ property `DataEntryMode` ควบคุมการกรอกข้อมูลและการปิดเวิร์กบุ๊กในหลายเวิร์กบุ๊ก**

ใน SDI ของ Excel เนื่องจากเวิร์กบุ๊กแต่ละเล่มอยู่ในโปรเซสของตัวเอง (ตามที่ต้นฉบับระบุ) property **DataEntryMode** ที่ใช้ในเวิร์กบุ๊กหนึ่งไม่รับรู้การมีอยู่ของอีกเวิร์กบุ๊ก จึงมีผลน้อยมากหรือไม่มีเลยต่อการโต้ตอบ ทางเลือกในการแก้: ซ่อนเวิร์กบุ๊กหรือเวิร์กชีตส่วนเกินด้วย `Window.Visible = False` หรือ `Sheet.Visible = False` ตามลำดับ และตรวจจับแล้วยกเลิก event ปิดด้วย `Workbook.BeforeClose(Cancel) = True`

**ปัญหา 3: Toolbar ที่เพิ่มด้วยโค้ด command bar และไฟล์ XLA ไม่แสดงจนกว่าจะปิดแล้วเปิดเวิร์กบุ๊กใหม่**

การใช้ command bar ปรับแต่ง UI เลิกใช้ตั้งแต่ Excel 2007 วิธีแก้ที่ดีที่สุดคือปรับแต่ง UI ribbon ด้วยไฟล์ XML ตามที่อธิบายในบทความ *Customizing the 2007 Office Fluent Ribbon for Developers* อีกทางเลือกคือใช้ event ระดับแอปพลิเคชันตรวจจับเวิร์กบุ๊กใหม่ที่เปิด แล้วใช้ `Application.Windows` แทน workbooks เพื่อเพิ่มตัวควบคุม ribbon ตัวอย่างโค้ดต่อไปนี้ใช้ทำสิ่งนี้ได้

```vb
Private Sub Workbook_Open()
    ToolBarsAdd
End Sub
Sub ToolBarsAdd()
    Dim oBar As CommandBar
    ToolBarsDelete
    Set oBar = Application.CommandBars.Add(Name:="MyToolBar")
    '
    With oBar
        With .Controls.Add(Type:=msoControlButton)
            .OnAction = "SayHello"
            .FaceId = 800
        End With
    End With
    oBar.Visible = True
End Sub
Sub SayHello()
    MsgBox "Hello from '" & ActiveWorkbook.Name & "'"
End Sub
```

โค้ดต่อไปนี้ใช้ลบ toolbar ก่อนปิดเวิร์กบุ๊ก

```vb
Private Sub Workbook_BeforeClose(Cancel As Boolean)
    ToolBarsDelete
End Sub
Sub ToolBarsDelete()
Dim wnd As Window
On Error Resume Next
    For Each wnd In Application.Windows
        wnd.Activate
        Application.CommandBars("MyToolBar ").Delete
    Next wnd
End Sub
```

**ปัญหา 4: user form แบบ modeless**

ใน Excel 2010 user form แบบ modeless แสดงเป็นหน้าต่างระดับบนสุดอยู่เหนือหน้าต่าง Excel ทั้งหมดโดยค่าเริ่มต้น ใน Excel 2013 user form แบบ modeless มองเห็นอยู่เหนือหน้าต่างเวิร์กบุ๊กที่ active ตอนแสดง user form เท่านั้น Jan Karel Pieterse (Excel MVP) อธิบายปัญหาและวิธีแก้ในเว็บเพจ: <https://www.jkp-ads.com/articles/keepuserformontop.asp>

### สรุป

Single Document Interface ใหม่ใน Excel 2013 ทำให้ทำงานกับหลายเวิร์กบุ๊กได้ง่าย ลากเวิร์กบุ๊กไปจอภาพต่างจอได้เพื่อความสะดวก เพียงต้องจำไว้ว่ามีหน้าต่างระดับบนสุดเดียวและเมนู UI ribbon หนึ่งชุดต่อเวิร์กบุ๊ก ซึ่งอาจต้องอัปเดตโค้ดที่มีอยู่เพื่อแคชสถานะของตัวควบคุมและการตั้งค่าเมื่อย้ายจากเวิร์กบุ๊กหนึ่งไปอีกเวิร์กบุ๊ก

**ดูเพิ่มเติม:** [Open Excel workbooks in separate windows and view them side by side](https://blogs.office.com/b/microsoft-excel/archive/2013/02/07/open-multiple-excel-files-in-separate-windows-and-view-them-side-by-side.aspx), [Excel 2013 single document interface (SDI): How to rebuild your task panes to support it](https://www.add-in-express.com/creating-addins-blog/2013/02/28/excel2013-single-document-interface-task-panes/)

---

> ต้นฉบับ © Microsoft เผยแพร่บน Microsoft Learn (MicrosoftDocs/VBA-Docs) เอกสารนี้เป็นฉบับแปลเพื่อการศึกษา โปรดเทียบกับต้นฉบับเมื่อใช้งานจริง
