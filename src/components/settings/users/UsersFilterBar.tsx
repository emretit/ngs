import { Search, Filter, UserCheck, UserX, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UsersFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedRole: string;
  setSelectedRole: (value: string) => void;
  selectedEmployeeMatch: string;
  setSelectedEmployeeMatch: (value: string) => void;
}

const UsersFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedRole,
  setSelectedRole,
  selectedEmployeeMatch,
  setSelectedEmployeeMatch,
}: UsersFilterBarProps) => {
  const hasActiveFilters = 
    selectedStatus !== 'all' || 
    selectedRole !== 'all' || 
    selectedEmployeeMatch !== 'all' || 
    searchQuery;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedRole("all");
    setSelectedEmployeeMatch("all");
  };

  const roles = [
    'Admin',
    'Yönetici',
    'Satış Müdürü',
    'Satış Temsilcisi',
    'Muhasebe',
    'İnsan Kaynakları'
  ];

  return (
    <div className="flex flex-col gap-3 p-3 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* İlk satır: Arama ve Filtreler */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Arama */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kullanıcı ara (isim, email, telefon, departman, pozisyon)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Durum Filtresi */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="active">✅ Aktif</SelectItem>
            <SelectItem value="inactive">⏸️ Pasif</SelectItem>
          </SelectContent>
        </Select>

        {/* Rol Filtresi */}
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Roller</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Çalışan Eşleşme Filtresi */}
        <Select value={selectedEmployeeMatch} onValueChange={setSelectedEmployeeMatch}>
          <SelectTrigger className="w-[180px]">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Çalışan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="matched">Eşleşmiş</SelectItem>
            <SelectItem value="unmatched">Eşleşmemiş</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtreleri Temizle */}
      {hasActiveFilters && (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Filtreleri Temizle
          </Button>
        </div>
      )}
    </div>
  );
};

export default UsersFilterBar;

