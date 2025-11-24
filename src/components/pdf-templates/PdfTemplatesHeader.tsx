import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PdfTemplate } from "@/types/pdf-template";
import PdfTemplatesViewToggle from "./PdfTemplatesViewToggle";

interface PdfTemplatesHeaderProps {
  templates?: PdfTemplate[];
  activeView: "grid" | "list";
  setActiveView: (view: "grid" | "list") => void;
  totalCount?: number;
  statistics?: {
    totalCount: number;
    quoteCount: number;
    invoiceCount: number;
    proposalCount: number;
    serviceCount?: number;
  };
  onCreateTemplate: () => void;
}

const PdfTemplatesHeader = ({
  templates = [],
  activeView,
  setActiveView,
  totalCount: propTotalCount,
  statistics,
  onCreateTemplate,
}: PdfTemplatesHeaderProps) => {
  // Statistics varsa onu kullan, yoksa templates'ten hesapla (fallback)
  const totalCount = statistics?.totalCount ?? propTotalCount ?? templates.length;
  const quoteCount = statistics?.quoteCount ?? templates.filter(t => t.type === 'quote').length;
  const invoiceCount = statistics?.invoiceCount ?? templates.filter(t => t.type === 'invoice').length;
  const proposalCount = statistics?.proposalCount ?? templates.filter(t => t.type === 'proposal').length;
  const serviceCount = statistics?.serviceCount ?? 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            PDF Şablonları
          </h1>
          <p className="text-xs text-muted-foreground/70">
            PDF şablonlarını yönetin ve düzenleyin.
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam şablon sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
          <FileText className="h-3 w-3" />
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>

        {/* Teklif */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
          <FileText className="h-3 w-3" />
          <span className="font-medium">Teklif</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {quoteCount}
          </span>
        </div>

        {/* Fatura */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
          <FileText className="h-3 w-3" />
          <span className="font-medium">Fatura</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {invoiceCount}
          </span>
        </div>

        {/* Öneri */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
          <FileText className="h-3 w-3" />
          <span className="font-medium">Öneri</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {proposalCount}
          </span>
        </div>

        {/* Servis */}
        {serviceCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300">
            <FileText className="h-3 w-3" />
            <span className="font-medium">Servis</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {serviceCount}
            </span>
          </div>
        )}

      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <PdfTemplatesViewToggle 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onCreateTemplate}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Şablon</span>
        </Button>
      </div>
    </div>
  );
};

export default PdfTemplatesHeader;

