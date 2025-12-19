import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRCodeScanner.css';

const QR_CODE_VALUE = 'AIDC2025Submit';

export default function QRCodeScanner({ onScanSuccess, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [showPermissionDialog, setShowPermissionDialog] = useState(true); // Show permission dialog first
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
      // Check if we're in a WebView (Flutter WebView)
      const isWebView = window.navigator.standalone || 
                       window.matchMedia('(display-mode: standalone)').matches ||
                       /wv|WebView/i.test(navigator.userAgent);
      
      // Check if navigator.permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });
          setPermissionStatus(permissionStatus.state);
          
          // Listen for permission changes
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state);
          };
        } catch (permErr) {
          // Permissions API might not work in WebView, fallback to prompt
          console.log('Permissions API not available, using fallback');
          setPermissionStatus('prompt');
        }
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
      setShowPermissionDialog(false); // Hide dialog when requesting permission
      
      // Try different constraint configurations to maximize compatibility
      const constraintsList = [
        // First try with ideal constraints for back camera
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        // Fallback to basic environment camera without size constraints
        {
          video: {
            facingMode: 'environment'
          }
        },
        // Fallback to any available camera
        {
          video: true
        }
      ];
      
      let stream = null;
      let lastError = null;
      
      // Try each constraint configuration until one works
      for (const constraints of constraintsList) {
        try {
          console.log('Trying camera constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Successfully got camera stream with constraints:', constraints);
          break; // Success, exit loop
        } catch (err) {
          lastError = err;
          console.log(`Failed with constraints:`, constraints, 'Error:', err.message);
        }
      }
      
      if (!stream) {
        throw lastError || new Error('Failed to access camera');
      }
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      
      // Auto-start scanning after permission is granted
      setTimeout(() => {
        startScanning();
      }, 100);
      
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      setPermissionStatus('denied');
      setShowPermissionDialog(true); // Show dialog again if denied
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        // Check if in WebView
        const isWebView = /wv|WebView/i.test(navigator.userAgent);
        if (isWebView) {
          setError('Camera access denied. Please grant camera permission in Flutter app settings');
        } else {
          setError('Camera access denied. Please allow camera access in your browser settings');
        }
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on your device. Please ensure a camera is connected and accessible.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Unable to access camera. Camera may be in use by another app. Please close other apps and try again.');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        setError('Camera configuration not supported. Please try with a different device.');
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

      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Adjust QR box size for mobile
      const qrboxSize = isMobile ? { width: 250, height: 250 } : { width: 300, height: 300 };

      // Try different camera configurations
      const cameraConfigs = [
        // First try with environment camera
        { 
          facingMode: { ideal: 'environment' },
          aspectRatio: { ideal: 1.7777777778 }
        },
        // Fallback to environment camera without aspect ratio
        { 
          facingMode: 'environment'
        },
        // Fallback to any camera
        { 
          facingMode: 'user'
        }
      ];

      let started = false;
      let lastError = null;

      // Try each camera config until one works
      for (const cameraConfig of cameraConfigs) {
        try {
          console.log('Trying camera config:', cameraConfig);
          await html5QrCode.start(
            cameraConfig,
            {
              fps: isMobile ? 10 : 15, // Lower FPS on mobile for better performance
              qrbox: qrboxSize,
              aspectRatio: 1.0,
              disableFlip: false // Allow rotation
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
          console.log('Successfully started QR scanner with config:', cameraConfig);
          started = true;
          break; // Success, exit loop
        } catch (err) {
          lastError = err;
          console.log('Failed to start with config:', cameraConfig, 'Error:', err.message);
        }
      }

      // If none of the configs worked, throw the last error
      if (!started) {
        throw lastError || new Error('Failed to start QR scanner');
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
          {showPermissionDialog && permissionStatus !== 'granted' && (
            <div className="qr-permission-dialog">
              <div className="qr-permission-dialog-content">
                <div className="qr-permission-icon">📷</div>
                <h3>Camera Permission Required</h3>
                <p className="qr-permission-dialog-text">
                  This app needs access to your camera to scan QR codes.
                </p>
                <p className="qr-permission-dialog-text">
                  Please click "Allow" to grant camera permission.
                </p>
                <div className="qr-permission-dialog-actions">
                  <button 
                    className="qr-allow-button" 
                    onClick={requestCameraPermission}
                  >
                    Allow Camera Access
                  </button>
                  <button 
                    className="qr-cancel-button" 
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showPermissionDialog && (
            <>
              <div className="qr-scanner-instructions">
                <p>Please scan QR Code: <strong>AIDC2025Submit</strong></p>
              </div>

              <div 
                id="qr-reader" 
                ref={scannerRef}
                className={`qr-reader ${!isScanning ? 'qr-reader-hidden' : ''}`}
              ></div>
            </>
          )}

          {permissionStatus === 'denied' && (
            <div className="qr-permission-warning">
              <p>⚠️ Camera access denied</p>
              {/wv|WebView/i.test(navigator.userAgent) ? (
                <>
                  <p className="qr-permission-help">
                    Please grant camera permission in your Flutter app settings
                  </p>
                  <p className="qr-permission-help">
                    <strong>Android:</strong> Settings → Apps → [Your App] → Permissions → Camera → Allow
                  </p>
                  <p className="qr-permission-help">
                    <strong>iOS:</strong> Settings → [Your App] → Camera → Allow
                  </p>
                </>
              ) : (
                <>
                  <p className="qr-permission-help">
                    Please open browser settings and allow camera access for this website
                  </p>
                  <p className="qr-permission-help">
                    <strong>Mobile:</strong> Settings → Site Settings → Camera → Allow
                  </p>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="qr-error">
              {error}
            </div>
          )}

          <div className="qr-scanner-actions">
            {isScanning && (
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

