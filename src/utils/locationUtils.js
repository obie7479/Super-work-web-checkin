/**
 * Location utility functions
 * ดึงตำแหน่งจาก GPS หรือ IP-based location
 */

/**
 * ดึงตำแหน่งจาก Geolocation API (GPS)
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise<Object|null>} Location object or null if failed
 */
async function getGPSLocation(timeout = 10000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('[LocationUtils] Geolocation API not supported');
      resolve(null);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: timeout,
      maximumAge: 0 // Don't use cached location
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
          timestamp: new Date().toISOString()
        };
        console.log('[LocationUtils] GPS location obtained:', location);
        resolve(location);
      },
      (error) => {
        console.log('[LocationUtils] GPS location error:', error.message);
        resolve(null);
      },
      options
    );
  });
}

/**
 * ดึงตำแหน่งจาก IP-based location API
 * ใช้ ip-api.com (free, no API key required)
 * @returns {Promise<Object|null>} Location object or null if failed
 */
async function getIPLocation() {
  try {
    // ใช้ ip-api.com (free tier, no API key needed)
    const response = await fetch('http://ip-api.com/json/?fields=status,message,lat,lon,city,regionName,country,query', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success' && data.lat && data.lon) {
      const location = {
        latitude: data.lat,
        longitude: data.lon,
        accuracy: null, // IP-based location doesn't have accuracy
        source: 'ip',
        address: `${data.city || ''}, ${data.regionName || ''}, ${data.country || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
        ip: data.query,
        timestamp: new Date().toISOString()
      };
      console.log('[LocationUtils] IP location obtained:', location);
      return location;
    } else {
      console.log('[LocationUtils] IP location API returned error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('[LocationUtils] Error getting IP location:', error);
    return null;
  }
}

/**
 * ดึงตำแหน่ง - ลอง GPS ก่อน ถ้าไม่ได้ให้ใช้ IP-based
 * @param {number} gpsTimeout - Timeout for GPS in milliseconds (default: 5000)
 * @returns {Promise<Object>} Location object with format: { latitude, longitude, accuracy, source, address?, formatted }
 */
export async function getLocation(gpsTimeout = 5000) {
  try {
    // ลองใช้ GPS ก่อน
    const gpsLocation = await getGPSLocation(gpsTimeout);
    
    if (gpsLocation) {
      // Format location string
      gpsLocation.formatted = `${gpsLocation.latitude.toFixed(6)},${gpsLocation.longitude.toFixed(6)}`;
      return gpsLocation;
    }

    // ถ้า GPS ไม่ได้ ให้ลองใช้ IP-based location
    console.log('[LocationUtils] GPS failed, trying IP-based location...');
    const ipLocation = await getIPLocation();
    
    if (ipLocation) {
      // Format location string
      ipLocation.formatted = ipLocation.address 
        ? `${ipLocation.address} (${ipLocation.latitude.toFixed(6)},${ipLocation.longitude.toFixed(6)})`
        : `${ipLocation.latitude.toFixed(6)},${ipLocation.longitude.toFixed(6)}`;
      return ipLocation;
    }

    // ถ้าไม่ได้ทั้งสองวิธี
    console.log('[LocationUtils] Both GPS and IP location failed');
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      source: 'none',
      formatted: 'N/A',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[LocationUtils] Error in getLocation:', error);
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      source: 'error',
      formatted: 'N/A',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Format location สำหรับแสดงผลหรือบันทึก
 * @param {Object} location - Location object
 * @returns {string} Formatted location string
 */
export function formatLocation(location) {
  if (!location || location.formatted === 'N/A') {
    return 'N/A';
  }
  return location.formatted;
}

