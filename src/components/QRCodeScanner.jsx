import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRCodeScanner.css';

const QR_CODE_VALUE = 'AIDC2025Submit';

export default function QRCodeScanner({ onScanSuccess, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const html5QrCodeRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
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
            setError('QR Code ไม่ถูกต้อง กรุณาสแกน QR Code ที่ถูกต้อง');
            // ไม่หยุดการสแกน ให้ลองใหม่
          }
        },
        (errorMessage) => {
          // ข้อความ error จะถูกแสดงเมื่อสแกนไม่สำเร็จ (ไม่ใช่ error จริง)
          // ไม่ต้องทำอะไร
        }
      );
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      setError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตกล้อง');
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
          <h3>สแกน QR Code</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="qr-scanner-content">
          <div className="qr-scanner-instructions">
            <p>กรุณาสแกน QR Code: <strong>AIDC2025Submit</strong></p>
          </div>

          <div 
            id="qr-reader" 
            ref={scannerRef}
            className="qr-reader"
          ></div>

          {error && (
            <div className="qr-error">
              {error}
            </div>
          )}

          <div className="qr-scanner-actions">
            {!isScanning ? (
              <button className="qr-start-button" onClick={startScanning}>
                เริ่มสแกน QR Code
              </button>
            ) : (
              <button className="qr-stop-button" onClick={stopScanning}>
                หยุดสแกน
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

