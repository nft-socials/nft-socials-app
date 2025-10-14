import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { useCallback, useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';

export interface WalletState {
  isConnected: boolean;
  address?: string;
  isConnecting: boolean;
  error?: string;
}

// Detect if user is on mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Mobile deep link URLs for Starknet wallets
const MOBILE_WALLET_DEEP_LINKS = {
  'argentX': 'https://web.argent.xyz',
  'braavos': 'https://braavos.app/download',
  'xverse': 'https://www.xverse.app/',
  'argent-mobile': 'argent://app',
};

export const useStarknetWallet = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string>();
  const [connectionTimeout, setConnectionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [connectionTimeout]);

  const connectWallet = useCallback(async (connectorId?: string) => {
    const isMobile = isMobileDevice();
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      setError(undefined);

      // Find the connector (Argent or Braavos)
      const connector = connectorId
        ? connectors.find(c => c.id === connectorId)
        : connectors[0]; // Default to first available

      if (!connector) {
        // On mobile, if no connector found, guide user to install wallet
        if (isMobile) {
          const installMessage = 'No wallet found. Please install Argent X, Braavos, or Xverse wallet app.';
          setError(installMessage);
          toast.error(installMessage, {
            duration: 5000,
            action: {
              label: 'Install Argent',
              onClick: () => {
                window.open('https://www.argent.xyz/argent-x/', '_blank');
              },
            },
          });
          return;
        }
        throw new Error('No wallet connector found. Please install Argent X, Braavos, or Xverse browser extension.');
      }

      // Check if connector is available (wallet is installed)
      const isAvailable = connector.available ? await connector.available() : true;

      if (!isAvailable) {
        if (isMobile) {
          // On mobile, try to open wallet app or guide to installation
          const walletName = connector.name || 'wallet';
          toast.error(`${walletName} not found. Opening installation page...`, {
            duration: 4000,
          });

          // Try to open wallet-specific deep link or installation page
          if (connector.id.includes('argent')) {
            window.open('https://www.argent.xyz/argent-x/', '_blank');
          } else if (connector.id.includes('braavos')) {
            window.open('https://braavos.app/download', '_blank');
          } else if (connector.id.includes('xverse') || connector.id.includes('starknet_xverse')) {
            window.open('https://www.xverse.app/', '_blank');
          }
          return;
        }
        throw new Error(`${connector.name || 'Wallet'} is not installed. Please install it first.`);
      }

      // Set connection timeout (30 seconds for mobile, 15 seconds for desktop)
      const timeoutDuration = isMobile ? 30000 : 15000;

      timeoutId = setTimeout(() => {
        if (!isConnected) {
          setError('Connection timeout. Please try again.');
          toast.error('Connection timeout. Please make sure your wallet app is open and try again.', {
            duration: 5000,
          });
        }
      }, timeoutDuration);

      setConnectionTimeout(timeoutId);

      // Attempt connection (removed persistent toast that doesn't dismiss)
      await connect({ connector });

      // Clear timeout on successful connection
      if (timeoutId) {
        clearTimeout(timeoutId);
        setConnectionTimeout(null);
      }

      toast.dismiss();
      toast.success('🎉 Wallet connected successfully!');
    } catch (err: any) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        setConnectionTimeout(null);
      }

      toast.dismiss();

      const errorMessage = err?.message || 'Failed to connect wallet';
      setError(errorMessage);

      // Provide helpful error messages
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected')) {
        toast.error('❌ Connection rejected. Please approve the connection in your wallet.');
      } else if (errorMessage.includes('not installed') || errorMessage.includes('not found')) {
        if (isMobile) {
          toast.error('❌ Wallet app not found. Please install Argent X, Braavos, or Xverse.', {
            duration: 5000,
            action: {
              label: 'Install',
              onClick: () => {
                window.open('https://www.argent.xyz/argent-x/', '_blank');
              },
            },
          });
        } else {
          toast.error('❌ Wallet extension not found. Please install Argent X, Braavos, or Xverse browser extension.');
        }
      } else if (errorMessage.includes('timeout')) {
        toast.error('❌ Connection timeout. Please make sure your wallet is open and try again.');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    }
  }, [connect, connectors, isConnected]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setError(undefined);
      toast.success('Wallet disconnected');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to disconnect wallet';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [disconnect]);

  // Check if we're on the correct Starknet chain
  const isCorrectChain = useCallback(() => {
    // For now, we'll assume any Starknet connection is valid
    // In production, you might want to check specific chain IDs
    return isConnected;
  }, [isConnected]);

  const walletState: WalletState = {
    isConnected,
    address,
    isConnecting,
    error,
  };

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    isCorrectChain,
    availableConnectors: connectors,
  };
};
