import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Users, 
  Send, 
  MoreVertical,
  Phone,
  Video,
  Smile
} from 'lucide-react';

interface ChatUser {
  id: string;
  name: string;
  address: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'nft' | 'trade';
}

const ChatsPage: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [chats, setChats] = useState<ChatUser[]>([]);

  // Check for chat target from localStorage on component mount
  useEffect(() => {
    const initializeChats = () => {
      // Start with mock data
      const initialChats: ChatUser[] = [
    {
      id: '1',
      name: 'alice.stark',
      address: '0x1234...5678',
      avatar: '👩‍🎨',
      lastMessage: 'Hey! Love your latest NFT post!',
      timestamp: '2m ago',
      unread: 2,
      online: true
    },
    {
      id: '2',
      name: 'bob.stark',
      address: '0x2345...6789',
      avatar: '👨‍💻',
      lastMessage: 'Want to trade NFTs?',
      timestamp: '1h ago',
      unread: 0,
      online: false
    },
    {
      id: '3',
      name: 'charlie.stark',
      address: '0x3456...7890',
      avatar: '🎭',
      lastMessage: 'Check out the marketplace!',
      timestamp: '3h ago',
      unread: 1,
      online: true
    }
      ];

      // Check if there's a chat target from localStorage (when user clicks chat button)
      const chatTargetStr = localStorage.getItem('chatTarget');
      if (chatTargetStr) {
        try {
          const chatTarget = JSON.parse(chatTargetStr);

          // Check if this chat already exists
          const existingChat = initialChats.find(chat =>
            chat.address.toLowerCase() === chatTarget.address.toLowerCase()
          );

          if (!existingChat) {
            // Add new chat for the target user
            const newChat: ChatUser = {
              id: `chat_${Date.now()}`,
              name: chatTarget.name,
              address: chatTarget.address,
              avatar: '🤝',
              lastMessage: 'Start a conversation...',
              timestamp: 'now',
              unread: 0,
              online: true
            };
            initialChats.unshift(newChat); // Add to beginning

            // Auto-select this new chat
            setSelectedChat(newChat.id);
          } else {
            // Select existing chat
            setSelectedChat(existingChat.id);
          }

          // Clear the localStorage after processing
          localStorage.removeItem('chatTarget');
        } catch (error) {
          console.error('Error parsing chat target:', error);
        }
      }

      setChats(initialChats);
    };

    initializeChats();
  }, []);

  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: '1',
      content: 'Hey! Love your latest NFT post!',
      timestamp: '2:30 PM',
      type: 'text'
    },
    {
      id: '2',
      senderId: 'me',
      content: 'Thanks! It took me hours to create',
      timestamp: '2:32 PM',
      type: 'text'
    },
    {
      id: '3',
      senderId: '1',
      content: 'Would you be interested in trading?',
      timestamp: '2:33 PM',
      type: 'text'
    }
  ];

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChat) {
      // Create new message
      const message: Message = {
        id: `msg_${Date.now()}`,
        senderId: 'me',
        content: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      // Update the chat's last message
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === selectedChat
            ? { ...chat, lastMessage: newMessage.trim(), timestamp: 'now' }
            : chat
        )
      );

      // In a real app, this would send the message to the contract
      console.log('Sending message:', message);
      console.log('To chat:', selectedChatData?.address);

      // TODO: Call contract function to send message
      // await sendMessage(selectedChatData.address, newMessage.trim());

      setNewMessage('');
    }
  };

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
          {filteredChats.length === 0 ? (
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
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                        {chat.avatar}
                      </div>
                      {chat.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col">
                          <h4 className="font-medium truncate">{chat.name}</h4>
                          <span className="text-xs text-muted-foreground">{chat.address}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                    
                    {chat.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {chat.unread}
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
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {selectedChatData.avatar}
                  </div>
                  {selectedChatData.online && (
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{selectedChatData.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedChatData.address}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Video className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === 'me'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost">
                  <Smile className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()}>
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
              <div className="bg-muted/50 rounded-lg p-4 max-w-md">
                <p className="text-xs text-muted-foreground">
                  🚀 <strong>Ready for Contract Integration</strong><br/>
                  Chat functionality is prepared for your contract implementation.<br/>
                  Messages will be stored on-chain when contract is deployed.
                </p>
              </div>
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
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {selectedChatData?.avatar}
              </div>
              <div>
                <h3 className="font-medium">{selectedChatData?.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedChatData?.address}</p>
              </div>
            </div>
          </div>

          {/* Mobile Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.senderId === 'me'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Mobile Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="flex-1"
              />
              <Button size="sm" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
