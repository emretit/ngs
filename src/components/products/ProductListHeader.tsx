import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Package, AlertTriangle, CheckCircle, XCircle, LayoutGrid, List, FileText, Download, Upload, MoreHorizontal, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ProductsGroup {
  all: any[];
  in_stock: any[];
  low_stock: any[];
  out_of_stock: any[];
  active: any[];
  inactive: any[];
}

type ViewType = "grid" | "table";

interface ProductListHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  products: ProductsGroup;
  totalProducts?: number;
  onDownloadTemplate?: () => void;
  onExportExcel?: () => void;
  onImportExcel?: () => void;
  onBulkAction?: (action: string) => void;
}

const ProductListHeader = ({
  activeView,
  setActiveView,
  products,
  totalProducts = 0,
  onDownloadTemplate,
  onExportExcel,
  onImportExcel,
  onBulkAction
}: ProductListHeaderProps) => {

  // Toplam ürün sayısını hesapla
  const totalCount = products.all.length;

  // Durum kartları için veri
  const statusCards = [
    { status: 'in_stock', icon: CheckCircle, label: 'Stokta', color: 'bg-green-100 text-green-800' },
    { status: 'low_stock', icon: AlertTriangle, label: 'Düşük Stok', color: 'bg-yellow-100 text-yellow-800' },
    { status: 'out_of_stock', icon: XCircle, label: 'Tükendi', color: 'bg-red-100 text-red-800' },
    { status: 'active', icon: CheckCircle, label: 'Aktif', color: 'bg-blue-100 text-blue-800' },
    { status: 'inactive', icon: Package, label: 'Pasif', color: 'bg-gray-100 text-gray-800' }
  ];

  // View Toggle Component
  const ProductsViewToggle = () => (
    <div className="flex rounded-md overflow-hidden border bg-background">
      <Button
        type="button"
        variant={activeView === "table" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-0 h-8"
        onClick={() => setActiveView("table")}
      >
        <List className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden sm:inline">Liste</span>
      </Button>
      <Button
        type="button"
        variant={activeView === "grid" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-0 h-8"
        onClick={() => setActiveView("grid")}
      >
        <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  );

  // Excel Download Dropdown
  const ExcelDownloadDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Excel İndir</span>
          <MoreHorizontal className="h-3 w-3 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Excel İndirme Seçenekleri
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={onDownloadTemplate} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          Şablon İndir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
          <Download className="h-4 w-4 mr-2" />
          Tüm Ürünleri İndir ({totalCount} ürün)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Excel Upload Button
  const ExcelUploadButton = () => (
    <Button
      variant="outline"
      size="sm"
      className="h-8 flex items-center gap-1.5"
      onClick={onImportExcel}
    >
      <Upload className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Excel Yükle</span>
    </Button>
  );

  // Settings/More Actions Dropdown
  const SettingsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Toplu İşlemler
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onBulkAction?.("activate")} className="cursor-pointer">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Seçilenleri Aktifleştir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onBulkAction?.("deactivate")} className="cursor-pointer">
          <XCircle className="h-4 w-4 mr-2 text-red-600" />
          Seçilenleri Pasifleştir
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onBulkAction?.("delete")} className="cursor-pointer text-red-600">
          <XCircle className="h-4 w-4 mr-2" />
          Seçilenleri Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Ürün Kataloğu
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Envanter ve ürün katalogunu yönetin ve takip edin.
            </p>
          </div>

          {/* Orta - Durum Kartları ve Toplam */}
          <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
            {/* Toplam ürün sayısı */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
              <Package className="h-3 w-3" />
              <span className="font-bold">Toplam</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                {totalCount}
              </span>
            </div>

            {/* Durum kartları */}
            {statusCards.map(({ status, icon: Icon, label, color }) => {
              const count = products[status as keyof ProductsGroup]?.length || 0;

              return (
                <div
                  key={status}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color} border-gray-200`}
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

          {/* Sağ taraf - View Toggle + Ana Buton */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <ProductsViewToggle />

            <Button
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300 h-8 px-4"
              onClick={() => window.location.href = '/product-form'}
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Ürün</span>
            </Button>
          </div>
        </div>

        {/* Secondary Actions Row */}
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            {/* Excel Download */}
            <ExcelDownloadDropdown />

            {/* Excel Upload */}
            <ExcelUploadButton />

            {/* Settings */}
            <SettingsDropdown />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductListHeader;