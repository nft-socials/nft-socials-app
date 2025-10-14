import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Plus } from 'lucide-react';
import { useStarknetWallet } from '@/hooks/useStarknetWallet';
import { useXverseWallet } from '@/hooks/useXverseWallet';
import MobileWalletModal from '../Wallet/MobileWalletModal';
import onePostNftLogo from '@/Images/onepostnft_image.png';

interface HeaderProps {
  onCreatePost: () => void;
  canCreatePost: boolean;
}

const Header: React.FC<HeaderProps> = ({ onCreatePost, canCreatePost }) => {
  const { isConnected, address, connectWallet, disconnectWallet, isConnecting, availableConnectors } = useStarknetWallet();
  const {
    isConnected: isXverseConnected,
    address: xverseAddress,
    disconnect: disconnectXverse
  } = useXverseWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Check if any wallet is connected
  const anyWalletConnected = isConnected || isXverseConnected;

  return (
    <Card className="border-border bg-card animate-fade-in rounded-t-xl fixed mx-auto max-w-[875px] top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center animate-pulse-glow">
            <img
              src={onePostNftLogo}
              alt="OnePostNft Logo"
              className="w-full h-full object-cover"
            />
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
          <Button
            onClick={onCreatePost}
            className="hidden md:flex bg-primary hover:bg-primary/90 animate-scale-in"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>

          <div className="hidden md:block">
            {anyWalletConnected ? (
              <div className="flex items-center gap-2 animate-slide-up">
                {/* Starknet Wallet */}
                {isConnected && address && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      <span className="text-xs text-muted-foreground mr-1">STK:</span>
                      {truncateAddress(address)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectWallet}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Xverse Wallet */}
                {isXverseConnected && xverseAddress && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm bg-orange-500/10 border-orange-500/50">
                      <span className="text-xs text-muted-foreground mr-1">🅧</span>
                      {truncateAddress(xverseAddress)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectXverse}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => setShowWalletModal(true)}
                disabled={isConnecting}
                className="bg-primary hover:bg-primary/90 animate-scale-in"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-friendly wallet connection modal */}
      <MobileWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={connectWallet}
        availableConnectors={availableConnectors}
        isConnecting={isConnecting}
      />
    </Card>
  );
};

export default Header;