import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Search, User, ArrowUpDown } from 'lucide-react';

interface NavigationProps {
  activeTab: 'feed' | 'browse' | 'profile';
  onTabChange: (tab: 'feed' | 'browse' | 'profile') => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'feed' as const, label: 'Feed', icon: Home },
    { id: 'browse' as const, label: 'Browse Swaps', icon: Search },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-center p-2">
        <div className="flex bg-muted/50 rounded-lg p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(id)}
              className={`
                flex items-center gap-2 px-4 py-2 transition-all
                ${activeTab === id 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default Navigation;