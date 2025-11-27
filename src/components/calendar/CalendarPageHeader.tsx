import { Calendar as CalendarIcon } from 'lucide-react';

export const CalendarPageHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
          <CalendarIcon className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Genel Takvim
          </h1>
          <p className="text-sm text-muted-foreground">
            Tüm aktiviteler, siparişler ve teslimatlarınızı tek bir yerde görüntüleyin
          </p>
        </div>
      </div>
    </div>
  );
};

