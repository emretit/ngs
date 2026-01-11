import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Tedarikçi adı gerekli"),
  company: z.string().optional(),
  tax_number: z.string().min(1, "Vergi numarası gerekli"),
  tax_office: z.string().optional(),
  email: z.string().email("Geçerli bir email adresi girin").optional().or(z.literal("")),
  mobile_phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CompactSupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: (supplier: any) => void;
  initialData?: {
    name?: string;
    tax_number?: string;
    company?: string;
  };
}

export const CompactSupplierForm: React.FC<CompactSupplierFormProps> = ({
  isOpen,
  onClose,
  onSupplierCreated,
  initialData,
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
      name: "",
      company: "",
      tax_number: "",
      tax_office: "",
      email: "",
      mobile_phone: "",
      address: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = form;

  // Pre-fill form when modal opens with initial data
  useEffect(() => {
    if (isOpen && initialData) {
      setValue("name", initialData.name || "");
      setValue("company", initialData.company || initialData.name || "");
      setValue("tax_number", initialData.tax_number || "");
    } else if (isOpen) {
      reset();
    }
  }, [isOpen, initialData, setValue, reset]);

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
      const { data: newSupplier, error } = await supabase
        .from("customers")
        .insert({
          name: data.name,
          company: data.company || data.name,
          tax_number: data.tax_number,
          tax_office: data.tax_office,
          email: data.email || null,
          mobile_phone: data.mobile_phone,
          address: data.address,
          type: "kurumsal",
          status: "aktif",
          balance: 0,
          company_id: userProfile.company_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate customers query so dropdown refreshes
      await queryClient.invalidateQueries({ queryKey: ["customers"] });

      toast({
        title: "Başarılı", 
        description: "Tedarikçi başarıyla oluşturuldu",
      });

      onSupplierCreated(newSupplier);
      onClose();
      reset();
    } catch (error: any) {
      logger.error("❌ Error creating supplier:", error);
      toast({
        title: "Hata",
        description: error.message || "Tedarikçi oluşturulurken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Hızlı Tedarikçi Oluştur
          </DialogTitle>
        </DialogHeader>

        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Bu hızlı ekleme formu, temel bilgilerle tedarikçi oluşturur. 
            Detaylı düzenleme için tedarikçi sayfasına gidebilirsiniz.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Tedarikçi Adı *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Tedarikçi adını girin"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="company">Firma Adı</Label>
              <Input
                id="company"
                {...register("company")}
                placeholder="Firma adını girin"
              />
            </div>

            <div>
              <Label htmlFor="tax_number">Vergi Numarası *</Label>
              <Input
                id="tax_number"
                {...register("tax_number")}
                placeholder="Vergi numarasını girin"
                className={errors.tax_number ? "border-destructive" : ""}
              />
              {errors.tax_number && (
                <p className="text-sm text-destructive mt-1">{errors.tax_number.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="tax_office">Vergi Dairesi</Label>
              <Input
                id="tax_office"
                {...register("tax_office")}
                placeholder="Vergi dairesini girin"
              />
            </div>

            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="E-posta adresini girin"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="mobile_phone">Telefon</Label>
              <Input
                id="mobile_phone"
                {...register("mobile_phone")}
                placeholder="Telefon numarasını girin"
              />
            </div>

            <div>
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Adres bilgisini girin"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="min-w-[100px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Oluştur"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompactSupplierForm;