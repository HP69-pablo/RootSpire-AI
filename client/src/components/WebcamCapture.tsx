import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, CameraOff, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Initialize the camera stream
  const initCamera = async () => {
    try {
      setError(null);
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' } // Prefer back camera
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access the camera. Please check permissions or try another browser.');
    }
  };
  
  // Clean up the camera stream when component unmounts
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };
  
  // Switch camera between front and back
  const switchCamera = async () => {
    stopCamera();
    try {
      setError(null);
      const currentFacingMode = stream?.getVideoTracks()[0]?.getSettings()?.facingMode;
      const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: newFacingMode }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Could not switch camera. Trying to reinitialize...');
      initCamera(); // Try to reinitialize with default settings
    }
  };
  
  // Capture a photo from the video stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
      }
    }
  };
  
  // Initialize camera when component mounts
  useEffect(() => {
    initCamera();
    
    // Clean up when component unmounts
    return () => {
      stopCamera();
    };
  }, []);
  
  return (
    <div className="flex flex-col">
      <div className="relative bg-black rounded-lg overflow-hidden">
        {/* Close button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 z-10 bg-black/50 text-white border-none h-8 w-8 p-0"
          onClick={() => {
            stopCamera();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* Camera feed */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white flex flex-col items-center justify-center h-full">
              <CameraOff className="h-10 w-10 mb-2" />
              <p className="text-sm">{error || 'Camera not active'}</p>
              {error && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-white/30 text-white"
                  onClick={initCamera}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center p-3 bg-black">
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white"
            onClick={switchCamera}
            disabled={!cameraActive}
          >
            Switch Camera
          </Button>
          
          <Button
            variant="default"
            size="lg"
            className="h-12 w-12 rounded-full p-0 bg-white text-black hover:bg-white/90"
            onClick={capturePhoto}
            disabled={!cameraActive}
          >
            <Camera className="h-6 w-6" />
          </Button>
          
          <div className="w-20" /> {/* Spacer for centering the capture button */}
        </div>
      </div>
      
      {/* Hidden canvas for capturing photos */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}