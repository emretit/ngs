
import { useState } from "react";
import EmployeeTable from "../EmployeeTable";
import { EmployeeGrid } from "../EmployeeGrid";
import { EmployeeFilterBar } from "./EmployeeFilterBar";
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
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [hireDateFilter, setHireDateFilter] = useState<string>('all');

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

    // Position filter
    const matchesPosition = 
      positionFilter === 'all' || 
      emp.position === positionFilter;

    // Hire date filter
    const matchesHireDate = (() => {
      if (hireDateFilter === 'all') return true;
      
      const hireDate = new Date(emp.hire_date);
      const now = new Date();
      const currentYear = now.getFullYear();
      
      switch (hireDateFilter) {
        case 'this_year':
          return hireDate.getFullYear() === currentYear;
        case 'last_year':
          return hireDate.getFullYear() === currentYear - 1;
        case 'last_2_years':
          return hireDate.getFullYear() >= currentYear - 2;
        case 'last_5_years':
          return hireDate.getFullYear() >= currentYear - 5;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesPosition && matchesHireDate;
  });

  return (
    <div className="space-y-6">
      <EmployeeFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        positionFilter={positionFilter}
        setPositionFilter={setPositionFilter}
        hireDateFilter={hireDateFilter}
        setHireDateFilter={setHireDateFilter}
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
    </div>
  );
};
