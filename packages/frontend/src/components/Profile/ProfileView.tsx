import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gem, ExternalLink, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAccount } from '@starknet-react/core';
import { cancelSell, getAllPosts, getSoldNFTs, getUserSoldNFTs } from '@/services/contract';
import PostCard from '@/components/Feed/PostCard';
import SellModal from '@/components/Modals/SellModal';
import { toast } from 'react-hot-toast';
import type { Post } from '@/context/AppContext';
import { LikesService } from '@/services/chatService';

interface ProfileViewProps {
  isConnected: boolean;
  onNavigate?: (tab: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ isConnected, onNavigate }) => {
  const { state, refreshUserData } = useAppContext();
  const { address, account } = useAccount();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPostForSell, setSelectedPostForSell] = useState<Post | null>(null);
  const [allUserNFTs, setAllUserNFTs] = useState<Post[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [soldNFTs, setSoldNFTs] = useState<any[]>([]);
  const [isLoadingSoldNFTs, setIsLoadingSoldNFTs] = useState(false);

  const fetchAllUserNFTs = async () => {
    if (!address) return;

    setIsLoadingNFTs(true);
    try {
      // Get all posts and filter by current owner (includes bought NFTs)
      const allPosts = await getAllPosts(0, 1000);
      const userNFTs = allPosts.filter(post =>
        post.currentOwner.toLowerCase() === address.toLowerCase()
      );
      setAllUserNFTs(userNFTs);
    } catch (error) {
      console.error('Failed to load user NFTs:', error);
      toast.error('Failed to load your NFTs');
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const fetchSoldNFTs = async () => {
    if (!address) return;

    setIsLoadingSoldNFTs(true);
    try {
      // Get sold NFTs from localStorage (where we track sales)
      const allSoldNFTs = await getUserSoldNFTs(address);
      console.log(allSoldNFTs)
      // Filter to only show NFTs sold by the current user
      // const userSoldNFTs = allSoldNFTs.filter(nft =>
      //   nft.author && nft.author.toLowerCase() === address.toLowerCase()
      // );
      setSoldNFTs(allSoldNFTs);
    } catch (error) {
      console.error('Failed to load sold NFTs:', error);
      toast.error('Failed to load sold NFTs');
    } finally {
      setIsLoadingSoldNFTs(false);
    }
  };

  // Load initial like data
  useEffect(() => {
    const loadLikeData = async () => {
      if (!address || !allUserNFTs.length) return;

      try {
        const likePromises = allUserNFTs.map(async (post) => {
          const [isLiked, count] = await Promise.all([
            LikesService.hasUserLiked(address, 'post', post.tokenId),
            LikesService.getLikeCount('post', post.tokenId)
          ]);
          return { tokenId: post.tokenId, isLiked, count };
        });

        const likeData = await Promise.all(likePromises);

        const newLikedPosts = new Set<string>();
        const newLikeCounts: { [key: string]: number } = {};

        likeData.forEach(({ tokenId, isLiked, count }) => {
          if (isLiked) newLikedPosts.add(tokenId);
          newLikeCounts[tokenId] = count;
        });

        setLikedPosts(newLikedPosts);
        setLikeCounts(newLikeCounts);
      } catch (error) {
        console.error('Error loading like data:', error);
      }
    };

    loadLikeData();
  }, [address, allUserNFTs]);

  useEffect(() => {
    if (isConnected && address) {
      // Only fetch user NFTs, don't call refreshUserData to avoid conflicts
      fetchAllUserNFTs();
      fetchSoldNFTs();
    }
  }, [isConnected, address]);

  const handleLike = async (post: Post) => {
    if (!address) {
      toast.error('Please connect your wallet to like posts');
      return;
    }

    try {
      const result = await LikesService.toggleLike(
        address,
        'post',
        post.tokenId,
        post.author
      );

      const newLikedPosts = new Set(likedPosts);
      const newLikeCounts = { ...likeCounts };

      if (result.liked) {
        newLikedPosts.add(post.tokenId);
        toast.success('❤️ Liked!');
      } else {
        newLikedPosts.delete(post.tokenId);
        toast.success('💔 Unliked');
      }

      newLikeCounts[post.tokenId] = result.count;
      setLikedPosts(newLikedPosts);
      setLikeCounts(newLikeCounts);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleSell = (post: Post) => {
    setSelectedPostForSell(post);
    setSellModalOpen(true);
  };

  const handleSellSuccess = (post: Post, price: string) => {
    toast.success(`🎉 NFT #${post.tokenId} listed for ${price} STRK!`);
    // Refresh user data to update the post status
    refreshUserData();
    // Also refresh local NFTs
    fetchAllUserNFTs();
  };

  const handleCancelSell = async (post: Post) => {
    if (!account) {
      toast.error('Please connect your wallet to cancel listing');
      return;
    }

    try {
      toast.loading('Canceling listing...');
      const txHash = await cancelSell(account, post.tokenId);
      toast.dismiss();
      toast.success(`🎉 Listing canceled for NFT #${post.tokenId}!`);

      // Refresh user data to update the post status
      refreshUserData();
    } catch (error) {
      console.error('Error canceling listing:', error);
      toast.dismiss();
      toast.error('Failed to cancel listing. Please try again.');
    }
  };

  const handleChat = (post: Post) => {
    // Simple placeholder for chat functionality in profile
    toast.success('Chat feature coming soon!');
  };

  if (!isConnected) {
    return (
      <Card className="p-4 bg-card/50 border-border/50">
        <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>Connect your wallet to view your profile</p>
        </div>
      </Card>
    );
  }

  console.log({soldNFTs})

  return (
    <Card className="bg-card/60 border-border/60 md:mt-10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Gem className="w-5 h-5 text-primary animate-pulse" />
            Profile
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchAllUserNFTs();
                fetchSoldNFTs();
              }}
              disabled={isLoadingNFTs || isLoadingSoldNFTs}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${(isLoadingNFTs || isLoadingSoldNFTs) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onNavigate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('user-nfts')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View All NFTs
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nfts">
          <TabsList className="mb-4">
            <TabsTrigger value="nfts">My NFTs ({allUserNFTs.length})</TabsTrigger>
            <TabsTrigger value="sold">My Sold NFTs ({soldNFTs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="nfts">
            {isLoadingNFTs ? (
              <div className="text-center py-8 text-muted-foreground">Loading your NFTs...</div>
            ) : allUserNFTs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No NFTs yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {allUserNFTs.map((post) => (
                  <PostCard
                    key={post.tokenId}
                    post={post}
                    onLike={handleLike}
                    onSell={handleSell}
                    onCancelSell={handleCancelSell}
                    onChat={handleChat}
                    showSwapButton={false}
                    isLiked={likedPosts.has(post.tokenId)}
                    likeCount={likeCounts[post.tokenId] || 0}
                    isOwner={true}
                    isForSale={post.isForSale || false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sold">
            {isLoadingSoldNFTs ? (
              <div className="text-center py-8 text-muted-foreground">Loading sold NFTs...</div>
            ) : soldNFTs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No NFTs sold yet.</div>
            ) : (
              <div className="space-y-3">
                {soldNFTs.map((nft) => (
                  <Card key={nft.tokenId} className="bg-muted/40 border-border/50">
                    <CardContent className="pb-4 pt-4 flex items-center justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">NFT #{nft}</div>
                        <div className="text-muted-foreground text-xs hidden">
                          Sold for {typeof nft.salePrice === 'number' ? (nft.salePrice / 1e18).toFixed(4) : 'N/A'} STRK
                        </div>
                        <div className="text-muted-foreground text-xs hidden">
                          Sold on {new Date(nft.soldAt || nft.timestamp).toLocaleDateString()}
                        </div>
                        {nft.buyer && (
                          <div className="text-muted-foreground text-xs">
                            Buyer: {nft.buyer.slice(0, 6)}...{nft.buyer.slice(-4)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sold
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Sell Modal */}
      <SellModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        post={selectedPostForSell}
        onSellSuccess={handleSellSuccess}
      />
    </Card>
  );
};

export default ProfileView;
