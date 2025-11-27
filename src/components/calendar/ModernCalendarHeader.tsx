import { ChevronLeft, ChevronRight, LayoutGrid, List, CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

interface ModernCalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
}

const viewOptions: { value: ViewType; label: string; icon: React.ElementType; color: string; activeColor: string }[] = [
  { value: 'month', label: 'Ay', icon: LayoutGrid, color: 'from-indigo-500 to-purple-500', activeColor: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
  { value: 'week', label: 'Hafta', icon: CalendarDays, color: 'from-cyan-500 to-blue-500', activeColor: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
  { value: 'day', label: 'Gün', icon: Clock, color: 'from-emerald-500 to-teal-500', activeColor: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { value: 'agenda', label: 'Ajanda', icon: List, color: 'from-orange-500 to-amber-500', activeColor: 'bg-gradient-to-r from-orange-500 to-amber-500' },
];

export const ModernCalendarHeader = ({
  currentDate,
  view,
  onViewChange,
  onNavigate,
}: ModernCalendarHeaderProps) => {
  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  const currentViewOption = viewOptions.find(v => v.value === view);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-lg">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl" />
      </div>
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Navigasyon */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-white hover:bg-white/20"
              onClick={() => onNavigate('PREV')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4 font-semibold text-white hover:bg-white/20 rounded-lg"
              onClick={() => onNavigate('TODAY')}
            >
              Bugün
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-white hover:bg-white/20"
              onClick={() => onNavigate('NEXT')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
            <span className="text-sm font-bold text-white capitalize">
              {formatMonthYear(currentDate)}
            </span>
          </div>
        </div>

        {/* Görünüm Seçicileri */}
        <div className="flex items-center gap-2">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            const isActive = view === option.value;
            return (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                className={cn(
                  'h-10 px-5 gap-2.5 rounded-xl transition-all duration-300 font-semibold',
                  isActive
                    ? `${option.activeColor} text-white shadow-lg hover:opacity-90`
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                )}
                onClick={() => onViewChange(option.value)}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

