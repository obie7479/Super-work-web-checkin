import React, { useState, useEffect } from 'react';
import { getHistory } from '../services/checkin';
import './CheckInHistory.css';

export default function CheckInHistory({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getHistory(userId, 50);
      
      if (result.success) {
        setHistory(result.history || []);
      } else {
        setError(result.error || 'Unable to fetch history');
      }
    } catch (err) {
      setError('An error occurred while fetching history');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      // ถ้าเป็น string ในรูปแบบ YYYY-MM-DD อยู่แล้ว ให้ return ตามนั้น
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // ถ้าเป็น Date object หรือ string อื่น ให้แปลงเป็น YYYY-MM-DD
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr; // ถ้าแปลงไม่ได้ ให้ return เดิม
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    // ถ้าเป็น string ในรูปแบบ HH:MM:SS อยู่แล้ว ให้ return ตามนั้น
    if (typeof timeStr === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    // ถ้าเป็น string อื่น ให้ลอง parse
    try {
      // ถ้ามี format HH:MM หรือ HH:MM:SS ให้ return ตามนั้น
      if (typeof timeStr === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
        // ถ้าไม่มี seconds ให้เพิ่ม
        if (timeStr.length === 5) {
          return timeStr + ':00';
        }
        return timeStr;
      }
      return timeStr;
    } catch (e) {
      return timeStr;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'QR Code' ? '📷' : '✋';
  };

  const getTypeBadgeClass = (type) => {
    return type === 'QR Code' ? 'type-qr' : 'type-manual';
  };

  /**
   * แปลง location string เป็น Google Maps URL
   * รองรับ format: "lat,lng" หรือ "address (lat,lng)"
   */
  const getGoogleMapsUrl = (locationStr) => {
    if (!locationStr || locationStr === 'N/A') {
      return null;
    }

    // ลองหา pattern "lat,lng" ใน string
    // รองรับทั้ง "13.756331,100.501762" และ "address (13.756331,100.501762)"
    const coordMatch = locationStr.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    
    if (coordMatch) {
      const lat = coordMatch[1];
      const lng = coordMatch[2];
      // ใช้ coordinates สำหรับความแม่นยำสูง
      return `https://www.google.com/maps?q=${lat},${lng}`;
    } else {
      // ถ้าไม่มี coordinates ให้ใช้ address
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationStr)}`;
    }
  };

  const handleLocationClick = (locationStr) => {
    const mapsUrl = getGoogleMapsUrl(locationStr);
    if (mapsUrl) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!expanded) {
    return (
      <div className="checkin-history-container">
        <button 
          className="history-toggle-button"
          onClick={() => setExpanded(true)}
        >
          <span className="history-icon">📋</span>
          <span>View Check-in History</span>
          <span className="history-count">({history.length})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="checkin-history-container expanded">
      <div className="history-header">
        <h3>📋 Check-in History</h3>
        <div className="history-header-actions">
          <button 
            className="refresh-history-button"
            onClick={fetchHistory}
            disabled={loading}
            aria-label="Refresh history"
            title="Refresh history"
          >
            🔄
          </button>
          <button 
            className="close-history-button"
            onClick={() => setExpanded(false)}
            aria-label="Close history"
          >
            ×
          </button>
        </div>
      </div>

      {loading && (
        <div className="history-loading">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      )}

      {error && (
        <div className="history-error">
          <p>⚠️ {error}</p>
          <button onClick={fetchHistory} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="history-empty">
          <p>📭 No check-in history yet</p>
        </div>
      )}

      {!loading && !error && history.length > 0 && (
        <>
          <div className="history-stats">
            <div className="stat-item">
              <span className="stat-label">Total</span>
              <span className="stat-value">{history.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">QR Code</span>
              <span className="stat-value">
                {history.filter(h => h.type === 'QR Code').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Manual</span>
              <span className="stat-value">
                {history.filter(h => h.type === 'Manual').length}
              </span>
            </div>
          </div>

          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-item-header">
                  <div className="history-item-main">
                    <span className="history-no">{item.no || `#${index + 1}`}</span>
                    <div className="history-item-info">
                      <span className="history-date">{formatDate(item.date)}</span>
                      <span className="history-time">{formatTime(item.time)}</span>
                    </div>
                  </div>
                  <span className={`type-badge ${getTypeBadgeClass(item.type)}`}>
                    {getTypeIcon(item.type)} {item.type}
                  </span>
                </div>
                <div className="history-item-details">
                  <div className="detail-row">
                    <span className="detail-label">Date & Time:</span>
                    <span className="detail-value">
                      Date {formatDate(item.date)} Time {formatTime(item.time)}
                    </span>
                  </div>
                  {item.location && item.location !== 'N/A' && (
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span 
                        className="detail-value location clickable"
                        onClick={() => handleLocationClick(item.location)}
                        title="Click to open in Google Maps"
                      >
                        📍 {item.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

