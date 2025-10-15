import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    isSupported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
    isSubscribed: false,
  });

  // Check if notifications are supported and get current permission
  useEffect(() => {
    if ('Notification' in window) {
      setState(prev => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
      }));
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [state.isSupported]);

  // Send a notification
  const sendNotification = useCallback((
    title: string,
    options?: NotificationOptions
  ) => {
    if (!state.isSupported) {
      console.warn('Notifications not supported');
      return;
    }

    if (state.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [state.isSupported, state.permission]);

  // Predefined notification types for the app
  const notifyNewPost = useCallback((author: string) => {
    sendNotification('New Post Available! 📝', {
      body: `${author} just posted something new`,
      tag: 'new-post',
    });
  }, [sendNotification]);

  const notifySwapProposal = useCallback((fromUser: string) => {
    sendNotification('Swap Proposal Received! 🔄', {
      body: `${fromUser} wants to swap posts with you`,
      tag: 'swap-proposal',
    });
  }, [sendNotification]);

  const notifySwapAccepted = useCallback(() => {
    sendNotification('Swap Accepted! ✅', {
      body: 'Your swap proposal was accepted',
      tag: 'swap-accepted',
    });
  }, [sendNotification]);

  const notifyDailyReminder = useCallback(() => {
    sendNotification('Daily Post Reminder 📅', {
      body: "Don't forget to create your daily post!",
      tag: 'daily-reminder',
    });
  }, [sendNotification]);

  // Schedule daily reminder (simplified version)
  const scheduleDailyReminder = useCallback(() => {
    if (state.permission !== 'granted') return;

    // Calculate time until next day at 9 AM
    const now = new Date();
    const tomorrow9AM = new Date();
    tomorrow9AM.setDate(now.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);
    
    const timeUntilReminder = tomorrow9AM.getTime() - now.getTime();

    // Set timeout for reminder (in a real app, you'd use a service worker)
    setTimeout(() => {
      notifyDailyReminder();
    }, timeUntilReminder);
  }, [state.permission, notifyDailyReminder]);

  // Register service worker for push notifications (simplified)
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setState(prev => ({ ...prev, isSubscribed: true }));
      return true;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return false;
    }
  }, []);

  return {
    ...state,
    requestPermission,
    sendNotification,
    notifyNewPost,
    notifySwapProposal,
    notifySwapAccepted,
    notifyDailyReminder,
    scheduleDailyReminder,
    registerServiceWorker,
  };
};
