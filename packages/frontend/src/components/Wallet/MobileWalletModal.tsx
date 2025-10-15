import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, ExternalLink, Smartphone, Download, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useXverseWallet } from '@/hooks/useXverseWallet';
import { useAnyWallet } from '@/hooks/useAnyWallet';

interface MobileWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (connectorId?: string) => Promise<void>;
  availableConnectors: any[];
  isConnecting: boolean;
}

// Detect if user is on mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Wallet installation URLs
const WALLET_INSTALL_URLS = {
  argent: {
    ios: 'https://apps.apple.com/app/argent-x/id1588763738',
    android: 'https://play.google.com/store/apps/details?id=im.argent.contractwalletclient',
    web: 'https://www.argent.xyz/argent-x/',
  },
  braavos: {
    ios: 'https://apps.apple.com/app/braavos-smart-wallet/id1630640867',
    android: 'https://play.google.com/store/apps/details?id=com.braavos.wallet',
    web: 'https://braavos.app/download',
  },
  xverse: {
    ios: 'https://apps.apple.com/app/xverse-wallet/id1552083154',
    android: 'https://play.google.com/store/apps/details?id=app.xverse.mobile',
    web: 'https://www.xverse.app/',
  },
};

const MobileWalletModal: React.FC<MobileWalletModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  availableConnectors,
  isConnecting,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Xverse wallet hook
  const {
    connect: connectXverse,
    isConnecting: isXverseConnecting,
    isConnected: isXverseConnected
  } = useXverseWallet();

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const handleConnectWallet = async (connectorId: string) => {
    setSelectedWallet(connectorId);

    try {
      await onConnect(connectorId);
      onClose();
    } catch (error) {
      console.error('Connection error:', error);
      setSelectedWallet(null);
    }
  };

  const handleConnectXverse = async () => {
    setSelectedWallet('xverse');

    try {
      await connectXverse();
      // Don't close modal immediately - let the success toast show
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Xverse connection error:', error);
      setSelectedWallet(null);
    }
  };

  const openInstallPage = (wallet: 'argent' | 'braavos' | 'xverse') => {
    const urls = WALLET_INSTALL_URLS[wallet];
    const userAgent = navigator.userAgent.toLowerCase();

    let installUrl = urls.web;

    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      installUrl = urls.ios;
    } else if (userAgent.includes('android')) {
      installUrl = urls.android;
    }

    window.open(installUrl, '_blank');
    const walletNames = { argent: 'Argent X', braavos: 'Braavos', xverse: 'Xverse Wallet' };
    toast.success(`Opening ${walletNames[wallet]} installation page...`);
  };

  const getWalletIcon = (connectorId: string) => {
    const id = connectorId.toLowerCase();
    if (id.includes('argent')) {
      return '🦊'; // Argent icon placeholder
    } else if (id.includes('xverse') || id.includes('starknet_xverse')) {
      return '🅧'; // Xverse icon placeholder
    } else if (id.includes('braavos')) {
      return '🛡️'; // Braavos icon placeholder
    }
    return '💼';
  };

  const getWalletName = (connectorId: string, connectorName?: string) => {
    if (connectorName) return connectorName;
    const id = connectorId.toLowerCase();
    if (id.includes('argent')) return 'Argent X';
    if (id.includes('braavos')) return 'Braavos';
    if (id.includes('xverse') || id.includes('starknet_xverse')) return 'Xverse Wallet';
    return connectorId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            {isMobile 
              ? 'Choose a wallet to connect. If you don\'t have a wallet installed, tap "Install" to get started.'
              : 'Choose a wallet extension to connect to the dApp.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* Starknet Wallets Section */}
          {availableConnectors.length > 0 && (
            <>
              <p className="text-sm font-medium text-muted-foreground mb-2">Starknet Wallets</p>
              {availableConnectors.map((connector) => {
                const walletName = getWalletName(connector.id, connector.name);
                const isCurrentlyConnecting = isConnecting && selectedWallet === connector.id;

                return (
                  <Card key={connector.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getWalletIcon(connector.id)}</span>
                        <div>
                          <h3 className="font-semibold">{walletName}</h3>
                          {isMobile && (
                            <p className="text-xs text-muted-foreground">
                              {connector.id.includes('webwallet') ? 'Web Wallet' : 'Mobile App'}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleConnectWallet(connector.id)}
                        disabled={isConnecting || isXverseConnecting}
                        size="sm"
                        className="min-w-[80px]"
                      >
                        {isCurrentlyConnecting ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </>
          )}

          {/* Xverse Wallet Section (Bitcoin) */}
          <div className="pt-2">
            {availableConnectors.length > 0 && (
              <p className="text-sm font-medium text-muted-foreground mb-2">Bitcoin Wallet</p>
            )}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🅧</span>
                  <div>
                    <h3 className="font-semibold">Xverse Wallet</h3>
                    <p className="text-xs text-muted-foreground">
                      Bitcoin Wallet
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleConnectXverse}
                  disabled={isConnecting || isXverseConnecting}
                  size="sm"
                  className="min-w-[80px]"
                >
                  {isXverseConnecting || (selectedWallet === 'xverse' && isConnecting)
                    ? 'Connecting...'
                    : isXverseConnected
                    ? 'Connected'
                    : 'Connect'}
                </Button>
              </div>
            </Card>
          </div>

          {/* No wallets found message */}
          {availableConnectors.length === 0 && (
            <Card className="p-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
              <h3 className="font-semibold mb-2">No Wallet Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isMobile 
                  ? 'You need to install a Starknet wallet app to continue.'
                  : 'You need to install a Starknet wallet extension to continue.'
                }
              </p>
            </Card>
          )}

          {/* Installation options for mobile */}
          {isMobile && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Don't have a wallet? Install one:
              </p>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => openInstallPage('argent')}
                >
                  <span className="flex items-center gap-2">
                    <span>🦊</span>
                    <span>Install Argent X</span>
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => openInstallPage('braavos')}
                >
                  <span className="flex items-center gap-2">
                    <span>🛡️</span>
                    <span>Install Braavos</span>
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => openInstallPage('xverse')}
                >
                  <span className="flex items-center gap-2">
                    <span>🅧</span>
                    <span>Install Xverse Wallet</span>
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Desktop installation instructions */}
          {!isMobile && availableConnectors.length === 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Install a wallet extension:
              </p>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open('https://www.argent.xyz/argent-x/', '_blank')}
                >
                  <span>Argent X Extension</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open('https://braavos.app/download', '_blank')}
                >
                  <span>Braavos Extension</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open('https://www.xverse.app/', '_blank')}
                >
                  <span>Xverse Wallet Extension</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Mobile-specific help text */}
          {isMobile && isConnecting && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Waiting for wallet app...
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Please approve the connection request in your wallet app. If the app doesn't open automatically, open it manually and approve the connection.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileWalletModal;

