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
      console.error('[VoteService] ⚠️ Web App URL ไม่ถูกต้อง!');
      console.error('[VoteService] URL ที่ใช้:', APPS_SCRIPT_URL);
      console.error('[VoteService] URL ที่ถูกต้องควรเป็น: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
      throw new Error('Invalid Web App URL. Please check .env file');
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
      console.log('[VoteService] Request URL:', url);
      console.log('[VoteService] Parameters:', params);
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
      console.log('[VoteService] Response:', data);
    }
    
    return data;
  } catch (error) {
    console.error('[VoteService] Error calling Apps Script:', error);
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
 * ดึงตัวเลือกโหวตทั้งหมด
 * @returns {Promise<Object>} Vote options data
 */
export async function getVoteOptions() {
  try {
    const data = await callAppsScript({
      action: 'getVoteOptions'
    });

    if (data.success) {
      return {
        success: true,
        voteOptions: data.voteOptions || []
      };
    } else {
      return {
        success: false,
        error: data.message || 'Unable to fetch vote options',
        voteOptions: []
      };
    }
  } catch (error) {
    console.error('[VoteService] Error fetching vote options:', error);
    return {
      success: false,
      error: 'An error occurred while fetching vote options',
      voteOptions: []
    };
  }
}

/**
 * ตรวจสอบว่าผู้ใช้โหวตแล้วหรือยัง
 * @param {string} userId - User ID
 * @param {string} workJob - Work/Job name (optional)
 * @returns {Promise<Object>} Vote status
 */
export async function checkVote(userId, workJob = null) {
  try {
    const params = {
      action: 'checkVote',
      userId: userId
    };
    
    if (workJob) {
      params.workJob = workJob;
    }
    
    const data = await callAppsScript(params);

    if (data.success) {
      return {
        success: true,
        hasVoted: data.hasVoted || false,
        votedWorkJobs: data.votedWorkJobs || []
      };
    } else {
      return {
        success: false,
        error: data.message || 'Unable to check vote status',
        hasVoted: false
      };
    }
  } catch (error) {
    console.error('[VoteService] Error checking vote:', error);
    return {
      success: false,
      error: 'An error occurred while checking vote status',
      hasVoted: false
    };
  }
}

/**
 * ส่งการโหวต
 * @param {string} userId - User ID
 * @param {string} userName - User Name
 * @param {string} workJob - Work/Job name
 * @param {string} selectedOption - Selected vote option
 * @returns {Promise<Object>} Vote submission result
 */
export async function submitVote(userId, userName, workJob, selectedOption) {
  try {
    const now = new Date();
    const timestamp = now.toISOString();

    const data = await callAppsScript({
      action: 'submitVote',
      userId: userId,
      userName: userName,
      workJob: workJob,
      selectedOption: selectedOption,
      timestamp: timestamp
    });

    if (data.success) {
      return {
        success: true,
        message: data.message || 'Vote submitted successfully'
      };
    } else {
      return {
        success: false,
        message: data.message || 'Vote submission failed',
        duplicate: data.duplicate || false
      };
    }
  } catch (error) {
    console.error('[VoteService] Error submitting vote:', error);
    return {
      success: false,
      message: 'An error occurred during vote submission',
      error: error.message
    };
  }
}

/**
 * ดึงผลการโหวต
 * @param {string} workJob - Work/Job name (optional, ถ้าไม่ระบุจะดึงทั้งหมด)
 * @returns {Promise<Object>} Vote results
 */
export async function getVoteResults(workJob = null) {
  try {
    const params = {
      action: 'getVoteResults'
    };
    
    if (workJob) {
      params.workJob = workJob;
    }
    
    const data = await callAppsScript(params);

    if (data.success) {
      return {
        success: true,
        results: data.results || [],
        totalVotes: data.totalVotes || 0
      };
    } else {
      return {
        success: false,
        error: data.message || 'Unable to fetch vote results',
        results: [],
        totalVotes: 0
      };
    }
  } catch (error) {
    console.error('[VoteService] Error fetching vote results:', error);
    return {
      success: false,
      error: 'An error occurred while fetching vote results',
      results: [],
      totalVotes: 0
    };
  }
}

/**
 * ดึงข้อมูลการโหวตของผู้ใช้ (เพื่อแสดงตัวเลือกที่โหวตไปแล้ว)
 * @param {string} userId - User ID
 * @param {string} workJob - Work/Job name (optional)
 * @returns {Promise<Object>} User votes data
 */
export async function getUserVote(userId, workJob = null) {
  try {
    const params = {
      action: 'getUserVote',
      userId: userId
    };
    
    if (workJob) {
      params.workJob = workJob;
    }
    
    const data = await callAppsScript(params);

    if (data.success) {
      return {
        success: true,
        userVotes: data.userVotes || {}
      };
    } else {
      return {
        success: false,
        error: data.message || 'Unable to fetch user vote',
        userVotes: {}
      };
    }
  } catch (error) {
    console.error('[VoteService] Error fetching user vote:', error);
    return {
      success: false,
      error: 'An error occurred while fetching user vote',
      userVotes: {}
    };
  }
}

