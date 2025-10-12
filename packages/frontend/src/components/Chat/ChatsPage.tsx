import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Search,
  Plus,
  Users,
  Send,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Copy,
  ShoppingCart,
  User,
  ChevronDown
} from 'lucide-react';
import { useAccount } from '@starknet-react/core';
import { ChatService, type ChatUser, type Message } from '@/services/chatService';
import { toast } from '@/components/ui/sonner';
import EmojiPicker from 'emoji-picker-react';
import { formatTimeAgo, useRealTimeTimestamp } from '@/utils/timeUtils';

// Safe timestamp formatter for messages
const safeFormatTimeAgo = (timestamp: string | undefined) => {
  if (!timestamp) return 'now';

  try {
    // Handle different timestamp formats
    let date: Date;

    if (timestamp === 'now') return 'now';

    // Try parsing as ISO string first
    if (timestamp.includes('T') || timestamp.includes('Z')) {
      date = new Date(timestamp);
    } else {
      // Try parsing as timestamp number
      const numTimestamp = parseInt(timestamp);
      if (!isNaN(numTimestamp)) {
        date = new Date(numTimestamp);
      } else {
        date = new Date(timestamp);
      }
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'now';
    }

    return formatTimeAgo(date);
  } catch (error) {
    console.error('Error formatting timestamp:', timestamp, error);
    return 'now';
  }
};

// Real-time timestamp component for chat list (now with real-time updates)
const ChatTimestamp: React.FC<{ timestamp: string }> = ({ timestamp }) => {
  const [displayTime, setDisplayTime] = React.useState(() => {
    try {
      // Check if it's already formatted (like "now" or "14:30")
      if (timestamp === 'now' || (timestamp.includes(':') && timestamp.length < 10)) {
        return timestamp;
      }

      // Try to parse as ISO date and format with real-time updates
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return formatTimeAgo(date);
      }

      return 'now';
    } catch (error) {
      return 'now';
    }
  });

  React.useEffect(() => {
    // Only set up real-time updates for valid ISO timestamps
    if (timestamp === 'now' || (timestamp.includes(':') && timestamp.length < 10)) {
      return; // Already formatted, no need for updates
    }

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return; // Invalid date, no updates needed
      }

      const updateTime = () => {
        setDisplayTime(formatTimeAgo(date));
      };

      // Update immediately
      updateTime();

      // Set up interval for real-time updates
      const interval = setInterval(updateTime, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error setting up chat timestamp updates:', error);
    }
  }, [timestamp]);

  return <span className="text-xs text-muted-foreground">{displayTime}</span>;
};

// Real-time timestamp component for messages (handles raw Supabase timestamps)
const MessageTimestamp: React.FC<{ timestamp: string; className?: string }> = ({ timestamp, className }) => {
  // For messages, we get raw ISO timestamps from Supabase, so we can use real-time formatting
  const [displayTime, setDisplayTime] = React.useState(() => {
    try {
      // Check if it's already formatted (like "now" or "14:30")
      if (timestamp === 'now' || timestamp.includes(':') && timestamp.length < 10) {
        return timestamp;
      }

      // Try to parse as ISO date and format with real-time updates
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return formatTimeAgo(date);
      }

      return 'now';
    } catch (error) {
      return 'now';
    }
  });

  React.useEffect(() => {
    // Only set up real-time updates for valid ISO timestamps
    if (timestamp === 'now' || timestamp.includes(':') && timestamp.length < 10) {
      return; // Already formatted, no need for updates
    }

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return; // Invalid date, no updates needed
      }

      const updateTime = () => {
        setDisplayTime(formatTimeAgo(date));
      };

      // Update immediately
      updateTime();

      // Set up interval for real-time updates
      const interval = setInterval(updateTime, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error setting up timestamp updates:', error);
    }
  }, [timestamp]);

  return <span className={className}>{displayTime}</span>;
};

interface ChatsPageProps {
  onChatCountChange?: () => void;
}

const ChatsPage: React.FC<ChatsPageProps> = ({ onChatCountChange }) => {
  const { address, account } = useAccount();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedChatAddress, setSelectedChatAddress] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showNFTsForSale, setShowNFTsForSale] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [userNFTsForSale, setUserNFTsForSale] = useState<any[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  // Load chats from Supabase
  const loadChats = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const userChats = await ChatService.getUserChats(address);
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Load messages for selected chat
  const loadMessages = useCallback(async (chatAddress: string) => {
    if (!address) return;

    try {
      const chatMessages = await ChatService.getMessagesBetweenUsers(address, chatAddress);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  }, [address]);

  // Handle chat selection
  const handleChatSelect = useCallback(async (chatId: string, chatAddress?: string) => {
    setSelectedChat(chatId);
    if (chatAddress) {
      setSelectedChatAddress(chatAddress);
      loadMessages(chatAddress);

      // Mark messages as read
      if (address) {
        try {
          await ChatService.markMessagesAsRead(chatId, address);
          // Reload chats to update unread counts
          loadChats();
          // Update chat count in navigation
          if (onChatCountChange) {
            onChatCountChange();
          }
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    } else {
      // Find chat by ID if address not provided
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChatAddress(chat.address);
        loadMessages(chat.address);

        // Mark messages as read
        if (address) {
          try {
            await ChatService.markMessagesAsRead(chatId, address);
            // Reload chats to update unread counts
            loadChats();
          } catch (error) {
            console.error('Error marking messages as read:', error);
          }
        }
      }
    }
  }, [loadMessages, chats, address, loadChats]);

  // Initialize chats on mount and when address changes
  useEffect(() => {
    if (!address) return;
    loadChats();
  }, [address, loadChats]);

  // Handle localStorage chat target separately to avoid infinite loops
  useEffect(() => {
    if (!address) return;

    const chatTargetStr = localStorage.getItem('chatTarget');
    if (chatTargetStr) {
      const processChatTarget = async () => {
        try {
          const chatTarget = JSON.parse(chatTargetStr);

          // Create or get chat with target user
          await ChatService.getOrCreateChat(address, chatTarget.address);

          // Reload chats to include the new one
          const updatedChats = await ChatService.getUserChats(address);
          setChats(updatedChats);

          // Find and select the target chat
          const targetChat = updatedChats.find(chat =>
            chat.address.toLowerCase() === chatTarget.address.toLowerCase()
          );

          if (targetChat) {
            setSelectedChat(targetChat.id);
            setSelectedChatAddress(targetChat.address);
            loadMessages(targetChat.address);
          }

          // Clear the localStorage after processing
          localStorage.removeItem('chatTarget');

        } catch (error) {
          console.error('Error processing chat target:', error);
          toast.error('Failed to open chat');
          localStorage.removeItem('chatTarget'); // Clear on error
        }
      };

      processChatTarget();
    }
  }, [address, loadMessages]); // Include loadMessages dependency

  // Real-time message subscription
  useEffect(() => {
    if (!selectedChatAddress || !address) return;

    const chat = chats.find(c => c.address === selectedChatAddress);
    if (!chat) return;

    const subscription = ChatService.subscribeToMessages(chat.id, (newMessage) => {
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const messageExists = prev.some(msg => msg.id === newMessage.id);
        if (messageExists) {
          return prev;
        }
        return [...prev, newMessage];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedChatAddress, address, chats]);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  // Button handlers
  const handlePhoneCall = () => {
    toast.error('Phone calls not allowed');
  };

  const handleVideoCall = () => {
    toast.error('Video calls not allowed');
  };

  const loadUserNFTsForSale = async (userAddress: string) => {
    setLoadingNFTs(true);
    try {
      // Import contract service to get user's NFTs for sale
      const { getUserPosts } = await import('@/services/contract');
      const userPosts = await getUserPosts(userAddress);

      // Filter only NFTs that are for sale
      const nftsForSale = userPosts.filter(post => post.isForSale);

      // Load IPFS metadata for each NFT
      const nftsWithMetadata = await Promise.all(
        nftsForSale.map(async (nft) => {
          try {
            const { getFromIPFS } = await import('@/services/ipfs');
            const metadata = await getFromIPFS(nft.contentHash);
            return {
              ...nft,
              title: metadata?.title || `NFT #${nft.tokenId}`,
              image: metadata?.image || null,
              content: metadata?.content || nft.content
            };
          } catch (error) {
            console.error('Error loading NFT metadata:', error);
            return {
              ...nft,
              title: `NFT #${nft.tokenId}`,
              image: null,
              content: nft.content
            };
          }
        })
      );

      setUserNFTsForSale(nftsWithMetadata);
    } catch (error) {
      console.error('Error loading user NFTs for sale:', error);
      setUserNFTsForSale([]);
    } finally {
      setLoadingNFTs(false);
    }
  };

  const handleViewNFTs = () => {
    if (selectedChatAddress) {
      loadUserNFTsForSale(selectedChatAddress);
    }
    setShowNFTsForSale(true);
  };

  const handleBuyNFT = async (nft: any) => {
    if (!address || !account) {
      toast.error('🔐 Please connect your wallet to buy NFTs');
      return;
    }

    let loadingToast: string | number | undefined;

    try {
      loadingToast = toast.loading('💳 Processing purchase...');
      const { buyPost } = await import('@/services/contract');

      const txHash = await buyPost(account, nft.tokenId);

      // Dismiss loading toast before showing success
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      toast.success(`🎉 Successfully bought NFT #${nft.tokenId}! 🚀`);

      // Refresh NFTs list
      if (selectedChatAddress) {
        loadUserNFTsForSale(selectedChatAddress);
      }
    } catch (error) {
      console.error('Error buying NFT:', error);

      // Dismiss loading toast before showing error
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to buy NFT';

      // Check for specific error types
      if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
        toast.error('❌ Insufficient funds to buy this NFT');
      } else if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
        toast.error('❌ Transaction rejected by user');
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        toast.error('❌ Network error. Please try again');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    }
  };

  const handleViewDetails = () => {
    setShowUserDetails(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard!');
  };

  const handleEmojiSelect = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatAddress || !address || sendingMessage) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      senderId: address,
      content: messageText,
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false
    };

    // Add optimistic message immediately
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    // Update chat list with new last message
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.address === selectedChatAddress
          ? { ...chat, lastMessage: messageText, timestamp: 'now' }
          : chat
      )
    );

    setSendingMessage(true);
    try {
      // Send message to Supabase
      await ChatService.sendMessage(
        address,
        selectedChatAddress,
        messageText,
        'text'
      );

      // Remove optimistic message and load real messages
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== tempId));
      await loadMessages(selectedChatAddress);
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');

      // Remove failed optimistic message
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== tempId));

      // Restore message text for retry
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  // Show wallet connection prompt if not connected
  if (!address) {
    return (
      <div className="h-[calc(100vh-200px)] flex bg-background rounded-lg border border-border overflow-hidden md:mt-10">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to start chatting with other NFT creators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex bg-background rounded-lg border border-border overflow-hidden md:mt-10">
      {/* Chat List Sidebar */}
      <div className="w-full md:w-1/2 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Chats
            </h2>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading chats...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Chats Found</h3>
              <p className="text-muted-foreground text-sm mb-2">
                Start a conversation with other NFT creators!
              </p>
              <p className="text-xs text-muted-foreground">
                💡 Click "Chat" on any NFT to start a conversation
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredChats.map((chat) => (
                <Card
                  key={chat.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedChat === chat.id ? 'bg-primary/10 border-primary/50' : ''
                  }`}
                  onClick={() => handleChatSelect(chat.id, chat.address)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/src/Images/starknet-strk-logo.png"
                        alt="Starknet Logo"
                        className="w-10 h-10 rounded-full bg-white p-1 object-contain"
                      />
                      {chat.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col">
                          <h4 className="font-medium truncate">{chat.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {chat.address.slice(0, 6)}...{chat.address.slice(-4)}
                          </span>
                        </div>
                        <ChatTimestamp timestamp={chat.timestamp} />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                    
                    {chat.unread > 0 && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white h-6 w-6 flex items-center justify-center text-xs p-0 rounded-full">
                        {chat.unread > 99 ? '99+' : chat.unread}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedChatData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/src/Images/starknet-strk-logo.png"
                    alt="Starknet Logo"
                    className="w-8 h-8 rounded-full bg-white p-1 object-contain"
                  />
                  {selectedChatData.online && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{selectedChatData.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedChatData.address.slice(0, 6)}...{selectedChatData.address.slice(-4)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={handlePhoneCall}>
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleVideoCall}>
                  <Video className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleViewNFTs}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      View On Sale NFTs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewDetails}>
                      <User className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {[...messages, ...optimisticMessages].map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === address ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === address
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <MessageTimestamp
                        timestamp={message.timestamp}
                        className={`text-xs mt-1 ${
                          message.senderId === address ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2 relative">
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50">
                      <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                  )}
                </div>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage || !address}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Chat</h3>
              <p className="text-muted-foreground mb-4">
                Choose a conversation to start messaging
              </p>
              
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Show selected chat full screen */}
      {selectedChat && (
        <div className="md:hidden fixed inset-0 bg-background z-50 flex flex-col">
          {/* Mobile Chat Header */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => setSelectedChat(null)}>
              ←
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <img
                src="/src/Images/starknet-strk-logo.png"
                alt="Starknet Logo"
                className="w-8 h-8 rounded-full bg-white p-1 object-contain"
              />
              <div>
                <h3 className="font-medium">{selectedChatData?.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedChatData?.address ?
                    `${selectedChatData.address.slice(0, 6)}...${selectedChatData.address.slice(-4)}` :
                    ''
                  }
                </p>
              </div>
            </div>

            {/* Mobile Actions - Only MoreVertical */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewNFTs}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View On Sale NFTs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewDetails}>
                  <User className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {[...messages, ...optimisticMessages].map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === address ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.senderId === address
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <MessageTimestamp
                      timestamp={message.timestamp}
                      className={`text-xs mt-1 ${
                        message.senderId === address ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Mobile Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 relative">
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-4 h-4" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <EmojiPicker onEmojiClick={handleEmojiSelect} />
                  </div>
                )}
              </div>
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage || !address}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View user information and wallet details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src="/src/Images/starknet-strk-logo.png"
                alt="Starknet Logo"
                className="w-16 h-16 rounded-full bg-white p-2 object-contain"
              />
              <div>
                <h3 className="font-semibold">{selectedChatData?.name}</h3>
                <p className="text-sm text-muted-foreground">Starknet User</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="bg-muted rounded p-3 space-y-2">
                {/* Mobile: Show sliced address */}
                <div className="block sm:hidden">
                  <div
                    className="text-sm font-mono cursor-pointer hover:bg-muted-foreground/10 p-2 rounded transition-colors"
                    onClick={() => {
                      copyToClipboard(selectedChatData?.address || '');
                      toast.success('Address copied!');
                    }}
                  >
                    {selectedChatData?.address ?
                      `${selectedChatData.address.slice(0, 8)}...${selectedChatData.address.slice(-8)}` :
                      ''
                    }
                  </div>
                </div>

                {/* Desktop: Show full address with copy button */}
                <div className="hidden sm:flex items-center gap-2">
                  <span
                    className="text-sm font-mono flex-1 cursor-pointer hover:bg-muted-foreground/10 p-2 rounded break-all transition-colors"
                    onClick={() => {
                      copyToClipboard(selectedChatData?.address || '');
                      toast.success('Address copied!');
                    }}
                  >
                    {selectedChatData?.address}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      copyToClipboard(selectedChatData?.address || '');
                      toast.success('Address copied!');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Click to copy address
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Online</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NFTs For Sale Modal */}
      <Dialog open={showNFTsForSale} onOpenChange={setShowNFTsForSale}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <DialogTitle>NFTs For Sale</DialogTitle>
            <DialogDescription>
              NFTs currently listed for sale by {selectedChatData?.name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 overflow-y-scroll">
            <div className="space-y-4 pb-6">
              {loadingNFTs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading NFTs...</p>
                  </div>
                </div>
              ) : userNFTsForSale.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <h3 className="font-medium mb-1">No NFTs for Sale</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedChatAddress?.slice(0, 6)}...{selectedChatAddress?.slice(-4)}.stark doesn't have any NFTs for sale
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userNFTsForSale.map((nft) => (
                    <div key={nft.tokenId} className="border rounded-lg p-4">
                      <div className="aspect-square bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                        {nft.image ? (
                          <img
                            src={nft.image}
                            alt={`NFT #${nft.tokenId}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground">NFT #{nft.tokenId}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium truncate">
                          {nft.title || `NFT #${nft.tokenId}`}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {nft.price} STRK
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {nft.content || 'No description'}
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleBuyNFT(nft)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatsPage;
