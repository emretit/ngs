
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupplierTableRow from "./SupplierTableRow";
import { Supplier } from "@/types/supplier";
import { cn } from "@/lib/utils";

interface SupplierListProps {
  suppliers: Supplier[] | undefined;
  isLoading: boolean;
  sortField: "name" | "balance" | "company";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "name" | "balance" | "company") => void;
}

const SupplierList = ({ suppliers, isLoading, sortField, sortDirection, onSortFieldChange }: SupplierListProps) => {
  const getSortIcon = (field: "name" | "balance" | "company") => {
    if (field !== sortField) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="bg-gradient-to-br from-card via-muted/20 to-background rounded-2xl shadow-2xl border border-border/10 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50"></div>
      <div className="relative z-10 p-6">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                <TableHead 
                  className={cn(
                    "h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onSortFieldChange("name")}
                >
                  <div className="flex items-center">
                    <span>🏭 Şirket/Tedarikçi</span>
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  👤 Yetkili Kişi
                </TableHead>
                <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  📞 İletişim
                </TableHead>
                <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  🏷️ Tip
                </TableHead>
                <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  📊 Durum
                </TableHead>
                <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  🤝 Temsilci
                </TableHead>
                <TableHead 
                  className={cn(
                    "h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onSortFieldChange("balance")}
                >
                  <div className="flex items-center">
                    <span>💰 Bakiye</span>
                    {getSortIcon("balance")}
                  </div>
                </TableHead>
                <TableHead className="h-12 px-4 text-right align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  ⚙️ İşlemler
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : suppliers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Tedarikçi bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                suppliers?.map((supplier) => (
                  <SupplierTableRow key={supplier.id} supplier={supplier} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default SupplierList;
