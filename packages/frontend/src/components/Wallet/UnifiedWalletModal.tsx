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

// Mobile deep link URLs for wallet apps
const MOBILE_WALLET_DEEP_LINKS = {
  argentX: {
    ios: 'https://apps.apple.com/app/argent/id1358741926',
    android: 'https://play.google.com/store/apps/details?id=im.argent.contractwalletclient',
    deepLink: 'argent://app',
    webWallet: 'https://web.argent.xyz'
  },
  braavos: {
    ios: 'https://apps.apple.com/app/braavos-smart-wallet/id1566384677',
    android: 'https://play.google.com/store/apps/details?id=com.braavos',
    deepLink: 'braavos://app',
    webWallet: 'https://braavos.app'
  },
  xverse: {
    ios: 'https://apps.apple.com/app/xverse-wallet/id1552167538',
    android: 'https://play.google.com/store/apps/details?id=io.xverse.wallet',
    deepLink: 'xverse://app',
    webWallet: 'https://wallet.xverse.app'
  }
};

// Check if mobile wallet app is likely installed
const checkMobileWalletInstalled = async (walletId: string): Promise<boolean> => {
  if (!isMobileDevice()) return false;

  const deepLink = MOBILE_WALLET_DEEP_LINKS[walletId as keyof typeof MOBILE_WALLET_DEEP_LINKS]?.deepLink;
  if (!deepLink) return false;

  // Try to detect if the app can handle the deep link
  try {
    // Create a hidden iframe to test the deep link
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);

    return true; // Assume installed if no error
  } catch {
    return false;
  }
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
      description: isMobile ? 'Starknet wallet app' : 'Most popular Starknet wallet',
      downloadUrl: isMobile
        ? (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
           ? MOBILE_WALLET_DEEP_LINKS.argentX.ios
           : MOBILE_WALLET_DEEP_LINKS.argentX.android)
        : 'https://www.argent.xyz/argent-x/',
      isInstalled: isMobile
        ? true // Always show as available on mobile
        : (typeof window !== 'undefined' && !!(window as any).starknet_argentX),
      type: 'starknet'
    },
    {
      id: 'braavos',
      name: 'Braavos',
      icon: '🛡️',
      description: isMobile ? 'Advanced Starknet wallet app' : 'Advanced Starknet wallet',
      downloadUrl: isMobile
        ? (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
           ? MOBILE_WALLET_DEEP_LINKS.braavos.ios
           : MOBILE_WALLET_DEEP_LINKS.braavos.android)
        : 'https://braavos.app/',
      isInstalled: isMobile
        ? true // Always show as available on mobile
        : (typeof window !== 'undefined' && !!(window as any).starknet_braavos),
      type: 'starknet'
    },
    {
      id: 'xverse',
      name: 'Xverse',
      icon: '🅧',
      description: isMobile ? 'Bitcoin wallet app' : 'Bitcoin wallet',
      downloadUrl: isMobile
        ? (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
           ? MOBILE_WALLET_DEEP_LINKS.xverse.ios
           : MOBILE_WALLET_DEEP_LINKS.xverse.android)
        : 'https://www.xverse.app/',
      isInstalled: isMobile
        ? true // Always show as available on mobile
        : (typeof window !== 'undefined' && (
            !!(window as any).XverseProviders ||
            !!(window as any).BitcoinProvider
          )),
      type: 'bitcoin'
    }
  ];

  const handleWalletConnect = async (walletId: string) => {
    try {
      setToastShown(false);
      setConnectingWalletId(walletId);

      // Handle mobile wallet connections
      if (isMobile) {
        await handleMobileWalletConnect(walletId);
        return;
      }

      // Handle Xverse wallet separately for desktop
      if (walletId === 'xverse') {
        await connectXverse();
        return;
      }

      // Handle Starknet wallets for desktop
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

  const handleMobileWalletConnect = async (walletId: string) => {
    const walletConfig = MOBILE_WALLET_DEEP_LINKS[walletId as keyof typeof MOBILE_WALLET_DEEP_LINKS];

    if (!walletConfig) {
      toast.error('❌ Wallet not supported on mobile');
      setConnectingWalletId(null);
      return;
    }

    try {
      // For Xverse, use the existing hook
      if (walletId === 'xverse') {
        await connectXverse();
        return;
      }

      // For Starknet wallets (Argent, Braavos), try different connection methods
      if (walletId === 'argentX' || walletId === 'braavos') {
        // First, try to use web wallet if available
        if (typeof window !== 'undefined' && (window as any).starknet) {
          const starknetWallets = (window as any).starknet;
          let targetWallet = null;

          if (Array.isArray(starknetWallets)) {
            targetWallet = starknetWallets.find((wallet: any) =>
              wallet.id?.toLowerCase().includes(walletId.toLowerCase()) ||
              wallet.name?.toLowerCase().includes(walletId.toLowerCase())
            );
          } else if (starknetWallets.id?.toLowerCase().includes(walletId.toLowerCase())) {
            targetWallet = starknetWallets;
          }

          if (targetWallet) {
            // Try to connect using the mobile wallet
            await targetWallet.enable();
            toast.success(`🎉 ${walletId === 'argentX' ? 'Argent' : 'Braavos'} connected!`);
            return;
          }
        }

        // If web wallet not available, try deep link
        const deepLink = walletConfig.deepLink;
        const webWallet = walletConfig.webWallet;

        // Show instructions to user
        toast.loading(`Opening ${walletId === 'argentX' ? 'Argent' : 'Braavos'} app...`, {
          duration: 5000,
          description: 'If the app doesn\'t open, please open it manually and approve the connection.'
        });

        // Try deep link first
        try {
          window.location.href = deepLink;

          // Fallback to web wallet after a delay
          setTimeout(() => {
            if (document.hidden) return; // User likely switched to wallet app
            window.open(webWallet, '_blank');
          }, 2000);

        } catch (error) {
          // Fallback to web wallet
          window.open(webWallet, '_blank');
        }

        // Set a timeout to reset connecting state
        setTimeout(() => {
          setConnectingWalletId(null);
          toast.dismiss();
          toast.info('💡 Please approve the connection in your wallet app, then refresh this page.');
        }, 10000);
      }

    } catch (error: any) {
      console.error('Mobile wallet connection error:', error);
      toast.error(`❌ Failed to connect: ${error.message || 'Please try again'}`);
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
                    {isMobile ? 'Open App' : 'Connect'}
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

          {/* Mobile instructions */}
          {isMobile && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    📱 Mobile Wallet Connection
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    {connectingWalletId
                      ? 'Opening wallet app... Please approve the connection request.'
                      : 'Tap "Open App" to connect your wallet. Make sure you have the wallet app installed.'
                    }
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
