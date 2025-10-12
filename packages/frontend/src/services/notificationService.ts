import { supabase } from './supabase';

export interface Notification {
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

export interface NotificationRow {
  id: string;
  user_address: string;
  type: string;
  title: string;
  message: string;
  from_address: string | null;
  from_name: string | null;
  nft_id: string | null;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
}

export class NotificationService {
  // Create a notification
  static async createNotification(
    userAddress: string,
    type: 'like' | 'buy' | 'sell' | 'chat' | 'post_created' | 'nft_listed',
    title: string,
    message: string,
    fromAddress?: string,
    fromName?: string,
    nftId?: string,
    postId?: string
  ): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_address: userAddress.toLowerCase(),
        type,
        title,
        message,
        from_address: fromAddress?.toLowerCase(),
        from_name: fromName,
        nft_id: nftId,
        post_id: postId,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }

    return this.transformNotification(data);
  }

  // Get notifications for a user
  static async getUserNotifications(userAddress: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_address', userAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }

    return data.map(this.transformNotification);
  }

  // Get unread notification count
  static async getUnreadCount(userAddress: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_address', userAddress.toLowerCase())
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userAddress: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_address', userAddress.toLowerCase())
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(
    userAddress: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_address=eq.${userAddress.toLowerCase()}`
        },
        (payload) => {
          const notification = this.transformNotification(payload.new as NotificationRow);
          callback(notification);
        }
      )
      .subscribe();
  }

  // Helper function to transform database notification to app notification
  private static transformNotification(dbNotification: NotificationRow): Notification {
    return {
      id: dbNotification.id,
      user_address: dbNotification.user_address,
      type: dbNotification.type as 'like' | 'buy' | 'sell' | 'chat',
      title: dbNotification.title,
      message: dbNotification.message,
      from_address: dbNotification.from_address || undefined,
      from_name: dbNotification.from_name || undefined,
      nft_id: dbNotification.nft_id || undefined,
      post_id: dbNotification.post_id || undefined,
      is_read: dbNotification.is_read,
      created_at: dbNotification.created_at,
    };
  }

  // Helper function to format timestamp
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }
  }

  // Create like notification
  static async createLikeNotification(
    postOwnerAddress: string,
    likerAddress: string,
    likerName: string,
    postId: string
  ): Promise<void> {
    // Don't create notification if user likes their own post
    if (postOwnerAddress.toLowerCase() === likerAddress.toLowerCase()) {
      return;
    }

    await this.createNotification(
      postOwnerAddress,
      'like',
      'New Like',
      `${likerName} liked your NFT #${postId}`,
      likerAddress,
      likerName,
      undefined,
      postId
    );
  }

  // Create buy notification
  static async createBuyNotification(
    sellerAddress: string,
    buyerAddress: string,
    buyerName: string,
    nftId: string
  ): Promise<void> {
    await this.createNotification(
      sellerAddress,
      'buy',
      'NFT Sold',
      `${buyerName} bought your NFT #${nftId}`,
      buyerAddress,
      buyerName,
      nftId
    );
  }

  // Create sell notification
  static async createSellNotification(
    sellerAddress: string,
    nftId: string
  ): Promise<void> {
    await this.createNotification(
      sellerAddress,
      'sell',
      'NFT Listed',
      `You listed NFT #${nftId} for sale`,
      undefined,
      undefined,
      nftId
    );
  }

  // Create chat notification
  static async createChatNotification(
    recipientAddress: string,
    senderAddress: string,
    senderName: string
  ): Promise<void> {
    await this.createNotification(
      recipientAddress,
      'chat',
      'New Message',
      `You have unread messages from ${senderName}`,
      senderAddress,
      senderName
    );
  }

  // Create post created notification
  static async createPostCreatedNotification(
    userAddress: string,
    postId: string
  ): Promise<void> {
    await this.createNotification(
      userAddress,
      'post_created',
      'Post Created',
      `Your NFT #${postId} has been successfully created and minted!`,
      undefined,
      undefined,
      postId
    );
  }

  // Create NFT listed notification
  static async createNFTListedNotification(
    userAddress: string,
    nftId: string,
    price: string
  ): Promise<void> {
    await this.createNotification(
      userAddress,
      'nft_listed',
      'NFT Listed for Sale',
      `Your NFT #${nftId} is now listed for sale at ${price} STRK`,
      undefined,
      undefined,
      nftId
    );
  }

  // Format time ago helper function
  static formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
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
  }
}
