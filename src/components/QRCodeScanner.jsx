import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRCodeScanner.css';

const QR_CODE_VALUE = 'AIDC2025Submit';

export default function QRCodeScanner({ onScanSuccess, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const html5QrCodeRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Check camera permission status on mount
    checkCameraPermission();
    
    return () => {
      // Cleanup when component unmounts
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Check if navigator.permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        setPermissionStatus(permissionStatus.state);
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          setPermissionStatus(permissionStatus.state);
        };
      } else {
        // Fallback: try to check if we can enumerate devices
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoDevices = devices.some(device => device.kind === 'videoinput');
          setPermissionStatus(hasVideoDevices ? 'granted' : 'prompt');
        } catch (err) {
          setPermissionStatus('prompt');
        }
      }
    } catch (err) {
      console.error('Error checking camera permission:', err);
      setPermissionStatus('prompt');
    }
  };

  const requestCameraPermission = async () => {
    try {
      setError('');
      // Request camera access explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      setPermissionStatus('denied');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access in your browser');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on your device');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Unable to access camera. Camera may be in use by another app');
      } else {
        setError('Unable to access camera: ' + err.message);
      }
      return false;
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      
      // Request camera permission first
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setIsScanning(false);
          return;
        }
      }

      setIsScanning(true);

      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // ใช้กล้องหลัง
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText, decodedResult) => {
          // ตรวจสอบว่า QR code ถูกต้องหรือไม่
          if (decodedText === QR_CODE_VALUE) {
            html5QrCode.stop().then(() => {
              setIsScanning(false);
              onScanSuccess('QR Code');
            }).catch(() => {
              setIsScanning(false);
            });
          } else {
            setError('Invalid QR Code. Please scan the correct QR Code');
            // Don't stop scanning, let user try again
          }
        },
        (errorMessage) => {
          // ข้อความ error จะถูกแสดงเมื่อสแกนไม่สำเร็จ (ไม่ใช่ error จริง)
          // ไม่ต้องทำอะไร
        }
      );
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera access in your browser');
        setPermissionStatus('denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on your device');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Unable to access camera. Camera may be in use by another app');
      } else {
        setError('Unable to open camera: ' + err.message);
      }
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
    setIsScanning(false);
    setError('');
  };

  const handleClose = () => {
    stopScanning();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h3>Scan QR Code</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="qr-scanner-content">
          <div className="qr-scanner-instructions">
            <p>Please scan QR Code: <strong>AIDC2025Submit</strong></p>
          </div>

          <div 
            id="qr-reader" 
            ref={scannerRef}
            className="qr-reader"
          ></div>

          {permissionStatus === 'denied' && (
            <div className="qr-permission-warning">
              <p>⚠️ Camera access denied</p>
              <p className="qr-permission-help">
                Please open browser settings and allow camera access for this website
              </p>
            </div>
          )}

          {error && (
            <div className="qr-error">
              {error}
            </div>
          )}

          <div className="qr-scanner-actions">
            {!isScanning ? (
              <button 
                className="qr-start-button" 
                onClick={startScanning}
                disabled={permissionStatus === 'denied'}
              >
                {permissionStatus === 'denied' 
                  ? 'Waiting for camera permission' 
                  : 'Start Scanning QR Code'}
              </button>
            ) : (
              <button className="qr-stop-button" onClick={stopScanning}>
                Stop Scanning
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

