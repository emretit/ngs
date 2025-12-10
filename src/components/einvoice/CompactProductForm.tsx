import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Loader2, Package, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UNIT_OPTIONS, mapUnitToDropdownValue } from "@/utils/unitConstants";
import { useTranslation } from "react-i18next";

const createFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("validation.nameRequired")),
  sku: z.string().optional(),
  unit: z.string().min(1, t("validation.required")),
  price: z.number().min(0, t("validation.priceMin")),
  tax_rate: z.number().min(0).max(100, t("validation.taxRateRange")),
  description: z.string().optional(),
});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const formSchema = createFormSchema(t);

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

  // Generate product code from product name
  const generateProductCode = (productName: string): string => {
    if (!productName || productName.trim() === "") {
      return "";
    }

    // Turkish character mapping
    const turkishToEnglish: Record<string, string> = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G',
      'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };

    // Convert Turkish characters to English
    let normalized = productName
      .split('')
      .map(char => turkishToEnglish[char] || char)
      .join('');

    // Get first letters of each word (max 3-4 words)
    const words = normalized
      .toUpperCase()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .slice(0, 4);

    // Take first 2-3 letters of each word, or first letter if word is short
    let codePrefix = words
      .map(word => word.length > 2 ? word.substring(0, 2) : word.substring(0, 1))
      .join('')
      .substring(0, 6); // Max 6 characters

    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    return `${codePrefix}-${randomNum}`;
  };

  // Helper function to check if code should be auto-generated
  const shouldGenerateCode = (code: string | number | undefined, productName: string): boolean => {
    // Convert to string first
    const codeStr = code ? String(code).trim() : "";
    if (!codeStr || codeStr === "" || codeStr === "1") {
      return true;
    }
    return false;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: shouldGenerateCode(initialData?.code, initialData?.name || "") 
        ? generateProductCode(initialData?.name || "") 
        : (initialData?.code || ""),
      unit: initialData?.unit ? mapUnitToDropdownValue(initialData.unit) : "adet",
      price: initialData?.price || 0,
      tax_rate: initialData?.tax_rate || 20,
      description: "",
    },
  });

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (isOpen && initialData) {
      const productName = initialData.name || "";
      const shouldGen = shouldGenerateCode(initialData.code, productName);
      form.reset({
        name: productName,
        sku: shouldGen ? generateProductCode(productName) : (initialData.code || ""),
        unit: initialData.unit ? mapUnitToDropdownValue(initialData.unit) : "adet",
        price: initialData.price || 0,
        tax_rate: initialData.tax_rate || 20,
        description: "",
      });
    } else if (isOpen && !initialData) {
      // Reset form when opening without initial data
      form.reset({
        name: "",
        sku: "",
        unit: "adet",
        price: 0,
        tax_rate: 20,
        description: "",
      });
    }
  }, [isOpen, initialData, form]);

  // Auto-generate product code when product name changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" && value.name) {
        const currentSku = form.getValues("sku");
        // Auto-generate if SKU is empty, "1", or matches auto-generated pattern
        if (!currentSku || currentSku === "1" || currentSku.match(/^[A-Z]+-\d{4}$/)) {
          const generatedCode = generateProductCode(value.name);
          form.setValue("sku", generatedCode, { shouldValidate: false });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: FormData) => {
    if (!userProfile?.company_id) {
      toast.error("Kullanıcı bilgileri yüklenemedi. Lütfen sayfayı yenileyin.");
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
          currency: "TRY", // Constraint sadece USD, EUR veya TRY kabul ediyor
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

      toast.success("Ürün başarıyla oluşturuldu");

      onProductCreated(newProduct);
      onClose();
      form.reset();
    } catch (error: any) {
      console.error("❌ Error creating product:", error);
      toast.error(error.message || "Ürün oluşturulurken hata oluştu");
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
        <DialogDescription className="sr-only">
          Hızlı ürün oluşturma formu. Temel bilgilerle ürün oluşturabilirsiniz.
        </DialogDescription>

        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t("forms.quickAddInfo")}
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.productName")} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t("forms.enterProductName")} {...field} />
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
                    <FormLabel>{t("forms.productCode")}</FormLabel>
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
                    <FormLabel>{t("forms.unit")} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("forms.selectUnit")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
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
                    <FormLabel>{t("forms.priceTRY")} *</FormLabel>
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
                    <FormLabel>{t("forms.taxRatePercent")} *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseFloat(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("forms.selectTaxRate")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">%1</SelectItem>
                        <SelectItem value="10">%10</SelectItem>
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
                  <FormLabel>{t("forms.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("forms.productDescription")}
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
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.creating")}
                  </>
                ) : (
                  t("forms.createProduct")
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