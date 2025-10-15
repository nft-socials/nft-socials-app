import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { InjectedConnector, StarknetConfig, argent, braavos, publicProvider, starkscan } from '@starknet-react/core';
import { sepolia, mainnet } from '@starknet-react/chains';
import { xverse, XverseConnector } from '../services/web3/xverse';

interface WalletContextType {
  // Xverse connector for Bitcoin
  xverseConnector: XverseConnector;
  // Xverse wallet state
  xverseAddress: string | null;
  xversePublicKey: string | null;
  isXverseConnected: boolean;
  setXverseWallet: (address: string | null, publicKey: string | null) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const chains = [sepolia, mainnet];
  const provider = publicProvider();

  // Xverse wallet state
  const [xverseAddress, setXverseAddress] = useState<string | null>(null);
  const [xversePublicKey, setXversePublicKey] = useState<string | null>(null);
  // Create Starknet connectors - argent() and braavos() work on both desktop and mobile
  const connectors: InjectedConnector[] = [argent(), braavos()];

  // Create Xverse connector separately (for Bitcoin, not Starknet)
  const xverseConnector = xverse();

  // Function to update Xverse wallet state
  const setXverseWallet = useCallback((address: string | null, publicKey: string | null) => {
    setXverseAddress(address);
    setXversePublicKey(publicKey);

    // Persist to localStorage
    if (address) {
      localStorage.setItem('xverse_address', address);
      if (publicKey) {
        localStorage.setItem('xverse_publicKey', publicKey);
      }
    } else {
      localStorage.removeItem('xverse_address');
      localStorage.removeItem('xverse_publicKey');
    }
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      // Check localStorage first
      const savedAddress = localStorage.getItem('xverse_address');
      const savedPublicKey = localStorage.getItem('xverse_publicKey');

      if (savedAddress) {
        // Verify the wallet is still connected
        const currentAddress = await xverseConnector.getAddress();
        if (currentAddress === savedAddress) {
          setXverseAddress(savedAddress);
          setXversePublicKey(savedPublicKey);
        } else {
          // Clear stale data
          localStorage.removeItem('xverse_address');
          localStorage.removeItem('xverse_publicKey');
        }
      }
    };

    checkExistingConnection();
  }, [xverseConnector]);

  const value: WalletContextType = {
    xverseConnector,
    xverseAddress,
    xversePublicKey,
    isXverseConnected: !!xverseAddress,
    setXverseWallet,
  };

  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={connectors}
      explorer={starkscan}
      autoConnect={false} // Disable auto-connect to prevent mobile issues
    >
      <WalletContext.Provider value={value}>
        {children}
      </WalletContext.Provider>
    </StarknetConfig>
  );
};