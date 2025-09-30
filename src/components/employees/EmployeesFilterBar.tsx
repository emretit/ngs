import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Building2, UserCog } from "lucide-react";

interface EmployeesFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedDepartment?: string;
  setSelectedDepartment?: (value: string) => void;
  selectedPosition?: string;
  setSelectedPosition?: (value: string) => void;
  departments?: Array<{ id: string; name: string }>;
  positions?: Array<string>;
}

const EmployeesFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedDepartment = 'all',
  setSelectedDepartment,
  selectedPosition = 'all',
  setSelectedPosition,
  departments = [],
  positions = []
}: EmployeesFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Ad, soyad, e-posta veya telefon ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="aktif">✅ Aktif</SelectItem>
          <SelectItem value="izinli">🏖️ İzinli</SelectItem>
          <SelectItem value="pasif">❌ Pasif</SelectItem>
        </SelectContent>
      </Select>

      {setSelectedDepartment && departments.length > 0 && (
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[200px]">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Departman" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Departmanlar</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {setSelectedPosition && positions.length > 0 && (
        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
          <SelectTrigger className="w-[200px]">
            <UserCog className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Pozisyon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Pozisyonlar</SelectItem>
            {positions.map((position) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default EmployeesFilterBar;
