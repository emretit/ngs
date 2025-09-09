
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Department } from "./types";

export const useEmployeeDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*') as { data: Department[] | null; error: Error | null };

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
          table: 'departments'
        },
        async () => {
          const { data } = await supabase
            .from('departments')
            .select('*') as { data: Department[] | null };
          setDepartments(data || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return departments;
};
