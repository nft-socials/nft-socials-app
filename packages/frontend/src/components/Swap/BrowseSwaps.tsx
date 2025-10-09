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
import PostCard from '@/components/Feed/PostCard';
import SellModal from '@/components/Modals/SellModal';
import { toast } from 'react-hot-toast';

const BrowseSwaps: React.FC = () => {
  const { state, proposeSwap } = useAppContext();
  const { address, account } = useAccount();
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
  const myPosts = state.userPosts || [];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const posts = await getAllPosts(0, FEED_PAGE_SIZE * 2);
        const swappables = posts.filter((p) => Boolean(p.isSwappable)  );
        setSwappablePosts(swappables);
      } catch (e) {
        setError('Failed to load swappable posts');
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
    if (!targetTokenId || !mySelectedTokenId) return;
    try {
      await proposeSwap(targetTokenId, mySelectedTokenId);
      toastUI({ title: 'Swap proposed', description: `Proposed swap: yours ${mySelectedTokenId} ↔ target ${targetTokenId}` });
      setDialogOpen(false);
    } catch (err) {
      toastUI({ title: 'Failed to propose swap', description: 'Please try again', variant: 'destructive' as any });
    }
  };

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
    toast.success(`🎉 NFT #${post.tokenId} listed for ${price} ETH!`);
    // Refresh swappable posts
    const load = async () => {
      setLoading(true);
      try {
        const posts = await getAllPosts(0, FEED_PAGE_SIZE * 2);
        const swappables = posts.filter((p) => Boolean(p.isSwappable));
        setSwappablePosts(swappables);
      } catch (e) {
        setError('Failed to load swappable posts');
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

      // Refresh swappable posts
      const load = async () => {
        setLoading(true);
        try {
          const posts = await getAllPosts(0, FEED_PAGE_SIZE * 2);
          const swappable = posts.filter(post => post.isSwappable);
          setSwappablePosts(swappable);
        } catch (error) {
          console.error('Error loading swappable posts:', error);
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
    // Simple placeholder for chat functionality in swaps
    toast.success('Chat feature coming soon!');
  };

  const hasMyPosts = useMemo(() => myPosts && myPosts.length > 0, [myPosts]);

  return (
    <section aria-labelledby="browse-swaps-title">
      <Card className="p-4 bg-card/50 border-border/50">
        <header className="mb-4">
          <h2 id="browse-swaps-title" className="text-lg font-semibold">Browse Swappable Posts</h2>
        </header>

        {loading && (
          <div className="text-center py-8 text-muted-foreground">Loading swappable posts…</div>
        )}
        {error && (
          <div className="text-center py-8 text-destructive">{error}</div>
        )}
        {!loading && !error && swappablePosts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No swappable posts available right now.</div>
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
              onSwapClick={() => handleOpenDialog(post.tokenId)}
              showSwapButton={hasMyPosts}
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
            <DialogDescription>Choose the post you want to swap with token #{targetTokenId}</DialogDescription>
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