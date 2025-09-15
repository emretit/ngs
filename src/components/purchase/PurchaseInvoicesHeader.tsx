import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FileUp } from "lucide-react";

interface PurchaseInvoicesHeaderProps {
  invoices?: any[];
  incomingInvoices?: any[];
  earchiveInvoices?: any[];
}

const PurchaseInvoicesHeader = ({ 
  invoices = [], 
  incomingInvoices = [], 
  earchiveInvoices = [] 
}: PurchaseInvoicesHeaderProps) => {
  const navigate = useNavigate();

  // Toplam fatura sayısını hesapla
  const totalCount = invoices.length + incomingInvoices.length + earchiveInvoices.length;

  // Belge tipi kartları için veri
  const documentTypeCards = [
    { type: 'purchase', icon: FileUp, label: 'Normal Fatura', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { type: 'incoming', icon: FileUp, label: 'Gelen E-Fatura', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { type: 'earchive', icon: FileUp, label: 'Gelen E-Arşiv', color: 'bg-purple-100 text-purple-800 border-purple-200' }
  ];

  // Belge tipi sayılarını hesapla
  const documentTypeCounts = {
    purchase: invoices.length,
    incoming: incomingInvoices.length,
    earchive: earchiveInvoices.length
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Alış Faturaları
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Tüm alış faturalarınızı yönetin ve takip edin.
          </p>
        </div>
        
        {/* Orta - Durum Kartları ve Toplam */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam fatura sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <span className="font-bold">Toplam</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>
          
          {/* Belge tipi kartları */}
          {documentTypeCards.map(({ type, icon: Icon, label, color }) => {
            const count = documentTypeCounts[type as keyof typeof documentTypeCounts] || 0;
            
            return (
              <div
                key={type}
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
        </div>
        
        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => navigate('/purchase-invoices/create')}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Fatura</span>
          </Button>
        </div>
      </div>
  );
};

export default PurchaseInvoicesHeader;
