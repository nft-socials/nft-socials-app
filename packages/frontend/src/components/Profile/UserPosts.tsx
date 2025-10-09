import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, Gem, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PostCard from '@/components/Feed/PostCard';
import { useStarknetWallet } from '@/hooks/useStarknetWallet';
import { usePostNFT } from '@/hooks/usePostNFT';
import { getAllPosts } from '@/services/contract';
import type { Post } from '@/context/AppContext';

const UserPosts: React.FC = () => {
  const { address, isConnected } = useStarknetWallet();
  const { fetchUserPosts } = usePostNFT();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const loadUserNFTs = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // Get all posts and filter by current owner (includes bought NFTs)
      const allPosts = await getAllPosts(0, 1000);
      const userNFTs = allPosts.filter(post =>
        post.currentOwner.toLowerCase() === address.toLowerCase()
      );
      setPosts(userNFTs);
    } catch (error) {
      console.error('Failed to load user NFTs:', error);
      toast.error('Failed to load your NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadUserNFTs();
    }
  }, [isConnected, address]);

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
        title: 'Check out this NFT post!',
        text: post.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleSellProposal = (post: Post) => {
    toast.success('Sell functionality coming soon!');
  };

  if (!isConnected) {
    return (
      <Card className="p-8 text-center bg-card border-border">
        <Gem className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your wallet to view your NFT posts
        </p>
      </Card>
    );
  }

  const totalNFTs = posts.length;
  const totalLikes = Object.values(likeCounts).reduce((sum, count) => sum + count, 0);
  const avgLikes = totalNFTs > 0 ? (totalLikes / totalNFTs).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Gem className="w-6 h-6 text-primary-foreground animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My NFT Collection</h1>
              <p className="text-muted-foreground">NFTs you own and created</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadUserNFTs}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{totalNFTs}</div>
            <div className="text-sm text-muted-foreground">Total NFTs</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">{totalLikes}</div>
            <div className="text-sm text-muted-foreground">Total Likes</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Gem className="w-6 h-6 mx-auto mb-2 text-accent" />
            <div className="text-2xl font-bold">{avgLikes}</div>
            <div className="text-sm text-muted-foreground">Avg Likes/Post</div>
          </div>
        </div>
      </Card>

      {/* Posts Grid */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Your NFTs</h2>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {totalNFTs} NFTs
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading your NFTs...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Gem className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first NFT post or buy NFTs from the marketplace to see them here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard 
                key={post.tokenId} 
                post={post}
                onLike={handleLike}
                onShare={handleShare}
                onSwapClick={handleSellProposal}
                showSwapButton={true}
                isLiked={likedPosts.has(post.tokenId)}
                likeCount={likeCounts[post.tokenId] || Math.floor(Math.random() * 10) + 1}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserPosts;
