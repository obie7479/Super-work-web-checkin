# คู่มือแก้ปัญหา: ข้อมูลไม่ถูกบันทึกลง Google Sheet

## ปัญหา: Check-in สำเร็จแต่ข้อมูลไม่ถูกบันทึก

### วิธีตรวจสอบ

#### 1. ตรวจสอบ Apps Script Execution Logs

1. ไปที่ Google Apps Script Editor
2. คลิก **Executions** (ไอคอน play button) ด้านซ้าย
3. ดู execution logs ล่าสุด
4. ตรวจสอบว่ามี error หรือไม่

**สิ่งที่ต้องดู:**

- `Check-in request - userId: ...` - ต้องมี log นี้
- `Last row: ...` - ต้องแสดงจำนวนแถว
- `Appending row: ...` - ต้องมี log นี้
- `Row appended successfully` - ต้องมี log นี้

**ถ้ามี error:**

- ดู error message
- ตรวจสอบว่า Sheet ID ถูกต้องหรือไม่
- ตรวจสอบว่า Sheet Name ถูกต้องหรือไม่

#### 2. ตรวจสอบ Sheet ID และ Sheet Name

1. เปิด Google Sheet
2. ดู URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. คัดลอก `SHEET_ID_HERE`
4. ไปที่ Apps Script Editor
5. ตรวจสอบว่า `SHEET_ID` ในโค้ดตรงกับ Sheet ID จริง
6. ตรวจสอบว่า `SHEET_NAME` ตรงกับชื่อ Sheet (ดูที่ tab ด้านล่าง)

**ตัวอย่าง:**

```javascript
const SHEET_ID = "1HR8ZC-BiBP-wsB_SUwWK01kSv0FoL6-3f1Qwcs0c1Xc"; // ต้องตรงกับ Sheet จริง
const SHEET_NAME = "Sheet1"; // ต้องตรงกับชื่อ tab
```

#### 3. ตรวจสอบ Permissions

1. ไปที่ Apps Script Editor
2. Deploy → Manage deployments
3. ตรวจสอบว่า:
   - **Execute as:** Me
   - **Who has access:** **Anyone** ⚠️ (สำคัญมาก!)

#### 4. ทดสอบ Apps Script โดยตรง

1. เปิด Web App URL ใน browser:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=checkin&userId=TEST&displayName=Test&role=Test&team=Test&date=2025-01-15&time=10:00:00&timestamp=2025-01-15T10:00:00Z
   ```
2. ดู response ว่ามี `success: true` หรือไม่
3. ตรวจสอบ Google Sheet ว่ามีข้อมูลถูกบันทึกหรือไม่

#### 5. ตรวจสอบ Network Request

1. เปิด browser DevTools (F12)
2. ไปที่แท็บ **Network**
3. คลิกปุ่ม Check-in
4. ดู request `exec?action=checkin...`
5. ดู Response tab ว่ามี `success: true` หรือไม่
6. ดู Headers tab ว่ามี `Access-Control-Allow-Origin: *` หรือไม่

### สาเหตุที่พบบ่อย

#### 1. Sheet ID ไม่ถูกต้อง

**อาการ:** Error ใน execution logs
**วิธีแก้:** ตรวจสอบ Sheet ID ในโค้ดให้ตรงกับ Sheet จริง

#### 2. Sheet Name ไม่ถูกต้อง

**อาการ:** Error "Cannot find sheet with name..."
**วิธีแก้:** ตรวจสอบชื่อ Sheet tab ว่าตรงกับ `SHEET_NAME` หรือไม่

#### 3. ไม่ได้ Deploy Apps Script

**อาการ:** Response เป็น default message ไม่ใช่ check-in response
**วิธีแก้:** Deploy Apps Script ใหม่

#### 4. Permissions ไม่ถูกต้อง

**อาการ:** CORS error หรือ 403 Forbidden
**วิธีแก้:** ตั้งค่า "Who has access" เป็น "Anyone"

#### 5. Header Row ถูกสร้างซ้ำ

**อาการ:** ข้อมูลถูกบันทึกแต่ไม่ตรงคอลัมน์
**วิธีแก้:** ลบ header row ที่ซ้ำออก หรือแก้โค้ดให้ตรวจสอบ header ก่อนสร้าง

### วิธีแก้ไข

#### ขั้นตอนที่ 1: ตรวจสอบ Execution Logs

1. Apps Script Editor → Executions
2. ดู logs ล่าสุด
3. ถ้ามี error ให้แก้ตาม error message

#### ขั้นตอนที่ 2: แก้ไข Sheet ID และ Sheet Name

1. เปิด Google Sheet
2. คัดลอก Sheet ID จาก URL
3. เปิด Apps Script Editor
4. แก้ไข `SHEET_ID` และ `SHEET_NAME`
5. บันทึก (Ctrl+S / Cmd+S)

#### ขั้นตอนที่ 3: Deploy ใหม่

1. Deploy → Manage deployments
2. คลิก Edit (ไอคอนดินสอ)
3. เลือก "New version"
4. ตรวจสอบว่า "Who has access" เป็น "Anyone"
5. คลิก Deploy

#### ขั้นตอนที่ 4: ทดสอบใหม่

1. รีเฟรชหน้าเว็บ
2. ลอง check-in อีกครั้ง
3. ตรวจสอบ Google Sheet
4. ตรวจสอบ Execution Logs

### Debug Tips

1. **เพิ่ม Logger.log()** ในโค้ดเพื่อดูค่าตัวแปร
2. **ทดสอบด้วย doGet โดยตรง** ใน browser
3. **ตรวจสอบ Execution Logs** ทุกครั้งที่มีปัญหา
4. **ใช้ Apps Script Editor → Run** เพื่อทดสอบ function

### ตัวอย่าง Execution Log ที่ถูกต้อง

```
Check-in request - userId: 8a9e8756-44f4-4136-9b4f-709ec4cf1a69, date: 2025-01-15
Last row: 1
Appending row: ["2025-01-15T10:00:00.000Z","8a9e8756-44f4-4136-9b4f-709ec4cf1a69","Obie Mobile","Approval","AIDC TECH","2025-01-15","10:00:00"]
Row appended successfully
```

### ยังแก้ไม่ได้?

1. ตรวจสอบ Execution Logs อีกครั้ง
2. ลองทดสอบ Apps Script โดยตรงใน browser
3. ตรวจสอบว่า Sheet ID และ Sheet Name ถูกต้อง
4. ลอง Deploy ใหม่
5. ตรวจสอบ Permissions
