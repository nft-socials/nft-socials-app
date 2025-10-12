import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  User, 
  ArrowUpDown,
  Bell,
  MessageCircle
} from 'lucide-react';

interface DesktopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
  chatCount?: number;
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
  activeTab,
  onTabChange,
  notificationCount,
  chatCount,
}) => {
  const navigationItems = [
    { id: 'feed', label: 'Posts', icon: Home },
    { id: 'Chats', label: 'Chats', icon: MessageCircle, badge: chatCount },
    { id: 'marketplace', label: 'Marketplace', icon: ArrowUpDown },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <div className="hidden md:block fixed top-20 mt-7 mx-auto max-w-[875px] left-0 right-0 z-40 bg-card border-b border-primary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-4 py-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge className={`ml-1 text-white ${
                    item.id === 'Chats'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DesktopNavigation;
