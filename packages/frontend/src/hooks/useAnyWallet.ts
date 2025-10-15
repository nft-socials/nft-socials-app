/**
 * Custom hook to check if ANY wallet is connected (Starknet OR Xverse)
 * Use this instead of checking individual wallets
 */

import { useAccount } from '@starknet-react/core';
import { useXverseWallet } from './useXverseWallet';

export function useAnyWallet() {
  // Starknet wallet
  const { address: starknetAddress, isConnected: isStarknetConnected } = useAccount();
  
  // Xverse wallet
  const { address: xverseAddress, isConnected: isXverseConnected } = useXverseWallet();

  // Check if ANY wallet is connected
  const isConnected = isStarknetConnected || isXverseConnected;
  
  // Return the first available address (prefer Starknet for NFT operations)
  const address = starknetAddress || xverseAddress;

  return {
    isConnected,
    address,
    // Individual wallet states
    starknetAddress,
    xverseAddress,
    isStarknetConnected,
    isXverseConnected,
  };
}

