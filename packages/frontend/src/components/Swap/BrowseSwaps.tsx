import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/context/AppContext';
import type { Post } from '@/context/AppContext';
import { getAllPosts, cancelSell } from '@/services/contract';
import { FEED_PAGE_SIZE } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';
import { useAccount } from '@starknet-react/core';
import { useAnyWallet } from '@/hooks/useAnyWallet';
import PostCard from '@/components/Feed/PostCard';
import SellModal from '@/components/Modals/SellModal';
import { toast } from 'sonner';
import { LikesService } from '@/services/chatService';

const BrowseSwaps: React.FC = () => {
  const { state } = useAppContext();
  const { account } = useAccount(); // For Starknet transactions
  const { address, isConnected } = useAnyWallet(); // For wallet detection
  const { toast: toastUI } = useToast();

  const [swappablePosts, setSwappablePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPostForSell, setSelectedPostForSell] = useState<Post | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetTokenId, setTargetTokenId] = useState<string | null>(null);
  const [mySelectedTokenId, setMySelectedTokenId] = useState<string | null>(null);

  // Load initial like data
  useEffect(() => {
    const loadLikeData = async () => {
      if (!address || !swappablePosts.length) return;

      try {
        const likePromises = swappablePosts.map(async (post) => {
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
  }, [address, swappablePosts]);
  const myPosts = state.userPosts || [];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const posts = await getAllPosts(0, FEED_PAGE_SIZE * 2);
        const forSale = posts.filter((p) => Boolean(p.isForSale));
        setSwappablePosts(forSale);
      } catch (e) {
        setError('Failed to load marketplace posts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenDialog = (tokenId: string) => {
    setTargetTokenId(tokenId);
    setMySelectedTokenId(null);
    setDialogOpen(true);
  };

  const handlePropose = async () => {
    // Swap functionality has been removed - direct buying only
    toast('Swap functionality has been simplified to direct buying. Use the Buy button instead.', { icon: 'ℹ️' });
    setDialogOpen(false);
  };

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

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this swappable NFT post!',
        text: post.content,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleSell = (post: Post) => {
    setSelectedPostForSell(post);
    setSellModalOpen(true);
  };

  const handleSellSuccess = (post: Post, price: string) => {
    toast.success(`🎉 NFT #${post.tokenId} listed for ${price} STRK!`);
    // Refresh marketplace posts
    const load = async () => {
      setLoading(true);
      try {
        const posts = await getAllPosts(0, FEED_PAGE_SIZE * 2);
        const forSale = posts.filter((p) => Boolean(p.isForSale));
        setSwappablePosts(forSale);
      } catch (e) {
        setError('Failed to load marketplace posts');
      } finally {
        setLoading(false);
      }
    };
    load();
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

      // Refresh marketplace posts
      const load = async () => {
        setLoading(true);
        try {
          const posts = await getAllPosts(0, FEED_PAGE_SIZE * 2);
          const forSale = posts.filter(post => post.isForSale);
          setSwappablePosts(forSale);
        } catch (error) {
          console.error('Error loading marketplace posts:', error);
        } finally {
          setLoading(false);
        }
      };
      load();
    } catch (error) {
      console.error('Error canceling listing:', error);
      toast.dismiss();
      toast.error('Failed to cancel listing. Please try again.');
    }
  };

  const handleChat = (post: Post) => {
    // Navigate to chat with the post owner (current owner, not author)
    const ownerAddress = post.currentOwner;
    const ownerName = `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`;

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

  const hasMyPosts = useMemo(() => myPosts && myPosts.length > 0, [myPosts]);

  return (
    <section aria-labelledby="browse-swaps-title">
      <Card className="p-4 bg-card/50 border-border/50">
        <header className="mb-4">
          <h2 id="browse-swaps-title" className="text-lg font-semibold">Browse Marketplace</h2>
        </header>

        {loading && (
          <div className="text-center py-8 text-muted-foreground">Loading marketplace posts…</div>
        )}
        {error && (
          <div className="text-center py-8 text-destructive">{error}</div>
        )}
        {!loading && !error && swappablePosts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No posts available for sale right now.</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {swappablePosts.map((post) => (
            <PostCard
              key={post.tokenId}
              post={post}
              onLike={handleLike}
              onShare={handleShare}
              onSell={handleSell}
              onCancelSell={handleCancelSell}
              onChat={handleChat}

              isLiked={likedPosts.has(post.tokenId)}
              likeCount={likeCounts[post.tokenId] || 0}
              isOwner={address && post.author.toLowerCase() === address.toLowerCase()}
              isForSale={post.isForSale || false}
            />
          ))}
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select one of your posts</DialogTitle>
            <DialogDescription>Direct buying is now available. Use the Buy button instead.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-64 rounded-md border">
            {myPosts.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">You have no posts available.</div>
            ) : (
              <RadioGroup value={mySelectedTokenId ?? ''} onValueChange={(v) => setMySelectedTokenId(v)} className="p-2">
                {myPosts.map((p) => (
                  <Label key={p.tokenId} htmlFor={`my-post-${p.tokenId}`} className="flex items-start gap-3 rounded-md p-3 hover:bg-accent">
                    <RadioGroupItem id={`my-post-${p.tokenId}`} value={p.tokenId} />
                    <div className="flex flex-col">
                      <span className="font-medium">Token #{p.tokenId}</span>
                      <span className="text-xs text-muted-foreground break-all">CID: {p.contentHash}</span>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePropose} disabled={!mySelectedTokenId}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Modal */}
      <SellModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        post={selectedPostForSell}
        onSellSuccess={handleSellSuccess}
      />
    </section>
  );
};

export default BrowseSwaps;