import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Gem, Shield, Zap } from 'lucide-react';
import { useStarknetWallet } from '@/hooks/useStarknetWallet';
import { useXverseWallet } from '@/hooks/useXverseWallet';
import MobileWalletModal from './MobileWalletModal';

const WalletPage: React.FC = () => {
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

  const anyWalletConnected = isConnected || isXverseConnected;

  if (anyWalletConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Starknet Wallet Card */}
        {isConnected && address && (
          <Card className="p-6 bg-card border-border">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto animate-pulse-glow">
                <Wallet className="w-8 h-8 text-primary-foreground" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Starknet Wallet Connected</h2>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {truncateAddress(address)}
                </Badge>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Shield className="w-6 h-6 mx-auto mb-2 text-success" />
                <div className="text-sm font-medium">Secure</div>
                <div className="text-xs text-muted-foreground">Starknet Protected</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Zap className="w-6 h-6 mx-auto mb-2 text-warning" />
                <div className="text-sm font-medium">Fast</div>
                <div className="text-xs text-muted-foreground">L2 Scaling</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Gem className="w-6 h-6 mx-auto mb-2 text-primary animate-pulse" />
                <div className="text-sm font-medium">Ready</div>
                <div className="text-xs text-muted-foreground">Create NFTs</div>
              </div>
            </div>

              <Button
                onClick={disconnectWallet}
                variant="outline"
                className="w-full mt-6 hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Starknet Wallet
              </Button>
            </div>
          </Card>
        )}

        {/* Xverse Wallet Card */}
        {isXverseConnected && xverseAddress && (
          <Card className="p-6 bg-card border-border border-orange-500/30">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto animate-pulse-glow">
                <span className="text-4xl">🅧</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Xverse Wallet Connected</h2>
                <Badge variant="outline" className="text-lg px-4 py-2 bg-orange-500/10 border-orange-500/50">
                  {truncateAddress(xverseAddress)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-sm font-medium">Bitcoin</div>
                  <div className="text-xs text-muted-foreground">Secure Wallet</div>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Gem className="w-6 h-6 mx-auto mb-2 text-orange-500 animate-pulse" />
                  <div className="text-sm font-medium">Ready</div>
                  <div className="text-xs text-muted-foreground">Bitcoin NFTs</div>
                </div>
              </div>

              <Button
                onClick={disconnectXverse}
                variant="outline"
                className="w-full mt-6 hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Xverse Wallet
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold mb-4">Wallet Features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Gem className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div>
                <div className="font-medium">Create NFT Posts</div>
                <div className="text-sm text-muted-foreground">Turn your daily moments into tradeable NFTs</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="font-medium">Trade & Swap</div>
                <div className="text-sm text-muted-foreground">Exchange NFTs with other users</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-success" />
              </div>
              <div>
                <div className="font-medium">Secure Ownership</div>
                <div className="text-sm text-muted-foreground">Your NFTs are secured on Starknet</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-card border-border text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Connect your Starknet wallet to start creating and trading NFTs
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <Button
              onClick={() => setShowWalletModal(true)}
              disabled={isConnecting}
              className="w-full bg-primary hover:bg-primary/90 animate-scale-in"
              size="lg"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold mb-4">Why Connect?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
              <Gem className="w-3 h-3 text-primary animate-pulse" />
            </div>
            <div>
              <div className="font-medium">Create Daily NFTs</div>
              <div className="text-sm text-muted-foreground">
                Transform your daily posts into unique, tradeable NFTs on Starknet
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-1">
              <Wallet className="w-3 h-3 text-accent" />
            </div>
            <div>
              <div className="font-medium">Trade & Earn</div>
              <div className="text-sm text-muted-foreground">
                Buy, sell, and swap NFTs with other users in the marketplace
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-1">
              <Shield className="w-3 h-3 text-success" />
            </div>
            <div>
              <div className="font-medium">Secure & Fast</div>
              <div className="text-sm text-muted-foreground">
                Powered by Starknet's secure and scalable Layer 2 technology
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-muted/50 border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>Supported wallets: Argent, Braavos (Starknet) | Xverse (Bitcoin)</p>
          <p className="mt-1">Make sure you have a wallet installed</p>
        </div>
      </Card>

      {/* Mobile-friendly wallet connection modal */}
      <MobileWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={connectWallet}
        availableConnectors={availableConnectors}
        isConnecting={isConnecting}
      />
    </div>
  );
};

export default WalletPage;
