import { supabase, setUserContext, createChatId, Database } from './supabase';

// Types
export type ChatUser = {
  id: string;
  name: string;
  address: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'nft' | 'trade';
  isRead?: boolean;
};

export type Chat = Database['public']['Tables']['chats']['Row'];
export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];

// Chat Service Functions
export class ChatService {
  
  // Initialize user context for RLS policies
  static async initializeUser(userAddress: string) {
    await setUserContext(userAddress);
  }

  // Get or create a chat between two users
  static async getOrCreateChat(participant1: string, participant2: string): Promise<Chat> {
    // Ensure consistent ordering for chat lookup
    const [p1, p2] = [participant1.toLowerCase(), participant2.toLowerCase()].sort();
    
    // First try to find existing chat
    const { data: existingChat, error: findError } = await supabase
      .from('chats')
      .select('*')
      .or(`and(participant_1.eq.${p1},participant_2.eq.${p2}),and(participant_1.eq.${p2},participant_2.eq.${p1})`)
      .single();

    if (existingChat && !findError) {
      return existingChat;
    }

    // Create new chat if none exists
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({
        participant_1: p1,
        participant_2: p2,
        last_message: null,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create chat: ${createError.message}`);
    }

    return newChat!;
  }

  // Get all chats for a user
  static async getUserChats(userAddress: string): Promise<ChatUser[]> {
    const userAddr = userAddress.toLowerCase();

    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .or(`participant_1.eq.${userAddr},participant_2.eq.${userAddr}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch chats: ${error.message}`);
    }

    // Transform to ChatUser format with unread counts
    const chatUsers = await Promise.all(chats.map(async (chat) => {
      const otherParticipant = chat.participant_1.toLowerCase() === userAddress.toLowerCase()
        ? chat.participant_2
        : chat.participant_1;

      // Get unread message count for this chat
      const unreadCount = await this.getUnreadMessageCount(chat.id, userAddress);

      return {
        id: chat.id,
        name: `User ${otherParticipant.slice(-3)}.stark`,
        address: otherParticipant,
        avatar: '/src/Images/starknet-strk-logo.png',
        lastMessage: chat.last_message || 'No messages yet',
        timestamp: chat.last_message_at || new Date().toISOString(), // Keep raw ISO timestamp for real-time formatting
        unread: unreadCount,
        online: false, // TODO: Implement online status
      };
    }));

    return chatUsers;
  }

  // Get unread message count for a chat
  static async getUnreadMessageCount(chatId: string, userAddress: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .neq('sender_address', userAddress.toLowerCase())
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }

  // Get total unread message count for a user
  static async getTotalUnreadCount(userAddress: string): Promise<number> {
    // Get all chats for the user
    const { data: chats, error } = await supabase
      .from('chats')
      .select('id')
      .or(`participant_1.eq.${userAddress.toLowerCase()},participant_2.eq.${userAddress.toLowerCase()}`);

    if (error || !chats) {
      console.error('Error fetching chats for unread count:', error);
      return 0;
    }

    // Get total unread count across all chats
    let totalUnread = 0;
    for (const chat of chats) {
      const unreadCount = await this.getUnreadMessageCount(chat.id, userAddress);
      totalUnread += unreadCount;
    }

    return totalUnread;
  }

  // Mark messages as read in a chat
  static async markMessagesAsRead(chatId: string, userAddress: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_address', userAddress.toLowerCase())
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  // Send a message
  static async sendMessage(
    senderAddress: string,
    receiverAddress: string,
    content: string,
    messageType: 'text' | 'nft' | 'trade' = 'text'
  ): Promise<Message> {
    // Get or create chat
    const chat = await this.getOrCreateChat(senderAddress, receiverAddress);

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chat.id,
        sender_address: senderAddress.toLowerCase(),
        receiver_address: receiverAddress.toLowerCase(),
        content,
        message_type: messageType,
        is_read: false,
      })
      .select()
      .single();

    if (messageError) {
      throw new Error(`Failed to send message: ${messageError.message}`);
    }

    // Update chat's last message
    await supabase
      .from('chats')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', chat.id);

    // Create notification for the receiver
    try {
      const { NotificationService } = await import('./notificationService');
      const senderName = `User ${senderAddress.slice(-3)}.stark`;
      await NotificationService.createChatNotification(
        receiverAddress,
        senderAddress,
        senderName
      );
    } catch (notificationError) {
      console.error('Error creating chat notification:', notificationError);
      // Don't throw error for notification failure
    }

    return this.transformMessage(message!);
  }

  // Get messages for a chat
  static async getChatMessages(chatId: string): Promise<Message[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return messages.map(this.transformMessage);
  }

  // Get messages between two users
  static async getMessagesBetweenUsers(user1: string, user2: string): Promise<Message[]> {
    const chat = await this.getOrCreateChat(user1, user2);
    return this.getChatMessages(chat.id);
  }

  // Subscribe to new messages in a chat
  static subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const message = this.transformMessage(payload.new as MessageRow);
          callback(message);
        }
      )
      .subscribe();
  }

  // Subscribe to chat updates
  static subscribeToChats(userAddress: string, callback: (chat: Chat) => void) {
    return supabase
      .channel(`chats:${userAddress}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `or(participant_1.eq.${userAddress.toLowerCase()},participant_2.eq.${userAddress.toLowerCase()})`,
        },
        (payload) => {
          callback(payload.new as Chat);
        }
      )
      .subscribe();
  }

  // Mark messages as read
  static async markMessagesAsRead(chatId: string, userAddress: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .eq('receiver_address', userAddress.toLowerCase());
  }

  // Helper function to transform database message to app message
  private static transformMessage(dbMessage: MessageRow): Message {
    return {
      id: dbMessage.id,
      senderId: dbMessage.sender_address,
      content: dbMessage.content,
      timestamp: dbMessage.created_at, // Keep raw ISO timestamp for real-time formatting
      type: dbMessage.message_type,
      isRead: dbMessage.is_read,
    };
  }

  // Helper function to format timestamp
  private static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  }
}

// Likes Service Functions
export class LikesService {

  // Add a like
  static async addLike(
    userAddress: string,
    targetType: 'message' | 'post' | 'nft',
    targetId: string,
    postOwnerAddress?: string
  ): Promise<Like> {
    const { data: like, error } = await supabase
      .from('likes')
      .insert({
        user_address: userAddress.toLowerCase(),
        target_type: targetType,
        target_id: targetId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding like:', error);
      throw new Error(`Failed to add like: ${error.message}`);
    }

    // Create notification for post owner if it's a post like
    if (targetType === 'post' && postOwnerAddress &&
        postOwnerAddress.toLowerCase() !== userAddress.toLowerCase()) {
      try {
        const { NotificationService } = await import('./notificationService');
        const likerName = `User ${userAddress.slice(-3)}.stark`;
        await NotificationService.createLikeNotification(
          postOwnerAddress,
          userAddress,
          likerName,
          targetId
        );
      } catch (notificationError) {
        console.error('Error creating like notification:', notificationError);
        // Don't throw error for notification failure
      }
    }

    return like!;
  }

  // Remove a like
  static async removeLike(
    userAddress: string,
    targetType: 'message' | 'post' | 'nft',
    targetId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_address', userAddress.toLowerCase())
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) {
      throw new Error(`Failed to remove like: ${error.message}`);
    }
  }

  // Check if user has liked a target
  static async hasUserLiked(
    userAddress: string,
    targetType: 'message' | 'post' | 'nft',
    targetId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_address', userAddress.toLowerCase())
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if user liked:', error);
        // If table doesn't exist or other errors, return false
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasUserLiked:', error);
      return false;
    }
  }

  // Get like count for a target
  static async getLikeCount(
    targetType: 'message' | 'post' | 'nft',
    targetId: string
  ): Promise<number> {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) {
      console.error('Error getting like count:', error);
      return 0;
    }

    return count || 0;
  }

  // Get all likes for a user
  static async getUserLikes(userAddress: string): Promise<Like[]> {
    const { data: likes, error } = await supabase
      .from('likes')
      .select('*')
      .eq('user_address', userAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user likes: ${error.message}`);
    }

    return likes || [];
  }

  // Subscribe to likes for a target
  static subscribeToLikes(
    targetType: 'message' | 'post' | 'nft',
    targetId: string,
    callback: (like: Like, event: 'INSERT' | 'DELETE') => void
  ) {
    return supabase
      .channel(`likes:${targetType}:${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `and(target_type.eq.${targetType},target_id.eq.${targetId})`,
        },
        (payload) => {
          const event = payload.eventType as 'INSERT' | 'DELETE';
          const like = (payload.new || payload.old) as Like;
          callback(like, event);
        }
      )
      .subscribe();
  }

  // Toggle like (add if not liked, remove if liked)
  static async toggleLike(
    userAddress: string,
    targetType: 'message' | 'post' | 'nft',
    targetId: string,
    postOwnerAddress?: string
  ): Promise<{ liked: boolean; count: number }> {
    const isLiked = await this.hasUserLiked(userAddress, targetType, targetId);

    if (isLiked) {
      await this.removeLike(userAddress, targetType, targetId);
    } else {
      await this.addLike(userAddress, targetType, targetId, postOwnerAddress);
    }

    const count = await this.getLikeCount(targetType, targetId);
    return { liked: !isLiked, count };
  }
}
