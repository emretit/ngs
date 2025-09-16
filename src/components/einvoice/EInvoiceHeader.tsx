import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText } from "lucide-react";

interface EInvoiceHeaderProps {
  totalCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const EInvoiceHeader = ({ 
  totalCount, 
  onRefresh, 
  isRefreshing = false 
}: EInvoiceHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            E-Faturalar
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Gelen işlenmemiş e-faturaların yönetimi.
          </p>
        </div>
        
        {/* Orta - Toplam Sayı */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-orange-600 to-orange-700 text-white border border-orange-600 shadow-sm">
            <FileText className="h-3 w-3" />
            <span className="font-bold">Toplam</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>
        </div>
        
        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button 
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg transition-all duration-300" 
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>E-Fatura Çek</span>
            </Button>
          )}
        </div>
      </div>
  );
};

export default EInvoiceHeader;
