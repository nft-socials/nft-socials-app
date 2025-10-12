// Universal time formatting utility for consistent timestamps across the app

export const formatTimeAgo = (dateString: string | Date): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 10) {
    return 'now';
  }

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
};

// Hook for real-time updating timestamps
export const useRealTimeTimestamp = (dateString: string | Date) => {
  const [timestamp, setTimestamp] = React.useState(() => formatTimeAgo(dateString));

  React.useEffect(() => {
    const updateTimestamp = () => {
      setTimestamp(formatTimeAgo(dateString));
    };

    // Update immediately
    updateTimestamp();

    // Update every 30 seconds for recent posts, every minute for older posts
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    const interval = diffInMinutes < 5 ? 30000 : 60000; // 30s for recent, 1min for older

    const timer = setInterval(updateTimestamp, interval);

    return () => clearInterval(timer);
  }, [dateString]);

  return timestamp;
};

// React import for the hook
import React from 'react';
