import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/context/AppContext';
import type { Post } from '@/context/AppContext';
import { getAllPosts } from '@/services/contract';
import { FEED_PAGE_SIZE } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';
import { useAccount } from '@starknet-react/core';

const BrowseSwaps: React.FC = () => {
  const { state, proposeSwap } = useAppContext();
    const { address } = useAccount();
  const { toast } = useToast();

  const [swappablePosts, setSwappablePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      toast({ title: 'Swap proposed', description: `Proposed swap: yours ${mySelectedTokenId} ↔ target ${targetTokenId}` });
      setDialogOpen(false);
    } catch (err) {
      toast({ title: 'Failed to propose swap', description: 'Please try again', variant: 'destructive' as any });
    }
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
            <article key={post.tokenId} className="rounded-md border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Token #{post.tokenId}</h3>
                <span className="text-xs text-muted-foreground">Author: {post.author.slice(0, 6)}…{post.author.slice(-4)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground break-all">CID: {post.contentHash}</p>
              <div className="mt-4 flex items-center justify-end">
                <Button
                  size="sm"
                  onClick={() => handleOpenDialog(post.tokenId)}
                  disabled={!hasMyPosts}
                  aria-disabled={!hasMyPosts}
                >
                  Propose swap
                </Button>
              </div>
              {!hasMyPosts && (
                <p className="mt-2 text-xs text-muted-foreground">Connect wallet and create a post to propose swaps.</p>
              )}
            </article>
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
    </section>
  );
};

export default BrowseSwaps;