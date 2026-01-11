import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeNode {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  position?: string;
  department?: string;
  department_id?: string | null;
  manager_id?: string | null;
  status?: string;
  children?: EmployeeNode[];
  avatar_url?: string | null;
}

export interface DepartmentNode {
  id: string;
  name: string;
  description?: string | null;
  head_id?: string | null;
  head?: EmployeeNode | null;
  employees: EmployeeNode[];
  parent_id?: string | null;
  children?: DepartmentNode[];
}

export const useOrgChartData = (
  companyId: string | undefined,
  searchQuery: string,
  selectedStatus: string,
  selectedPosition: string
) => {
  // Fetch departments with parent_id for hierarchy
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["org-chart-departments", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("departments")
        .select("id, name, description, head_id, parent_id")
        
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name");

      if (error) throw error;
      return data as DepartmentNode[];
    },
    enabled: !!companyId,
  });

  // Fetch employees with department_id if available
  const { data: allEmployees = [], isLoading: isLoadingEmps } = useQuery({
    queryKey: ["org-chart-employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, position, department, manager_id, status, avatar_url")
        
        .order("first_name");

      if (error) throw error;
      return data as EmployeeNode[];
    },
    enabled: !!companyId,
  });

  // Filter employees based on search and status
  const employees = useMemo(() => {
    let filtered = allEmployees;

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(emp => emp.status === selectedStatus);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query)
      );
    }

    // Position filter
    if (selectedPosition !== "all") {
      filtered = filtered.filter(emp => emp.position === selectedPosition);
    }

    return filtered;
  }, [allEmployees, searchQuery, selectedStatus, selectedPosition]);

  const isLoading = isLoadingDepts || isLoadingEmps;

  return {
    departments,
    employees,
    allEmployees,
    isLoading
  };
};

