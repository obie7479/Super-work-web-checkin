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
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        console.error('Camera requires HTTPS. Current context is not secure.');
        setError('Camera access requires HTTPS. Please access this site using HTTPS or localhost.');
        setPermissionStatus('denied');
        return;
      }

      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not available');
        setError('Camera API is not available in this browser. Please use a modern browser.');
        setPermissionStatus('denied');
        return;
      }

      // Check if navigator.permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });
          setPermissionStatus(permissionStatus.state);
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state);
          };
        } catch (err) {
          // Some browsers don't support camera in permissions.query
          console.log('Permissions API not fully supported, using fallback');
          // Fallback to device enumeration
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoDevices = devices.some(device => device.kind === 'videoinput');
          setPermissionStatus(hasVideoDevices ? 'prompt' : 'prompt');
        }
      } else {
        // Fallback: try to check if we can enumerate devices
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoDevices = devices.some(device => device.kind === 'videoinput');
          setPermissionStatus(hasVideoDevices ? 'prompt' : 'prompt');
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
      
      // Check secure context first
      if (!window.isSecureContext) {
        setError('⚠️ Camera requires HTTPS. Access this site using https:// or use localhost for testing.');
        setPermissionStatus('denied');
        return false;
      }

      // Try different camera configurations for better mobile support
      const constraints = [
        { video: { facingMode: 'environment' } }, // Try back camera first
        { video: { facingMode: { ideal: 'environment' } } }, // Try ideal back camera
        { video: { facingMode: 'user' } }, // Try front camera
        { video: true } // Try any camera
      ];

      let stream = null;
      let lastError = null;

      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (stream) break;
        } catch (err) {
          lastError = err;
          console.log(`Failed with constraint ${JSON.stringify(constraint)}: ${err.message}`);
        }
      }

      if (!stream) {
        throw lastError || new Error('Unable to access camera');
      }
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      setPermissionStatus('denied');
      
      // Enhanced error messages for mobile
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('📷 Camera access denied. Please allow camera access in browser settings and refresh the page.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('📷 No camera found. Please ensure your device has a camera.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('📷 Camera is busy. Please close other apps using the camera and try again.');
      } else if (err.name === 'NotSupportedError' || err.name === 'TypeError') {
        setError('⚠️ Camera not supported. Please use HTTPS or localhost to access camera.');
      } else {
        setError('📷 Unable to access camera: ' + err.message);
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

      // Try to start with back camera, fallback to any camera
      let started = false;
      const scanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const onQrCodeScanned = (decodedText, decodedResult) => {
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
      };

      const onScanError = (errorMessage) => {
        // ข้อความ error จะถูกแสดงเมื่อสแกนไม่สำเร็จ (ไม่ใช่ error จริง)
        // ไม่ต้องทำอะไร
      };

      // Try environment camera first
      try {
        await html5QrCode.start(
          { facingMode: 'environment' }, 
          scanConfig,
          onQrCodeScanned,
          onScanError
        );
        started = true;
      } catch (err) {
        console.log('Environment camera failed, trying any camera...');
      }

      // If environment camera fails, try any camera
      if (!started) {
        try {
          await html5QrCode.start(
            { facingMode: 'user' },
            scanConfig,
            onQrCodeScanned,
            onScanError
          );
          started = true;
        } catch (err) {
          console.log('User camera failed, trying boolean...');
        }
      }

      // Last resort: try with boolean (any camera)
      if (!started) {
        await html5QrCode.start(
          true,
          scanConfig,
          onQrCodeScanned,
          onScanError
        );
      }
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
              <p>⚠️ Camera access issue</p>
              <p className="qr-permission-help">
                {!window.isSecureContext ? (
                  <>
                    <strong>HTTPS Required:</strong> Camera access requires a secure connection.<br/>
                    Please access this site using:<br/>
                    • https:// (with HTTPS)<br/>
                    • localhost (for testing)<br/>
                    • Or use ngrok for secure tunnel
                  </>
                ) : (
                  <>Please open browser settings and allow camera access for this website</>
                )}
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

