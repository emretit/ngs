
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Employee } from "@/types/employee";

export const useEmployeeDetails = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const fetchEmployee = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEmployee(data as Employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch employee details.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
    
    // Subscribe to changes
    const subscription = supabase
      .channel(`employee-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'employees',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setEmployee(payload.new as Employee);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  return {
    employee,
    isLoading,
    activeTab,
    setActiveTab,
    refetch: fetchEmployee,
  };
};
