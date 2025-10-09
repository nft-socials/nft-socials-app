import { useCallback, useRef } from 'react';

export interface ARFilter {
  name: string;
  label: string;
  cssFilter: string;
  description: string;
}

export const AR_FILTERS: ARFilter[] = [
  {
    name: 'none',
    label: 'Original',
    cssFilter: 'none',
    description: 'No filter applied'
  },
  {
    name: 'vintage',
    label: 'Vintage',
    cssFilter: 'sepia(50%) contrast(1.2) brightness(1.1) saturate(1.3)',
    description: 'Classic vintage look'
  },
  {
    name: 'cyberpunk',
    label: 'Cyberpunk',
    cssFilter: 'hue-rotate(270deg) saturate(2) brightness(1.2) contrast(1.3)',
    description: 'Futuristic neon effect'
  },
  {
    name: 'noir',
    label: 'Film Noir',
    cssFilter: 'grayscale(100%) contrast(1.5) brightness(0.9)',
    description: 'Classic black and white'
  },
  {
    name: 'warm',
    label: 'Golden Hour',
    cssFilter: 'hue-rotate(30deg) saturate(1.3) brightness(1.1) contrast(1.1)',
    description: 'Warm golden tones'
  },
  {
    name: 'cool',
    label: 'Arctic',
    cssFilter: 'hue-rotate(180deg) saturate(1.5) brightness(1.1) contrast(1.2)',
    description: 'Cool blue tones'
  },
  {
    name: 'dramatic',
    label: 'Dramatic',
    cssFilter: 'contrast(1.8) brightness(0.8) saturate(1.6)',
    description: 'High contrast drama'
  },
  {
    name: 'dreamy',
    label: 'Dreamy',
    cssFilter: 'blur(0.5px) brightness(1.2) saturate(1.4) contrast(0.9)',
    description: 'Soft dreamy effect'
  },
  {
    name: 'retro',
    label: 'Retro Wave',
    cssFilter: 'hue-rotate(300deg) saturate(2) brightness(1.3) contrast(1.4)',
    description: '80s retro aesthetic'
  }
];

export const useARFilters = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Apply CSS filter to video element
  const applyCSSFilter = useCallback((element: HTMLVideoElement | HTMLImageElement, filterName: string) => {
    const filter = AR_FILTERS.find(f => f.name === filterName);
    if (filter && element) {
      element.style.filter = filter.cssFilter;
      element.style.transition = 'filter 0.3s ease';
    }
  }, []);

  // Apply filter to image data (more advanced processing)
  const applyImageFilter = useCallback((imageData: ImageData, filterName: string): ImageData => {
    const data = imageData.data;
    const newImageData = new ImageData(new Uint8ClampedArray(data), imageData.width, imageData.height);
    
    switch (filterName) {
      case 'vintage':
        applyVintageFilter(newImageData.data);
        break;
      case 'cyberpunk':
        applyCyberpunkFilter(newImageData.data);
        break;
      case 'noir':
        applyNoirFilter(newImageData.data);
        break;
      case 'warm':
        applyWarmFilter(newImageData.data);
        break;
      case 'cool':
        applyCoolFilter(newImageData.data);
        break;
      default:
        // Return original for 'none' or unknown filters
        break;
    }
    
    return newImageData;
  }, []);

  // Process image with canvas for more advanced effects
  const processImageWithCanvas = useCallback((
    sourceElement: HTMLVideoElement | HTMLImageElement,
    filterName: string
  ): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size to match source
    canvas.width = sourceElement instanceof HTMLVideoElement 
      ? sourceElement.videoWidth 
      : sourceElement.naturalWidth;
    canvas.height = sourceElement instanceof HTMLVideoElement 
      ? sourceElement.videoHeight 
      : sourceElement.naturalHeight;

    // Draw source to canvas
    ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply filter
    const filteredData = applyImageFilter(imageData, filterName);
    
    // Put filtered data back
    ctx.putImageData(filteredData, 0, 0);
    
    // Return as data URL
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [applyImageFilter]);

  // Simulate face detection (simplified)
  const detectFaces = useCallback((element: HTMLVideoElement | HTMLImageElement) => {
    // This is a mock implementation
    // In a real app, you'd use libraries like face-api.js or MediaPipe
    return [
      {
        x: element.width * 0.3,
        y: element.height * 0.2,
        width: element.width * 0.4,
        height: element.height * 0.5,
        confidence: 0.95
      }
    ];
  }, []);

  return {
    filters: AR_FILTERS,
    applyCSSFilter,
    applyImageFilter,
    processImageWithCanvas,
    detectFaces,
    canvasRef,
  };
};

// Filter implementations
function applyVintageFilter(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Vintage effect: sepia + slight blur
    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
  }
}

function applyCyberpunkFilter(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Cyberpunk: enhance blues and magentas
    data[i] = Math.min(255, r * 1.2 + b * 0.3);
    data[i + 1] = Math.min(255, g * 0.8);
    data[i + 2] = Math.min(255, b * 1.5 + r * 0.2);
  }
}

function applyNoirFilter(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Film noir: grayscale with high contrast
    const gray = Math.min(255, (r * 0.299 + g * 0.587 + b * 0.114) * 1.3);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
}

function applyWarmFilter(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    // Warm filter: enhance reds and yellows
    data[i] = Math.min(255, data[i] * 1.2);     // Red
    data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Green
    data[i + 2] = Math.min(255, data[i + 2] * 0.9); // Blue
  }
}

function applyCoolFilter(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    // Cool filter: enhance blues
    data[i] = Math.min(255, data[i] * 0.8);     // Red
    data[i + 1] = Math.min(255, data[i + 1] * 1.0); // Green
    data[i + 2] = Math.min(255, data[i + 2] * 1.3); // Blue
  }
}
