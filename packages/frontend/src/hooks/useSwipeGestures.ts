import { useSwipeable } from 'react-swipeable';
import { useCallback } from 'react';
import { toast } from 'sonner';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

export const useSwipeGestures = (options: SwipeGestureOptions) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
  } = options;

  const handlers = useSwipeable({
    onSwipedLeft: useCallback(() => {
      onSwipeLeft?.();
    }, [onSwipeLeft]),
    
    onSwipedRight: useCallback(() => {
      onSwipeRight?.();
    }, [onSwipeRight]),
    
    onSwipedUp: useCallback(() => {
      onSwipeUp?.();
    }, [onSwipeUp]),
    
    onSwipedDown: useCallback(() => {
      onSwipeDown?.();
    }, [onSwipeDown]),
    
    delta: threshold,
    preventDefaultTouchmoveEvent,
    trackTouch: true,
    trackMouse: false, // Only track touch for mobile
  });

  return handlers;
};

// Predefined swipe actions for common use cases
export const usePostSwipeActions = (
  postId: string,
  onLike?: () => void,
  onShare?: () => void,
  onBookmark?: () => void
) => {
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: useCallback(() => {
      // Swipe left to like
      onLike?.();
      toast.success('❤️ Liked!', { duration: 1000 });
    }, [onLike]),

    onSwipeRight: useCallback(() => {
      // Swipe right to share
      onShare?.();
      toast.success('📤 Shared!', { duration: 1000 });
    }, [onShare]),

    onSwipeDown: useCallback(() => {
      // Swipe down to bookmark (toast removed to prevent interference with scrolling)
      onBookmark?.();
    }, [onBookmark]),
  });

  return swipeHandlers;
};

// Trading-specific swipe gestures
export const useTradingSwipeActions = (
  tokenId: string,
  onBuy?: () => void,
  onSell?: () => void,
  onWatchlist?: () => void
) => {
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: useCallback(() => {
      // Swipe left to sell
      onSell?.();
      toast.success('💰 Listed for sale!', { duration: 1500 });
    }, [onSell]),
    
    onSwipeRight: useCallback(() => {
      // Swipe right to buy
      onBuy?.();
      toast.success('🛒 Purchase initiated!', { duration: 1500 });
    }, [onBuy]),
    
    onSwipeUp: useCallback(() => {
      // Swipe up to add to watchlist
      onWatchlist?.();
      toast.success('👀 Added to watchlist!', { duration: 1000 });
    }, [onWatchlist]),
    
    threshold: 80, // Higher threshold for trading actions
  });

  return swipeHandlers;
};

// Navigation swipe gestures
export const useNavigationSwipeActions = (
  onPrevious?: () => void,
  onNext?: () => void,
  onRefresh?: () => void
) => {
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: useCallback(() => {
      // Swipe left to go to next
      onNext?.();
    }, [onNext]),
    
    onSwipeRight: useCallback(() => {
      // Swipe right to go to previous
      onPrevious?.();
    }, [onPrevious]),
    
    onSwipeDown: useCallback(() => {
      // Swipe down to refresh
      onRefresh?.();
      toast.success('🔄 Refreshing...', { duration: 1000 });
    }, [onRefresh]),
    
    threshold: 60,
  });

  return swipeHandlers;
};
