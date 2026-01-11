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
  Search, 
  User, 
  Loader2,
  Building2,
  Mail,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/hooks/useCompany";
import { useManagerChain } from "@/hooks/useManagerChain";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  manager_id?: string | null;
}

interface ManagerSelectorProps {
  value: string | null | undefined;
  onChange: (managerId: string | null) => void;
  excludeEmployeeId?: string; // Kendini seçmeyi engelle
  currentDepartment?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
}

export const ManagerSelector: React.FC<ManagerSelectorProps> = ({ 
  value, 
  onChange, 
  excludeEmployeeId,
  currentDepartment,
  error,
  label = "Yönetici Seçin",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { companyId } = useCompany();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, email, phone, manager_id")
        
        .eq("status", "aktif")
        .order("first_name");
      
      if (error) throw error;
      return data as Employee[] || [];
    },
    enabled: !!companyId,
  });

  // Seçili çalışanın yönetici zincirini kontrol et (döngüsel referans için)
  const { data: managerChain = [] } = useManagerChain(excludeEmployeeId || undefined);
  const circularCheckIds = useMemo(() => {
    if (!excludeEmployeeId) return [];
    return managerChain.map(m => m.employee_id);
  }, [managerChain, excludeEmployeeId]);

  // Filter employees based on search query and exclude self
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Kendini hariç tut
      if (excludeEmployeeId && employee.id === excludeEmployeeId) return false;
      
      // Döngüsel referans kontrolü: Eğer bu çalışan, seçili çalışanın yönetici zincirindeyse, seçilemez
      if (circularCheckIds.includes(employee.id)) return false;
      
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      const department = employee.department?.toLowerCase() || "";
      const position = employee.position?.toLowerCase() || "";
      const email = employee.email?.toLowerCase() || "";
      
      return fullName.includes(query) || 
             department.includes(query) || 
             position.includes(query) ||
             email.includes(query);
    });
  }, [employees, searchQuery, excludeEmployeeId, circularCheckIds]);

  const selectedEmployee = employees.find(emp => emp.id === value);

  const handleSelectEmployee = (employee: Employee | null) => {
    onChange(employee?.id || null);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedEmployee && "text-muted-foreground",
              error && "border-destructive",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            {selectedEmployee ? (
              <span className="truncate">
                {selectedEmployee.first_name} {selectedEmployee.last_name}
                {selectedEmployee.position && ` - ${selectedEmployee.position}`}
              </span>
            ) : (
              <span className="text-muted-foreground">Yönetici seçin...</span>
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[400px] max-w-[90vw] p-0 z-[9999]" 
          align="start"
        >
          <div className="p-1.5 border-b">
            <Input
              placeholder="Yönetici ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 text-xs"
              autoFocus
            />
          </div>
          
          <div className="h-[200px] overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center text-muted-foreground text-xs flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Yükleniyor...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground text-xs">
                {searchQuery 
                  ? `"${searchQuery}" ile eşleşen çalışan bulunamadı` 
                  : "Çalışan bulunamadı"}
              </div>
            ) : (
              <div className="grid gap-0.5 p-1">
                {filteredEmployees.map((employee) => {
                  const isCircular = circularCheckIds.includes(employee.id);
                  return (
                    <button
                      key={employee.id}
                      onClick={() => !isCircular && handleSelectEmployee(employee)}
                      disabled={isCircular}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent transition-colors",
                        value === employee.id && "bg-accent",
                        isCircular && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {employee.position && (
                            <span className="truncate">{employee.position}</span>
                          )}
                          {employee.department && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{employee.department}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {employee.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                        )}
                        {isCircular && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Döngüsel referans oluşturur</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {value && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleSelectEmployee(null)}
              >
                Yöneticiyi Kaldır
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

