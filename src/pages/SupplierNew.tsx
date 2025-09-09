import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    einvoice_alias_name: "",
  });

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
