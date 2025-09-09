
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import ExcelImportExport from "./ExcelImportExport";
import { Customer } from "@/types/customer";

interface CustomerListHeaderProps {
  customers?: Customer[];
}

const CustomerListHeader = ({ customers = [] }: CustomerListHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Müşteriler</h1>
        <p className="text-muted-foreground">
          Müşteri ve tedarikçilerinizi yönetin
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 w-full sm:w-auto">
        <ExcelImportExport customers={customers} />
        <Button asChild className="w-full sm:w-auto">
          <Link to="/contacts/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Müşteri Ekle
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CustomerListHeader;
