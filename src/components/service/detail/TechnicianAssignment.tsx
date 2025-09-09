
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TechnicianAssignmentProps {
  assignedTo: string | undefined;
  setAssignedTo: (id: string | undefined) => void;
}

export const TechnicianAssignment: React.FC<TechnicianAssignmentProps> = ({
  assignedTo,
  setAssignedTo
}) => {
  // Get the list of technicians
  const { data: technicians } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department")
        .eq("department", "Teknik")
        .order("first_name");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get all employees as fallback
  const { data: allEmployees } = useQuery({
    queryKey: ["all-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department")
        .order("first_name");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Prepare the employees list for the dropdown
  const employees = technicians?.length ? technicians : allEmployees || [];

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">Teknisyen</label>
      <Select
        value={assignedTo || "unassigned"}
        onValueChange={(value) => setAssignedTo(value === "unassigned" ? undefined : value)}
      >
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Teknisyen seçiniz" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Atanmamış</SelectItem>
          {employees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
