import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card'
import { Diamond, Sparkles } from 'lucide-react';
import React, { useState } from 'react'
import BadgeImage from "../Images/newBadge.png"

const PostSample = () => {
    const [animationStep, setAnimationStep] = useState(0);

     const getAnimationClass = () => {
    switch (animationStep) {
      case 0: return 'scale-100 rotate-0';
      case 1: return 'scale-105 rotate-1';
      case 2: return 'scale-110 rotate-2';
      case 3: return 'scale-100 rotate-0';
      default: return 'scale-100 rotate-0';
    }
  };

  const getNFTBadgeClass = () => {
    return animationStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50';
  };
  return (
    <div>
        {/* Animated Post to NFT Demo */}
        <div className="text-center">
            Tell the world how your feel or <strong>Post an image</strong>
            <div className="flex justify-center gap-y-6 md:gap-y-0 flex-col md:flex-row my-12 overflow-hidden">
                    <div className="relative">
                      <Card 
                        className={`p-6 bg-card border-border transition-all duration-500 ${getAnimationClass()}`}
                      >
                        <div className="space-y-4 w-80">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">Your Nft Post</div>
                              <div className="text-sm text-muted-foreground">Just now</div>
                            </div>
                          </div>
                          
                          <div className="text-left overflow-hidden">
                            <p className="text-sm w-52 md:w-full">
                              "Just had the most amazing coffee at this new place downtown! ☕️ 
                              The latte art was incredible and the atmosphere was perfect for working."
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                              Post #{Math.floor(Math.random() * 1000)}
                            </div>
                            
                            <Badge 
                              className={`transition-all duration-500 bg-success text-success-foreground ${getNFTBadgeClass()}`}
                            >
                              NFT Minted! 🎉
                            </Badge>
                          </div>
                        </div>
                      </Card>
                      
                      {/* Sparkle effects */}
                      {animationStep >= 1 && (
                        <div className="absolute -top-2 -right-2 animate-ping">
                          <Diamond className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      {animationStep >= 2 && (
                        <div className="absolute -bottom-2 -left-2 animate-ping delay-300">
                          <Diamond className="w-6 h-6 text-accent" />
                        </div>
                      )}
                    </div>
                    <div className='block text-center justify-center items-center flex-col md:flex-row'>
                        <img src={BadgeImage} className='w-72 object-cover m-auto'></img>    
                    </div>
            </div>
        </div>
    </div>
  )
}

export default PostSample