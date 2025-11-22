import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarHeaderProps {
  onFilterToggle: () => void;
}

export const CalendarHeader = ({ onFilterToggle }: CalendarHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Genel Takvim
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Tüm aktiviteler, siparişler ve teslimatlarınızı tek bir yerde görüntüleyin
          </p>
        </div>
      </div>
      {/* Sağ taraf - Filtre Butonu */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFilterToggle}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtrele
        </Button>
      </div>
    </div>
  );
};

