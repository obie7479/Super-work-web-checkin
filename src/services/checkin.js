import { formatDate, formatTime } from '../utils/dateUtils';
import { getLocation, formatLocation } from '../utils/locationUtils';

// URL ของ Google Apps Script Web App
// ต้องแทนที่ด้วย URL จริงที่ได้จาก Google Apps Script
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || 'YOUR_APPS_SCRIPT_URL_HERE';

/**
 * เรียก Google Apps Script ผ่าน GET request (แก้ปัญหา CORS)
 * ใช้ fetch ธรรมดาเพราะ Google Apps Script รองรับ CORS สำหรับ GET requests
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Response data
 */
async function callAppsScript(params) {
  try {
    // ตรวจสอบว่า URL ถูกต้อง
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
      throw new Error('Please set VITE_APPS_SCRIPT_URL in .env file');
    }

    // ตรวจสอบว่า URL เป็น Web App URL ที่ถูกต้อง
    if (!APPS_SCRIPT_URL.includes('script.google.com/macros/s/') || !APPS_SCRIPT_URL.endsWith('/exec')) {
      console.error('[CheckInService] ⚠️ Web App URL ไม่ถูกต้อง!');
      console.error('[CheckInService] URL ที่ใช้:', APPS_SCRIPT_URL);
      console.error('[CheckInService] URL ที่ถูกต้องควรเป็น: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
      console.error('[CheckInService] ดูคู่มือใน FIX_WEB_APP_URL.md');
      throw new Error('Invalid Web App URL. Please check .env file and see FIX_WEB_APP_URL.md');
    }

    // สร้าง query string และ encode ค่าพิเศษ
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        // Encode ค่าที่มีอักขระพิเศษ
        queryParams.append(key, String(params[key]));
      }
    });

    const url = `${APPS_SCRIPT_URL}?${queryParams.toString()}`;
    
    // Log URL สำหรับ debug (เฉพาะใน development)
    if (import.meta.env.DEV) {
      console.log('[CheckInService] Request URL:', url);
      console.log('[CheckInService] Parameters:', params);
    }
    
    // ใช้ fetch ธรรมดา (Google Apps Script รองรับ CORS สำหรับ GET)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Log response สำหรับ debug
    if (import.meta.env.DEV) {
      console.log('[CheckInService] Response:', data);
    }
    
    // ตรวจสอบว่า response เป็น default message หรือไม่ (แสดงว่า action ไม่ถูกส่งไป)
    if (data.message === 'Superwork Check-in API' && data.status === 'running' && !data.hasOwnProperty('success')) {
      console.error('[CheckInService] ⚠️ Apps Script ไม่ได้รับ action parameter!');
      console.error('[CheckInService] Response:', data);
      console.error('[CheckInService] Parameters ที่ส่งไป:', params);
      throw new Error('Apps Script did not receive action parameter. Please check if Apps Script code is deployed');
    }
    
    return data;
  } catch (error) {
    console.error('[CheckInService] Error calling Apps Script:', error);
    // ถ้าเป็น CORS error ให้ลองใช้ JSONP
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      return callAppsScriptJSONP(params);
    }
    throw error;
  }
}

/**
 * เรียก Google Apps Script ผ่าน JSONP (fallback สำหรับ CORS)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Response data
 */
function callAppsScriptJSONP(params) {
  return new Promise((resolve, reject) => {
    try {
      // สร้าง callback function name
      const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // สร้าง query string
      const queryParams = new URLSearchParams();
      queryParams.append('callback', callbackName);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, String(params[key]));
        }
      });

      // สร้าง script tag
      const script = document.createElement('script');
      script.src = `${APPS_SCRIPT_URL}?${queryParams.toString()}`;
      
      // ตั้งค่า callback function
      window[callbackName] = (data) => {
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(data);
      };

      // Error handling
      script.onerror = () => {
        delete window[callbackName];
        document.body.removeChild(script);
        reject(new Error('JSONP request failed'));
      };

      document.body.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * ตรวจสอบว่าผู้ใช้ check-in แล้ววันนี้หรือยัง
 * @param {string} userId - User ID
 * @param {string} date - วันที่ในรูปแบบ YYYY-MM-DD
 * @returns {Promise<Object>} Check-in status
 */
export async function checkDuplicate(userId, date) {
  try {
    const data = await callAppsScript({
      action: 'check',
      userId: userId,
      date: date
    });

    return {
      success: true,
      exists: data.exists || false
    };
  } catch (error) {
    console.error('[CheckInService] Error checking duplicate:', error);
    return {
      success: false,
      error: 'An error occurred while checking data'
    };
  }
}

/**
 * ดึงประวัติการ check-in ของผู้ใช้
 * @param {string} userId - User ID
 * @param {number} limit - จำนวนรายการสูงสุด (default: 50)
 * @returns {Promise<Object>} Check-in history
 */
export async function getHistory(userId, limit = 50) {
  try {
    const data = await callAppsScript({
      action: 'history',
      userId: userId,
      limit: limit
    });

    if (data.success) {
      return {
        success: true,
        history: data.history || [],
        count: data.count || 0
      };
    } else {
      return {
        success: false,
        error: data.message || 'Unable to fetch history',
        history: [],
        count: 0
      };
    }
  } catch (error) {
    console.error('[CheckInService] Error fetching history:', error);
    return {
      success: false,
      error: 'An error occurred while fetching history',
      history: [],
      count: 0
    };
  }
}

/**
 * ทำการ check-in
 * @param {Object} userData - ข้อมูลผู้ใช้
 * @param {string} type - ประเภทการ check-in ('QR Code' หรือ 'Manual')
 * @returns {Promise<Object>} Check-in result
 */
export async function checkIn(userData, type = 'Manual') {
  try {
    const now = new Date();
    const date = formatDate(now);
    const time = formatTime(now);

    const displayName = `${userData.firstName} ${userData.lastName}`;
    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';
    const avatarURL = userData.avatarURL || '';
    const position = userData.position?.name || 'N/A';
    const team = userData.team?.name || 'N/A';

    // ดึงตำแหน่งปัจจุบันของอุปกรณ์ (GPS หรือ IP-based) - REQUIRED
    // ต้องได้ตำแหน่งก่อนถึงจะทำ check-in ได้
    let locationData = null;
    try {
      // ใช้ timeout 10 วินาทีสำหรับทั้ง QR Code และ Manual เพื่อให้ได้ GPS location ที่แม่นยำ
      const gpsTimeout = 10000; // 10 seconds for both QR Code and Manual
      
      console.log(`[CheckInService] Getting current device location for ${type} check-in (timeout: ${gpsTimeout}ms)...`);
      locationData = await getLocation(gpsTimeout);
      
      // ตรวจสอบว่าต้องได้ location จริงๆ (ไม่ใช่ 'N/A' หรือ error)
      if (!locationData || 
          locationData.formatted === 'N/A' || 
          locationData.source === 'none' || 
          locationData.source === 'error' ||
          !locationData.latitude || 
          !locationData.longitude) {
        throw new Error('Unable to get current location. Please allow location access in your browser');
      }
      
      if (locationData && locationData.source === 'gps') {
        console.log('[CheckInService] GPS location obtained:', {
          lat: locationData.latitude,
          lng: locationData.longitude,
          accuracy: locationData.accuracy + 'm'
        });
      } else if (locationData && locationData.source === 'ip') {
        console.log('[CheckInService] IP-based location obtained:', locationData.address);
      }
      
      if (import.meta.env.DEV) {
        console.log('[CheckInService] Full location data:', locationData);
      }
    } catch (locationError) {
      console.error('[CheckInService] Error getting location:', locationError);
      // Location is REQUIRED - return error immediately
      return {
        success: false,
        message: locationError.message || 'Unable to get current location. Please allow location access in your browser',
        error: 'LOCATION_REQUIRED',
        requiresLocation: true
      };
    }

    const locationString = formatLocation(locationData);

    const data = await callAppsScript({
      action: 'checkin',
      userId: userData.id,
      displayName: displayName,
      firstName: firstName,
      lastName: lastName,
      avatarURL: avatarURL,
      role: userData.role,
      position: position,
      team: team,
      date: date,
      time: time,
      timestamp: now.toISOString(),
      type: type,
      location: locationString
    });

    if (data.success) {
      return {
        success: true,
        message: data.message || 'Check-in successful',
        data: data.data
      };
    } else {
      return {
        success: false,
        message: data.message || 'Check-in failed',
        duplicate: data.duplicate || false
      };
    }
  } catch (error) {
    console.error('[CheckInService] Error during check-in:', error);
    return {
      success: false,
      message: 'An error occurred during check-in',
      error: error.message
    };
  }
}

