import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EmployeeEditForm } from "@/components/employees/form/EmployeeEditForm";
import { Employee } from "@/types/employee";
import { useToast } from "@/components/ui/use-toast";
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
    <>
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(`/employees/${id}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Çalışan Detaylarına Dön
      </Button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Çalışan Düzenle</h1>
        <p className="text-gray-500">Çalışan bilgilerini güncelle</p>
      </div>
      {isLoading ? (
        <div className="py-10 text-center">Çalışan bilgileri yükleniyor...</div>
      ) : employee ? (
        <EmployeeEditForm
          employee={employee}
          onCancel={() => navigate(`/employees/${id}`)}
          onSuccess={handleSuccess}
        />
      ) : (
        <div className="py-10 text-center">Çalışan bulunamadı</div>
      )}
    </>
  );
};
export default EmployeeForm;
