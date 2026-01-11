import React, { useState, useMemo } from "react";
import { logger } from '@/utils/logger';
import { useNavigate } from "react-router-dom";
import { OrgChart } from "@/components/organization/OrgChart";
import OrganizationPageHeader from "@/components/organization/OrganizationPageHeader";
import { AddDepartmentDialog } from "@/components/organization/AddDepartmentDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Building2, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";

export default function OrganizationChart() {
  const navigate = useNavigate();
  const { companyId } = useCompany();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] = useState(false);

  // Fetch departments for stats and filter (with parent_id for hierarchy)
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
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
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch employees for stats
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["org-chart-employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, position, department, manager_id, status")
        
        .order("first_name");

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Get unique positions for filter
  const positions = useMemo(() => {
    const uniquePositions = new Set<string>();
    employees.forEach(emp => {
      if (emp.position) {
        uniquePositions.add(emp.position);
      }
    });
    return Array.from(uniquePositions).sort();
  }, [employees]);

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    const totalDepartments = departments.length;
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === "aktif").length;
    const departmentHeads = departments.filter(dept => dept.head_id !== null).length;

    return {
      totalDepartments,
      totalEmployees,
      activeEmployees,
      departmentHeads
    };
  }, [departments, employees]);

  const handleCreateDepartment = () => {
    logger.debug("Departman Ekle butonuna tıklandı");
    setIsAddDepartmentDialogOpen(true);
    logger.debug("Dialog state true olarak ayarlandı");
  };

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <OrganizationPageHeader
        totalDepartments={stats.totalDepartments}
        totalEmployees={stats.totalEmployees}
        activeEmployees={stats.activeEmployees}
        departmentHeads={stats.departmentHeads}
        onCreateDepartment={handleCreateDepartment}
      />

      {/* Arama ve Filtreleme */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Çalışan veya departman adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[180px]">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Departman" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Departmanlar</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="pasif">Pasif</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
          <SelectTrigger className="w-[180px]">
            <Briefcase className="mr-2 h-4 w-4" />
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
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4">
        <OrgChart
          searchQuery={searchQuery}
          selectedDepartment={selectedDepartment}
          selectedStatus={selectedStatus}
          selectedPosition={selectedPosition}
        />
      </div>

      {/* Add Department Dialog */}
      <AddDepartmentDialog
        open={isAddDepartmentDialogOpen}
        onOpenChange={setIsAddDepartmentDialogOpen}
        departments={departments}
        employees={employees}
      />
    </div>
  );
}

