import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface WalletState {
  isConnected: boolean;
  address?: string;
  isConnecting: boolean;
  error?: string;
}

export const useStarknetWallet = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string>();

  const connectWallet = useCallback(async (connectorId?: string) => {
    try {
      setError(undefined);
      
      // Find the connector (Argent or Braavos)
      const connector = connectorId 
        ? connectors.find(c => c.id === connectorId)
        : connectors[0]; // Default to first available
      
      if (!connector) {
        throw new Error('No wallet connector found. Please install Argent or Braavos wallet.');
      }

      await connect({ connector });
      toast.success('Wallet connected successfully!');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to connect wallet';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [connect, connectors]);

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
