
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronUp, ChevronDown, Building2, User, Phone, Tag, BarChart3, Users, DollarSign, Settings } from "lucide-react";
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
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
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
              <TableRow className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-gray-200 shadow-sm">
                <TableHead 
                  className={cn(
                    "w-[20%] h-12 px-4 text-left align-middle font-bold text-green-700 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-green-100/50 transition-colors"
                  )}
                  onClick={() => onSortFieldChange("company")}
                >
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>Şirket/Tedarikçi</span>
                    {getSortIcon("company")}
                  </div>
                </TableHead>
                <TableHead className="w-[15%] h-12 px-4 text-left align-middle font-bold text-green-700 whitespace-nowrap text-sm tracking-wide">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>Yetkili Kişi</span>
                  </div>
                </TableHead>
                <TableHead className="w-[18%] h-12 px-4 text-left align-middle font-bold text-green-700 whitespace-nowrap text-sm tracking-wide">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>İletişim</span>
                  </div>
                </TableHead>
                <TableHead className="w-[10%] h-12 px-4 text-center align-middle font-bold text-green-700 whitespace-nowrap text-sm tracking-wide">
                  <div className="flex items-center justify-center">
                    <Tag className="h-4 w-4 mr-2" />
                    <span>Tip</span>
                  </div>
                </TableHead>
                <TableHead className="w-[10%] h-12 px-4 text-center align-middle font-bold text-green-700 whitespace-nowrap text-sm tracking-wide">
                  <div className="flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <span>Durum</span>
                  </div>
                </TableHead>
                <TableHead className="w-[12%] h-12 px-4 text-left align-middle font-bold text-green-700 whitespace-nowrap text-sm tracking-wide">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Temsilci</span>
                  </div>
                </TableHead>
                <TableHead 
                  className={cn(
                    "w-[10%] h-12 px-4 text-center align-middle font-bold text-green-700 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-green-100/50 transition-colors"
                  )}
                  onClick={() => onSortFieldChange("balance")}
                >
                  <div className="flex items-center justify-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>Bakiye</span>
                    {getSortIcon("balance")}
                  </div>
                </TableHead>
                <TableHead className="w-[5%] h-12 px-4 text-right align-middle font-bold text-green-700 whitespace-nowrap text-sm tracking-wide">
                  <div className="flex items-center justify-end">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>İşlemler</span>
                  </div>
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
