import React, { useState } from 'react';
import { WalletProvider } from '@/context/WalletContext';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { useAccount } from '@starknet-react/core';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Layout/Header';
import Navigation from '@/components/Layout/Navigation';
import CreatePostModal from '@/components/Post/CreatePostModal';
import CommunityFeed from '@/components/Feed/CommunityFeed';
import BrowseSwaps from '@/components/Swap/BrowseSwaps';
import ProfileView from '@/components/Profile/ProfileView';

const IndexContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'browse' | 'profile'>('feed');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isConnected } = useAccount();
  const { state, refreshFeed } = useAppContext();

  const handleCreatePost = () => {
    if (!isConnected) return;
    setShowCreateModal(true);
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          <Header 
            onCreatePost={handleCreatePost}
            canCreatePost={isConnected && !state.hasPostedToday}
          />
          
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          <main>
            {activeTab === 'feed' && (
              <CommunityFeed
                isLoading={state.isLoading}
                posts={state.posts}
                onRefresh={refreshFeed}
              />
            )}
            {activeTab === 'browse' && <BrowseSwaps />}
            {activeTab === 'profile' && <ProfileView isConnected={isConnected} />}
          </main>
        </div>
      </div>

      <CreatePostModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      
      <Toaster />
    </div>
  );
};

const Index = () => {
  return (
    <WalletProvider>
      <AppProvider>
        <IndexContent />
      </AppProvider>
    </WalletProvider>
  );
};

export default Index;
