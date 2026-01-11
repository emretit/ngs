import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, Users, TrendingUp, Calculator, DollarSign, Calendar, Plus, Settings } from "lucide-react";

interface TimePayrollHeaderProps {
  stats?: {
    totalEmployees: number;
    presentToday: number;
    totalHours: number;
    overtimeHours: number;
    calculatedPayrolls: number;
    totalCost: number;
  };
  onCalculatePayroll?: () => void;
  onPayrollSettings?: () => void;
}

const TimePayrollHeader = ({ 
  stats, 
  onCalculatePayroll,
  onPayrollSettings 
}: TimePayrollHeaderProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}s`;
  };

  // Genel stat kartlar - hem puantaj hem bordro için
  const allStats = [
    { 
      icon: Users, 
      label: 'Toplam Çalışan', 
      value: stats?.totalEmployees || 0,
      color: 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600' 
    },
    { 
      icon: TrendingUp, 
      label: 'Bugün Mevcut', 
      value: stats?.presentToday || 0,
      color: 'bg-green-100 text-green-800 border-green-200' 
    },
    { 
      icon: Clock, 
      label: 'Toplam Saat', 
      value: formatHours(stats?.totalHours || 0),
      color: 'bg-purple-100 text-purple-800 border-purple-200' 
    },
    { 
      icon: Calculator, 
      label: 'Hesaplanan Bordro', 
      value: stats?.calculatedPayrolls || 0,
      color: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    { 
      icon: DollarSign, 
      label: 'Toplam Maliyet', 
      value: formatCurrency(stats?.totalCost || 0),
      color: 'bg-red-100 text-red-800 border-red-200' 
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white shadow-lg">
          <Clock className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Puantaj ve Bordro
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Çalışma saatlerini takip edin ve bordro hesaplamalarını yönetin
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {allStats.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color}`}
          >
            <Icon className="h-3 w-3" />
            <span className="font-medium">{label}</span>
            <span className={`${color.includes('gradient') ? 'bg-white/20' : 'bg-white/50'} px-1.5 py-0.5 rounded-full text-xs font-bold`}>
              {value}
            </span>
          </div>
        ))}
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        {onPayrollSettings && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPayrollSettings}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Ayarlar</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default TimePayrollHeader;
