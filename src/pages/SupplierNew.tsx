import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SupplierFormData } from "@/types/supplier";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import SupplierFormHeader from "@/components/suppliers/SupplierFormHeader";
import SupplierFormContent from "@/components/suppliers/SupplierFormContent";

interface SupplierNewProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SupplierNew = ({ isCollapsed, setIsCollapsed }: SupplierNewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
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
    city: "",
    district: "",
    country: "",
    postal_code: "",
    fax: "",
    website: "",
    is_active: true,
    payee_financial_account_id: "",
    payment_means_channel_code: "",
    payment_means_code: "",
    aliases: [],
    einvoice_alias_name: "",
  });

  // URL parametrelerinden form verilerini doldur
  useEffect(() => {
    const name = searchParams.get('name');
    const tax_number = searchParams.get('tax_number');
    const type = searchParams.get('type') as 'bireysel' | 'kurumsal' | null;
    const status = searchParams.get('status') as 'aktif' | 'pasif' | 'potansiyel' | null;

    if (name || tax_number || type || status) {
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        tax_number: tax_number || prev.tax_number,
        type: type || prev.type,
        status: status || prev.status,
        company: name || prev.company, // E-faturadan gelen name'i company olarak da kullan
      }));
    }
  }, [searchParams]);

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
        city: data.city || null,
        district: data.district || null,
        country: data.country || null,
        postal_code: data.postal_code || null,
        fax: data.fax || null,
        website: data.website || null,
        is_active: data.is_active,
        payee_financial_account_id: data.payee_financial_account_id || null,
        payment_means_channel_code: data.payment_means_channel_code || null,
        payment_means_code: data.payment_means_code || null,
        aliases: data.aliases.length > 0 ? data.aliases : null,
        einvoice_alias_name: data.einvoice_alias_name || null,
      };

      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        console.error('Supplier add error:', error);
        throw error;
      }

      return newSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Başarılı",
        description: "Tedarikçi başarıyla eklendi.",
      });
      navigate('/suppliers');
    },
    onError: (error) => {
      console.error('Form submission error:', error);
      toast({
        title: "Hata",
        description: "Tedarikçi eklenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <TopBar />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="w-full">
            <SupplierFormHeader />

            <SupplierFormContent 
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              isPending={mutation.isPending}
              isEdit={false}
              onCancel={() => navigate('/suppliers')}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierNew;
