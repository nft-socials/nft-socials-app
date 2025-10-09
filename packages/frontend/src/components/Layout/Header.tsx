import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Plus, Gem } from 'lucide-react';
import { useStarknetWallet } from '@/hooks/useStarknetWallet';

interface HeaderProps {
  onCreatePost: () => void;
  canCreatePost: boolean;
}

const Header: React.FC<HeaderProps> = ({ onCreatePost, canCreatePost }) => {
  const { isConnected, address, connectWallet, disconnectWallet, isConnecting } = useStarknetWallet();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

          <div className="hidden md:block">
            {isConnected ? (
              <div className="flex items-center gap-3 animate-slide-up">
                <Badge variant="outline" className="text-sm">
                  {truncateAddress(address!)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectWallet}
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => connectWallet()}
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
    </Card>
  );
};

export default Header;