# แก้ปัญหา: URL ไม่ถูกต้อง - ข้อมูลไม่ถูกบันทึก

## ปัญหา

URL ที่ใช้เป็น:

```
https://script.googleusercontent.com/macros/echo?user_content_key=...
```

**นี่ไม่ใช่ Web App URL ที่ถูกต้อง!**

URL นี้เป็น redirect URL จาก Google ซึ่งไม่สามารถใช้ได้โดยตรง และจะไม่ทำงานกับระบบ check-in

## Web App URL ที่ถูกต้อง

Web App URL ที่ถูกต้องควรเป็นรูปแบบนี้:

```
https://script.google.com/macros/s/SCRIPT_ID/exec
```

**ตัวอย่าง:**

```
https://script.google.com/macros/s/AKfycbydG2g46_2rllXuZFvCBIKutv4YDJGWZP6GxxGk3NZogfmEJA9k6HQyD_bup0-kqB1DzA/exec
```

## วิธีหา Web App URL ที่ถูกต้อง

### ขั้นตอนที่ 1: ไปที่ Apps Script Editor

1. เปิด Google Sheet
2. คลิก **Extensions** → **Apps Script**
3. หรือไปที่ [script.google.com](https://script.google.com)

### ขั้นตอนที่ 2: Deploy Web App

1. ใน Apps Script Editor คลิก **Deploy** → **New deployment**
2. หรือคลิกไอคอน **Deploy** (รูปจรวด) ด้านบนขวา
3. คลิกไอคอน **Select type** (รูปเกียร์) ด้านขวา
4. เลือก **Web app**

### ขั้นตอนที่ 3: ตั้งค่า Deployment

กรอกข้อมูลตามนี้:

- **Description** (ไม่บังคับ): "Superwork Check-in API"
- **Execute as**: เลือก **Me** (อีเมลของคุณ)
- **Who has access**: เลือก **Anyone** ⚠️ (สำคัญมาก!)

### ขั้นตอนที่ 4: Deploy

1. คลิกปุ่ม **Deploy**
2. ครั้งแรกจะขึ้นหน้าต่างขออนุญาต:
   - คลิก **Authorize access**
   - เลือกบัญชี Google ของคุณ
   - คลิก **Advanced** → **Go to [Project Name] (unsafe)**
   - คลิก **Allow** เพื่ออนุญาต

### ขั้นตอนที่ 5: คัดลอก Web App URL

**สำคัญ:** หลังจาก Deploy สำเร็จ จะเห็นหน้า "Web app" ที่มี:

1. **Web App URL** - นี่คือ URL ที่ถูกต้อง!

   - ควรเริ่มต้นด้วย `https://script.google.com/macros/s/`
   - ลงท้ายด้วย `/exec`
   - **ไม่ใช่** `script.googleusercontent.com` หรือ `echo?user_content_key=`

2. คัดลอก URL นี้ (คลิกไอคอน copy ด้านขวา)

**ตัวอย่าง Web App URL ที่ถูกต้อง:**

```
https://script.google.com/macros/s/AKfycbydG2g46_2rllXuZFvCBIKutv4YDJGWZP6GxxGk3NZogfmEJA9k6HQyD_bup0-kqB1DzA/exec
```

### ขั้นตอนที่ 6: ตรวจสอบ URL

ลองเปิด Web App URL ใน browser โดยตรง:

1. เปิด URL ใน browser
2. ควรเห็น JSON response:
   ```json
   {
     "message": "Superwork Check-in API",
     "status": "running",
     "timestamp": "2025-12-18T..."
   }
   ```
3. ถ้าเห็น response นี้ แสดงว่า URL ถูกต้อง ✅

### ขั้นตอนที่ 7: อัปเดตไฟล์ .env

1. เปิดไฟล์ `.env` ในโปรเจกต์
2. แก้ไข `VITE_APPS_SCRIPT_URL` ให้เป็น Web App URL ที่ถูกต้อง:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**ตัวอย่าง:**

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbydG2g46_2rllXuZFvCBIKutv4YDJGWZP6GxxGk3NZogfmEJA9k6HQyD_bup0-kqB1DzA/exec
```

### ขั้นตอนที่ 8: รีสตาร์ท Development Server

1. หยุด server ที่รันอยู่ (กด `Ctrl+C`)
2. รันใหม่:
   ```bash
   npm run dev
   ```

### ขั้นตอนที่ 9: ทดสอบ

1. เปิดเว็บแอป
2. ลอง check-in
3. ตรวจสอบ Google Sheet ว่ามีข้อมูลถูกบันทึกหรือไม่

## วิธีตรวจสอบว่า URL ถูกต้องหรือไม่

### ✅ URL ที่ถูกต้อง:

- เริ่มต้นด้วย `https://script.google.com/macros/s/`
- ลงท้ายด้วย `/exec`
- ไม่มี `user_content_key` หรือ `echo` ใน URL

### ❌ URL ที่ไม่ถูกต้อง:

- `https://script.googleusercontent.com/...`
- มี `echo?user_content_key=...`
- ไม่ลงท้ายด้วย `/exec`

## ถ้ายังหา Web App URL ไม่เจอ

### วิธีที่ 1: ดูจาก Manage Deployments

1. Apps Script Editor → **Deploy** → **Manage deployments**
2. คลิกที่ deployment ที่ต้องการ
3. คัดลอก **Web app URL** จากหน้า deployment

### วิธีที่ 2: Deploy ใหม่

1. Apps Script Editor → **Deploy** → **New deployment**
2. เลือก **Web app**
3. ตั้งค่าและ Deploy
4. คัดลอก Web App URL

## หมายเหตุสำคัญ

1. **Web App URL จะไม่เปลี่ยน** เว้นแต่จะ Deploy ใหม่และเลือก "New deployment"
2. **ถ้าแก้ไข Apps Script code** ต้อง Deploy ใหม่:
   - Deploy → Manage deployments
   - คลิก Edit → New version
   - คลิก Deploy
   - **Web App URL จะยังเหมือนเดิม** (ไม่ต้องเปลี่ยนใน .env)

## Checklist

- [ ] Deploy Apps Script เป็น Web app แล้ว
- [ ] ตั้งค่า "Who has access" เป็น "Anyone"
- [ ] คัดลอก Web App URL ที่ถูกต้อง (เริ่มต้นด้วย `script.google.com/macros/s/`)
- [ ] อัปเดตไฟล์ `.env` ด้วย Web App URL ที่ถูกต้อง
- [ ] รีสตาร์ท development server
- [ ] ทดสอบ Web App URL โดยตรงใน browser
- [ ] ทดสอบ check-in อีกครั้ง
