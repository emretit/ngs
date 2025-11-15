import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, TrendingUp, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Customer } from "@/types/customer";
import { formatCurrency } from "@/utils/formatters";

interface CustomersHeaderProps {
  customers?: Customer[];
  totalCount?: number;
  statistics?: {
    totalCount: number;
    totalBalance: number;
    overdueBalance: number;
  };
}

const CustomersHeader = ({ 
  customers = [],
  totalCount: propTotalCount,
  statistics
}: CustomersHeaderProps) => {
  const navigate = useNavigate();

  // Statistics varsa onu kullan, yoksa customers'tan hesapla (fallback)
  const totalCount = statistics?.totalCount ?? propTotalCount ?? customers.length;
  const totalBalance = statistics?.totalBalance ?? customers.reduce((sum, customer) => sum + customer.balance, 0);
  const overdueBalance = statistics?.overdueBalance ?? customers.reduce((sum, customer) => {
    return customer.balance < 0 ? sum + Math.abs(customer.balance) : sum;
  }, 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
            <User className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Müşteriler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Müşterilerinizi yönetin ve takip edin.
            </p>
          </div>
        </div>
        
        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam müşteri sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
            <Users className="h-3 w-3" />
            <span className="font-bold">Toplam Müşteri</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>

          {/* Toplam bakiye */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">Toplam Bakiye</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          {/* Vadesi geçen bakiyeler */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Vadesi Geçen</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {formatCurrency(overdueBalance)}
            </span>
          </div>
        </div>
        
        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => navigate("/contacts/new")}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Müşteri</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default CustomersHeader;
