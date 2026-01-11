
import React, { useState, useMemo } from "react";
import { logger } from '@/utils/logger';
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
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  companyId?: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  loadingText?: string;
  noResultsText?: string;
  showLabel?: boolean;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ 
  value, 
  onChange, 
  error, 
  companyId,
  label = "Çalışan Seçin",
  placeholder = "Çalışan seçin...",
  searchPlaceholder = "Çalışan ara...",
  loadingText = "Çalışanlar yükleniyor...",
  noResultsText = "Çalışan bulunamadı",
  showLabel = true,
  className = "",
  triggerClassName = "",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { userData } = useCurrentUser();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", companyId || userData?.company_id],
    queryFn: async () => {
      // RLS policy otomatik olarak current_company() ile filtreler
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, email, phone")
        .eq("status", "aktif")
        .order("first_name");
      
      if (error) {
        logger.error("Error fetching employees:", error);
        throw error;
      }
      return data as Employee[] || [];
    },
    enabled: !!(companyId || userData?.company_id),
  });

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
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
  }, [employees, searchQuery]);

  const selectedEmployee = employees.find(emp => emp.id === value);

  const handleSelectEmployee = (employee: Employee) => {
    onChange(employee.id);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-1.5", className)}>
        {showLabel && (
          <Label className={cn("text-xs font-medium text-gray-700", error ? "text-red-500" : "")}>
            {label}
          </Label>
        )}
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="ml-2 text-xs">{loadingText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <Label className={cn("text-xs font-medium text-gray-700", error ? "text-red-500" : "")}>
          {label}
        </Label>
      )}
      <Popover 
        open={open} 
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) {
            setSearchQuery("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between mt-0.5 h-10 text-xs",
              triggerClassName,
              !value && "text-muted-foreground",
              error && error.trim() && "border-red-500"
            )}
          >
            <div className="flex items-center">
              <User className="mr-1.5 h-3 w-3 shrink-0 opacity-50" />
              <span className="truncate">
                {selectedEmployee 
                  ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                  : placeholder
                }
              </span>
            </div>
            <Search className="ml-1.5 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[400px] max-w-[90vw] p-0 z-[9999] pointer-events-auto" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-1.5 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 text-xs"
              autoFocus
            />
          </div>
          
          <div className="h-[200px] overflow-y-auto">
            {filteredEmployees.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground text-xs">
                {searchQuery 
                  ? `"${searchQuery}" ile eşleşen çalışan bulunamadı` 
                  : noResultsText}
              </div>
            ) : (
              <div className="grid gap-0.5 p-1">
                {filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    className={cn(
                      "flex items-start py-1 px-1.5 cursor-pointer rounded-md hover:bg-muted/50",
                      employee.id === value && "bg-muted"
                    )}
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-1.5 mt-0.5 text-[10px] font-medium">
                      {(employee.first_name || 'Ç').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate text-xs">
                          {employee.first_name} {employee.last_name}
                        </p>
                      </div>
                      {employee.position && (
                        <p className="text-[11px] text-muted-foreground truncate">{employee.position}</p>
                      )}
                      {employee.department && (
                        <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                          <Building2 className="h-2 w-2 mr-0.5" />
                          <span className="truncate">{employee.department}</span>
                        </div>
                      )}
                      {employee.email && (
                        <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                          <Mail className="h-2 w-2 mr-0.5" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                          <Phone className="h-2 w-2 mr-0.5" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default EmployeeSelector;
