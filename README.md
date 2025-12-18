# Superwork Check-in Web Application

เว็บแอปพลิเคชันสำหรับระบบ check-in ที่เชื่อมต่อกับ Superwork API และบันทึกข้อมูลลง Google Sheet

## คุณสมบัติ

- ✅ ดึงข้อมูลผู้ใช้จาก Superwork API
- ✅ แสดงข้อมูลผู้ใช้ (ชื่อ, avatar, role, team)
- ✅ ระบบ check-in พร้อมตรวจสอบ duplicate (1 ครั้ง/วัน/คน)
- ✅ บันทึกข้อมูลลง Google Sheet ผ่าน Google Apps Script
- ✅ Responsive design
- ✅ UI ภาษาไทย

## การติดตั้ง

1. ติดตั้ง dependencies:

```bash
npm install
```

2. สร้างไฟล์ `.env` และเพิ่ม Google Apps Script URL:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

3. รัน development server:

```bash
npm run dev
```

4. Build สำหรับ production:

```bash
npm run build
```

## การใช้งาน

1. เข้าถึงเว็บไซต์ด้วย URL ที่มี token:

```
http://localhost:3000/superwork?token=YOUR_JWT_TOKEN
```

2. ระบบจะดึงข้อมูลผู้ใช้อัตโนมัติ
3. คลิกปุ่ม "Check-in" เพื่อบันทึกการเข้างาน
4. ระบบจะตรวจสอบ duplicate อัตโนมัติ (1 ครั้ง/วัน/คน)

## Google Apps Script Setup

> 📖 **คู่มือละเอียด:** ดู [SETUP_GUIDE.md](./SETUP_GUIDE.md) สำหรับคำแนะนำทีละขั้นตอนพร้อมภาพประกอบ

### 1. สร้าง Google Sheet

สร้าง Google Sheet ใหม่พร้อมคอลัมน์ต่อไปนี้:

| Timestamp | User ID | Display Name | Role | Team | Date | Time |
| --------- | ------- | ------------ | ---- | ---- | ---- | ---- |

### 2. สร้าง Google Apps Script

1. ไปที่ Google Sheet → Extensions → Apps Script
2. วางโค้ดต่อไปนี้:

```javascript
// ใส่ Sheet ID ของคุณที่นี่
const SHEET_ID = "YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Sheet1"; // หรือชื่อ sheet ของคุณ

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    // ถ้าไม่มี header ให้สร้าง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "User ID",
        "Display Name",
        "Role",
        "Team",
        "Date",
        "Time",
      ]);
    }

    if (data.action === "check") {
      // ตรวจสอบ duplicate
      const lastRow = sheet.getLastRow();
      if (lastRow === 0) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: true,
            exists: false,
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const dataRange = sheet.getRange(2, 2, lastRow - 1, 1); // User ID column
      const datesRange = sheet.getRange(2, 6, lastRow - 1, 1); // Date column
      const userIds = dataRange.getValues().flat();
      const dates = datesRange.getValues().flat();

      const exists = userIds.some((userId, index) => {
        return userId === data.userId && dates[index] === data.date;
      });

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          exists: exists,
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "checkin") {
      // ตรวจสอบ duplicate ก่อนบันทึก
      const lastRow = sheet.getLastRow();
      let exists = false;

      if (lastRow > 0) {
        const dataRange = sheet.getRange(2, 2, lastRow - 1, 1);
        const datesRange = sheet.getRange(2, 6, lastRow - 1, 1);
        const userIds = dataRange.getValues().flat();
        const dates = datesRange.getValues().flat();

        exists = userIds.some((userId, index) => {
          return userId === data.userId && dates[index] === data.date;
        });
      }

      if (exists) {
        return ContentService.createTextOutput(
          JSON.stringify({
            success: false,
            duplicate: true,
            message: "คุณได้ทำการ check-in แล้ววันนี้",
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      // บันทึกข้อมูล
      const timestamp = new Date(data.timestamp);
      sheet.appendRow([
        timestamp,
        data.userId,
        data.displayName,
        data.role,
        data.team,
        data.date,
        data.time,
      ]);

      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: "Check-in สำเร็จ",
          data: {
            userId: data.userId,
            date: data.date,
            time: data.time,
          },
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Invalid action",
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      message: "Superwork Check-in API",
      status: "running",
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

3. เปลี่ยน `SHEET_ID` เป็น Sheet ID ของคุณ (หาได้จาก URL ของ Google Sheet)
4. Deploy → New deployment → Type: Web app
5. Execute as: Me
6. Who has access: Anyone
7. คัดลอก Web App URL และใส่ในไฟล์ `.env`

## โครงสร้างโปรเจกต์

```
/
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── App.jsx           # Main app component
│   ├── App.css
│   ├── main.jsx          # React entry point
│   ├── index.css         # Global styles
│   ├── services/
│   │   ├── api.js        # Superwork API service
│   │   └── checkin.js    # Check-in service
│   ├── components/
│   │   ├── UserProfile.jsx
│   │   ├── UserProfile.css
│   │   ├── CheckInButton.jsx
│   │   └── CheckInButton.css
│   └── utils/
│       └── dateUtils.js  # Date utilities
├── apps-script.js        # Google Apps Script code
├── SETUP_GUIDE.md        # คู่มือการตั้งค่า Google Sheet และ Apps Script
└── README.md
```

## License

MIT
