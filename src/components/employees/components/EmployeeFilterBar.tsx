import { useState, useEffect } from "react";
import { Search, Filter, X, Users, Building, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  positionFilter: string;
  setPositionFilter: (value: string) => void;
  hireDateFilter: string;
  setHireDateFilter: (value: string) => void;
}

export const EmployeeFilterBar = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  positionFilter,
  setPositionFilter,
  hireDateFilter,
  setHireDateFilter,
}: EmployeeFilterBarProps) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    const fetchFilterData = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('department, position')
        .order('department');

      if (!error && data) {
        const uniqueDepartments = [...new Set(data.map(item => item.department))] as string[];
        const uniquePositions = [...new Set(data.map(item => item.position))] as string[];
        setDepartments(uniqueDepartments);
        setPositions(uniquePositions);
      }
    };

    fetchFilterData();
  }, []);

  const hasActiveFilters = 
    searchQuery || 
    statusFilter !== "all" || 
    departmentFilter !== "all" || 
    positionFilter !== "all" || 
    hireDateFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setPositionFilter("all");
    setHireDateFilter("all");
  };


  return (
    <div className="space-y-4">
      {/* Ana Arama ve Filtreler */}
      <div className="bg-gradient-to-r from-card/80 to-muted/40 rounded-2xl border border-border/30 shadow-lg backdrop-blur-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Arama */}
          <div className="relative w-[400px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Çalışan adı, email, departman veya pozisyon ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtreler */}
          <div className="flex flex-wrap gap-3">
            {/* Durum Filtresi */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Users className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="aktif">🟢 Aktif</SelectItem>
                <SelectItem value="pasif">⚪ Pasif</SelectItem>
              </SelectContent>
            </Select>

            {/* Departman Filtresi */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[200px]">
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Departman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Departmanlar</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Pozisyon Filtresi */}
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Pozisyon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Pozisyonlar</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* İşe Başlama Tarihi Filtresi */}
            <Select value={hireDateFilter} onValueChange={setHireDateFilter}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="İşe Başlama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tarihler</SelectItem>
                <SelectItem value="this_year">Bu Yıl</SelectItem>
                <SelectItem value="last_year">Geçen Yıl</SelectItem>
                <SelectItem value="last_2_years">Son 2 Yıl</SelectItem>
                <SelectItem value="last_5_years">Son 5 Yıl</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtreleri Temizle */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                Temizle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Aktif Filtreler Özeti */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtreler aktif</span>
            {searchQuery && <span className="px-2 py-1 bg-background rounded text-xs">Arama: "{searchQuery}"</span>}
            {statusFilter !== "all" && <span className="px-2 py-1 bg-background rounded text-xs">Durum</span>}
            {departmentFilter !== "all" && <span className="px-2 py-1 bg-background rounded text-xs">Departman</span>}
            {positionFilter !== "all" && <span className="px-2 py-1 bg-background rounded text-xs">Pozisyon</span>}
            {hireDateFilter !== "all" && <span className="px-2 py-1 bg-background rounded text-xs">Tarih</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Temizle
          </Button>
        </div>
      )}
    </div>
  );
};
