import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, ExternalLink, Smartphone, Download, AlertCircle } from 'lucide-react';
import { useConnect, useAccount } from '@starknet-react/core';
import { useXverseWallet } from '@/hooks/useXverseWallet';
import { useAnyWallet } from '@/hooks/useAnyWallet';
import { toast } from 'sonner';

interface UnifiedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  downloadUrl?: string;
  isInstalled?: boolean;
  type: 'starknet' | 'bitcoin';
}

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const getWalletIcon = (walletId: string): string => {
  const icons: Record<string, string> = {
    'argentx': '🦊',
    'argent': '🦊',
    'braavos': '🛡️',
    'xverse': '🅧',
    'okx': '⭕',
    'bitget': '🟡'
  };
  
  const key = walletId.toLowerCase();
  return icons[key] || '💼';
};

const UnifiedWalletModal: React.FC<UnifiedWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Connect Wallet",
  description
}) => {
  const { connect, connectors } = useConnect();
  const { status } = useAccount();
  const { isConnected } = useAnyWallet();
  const { 
    connect: connectXverse, 
    isConnecting: isXverseConnecting, 
    isConnected: isXverseConnected 
  } = useXverseWallet();
  
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [toastShown, setToastShown] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Close modal and call success callback when any wallet connects
  useEffect(() => {
    if ((status === 'connected' || isXverseConnected) && connectingWalletId && !toastShown) {
      setToastShown(true);
      toast.success('🎉 Wallet connected successfully!');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      setConnectingWalletId(null);
    }
  }, [status, isXverseConnected, connectingWalletId, onSuccess, onClose, toastShown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConnectingWalletId(null);
      setToastShown(false);
    }
  }, [isOpen]);

  const walletOptions: WalletOption[] = [
    {
      id: 'argentX',
      name: 'Argent X',
      icon: '🦊',
      description: 'Most popular Starknet wallet',
      downloadUrl: 'https://www.argent.xyz/argent-x/',
      isInstalled: typeof window !== 'undefined' && !!(window as any).starknet_argentX,
      type: 'starknet'
    },
    {
      id: 'braavos',
      name: 'Braavos',
      icon: '🛡️',
      description: 'Advanced Starknet wallet',
      downloadUrl: 'https://braavos.app/',
      isInstalled: typeof window !== 'undefined' && !!(window as any).starknet_braavos,
      type: 'starknet'
    },
    {
      id: 'xverse',
      name: 'Xverse',
      icon: '🅧',
      description: 'Bitcoin wallet',
      downloadUrl: 'https://www.xverse.app/',
      isInstalled: typeof window !== 'undefined' && (
        !!(window as any).XverseProviders ||
        !!(window as any).BitcoinProvider
      ),
      type: 'bitcoin'
    }
  ];

  const handleWalletConnect = async (walletId: string) => {
    try {
      setToastShown(false);
      setConnectingWalletId(walletId);

      // Handle Xverse wallet separately
      if (walletId === 'xverse') {
        await connectXverse();
        return;
      }

      // Handle Starknet wallets
      const connector = connectors.find(c =>
        c.id.toLowerCase().includes(walletId.toLowerCase()) ||
        c.name.toLowerCase().includes(walletId.toLowerCase())
      );

      if (!connector) {
        toast.error('❌ Wallet not found. Please install the wallet first.');
        setConnectingWalletId(null);
        return;
      }

      await connect({ connector });
    } catch (error: any) {
      console.error('Wallet connection error:', error);

      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        toast.error('❌ Connection cancelled by user');
      } else {
        toast.error(`❌ Failed to connect: ${error.message || 'Please try again'}`);
      }
      setConnectingWalletId(null);
    }
  };

  const handleInstallWallet = (downloadUrl: string) => {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const renderWalletCard = (wallet: WalletOption) => {
    const isInstalled = wallet.isInstalled;
    const isCurrentlyConnecting = connectingWalletId === wallet.id;
    const isConnecting = isCurrentlyConnecting || (wallet.id === 'xverse' && isXverseConnecting);

    return (
      <Card key={wallet.id} className="p-4 hover:border-primary/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{wallet.icon}</span>
            <div>
              <h3 className="font-semibold">{wallet.name}</h3>
              <p className="text-xs text-muted-foreground">
                {wallet.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            {isInstalled || isMobile ? (
              <Button
                onClick={() => handleWalletConnect(wallet.id)}
                disabled={isConnecting || !!connectingWalletId}
                size="sm"
                className="min-w-[80px]"
              >
                {isConnecting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                size="sm"
                className="min-w-[80px]"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // Group wallets by type
  const starknetWallets = walletOptions.filter(w => w.type === 'starknet');
  const bitcoinWallets = walletOptions.filter(w => w.type === 'bitcoin');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description || (isMobile 
              ? 'Choose a wallet to connect. If you don\'t have a wallet installed, tap "Install" to get started.'
              : 'Choose a wallet to connect to the platform.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Starknet Wallets */}
          {starknetWallets.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Starknet Wallets</p>
              <div className="space-y-2">
                {starknetWallets.map(renderWalletCard)}
              </div>
            </div>
          )}

          {/* Bitcoin Wallets */}
          {bitcoinWallets.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Bitcoin Wallets</p>
              <div className="space-y-2">
                {bitcoinWallets.map(renderWalletCard)}
              </div>
            </div>
          )}

          {/* No wallets found message */}
          {starknetWallets.length === 0 && bitcoinWallets.length === 0 && (
            <Card className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
              <h3 className="font-semibold mb-2">No Wallet Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isMobile 
                  ? 'You need to install a wallet app to continue.'
                  : 'You need to install a wallet extension to continue.'
                }
              </p>
            </Card>
          )}

          {/* Mobile help text */}
          {isMobile && connectingWalletId && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Waiting for wallet app...
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Please approve the connection request in your wallet app.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="text-center pt-2">
            <Button variant="ghost" onClick={onClose} className="text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedWalletModal;
