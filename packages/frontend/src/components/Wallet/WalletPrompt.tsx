import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, Sparkles, ShoppingCart, MessageCircle, User, Heart, Tag } from 'lucide-react';
import { useGuestBrowsing } from '@/context/GuestBrowsingContext';
import UnifiedWalletModal from './UnifiedWalletModal';

const WalletPrompt: React.FC = () => {
  const { walletPrompt, hideWalletPrompt } = useGuestBrowsing();
  const [showWalletSelection, setShowWalletSelection] = useState(false);

  const getActionDetails = (action: string) => {
    const actionMap: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
      create_post: {
        title: 'Create Post',
        description: 'Connect your wallet to create and mint your daily NFT posts',
        icon: <Sparkles className="w-6 h-6 text-purple-500" />
      },
      buy_nft: {
        title: 'Buy NFT',
        description: 'Connect your wallet to purchase NFTs from the marketplace',
        icon: <ShoppingCart className="w-6 h-6 text-green-500" />
      },
      sell_nft: {
        title: 'Sell NFT',
        description: 'Connect your wallet to list your NFTs for sale',
        icon: <Tag className="w-6 h-6 text-blue-500" />
      },
      cancel_sell: {
        title: 'Cancel Sale',
        description: 'Connect your wallet to cancel your NFT listing',
        icon: <Tag className="w-6 h-6 text-orange-500" />
      },
      start_chat: {
        title: 'Start Chat',
        description: 'Connect your wallet to chat with other users',
        icon: <MessageCircle className="w-6 h-6 text-blue-500" />
      },
      access_profile: {
        title: 'Access Profile',
        description: 'Connect your wallet to view and manage your profile',
        icon: <User className="w-6 h-6 text-indigo-500" />
      },
      like_post: {
        title: 'Like Post',
        description: 'Connect your wallet to like posts and interact with the community',
        icon: <Heart className="w-6 h-6 text-red-500" />
      },
      wallet_connect: {
        title: 'Connect Wallet',
        description: 'Connect your wallet to access all features of the platform',
        icon: <Wallet className="w-6 h-6 text-blue-500" />
      }
    };

    return actionMap[action] || {
      title: 'Connect Wallet',
      description: 'Connect your wallet to access this feature',
      icon: <Wallet className="w-6 h-6 text-gray-500" />
    };
  };

  const actionDetails = getActionDetails(walletPrompt.action);

  const handleConnectWallet = () => {
    setShowWalletSelection(true);
  };

  const handleWalletConnected = useCallback(() => {
    setShowWalletSelection(false);
    // Call the success callback if provided
    if (walletPrompt.onSuccess) {
      walletPrompt.onSuccess();
    }
    hideWalletPrompt();
  }, [walletPrompt, hideWalletPrompt]);

  const handleCloseWalletSelection = useCallback(() => {
    setShowWalletSelection(false);
  }, []);

  return (
    <>
      <Dialog open={walletPrompt.isVisible} onOpenChange={hideWalletPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                {actionDetails.icon}
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              {actionDetails.title}
            </DialogTitle>
            <DialogDescription className="text-center">
              {actionDetails.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-black">Why connect a wallet?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Own your NFTs and posts on the blockchain</li>
                <li>• Participate in the marketplace</li>
                <li>• Chat and interact with other users</li>
                <li>• Access your profile and settings</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleConnectWallet}
                className="w-full bg-primary"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={hideWalletPrompt}
                className="w-full"
              >
                Continue Browsing
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                You can continue browsing without a wallet, but some features will be limited.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnifiedWalletModal
        isOpen={showWalletSelection}
        onClose={handleCloseWalletSelection}
        onSuccess={handleWalletConnected}
        title="Connect Wallet"
        description="Connect your wallet to continue with this action"
      />
    </>
  );
};

export default WalletPrompt;