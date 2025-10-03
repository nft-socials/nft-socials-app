import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import PostCard from '@/components/Feed/PostCard';
import type { Post } from '@/context/AppContext';

interface CommunityFeedProps {
  isLoading: boolean;
  posts: Post[];
  onRefresh: () => void;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({ isLoading, posts, onRefresh }) => {
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-card/50 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Community Feed</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No posts yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.tokenId} post={post} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CommunityFeed;
