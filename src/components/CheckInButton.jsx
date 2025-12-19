import React, { useState, useEffect, useRef } from 'react';
import { checkIn, checkDuplicate } from '../services/checkin';
import { formatDate } from '../utils/dateUtils';
import './CheckInButton.css';

export default function CheckInButton({ user, onCheckInSuccess }) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Check if user has already checked in today (call only once)
    if (user?.id && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkTodayStatus();
    }
  }, [user?.id]); // Use user?.id instead of user to prevent repeated calls

  const checkTodayStatus = async () => {
    if (checkingStatus) return; // Prevent duplicate calls
    
    setCheckingStatus(true);
    try {
      const today = formatDate();
      const result = await checkDuplicate(user.id, today);
      if (result.success && result.exists) {
        setAlreadyCheckedIn(true);
        setMessage('You have already checked in today');
        setMessageType('info');
      } else if (result.success && !result.exists) {
        // If not checked in yet, clear the message
        setMessage('');
        setMessageType('');
      }
    } catch (error) {
      console.error('Error checking today status:', error);
      // Don't show error as this is just a status check
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCheckIn = async (type = 'Manual') => {
    if (!user) {
      setMessage('User information not found');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await checkIn(user, type);

      if (result.success) {
        setMessage(result.message || 'Check-in successful');
        setMessageType('success');
        setAlreadyCheckedIn(true);
        if (onCheckInSuccess) {
          onCheckInSuccess(result.data);
        }
      } else {
        if (result.duplicate) {
          setMessage('You have already checked in today');
          setMessageType('info');
          setAlreadyCheckedIn(true);
        } else {
          setMessage(result.message || 'Check-in failed');
          setMessageType('error');
        }
      }
    } catch (error) {
      setMessage('An error occurred during check-in');
      setMessageType('error');
      console.error('Check-in error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="checkin-container">
      <button
        className={`checkin-button ${alreadyCheckedIn ? 'disabled' : ''} ${loading ? 'loading' : ''} ${checkingStatus ? 'checking' : ''}`}
        onClick={() => handleCheckIn('Manual')}
        disabled={loading || alreadyCheckedIn || checkingStatus}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : checkingStatus ? (
          <>
            <span className="spinner"></span>
            Checking...
          </>
        ) : alreadyCheckedIn ? (
          '✓ Checked in today'
        ) : (
          'Check-in'
        )}
      </button>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
}

