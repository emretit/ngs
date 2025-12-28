import React, { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, User, FolderTree, Hash, FileText } from "lucide-react";

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments?: Array<{
    id: string;
    name: string;
    parent_id?: string | null;
  }>;
  employees?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    position?: string;
  }>;
}

interface DepartmentFormData {
  name: string;
  description: string;
  parent_id: string;
  head_id: string;
  sort_order: string;
}

export const AddDepartmentDialog: React.FC<AddDepartmentDialogProps> = ({
  open,
  onOpenChange,
  departments = [],
  employees = [],
}) => {
  console.log("AddDepartmentDialog render edildi, open:", open);
  const { companyId } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: "",
    parent_id: "",
    head_id: "",
    sort_order: "0",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DepartmentFormData, string>>>({});

  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      if (!companyId) throw new Error("Company ID bulunamadı");

      const { data: result, error } = await supabase
        .from("departments")
        .insert({
          company_id: companyId,
          name: data.name.trim(),
          description: data.description.trim() || null,
          parent_id: data.parent_id || null,
          head_id: data.head_id || null,
          sort_order: parseInt(data.sort_order) || 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-chart-departments"] });
      toast({
        title: "Başarılı",
        description: "Departman başarıyla oluşturuldu",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Departman oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DepartmentFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Departman adı zorunludur";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Departman adı en az 2 karakter olmalıdır";
    }

    if (formData.sort_order && isNaN(parseInt(formData.sort_order))) {
      newErrors.sort_order = "Geçerli bir sayı giriniz";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createDepartmentMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      parent_id: "",
      head_id: "",
      sort_order: "0",
    });
    setErrors({});
    onOpenChange(false);
  };

  const updateField = (field: keyof DepartmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
              <Building2 className="h-5 w-5" />
            </div>
            Yeni Departman Ekle
          </DialogTitle>
          <DialogDescription>
            Organizasyonunuza yeni bir departman ekleyin. Gerekli alanları doldurun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Departman Adı */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Departman Adı
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Örn: İnsan Kaynakları"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Açıklama
            </Label>
            <Textarea
              id="description"
              placeholder="Departman hakkında kısa bir açıklama..."
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Üst Departman */}
          <div className="space-y-2">
            <Label htmlFor="parent_id" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Üst Departman
            </Label>
            <Select
              value={formData.parent_id || "none"}
              onValueChange={(value) => updateField("parent_id", value === "none" ? "" : value)}
            >
              <SelectTrigger id="parent_id">
                <SelectValue placeholder="Üst departman seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Üst departman yok</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Bu departmanın bağlı olduğu üst departmanı seçin
            </p>
          </div>

          {/* Departman Şefi */}
          <div className="space-y-2">
            <Label htmlFor="head_id" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Departman Şefi
            </Label>
            <Select
              value={formData.head_id || "none"}
              onValueChange={(value) => updateField("head_id", value === "none" ? "" : value)}
            >
              <SelectTrigger id="head_id">
                <SelectValue placeholder="Departman şefi seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Şef atanmadı</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                    {emp.position && ` - ${emp.position}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sıralama */}
          <div className="space-y-2">
            <Label htmlFor="sort_order" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Sıralama
            </Label>
            <Input
              id="sort_order"
              type="number"
              placeholder="0"
              value={formData.sort_order}
              onChange={(e) => updateField("sort_order", e.target.value)}
              className={errors.sort_order ? "border-destructive" : ""}
              min="0"
            />
            {errors.sort_order && (
              <p className="text-sm text-destructive">{errors.sort_order}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Departmanın görünüm sırasını belirler (küçük değer önce görünür)
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createDepartmentMutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={createDepartmentMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {createDepartmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Departman Oluştur
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
