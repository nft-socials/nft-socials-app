import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
  title?: string;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText = "NFT Image",
  title = "NFT Image"
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `nft-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  React.useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                title="Reset"
                className="text-xs px-2"
              >
                Reset
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-black/5 flex items-center justify-center p-4">
          <div 
            className="transition-transform duration-200 ease-in-out cursor-move"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          >
            <img
              src={imageUrl}
              alt={altText}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>

        <div className="p-4 pt-2 border-t bg-background">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>💡 Use zoom controls to inspect details</span>
            <span>🖱️ Scroll to zoom • Click outside to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageZoomModal;
