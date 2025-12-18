# Quick Start Guide

คู่มือเริ่มต้นใช้งานอย่างรวดเร็ว

## ขั้นตอนด่วน (5 นาที)

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. สร้าง Google Sheet และ Apps Script

**วิธีที่ 1: ใช้คู่มือละเอียด (แนะนำ)**

- เปิดไฟล์ [SETUP_GUIDE.md](./SETUP_GUIDE.md) และทำตามทีละขั้นตอน

**วิธีที่ 2: ทำเอง**

1. สร้าง Google Sheet ใหม่
2. ใส่ header: `Timestamp | User ID | Display Name | Role | Team | Date | Time`
3. คัดลอก Sheet ID จาก URL
4. ไปที่ Extensions → Apps Script
5. วางโค้ดจาก `apps-script.js`
6. แก้ไข `SHEET_ID` และ `SHEET_NAME`
7. Deploy → New deployment → Web app
8. ตั้งค่า "Who has access: Anyone"
9. คัดลอก Web App URL

### 3. ตั้งค่า Environment Variable

สร้างไฟล์ `.env`:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 4. รัน Development Server

```bash
npm run dev
```

### 5. ทดสอบ

เปิด browser ไปที่:

```
http://localhost:5173/superwork?token=YOUR_JWT_TOKEN
```

---

## Checklist

- [ ] `npm install` เสร็จแล้ว
- [ ] สร้าง Google Sheet และ Apps Script แล้ว
- [ ] Deploy Apps Script แล้ว
- [ ] สร้างไฟล์ `.env` และใส่ Web App URL แล้ว
- [ ] รัน `npm run dev` แล้ว
- [ ] ทดสอบ check-in แล้ว

---

## ต้องการความช่วยเหลือ?

- **คู่มือละเอียด:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **README หลัก:** [README.md](./README.md)
