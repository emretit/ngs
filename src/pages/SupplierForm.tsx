
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SupplierFormHeader from "@/components/suppliers/SupplierFormHeader";
import SupplierFormFields from "@/components/suppliers/SupplierFormFields";
import { SupplierFormData } from "@/types/supplier";

interface SupplierFormProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SupplierForm = ({ isCollapsed, setIsCollapsed }: SupplierFormProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    email: "",
    mobile_phone: "",
    office_phone: "",
    company: "",
    type: "bireysel",
    status: "potansiyel",
    representative: "",
    balance: 0,
    address: "",
    tax_number: "",
    tax_office: "",
  });

  const { data: supplier, isLoading: isLoadingSupplier, error: supplierError } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching supplier:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Tedarikçi bulunamadı');
      }

      return data;
    },
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        email: supplier.email || "",
        mobile_phone: supplier.mobile_phone || "",
        office_phone: supplier.office_phone || "",
        company: supplier.company || "",
        type: supplier.type,
        status: supplier.status,
        representative: supplier.representative || "",
        balance: supplier.balance || 0,
        address: supplier.address || "",
        tax_number: supplier.tax_number || "",
        tax_office: supplier.tax_office || "",
      });
    }
  }, [supplier]);

  useEffect(() => {
    if (supplierError) {
      toast({
        title: "Hata",
        description: "Tedarikçi bilgileri yüklenemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      navigate('/suppliers');
    }
  }, [supplierError, navigate, toast]);

  const mutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const sanitizedData = {
        name: data.name,
        email: data.email || null,
        mobile_phone: data.mobile_phone || null,
        office_phone: data.office_phone || null,
        company: data.company || null,
        type: data.type,
        status: data.status,
        representative: data.representative || null,
        balance: data.balance || 0,
        address: data.address || null,
        tax_number: data.type === 'kurumsal' ? data.tax_number || null : null,
        tax_office: data.type === 'kurumsal' ? data.tax_office || null : null,
      };

      if (id) {
        const { error: updateError } = await supabase
          .from('suppliers')
          .update(sanitizedData)
          .eq('id', id);
        
        if (updateError) {
          console.error('Güncelleme hatası:', updateError);
          throw updateError;
        }

        const { data: updatedData, error: fetchError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (fetchError) {
          console.error('Veri getirme hatası:', fetchError);
          throw fetchError;
        }

        if (!updatedData) {
          console.error('Güncellenmiş veri bulunamadı');
          throw new Error('Güncellenmiş tedarikçi bulunamadı');
        }

        return updatedData;
      } else {
        const { data: newData, error } = await supabase
          .from('suppliers')
          .insert([sanitizedData])
          .select()
          .maybeSingle();
        
        if (error) {
          console.error('Ekleme hatası:', error);
          throw error;
        }

        if (!newData) {
          console.error('Yeni eklenen veri bulunamadı');
          throw new Error('Tedarikçi eklenemedi');
        }

        return newData;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      }

      toast({
        title: id ? "Tedarikçi güncellendi" : "Tedarikçi eklendi",
        description: id ? "Tedarikçi bilgileri başarıyla güncellendi." : "Yeni tedarikçi başarıyla eklendi.",
      });

      navigate('/suppliers');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form gönderiliyor:', formData);
    try {
      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 p-4 sm:p-8 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <SupplierFormHeader id={id} />

        {isLoadingSupplier && id ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : (
          <Card className="max-w-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <SupplierFormFields formData={formData} setFormData={setFormData} />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/suppliers')}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Kaydediliyor..." : (id ? "Güncelle" : "Kaydet")}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SupplierForm;
