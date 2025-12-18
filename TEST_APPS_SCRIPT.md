# วิธีทดสอบ Apps Script

## ⚠️ สำคัญ: ไม่สามารถเรียก doGet() จาก Editor โดยตรงได้

เมื่อคลิก "Run" ใน Apps Script Editor โดยตรง จะไม่มี event object (`e`) ส่งมา ทำให้เกิด error:

```
TypeError: Cannot read properties of undefined (reading 'parameter')
```

## วิธีทดสอบที่ถูกต้อง

### วิธีที่ 1: ทดสอบผ่าน Web App URL (แนะนำ)

1. Deploy Apps Script เป็น Web app ก่อน
2. เปิด Web App URL ใน browser:

   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=checkin&userId=TEST&displayName=Test&role=Test&team=Test&date=2025-01-15&time=10:00:00&timestamp=2025-01-15T10:00:00Z
   ```

3. ควรเห็น response:
   ```json
   {
     "success": true,
     "message": "Check-in สำเร็จ",
     "data": {...}
   }
   ```

### วิธีที่ 2: สร้าง Test Function

เพิ่ม function นี้ใน Apps Script เพื่อทดสอบ:

```javascript
function testDoGet() {
  // สร้าง mock event object
  const mockEvent = {
    parameter: {
      action: "checkin",
      userId: "TEST_USER_ID",
      displayName: "Test User",
      role: "Test",
      team: "Test Team",
      date: "2025-01-15",
      time: "10:00:00",
      timestamp: new Date().toISOString(),
    },
  };

  // เรียก doGet ด้วย mock event
  const result = doGet(mockEvent);
  Logger.log("Result: " + result.getContent());

  return result;
}
```

**วิธีใช้:**

1. วาง function `testDoGet()` ใน Apps Script Editor
2. เลือก function `testDoGet` จาก dropdown
3. คลิก "Run"
4. ดูผลลัพธ์ใน Execution log

### วิธีที่ 3: ตรวจสอบ Execution Logs

1. Apps Script Editor → **Executions**
2. ดู execution ล่าสุด
3. ตรวจสอบ logs:
   - `Received parameters: ...` - ต้องมี log นี้
   - `Action: checkin` - ต้องมี log นี้
   - `Check-in request - userId: ...` - ต้องมี log นี้

## Checklist ก่อน Deploy

- [ ] Sheet ID ถูกตั้งค่าแล้ว
- [ ] Sheet Name ถูกต้อง
- [ ] โค้ดไม่มี syntax error
- [ ] ทดสอบผ่าน Web App URL แล้ว
- [ ] Execution Logs แสดงผลถูกต้อง

## หมายเหตุ

- **อย่าคลิก "Run" บน `doGet` function โดยตรง** - จะเกิด error
- **ใช้ Web App URL เพื่อทดสอบ** - นี่คือวิธีที่ถูกต้อง
- **Deploy Apps Script ใหม่ทุกครั้งที่แก้ไขโค้ด**
