
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import ExcelImportExport from "./ExcelImportExport";
import { Supplier } from "@/types/supplier";

interface SupplierListHeaderProps {
  suppliers?: Supplier[];
}

const SupplierListHeader = ({ suppliers = [] }: SupplierListHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tedarikçiler</h1>
        <p className="text-muted-foreground">
          Tedarikçilerinizi yönetin
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 w-full sm:w-auto">
        <ExcelImportExport suppliers={suppliers} />
        <Button asChild className="w-full sm:w-auto">
          <Link to="/suppliers/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tedarikçi Ekle
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default SupplierListHeader;
