
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, FileDown, FileUp, MoreVertical, FileText, Download, Upload } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductFiltersProps {
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  stockFilter: string;
  setStockFilter: (status: string) => void;
  categories: { id: string; name: string }[];
  totalProducts: number;
  onBulkAction?: (action: string) => void;
  onDownloadTemplate?: () => void;
  onExportExcel?: () => void;
  onImportExcel?: () => void;
}

const ProductFilters = ({
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  categories,
  totalProducts,
  onBulkAction,
  onDownloadTemplate,
  onExportExcel,
  onImportExcel
}: ProductFiltersProps) => {
  return (
    <div className="space-y-6">
      {/* Modern Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Ürünler</h1>
            <Badge variant="secondary" className="rounded-md">
              {totalProducts} ürün
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            Tüm ürünlerinizi buradan yönetebilir ve düzenleyebilirsiniz.
          </p>
        </div>

        {/* Excel Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={onDownloadTemplate}
          >
            <FileText className="w-4 h-4 mr-2" />
            Şablon İndir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={onExportExcel}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel İndir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9"
            onClick={onImportExcel}
          >
            <Upload className="w-4 h-4 mr-2" />
            Excel Yükle
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBulkAction?.("activate")}>
                Seçilenleri Aktifleştir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction?.("deactivate")}>
                Seçilenleri Pasifleştir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction?.("delete")}>
                Seçilenleri Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ürün adı, SKU veya barkod ile arayın..."
            className="pl-10 h-11"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-11">
              <SelectValue placeholder="Tüm Kategoriler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[180px] h-11">
              <SelectValue placeholder="Stok Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Stoklar</SelectItem>
              <SelectItem value="in_stock">Stokta</SelectItem>
              <SelectItem value="low_stock">Az Stok</SelectItem>
              <SelectItem value="out_of_stock">Stok Yok</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
