import React, { useEffect, useState } from 'react';
import onePostNftLogo from '@/Images/onepostnft_image.png';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number; // Total duration in milliseconds
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Show animated text after a short delay (500ms after logo appears)
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 500);

    // Hide splash screen and call onComplete after duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade-out animation to complete before calling onComplete
      setTimeout(() => {
        onComplete();
      }, 500);
    }, duration);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete, duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Logo and text container */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo with scale animation */}
        <div className="relative animate-scale-in">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <img
            src={onePostNftLogo}
            alt="OnePostNft Logo"
            className="relative w-32 h-32 md:w-40 md:h-40 object-contain rounded-2xl shadow-2xl animate-bounce-slow"
          />
        </div>

        {/* Animated text */}
        {showText && (
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl md:text-5xl font-bold text-[#FFD700] animate-typewriter overflow-hidden whitespace-nowrap border-r-4 border-primary pr-2">
              OnePostNft
            </h1>
            <p className="text-sm md:text-base text-muted-foreground animate-fade-in-up">
              Powered by Starknet
            </p>
          </div>
        )}

        {/* Loading indicator */}
        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes typewriter {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes blink {
          50% {
            border-color: transparent;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-typewriter {
          animation: typewriter 2s steps(11) 1 normal both,
                     blink 0.75s step-end infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

