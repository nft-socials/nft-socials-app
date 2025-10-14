import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Plus,
  User,
  Menu,
  X,
  Gem,
  ArrowUpDown,
  Bell,
  MessageCircle,
  Wallet
} from 'lucide-react';
import { useNavigationSwipeActions } from '@/hooks/useSwipeGestures';
import { useGuestBrowsing } from '@/context/GuestBrowsingContext';
import { useAccount } from '@starknet-react/core';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreatePost?: () => void;
  canCreatePost?: boolean;
  notificationCount?: number;
  chatCount?: number;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  onCreatePost,
  canCreatePost = false,
  notificationCount,
  chatCount,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { showWalletPrompt } = useGuestBrowsing();
  const { isConnected } = useAccount();

  const navigationItems = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'create', label: 'Create', icon: Plus, action: onCreatePost },
    { id: 'more', label: 'More', icon: Menu },
  ];

  const swipeHandlers = useNavigationSwipeActions(
    () => {
      // Previous tab
      const currentIndex = navigationItems.findIndex(item => item.id === activeTab);
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : navigationItems.length - 1;
      onTabChange(navigationItems[previousIndex].id);
    },
    () => {
      // Next tab
      const currentIndex = navigationItems.findIndex(item => item.id === activeTab);
      const nextIndex = currentIndex < navigationItems.length - 1 ? currentIndex + 1 : 0;
      onTabChange(navigationItems[nextIndex].id);
    }
  );

  // Check if current tab is one of the "more" menu items
  const isMoreMenuActive = ['Chats', 'marketplace', 'profile', 'wallet', 'notifications'].includes(activeTab);

  const handleTabClick = (item: { id: string; action?: () => void }) => {
    if (item.action && item.id === 'create') {
      if (canCreatePost) {
        // User is connected and can create post
        item.action();
      } else {
        // User is not connected, show wallet prompt with callback to open create modal
        showWalletPrompt('create_post', () => {
          if (item.action) {
            item.action();
          }
        });
      }
    } else if (item.id === 'more') {
      setIsMenuOpen(true);
    } else {
      onTabChange(item.id);
    }
    if (item.id !== 'more') {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div 
          className="bg-card border-t border-border backdrop-blur-sm"
          {...swipeHandlers}
        >
          <div className="flex items-center justify-around py-2 px-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              // Only one button can be active at a time
              const isActive = item.id === 'feed' ? activeTab === 'feed'
                             : item.id === 'more' ? isMoreMenuActive
                             : false;
              const isCreateButton = item.id === 'create';

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTabClick(item)}
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                    isActive && !isCreateButton
                      ? 'text-white bg-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  } ${
                    isCreateButton
                      ? 'text-primary hover:bg-primary/90'
                      : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isCreateButton ? 'animate-pulse-glow' : ''}`} />
                  <span className="text-xs font-medium">{item.label}</span>                 
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden">
        <div className="flex items-center justify-center gap-2 p-4 bg-card rounded-lg border border-border">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCreateButton = item.id === 'create';
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => handleTabClick(item)}
                className={`flex items-center gap-2 ${
                  isCreateButton
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 animate-scale-in'
                    : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${isCreateButton ? 'animate-pulse-glow' : ''}`} />
                {item.label}
                {isActive && (
                  <Gem className="w-3 h-3 animate-pulse" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-lg animate-slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Menu</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {/* Connect Wallet Button for non-connected users */}
                {!isConnected && (
                  <Button
                    variant="default"
                    onClick={() => showWalletPrompt('wallet_connect')}
                    className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-glow"
                  >
                    <Wallet className="w-4 h-4 mr-3" />
                    Connect Wallet
                  </Button>
                )}

                {/* Chats */}
                <Button
                  variant="ghost"
                  onClick={() => handleTabClick({ id: 'Chats' })}
                  className="w-full justify-start"
                >
                  <MessageCircle className="w-4 h-4 mr-3" />
                  Chats
                  {chatCount > 0 && (
                    <Badge className="ml-auto bg-green-500 text-white">
                      {chatCount > 99 ? '99+' : chatCount}
                    </Badge>
                  )}
                </Button>

                {/* Marketplace */}
                <Button
                  variant="ghost"
                  onClick={() => handleTabClick({ id: 'marketplace' })}
                  className="w-full justify-start"
                >
                  <ArrowUpDown className="w-4 h-4 mr-3" />
                  Marketplace
                </Button>

                {/* Profile */}
                <Button
                  variant="ghost"
                  onClick={() => handleTabClick({ id: 'profile' })}
                  className="w-full justify-start"
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </Button>

                {/* Wallet Connection */}
                <Button
                  variant="ghost"
                  onClick={() => handleTabClick({ id: 'wallet' })}
                  className="w-full justify-start"
                >
                  <Gem className="w-4 h-4 mr-3" />
                  Wallet
                </Button>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  onClick={() => handleTabClick({ id: 'notifications' })}
                  className="w-full justify-start"
                >
                  <Bell className="w-4 h-4 mr-3" />
                  Notifications
                  {notificationCount > 0 && (
                    <Badge className="ml-auto bg-sky-500 text-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Badge>
                  )}
                </Button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground text-center">
                  OnePostNft v1.0 • Powered by Starknet
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding for mobile navigation */}
      <div className="h-20 md:hidden" />
    </>
  );
};

export default MobileNavigation;
