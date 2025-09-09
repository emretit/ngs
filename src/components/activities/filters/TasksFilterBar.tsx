
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gradient-to-r from-card/80 to-muted/40 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
      <div className="relative w-[400px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Görev ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select
        value={selectedEmployee || "all"}
        onValueChange={(value) => setSelectedEmployee(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Atanan seç" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tümü</SelectItem>
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
          <SelectValue placeholder="Görev tipi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tümü</SelectItem>
          <SelectItem value="opportunity">Fırsat</SelectItem>
          <SelectItem value="proposal">Teklif</SelectItem>
          <SelectItem value="general">Genel</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={selectedStatus || "all"}
        onValueChange={(value) => setSelectedStatus(value === "all" ? null : value as TaskStatus)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tümü</SelectItem>
          <SelectItem value="todo">{getStatusDisplay("todo")}</SelectItem>
          <SelectItem value="in_progress">{getStatusDisplay("in_progress")}</SelectItem>
          <SelectItem value="completed">{getStatusDisplay("completed")}</SelectItem>
          <SelectItem value="postponed">{getStatusDisplay("postponed")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TasksFilterBar;
