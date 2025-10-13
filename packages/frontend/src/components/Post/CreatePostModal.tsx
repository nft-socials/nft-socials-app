import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smile, Send, Camera, Image, Gem, Sparkles, SparklesIcon } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useCamera } from '@/hooks/useCamera';
import { usePostNFT } from '@/hooks/usePostNFT';
import { toast } from 'sonner';
import EmojiPickerComponent from './EmojiPicker';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSuccess?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostSuccess }) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('text');

  const { createPost, state } = useAppContext();
  const { mintPost, isLoading: isMinting } = usePostNFT();
  const {
    videoRef,
    isActive: isCameraActive,
    startCamera,
    stopCamera,
    capturePhoto,

    isSupported: isCameraSupported
  } = useCamera();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 280;
  const remainingChars = MAX_CHARS - content.length;



  const handleSubmit = async () => {

    if ((content.trim() || capturedImage) && remainingChars >= 0) {
      try {
        // Use the actual content, allow empty content for image-only posts
        const finalContent = content.trim();

        const result = await mintPost(finalContent, capturedImage || undefined, () => {
          // Success callback - redirect to home
          setContent('');
          setCapturedImage(null);
          onClose();
          if (onPostSuccess) {
            onPostSuccess();
          }
        });

        if (result) {
          // Transaction submitted successfully
        } else {
        }
      } catch (error) {
        console.error('Failed to create post:', error);
        toast.error('Failed to create post. Please try again.');
      }
    } else {
      toast.error('Please add some content or an image to your post');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleStartCamera = async () => {
    const success = await startCamera();
    if (success) {
      setActiveTab('camera');
    } else {
    }
  };

  const handleCapturePhoto = () => {
    const photo = capturePhoto();
    if (photo) {
      setCapturedImage(photo);
      stopCamera();
      setActiveTab('preview');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setActiveTab('preview');
      };
      reader.readAsDataURL(file);
    }
  };



  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setContent('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Gem className="w-5 h-5 text-primary animate-pulse" />
            Create Your Daily NFT Post
          </DialogTitle>
          <DialogDescription>
            Share your daily moment and mint it as an NFT on Starknet
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="camera" disabled={!isCameraSupported}>Camera</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="preview" disabled={!capturedImage}>Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="What's on your mind today? This post will become your unique NFT..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none border-border bg-background"
                maxLength={MAX_CHARS}
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>

                <Badge variant={remainingChars < 0 ? 'destructive' : 'secondary'}>
                  {remainingChars} chars
                </Badge>
              </div>

              {showEmojiPicker && (
                <div className="absolute top-full left-0 z-50 mt-2">
                  <EmojiPickerComponent onEmojiSelect={handleEmojiSelect} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            <Card className="p-4 bg-background">
              {!isCameraActive ? (
                <div className="text-center space-y-4">
                  <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Camera Access</h3>
                    <p className="text-sm text-muted-foreground">Take a photo to include with your post</p>
                  </div>
                  <Button onClick={handleStartCamera} className="bg-primary">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-48 sm:h-64 md:h-72 lg:h-80 object-cover rounded-lg bg-black"
                      onLoadedMetadata={() =>{}}
                      onPlay={() => {}}
                      onError={(e) => console.error('Video error in component:', e)}
                      style={{ backgroundColor: '#000' }}
                    />
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <div className="text-white text-center">
                          <Camera className="w-8 h-8 mx-auto mb-2" />
                          <p>Initializing camera...</p>
                        </div>
                      </div>
                    )}
                  </div>



                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleCapturePhoto} className="flex-1 bg-success">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button variant="outline" onClick={stopCamera} className="sm:w-auto">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card className="p-4 bg-background">
              <div className="text-center space-y-4">
                <Image className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Upload Image</h3>
                  <p className="text-sm text-muted-foreground">Select an image from your device (max 2MB)</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()} className="bg-accent">
                  <Image className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {capturedImage && (
              <Card className="p-4 bg-background">
                <div className="space-y-4">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCapturedImage(null);
                        setActiveTab('camera');
                      }}
                    >
                      Retake
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCapturedImage(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {content.trim() && (
            <Card className="p-4 bg-muted border-border animate-fade-in">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-primary" />
                NFT Preview:
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {content}
              </p>
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Attached"
                  className="mt-2 w-full h-32 object-cover rounded"
                />
              )}
            </Card>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={(!content.trim() && !capturedImage) || remainingChars < 0 || isMinting}
              className="flex-1 bg-primary hover:bg-primary/90 animate-scale-in"
            >
              <Send className="w-4 h-4 mr-2" />
              {isMinting ? 'Minting NFT...' : 'Post & Mint NFT'}
            </Button>

            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;