
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, Calendar } from "lucide-react";
import { TaskStatus } from "@/types/task";
import { getStatusDisplay } from "../utils/taskDisplayUtils";

// Using the more complete Employee type from types/employee.ts
interface TaskFilterEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  status?: string;
}

interface TasksFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedEmployee: string | null;
  setSelectedEmployee: (value: string | null) => void;
  selectedType: string | null;
  setSelectedType: (value: string | null) => void;
  selectedStatus: TaskStatus | null;
  setSelectedStatus: (value: TaskStatus | null) => void;
  employees?: TaskFilterEmployee[];
}

const TasksFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedEmployee,
  setSelectedEmployee,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  employees
}: TasksFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Aktivite başlığı veya açıklama ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select
        value={selectedStatus || "all"}
        onValueChange={(value) => setSelectedStatus(value === "all" ? null : value as TaskStatus)}
      >
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="todo">🔴 Yapılacak</SelectItem>
          <SelectItem value="in_progress">🟡 Devam Ediyor</SelectItem>
          <SelectItem value="completed">🟢 Tamamlandı</SelectItem>
          <SelectItem value="postponed">⚪ Ertelendi</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={selectedEmployee || "all"}
        onValueChange={(value) => setSelectedEmployee(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <User className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Görevli" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Görevliler</SelectItem>
          {employees?.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedType || "all"}
        onValueChange={(value) => setSelectedType(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Aktivite Tipi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Tipler</SelectItem>
          <SelectItem value="opportunity">Fırsat</SelectItem>
          <SelectItem value="proposal">Teklif</SelectItem>
          <SelectItem value="general">Genel</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TasksFilterBar;
