import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Heart,
  ShoppingCart,
  MessageCircle,
  FileText,
  Tag,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAccount } from '@starknet-react/core';
import { toast } from '@/components/ui/sonner';
import { NotificationService } from '@/services/notificationService';
import { formatTimeAgo } from '@/utils/timeUtils';
import ConnectWalletButton from '@/components/Wallet/ConnectWalletButton';
import { useAnyWallet } from '@/hooks/useAnyWallet';

interface Notification {
  id: string;
  user_address: string;
  type: 'like' | 'buy' | 'sell' | 'chat' | 'post_created' | 'nft_listed';
  title: string;
  message: string;
  from_address?: string;
  from_name?: string;
  nft_id?: string;
  post_id?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPageProps {
  onNavigate: (tab: string) => void;
  onNotificationCountChange?: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate, onNotificationCountChange }) => {
  const { address: starknetAddress } = useAccount();
  const { address } = useAnyWallet(); // Check BOTH Starknet and Xverse
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Load notifications
  const loadNotifications = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const data = await NotificationService.getUserNotifications(address);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [address]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!address) return;

    try {
      await NotificationService.markAllAsRead(address);
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
      toast.success('Notification deleted');

      // Trigger count update in navigation
      if (onNotificationCountChange) {
        onNotificationCountChange();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'buy':
      case 'sell':
        return <ShoppingCart className="w-5 h-5 text-green-500" />;
      case 'chat':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'post_created':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'nft_listed':
        return <Tag className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'post_created':
        onNavigate('feed');
        break;
      case 'buy':
      case 'sell':
      case 'nft_listed':
        onNavigate('marketplace');
        break;
      case 'chat':
        onNavigate('chats');
        break;
      default:
        break;
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.is_read;
      case 'read':
        return notif.is_read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <Bell className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Please connect your wallet to view notifications
            </p>
            <ConnectWalletButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4 flex-col md:flex-row gap-3 md:gap-1">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 animate-pulse" />
              {unreadCount > 0 && (
                <Badge className="bg-green-500 text-white text-nowrap">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadNotifications}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 flex-col md:flex-row">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'all' ? 'No Notifications' : 
                 filter === 'unread' ? 'No Unread Notifications' : 'No Read Notifications'}
              </h3>
              <p className="text-muted-foreground text-center">
                {filter === 'all' 
                  ? "You'll see notifications here when you receive likes, messages, or NFT activity."
                  : filter === 'unread'
                  ? "All caught up! No unread notifications."
                  : "No read notifications to show."
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-0">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-green-50/10 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < filteredNotifications.length - 1 && (
                      <div className="border-b border-border" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
