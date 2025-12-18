# แก้ปัญหา CORS Error

## ปัญหา

เมื่อเรียก Google Apps Script จาก localhost หรือ domain อื่น จะเจอ CORS error:

```
Access to XMLHttpRequest at 'https://script.google.com/...' has been blocked by CORS policy
```

## สาเหตุ

Google Apps Script Web App มีข้อจำกัดเรื่อง CORS:

- **POST requests** จะถูกบล็อกโดย CORS policy
- **GET requests** รองรับ CORS แต่ต้องตั้งค่า deployment ให้ถูกต้อง

## วิธีแก้ไข

### 1. ใช้ GET Request แทน POST

โค้ดปัจจุบันได้แก้ไขให้ใช้ GET request แล้ว โดยส่งข้อมูลผ่าน query parameters

### 2. ตั้งค่า Deployment ให้ถูกต้อง

**สำคัญ:** ต้องตั้งค่า "Who has access" เป็น **Anyone**

1. ไปที่ Apps Script Editor
2. Deploy → Manage deployments
3. คลิก Edit (ไอคอนดินสอ)
4. ตรวจสอบว่า:
   - **Execute as:** Me
   - **Who has access:** **Anyone** ⚠️ (สำคัญมาก!)
5. ถ้ายังไม่ใช่ "Anyone" ให้เปลี่ยนและ Deploy ใหม่

### 3. Deploy ใหม่

ทุกครั้งที่แก้ไข Apps Script code ต้อง Deploy ใหม่:

1. Deploy → Manage deployments
2. คลิก Edit
3. เลือก "New version"
4. คลิก Deploy

### 4. ตรวจสอบ Web App URL

1. เปิด Web App URL ใน browser โดยตรง
2. ควรเห็น JSON response:
   ```json
   {
     "message": "Superwork Check-in API",
     "status": "running",
     "timestamp": "..."
   }
   ```
3. ถ้าไม่ได้ แสดงว่า Apps Script ยังไม่ deploy หรือมีปัญหา

## การทำงานของโค้ดปัจจุบัน

### Frontend (checkin.js)

- ใช้ `fetch()` กับ GET request
- ส่งข้อมูลผ่าน query parameters
- มี fallback เป็น JSONP ถ้า CORS ยังมีปัญหา

### Backend (apps-script.js)

- ใช้ `doGet()` แทน `doPost()`
- รองรับ JSONP callback (ถ้าส่ง callback parameter)
- ส่งกลับ JSON หรือ JSONP ตาม request

## ทดสอบ

1. เปิด browser console (F12)
2. ตรวจสอบ Network tab
3. เรียก check-in
4. ดูว่า request สำเร็จหรือไม่

## หมายเหตุ

- Google Apps Script Web App รองรับ CORS สำหรับ GET requests เมื่อ deploy เป็น "Anyone"
- POST requests จะถูกบล็อกเสมอ
- JSONP เป็นวิธี fallback ที่ใช้ได้ แต่ไม่แนะนำเพราะมีข้อจำกัด

## ยังมีปัญหา?

1. ตรวจสอบว่า Deploy Apps Script แล้ว
2. ตรวจสอบว่า "Who has access" เป็น "Anyone"
3. ตรวจสอบ Web App URL ในไฟล์ `.env`
4. ลอง Deploy ใหม่
5. ตรวจสอบ error logs ใน Apps Script Editor → Executions
