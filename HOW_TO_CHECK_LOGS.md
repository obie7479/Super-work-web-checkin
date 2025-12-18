# วิธีตรวจสอบ Execution Logs

## Execution Log คืออะไร?

Execution Log คือบันทึกการทำงานของ Apps Script ที่แสดง:

- ข้อความที่พิมพ์ด้วย `Logger.log()`
- Errors ที่เกิดขึ้น
- เวลาที่เริ่มและเสร็จสิ้น

## Execution Log ที่ถูกต้อง

เมื่อเรียกผ่าน Web App URL ควรเห็น logs แบบนี้:

```
1:41:00 PM  Notice  Execution started
1:41:00 PM  Info    Received parameters: {"action":"checkin","userId":"8a9e8756...","displayName":"Obie Mobile",...}
1:41:00 PM  Info    Action: checkin
1:41:00 PM  Info    Check-in request - userId: 8a9e8756-44f4-4136-9b4f-709ec4cf1a69, date: 2025-12-18
1:41:00 PM  Info    Last row: 1
1:41:00 PM  Info    Appending row: [...]
1:41:00 PM  Info    Row appended successfully
1:41:00 PM  Notice  Execution completed
```

## ถ้าเห็นแค่ "Execution started" และ "Execution completed"

**นี่หมายความว่า:**

- ยังไม่ได้เรียกผ่าน Web App URL
- หรือเรียกจาก Editor โดยตรง (คลิก Run)
- หรือไม่มี parameters ส่งมา

## วิธีตรวจสอบ Logs ที่ถูกต้อง

### ขั้นตอนที่ 1: เรียกผ่าน Web App URL

**อย่าคลิก "Run" ใน Editor!**

ทดสอบผ่าน browser:

```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=checkin&userId=TEST&displayName=Test&role=Test&team=Test&date=2025-12-18&time=13:41:00&timestamp=2025-12-18T06:41:00.000Z
```

### ขั้นตอนที่ 2: ดู Execution Logs

1. กลับไปที่ Apps Script Editor
2. คลิก **Execution log** (ปุ่มด้านบนขวา)
3. หรือไปที่ **Executions** (ไอคอน play button ด้านซ้าย)
4. ดู execution ล่าสุด
5. ควรเห็น logs:
   - `Received parameters: ...`
   - `Action: checkin`
   - `Check-in request - userId: ...`
   - `Last row: ...`
   - `Appending row: ...`
   - `Row appended successfully`

### ขั้นตอนที่ 3: ตรวจสอบจากเว็บแอป

1. เปิดเว็บแอป
2. คลิกปุ่ม "Check-in"
3. กลับไปที่ Apps Script Editor
4. ดู Execution Logs
5. ควรเห็น logs เหมือนขั้นตอนที่ 2

## Logs ที่ควรเห็น

### สำหรับ action=check (ตรวจสอบ duplicate)

```
Received parameters: {"action":"check","userId":"...","date":"2025-12-18"}
Action: check
```

### สำหรับ action=checkin (ทำการ check-in)

```
Received parameters: {"action":"checkin","userId":"...","displayName":"...",...}
Action: checkin
Check-in request - userId: ..., date: ...
Last row: 1
Appending row: [...]
Row appended successfully
```

## ถ้ายังไม่เห็น Logs

### ตรวจสอบว่า:

1. **Deploy Apps Script ใหม่แล้วหรือยัง?**

   - Deploy → Manage deployments → Edit → New version → Deploy

2. **Web App URL ถูกต้องหรือไม่?**

   - ต้องเป็น `https://script.google.com/macros/s/.../exec`
   - ไม่ใช่ `script.googleusercontent.com` หรือ `echo?user_content_key=`

3. **เรียกผ่าน Web App URL หรือยัง?**

   - อย่าคลิก "Run" ใน Editor
   - ใช้ browser เปิด Web App URL

4. **มี parameters ส่งไปหรือไม่?**
   - ตรวจสอบ URL ว่ามี `?action=checkin&...` หรือไม่

## หมายเหตุ

- **Execution Logs จะแสดงเฉพาะเมื่อเรียกผ่าน Web App URL**
- **การคลิก "Run" ใน Editor จะไม่แสดง logs ที่มี parameters**
- **Logs จะถูกเก็บไว้ใน Execution history**

## วิธีดู Execution History

1. Apps Script Editor → **Executions** (ไอคอน play button)
2. ดูรายการ executions ทั้งหมด
3. คลิกที่ execution ที่ต้องการ
4. ดู logs และ details
