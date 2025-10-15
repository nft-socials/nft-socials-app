import { useState, useCallback } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { toast } from 'sonner';

export function useXverseWallet() {
  const {
    xverseConnector,
    xverseAddress,
    xversePublicKey,
    isXverseConnected,
    setXverseWallet
  } = useWalletContext();

  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Connect to Xverse wallet
   * This will trigger the Xverse popup
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Check if Xverse is installed
      const isReady = await xverseConnector.ready();

      if (!isReady) {
        toast.error('Xverse Wallet not found', {
          description: 'Please install Xverse wallet from xverse.app',
          action: {
            label: 'Install',
            onClick: () => window.open('https://www.xverse.app/download', '_blank'),
          },
        });
        setIsConnecting(false);
        return;
      }

      // Connect to Xverse - this triggers the popup
      const result = await xverseConnector.connect();

      // Update shared wallet state
      setXverseWallet(result.address, result.publicKey);

      toast.success('🎉 Xverse Wallet connected!', {
        description: `Address: ${result.address.slice(0, 8)}...${result.address.slice(-6)}`,
      });
    } catch (error) {
      const err = error as Error;

      if (err.message?.includes('User rejected')) {
        toast.error('Connection cancelled', {
          description: 'You rejected the connection request',
        });
      } else if (err.message?.includes('not installed')) {
        toast.error('Xverse Wallet not installed', {
          description: 'Please install Xverse wallet',
          action: {
            label: 'Install',
            onClick: () => window.open('https://www.xverse.app/download', '_blank'),
          },
        });
      } else {
        toast.error('Failed to connect', {
          description: err.message || 'Could not connect to Xverse wallet',
        });
      }

      console.error('Xverse connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [xverseConnector, setXverseWallet]);

  /**
   * Disconnect from Xverse wallet
   */
  const disconnect = useCallback(async () => {
    try {
      await xverseConnector.disconnect();
      setXverseWallet(null, null);

      toast.success('Disconnected from Xverse');
    } catch (error) {
      console.error('Xverse disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  }, [xverseConnector, setXverseWallet]);

  /**
   * Sign a message with Xverse wallet
   */
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!isXverseConnected) {
      toast.error('Wallet not connected', {
        description: 'Please connect your Xverse wallet first',
      });
      return null;
    }

    try {
      const signature = await xverseConnector.signMessage(message);
      toast.success('Message signed successfully');
      return signature;
    } catch (error) {
      const err = error as Error;
      toast.error('Failed to sign message', {
        description: err.message || 'Could not sign the message',
      });
      console.error('Xverse sign message error:', error);
      return null;
    }
  }, [xverseConnector, isXverseConnected]);

  /**
   * Get the current address
   */
  const getAddress = useCallback(async (): Promise<string | null> => {
    try {
      const addr = await xverseConnector.getAddress();
      if (addr && !xverseAddress) {
        setXverseWallet(addr, null);
      }
      return addr;
    } catch (error) {
      console.error('Xverse get address error:', error);
      return null;
    }
  }, [xverseConnector, xverseAddress, setXverseWallet]);

  return {
    // State
    isConnecting,
    isConnected: isXverseConnected,
    address: xverseAddress,
    publicKey: xversePublicKey,

    // Actions
    connect,
    disconnect,
    signMessage,
    getAddress,
  };
}

