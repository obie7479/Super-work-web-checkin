/**
 * Google Apps Script สำหรับ Superwork Check-in
 * 
 * วิธีใช้งาน:
 * 1. ไปที่ Google Sheet → Extensions → Apps Script
 * 2. วางโค้ดนี้
 * 3. เปลี่ยน SHEET_ID และ SHEET_NAME ให้ตรงกับ Sheet ของคุณ
 * 4. Deploy → New deployment → Web app
 * 5. คัดลอก Web App URL ไปใส่ในไฟล์ .env
 * 
 * ดูคู่มือละเอียดในไฟล์ SETUP_GUIDE.md
 */

// ⚠️ ต้องแก้ไข: ใส่ Sheet ID ของคุณที่นี่ (หาได้จาก URL ของ Google Sheet)
// ตัวอย่าง URL: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
// คัดลอกส่วน SHEET_ID_HERE มาใส่ด้านล่าง
const SHEET_ID = '1HR8ZC-BiBP-wsB_SUwWK01kSv0FoL6-3f1Qwcs0c1Xc';

// ⚠️ ต้องแก้ไข: เปลี่ยนเป็นชื่อ Sheet ของคุณ (ถ้าไม่ใช่ "Sheet1")
const SHEET_NAME = 'Sheet1';

/**
 * รับ GET request จาก web app (แก้ปัญหา CORS)
 * ใช้ query parameters แทน POST body เพื่อหลีกเลี่ยง CORS preflight
 */
function doGet(e) {
  try {
    // ตรวจสอบว่า event object มีค่าหรือไม่ (กรณีเรียกจาก editor โดยตรง)
    if (!e || !e.parameter) {
      // ถ้าเรียกจาก editor โดยตรง ให้ return default message
      return createJSONResponse({
        message: 'Superwork Check-in API',
        status: 'running',
        timestamp: new Date().toISOString(),
        note: 'เรียกใช้ผ่าน Web App URL เท่านั้น (ไม่สามารถเรียกจาก editor โดยตรงได้)'
      });
    }
    
    // Log parameters ที่ได้รับ (สำหรับ debug)
    Logger.log('Received parameters: ' + JSON.stringify(e.parameter));
    Logger.log('Action: ' + e.parameter.action);
    
    // ตรวจสอบว่า Sheet ID ถูกตั้งค่าหรือยัง
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE') {
      return createJSONPResponse({
        success: false,
        message: 'กรุณาตั้งค่า SHEET_ID ใน Apps Script code',
        error: 'SHEET_ID not configured'
      }, e.parameter.callback);
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // ถ้าไม่มี header ให้สร้าง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'User ID', 'Display Name', 'Role', 'Team', 'Date', 'Time', 'Type']);
    }
    
    // ดึงข้อมูลจาก query parameters
    const action = e.parameter.action;
    const callback = e.parameter.callback; // สำหรับ JSONP
    
    // ถ้าไม่มี action parameter
    if (!action) {
      Logger.log('No action parameter provided');
      return createJSONPResponse({
        message: 'Superwork Check-in API',
        status: 'running',
        timestamp: new Date().toISOString(),
        note: 'กรุณาระบุ action parameter (check หรือ checkin)'
      }, callback);
    }
    
    // ตรวจสอบ duplicate
    if (action === 'check') {
      const userId = e.parameter.userId;
      const date = e.parameter.date;
      
      const lastRow = sheet.getLastRow();
      if (lastRow === 0) {
        return createJSONPResponse({
          success: true,
          exists: false
        }, callback);
      }
      
      const dataRange = sheet.getRange(2, 2, lastRow - 1, 1); // User ID column (column B)
      const datesRange = sheet.getRange(2, 6, lastRow - 1, 1); // Date column (column F)
      const userIds = dataRange.getValues().flat();
      const dates = datesRange.getValues().flat();
      
      // เปรียบเทียบ userId และ date (แปลง date เป็น string เพื่อเปรียบเทียบ)
      const exists = userIds.some((id, index) => {
        const sheetDate = dates[index];
        // แปลง date เป็น string ถ้าเป็น Date object
        const sheetDateStr = sheetDate instanceof Date 
          ? Utilities.formatDate(sheetDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')
          : String(sheetDate).trim();
        const checkDateStr = String(date).trim();
        
        return String(id).trim() === String(userId).trim() && sheetDateStr === checkDateStr;
      });
      
      return createJSONPResponse({
        success: true,
        exists: exists
      }, callback);
    }
    
    // ทำการ check-in
    if (action === 'checkin') {
      const userId = e.parameter.userId;
      const displayName = decodeURIComponent(e.parameter.displayName || '');
      const role = e.parameter.role || '';
      const team = decodeURIComponent(e.parameter.team || 'N/A');
      const date = e.parameter.date;
      const time = e.parameter.time;
      const timestamp = e.parameter.timestamp || new Date().toISOString();
      const type = decodeURIComponent(e.parameter.type || 'Manual'); // 'QR Code' หรือ 'Manual'
      
      // Log สำหรับ debug
      Logger.log('Check-in request - userId: ' + userId + ', date: ' + date);
      
      // ตรวจสอบ duplicate ก่อนบันทึก
      const lastRow = sheet.getLastRow();
      Logger.log('Last row: ' + lastRow);
      let exists = false;
      
      // ถ้ามีข้อมูลมากกว่า header row (row 1)
      if (lastRow > 1) {
        const dataRange = sheet.getRange(2, 2, lastRow - 1, 1); // User ID column (B)
        const datesRange = sheet.getRange(2, 6, lastRow - 1, 1); // Date column (F)
        const userIds = dataRange.getValues().flat();
        const dates = datesRange.getValues().flat();
        
        Logger.log('Checking duplicate - userId: ' + userId + ', date: ' + date);
        Logger.log('User IDs in sheet: ' + JSON.stringify(userIds));
        Logger.log('Dates in sheet: ' + JSON.stringify(dates));
        
        // เปรียบเทียบ userId และ date (แปลง date เป็น string เพื่อเปรียบเทียบ)
        exists = userIds.some((id, index) => {
          const sheetDate = dates[index];
          // แปลง date เป็น string ถ้าเป็น Date object
          const sheetDateStr = sheetDate instanceof Date 
            ? Utilities.formatDate(sheetDate, Session.getScriptTimeZone(), 'yyyy-MM-dd')
            : String(sheetDate).trim();
          const checkDateStr = String(date).trim();
          
          const userIdMatch = String(id).trim() === String(userId).trim();
          const dateMatch = sheetDateStr === checkDateStr;
          
          Logger.log('Comparing: userId=' + String(id).trim() + ' vs ' + String(userId).trim() + ' = ' + userIdMatch);
          Logger.log('Comparing: date=' + sheetDateStr + ' vs ' + checkDateStr + ' = ' + dateMatch);
          
          return userIdMatch && dateMatch;
        });
        
        Logger.log('Duplicate exists: ' + exists);
      }
      
      if (exists) {
        return createJSONPResponse({
          success: false,
          duplicate: true,
          message: 'คุณได้ทำการ check-in แล้ววันนี้'
        }, callback);
      }
      
      // บันทึกข้อมูล
      try {
        const timestampDate = new Date(timestamp);
        Logger.log('Appending row: ' + JSON.stringify([timestampDate, userId, displayName, role, team, date, time]));
        
        sheet.appendRow([
          timestampDate,
          userId,
          displayName,
          role,
          team,
          date,
          time
        ]);
        
        Logger.log('Row appended successfully');
        
        return createJSONPResponse({
          success: true,
          message: 'Check-in สำเร็จ',
          data: {
            userId: userId,
            date: date,
            time: time
          }
        }, callback);
      } catch (appendError) {
        Logger.log('Error appending row: ' + appendError.toString());
        return createJSONPResponse({
          success: false,
          message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + appendError.toString()
        }, callback);
      }
    }
    
    // ถ้า action ไม่ถูกต้อง
    Logger.log('Invalid action: ' + action);
    return createJSONPResponse({
      success: false,
      message: 'Invalid action. ใช้ "check" หรือ "checkin" เท่านั้น',
      receivedAction: action,
      timestamp: new Date().toISOString()
    }, callback);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    Logger.log('Error stack: ' + (error.stack || 'No stack trace'));
    
    // ตรวจสอบว่า e มีค่าหรือไม่ก่อนเข้าถึง e.parameter
    const callback = (e && e.parameter) ? e.parameter.callback : null;
    
    return createJSONPResponse({
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + error.toString()
    }, callback);
  }
}

/**
 * Helper function สำหรับสร้าง JSON response พร้อม CORS headers
 */
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper function สำหรับสร้าง JSONP response (รองรับ JSONP callback)
 */
function createJSONPResponse(data, callback) {
  if (callback) {
    // ถ้ามี callback parameter ให้ส่งกลับเป็น JSONP
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // ถ้าไม่มี callback ให้ส่งกลับเป็น JSON ธรรมดา
    return createJSONResponse(data);
  }
}

/**
 * รับ POST request (รองรับไว้สำหรับกรณีที่ต้องการใช้ POST)
 * แต่แนะนำให้ใช้ GET แทนเพื่อหลีกเลี่ยง CORS
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // ถ้าไม่มี header ให้สร้าง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'User ID', 'Display Name', 'Role', 'Team', 'Date', 'Time', 'Type']);
    }
    
    // ตรวจสอบ duplicate
    if (data.action === 'check') {
      const lastRow = sheet.getLastRow();
      if (lastRow === 0) {
        return createJSONResponse({
          success: true,
          exists: false
        });
      }
      
      const dataRange = sheet.getRange(2, 2, lastRow - 1, 1);
      const datesRange = sheet.getRange(2, 6, lastRow - 1, 1);
      const userIds = dataRange.getValues().flat();
      const dates = datesRange.getValues().flat();
      
      const exists = userIds.some((userId, index) => {
        return userId === data.userId && dates[index] === data.date;
      });
      
      return createJSONResponse({
        success: true,
        exists: exists
      });
    }
    
    // ทำการ check-in
    if (data.action === 'checkin') {
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
        return createJSONResponse({
          success: false,
          duplicate: true,
          message: 'คุณได้ทำการ check-in แล้ววันนี้'
        });
      }
      
      const timestamp = new Date(data.timestamp);
      const type = data.type || 'Manual';
      sheet.appendRow([
        timestamp,
        data.userId,
        data.displayName,
        data.role,
        data.team,
        data.date,
        data.time,
        type
      ]);
      
      return createJSONResponse({
        success: true,
        message: 'Check-in สำเร็จ',
        data: {
          userId: data.userId,
          date: data.date,
          time: data.time
        }
      });
    }
    
    return createJSONResponse({
      success: false,
      message: 'Invalid action'
    });
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createJSONResponse({
      success: false,
      message: error.toString()
    });
  }
}

