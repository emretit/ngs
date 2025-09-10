import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import ProductExcelActions from "./ProductExcelActions";

interface ProductListHeaderProps {
  totalProducts?: number;
  onDownloadTemplate?: () => void;
  onExportExcel?: () => void;
  onImportExcel?: () => void;
  onBulkAction?: (action: string) => void;
}

const ProductListHeader = ({ 
  totalProducts = 0,
  onDownloadTemplate,
  onExportExcel,
  onImportExcel,
  onBulkAction
}: ProductListHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ürünler</h1>
        <p className="text-muted-foreground">
          Tüm ürünlerinizi buradan yönetebilir ve düzenleyebilirsiniz
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 w-full sm:w-auto">
        <ProductExcelActions 
          totalProducts={totalProducts}
          onDownloadTemplate={onDownloadTemplate}
          onExportExcel={onExportExcel}
          onImportExcel={onImportExcel}
          onBulkAction={onBulkAction}
        />
        <Button asChild className="w-full sm:w-auto">
          <Link to="/product-form" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ürün Ekle
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ProductListHeader;
