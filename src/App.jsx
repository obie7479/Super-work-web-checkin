import React, { useState, useEffect } from 'react';
import { getUserProfile } from './services/api';
import UserProfile from './components/UserProfile';
import CheckInButton from './components/CheckInButton';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // อ่าน token จาก URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setError('ไม่พบ token ใน URL กรุณาตรวจสอบลิงก์');
      setLoading(false);
      return;
    }

    // ดึงข้อมูล user
    fetchUserProfile(token);
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getUserProfile(token);

      if (result.success) {
        setUser(result.data);
      } else {
        setError(result.error || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInSuccess = (data) => {
    console.log('Check-in successful:', data);
    // สามารถเพิ่ม logic เพิ่มเติมได้ เช่น refresh ข้อมูล
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>เกิดข้อผิดพลาด</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <div className="error-container">
          <p>ไม่พบข้อมูลผู้ใช้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Superwork Check-in</h1>
        <p className="subtitle">ระบบบันทึกการเข้างาน</p>
      </div>
      <UserProfile user={user} />
      <CheckInButton user={user} onCheckInSuccess={handleCheckInSuccess} />
    </div>
  );
}

export default App;

