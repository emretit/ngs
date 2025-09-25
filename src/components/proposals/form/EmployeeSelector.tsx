
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  ChevronsUpDown, 
  Search, 
  User, 
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
}

interface EmployeeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department")
        .order("first_name");
      
      if (error) throw error;
      return data as Employee[] || [];
    },
  });

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        searchQuery === "" || 
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.position && employee.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (employee.department && employee.department.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [employees, searchQuery]);

  const selectedEmployee = employees.find(emp => emp.id === value);

  const handleSelectEmployee = (employee: Employee) => {
    onChange(employee.id);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="ml-2 text-sm">Teklifi hazırlayanlar yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className={error ? "text-red-500" : ""}>Teklifi Hazırlayan</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <span className="truncate text-left flex-1">
              {selectedEmployee 
                ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}${selectedEmployee.position ? ` (${selectedEmployee.position})` : ""}`
                : "Teklifi hazırlayan seçin..."
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Teklifi hazırlayan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery 
                  ? `"${searchQuery}" ile eşleşen teklifi hazırlayan bulunamadı` 
                  : "Teklifi hazırlayan bulunamadı"}
              </div>
            ) : (
              <div className="p-1">
                {filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-sm"
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {employee.first_name} {employee.last_name}
                        </span>
                        {employee.position && (
                          <span className="text-xs text-muted-foreground">
                            {employee.position}
                          </span>
                        )}
                        {employee.department && (
                          <span className="text-xs text-muted-foreground">
                            {employee.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default EmployeeSelector;
