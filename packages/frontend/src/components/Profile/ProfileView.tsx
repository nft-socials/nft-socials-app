import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gem, ExternalLink } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useAccount } from '@starknet-react/core';
import { cancelSell, getAllPosts } from '@/services/contract';
import PostCard from '@/components/Feed/PostCard';
import SellModal from '@/components/Modals/SellModal';
import { toast } from 'react-hot-toast';
import type { Post } from '@/context/AppContext';

interface ProfileViewProps {
  isConnected: boolean;
  onNavigate?: (tab: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ isConnected, onNavigate }) => {
  const { state, refreshUserData, acceptSwap, rejectSwap } = useAppContext();
  const { address, account } = useAccount();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPostForSell, setSelectedPostForSell] = useState<Post | null>(null);
  const [allUserNFTs, setAllUserNFTs] = useState<Post[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

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

  useEffect(() => {
    if (isConnected && address) {
      // Only fetch user NFTs, don't call refreshUserData to avoid conflicts
      fetchAllUserNFTs();
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

  const handleSell = (post: Post) => {
    setSelectedPostForSell(post);
    setSellModalOpen(true);
  };

  const handleSellSuccess = (post: Post, price: string) => {
    toast.success(`� NFT #${post.tokenId} listed for ${price} ETH!`);
    // Refresh user data to update the post status
    refreshUserData();
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

  return (
    <Card className="bg-card/60 border-border/60 md:mt-10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Gem className="w-5 h-5 text-primary animate-pulse" />
            Profile
          </CardTitle>
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
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nfts">
          <TabsList className="mb-4">
            <TabsTrigger value="nfts">My NFTs ({allUserNFTs.length})</TabsTrigger>
            <TabsTrigger value="requests">Pending Requests ({state.swapProposals.length})</TabsTrigger>
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

          <TabsContent value="requests">
            {state.swapProposals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pending requests.</div>
            ) : (
              <div className="space-y-3">
                {state.swapProposals.map((sp) => (
                  <Card key={String((sp as any).id)} className="bg-muted/40 border-border/50">
                    <CardContent className="pt-4 flex items-center justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">Swap Proposal</div>
                        <div className="text-muted-foreground text-xs">
                          Their #{String((sp as any).initiator_token_id)} ↔ Your #{String((sp as any).target_token_id)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => acceptSwap(String((sp as any).id))}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectSwap(String((sp as any).id))}>Reject</Button>
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
