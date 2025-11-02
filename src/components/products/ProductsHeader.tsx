import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/types/product";
import ProductsViewToggle from "./ProductsViewToggle";

interface ProductsHeaderProps {
  products?: Product[];
  activeView: "grid" | "table";
  setActiveView: (view: "grid" | "table") => void;
}

const ProductsHeader = ({ products = [], activeView, setActiveView }: ProductsHeaderProps) => {
  const navigate = useNavigate();

  // Toplam ürün sayısını hesapla
  const totalCount = products.length;

  // Stok durumlarına göre sayıları hesapla
  const inStockCount = products.filter(p => p.stock_quantity > 5).length;
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
  
  // Aktif/Pasif sayıları
  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = products.filter(p => !p.is_active).length;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
            <Package className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Ürünler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Envanter ve ürün katalogunu yönetin ve takip edin.
            </p>
          </div>
        </div>
        
        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam ürün sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-700 text-white border border-purple-600 shadow-sm">
            <Package className="h-3 w-3" />
            <span className="font-bold">Toplam Ürün</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCount}
            </span>
          </div>

          {/* Stokta */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
            <CheckCircle className="h-3 w-3" />
            <span className="font-medium">Stokta</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {inStockCount}
            </span>
          </div>

          {/* Düşük Stok */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-medium">Düşük Stok</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {lowStockCount}
            </span>
          </div>

          {/* Tükendi */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
            <XCircle className="h-3 w-3" />
            <span className="font-medium">Tükendi</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {outOfStockCount}
            </span>
          </div>
        </div>
        
        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <ProductsViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => navigate('/product-form')}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Ürün</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProductsHeader;

