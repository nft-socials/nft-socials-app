import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { useStarknetWallet } from "@/hooks/useStarknetWallet";
import React from "react";

interface DashboardInfoProps {
  onComplete?: () => void;
}

const DashboardInfo: React.FC<DashboardInfoProps> = ({ onComplete }) => {
  const { isConnected, connectWallet } = useStarknetWallet();

  const handleGetStarted = () => {
    if (onComplete) {
      // If onComplete is provided, dismiss hero section and enter guest mode
      onComplete();
    } else {
      // Fallback to connect wallet for backward compatibility
      connectWallet();
    }
  };

  return (
    <div>
      <div className="mt-16 max-w-4xl mx-auto">
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 animate-slide-up">
          <div className="text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome to OnePostNft
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p className="text-lg">
                OnePostNft is a revolutionary social media platform built on
                Starknet where every post becomes a valuable NFT. We're
                transforming how you think about social content by giving you
                true ownership of your digital moments.
              </p>
              <p>
                <strong className="text-foreground">
                  🎯 One Post Per Day:
                </strong>{" "}
                Quality over quantity. Share your most meaningful moment each
                day and watch it become a permanent part of the blockchain.
              </p>
              <p>
                <strong className="text-foreground">
                  💎 Instant NFT Minting:
                </strong>{" "}
                Every post is automatically minted as an NFT on Starknet, giving
                you verifiable ownership and the ability to trade your content.
              </p>
              <p>
                <strong className="text-foreground">🔄 Social Trading:</strong>{" "}
                Buy, sell, and trade post NFTs with other users. Your viral
                moments could become valuable digital assets.
              </p>
              <p>
                <strong className="text-foreground">
                  🌐 Decentralized & Permanent:
                </strong>{" "}
                Your content is stored on IPFS and secured by Starknet's
                blockchain technology, ensuring it's always accessible and
                censorship-resistant.
              </p>
              <p className="text-sm italic border-t border-border pt-4 mt-6">
                Join the future of social media where your creativity has real
                value and your digital presence is truly yours.
              </p>
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {!isConnected ? (
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg animate-scale-in"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get Started
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="bg-success hover:bg-success/90 text-success-foreground px-8 py-4 text-lg animate-scale-in"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Create First Post
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardInfo;
