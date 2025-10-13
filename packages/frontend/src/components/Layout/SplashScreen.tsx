import React, { useEffect, useState } from 'react';
import { Sparkles, Gem } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user has seen splash before
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    
    if (hasSeenSplash) {
      // Skip splash for returning users
      onComplete();
      return;
    }

    // Show splash for 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Mark that user has seen splash
      localStorage.setItem('hasSeenSplash', 'true');
      // Wait for fade out animation
      setTimeout(onComplete, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 transition-opacity duration-300 opacity-0">
        {/* Fade out */}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="text-center space-y-6 animate-fade-in">
        {/* Logo/Icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary/20">
            <Gem className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-accent animate-bounce" />
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            One Post Daily
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            NFT Social Platform
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Tagline */}
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Create, collect, and trade unique daily NFTs on Starknet
        </p>
      </div>

      {/* Skip Button (optional) */}
      <button
        onClick={() => {
          setIsVisible(false);
          localStorage.setItem('hasSeenSplash', 'true');
          setTimeout(onComplete, 100);
        }}
        className="absolute bottom-8 right-8 text-white/60 hover:text-white/80 text-sm transition-colors"
      >
        Skip
      </button>
    </div>
  );
};

export default SplashScreen;
