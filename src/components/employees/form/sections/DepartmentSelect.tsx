import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { Control } from "react-hook-form";
import { EmployeeFormValues } from "../hooks/useEmployeeForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  description?: string;
  is_default?: boolean;
}

interface DepartmentSelectProps {
  control: Control<EmployeeFormValues>;
}

export const DepartmentSelect = ({ control }: DepartmentSelectProps) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error("Departmanlar yüklenirken hata oluştu");
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error("Departman adı gereklidir");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: newDepartmentName.trim(),
          description: newDepartmentDescription.trim() || null,
          is_default: false,
          is_active: true,
          sort_order: 999
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setDepartments(prev => [...prev, data]);
      
      // Reset form and close dialog
      setNewDepartmentName("");
      setNewDepartmentDescription("");
      setIsDialogOpen(false);

      toast.success("Yeni departman başarıyla eklendi!");
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error("Departman eklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm("Bu departmanı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: false })
        .eq('id', departmentId);

      if (error) throw error;

      // Remove from local state
      setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
      toast.success("Departman başarıyla silindi!");
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error("Departman silinirken hata oluştu");
    }
  };

  return (
    <>
      <FormField
        control={control}
        name="department"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-gray-700">Departman *</FormLabel>
            <Select onValueChange={(value) => {
              if (value === "add_new") {
                setIsDialogOpen(true);
              } else {
                field.onChange(value);
              }
            }} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Departman seçin" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{dept.name}</span>
                      {!dept.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDepartment(dept.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </SelectItem>
                ))}
                
                {/* Add new department option */}
                <SelectItem 
                  value="add_new" 
                  className="text-primary font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Departman Ekle
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Add Department Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Departman Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Departman Adı *</label>
              <Input
                placeholder="Departman adı giriniz"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Input
                placeholder="Departman açıklaması (isteğe bağlı)"
                value={newDepartmentDescription}
                onChange={(e) => setNewDepartmentDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewDepartmentName("");
                  setNewDepartmentDescription("");
                }}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button 
                onClick={handleAddDepartment}
                disabled={isLoading || !newDepartmentName.trim()}
              >
                {isLoading ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
