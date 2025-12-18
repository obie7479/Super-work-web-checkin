# Checklist: Deploy Apps Script และแก้ปัญหา

## ปัญหา: Response เป็น Default Message

ถ้าเห็น response แบบนี้:

```json
{
  "message": "Superwork Check-in API",
  "status": "running",
  "timestamp": "..."
}
```

**นี่หมายความว่า:** Apps Script ไม่ได้รับ `action` parameter หรือ Apps Script code ยังไม่ได้ deploy ใหม่

## Checklist แก้ปัญหา

### ✅ ขั้นตอนที่ 1: ตรวจสอบ Apps Script Code

1. เปิด Google Apps Script Editor
2. ตรวจสอบว่าโค้ดถูกต้อง:
   - มี `doGet` function
   - มีการตรวจสอบ `action` parameter
   - มี `SHEET_ID` และ `SHEET_NAME` ถูกตั้งค่าแล้ว

### ✅ ขั้นตอนที่ 2: Deploy Apps Script ใหม่

**สำคัญ:** ทุกครั้งที่แก้ไขโค้ด ต้อง Deploy ใหม่!

1. Apps Script Editor → **Deploy** → **Manage deployments**
2. คลิก **Edit** (ไอคอนดินสอ) ที่ deployment ที่ต้องการ
3. เลือก **New version**
4. ตรวจสอบว่า:
   - **Execute as:** Me
   - **Who has access:** **Anyone** ⚠️
5. คลิก **Deploy**

**หมายเหตุ:** Web App URL จะไม่เปลี่ยน (ใช้ URL เดิม)

### ✅ ขั้นตอนที่ 3: ตรวจสอบ Execution Logs

1. Apps Script Editor → **Executions** (ไอคอน play button)
2. ดู execution ล่าสุด
3. ตรวจสอบ logs:
   - `Received parameters: ...` - ต้องมี log นี้
   - `Action: checkin` หรือ `Action: check` - ต้องมี log นี้
   - ถ้าไม่มี log แสดงว่า Apps Script ไม่ได้รับ request

### ✅ ขั้นตอนที่ 4: ทดสอบ Web App URL โดยตรง

1. เปิด Web App URL ใน browser:

   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=checkin&userId=TEST&displayName=Test&role=Test&team=Test&date=2025-01-15&time=10:00:00&timestamp=2025-01-15T10:00:00Z
   ```

2. ควรเห็น response:

   ```json
   {
     "success": true,
     "message": "Check-in สำเร็จ",
     "data": {...}
   }
   ```

3. ถ้ายังเห็น default message:
   - Apps Script ยังไม่ได้ deploy ใหม่
   - หรือ Web App URL ไม่ถูกต้อง

### ✅ ขั้นตอนที่ 5: ตรวจสอบไฟล์ .env

1. เปิดไฟล์ `.env`
2. ตรวจสอบว่า `VITE_APPS_SCRIPT_URL` ถูกต้อง:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. ตรวจสอบว่า URL:
   - เริ่มต้นด้วย `https://script.google.com/macros/s/`
   - ลงท้ายด้วย `/exec`
   - **ไม่ใช่** `script.googleusercontent.com` หรือ `echo?user_content_key=`

### ✅ ขั้นตอนที่ 6: รีสตาร์ท Development Server

1. หยุด server (กด `Ctrl+C`)
2. รันใหม่:
   ```bash
   npm run dev
   ```

### ✅ ขั้นตอนที่ 7: ตรวจสอบ Browser Console

1. เปิด browser DevTools (F12)
2. ไปที่แท็บ **Console**
3. ดู logs:

   - `[CheckInService] Request URL: ...` - ต้องมี log นี้
   - `[CheckInService] Parameters: ...` - ต้องมี log นี้
   - `[CheckInService] Response: ...` - ต้องมี log นี้

4. ถ้ามี error:
   - อ่าน error message
   - ตรวจสอบว่า URL ถูกต้องหรือไม่
   - ตรวจสอบว่า Apps Script deploy แล้วหรือยัง

## สาเหตุที่พบบ่อย

### 1. ไม่ได้ Deploy Apps Script ใหม่

**อาการ:** Response เป็น default message
**วิธีแก้:** Deploy Apps Script ใหม่ (ขั้นตอนที่ 2)

### 2. Web App URL ไม่ถูกต้อง

**อาการ:** CORS error หรือ 404 Not Found
**วิธีแก้:** ดู `FIX_WEB_APP_URL.md`

### 3. Sheet ID ไม่ถูกต้อง

**อาการ:** Error ใน execution logs
**วิธีแก้:** ตรวจสอบ Sheet ID ในโค้ด

### 4. Permissions ไม่ถูกต้อง

**อาการ:** 403 Forbidden
**วิธีแก้:** ตั้งค่า "Who has access" เป็น "Anyone"

## Quick Fix

ถ้ายังไม่ได้ผล ลองทำตามนี้:

1. **Deploy Apps Script ใหม่** (สำคัญที่สุด!)
2. **ตรวจสอบ Web App URL** ในไฟล์ `.env`
3. **รีสตาร์ท development server**
4. **ทดสอบ Web App URL โดยตรง** ใน browser
5. **ตรวจสอบ Execution Logs** ใน Apps Script

## ตรวจสอบว่าแก้ไขแล้ว

✅ Response ไม่ใช่ default message  
✅ Response มี `success: true`  
✅ ข้อมูลถูกบันทึกลง Google Sheet  
✅ ไม่มี error ใน browser console  
✅ Execution Logs แสดงว่าได้รับ parameters
