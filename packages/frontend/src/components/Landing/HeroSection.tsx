import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Shield, Coins } from 'lucide-react';

import DashboardInfo from '@/pages/DashboardInfo';

interface HeroSectionProps {
  onComplete?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onComplete }) => {
  const [animationStep, setAnimationStep] = useState(0);

  // Animation sequence for post to NFT transformation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(interval);
  }, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Hero Title */}
          <div className="space-y-4">
            <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium animate-pulse-glow">
              Powered by Starknet
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Post Once,{' '}
              <span className="text-primary animate-shimmer">Own Forever</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Turn Your Moments into Tradeable NFTs on Starknet
            </p>
          </div>

          <DashboardInfo onComplete={onComplete} />


          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 animate-slide-up">
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">NFT Minting</h3>
                <p className="text-sm text-muted-foreground">
                  Every post becomes a unique NFT on Starknet, giving you true ownership of your content.
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border hover:border-accent/50 transition-all duration-300 animate-slide-up delay-100">
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Coins className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold">Minting & Trading</h3>
                <p className="text-sm text-muted-foreground">
                  Mint your nft or Trade your post NFTs with others to build your collection.
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border hover:border-success/50 transition-all duration-300 animate-slide-up delay-200">
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-lg font-semibold">Decentralized Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Your content is stored on IPFS, ensuring it's always accessible and censorship-resistant.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
