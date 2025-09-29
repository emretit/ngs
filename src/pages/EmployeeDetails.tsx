import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { EmployeeDetailsView } from "@/components/employees/details/EmployeeDetailsView";
import { EmployeeDetailsLoading } from "@/components/employees/details/EmployeeDetailsLoading";
import { EmployeeNotFound } from "@/components/employees/details/EmployeeNotFound";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Employee } from "@/types/employee";

const EmployeeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");

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
      },
    },
  });

  const handleRefetch = async () => {
    await refetch();
  };

  return (
    <DefaultLayout>
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/employees")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Çalışanlara Dön
      </Button>

      {isLoading ? (
        <EmployeeDetailsLoading />
      ) : employee ? (
        <EmployeeDetailsView 
          employee={employee}
          isLoading={isLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          refetch={handleRefetch}
        />
      ) : (
        <EmployeeNotFound />
      )}
    </DefaultLayout>
  );
};

export default EmployeeDetails;
