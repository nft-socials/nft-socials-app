import React, { createContext, useContext, ReactNode } from 'react';
import { InjectedConnector, StarknetConfig, argent, braavos, publicProvider, starkscan } from '@starknet-react/core';
import { sepolia, mainnet } from '@starknet-react/chains';
import { XverseConnector } from '../services/web3/xverse';

interface WalletContextType {
  // Add any additional wallet-related state or functions here
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

  const connectors: InjectedConnector[] = [argent(), braavos(), new XverseConnector()];

  const value: WalletContextType = {
    // Add wallet-related state and functions here
  };

  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={connectors}
      explorer={starkscan}
      // autoConnect
    >
      <WalletContext.Provider value={value}>
        {children}
      </WalletContext.Provider>
    </StarknetConfig>
  );
};