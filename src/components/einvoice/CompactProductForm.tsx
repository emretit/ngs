import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Ürün adı gerekli"),
  sku: z.string().optional(),
  unit: z.string().min(1, "Birim gerekli"),
  price: z.number().min(0, "Fiyat 0'dan büyük olmalı"),
  tax_rate: z.number().min(0).max(100, "Vergi oranı 0-100 arasında olmalı"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CompactProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: any) => void;
  initialData?: {
    name: string;
    unit: string;
    price: number;
    tax_rate: number;
    code?: string;
  };
}

const CompactProductForm: React.FC<CompactProductFormProps> = ({
  isOpen,
  onClose,
  onProductCreated,
  initialData
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Get current user's company_id
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.code || "",
      unit: initialData?.unit || "Adet",
      price: initialData?.price || 0,
      tax_rate: initialData?.tax_rate || 18,
      description: "",
    },
  });

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        name: initialData.name || "",
        sku: initialData.code || "",
        unit: initialData.unit || "Adet",
        price: initialData.price || 0,
        tax_rate: initialData.tax_rate || 18,
        description: "",
      });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (data: FormData) => {
    if (!userProfile?.company_id) {
      toast({
        title: "Hata",
        description: "Kullanıcı bilgileri yüklenemedi. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Stock artık warehouse_stock tablosunda tutulduğu için products tablosuna 0 olarak kaydediyoruz
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          name: data.name,
          sku: data.sku,
          unit: data.unit,
          price: data.price,
          tax_rate: data.tax_rate,
          description: data.description,
          currency: "TRY",
          category_type: "product",
          product_type: "physical",
          status: "active",
          is_active: true,
          stock_quantity: 0, // Products tablosunda stok artık kullanılmıyor
          min_stock_level: 0,
          stock_threshold: 0,
          company_id: userProfile.company_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate products query so dropdown refreshes
      await queryClient.invalidateQueries({ queryKey: ["products"] });

      toast({
        title: "Başarılı", 
        description: "Ürün başarıyla oluşturuldu",
      });

      onProductCreated(newProduct);
      onClose();
      form.reset();
    } catch (error: any) {
      console.error("❌ Error creating product:", error);
      toast({
        title: "Hata",
        description: error.message || "Ürün oluşturulurken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Hızlı Ürün Oluştur
          </DialogTitle>
        </DialogHeader>

        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Bu hızlı ekleme formu, temel bilgilerle ürün oluşturur. 
            Detaylı düzenleme için ürün sayfasına gidebilirsiniz.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ürün Adı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ürün adını girin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ürün Kodu</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birim *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Birim seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Adet">Adet</SelectItem>
                        <SelectItem value="Kg">Kg</SelectItem>
                        <SelectItem value="Lt">Lt</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="M2">M²</SelectItem>
                        <SelectItem value="M3">M³</SelectItem>
                        <SelectItem value="Paket">Paket</SelectItem>
                        <SelectItem value="Kutu">Kutu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiyat (TRY) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KDV Oranı (%) *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseFloat(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="KDV oranı" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">%0</SelectItem>
                        <SelectItem value="1">%1</SelectItem>
                        <SelectItem value="8">%8</SelectItem>
                        <SelectItem value="18">%18</SelectItem>
                        <SelectItem value="20">%20</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ürün açıklaması..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  "Ürün Oluştur"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompactProductForm;