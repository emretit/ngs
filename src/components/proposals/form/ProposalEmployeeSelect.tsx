
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserCircle, Building, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";

const ProposalEmployeeSelect = () => {
  const { setValue, watch } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const employeeId = watch("employee_id");
  
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "aktif")
        .order("first_name");
        
      if (error) throw error;
      return data as Employee[];
    },
  });
  
  const filteredEmployees = employees.filter(employee => {
    if (!searchQuery) return true;
    
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  
  const selectedEmployee = employees.find(e => e.id === employeeId);
  
  const handleSelectEmployee = (id: string) => {
    setValue("employee_id", id);
    setIsOpen(false);
  };
  
  return (
    <div className="space-y-1">
      <Label className="text-base font-medium">Hazırlayan</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between mt-1"
          >
            {selectedEmployee ? (
              <div className="flex items-center">
                <UserCircle className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <span>
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-muted-foreground">
                <UserCircle className="mr-2 h-4 w-4 shrink-0" />
                <span>Çalışan seçin...</span>
              </div>
            )}
            <UserCircle className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex items-center border-b p-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Ad, departman veya pozisyon ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Command>
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup>
                {isLoading ? (
                  <CommandItem disabled>Yükleniyor...</CommandItem>
                ) : (
                  filteredEmployees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      onSelect={() => handleSelectEmployee(employee.id)}
                      className="flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span>
                          {employee.first_name} {employee.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {employee.position}
                        </span>
                      </div>
                      <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
                        <Building className="mr-1 h-3 w-3 opacity-70" />
                        {employee.department}
                      </div>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProposalEmployeeSelect;
