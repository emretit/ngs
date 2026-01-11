
import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { UseFormReturn } from "react-hook-form";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface TaskAssigneeSelectProps {
  form: UseFormReturn<any>;
  defaultValue?: string;
}

const TaskAssigneeSelect = ({ form, defaultValue }: TaskAssigneeSelectProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("employees")
          .select("id, first_name, last_name, avatar_url")
          .eq("status", "aktif"); // Using "aktif" status

        if (error) throw error;
        setEmployees(data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <FormField
      control={form.control}
      name="assignee_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Atanan</FormLabel>
          <Select
            disabled={isLoading}
            onValueChange={field.onChange}
            defaultValue={defaultValue || field.value}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={isLoading ? "Yükleniyor..." : "Atanacak kişiyi seçin"} 
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Atanmamış</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      {employee.avatar_url && (
                        <AvatarImage 
                          src={employee.avatar_url} 
                          alt={`${employee.first_name} ${employee.last_name}`} 
                        />
                      )}
                      <AvatarFallback>
                        {employee.first_name[0]}
                        {employee.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {employee.first_name} {employee.last_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};

export default TaskAssigneeSelect;
