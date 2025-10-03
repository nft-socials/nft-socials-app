import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Smile, Send } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import EmojiPickerComponent from './EmojiPicker';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { createPost, state } = useAppContext();

  const MAX_CHARS = 280;
  const remainingChars = MAX_CHARS - content.length;

  const handleSubmit = async () => {
    if (content.trim() && remainingChars >= 0) {
      await createPost(content.trim());
      setContent('');
      onClose();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Your Daily Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="What's on your mind today? This post will become your unique NFT..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none border-border bg-background/50"
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
              
              <div className={`text-sm ${remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {remainingChars}
              </div>
            </div>

            {showEmojiPicker && (
              <div className="absolute top-full left-0 z-50 mt-2">
                <EmojiPickerComponent onEmojiSelect={handleEmojiSelect} />
              </div>
            )}
          </div>

          {content.trim() && (
            <Card className="p-4 bg-muted/50 border-border">
              <h4 className="text-sm font-medium mb-2">Preview:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {content}
              </p>
            </Card>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || remainingChars < 0 || state.isLoading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {state.isLoading ? 'Creating NFT...' : 'Post & Mint NFT'}
            </Button>
            
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;