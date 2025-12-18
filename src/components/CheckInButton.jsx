import React, { useState, useEffect, useRef } from 'react';
import { checkIn, checkDuplicate } from '../services/checkin';
import { formatDate } from '../utils/dateUtils';
import QRCodeScanner from './QRCodeScanner';
import './CheckInButton.css';

export default function CheckInButton({ user, onCheckInSuccess }) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [showQRScanner, setShowQRScanner] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // ตรวจสอบว่าผู้ใช้ check-in แล้ววันนี้หรือยัง (เรียกครั้งเดียวเท่านั้น)
    if (user?.id && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkTodayStatus();
    }
  }, [user?.id]); // ใช้ user?.id แทน user เพื่อป้องกันการเรียกซ้ำ

  const checkTodayStatus = async () => {
    if (checkingStatus) return; // ป้องกันการเรียกซ้ำ
    
    setCheckingStatus(true);
    try {
      const today = formatDate();
      const result = await checkDuplicate(user.id, today);
      if (result.success && result.exists) {
        setAlreadyCheckedIn(true);
        setMessage('คุณได้ทำการ check-in แล้ววันนี้');
        setMessageType('info');
      } else if (result.success && !result.exists) {
        // ถ้ายังไม่ check-in ให้ล้างข้อความ
        setMessage('');
        setMessageType('');
      }
    } catch (error) {
      console.error('Error checking today status:', error);
      // ไม่แสดง error เพราะเป็นแค่การตรวจสอบสถานะ
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCheckIn = async (type = 'Manual') => {
    if (!user) {
      setMessage('ไม่พบข้อมูลผู้ใช้');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await checkIn(user, type);

      if (result.success) {
        setMessage(result.message || 'Check-in สำเร็จ');
        setMessageType('success');
        setAlreadyCheckedIn(true);
        if (onCheckInSuccess) {
          onCheckInSuccess(result.data);
        }
      } else {
        if (result.duplicate) {
          setMessage('คุณได้ทำการ check-in แล้ววันนี้');
          setMessageType('info');
          setAlreadyCheckedIn(true);
        } else {
          setMessage(result.message || 'Check-in ไม่สำเร็จ');
          setMessageType('error');
        }
      }
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการ check-in');
      setMessageType('error');
      console.error('Check-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanSuccess = (type) => {
    setShowQRScanner(false);
    handleCheckIn(type);
  };

  return (
    <>
      <div className="checkin-container">
        {!alreadyCheckedIn && !checkingStatus && (
          <div className="checkin-options">
            <button
              className="qr-button"
              onClick={() => setShowQRScanner(true)}
              disabled={loading}
            >
              📷 สแกน QR Code
            </button>
            <div className="or-divider">หรือ</div>
          </div>
        )}
        
        <button
          className={`checkin-button ${alreadyCheckedIn ? 'disabled' : ''} ${loading ? 'loading' : ''} ${checkingStatus ? 'checking' : ''}`}
          onClick={() => handleCheckIn('Manual')}
          disabled={loading || alreadyCheckedIn || checkingStatus}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              กำลังดำเนินการ...
            </>
          ) : checkingStatus ? (
            <>
              <span className="spinner"></span>
              กำลังตรวจสอบ...
            </>
          ) : alreadyCheckedIn ? (
            '✓ Check-in แล้ววันนี้'
          ) : (
            'Check-in แบบ Manual'
          )}
        </button>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
      </div>

      {showQRScanner && (
        <QRCodeScanner
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </>
  );
}

