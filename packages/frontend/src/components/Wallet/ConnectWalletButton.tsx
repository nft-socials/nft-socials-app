import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useStarknetWallet } from '@/hooks/useStarknetWallet';
import MobileWalletModal from './MobileWalletModal';

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
  const { connectWallet, isConnecting, availableConnectors } = useStarknetWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowWalletModal(true)}
        disabled={isConnecting}
        className={`bg-primary hover:bg-primary/90 ${className}`}
        size={size}
        variant={variant}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {/* Mobile-friendly wallet connection modal */}
      <MobileWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={connectWallet}
        availableConnectors={availableConnectors}
        isConnecting={isConnecting}
      />
    </>
  );
};

export default ConnectWalletButton;

