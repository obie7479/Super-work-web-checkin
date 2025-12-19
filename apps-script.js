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
        note: 'Use Web App URL only (cannot be called directly from editor)'
      });
    }
    
    // Log parameters ที่ได้รับ (สำหรับ debug)
    Logger.log('Received parameters: ' + JSON.stringify(e.parameter));
    Logger.log('Action: ' + e.parameter.action);
    
    // ตรวจสอบว่า Sheet ID ถูกตั้งค่าหรือยัง
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE') {
      return createJSONPResponse({
        success: false,
        message: 'Please configure SHEET_ID in Apps Script code',
        error: 'SHEET_ID not configured'
      }, e.parameter.callback);
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // ถ้าไม่มี header ให้สร้าง
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['NO', 'Timestamp', 'User ID', 'First Name', 'Last Name', 'Display Name', 'Avatar URL', 'Role', 'Position', 'Team', 'Date', 'Time', 'Type', 'Location']);
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
        note: 'Please specify action parameter (check or checkin)'
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
      
      const dataRange = sheet.getRange(2, 3, lastRow - 1, 1); // User ID column (column C, shifted due to NO column)
      const datesRange = sheet.getRange(2, 7, lastRow - 1, 1); // Date column (column G, shifted due to NO column)
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
      const firstName = decodeURIComponent(e.parameter.firstName || '');
      const lastName = decodeURIComponent(e.parameter.lastName || '');
      const displayName = decodeURIComponent(e.parameter.displayName || '');
      const avatarURL = decodeURIComponent(e.parameter.avatarURL || '');
      const role = e.parameter.role || '';
      const position = decodeURIComponent(e.parameter.position || 'N/A');
      const team = decodeURIComponent(e.parameter.team || 'N/A');
      const date = e.parameter.date;
      const time = e.parameter.time;
      const timestamp = e.parameter.timestamp || new Date().toISOString();
      const type = decodeURIComponent(e.parameter.type || 'Manual'); // 'QR Code' หรือ 'Manual'
      const location = decodeURIComponent(e.parameter.location || 'N/A'); // Location data
      
      // Log สำหรับ debug
      Logger.log('Check-in request - userId: ' + userId + ', date: ' + date + ', type: ' + type + ', location: ' + location);
      
      // ตรวจสอบ duplicate ก่อนบันทึก
      const lastRow = sheet.getLastRow();
      Logger.log('Last row: ' + lastRow);
      let exists = false;
      
      // ถ้ามีข้อมูลมากกว่า header row (row 1)
      if (lastRow > 1) {
        const dataRange = sheet.getRange(2, 3, lastRow - 1, 1); // User ID column (C, shifted due to NO column)
        const datesRange = sheet.getRange(2, 11, lastRow - 1, 1); // Date column (K, shifted due to new columns)
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
          message: 'You have already checked in today'
        }, callback);
      }
      
      // บันทึกข้อมูล
      try {
        const timestampDate = new Date(timestamp);
        
        // คำนวณเลขลำดับถัดไป (NO)
        // ถ้ามีแค่ header row (row 1) ให้เริ่มที่ 1, ถ้ามีข้อมูลแล้วให้ใช้ lastRow - 1
        const nextNo = lastRow; // lastRow จะเป็น 1 ถ้ามีแค่ header, 2 ถ้ามีข้อมูล 1 แถว, etc.
        const formattedNo = Utilities.formatString('%04d', nextNo); // Format เป็น 0001, 0002, etc.
        
        Logger.log('Appending row with NO: ' + formattedNo);
        Logger.log('Appending row: ' + JSON.stringify([formattedNo, timestampDate, userId, firstName, lastName, displayName, avatarURL, role, position, team, date, time, type, location]));
        
        sheet.appendRow([
          formattedNo,
          timestampDate,
          userId,
          firstName,
          lastName,
          displayName,
          avatarURL,
          role,
          position,
          team,
          date,
          time,
          type,
          location
        ]);
        
        Logger.log('Row appended successfully');
        
        return createJSONPResponse({
          success: true,
          message: 'Check-in successful',
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
          message: 'Error saving data: ' + appendError.toString()
        }, callback);
      }
    }
    
    // ดึงประวัติการ check-in
    if (action === 'history') {
      const userId = e.parameter.userId;
      const limit = parseInt(e.parameter.limit || '50'); // จำกัดจำนวนรายการ (default 50)
      
      Logger.log('Fetching history for userId: ' + userId + ', limit: ' + limit);
      
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        // ถ้ามีแค่ header หรือไม่มีข้อมูล
        return createJSONPResponse({
          success: true,
          history: [],
          count: 0
        }, callback);
      }
      
      // ดึงข้อมูลทั้งหมด (เริ่มจาก row 2 เพราะ row 1 เป็น header)
      // Columns: NO, Timestamp, User ID, First Name, Last Name, Display Name, Avatar URL, Role, Position, Team, Date, Time, Type, Location
      const dataRange = sheet.getRange(2, 1, lastRow - 1, 14);
      const allData = dataRange.getValues();
      
      // กรองข้อมูลเฉพาะ userId ที่ต้องการ
      const userHistory = allData
        .filter(row => String(row[2]).trim() === String(userId).trim()) // Column C (index 2) = User ID
        .map(row => ({
          no: row[0] || '', // NO
          timestamp: row[1] instanceof Date 
            ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
            : String(row[1] || ''), // Timestamp
          userId: String(row[2] || ''), // User ID
          firstName: String(row[3] || ''), // First Name
          lastName: String(row[4] || ''), // Last Name
          displayName: String(row[5] || ''), // Display Name
          avatarURL: String(row[6] || ''), // Avatar URL
          role: String(row[7] || ''), // Role
          position: String(row[8] || ''), // Position
          team: String(row[9] || ''), // Team
          date: row[10] instanceof Date
            ? Utilities.formatDate(row[10], Session.getScriptTimeZone(), 'yyyy-MM-dd')
            : String(row[10] || ''), // Date
          time: String(row[11] || ''), // Time
          type: String(row[12] || ''), // Type
          location: String(row[13] || '') // Location
        }))
        .sort((a, b) => {
          // เรียงตาม timestamp ล่าสุดก่อน (descending)
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB - dateA;
        })
        .slice(0, limit); // จำกัดจำนวนรายการ
      
      Logger.log('Found ' + userHistory.length + ' history records');
      
      return createJSONPResponse({
        success: true,
        history: userHistory,
        count: userHistory.length
      }, callback);
    }
    
    // ถ้า action ไม่ถูกต้อง
    Logger.log('Invalid action: ' + action);
    return createJSONPResponse({
      success: false,
      message: 'Invalid action. Use "check", "checkin", or "history" only',
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
      message: 'An error occurred: ' + error.toString()
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
      sheet.appendRow(['NO', 'Timestamp', 'User ID', 'First Name', 'Last Name', 'Display Name', 'Avatar URL', 'Role', 'Position', 'Team', 'Date', 'Time', 'Type', 'Location']);
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
      
      const dataRange = sheet.getRange(2, 3, lastRow - 1, 1); // User ID column (C, shifted due to NO column)
      const datesRange = sheet.getRange(2, 7, lastRow - 1, 1); // Date column (G, shifted due to NO column)
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
        const dataRange = sheet.getRange(2, 3, lastRow - 1, 1); // User ID column (C, shifted due to NO column)
        const datesRange = sheet.getRange(2, 11, lastRow - 1, 1); // Date column (K, shifted due to new columns)
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
          message: 'You have already checked in today'
        });
      }
      
      const timestamp = new Date(data.timestamp);
      const type = data.type || 'Manual';
      const location = data.location || 'N/A';
      
      // คำนวณเลขลำดับถัดไป (NO)
      // ใช้ lastRow ที่ประกาศไว้แล้วด้านบน
      const nextNo = lastRow; // lastRow จะเป็น 1 ถ้ามีแค่ header, 2 ถ้ามีข้อมูล 1 แถว, etc.
      const formattedNo = Utilities.formatString('%04d', nextNo); // Format เป็น 0001, 0002, etc.
      
      sheet.appendRow([
        formattedNo,
        timestamp,
        data.userId,
        data.firstName || '',
        data.lastName || '',
        data.displayName || '',
        data.avatarURL || '',
        data.role || '',
        data.position || 'N/A',
        data.team || 'N/A',
        data.date,
        data.time,
        type,
        location
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
    
    // ดึงประวัติการ check-in (สำหรับ POST)
    if (data.action === 'history') {
      const userId = data.userId;
      const limit = parseInt(data.limit || '50');
      
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJSONResponse({
          success: true,
          history: [],
          count: 0
        });
      }
      
      const dataRange = sheet.getRange(2, 1, lastRow - 1, 10);
      const allData = dataRange.getValues();
      
      const userHistory = allData
        .filter(row => String(row[2]).trim() === String(userId).trim())
        .map(row => ({
          no: row[0] || '',
          timestamp: row[1] instanceof Date 
            ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
            : String(row[1] || ''),
          userId: String(row[2] || ''),
          displayName: String(row[3] || ''),
          role: String(row[4] || ''),
          team: String(row[5] || ''),
          date: row[6] instanceof Date
            ? Utilities.formatDate(row[6], Session.getScriptTimeZone(), 'yyyy-MM-dd')
            : String(row[6] || ''),
          time: String(row[7] || ''),
          type: String(row[8] || ''),
          location: String(row[9] || '')
        }))
        .sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB - dateA;
        })
        .slice(0, limit);
      
      return createJSONResponse({
        success: true,
        history: userHistory,
        count: userHistory.length
      });
    }
    
    return createJSONResponse({
      success: false,
      message: 'Invalid action. Use "check", "checkin", or "history" only'
    });
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createJSONResponse({
      success: false,
      message: error.toString()
    });
  }
}

