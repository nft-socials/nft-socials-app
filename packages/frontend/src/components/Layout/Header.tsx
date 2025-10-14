import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Plus, Gem } from 'lucide-react';
import { useAccount, useDisconnect } from '@starknet-react/core';
import { useGuestBrowsing } from '@/context/GuestBrowsingContext';
import WalletSelectionModal from '@/components/Wallet/WalletSelectionModal';

interface HeaderProps {
  onCreatePost: () => void;
  canCreatePost: boolean;
}

const Header: React.FC<HeaderProps> = ({ onCreatePost, canCreatePost }) => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { isGuestMode } = useGuestBrowsing();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const isConnected = !!address;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  const handleDisconnectWallet = () => {
    disconnect();
  };

  return (
    <Card className="border-border bg-card animate-fade-in rounded-t-xl fixed mx-auto max-w-[875px] top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center animate-pulse-glow">
            <Gem className="w-5 h-5 text-primary-foreground animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground py-3">
              OnePostNft
            </h1>
            <Badge variant="secondary" className="hidden md:block text-xs bg-accent text-accent-foreground">
              Powered by Starknet
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && canCreatePost && (
            <Button
              onClick={onCreatePost}
              className="hidden md:flex bg-primary hover:bg-primary/90 animate-scale-in"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          )}

          {/* Mobile wallet connect button */}
          <div className="block md:hidden">
            {isConnected ? (
              <Badge variant="outline" className="text-xs px-2 py-1">
                {truncateAddress(address!)}
              </Badge>
            ) : (
              <Button
                onClick={handleConnectWallet}
                size="sm"
                className="bg-primary hover:bg-primary/90 animate-scale-in text-xs px-3 py-1"
              >
                <Wallet className="w-3 h-3 mr-1" />
                Connect
              </Button>
            )}
          </div>

          {/* Desktop wallet section */}
          <div className="hidden md:block">
            {isConnected ? (
              <div className="flex items-center gap-3 animate-slide-up">
                <Badge variant="outline" className="text-sm">
                  {truncateAddress(address!)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectWallet}
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnectWallet}
                className="bg-primary hover:bg-primary/90 animate-scale-in"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>

      <WalletSelectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={() => setShowWalletModal(false)}
      />
    </Card>
  );
};

export default Header;