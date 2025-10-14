import React, { useState, useEffect, useCallback } from 'react';
import { WalletProvider } from '@/context/WalletContext';
import { AppProvider, useAppContext } from '@/context/AppContext';
import '@/styles/content-protection.css';
import { useAccount } from '@starknet-react/core';
import { Toaster, toast } from '@/components/ui/sonner';
import Header from '@/components/Layout/Header';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import DesktopNavigation from '@/components/Layout/DesktopNavigation';
import CreatePostModal from '@/components/Post/CreatePostModal';
import CommunityFeed from '@/components/Feed/CommunityFeed';
import BrowseSwaps from '@/components/Swap/BrowseSwaps';
import ProfileView from '@/components/Profile/ProfileView';
import MarketplaceGrid from '@/components/Marketplace/MarketplaceGrid';
import ChatsPage from '@/components/Chat/ChatsPage';
import WalletPage from '@/components/Wallet/WalletPage';
import UserPosts from '@/components/Profile/UserPosts';
import NotificationDropdown from '@/components/Notifications/NotificationDropdown';
import NotificationsPage from '@/components/Notifications/NotificationsPage';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import SplashScreen from '@/components/Layout/SplashScreen';
import DashboardInfo from './DashboardInfo';

const IndexContent: React.FC = () => {
  // ALL STATE HOOKS FIRST
  const [activeTab, setActiveTab] = useState<'feed' | 'Chats' | 'profile' | 'marketplace' | 'swaps' | 'user-nfts' | 'wallet' | 'notifications'>('feed');
  const [showSplash, setShowSplash] = useState(true);
  const [showDashboardInfo, setShowDashboardInfo] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ALL CONTEXT/CUSTOM HOOKS NEXT
  const { counts, refreshCounts } = useNotificationCounts();
  const { isConnected } = useAccount();
  const { state, refreshFeed } = useAppContext();

  // CALLBACK FUNCTIONS
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as typeof activeTab);
  };

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const handleDashboardInfoClose = useCallback(() => {
    setShowDashboardInfo(false);
    setShowSplash(false);
  }, []);

  const handleCreatePost = useCallback(() => {
    // Always open modal - it will show connect wallet UI if not connected
    setShowCreateModal(true);
  }, []);

  const handlePostSuccess = useCallback(async () => {
    // Redirect to home feed after successful post
    setActiveTab('feed');

    // Show confirming message
    const loadingToast = toast.loading('🔄 Confirming post on blockchain...');

    // Wait a moment then refresh to fetch new post
    setTimeout(async () => {
      // Dismiss the first loading toast
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      const fetchingToast = toast.loading('📡 Fetching latest posts...');

      // Refresh the feed to show the new post
      await refreshFeed();

      // Dismiss the fetching toast
      if (fetchingToast) {
        toast.dismiss(fetchingToast);
      }

      toast.success('🎉 Post confirmed and visible in feed!');
    }, 2000);
  }, [refreshFeed]);

  // EFFECTS
  // Show dashboard info on first mount
  useEffect(() => {
    setShowDashboardInfo(true);
  }, []);

  // Global content protection
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Prevent common copy/save shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'c' || e.key === 'a' || e.key === 's' || e.key === 'p' || e.key === 'v')
      ) {
        e.preventDefault();
        return false;
      }
      // Prevent F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+Shift+I (Developer Tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        return false;
      }
    };

    const handleGlobalSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.nft-protected')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleGlobalContextMenu);
    document.addEventListener('keydown', handleGlobalKeyDown);
    document.addEventListener('selectstart', handleGlobalSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleGlobalContextMenu);
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('selectstart', handleGlobalSelectStart);
    };
  }, []);

  // RENDER LOGIC
  // Show splash screen on every visit
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={3000} />;
  }

  // Show dashboard info on first visit only
  if (showDashboardInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <DashboardInfo onGetStarted={handleDashboardInfoClose} />
        </div>
        <Toaster />
      </div>
    );
  }

  // Show main app with community feed
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header
        onCreatePost={handleCreatePost}
        canCreatePost={isConnected && !state.hasPostedToday}
      />

      <DesktopNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        notificationCount={counts.notifications > 0 ? counts.notifications : undefined}
        chatCount={counts.chats > 0 ? counts.chats : undefined}
      />

      <MobileNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCreatePost={handleCreatePost}
        canCreatePost={isConnected && !state.hasPostedToday}
        notificationCount={counts.notifications > 0 ? counts.notifications : undefined}
        chatCount={counts.chats > 0 ? counts.chats : undefined}
      />

      <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
        <main className="animate-fade-in pb-24 md:pb-4 px-1 sm:px-0 pt-24 md:pt-44">
            {activeTab === 'feed' && (
              <CommunityFeed
                isLoading={state.isLoading}
                posts={state.posts}
                onRefresh={refreshFeed}
                onNavigate={handleTabChange}
              />
            )}
            {activeTab === 'Chats' && <ChatsPage onChatCountChange={refreshCounts} />}
            {activeTab === 'marketplace' && <MarketplaceGrid onNavigate={handleTabChange} />}
            {activeTab === 'swaps' && <BrowseSwaps />}
            {activeTab === 'profile' && <ProfileView isConnected={isConnected} onNavigate={handleTabChange} />}
            {activeTab === 'user-nfts' && <UserPosts />}
            {activeTab === 'wallet' && <WalletPage />}
            {activeTab === 'notifications' && (
              <NotificationsPage
                onNavigate={handleTabChange}
                onNotificationCountChange={refreshCounts}
              />
            )}
          </main>
        </div>

        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostSuccess={handlePostSuccess}
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
