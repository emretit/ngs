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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "./ProductFormSchema";

interface CategorySelectProps {
  form: UseFormReturn<ProductFormSchema>;
}

interface NewCategoryForm {
  name: string;
  description?: string;
}

const CategorySelect = ({ form }: CategorySelectProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["productCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Form for new category
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<NewCategoryForm>();

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: NewCategoryForm) => {
      console.log('Creating category:', data); // Debug log
      
      // Get current user's company_id
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
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error); // Debug log
        throw error;
      }
      
      console.log('Category created:', result); // Debug log
      return result;
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      form.setValue("category_id", newCategory.id);
      setIsDialogOpen(false);
      reset();
      toast.success(`"${newCategory.name}" kategorisi oluşturuldu`);
    },
    onError: (error: any) => {
      console.error("Kategori oluşturma hatası:", error);
      
      // Specific error messages
      if (error?.message?.includes('company_id')) {
        toast.error("Şirket bilgisi eksik. Lütfen tekrar giriş yapın.");
      } else if (error?.message?.includes('unique constraint')) {
        toast.error("Bu kategori adı zaten mevcut.");
      } else if (error?.message?.includes('Row Level Security')) {
        toast.error("Kategori oluşturmak için yetkiniz yok.");
      } else {
        toast.error(`Kategori oluşturulurken hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
      }
    },
  });

  const onSubmit = (data: NewCategoryForm) => {
    console.log('Form submitted with data:', data); // Debug log
    if (!data.name || data.name.trim() === '') {
      toast.error('Kategori adı gereklidir');
      return;
    }
    createCategoryMutation.mutate(data);
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
            <FormLabel>Kategori</FormLabel>
            <Select
              onValueChange={handleSelectChange}
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçiniz" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">Kategorisiz</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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
            <FormMessage />
          </FormItem>
        )}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Oluştur</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Kategori Adı *</Label>
              <Input
                id="name"
                placeholder="Kategori adı giriniz"
                {...register("name", { 
                  required: "Kategori adı gereklidir",
                  minLength: { value: 2, message: "En az 2 karakter olmalıdır" }
                })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Kategori açıklaması (isteğe bağlı)"
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  reset();
                }}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategorySelect;
