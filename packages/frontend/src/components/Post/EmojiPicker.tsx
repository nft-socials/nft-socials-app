import React from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Card } from '@/components/ui/card';

interface EmojiPickerComponentProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPickerComponent: React.FC<EmojiPickerComponentProps> = ({ onEmojiSelect }) => {
  return (
    <Card className="border-border shadow-lg">
      <EmojiPicker
        onEmojiClick={(emojiData) => onEmojiSelect(emojiData.emoji)}
        searchDisabled
        skinTonesDisabled
        previewConfig={{
          showPreview: false
        }}
        width={300}
        height={400}
      />
    </Card>
  );
};

export default EmojiPickerComponent;