import React from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Users, UserCheck, UserX, UserCog, Briefcase, Clock, TrendingUp, Building2, MoreHorizontal, Download, FileText, Mail, Calculator, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import EmployeesViewToggle from "./header/EmployeesViewToggle";
import type { ViewMode } from "@/types/employee";
import type { Employee } from "@/types/employee";

interface EmployeesHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  employeeStats?: {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    fullTime: number;
    partTime: number;
  };
  totalCosts?: {
    gross_salary: number;
    net_salary: number;
    total_employer_cost: number;
  };
}

const EmployeesHeader = ({ viewMode, setViewMode, employeeStats, totalCosts }: EmployeesHeaderProps) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "₺0";
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statusCards = [
    { key: 'active', icon: UserCheck, label: 'Aktif', color: 'bg-green-100 text-green-800 border-green-200' },
    { key: 'inactive', icon: UserX, label: 'Pasif', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { key: 'onLeave', icon: Clock, label: 'İzinli', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white shadow-lg">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Çalışan Yönetimi
            </h1>
          <p className="text-xs text-muted-foreground/70">
            Tüm çalışanları görüntüle, yönet ve maliyet bilgilerini takip et
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam çalışan sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-600 shadow-sm">
          <Users className="h-3 w-3" />
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {employeeStats?.total || 0}
          </span>
        </div>
        
        {/* Durum kartları */}
        {statusCards.map(({ key, icon: Icon, label, color }) => {
          const count = employeeStats?.[key as keyof typeof employeeStats] || 0;
          
          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color}`}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
            </div>
          );
        })}

        {/* Maliyet kartları */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-800 border-green-200 transition-all duration-200 hover:shadow-sm">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Brüt Maaş</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(totalCosts?.gross_salary)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-purple-100 text-purple-800 border-purple-200 transition-all duration-200 hover:shadow-sm">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span className="font-medium">Net Maaş</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(totalCosts?.net_salary)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-red-100 text-red-800 border-red-200 transition-all duration-200 hover:shadow-sm">
          <Building2 className="h-3 w-3" />
          <span className="font-medium">Toplam Maliyet</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(totalCosts?.total_employer_cost)}
          </span>
        </div>
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <EmployeesViewToggle 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
        />
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300" 
          onClick={() => navigate("/add-employee")}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Çalışan</span>
        </Button>
      </div>
    </div>
  );
};

export default EmployeesHeader;
