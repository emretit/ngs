import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Clock, TrendingUp, MoreHorizontal, Download, Upload, Mail, Trash2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Supplier } from "@/types/supplier";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { exportSuppliersToExcel } from "@/utils/supplierExcelUtils";
import ImportDialog from "./excel/ImportDialog";

interface SuppliersHeaderProps {
  suppliers?: Supplier[];
}

const SuppliersHeader = ({ suppliers = [] }: SuppliersHeaderProps) => {
  const navigate = useNavigate();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Toplam tedarikçi sayısını hesapla
  const totalCount = suppliers.length;

  // Toplam bakiye hesapla
  const totalBalance = suppliers.reduce((sum, supplier) => sum + supplier.balance, 0);
  
  // Vadesi geçen bakiyeler hesapla (negatif bakiyeler)
  const overdueBalance = suppliers.reduce((sum, supplier) => {
    return supplier.balance < 0 ? sum + Math.abs(supplier.balance) : sum;
  }, 0);

  // Excel export
  const handleExportExcel = () => {
    try {
      exportSuppliersToExcel(suppliers);
      toast.success("Tedarikçiler Excel'e aktarıldı");
    } catch (error) {
      toast.error("Excel'e aktarım sırasında hata oluştu");
      console.error("Export error:", error);
    }
  };

  return (
    <>
      <ImportDialog 
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Tedarikçiler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Tedarikçilerinizi yönetin ve takip edin.
            </p>
          </div>
        </div>
        
        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam tedarikçi sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <Building2 className="h-3 w-3" />
            <span className="font-bold">Toplam Tedarikçi</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>

          {/* Toplam bakiye */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">Toplam Bakiye</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {totalBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </span>
          </div>

          {/* Vadesi geçen bakiyeler */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Vadesi Geçen</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {overdueBalance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </span>
          </div>
        </div>
        
        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <MoreHorizontal className="h-4 w-4" />
                <span>İşlemler</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Excel'e Aktar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Excel'den Yükle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                toast.info("Tedarikçi raporu oluşturuluyor...");
                console.log("Generating supplier report:", suppliers);
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Rapor Oluştur
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                toast.info("Tüm tedarikçilere e-posta gönderiliyor...");
                console.log("Sending email to all suppliers:", suppliers);
              }}>
                <Mail className="h-4 w-4 mr-2" />
                Toplu E-posta
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  toast.warning("Tüm tedarikçiler silinecek!", {
                    action: {
                      label: "Geri Al",
                      onClick: () => console.log("Undo delete all suppliers"),
                    },
                  });
                  console.log("Deleting all suppliers:", suppliers);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Tümünü Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => navigate("/suppliers/new")}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Tedarikçi</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default SuppliersHeader;
