import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Smartphone, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { useConnect, useAccount } from '@starknet-react/core';
import { toast } from 'sonner';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  downloadUrl?: string;
  isInstalled?: boolean;
  isMobile?: boolean;
}

const WalletSelectionModal: React.FC<WalletSelectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { connect, connectors } = useConnect();
  const { address } = useAccount();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (address) {
      onSuccess?.();
      onClose();
    }
  }, [address]);

  const walletOptions: WalletOption[] = [
    {
      id: 'argentX',
      name: 'Argent X',
      icon: '🦊', // You can replace with actual logo
      description: 'The most popular Starknet wallet',
      downloadUrl: 'https://chrome.google.com/webstore/detail/argent-x/dlcobpjiigpikoobohmabehhmhfoodbb',
      isInstalled: typeof window !== 'undefined' && !!(window as any).starknet_argentX,
    },
    {
      id: 'braavos',
      name: 'Braavos',
      icon: '🛡️', // You can replace with actual logo
      description: 'Advanced Starknet wallet with enhanced security',
      downloadUrl: 'https://chrome.google.com/webstore/detail/braavos-wallet/jnlgamecbpmbajjfhmmmlhejkemejdma',
      isInstalled: typeof window !== 'undefined' && !!(window as any).starknet_braavos,
    },
    {
      id: 'xverse',
      name: 'Xverse',
      icon: '🔶', // You can replace with actual logo
      description: 'Bitcoin-native wallet with Starknet support',
      downloadUrl: 'https://chrome.google.com/webstore/detail/xverse-wallet/idnnbdplmphpflfnlkomgpfbpcgelopg',
      isInstalled: typeof window !== 'undefined' && (
        !!(window as any).XverseProviders ||
        !!(window as any).starknet_xverse ||
        (Array.isArray((window as any).starknet) &&
         (window as any).starknet.some((provider: any) =>
           provider.id === "xverse" || provider.name?.toLowerCase().includes("xverse")
         ))
      ),
    }
  ];

  const handleWalletConnect = async (walletId: string) => {
    try {
      setIsConnecting(walletId);

      const connector = connectors.find(c =>
        c.id.toLowerCase().includes(walletId.toLowerCase()) ||
        c.name.toLowerCase().includes(walletId.toLowerCase())
      );

      if (!connector) {
        toast.error('Wallet connector not found');
        return;
      }

      await connect({ connector });
      toast.success(`Connected to ${walletId}`);
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(`Failed to connect to ${walletId}: ${error.message || 'Unknown error'}`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleInstallWallet = (downloadUrl: string) => {
    if (isMobile) {
      // For mobile, try to open the app store or direct download
      window.open(downloadUrl, '_blank');
    } else {
      // For desktop, open browser extension store
      window.open(downloadUrl, '_blank');
    }
  };

  const renderWalletCard = (wallet: WalletOption) => {
    const isInstalled = wallet.isInstalled;
    const isLoading = isConnecting === wallet.id;

    return (
      <Card key={wallet.id} className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{wallet.icon}</div>
              <div>
                <h3 className="font-semibold text-foreground">{wallet.name}</h3>
                <p className="text-sm text-muted-foreground">{wallet.description}</p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              {isInstalled ? (
                <Button
                  onClick={() => handleWalletConnect(wallet.id)}
                  disabled={isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => wallet.downloadUrl && handleInstallWallet(wallet.downloadUrl)}
                  className="min-w-[100px]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
              )}
              
              {!isInstalled && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not installed
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Connect Wallet</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a wallet to connect to the One Post Daily platform
          </p>

          <div className="space-y-3">
            {walletOptions.map(renderWalletCard)}
          </div>

          {isMobile && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <Smartphone className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Mobile Users:</p>
                  <p>Make sure you have the wallet app installed on your device. After installation, return to this page to connect.</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Button variant="ghost" onClick={onClose} className="text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletSelectionModal;
