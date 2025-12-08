import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTabs } from './TabContext';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTabId]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  // Don't show tab bar if there's only one tab or no tabs
  if (tabs.length <= 1) {
    return null;
  }

  return (
    <div className="bg-background border-b">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  ref={isActive ? activeTabRef : null}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    'group flex items-center gap-2 px-4 py-2 text-sm font-medium border-r border-border whitespace-nowrap transition-colors min-w-0',
                    'hover:bg-muted/50',
                    isActive
                      ? 'bg-background text-foreground border-b-2 border-b-primary -mb-[1px]'
                      : 'bg-muted/30 text-muted-foreground'
                  )}
                >
                  <span className="truncate max-w-[150px]">{tab.title}</span>
                  {tab.closable && (
                    <span
                      onClick={(e) => handleCloseTab(e, tab.id)}
                      className={cn(
                        'p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors',
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px]">
                <p className="break-words">{tab.title}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
