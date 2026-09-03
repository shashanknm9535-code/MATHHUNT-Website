'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Scan } from 'lucide-react';

interface QRScannerProps {
  onScanResult: (_payload: string) => void;
  isProcessing: boolean;
  onManualFallback: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanResult,
  isProcessing,
  onManualFallback,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<string | null>(null);
  const scanPausedRef = useRef<boolean>(false);

  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unavailable'>('idle');
  const [scanning, setScanning] = useState(false);

  // Stop camera and cancel animation frame
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  // Decode QR from canvas frame using browser BarcodeDetector API
  const tickScan = useCallback(async () => {
    if (scanPausedRef.current) {
      animFrameRef.current = requestAnimationFrame(tickScan);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(tickScan);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(tickScan);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Use BarcodeDetector if available (Chrome/Edge/Android WebView)
      if ('BarcodeDetector' in window) {
        // @ts-expect-error BarcodeDetector not yet in all TS lib defs
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue as string;
          if (raw && raw !== lastScanRef.current) {
            lastScanRef.current = raw;
            scanPausedRef.current = true;
            onScanResult(raw);
          }
        }
      }
    } catch {
      // BarcodeDetector failed — swallow silently, keep scanning
    }

    animFrameRef.current = requestAnimationFrame(tickScan);
  }, [onScanResult]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraStatus('requesting');
    lastScanRef.current = null;
    scanPausedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus('active');
      setScanning(true);
      animFrameRef.current = requestAnimationFrame(tickScan);
    } catch (err: unknown) {
      const domErr = err as DOMException;
      if (domErr?.name === 'NotAllowedError' || domErr?.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('unavailable');
      }
    }
  }, [tickScan]);

  // Resume scanning after processing is complete
  useEffect(() => {
    if (!isProcessing) {
      scanPausedRef.current = false;
    } else {
      scanPausedRef.current = true;
    }
  }, [isProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const resetScan = () => {
    lastScanRef.current = null;
    scanPausedRef.current = false;
  };

  return (
    <div className="space-y-4">
      {/* Scanner Viewport */}
      <div className="relative w-full aspect-[4/3] sm:aspect-video max-w-lg mx-auto rounded-2xl overflow-hidden bg-gray-950 border-2 border-cyan-500/30 shadow-xl shadow-cyan-500/10">
        {/* Live Video */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'
          }`}
          muted
          playsInline
        />
        {/* Hidden canvas for BarcodeDetector */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Idle / Start Camera state */}
        {cameraStatus === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gray-950 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Scan Registration QR Code</p>
              <p className="text-xs text-gray-400 mt-1">Point camera at the participant&apos;s QR pass</p>
            </div>
            <button
              type="button"
              onClick={startCamera}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm tracking-wider transition-all border border-cyan-400/40 shadow-lg shadow-cyan-500/20"
            >
              Start Scanner
            </button>
          </div>
        )}

        {/* Requesting permission */}
        {cameraStatus === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 space-y-3">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-300 font-medium">Requesting camera permission...</p>
          </div>
        )}

        {/* Permission Denied */}
        {cameraStatus === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 p-6 text-center space-y-3">
            <CameraOff className="w-10 h-10 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-white">Camera Permission Denied</p>
              <p className="text-xs text-gray-400 mt-1">
                Allow camera access in your browser settings, then retry. Or use Manual Entry below.
              </p>
            </div>
            <button type="button" onClick={startCamera} className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium">
              Retry Camera
            </button>
          </div>
        )}

        {/* Camera Unavailable */}
        {cameraStatus === 'unavailable' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 p-6 text-center space-y-3">
            <CameraOff className="w-10 h-10 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-white">Camera Unavailable</p>
              <p className="text-xs text-gray-400 mt-1">No camera was detected on this device. Use Manual Entry below.</p>
            </div>
          </div>
        )}

        {/* Active Scanning Overlay */}
        {cameraStatus === 'active' && (
          <>
            {/* Scanning Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                {/* Scan line animation */}
                {scanning && !isProcessing && (
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" style={{ animationName: 'scan', top: '50%' }} />
                )}
              </div>
            </div>

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-gray-950/80 flex flex-col items-center justify-center space-y-3 backdrop-blur-sm">
                <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-cyan-300 font-semibold tracking-wider uppercase">Looking Up Registration...</p>
              </div>
            )}

            {/* Bottom action strip */}
            <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between bg-gradient-to-t from-gray-950/90 to-transparent">
              <div className="flex items-center space-x-2 text-xs text-cyan-400">
                <Scan className="w-3.5 h-3.5 animate-pulse" />
                <span>{isProcessing ? 'Processing...' : 'Scanning for QR code...'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={resetScan}
                  className="p-1.5 rounded-lg bg-gray-800/80 text-gray-300 hover:text-white border border-gray-700 transition-colors"
                  title="Reset scan"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-1.5 rounded-lg bg-gray-800/80 text-gray-300 hover:text-red-400 border border-gray-700 transition-colors"
                  title="Stop camera"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual Fallback link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onManualFallback}
          className="text-xs text-gray-400 hover:text-cyan-400 transition-colors font-medium underline underline-offset-4"
        >
          Camera not available? Enter Registration ID manually
        </button>
      </div>

      {/* CSS animation for scan line */}
      <style jsx>{`
        @keyframes scan {
          0%   { top: 10%; }
          50%  { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
};
