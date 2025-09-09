
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
}

export const FilterBar = ({
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
}: FilterBarProps) => {
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .order('department');

      if (!error && data) {
        // Extract unique departments - Fix type issues with explicit casting
        const uniqueDepartments = [...new Set(data.map(item => item.department))] as string[];
        setDepartments(uniqueDepartments);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="flex flex-wrap gap-6 mt-2 mb-4">
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Durum</Label>
        <RadioGroup
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="flex flex-wrap gap-3"
        >
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all" className="cursor-pointer">Tümü</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="aktif" id="active" />
            <Label htmlFor="active" className="cursor-pointer">Aktif</Label>
          </div>
          <div className="flex items-center space-x-1">
            <RadioGroupItem value="pasif" id="inactive" />
            <Label htmlFor="inactive" className="cursor-pointer">Pasif</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="text-sm font-medium mb-1.5 block">Departman</Label>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tüm Departmanlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Departmanlar</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
