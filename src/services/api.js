import axios from 'axios';

const API_BASE_URL = 'https://api.superwork.tech:9443/api/v1';

/**
 * ดึงข้อมูล user profile จาก Superwork API
 * @param {string} token - JWT token
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'langCode': 'lo',
        'Content-Type': 'application/json'
      }
    });

    if (response.data?.result?.serviceResult?.code === 200) {
      return {
        success: true,
        data: response.data.result.data.user
      };
    } else {
      return {
        success: false,
        error: 'Failed to fetch user profile'
      };
    }
  } catch (error) {
    console.error('[ApiClient] Error fetching profile:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'An error occurred while fetching user data'
    };
  }
}

