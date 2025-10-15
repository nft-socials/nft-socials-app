import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useAnyWallet } from '@/hooks/useAnyWallet';
import UnifiedWalletModal from './UnifiedWalletModal';

interface ConnectWalletButtonProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ 
  className = '', 
  size = 'default',
  variant = 'default'
}) => {
  const { isConnected } = useAnyWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  // If already connected, don't show the button or show different text
  if (isConnected) {
    return null; // or return a "Connected" button if you prefer
  }

  return (
    <>
      <Button
        onClick={() => setShowWalletModal(true)}
        className={`bg-primary hover:bg-primary/90 ${className}`}
        size={size}
        variant={variant}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      {/* Unified wallet connection modal */}
      <UnifiedWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={() => setShowWalletModal(false)}
        title="Connect Wallet"
        description="Choose a wallet to connect to the platform"
      />
    </>
  );
};

export default ConnectWalletButton;

