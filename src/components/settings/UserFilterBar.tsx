import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, Calendar, Shield } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface UserFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedRole: string;
  setSelectedRole: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedDepartment?: string;
  setSelectedDepartment?: (value: string) => void;
  departments?: Array<{ id: string; name: string }>;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const UserFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus,
  selectedDepartment = 'all',
  setSelectedDepartment,
  departments = [],
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: UserFilterBarProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Arama */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Kullanıcı adı, email veya departman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Rol Filtresi */}
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full lg:w-[180px] h-10 border-gray-200">
              <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Roller</SelectItem>
              <SelectItem value="admin">👑 Admin</SelectItem>
              <SelectItem value="manager">👨‍💼 Yönetici</SelectItem>
              <SelectItem value="sales">💼 Satış</SelectItem>
              <SelectItem value="viewer">👁️ Görüntüleyici</SelectItem>
            </SelectContent>
          </Select>

          {/* Durum Filtresi */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full lg:w-[180px] h-10 border-gray-200">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">✅ Aktif</SelectItem>
              <SelectItem value="inactive">❌ Pasif</SelectItem>
              <SelectItem value="pending">⏳ Beklemede</SelectItem>
            </SelectContent>
          </Select>

          {/* Departman Filtresi */}
          {setSelectedDepartment && departments.length > 0 && (
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full lg:w-[200px] h-10 border-gray-200">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
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
        </div>
      </div>
    </div>
  );
};

export { UserFilterBar };
export default UserFilterBar;
