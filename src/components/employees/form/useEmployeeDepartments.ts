
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Department } from "./types";

export const useEmployeeDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const { toast } = useToast();
  const { userData } = useCurrentUser();

  useEffect(() => {
    if (!userData?.company_id) return;

    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('company_id', userData.company_id) as { data: Department[] | null; error: Error | null };

        if (error) {
          throw error;
        }

        setDepartments(data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast({
          title: "Error",
          description: "Failed to load departments",
          variant: "destructive",
        });
      }
    };

    fetchDepartments();

    const channel = supabase
      .channel('departments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departments',
          filter: `company_id=eq.${userData.company_id}`
        },
        async () => {
          const { data } = await supabase
            .from('departments')
            .select('*')
            .eq('company_id', userData.company_id) as { data: Department[] | null };
          setDepartments(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, userData?.company_id]);

  return departments;
};
