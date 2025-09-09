
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface EmployeeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ value, onChange, error }) => {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position")
        .order("first_name");
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="employee">Sorumlu Personel</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="employee" className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Personel seçin" />
        </SelectTrigger>
        <SelectContent>
          {employees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name} 
              {employee.position ? ` (${employee.position})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default EmployeeSelector;
