import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Heart, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAccount } from '@starknet-react/core';
import { cancelSell } from '@/services/contract';
import PostCard from '@/components/Feed/PostCard';
import SellModal from '@/components/Modals/SellModal';
import type { Post } from '@/context/AppContext';
import PostSample from '@/pages/PostSample';

interface CommunityFeedProps {
  isLoading: boolean;
  posts: Post[];
  onRefresh: () => void;
  onNavigate?: (tab: string) => void;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({ isLoading, posts, onRefresh, onNavigate }) => {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPostForSell, setSelectedPostForSell] = useState<Post | null>(null);
  const { address, account } = useAccount();

  // Auto-refresh posts that are still loading from IPFS
  useEffect(() => {
    const loadingPosts = posts.filter(post =>
      post.content === 'Loading content from IPFS...' ||
      post.content === 'Failed to load content from IPFS'
    );

    if (loadingPosts.length > 0) {
      console.log(`Found ${loadingPosts.length} posts still loading from IPFS, will retry in 5 seconds`);
      const timer = setTimeout(() => {
        console.log('Retrying to load IPFS content...');
        onRefresh();
      }, 5000); // Retry after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [posts, onRefresh]);

  const handleLike = (post: Post) => {
    const newLikedPosts = new Set(likedPosts);
    const newLikeCounts = { ...likeCounts };

    if (likedPosts.has(post.tokenId)) {
      newLikedPosts.delete(post.tokenId);
      newLikeCounts[post.tokenId] = Math.max(0, (newLikeCounts[post.tokenId] || 0) - 1);
      toast.success('💔 Unliked');
    } else {
      newLikedPosts.add(post.tokenId);
      newLikeCounts[post.tokenId] = (newLikeCounts[post.tokenId] || 0) + 1;
      toast.success('❤️ Liked!');
    }

    setLikedPosts(newLikedPosts);
    setLikeCounts(newLikeCounts);
  };

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: 'OnePostNft NFT',
        text: post.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('📋 Link copied to clipboard!');
    }
  };

  const handleSwapPropose = (post: Post) => {
    toast.success(`🔄 Swap proposal for NFT #${post.tokenId}!`);
    // Implement actual swap proposal logic
  };

  const handleSell = (post: Post) => {
    setSelectedPostForSell(post);
    setSellModalOpen(true);
  };

  const handleSellSuccess = (post: Post, price: string) => {
    toast.success(`🎉 NFT #${post.tokenId} listed for ${price} ETH!`);
    // Refresh posts to update the feed
    onRefresh();
  };

  const handleCancelSell = async (post: Post) => {
    if (!account) {
      toast.error('Please connect your wallet to cancel listing');
      return;
    }

    try {
      toast.loading('Canceling listing...');
      // Note: cancelSell typically takes a proposal ID, but we'll use tokenId for now
      // This might need adjustment based on your contract implementation
      const txHash = await cancelSell(account, post.tokenId);
      toast.dismiss();
      toast.success(`🎉 Listing canceled for NFT #${post.tokenId}!`);

      // Refresh posts to update the feed
      onRefresh();
    } catch (error) {
      console.error('Error canceling listing:', error);
      toast.dismiss();
      toast.error('Failed to cancel listing. Please try again.');
    }
  };

  const handleChat = (post: Post) => {
    // Navigate to chat with the post owner (current owner, not author)
    const ownerAddress = post.currentOwner;
    const ownerName = `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}.stark`;

    // Store chat info in localStorage for the chat page to pick up
    localStorage.setItem('chatTarget', JSON.stringify({
      address: ownerAddress,
      name: ownerName,
      postId: post.tokenId
    }));

    // Navigate to chat page
    if (onNavigate) {
      onNavigate('Chats');
      toast.success(`Opening chat with ${ownerName}`);
    } else {
      toast.success(`Chat info saved. Navigate to Chats to continue.`);
    }
  };
  return (
    <div className="space-y-4 md:mt-10">
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Posts</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="animate-scale-in"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading posts from blockchain...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create an NFT post on Starknet!
            </p>
            <p className="text-sm text-muted-foreground">
              Your posts will appear here once they're minted on the blockchain.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <PostSample /> 
            {posts.map((post) => {
              const isOwner = address && post.author.toLowerCase() === address.toLowerCase();
              return (
                <PostCard
                  key={post.tokenId}
                  post={post}
                  onLike={handleLike}
                  onShare={handleShare}
                  onSell={handleSell}
                  onCancelSell={handleCancelSell}
                  onChat={handleChat}
                  onSwapClick={handleSwapPropose}
                  showSwapButton={post.isSwappable}
                  isLiked={likedPosts.has(post.tokenId)}
                  likeCount={likeCounts[post.tokenId] || Math.floor(Math.random() * 5) + 1}
                  isOwner={isOwner}
                  isForSale={post.isForSale || false}
                />
              );
            })}
          </div>
        )}
      </Card>

      {/* Sell Modal */}
      <SellModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        post={selectedPostForSell}
        onSellSuccess={handleSellSuccess}
      />
    </div>
  );
};

export default CommunityFeed;
