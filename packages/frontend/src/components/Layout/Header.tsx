import React from 'react';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, LogOut, Plus } from 'lucide-react';

interface HeaderProps {
  onCreatePost: () => void;
  canCreatePost: boolean;
}

const Header: React.FC<HeaderProps> = ({ onCreatePost, canCreatePost }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">1</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            One Post Daily
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && canCreatePost && (
            <Button 
              onClick={onCreatePost}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          )}
          
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {truncateAddress(address!)}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => disconnect()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => connect({ connector: connectors[0] })}
              className="bg-primary hover:bg-primary/90"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Header;