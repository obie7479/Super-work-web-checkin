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
          message: 'คุณได้ทำการ check-in แล้ววันนี้'
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
    
    // ดึงตัวเลือกโหวต
    if (action === 'getVoteOptions') {
      Logger.log('Fetching vote options');
      
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      let voteOptionsSheet = spreadsheet.getSheetByName('Vote Options');
      
      // ถ้ายังไม่มี sheet ให้สร้าง
      if (!voteOptionsSheet) {
        voteOptionsSheet = spreadsheet.insertSheet('Vote Options');
        voteOptionsSheet.appendRow(['Work/Job', 'Option 1', 'Option 2', 'Option 3']);
        Logger.log('Created Vote Options sheet');
      }
      
      const lastRow = voteOptionsSheet.getLastRow();
      if (lastRow <= 1) {
        // ถ้ามีแค่ header หรือไม่มีข้อมูล
        return createJSONPResponse({
          success: true,
          voteOptions: []
        }, callback);
      }
      
      // ดึงข้อมูลทั้งหมด (เริ่มจาก row 2 เพราะ row 1 เป็น header)
      const dataRange = voteOptionsSheet.getRange(2, 1, lastRow - 1, voteOptionsSheet.getLastColumn());
      const allData = dataRange.getValues();
      
      // แปลงข้อมูลเป็น array of objects
      const voteOptions = allData.map(row => {
        const workJob = String(row[0] || '').trim();
        const options = [];
        
        // ดึงตัวเลือกทั้งหมด (เริ่มจาก column 2 เป็นต้นไป)
        for (let i = 1; i < row.length; i++) {
          const option = String(row[i] || '').trim();
          if (option) {
            options.push(option);
          }
        }
        
        return {
          workJob: workJob,
          options: options
        };
      }).filter(item => item.workJob && item.options.length > 0); // กรองเฉพาะที่มี workJob และมีตัวเลือก
      
      Logger.log('Found ' + voteOptions.length + ' vote options');
      
      return createJSONPResponse({
        success: true,
        voteOptions: voteOptions
      }, callback);
    }
    
    // ส่งการโหวต
    if (action === 'submitVote') {
      const userId = e.parameter.userId;
      const userName = decodeURIComponent(e.parameter.userName || '');
      const workJob = decodeURIComponent(e.parameter.workJob || '');
      const selectedOption = decodeURIComponent(e.parameter.selectedOption || '');
      const timestamp = e.parameter.timestamp || new Date().toISOString();
      
      Logger.log('Submit vote - userId: ' + userId + ', workJob: ' + workJob + ', selectedOption: ' + selectedOption);
      
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      let voteResultsSheet = spreadsheet.getSheetByName('Vote Results');
      
      // ถ้ายังไม่มี sheet ให้สร้าง
      if (!voteResultsSheet) {
        voteResultsSheet = spreadsheet.insertSheet('Vote Results');
        voteResultsSheet.appendRow(['Timestamp', 'User ID', 'User Name', 'Work/Job', 'Selected Option']);
        Logger.log('Created Vote Results sheet');
      }
      
      // ตรวจสอบ duplicate: User ID + Work/Job
      const lastRow = voteResultsSheet.getLastRow();
      let exists = false;
      
      if (lastRow > 1) {
        const userIdsRange = voteResultsSheet.getRange(2, 2, lastRow - 1, 1); // User ID column (B)
        const workJobsRange = voteResultsSheet.getRange(2, 4, lastRow - 1, 1); // Work/Job column (D)
        const userIds = userIdsRange.getValues().flat();
        const workJobs = workJobsRange.getValues().flat();
        
        exists = userIds.some((id, index) => {
          const userIdMatch = String(id).trim() === String(userId).trim();
          const workJobMatch = String(workJobs[index]).trim() === String(workJob).trim();
          return userIdMatch && workJobMatch;
        });
        
        Logger.log('Duplicate check - userId: ' + userId + ', workJob: ' + workJob + ', exists: ' + exists);
      }
      
      if (exists) {
        return createJSONPResponse({
          success: false,
          duplicate: true,
          message: 'คุณได้ทำการโหวตงานนี้แล้ว'
        }, callback);
      }
      
      // บันทึกการโหวต
      try {
        const timestampDate = new Date(timestamp);
        voteResultsSheet.appendRow([
          timestampDate,
          userId,
          userName,
          workJob,
          selectedOption
        ]);
        
        Logger.log('Vote submitted successfully');
        
        return createJSONPResponse({
          success: true,
          message: 'โหวตสำเร็จ'
        }, callback);
      } catch (appendError) {
        Logger.log('Error appending vote: ' + appendError.toString());
        return createJSONPResponse({
          success: false,
          message: 'เกิดข้อผิดพลาดในการบันทึกการโหวต: ' + appendError.toString()
        }, callback);
      }
    }
    
    // ดึงผลการโหวต
    if (action === 'getVoteResults') {
      const workJob = e.parameter.workJob ? decodeURIComponent(e.parameter.workJob) : null;
      
      Logger.log('Fetching vote results - workJob: ' + workJob);
      
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const voteResultsSheet = spreadsheet.getSheetByName('Vote Results');
      
      if (!voteResultsSheet) {
        return createJSONPResponse({
          success: true,
          results: []
        }, callback);
      }
      
      const lastRow = voteResultsSheet.getLastRow();
      if (lastRow <= 1) {
        return createJSONPResponse({
          success: true,
          results: []
        }, callback);
      }
      
      // ดึงข้อมูลทั้งหมด (เริ่มจาก row 2 เพราะ row 1 เป็น header)
      // Columns: Timestamp, User ID, User Name, Work/Job, Selected Option
      const dataRange = voteResultsSheet.getRange(2, 1, lastRow - 1, 5);
      const allData = dataRange.getValues();
      
      // กรองข้อมูลตาม workJob (ถ้ามี)
      let filteredData = allData;
      if (workJob) {
        filteredData = allData.filter(row => String(row[3]).trim() === String(workJob).trim());
      }
      
      // นับจำนวนโหวตแยกตามแต่ละตัวเลือก
      const voteCounts = {};
      filteredData.forEach(row => {
        const selectedOption = String(row[4] || '').trim();
        if (selectedOption) {
          voteCounts[selectedOption] = (voteCounts[selectedOption] || 0) + 1;
        }
      });
      
      // แปลงเป็น array
      const results = Object.keys(voteCounts).map(option => ({
        option: option,
        count: voteCounts[option]
      })).sort((a, b) => b.count - a.count); // เรียงตามจำนวนโหวตมากไปน้อย
      
      Logger.log('Found ' + results.length + ' vote result groups');
      
      return createJSONPResponse({
        success: true,
        results: results,
        totalVotes: filteredData.length
      }, callback);
    }
    
    // ตรวจสอบว่าผู้ใช้โหวตแล้วหรือยัง
    if (action === 'checkVote') {
      const userId = e.parameter.userId;
      const workJob = e.parameter.workJob ? decodeURIComponent(e.parameter.workJob) : null;
      
      Logger.log('Checking vote - userId: ' + userId + ', workJob: ' + workJob);
      
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const voteResultsSheet = spreadsheet.getSheetByName('Vote Results');
      
      if (!voteResultsSheet || voteResultsSheet.getLastRow() <= 1) {
        return createJSONPResponse({
          success: true,
          hasVoted: false
        }, callback);
      }
      
      const lastRow = voteResultsSheet.getLastRow();
      const userIdsRange = voteResultsSheet.getRange(2, 2, lastRow - 1, 1); // User ID column (B)
      const workJobsRange = voteResultsSheet.getRange(2, 4, lastRow - 1, 1); // Work/Job column (D)
      const userIds = userIdsRange.getValues().flat();
      const workJobs = workJobsRange.getValues().flat();
      
      let hasVoted = false;
      
      if (workJob) {
        // ตรวจสอบเฉพาะ workJob ที่ระบุ
        hasVoted = userIds.some((id, index) => {
          const userIdMatch = String(id).trim() === String(userId).trim();
          const workJobMatch = String(workJobs[index]).trim() === String(workJob).trim();
          return userIdMatch && workJobMatch;
        });
      } else {
        // ตรวจสอบว่ามีการโหวตงานไหนบ้าง
        const votedWorkJobs = [];
        userIds.forEach((id, index) => {
          if (String(id).trim() === String(userId).trim()) {
            votedWorkJobs.push(String(workJobs[index]).trim());
          }
        });
        hasVoted = votedWorkJobs.length > 0;
        
        return createJSONPResponse({
          success: true,
          hasVoted: hasVoted,
          votedWorkJobs: votedWorkJobs
        }, callback);
      }
      
      return createJSONPResponse({
        success: true,
        hasVoted: hasVoted
      }, callback);
    }
    
    // ดึงข้อมูลการโหวตของผู้ใช้ (เพื่อแสดงตัวเลือกที่โหวตไปแล้ว)
    if (action === 'getUserVote') {
      const userId = e.parameter.userId;
      const workJob = e.parameter.workJob ? decodeURIComponent(e.parameter.workJob) : null;
      
      Logger.log('Getting user vote - userId: ' + userId + ', workJob: ' + workJob);
      
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const voteResultsSheet = spreadsheet.getSheetByName('Vote Results');
      
      if (!voteResultsSheet || voteResultsSheet.getLastRow() <= 1) {
        return createJSONPResponse({
          success: true,
          userVotes: {}
        }, callback);
      }
      
      const lastRow = voteResultsSheet.getLastRow();
      // Columns: Timestamp, User ID, User Name, Work/Job, Selected Option
      const dataRange = voteResultsSheet.getRange(2, 1, lastRow - 1, 5);
      const allData = dataRange.getValues();
      
      // กรองข้อมูลเฉพาะ userId
      const userVotes = {};
      allData.forEach(row => {
        const rowUserId = String(row[1] || '').trim();
        const rowWorkJob = String(row[3] || '').trim();
        const selectedOption = String(row[4] || '').trim();
        
        if (String(rowUserId).trim() === String(userId).trim()) {
          if (!workJob || rowWorkJob === workJob) {
            userVotes[rowWorkJob] = selectedOption;
          }
        }
      });
      
      Logger.log('Found ' + Object.keys(userVotes).length + ' user votes');
      
      return createJSONPResponse({
        success: true,
        userVotes: userVotes
      }, callback);
    }
    
    // ถ้า action ไม่ถูกต้อง
    Logger.log('Invalid action: ' + action);
    return createJSONPResponse({
      success: false,
      message: 'Invalid action. ใช้ "check", "checkin", "history", "getVoteOptions", "submitVote", "getVoteResults", หรือ "checkVote" เท่านั้น',
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
          message: 'คุณได้ทำการ check-in แล้ววันนี้'
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
      message: 'Invalid action. ใช้ "check", "checkin", หรือ "history" เท่านั้น'
    });
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createJSONResponse({
      success: false,
      message: error.toString()
    });
  }
}

