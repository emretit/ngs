
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";
import { useToast } from "@/components/ui/use-toast";

export const useEmployeeDetails = (employeeId: string) => {
  const { toast } = useToast();

  const { data: employee, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Çalışan bulunamadı');
      }

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

  return {
    employee,
    isLoading,
    error,
    refetch
  };
};
