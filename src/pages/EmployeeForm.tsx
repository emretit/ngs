
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EditableEmployeeDetails } from "@/components/employees/details/form/EditableEmployeeDetails";
import { Employee } from "@/types/employee";
import { useToast } from "@/components/ui/use-toast";

interface EmployeeFormProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const EmployeeForm = ({ isCollapsed, setIsCollapsed }: EmployeeFormProps) => {
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

  const handleSuccess = async () => {
    await refetch();
    navigate(`/employees/${id}`);
    toast({
      title: "Başarılı",
      description: "Çalışan bilgileri başarıyla güncellendi",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <div className="py-6 px-6">
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
            <EditableEmployeeDetails
              employee={employee}
              onCancel={() => navigate(`/employees/${id}`)}
              onSuccess={handleSuccess}
            />
          ) : (
            <div className="py-10 text-center">Çalışan bulunamadı</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeForm;
