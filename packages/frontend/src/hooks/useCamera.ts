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
    isSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
  });
  const [isStarting, setIsStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const setError = (error?: string) => {
    setState(prev => ({ ...prev, error }));
  };

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user'): Promise<boolean> => {
    if (state.isActive || isStarting) {
      return false;
    }
    if (!state.isSupported) {
      toast.error('Camera is not supported in this browser');
      return false;
    }

    setIsStarting(true);
    setError(undefined);

    try {
      console.log('Checking for available media devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log('Available video devices:', videoDevices);
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found by the browser.');
      }

      let stream: MediaStream;
      try {
        console.log(`Attempting to get camera with facingMode: ${facingMode}`);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        });
      } catch (err) {
        console.warn(`Failed to get camera with specific facingMode: ${facingMode}. Trying a generic request.`, err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      }

      console.log('Camera stream obtained successfully.');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for the video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;

          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };

          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video failed to load'));
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);

          // Trigger loading if not already started
          if (video.readyState === 0) {
            video.load();
          } else {
            onLoadedMetadata();
          }
        });

        await videoRef.current.play();
        console.log('Video is now playing');
      }

      setState(prev => ({ ...prev, isActive: true, stream }));
      toast.success('Camera started!');
      return true;

    } catch (err: unknown) {
      console.error('Camera error:', err);

      let userFriendlyError = 'Failed to access camera. Please try again.';
      if (err instanceof Error) {
        switch (err.name) {
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            userFriendlyError = 'No camera found. Ensure it is connected and not used by another app.';
            break;
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            userFriendlyError = 'Camera access was denied. Please enable it in your browser settings.';
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            userFriendlyError = 'Your camera might be in use by another application.';
            break;
          default:
            if (err.message.includes('No camera devices found')) {
              userFriendlyError = err.message;
            }
            break;
        }
      }

      setError(userFriendlyError);
      toast.error(userFriendlyError);
      return false;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    setState(prev => {
      if (prev.stream) {
        prev.stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped camera track:', track.kind);
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Reset the video element
      }

      return {
        ...prev,
        isActive: false,
        stream: undefined,
        error: undefined,
      };
    });
  }, []);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !state.isActive) {
      toast.error('Camera is not active');
      return null;
    }

    const video = videoRef.current;

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Video not ready. Please wait a moment and try again.');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Check file size (rough estimate)
      const sizeInBytes = (dataUrl.length * 3) / 4;
      if (sizeInBytes > 2 * 1024 * 1024) {
        toast.error('Image is too large (max 2MB). Please try again.');
        return null;
      }

      console.log('Photo captured successfully, size:', Math.round(sizeInBytes / 1024), 'KB');
      return dataUrl;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
      console.error('Capture error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [state.isActive]);

  const dataUrlToFile = useCallback((dataUrl: string, filename: string = 'photo.jpg'): File | null => {
    try {
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      const mime = mimeMatch[1];
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
          prev.stream.getTracks().forEach(track => {
            track.stop();
            console.log('Cleanup: Stopped camera track on unmount:', track.kind);
          });
        }
        return prev;
      });
    };
  }, []);

  // Handle video ref changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoError = (event: Event) => {
      console.error('Video element error:', event);
      setError('Video playback failed. Please try again.');
    };

    const handleVideoPlay = () => {
      console.log('Video started playing successfully');
    };

    const handleVideoLoadedMetadata = () => {
      console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
    };

    video.addEventListener('error', handleVideoError);
    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('loadedmetadata', handleVideoLoadedMetadata);

    return () => {
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('loadedmetadata', handleVideoLoadedMetadata);
    };
  }, []);

  return {
    ...state,
    isStarting,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    dataUrlToFile,
    getAvailableCameras,
  };
};