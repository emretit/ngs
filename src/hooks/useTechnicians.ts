
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Technician {
  id: string;
  name: string;
  department?: string;
  avatar_url?: string;
}

export const useTechnicians = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setIsLoading(true);
        
        // Fetch employees that are in the technical department or have "technician" in their position
        const { data, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, department, position, avatar_url')
          .or('department.ilike.%teknik%, position.ilike.%teknisyen%')
          .order('first_name');
        
        if (error) throw error;
        
        const formattedTechnicians = data.map(emp => ({
          id: emp.id,
          name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department,
          avatar_url: emp.avatar_url
        }));
        
        setTechnicians(formattedTechnicians);
      } catch (err) {
        console.error('Error fetching technicians:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicians();
  }, []);

  return { technicians, isLoading, error };
};
