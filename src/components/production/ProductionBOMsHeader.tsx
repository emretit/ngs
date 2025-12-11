import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Plus, Package, Layers, FileText } from "lucide-react";
import ProductionBOMsViewToggle, { BOMsViewType } from "./ProductionBOMsViewToggle";
import { BOM } from "@/types/production";

interface ProductionBOMsHeaderProps {
  activeView: BOMsViewType;
  setActiveView: (view: BOMsViewType) => void;
  boms?: BOM[];
}

const ProductionBOMsHeader = ({ 
  activeView,
  setActiveView,
  boms = []
}: ProductionBOMsHeaderProps) => {
  const navigate = useNavigate();

  // İstatistikleri hesapla
  const totalCount = boms.length;
  const withProduct = boms.filter(bom => bom.product_id || bom.product_name).length;
  const withoutProduct = boms.filter(bom => !bom.product_id && !bom.product_name).length;
  const totalItems = boms.reduce((sum, bom) => sum + (bom.items?.length || 0), 0);
  const avgItems = totalCount > 0 ? Math.round(totalItems / totalCount) : 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/production")}
            className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary hover:border-primary/20 transition-all duration-200 hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Geri</span>
          </Button>
          <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
            <Settings className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Ürün Reçeteleri
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Ürün reçetelerini yönetin, düzenleyin ve yeni reçeteler oluşturun
            </p>
          </div>
        </div>
        
        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam reçete sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <span className="font-bold">Toplam</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>
          
          {/* Ürünü olan reçeteler */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-green-100 text-green-800 border-gray-200">
            <Package className="h-3 w-3" />
            <span className="font-medium">Ürünlü</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {withProduct}
            </span>
          </div>
          
          {/* Ürünü olmayan reçeteler */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-gray-100 text-gray-800 border-gray-200">
            <FileText className="h-3 w-3" />
            <span className="font-medium">Ürünsüz</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {withoutProduct}
            </span>
          </div>
          
          {/* Ortalama bileşen sayısı */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-purple-100 text-purple-800 border-gray-200">
            <Layers className="h-3 w-3" />
            <span className="font-medium">Ort. Bileşen</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {avgItems}
            </span>
          </div>
        </div>
        
        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <ProductionBOMsViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300"
            onClick={() => navigate("/production/bom/new")}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Ürün Reçetesi</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProductionBOMsHeader;
