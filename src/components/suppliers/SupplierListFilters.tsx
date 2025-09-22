
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SupplierListFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

const SupplierListFilters = ({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
}: SupplierListFiltersProps) => {
  return (
    <div className="mb-6 flex gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder="🔍 Tedarikçi ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-background border-border shadow-sm hover:border-primary/20 focus:border-primary/40 transition-all duration-200"
        />
      </div>
      <select 
        className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      >
        <option value="">🏷️ Tüm Tipler</option>
        <option value="bireysel">👤 Bireysel</option>
        <option value="kurumsal">🏢 Kurumsal</option>
      </select>
      <select 
        className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">📊 Tüm Durumlar</option>
        <option value="aktif">✅ Aktif</option>
        <option value="pasif">⏸️ Pasif</option>
        <option value="potansiyel">🎯 Potansiyel</option>
      </select>
    </div>
  );
};

export default SupplierListFilters;
