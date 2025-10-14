import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAccount } from '@starknet-react/core';

interface GuestBrowsingContextType {
  isGuestMode: boolean;
  showWalletPrompt: (action: string, onSuccess?: () => void) => void;
  hideWalletPrompt: () => void;
  walletPrompt: {
    isVisible: boolean;
    action: string;
    onSuccess?: () => void;
  };
  requiresWallet: (action: string) => boolean;
}

const GuestBrowsingContext = createContext<GuestBrowsingContextType | undefined>(undefined);

export const useGuestBrowsing = () => {
  const context = useContext(GuestBrowsingContext);
  if (!context) {
    throw new Error('useGuestBrowsing must be used within a GuestBrowsingProvider');
  }
  return context;
};

interface GuestBrowsingProviderProps {
  children: ReactNode;
}

// Actions that require wallet connection
const WALLET_REQUIRED_ACTIONS = [
  'create_post',
  'buy_nft',
  'sell_nft',
  'cancel_sell',
  'start_chat',
  'access_profile',
  'like_post', // Optional - you can remove this if you want to allow anonymous likes
  'wallet_connect'
];

// Actions that can be done in guest mode
const GUEST_ALLOWED_ACTIONS = [
  'browse_feed',
  'view_marketplace',
  'search_nfts',
  'filter_posts',
  'view_public_profile',
  'read_content',
  'view_nft_details'
];

export const GuestBrowsingProvider: React.FC<GuestBrowsingProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const [walletPrompt, setWalletPrompt] = useState({
    isVisible: false,
    action: '',
    onSuccess: undefined as (() => void) | undefined
  });

  const isGuestMode = !address;

  const requiresWallet = (action: string): boolean => {
    return WALLET_REQUIRED_ACTIONS.includes(action);
  };

  const showWalletPrompt = (action: string, onSuccess?: () => void) => {
    if (requiresWallet(action) && isGuestMode) {
      setWalletPrompt({
        isVisible: true,
        action,
        onSuccess
      });
    }
  };

  const hideWalletPrompt = () => {
    setWalletPrompt({
      isVisible: false,
      action: '',
      onSuccess: undefined
    });
  };

  const value: GuestBrowsingContextType = {
    isGuestMode,
    showWalletPrompt,
    hideWalletPrompt,
    walletPrompt,
    requiresWallet
  };

  return (
    <GuestBrowsingContext.Provider value={value}>
      {children}
    </GuestBrowsingContext.Provider>
  );
};

// Helper hook for protected actions
export const useProtectedAction = () => {
  const { isGuestMode, showWalletPrompt } = useGuestBrowsing();

  const executeProtectedAction = (action: string, callback: () => void) => {
    if (isGuestMode) {
      showWalletPrompt(action);
    } else {
      callback();
    }
  };

  return { executeProtectedAction };
};
