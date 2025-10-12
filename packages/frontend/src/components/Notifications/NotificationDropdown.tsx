import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Heart, ShoppingCart, MessageCircle, User, Copy } from 'lucide-react';
import { useAccount } from '@starknet-react/core';
import { NotificationService, type Notification } from '@/services/notificationService';
import { toast } from 'react-hot-toast';

interface NotificationDropdownProps {
  onNavigate?: (tab: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const { address } = useAccount();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        NotificationService.getUserNotifications(address),
        NotificationService.getUnreadCount(address)
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount and address change
  useEffect(() => {
    loadNotifications();
  }, [address]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!address) return;

    const subscription = NotificationService.subscribeToNotifications(
      address,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast for new notification
        toast.success(newNotification.title);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [address]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.is_read) {
        await NotificationService.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Handle navigation based on notification type
      switch (notification.type) {
        case 'like':
          // Navigate to profile or post
          if (onNavigate) {
            onNavigate('Profile');
          }
          break;
        case 'chat':
          // Navigate to chat page
          if (onNavigate) {
            onNavigate('Chats');
          }
          break;
        case 'buy':
        case 'sell':
          // Just mark as read, no navigation
          break;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to process notification');
    }
  };

  const markAllAsRead = async () => {
    if (!address) return;

    try {
      await NotificationService.markAllAsRead(address);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'buy':
      case 'sell':
        return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case 'chat':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied!');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className='mt-2 md:mt-20'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="max-h-96">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">
                          {notification.message}
                        </p>
                        
                        {notification.from_address && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span 
                              className="cursor-pointer hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(notification.from_address!);
                              }}
                            >
                              {formatAddress(notification.from_address)}
                            </span>
                            <Copy className="w-3 h-3 ml-1" />
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          {NotificationService.formatTimestamp(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NotificationDropdown;
