import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, Warehouse } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InventoryCountsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedWarehouse: string;
  setSelectedWarehouse: (warehouse: string) => void;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const InventoryCountsFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedWarehouse,
  setSelectedWarehouse,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: InventoryCountsFilterBarProps) => {
  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name, code")
        .eq("company_id", profile?.company_id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Sayım no, referans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-[160px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="pending">⏳ Bekleyen</SelectItem>
          <SelectItem value="approved">✅ Onaylı</SelectItem>
          <SelectItem value="completed">✔️ Tamamlandı</SelectItem>
          <SelectItem value="cancelled">❌ İptal</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
        <SelectTrigger className="w-[180px]">
          <Warehouse className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Depo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Depolar</SelectItem>
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name}{warehouse.code ? ` (${warehouse.code})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {setStartDate && setEndDate && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DatePicker
            date={startDate}
            onSelect={setStartDate}
            placeholder="Başlangıç"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <DatePicker
            date={endDate}
            onSelect={setEndDate}
            placeholder="Bitiş"
          />
        </div>
      )}
    </div>
  );
};

export default InventoryCountsFilterBar;

