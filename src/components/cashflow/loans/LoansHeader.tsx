import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, TrendingDown, TrendingUp } from "lucide-react";

interface LoansHeaderProps {
  activeLoansCount: number;
  totalLoanAmount: number;
  totalDebt: number;
  thisMonthPayment: number;
  onAddNew: () => void;
}

const LoansHeader = ({ 
  activeLoansCount, 
  totalLoanAmount, 
  totalDebt,
  thisMonthPayment,
  onAddNew
}: LoansHeaderProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
          <Calculator className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Krediler
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Kredi işlemlerinizi yönetin ve takip edin.
          </p>
        </div>
      </div>
      
      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Aktif Kredi Sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-indigo-600 shadow-sm">
          <span className="font-bold">Aktif Kredi</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {activeLoansCount}
          </span>
        </div>
        
        {/* Toplam Kredi Tutarı */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-blue-100 text-blue-800 border-blue-200">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Toplam</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(totalLoanAmount)}
          </span>
        </div>
        
        {/* Kalan Borç */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-red-100 text-red-800 border-red-200">
          <TrendingDown className="h-3 w-3" />
          <span className="font-medium">Kalan Borç</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(totalDebt)}
          </span>
        </div>

        {/* Bu Ay Ödenecek */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-orange-100 text-orange-800 border-orange-200">
          <Calculator className="h-3 w-3" />
          <span className="font-medium">Bu Ay</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(thisMonthPayment)}
          </span>
        </div>
      </div>
      
      {/* Sağ taraf - Buton */}
      <div className="flex items-center gap-2">
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-600 shadow-lg transition-all duration-300 text-white" 
          onClick={onAddNew}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Kredi</span>
        </Button>
      </div>
    </div>
  );
};

export default LoansHeader;

