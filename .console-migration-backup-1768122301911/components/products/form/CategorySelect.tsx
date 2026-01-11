import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "./ProductFormSchema";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface CategorySelectProps {
  form: UseFormReturn<ProductFormSchema>;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  is_default?: boolean;
}

const CategorySelect = ({ form }: CategorySelectProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["productCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq('is_active', true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');
      
      const { data: result, error } = await supabase
        .from("product_categories")
        .insert([{
          name: data.name,
          description: data.description || null,
          company_id: profile.company_id,
          is_default: false,
          is_active: true,
          sort_order: 999
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      form.setValue("category_id", newCategory.id);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setIsDialogOpen(false);
      toast.success(`"${newCategory.name}" kategorisi oluşturuldu`);
    },
    onError: (error: any) => {
      console.error("Kategori oluşturma hatası:", error);
      toast.error(`Kategori oluşturulurken hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
    },
  });

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Kategori adı gereklidir");
      return;
    }

    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || undefined
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ is_active: false })
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      toast.success("Kategori başarıyla silindi!");
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Kategori silinirken hata oluştu");
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleSelectChange = (value: string) => {
    if (value === "add_new") {
      setIsDialogOpen(true);
    } else {
      form.setValue("category_id", value);
    }
  };

  return (
    <>
      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Kategori</FormLabel>
            <Select
              onValueChange={handleSelectChange}
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Kategori seçiniz" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">Kategorisiz</SelectItem>
                {categories?.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      {!category.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="add_new" className="text-primary font-medium">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Kategori Ekle
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Add Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Oluştur</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori Adı *</label>
              <Input
                placeholder="Kategori adı giriniz"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Input
                placeholder="Kategori açıklaması (isteğe bağlı)"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewCategoryName("");
                  setNewCategoryDescription("");
                }}
                disabled={createCategoryMutation.isPending}
              >
                İptal
              </Button>
              <Button 
                onClick={handleAddCategory}
                disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
              >
                {createCategoryMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Kategoriyi Sil"
        description={
          categoryToDelete
            ? `"${categoryToDelete.name}" kategorisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default CategorySelect;






