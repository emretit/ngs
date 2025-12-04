
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./types";

interface TaskAssignmentProps {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

const TaskAssignment = ({ watch, setValue }: TaskAssignmentProps) => {
  const assigneeId = watch("assignee_id");

  // Fetch employees for assignee dropdown
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees-for-assignee"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, status")
        .eq("status", "aktif");

      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="grid gap-2">
      <Label htmlFor="assignee_id">Atanan Çalışan</Label>
      <Select 
        value={assigneeId || ""} 
        onValueChange={(value) => {
          if (value === "unassigned") {
            setValue("assignee_id", undefined);
          } else {
            setValue("assignee_id", value);
          }
        }}
        disabled={isLoadingEmployees}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoadingEmployees ? "Yükleniyor..." : "Çalışan seçin"} />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[9999]">
          <SelectItem value="unassigned">Atanmamış</SelectItem>
          {employees?.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaskAssignment;
