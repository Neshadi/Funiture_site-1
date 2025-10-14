import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import './QRScanner.css';

const QRScanner = ({ onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [scannedData, setScannedData] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startScanning = async () => {
        try {
            setError(null);
            setIsScanning(true);

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            streamRef.current = stream;
            videoRef.current.srcObject = stream;

            // Simple QR code detection using canvas and basic pattern matching
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const detectQR = () => {
                if (!videoRef.current || !isScanning) return;

                const video = videoRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);

                // Get image data for basic QR detection
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Simple QR code detection (this is a basic implementation)
                // In a real app, you'd use a proper QR code library like jsQR
                const qrData = detectQRCode(imageData);

                if (qrData) {
                    handleQRDetected(qrData);
                    return;
                }

                if (isScanning) {
                    requestAnimationFrame(detectQR);
                }
            };

            videoRef.current.addEventListener('loadedmetadata', () => {
                detectQR();
            });

        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Unable to access camera. Please ensure camera permissions are granted.');
            setIsScanning(false);
        }
    };

    const detectQRCode = (imageData) => {
        // Use jsQR library for proper QR code detection
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            return code.data;
        }

        return null;
    };

    const handleQRDetected = (data) => {
        setScannedData(data);
        setIsScanning(false);

        // Stop camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Navigate to AR viewer if it's an AR URL
        if (data.includes('/ar-viewer')) {
            const url = new URL(data);
            navigate(`/ar-viewer${url.search}`);
        } else {
            // Handle other QR codes
            alert(`Scanned: ${data}`);
        }
    };

    const stopScanning = () => {
        setIsScanning(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const handleClose = () => {
        stopScanning();
        onClose();
    };

    return (
        <div className="qr-scanner-overlay">
            <div className="qr-scanner-container">
                <div className="qr-scanner-header">
                    <h2>Scan QR Code</h2>
                    <button className="close-button" onClick={handleClose}>×</button>
                </div>

                <div className="qr-scanner-content">
                    {!isScanning ? (
                        <div className="qr-scanner-start">
                            <div className="qr-scanner-icon">📱</div>
                            <p>Point your camera at a QR code to scan</p>
                            <button className="start-scan-button" onClick={startScanning}>
                                Start Scanning
                            </button>
                        </div>
                    ) : (
                        <div className="qr-scanner-video">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="scanner-video"
                            />
                            <div className="scanner-overlay">
                                <div className="scanner-frame"></div>
                                <p>Position QR code within the frame</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="qr-scanner-error">
                            <p>{error}</p>
                            <button onClick={() => setError(null)}>Try Again</button>
                        </div>
                    )}

                    {scannedData && (
                        <div className="qr-scanner-result">
                            <p>Scanned: {scannedData}</p>
                            <button onClick={() => setScannedData(null)}>Scan Another</button>
                        </div>
                    )}
                </div>

                {isScanning && (
                    <div className="qr-scanner-controls">
                        <button className="stop-scan-button" onClick={stopScanning}>
                            Stop Scanning
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
