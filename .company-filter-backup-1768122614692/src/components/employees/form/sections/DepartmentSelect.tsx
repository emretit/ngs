import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Plus, Trash2 } from "lucide-react";
import { Control } from "react-hook-form";
import { EmployeeFormValues } from "../hooks/useEmployeeForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const { userData } = useCurrentUser();

  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (userData?.company_id) {
      fetchDepartments();
    }
  }, [userData?.company_id]);

  const fetchDepartments = async () => {
    if (!userData?.company_id) return;
    
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', userData.company_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      logger.error('Error fetching departments:', error);
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
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kullanıcı bilgisi bulunamadı");
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        toast.error("Şirket bilgisi bulunamadı");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: newDepartmentName.trim(),
          description: newDepartmentDescription.trim() || null,
          is_default: false,
          is_active: true,
          sort_order: 999,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) {
        // Check for duplicate key error
        if (error.code === '23505' && error.message.includes('departments_name_key')) {
          toast.error("Bu departman adı başka bir şirket tarafından kullanılıyor. Lütfen farklı bir ad deneyin.");
          setIsLoading(false);
          return;
        }
        throw error;
      }

      // Add to local state
      setDepartments(prev => [...prev, data]);

      // Reset form and close dialog
      setNewDepartmentName("");
      setNewDepartmentDescription("");
      setIsDialogOpen(false);

      toast.success("Yeni departman başarıyla eklendi!");
    } catch (error: any) {
      logger.error('Error adding department:', error);

      // Handle duplicate key error
      if (error?.code === '23505' && error?.message?.includes('departments_name_key')) {
        toast.error("Bu departman adı zaten kullanılıyor. Lütfen farklı bir ad deneyin.");
      } else {
        toast.error("Departman eklenirken hata oluştu");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDepartmentClick = (department: Department, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDepartmentToDelete(department);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDepartmentConfirm = async () => {
    if (!departmentToDelete || !userData?.company_id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: false })
        .eq('id', departmentToDelete.id)
        .eq('company_id', userData.company_id);

      if (error) throw error;

      // Remove from local state
      setDepartments(prev => prev.filter(dept => dept.id !== departmentToDelete.id));
      toast.success("Departman başarıyla silindi!");
    } catch (error) {
      logger.error('Error deleting department:', error);
      toast.error("Departman silinirken hata oluştu");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const handleDeleteDepartmentCancel = () => {
    setIsDeleteDialogOpen(false);
    setDepartmentToDelete(null);
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
                <SelectTrigger className="h-7 text-xs bg-background border-border hover:border-primary transition-colors">
                  <SelectValue placeholder="Departman seçin">
                    {field.value ? (
                      <span className="text-sm font-medium">{field.value}</span>
                    ) : (
                      "Departman seçin"
                    )}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-background border border-border shadow-xl z-[100] max-h-[300px] overflow-y-auto">
                {departments.map((dept) => (
                  <div key={dept.id} className="group relative">
                    <SelectItem
                      value={dept.name}
                      className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50 data-[highlighted]:bg-muted/50 pr-10 transition-colors"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-medium text-sm text-foreground">{dept.name}</span>
                        {dept.description && (
                          <span className="text-xs text-muted-foreground leading-relaxed whitespace-normal break-words">
                            {dept.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>

                    {/* Delete button positioned outside SelectItem */}
                    {!dept.is_default && (
                      <div className="absolute top-2 right-2 z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                          type="button"
                          onClick={(e) => handleDeleteDepartmentClick(dept, e)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add new department option */}
                <SelectItem
                  value="add_new"
                  className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 data-[highlighted]:bg-primary/10 p-3 border-t border-border mt-1"
                >
                  <div className="flex items-center gap-2">
                    <Plus size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">Yeni Departman Ekle</span>
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
              <Label htmlFor="departmentName" className="text-xs font-medium text-gray-700">
                Departman Adı *
              </Label>
              <Input
                id="departmentName"
                placeholder="Departman adı giriniz"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                className="h-9 text-sm"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentDescription" className="text-xs font-medium text-gray-700">
                Açıklama
              </Label>
              <Input
                id="departmentDescription"
                placeholder="Departman açıklaması (isteğe bağlı)"
                value={newDepartmentDescription}
                onChange={(e) => setNewDepartmentDescription(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
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
                type="button"
                size="sm"
                onClick={handleAddDepartment}
                disabled={isLoading || !newDepartmentName.trim()}
              >
                {isLoading ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Departmanı Sil"
        description={`"${departmentToDelete?.name || 'Bu departman'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteDepartmentConfirm}
        onCancel={handleDeleteDepartmentCancel}
        isLoading={isDeleting}
      />
    </>
  );
};
