import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmployeeEditForm } from "@/components/employees/form/EmployeeEditForm";
import { Employee } from "@/types/employee";
import { useToast } from "@/components/ui/use-toast";
import BackButton from "@/components/ui/back-button";
import { Pencil, Save } from "lucide-react";

const EmployeeForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: employee, isLoading, refetch } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      if (!id) throw new Error("Çalışan ID'si gerekli");
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      if (!data) throw new Error("Çalışan bulunamadı");
      return data as Employee;
    },
    meta: {
      onError: (error: Error) => {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error.message || "Çalışan detayları yüklenirken hata oluştu",
        });
        navigate("/employees");
      },
    },
  });

  const handleSuccess = () => {
    refetch();
    navigate(`/employees/${id}`);
  };

  return (
    <div className="w-full">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <BackButton 
              onClick={() => navigate(`/employees/${id}`)}
              variant="ghost"
              size="sm"
            >
              Çalışan Detayları
            </BackButton>
            
            {/* Title Section with Icon */}
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Çalışan Düzenle
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {employee ? `${employee.first_name} ${employee.last_name}` : "Çalışan bilgilerini güncelle"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigate(`/employees/${id}`)}
              className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
            >
              <span className="font-medium">İptal</span>
            </Button>
            <Button 
              type="submit"
              form="employee-edit-form"
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>Değişiklikleri Kaydet</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
            <span className="text-gray-600">Çalışan bilgileri yükleniyor...</span>
          </div>
        </div>
      ) : employee ? (
        <EmployeeEditForm
          employee={employee}
          onCancel={() => navigate(`/employees/${id}`)}
          onSuccess={handleSuccess}
        />
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Çalışan bulunamadı</h2>
          <p className="text-gray-600">Bu çalışan mevcut değil veya silinmiş olabilir.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeForm;
