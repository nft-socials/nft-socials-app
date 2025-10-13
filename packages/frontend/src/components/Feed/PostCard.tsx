import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles, ArrowUpDown, Heart, Tag, Image as ImageIcon, ShoppingCart, MessageCircle } from 'lucide-react';
import { Post } from '@/context/AppContext';
import { usePostSwipeActions } from '@/hooks/useSwipeGestures';
import { getFromIPFS, PostMetadata } from '@/services/ipfs';
import { useProtectedAction } from '@/context/GuestBrowsingContext';
import { useAccount } from '@starknet-react/core';
import ImageZoomModal from '@/components/Modals/ImageZoomModal';
import { formatTimeAgo } from '@/utils/timeUtils';

interface PostCardProps {
  post: Post;
  onSwapClick?: (post: Post) => void;
  showSwapButton?: boolean;
  onLike?: (post: Post) => void;
  onShare?: (post: Post) => void;
  onSell?: (post: Post) => void;
  onBuy?: (post: Post) => void;
  onCancelSell?: (post: Post) => void;
  onChat?: (post: Post) => void;
  isLiked?: boolean;
  likeCount?: number;
  showSellButton?: boolean;
  showBuyButton?: boolean;
  isOwner?: boolean;
  isForSale?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onSwapClick,
  showSwapButton = false,
  onLike,
  onShare,
  onSell,
  onBuy,
  onCancelSell,
  onChat,
  isLiked = false,
  likeCount = 0,
  showSellButton = false,
  showBuyButton = false,
  isOwner = false,
  isForSale = false
}) => {
  const [metadata, setMetadata] = useState<PostMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [showChatOption, setShowChatOption] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const { address } = useAccount();
  const { executeProtectedAction } = useProtectedAction();

  // Fetch IPFS metadata to get image and full content
  useEffect(() => {
    const fetchMetadata = async () => {
      if (post.contentHash) {
        setIsLoadingMetadata(true);
        try {
          const data = await getFromIPFS<PostMetadata>(post.contentHash);
          if (data) {
            setMetadata(data);
          }
        } catch (error) {
          console.error('Error fetching metadata:', error);
        } finally {
          setIsLoadingMetadata(false);
        }
      } else {
        setMetadata(null);
      }
    };

    fetchMetadata();
  }, [post.contentHash]);



  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Determine if current user is the owner (check current owner, not author)
  const isPostOwner = address && post.currentOwner.toLowerCase() === address.toLowerCase();

  const handleBuyClick = () => {
    executeProtectedAction('buy_nft', () => {
      setShowChatOption(true);
      onBuy?.(post);
    });
  };

  const handleChatClick = () => {
    onChat?.(post);
  };

  const handleImageClick = () => {
    setShowImageZoom(true);
  };

  // Content protection handlers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  const handleSelectStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent common copy/save shortcuts
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'c' || e.key === 'a' || e.key === 's' || e.key === 'p' || e.key === 'v')
    ) {
      e.preventDefault();
      return false;
    }
    // Prevent F12 (Developer Tools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Prevent Ctrl+Shift+I (Developer Tools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
  };

  // Swipe gesture handlers
  const swipeHandlers = usePostSwipeActions(
    post.tokenId,
    () => onLike?.(post),
    () => isPostOwner ? onSell?.(post) : onShare?.(post),
    () => onSwapClick?.(post),
  );

  const getSwapStatus = () => {
    // If post is for sale, show for sale status
    if (isForSale) {
      return { status: 'for-sale', color: 'bg-green-500/20 text-green-400', label: 'For Sale' };
    }

    // If post was sold, show sold status (we'll need to add this logic later)
    // if (post.isSold) {
    //   return { status: 'sold', color: 'bg-gray-500/20 text-gray-400', label: 'Sold' };
    // }

    if (!post.isSwappable) {
      const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 60 * 60);
      if (hoursSincePost < 24) {
        return { status: 'today', color: 'bg-blue-500/20 text-blue-400', label: "Today's Post" };
      }
      return { status: 'cooldown', color: 'bg-orange-500/20 text-orange-400', label: 'Cooldown' };
    }

    // Default status for posts that are not for sale
    return { status: 'available', color: 'bg-purple-500/20 text-purple-400', label: 'Not for sale' };
  };

  const swapStatus = getSwapStatus();

  return (
    <Card
      className="p-4 bg-card border-border hover:border-primary/50 transition-all duration-300 group animate-fade-in hover:animate-morph touch-manipulation nft-protected"
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      {...swipeHandlers}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{truncateAddress(post.currentOwner)}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(new Date(post.timestamp))}
              </div>
              {post.author !== post.currentOwner && (
                <div className="text-xs text-muted-foreground">
                  Created by {truncateAddress(post.author)}
                </div>
              )}
            </div>
          </div>
          
          <Badge className={`${swapStatus.color} border-0 text-nowrap`}>
            {swapStatus.label}
          </Badge>
        </div>

        {/* Content */}
        <div className="py-2 space-y-3">
          {/* Text Content */}
          {(metadata?.content || post.content) &&
           !(metadata?.content === '' && metadata?.image) &&
           !post.content.includes('Loading content from IPFS') && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap nft-protected">
              {metadata?.content || post.content}
            </p>
          )}

          {/* Image Content */}
          {metadata?.image && (
            <div className="relative rounded-lg overflow-hidden bg-muted nft-protected cursor-pointer">
              <img
                src={metadata.image}
                alt="Post image"
                className="w-full max-h-96 object-cover transition-transform duration-300 hover:scale-105 nft-protected"
                onClick={handleImageClick}
                onError={(e) => {
                  console.error('Error loading image:', e);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onDragStart={handleDragStart}
                onContextMenu={handleContextMenu}
              />
            </div>
          )}

          {/* Loading state for metadata */}
          {isLoadingMetadata && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="w-4 h-4 animate-pulse" />
              <span>Loading media...</span>
            </div>
          )}
        </div>

        {/* NFT Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground text-nowrap">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-nowrap">Nft #{post.tokenId}</span>
            {isForSale && post.price > 0 && (
              <span className="text-primary font-medium tex-nowrap">
                • {(post.price / 1e18).toFixed(2)} STRK
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            {/* Like and Share buttons */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => executeProtectedAction('like_post', () => onLike?.(post))}
                className={`flex items-center gap-1 h-8 px-2 hover:bg-primary/10 transition-colors ${
                  isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{likeCount}</span>
              </Button>

              {/* Sell/Buy/Share Button */}
              {isPostOwner && !isForSale ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => executeProtectedAction('sell_nft', () => onSell?.(post))}
                  className="flex items-center gap-1 h-8 px-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Sell</span>
                </Button>
              ) : isPostOwner && isForSale ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancelSell?.(post)}
                  className="flex items-center gap-1 h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 transition-colors"
                  title="Cancel listing"
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Cancel</span>
                </Button>
              ) : !isPostOwner && isForSale ? (
                <div className="flex items-center gap-1 min-w-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBuyClick}
                    className="flex items-center gap-1 h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors shrink-0"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-sm font-medium hidden lg:inline">Buy</span>
                  </Button>
                  {showChatOption && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleChatClick}
                      className="flex items-center gap-1 h-8 px-1 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors shrink-0"
                      title="Chat with owner"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium hidden xl:inline">Chat</span>
                    </Button>
                  )}
                </div>
              ) : !isPostOwner && !isForSale ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleChatClick}
                  className="flex items-center gap-1 h-8 px-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors shrink-0"
                  title="Chat with owner"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium hidden lg:inline">Chat</span>
                </Button>
              ) : null}
            </div>

            
          </div>
        </div>

        {/* Mobile swipe hint */}
        <div className="md:hidden mt-3 text-xs text-muted-foreground text-center opacity-50 border-t border-border pt-2">
          ← Like • mint → • ↑ sell/buy • ↓ Save
        </div>
      </div>

      {/* Image Zoom Modal */}
      {metadata?.image && (
        <ImageZoomModal
          isOpen={showImageZoom}
          onClose={() => setShowImageZoom(false)}
          imageUrl={metadata.image}
          altText={`NFT #${post.tokenId} Image`}
          title={`NFT #${post.tokenId} - ${truncateAddress(post.author)}`}
        />
      )}
     </Card>
  );
};

export default PostCard;