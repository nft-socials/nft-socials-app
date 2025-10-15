import { useCallback, useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';


export interface CameraState {
  isActive: boolean;
  isSupported: boolean;
  error?: string;
  stream?: MediaStream;
}

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    isActive: false,
    isSupported: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const setError = (error?: string) => {
    setState(prev => ({ ...prev, error }));
  };

  // Start camera
  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    if (!state.isSupported) {
      toast.error('Camera is not supported in this browser');
      return false;
    }

    try {
      setError(undefined);
      console.log('Requesting camera permissions...');

      // Check if camera permission is granted
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Camera permission status:', permission.state);
      } catch (permErr) {
        console.log('Permission API not available, proceeding with getUserMedia');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      console.log('Camera stream obtained:', stream.getVideoTracks().length, 'video tracks');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Set video properties for better display
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;

        // Wait for video to be ready and play
        videoRef.current.onloadedmetadata = async () => {
          try {
            if (videoRef.current) {
              console.log('Video metadata loaded, attempting to play...');
              await videoRef.current.play();
              console.log('Camera started successfully');
              toast.success('Camera started!');
            }
          } catch (err) {
            console.error('Failed to play video:', err);
            toast.error('Please click to enable camera');
          }
        };

        // Also try to play immediately in case metadata is already loaded
        try {
          await videoRef.current.play();
          console.log('Video playing immediately');
        } catch (err) {
          console.log('Immediate play failed, waiting for metadata...');
        }
      }

      setState(prev => ({
        ...prev,
        isActive: true,
        stream,
      }));

      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      console.error('Camera error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [state.isSupported]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      stream: undefined,
    }));
  }, [state.stream]);

  // Capture photo
  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !state.isActive) {
      toast.error('Camera is not active');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0);
      
      // Convert to blob with compression for 2MB limit
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Check size (rough estimate: base64 is ~1.37x larger than binary)
      const sizeInBytes = (dataUrl.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 2) {
        // Try with lower quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
        const compressedSize = (compressedDataUrl.length * 3) / 4 / (1024 * 1024);
        
        if (compressedSize > 2) {
          toast.error('Image is too large. Please try again with better lighting or closer subject.');
          return null;
        }
        
        return compressedDataUrl;
      }
      
      return dataUrl;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
      console.error('Capture error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [state.isActive]);

  // Convert data URL to File
  const dataUrlToFile = useCallback((dataUrl: string, filename: string = 'photo.jpg'): File | null => {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], filename, { type: mime });
    } catch (err) {
      console.error('Failed to convert data URL to file:', err);
      return null;
    }
  }, []);



  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    if (!state.isSupported) return [];

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (err) {
      console.error('Failed to get available cameras:', err);
      return [];
    }
  }, [state.isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setState(prev => {
        if (prev.stream) {
          prev.stream.getTracks().forEach(track => track.stop());
        }
        return prev;
      });
    };
  }, []);

  return {
    ...state,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    dataUrlToFile,
    getAvailableCameras,
    isSupported: state.isSupported,
    isActive: state.isActive,
  };
};
