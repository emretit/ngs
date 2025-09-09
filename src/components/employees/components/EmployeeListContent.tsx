
import { useState } from "react";
import EmployeeTable from "../EmployeeTable";
import { EmployeeGrid } from "../EmployeeGrid";
import { FilterBar } from "../FilterBar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Employee, ViewMode } from "@/types/employee";

interface EmployeeListContentProps {
  employees: Employee[];
  isLoading: boolean;
  viewMode: ViewMode;
}

export const EmployeeListContent = ({
  employees,
  isLoading,
  viewMode
}: EmployeeListContentProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const filteredEmployees = employees.filter(emp => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      emp.status === statusFilter;
    
    // Department filter
    const matchesDepartment = 
      departmentFilter === 'all' || 
      emp.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <>
      <div className="relative flex-1 mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Çalışan ara..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
      />

      {viewMode === 'table' ? (
        <EmployeeTable 
          employees={filteredEmployees} 
          isLoading={isLoading} 
        />
      ) : (
        <EmployeeGrid 
          employees={filteredEmployees} 
          isLoading={isLoading} 
        />
      )}
    </>
  );
};
