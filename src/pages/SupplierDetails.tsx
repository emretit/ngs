import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactHeader } from "@/components/suppliers/details/ContactHeader";
import { ContactTabs } from "@/components/suppliers/details/ContactTabs";
import { ContactInfo } from "@/components/suppliers/details/ContactInfo";
import { Supplier } from "@/types/supplier";

const SupplierDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  const { data: fetchedSupplier, isLoading, refetch } = useQuery({
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
      
      return data;
    },
    enabled: !!id,
  });

  const handleEdit = () => {
    navigate(`/suppliers/${id}/edit`);
  };

  const handleSupplierUpdate = (updatedSupplier: Supplier) => {
    setSupplier(updatedSupplier);
  };

  const currentSupplier = supplier || fetchedSupplier;

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
            <span className="text-gray-600">Tedarikçi bilgileri yükleniyor...</span>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!currentSupplier) {
    return (
      <DefaultLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tedarikçi bulunamadı</h2>
          <p className="text-gray-600">Bu tedarikçi mevcut değil veya silinmiş olabilir.</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <ContactHeader 
        supplier={currentSupplier} 
        id={id || ''} 
        onEdit={handleEdit}
        onUpdate={handleSupplierUpdate}
      />
      <div className="space-y-4 mt-4">
        <ContactInfo 
          supplier={currentSupplier} 
          onUpdate={handleSupplierUpdate} 
        />
        <ContactTabs supplier={currentSupplier} />
      </div>
    </DefaultLayout>
  );
};

export default SupplierDetails;