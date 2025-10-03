import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import { useAccount } from '@starknet-react/core';

const ProfileView: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
  const { state, refreshUserData, acceptSwap, rejectSwap } = useAppContext();
  const { address } = useAccount();

  useEffect(() => {
    if (isConnected) refreshUserData();
  }, [isConnected]);

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
    <Card className="bg-card/60 border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="posts">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">My Posts ({state.userPosts.length})</TabsTrigger>
            <TabsTrigger value="requests">Pending Requests ({state.swapProposals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {state.userPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No posts yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {state.userPosts.map((p) => (
                  <Card key={p.tokenId} className="bg-muted/40 border-border/50">
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Token #{p.tokenId}</div>
                      <div className="mt-2 whitespace-pre-wrap">{p.content || `ipfs://${p.contentHash}`}</div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {p.isSwappable ? 'Swappable' : "Today's post (not swappable)"}
                      </div>
                    </CardContent>
                  </Card>
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
    </Card>
  );
};

export default ProfileView;
