import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EventType, EventTypeFilter } from './types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ModernCalendarFiltersProps {
  eventFilters: Record<EventType, EventTypeFilter>;
  onFilterChange: (filters: Record<EventType, EventTypeFilter>) => void;
}

export const ModernCalendarFilters = ({ 
  eventFilters, 
  onFilterChange 
}: ModernCalendarFiltersProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const enabledCount = Object.values(eventFilters).filter(f => f.enabled).length;
  const totalCount = Object.keys(eventFilters).length;

  const handleToggleAll = () => {
    const allEnabled = Object.values(eventFilters).every(f => f.enabled);
    const newFilters = { ...eventFilters };
    Object.keys(newFilters).forEach(key => {
      newFilters[key as EventType].enabled = !allEnabled;
    });
    onFilterChange(newFilters);
  };

  const handleToggleFilter = (key: EventType) => {
    onFilterChange({
      ...eventFilters,
      [key]: { ...eventFilters[key], enabled: !eventFilters[key].enabled }
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Filtreler
                </span>
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  ({enabledCount}/{totalCount} aktif)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleAll();
                }}
              >
                {Object.values(eventFilters).every(f => f.enabled) ? (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Tümünü Kaldır
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Tümünü Seç
                  </>
                )}
              </Button>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap gap-2 pt-3">
              {Object.entries(eventFilters).map(([key, filter]) => {
                const Icon = filter.icon;
                const isEnabled = filter.enabled;
                
                return (
                  <button
                    key={key}
                    onClick={() => handleToggleFilter(key as EventType)}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
                      isEnabled
                        ? 'border-transparent shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                    style={isEnabled ? {
                      backgroundColor: `${filter.color}15`,
                      color: filter.color,
                      borderColor: `${filter.color}30`,
                    } : undefined}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        isEnabled ? 'scale-100' : 'scale-75 opacity-50'
                      )}
                      style={{ backgroundColor: filter.color }}
                    />
                    <Icon className="h-3 w-3" />
                    <span>{filter.label}</span>
                    {isEnabled && (
                      <Check className="h-3 w-3 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

