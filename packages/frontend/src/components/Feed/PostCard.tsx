import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, ArrowUpDown } from 'lucide-react';
import { Post } from '@/context/AppContext';

interface PostCardProps {
  post: Post;
  onSwapClick?: (post: Post) => void;
  showSwapButton?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onSwapClick, showSwapButton = false }) => {
  // console.log(post)
  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getSwapStatus = () => {
    if (!post.isSwappable) {
      const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 60 * 60);
      if (hoursSincePost < 24) {
        return { status: 'today', color: 'bg-blue-500/20 text-blue-400', label: "Today's Post" };
      }
      return { status: 'cooldown', color: 'bg-orange-500/20 text-orange-400', label: 'Cooldown' };
    }
    return { status: 'available', color: 'bg-green-500/20 text-green-400', label: 'Swappable' };
  };

  const swapStatus = getSwapStatus();

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-border transition-all duration-300 group">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/80 to-primary/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">{truncateAddress(post.author)}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(post.timestamp)}
              </div>
            </div>
          </div>
          
          <Badge className={`${swapStatus.color} border-0`}>
            {swapStatus.label}
          </Badge>
        </div>

        {/* Content */}
        <div className="py-2">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* NFT Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            NFT #{post.tokenId}
          </div>
          
          {showSwapButton && post.isSwappable && onSwapClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSwapClick(post)}
              className="group-hover:border-primary/50 hover:bg-primary/10"
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Propose Swap
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PostCard;