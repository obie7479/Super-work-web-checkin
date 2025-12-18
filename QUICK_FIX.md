# ⚡ Quick Fix: แก้ปัญหา "Apps Script ไม่ได้รับ action parameter"

## ปัญหา

Error: `Apps Script ไม่ได้รับ action parameter กรุณาตรวจสอบว่า Apps Script code ถูก deploy แล้ว`

## วิธีแก้ (3 ขั้นตอน)

### ✅ ขั้นตอนที่ 1: Deploy Apps Script ใหม่

1. เปิด **Google Apps Script Editor**
2. คลิก **Deploy** → **Manage deployments**
3. คลิก **Edit** (ไอคอนดินสอ) ที่ deployment ที่มีอยู่
4. เลือก **"New version"** (สำคัญ!)
5. ตรวจสอบว่า:
   - **Execute as:** Me
   - **Who has access:** **Anyone** ⚠️
6. คลิก **Deploy**

**⏱️ ใช้เวลา:** ~30 วินาที

### ✅ ขั้นตอนที่ 2: รอสักครู่

รอ 10-30 วินาที เพื่อให้ Apps Script อัปเดต

### ✅ ขั้นตอนที่ 3: ทดสอบ

1. **รีเฟรชหน้าเว็บ** (F5)
2. **คลิกปุ่ม "Check-in"** อีกครั้ง
3. ควรเห็นข้อความ **"Check-in สำเร็จ"** ✅

## ตรวจสอบว่าแก้ไขแล้ว

### ✅ วิธีที่ 1: ดูจากเว็บแอป

- ไม่มี error message
- แสดงข้อความ "Check-in สำเร็จ"
- ปุ่มเปลี่ยนเป็น "✓ Check-in แล้ววันนี้"

### ✅ วิธีที่ 2: ดูจาก Console

- ไม่มี error `Apps Script ไม่ได้รับ action parameter`
- Response มี `success: true`
- ไม่มี warning messages

### ✅ วิธีที่ 3: ดูจาก Google Sheet

- มีข้อมูลถูกบันทึกใน Sheet
- มีแถวใหม่ที่มีข้อมูล check-in

## ถ้ายังไม่ได้ผล

### ตรวจสอบว่า:

1. **Deploy แล้วหรือยัง?**

   - ไปที่ Deploy → Manage deployments
   - ดูว่า deployment ล่าสุดเป็น "New version" หรือไม่

2. **Web App URL ถูกต้องหรือไม่?**

   - ตรวจสอบไฟล์ `.env`
   - URL ต้องเป็น `https://script.google.com/macros/s/.../exec`
   - **ไม่ใช่** `script.googleusercontent.com` หรือ `echo?user_content_key=`

3. **รอสักครู่**

   - บางครั้ง Apps Script ต้องใช้เวลาในการอัปเดต
   - ลองรอ 1-2 นาที แล้วลองใหม่

4. **รีสตาร์ท Development Server**
   ```bash
   # หยุด server (Ctrl+C)
   npm run dev
   ```

## Checklist

- [ ] Deploy Apps Script ใหม่แล้ว (New version)
- [ ] ตั้งค่า "Who has access" เป็น "Anyone"
- [ ] รอ 10-30 วินาที
- [ ] รีเฟรชหน้าเว็บ
- [ ] ทดสอบ check-in อีกครั้ง
- [ ] ตรวจสอบ Google Sheet

## ยังไม่ได้ผล?

ดูคู่มือเพิ่มเติม:

- `DEPLOY_CHECKLIST.md` - Checklist แก้ปัญหา
- `FIX_WEB_APP_URL.md` - แก้ปัญหา URL
- `HOW_TO_CHECK_LOGS.md` - วิธีตรวจสอบ logs
