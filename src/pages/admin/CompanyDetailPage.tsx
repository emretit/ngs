import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompanyDetailHeader } from "@/components/admin/CompanyDetailHeader";
import { CompanyInfo } from "@/components/admin/CompanyInfo";
import { CompanyTabs } from "@/components/admin/CompanyTabs";

const CompanyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-t-primary border-primary/20 rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Şirket bilgileri yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Şirket bulunamadı</h2>
        <p className="text-gray-600">Bu şirket mevcut değil veya silinmiş olabilir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyDetailHeader company={company} />
      <CompanyInfo company={company} />
      <CompanyTabs companyId={company.id} />
    </div>
  );
};

export default CompanyDetailPage;
