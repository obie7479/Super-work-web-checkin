# คู่มือการตั้งค่า Google Sheet และ Apps Script

คู่มือนี้จะช่วยคุณสร้าง Google Sheet และ Apps Script สำหรับระบบ Check-in อย่างละเอียดทีละขั้นตอน

## ขั้นตอนที่ 1: สร้าง Google Sheet

### 1.1 สร้าง Sheet ใหม่

1. ไปที่ [Google Sheets](https://sheets.google.com)
2. คลิก **Blank** เพื่อสร้าง Sheet ใหม่
3. ตั้งชื่อ Sheet (เช่น "Superwork Check-in")

### 1.2 ตั้งค่าคอลัมน์ Header

1. ในแถวแรก (Row 1) ใส่ header ตามนี้:

| A             | B           | C                | D        | E        | F        | G        |
| ------------- | ----------- | ---------------- | -------- | -------- | -------- | -------- |
| **Timestamp** | **User ID** | **Display Name** | **Role** | **Team** | **Date** | **Time** |

2. หรือพิมพ์ในเซลล์:

   - A1: `Timestamp`
   - B1: `User ID`
   - C1: `Display Name`
   - D1: `Role`
   - E1: `Team`
   - F1: `Date`
   - G1: `Time`

3. (Optional) จัดรูปแบบ header ให้เป็น **Bold** และใส่สีพื้นหลัง

### 1.3 คัดลอก Sheet ID

1. ดูที่ URL ของ Google Sheet:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
2. คัดลอกส่วน `SHEET_ID_HERE` (เป็นตัวอักษรและตัวเลขยาวๆ)
3. เก็บไว้ใช้ในขั้นตอนต่อไป

**ตัวอย่าง Sheet ID:**

```

1HR8ZC-BiBP-wsB_SUwWK01kSv0FoL6-3f1Qwcs0c1Xc
```

---

## ขั้นตอนที่ 2: สร้าง Google Apps Script

### 2.1 เปิด Apps Script Editor

1. ใน Google Sheet ที่สร้างไว้ คลิก **Extensions** → **Apps Script**
2. จะเปิดหน้าต่าง Apps Script Editor ขึ้นมา

### 2.2 วางโค้ด

1. ลบโค้ดเดิมทั้งหมด (ถ้ามี)
2. เปิดไฟล์ `apps-script.js` ในโปรเจกต์นี้
3. คัดลอกโค้ดทั้งหมด
4. วางใน Apps Script Editor

### 2.3 แก้ไข Sheet ID และ Sheet Name

1. หาบรรทัดนี้:

   ```javascript
   const SHEET_ID = "YOUR_SHEET_ID_HERE";
   const SHEET_NAME = "Sheet1";
   ```

2. แทนที่ `YOUR_SHEET_ID_HERE` ด้วย Sheet ID ที่คัดลอกไว้
3. ถ้า Sheet ของคุณชื่ออื่น (ไม่ใช่ "Sheet1") ให้เปลี่ยน `SHEET_NAME` ด้วย

**ตัวอย่าง:**

```javascript
const SHEET_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
const SHEET_NAME = "Sheet1";
```

### 2.4 บันทึกโปรเจกต์

1. คลิก **File** → **Save** หรือกด `Ctrl+S` (Windows) / `Cmd+S` (Mac)
2. ตั้งชื่อโปรเจกต์ (เช่น "Superwork Check-in API")
3. คลิก **OK**

---

## ขั้นตอนที่ 3: Deploy Apps Script เป็น Web App

### 3.1 เปิดหน้า Deploy

1. คลิก **Deploy** → **New deployment**
2. หรือคลิกไอคอน **Deploy** (รูปจรวด) ด้านบนขวา

### 3.2 ตั้งค่า Deployment

1. คลิกไอคอน **Select type** (รูปเกียร์) ด้านขวาของ "Select type"
2. เลือก **Web app**

### 3.3 ตั้งค่ารายละเอียด

กรอกข้อมูลตามนี้:

- **Description** (ไม่บังคับ): "Superwork Check-in API"
- **Execute as**: เลือก **Me** (อีเมลของคุณ)
- **Who has access**: เลือก **Anyone**

⚠️ **สำคัญ:** ต้องเลือก **Anyone** เพื่อให้ web app สามารถเรียกใช้ได้จากภายนอก

### 3.4 Deploy

1. คลิกปุ่ม **Deploy**
2. ครั้งแรกจะขึ้นหน้าต่างขออนุญาต:
   - คลิก **Authorize access**
   - เลือกบัญชี Google ของคุณ
   - คลิก **Advanced** → **Go to [Project Name] (unsafe)**
   - คลิก **Allow** เพื่ออนุญาต

### 3.5 คัดลอก Web App URL

1. หลังจาก Deploy สำเร็จ จะเห็นหน้า "Web app"
2. คัดลอก **Web App URL** (จะเป็น URL ยาวๆ)
3. เก็บไว้ใช้ในขั้นตอนต่อไป

**ตัวอย่าง Web App URL:**

```
https://script.google.com/macros/s/AKfycbydG2g46_2rllXuZFvCBIKutv4YDJGWZP6GxxGk3NZogfmEJA9k6HQyD_bup0-kqB1DzA/exec
```

---

## ขั้นตอนที่ 4: ตั้งค่าในโปรเจกต์

### 4.1 สร้างไฟล์ .env

1. ในโปรเจกต์ สร้างไฟล์ชื่อ `.env` ในโฟลเดอร์หลัก
2. เพิ่มบรรทัดนี้:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

3. แทนที่ `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec` ด้วย Web App URL ที่คัดลอกไว้

**ตัวอย่าง:**

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycby1234567890/exec
```

### 4.2 รีสตาร์ท Development Server

1. หยุด server ที่รันอยู่ (กด `Ctrl+C`)
2. รันใหม่:
   ```bash
   npm run dev
   ```

---

## ขั้นตอนที่ 5: ทดสอบ

### 5.1 ทดสอบ Apps Script

1. เปิด Web App URL ใน browser
2. ควรเห็น JSON response:
   ```json
   {
     "message": "Superwork Check-in API",
     "status": "running",
     "timestamp": "2025-01-15T10:30:00.000Z"
   }
   ```

### 5.2 ทดสอบ Check-in

1. เปิดเว็บแอปด้วย URL:
   ```
   http://localhost:3000/superwork?token=YOUR_TOKEN
   ```
2. ระบบจะดึงข้อมูลผู้ใช้อัตโนมัติ
3. คลิกปุ่ม **Check-in**
4. ตรวจสอบใน Google Sheet ว่ามีข้อมูลถูกบันทึกหรือไม่

---

## การแก้ไขปัญหา

### ปัญหา: Apps Script ไม่ทำงาน

**วิธีแก้:**

1. ตรวจสอบว่า Sheet ID ถูกต้อง
2. ตรวจสอบว่า Sheet Name ตรงกับชื่อ Sheet จริง
3. ตรวจสอบว่า Deploy แล้วและเลือก "Anyone" สำหรับ Who has access

### ปัญหา: CORS Error

**อาการ:**

- ข้อความ error: "Access to XMLHttpRequest has been blocked by CORS policy"
- ข้อความ error: "No 'Access-Control-Allow-Origin' header is present"

**วิธีแก้:**

1. **ตรวจสอบว่า Deploy Apps Script แล้ว:**

   - ไปที่ Apps Script Editor
   - Deploy → Manage deployments
   - ตรวจสอบว่ามี deployment อยู่

2. **ตรวจสอบการตั้งค่า Deployment:**

   - Execute as: **Me**
   - Who has access: **Anyone** (สำคัญมาก!)
   - ถ้ายังไม่ได้ตั้งค่า "Anyone" ให้ Deploy ใหม่

3. **Deploy ใหม่:**

   - Deploy → Manage deployments
   - คลิก Edit (ไอคอนดินสอ)
   - เลือก "New version"
   - ตรวจสอบว่า "Who has access" เป็น "Anyone"
   - คลิก Deploy

4. **ตรวจสอบว่าใช้ GET request:**

   - โค้ดปัจจุบันใช้ GET request แทน POST เพื่อหลีกเลี่ยง CORS
   - ถ้ายังมีปัญหา ให้ตรวจสอบ console ใน browser

5. **ถ้ายังไม่ได้ผล:**
   - ลองเปิด Web App URL โดยตรงใน browser
   - ควรเห็น JSON response
   - ถ้าไม่ได้ แสดงว่า Apps Script ยังไม่ deploy หรือมีปัญหา

### ปัญหา: ข้อมูลไม่ถูกบันทึก

**วิธีแก้:**

1. เปิด Apps Script Editor
2. ไปที่ **Executions** (ด้านซ้าย) เพื่อดู error logs
3. ตรวจสอบว่า Sheet ID และ Sheet Name ถูกต้อง

### ปัญหา: Duplicate ไม่ทำงาน

**วิธีแก้:**

1. ตรวจสอบว่าใน Sheet มีคอลัมน์ User ID (B) และ Date (F) ถูกต้อง
2. ตรวจสอบว่า header row อยู่ในแถวแรก
3. ลองลบข้อมูลทดสอบและลองใหม่

---

## หมายเหตุสำคัญ

1. **Sheet ID** กับ **Web App URL** เป็นคนละอย่างกัน

   - Sheet ID: ใช้ใน Apps Script code
   - Web App URL: ใช้ในไฟล์ `.env`

2. **ทุกครั้งที่แก้ไข Apps Script** ต้อง Deploy ใหม่:

   - Deploy → Manage deployments
   - คลิก Edit (ไอคอนดินสอ)
   - เลือก "New version"
   - คลิก Deploy

3. **Web App URL จะไม่เปลี่ยน** เว้นแต่จะ Deploy ใหม่และเลือก "New deployment" แทน "New version"

4. **การตั้งค่า "Who has access: Anyone"** จำเป็นสำหรับให้ web app ทำงานจากภายนอก

---

## สรุป Checklist

- [ ] สร้าง Google Sheet พร้อม header
- [ ] คัดลอก Sheet ID
- [ ] สร้าง Apps Script และวางโค้ด
- [ ] แก้ไข Sheet ID และ Sheet Name ในโค้ด
- [ ] Deploy Apps Script เป็น Web app
- [ ] ตั้งค่า "Who has access: Anyone"
- [ ] คัดลอก Web App URL
- [ ] สร้างไฟล์ `.env` และใส่ Web App URL
- [ ] รีสตาร์ท development server
- [ ] ทดสอบการทำงาน

---

## ต้องการความช่วยเหลือเพิ่มเติม?

หากมีปัญหาหรือข้อสงสัย สามารถ:

1. ตรวจสอบ error logs ใน Apps Script Editor → Executions
2. ตรวจสอบ console ใน browser (F12)
3. ตรวจสอบ Network tab เพื่อดู API calls
