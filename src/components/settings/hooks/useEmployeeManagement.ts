import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Employee } from "@/types/employee";
import { logger } from "@/utils/logger";
import { handleError, handleSuccess } from "@/utils/errorHandler";
import { useEmployeeData } from "@/components/employees/hooks/useEmployeeData";

export const useEmployeeManagement = () => {
  const queryClient = useQueryClient();
  
  // Use existing employee data hook
  const { employees, isLoading, refetch } = useEmployeeData();

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
      logger.info('Creating new employee', employeeData);
      
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) {
        logger.error('Failed to create employee', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      handleSuccess('Employee created successfully', 'createEmployee', data);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Çalışan oluşturuldu");
    },
    onError: (error: any) => {
      handleError(error, {
        operation: 'createEmployee',
        metadata: { error: error.message }
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Employee> & { id: string }) => {
      logger.info('Updating employee', { id, updateData });
      
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update employee', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      handleSuccess('Employee updated successfully', 'updateEmployee', data);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Çalışan güncellendi");
    },
    onError: (error: any) => {
      handleError(error, {
        operation: 'updateEmployee',
        metadata: { error: error.message }
      });
    },
  });

  // Delete employee mutation (with optional user deletion)
  const deleteEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, deleteUser }: { employeeId: string; deleteUser: boolean }) => {
      logger.info('Deleting employee', { employeeId, deleteUser });

      // First, get employee data to check for user relationship
      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('user_id')
        .eq('id', employeeId)
        .maybeSingle();

      if (fetchError) {
        logger.error('Failed to fetch employee for deletion', fetchError);
        throw fetchError;
      }

      if (deleteUser && employee?.user_id) {
        // Delete the associated user profile (this will cascade to employee due to FK constraints)
        const { error: deleteUserError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', employee.user_id);

        if (deleteUserError) {
          logger.error('Failed to delete associated user', deleteUserError);
          throw deleteUserError;
        }
        
        logger.info('Associated user deleted successfully');
      } else {
        // Delete only the employee record
        const { error: deleteEmployeeError } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);

        if (deleteEmployeeError) {
          logger.error('Failed to delete employee', deleteEmployeeError);
          throw deleteEmployeeError;
        }
      }

      logger.info('Employee deletion completed successfully');
    },
    onSuccess: (data, variables) => {
      handleSuccess('Employee deleted successfully', 'deleteEmployee', variables);
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      
      toast.success(variables.deleteUser ? "Çalışan ve kullanıcı silindi" : "Çalışan silindi");
    },
    onError: (error: any) => {
      handleError(error, {
        operation: 'deleteEmployee',
        metadata: { error: error.message }
      });
    },
  });

  return {
    employees,
    isLoading,
    refetch,
    createEmployeeMutation,
    updateEmployeeMutation,
    deleteEmployeeMutation,
  };
};