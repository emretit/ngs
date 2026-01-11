import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAutoMatchUsersEmployees = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get current user's company_id
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", currentUser.user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company not found");

      // Get all unmatched users (no employee_id)
      const { data: unmatchedUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id, email, employee_id")
        .is("employee_id", null);

      if (usersError) throw usersError;

      // Get all unmatched employees (no user_id)
      const { data: unmatchedEmployees, error: employeesError } = await supabase
        .from("employees")
        .select("id, email, user_id")
        .is("user_id", null);

      if (employeesError) throw employeesError;

      // Match users and employees by email
      const matches: Array<{ userId: string; employeeId: string; email: string }> = [];
      const errors: string[] = [];

      for (const user of unmatchedUsers || []) {
        if (!user.email) continue;

        // Find employee with matching email (case-insensitive)
        const matchingEmployee = (unmatchedEmployees || []).find(
          (emp) => emp.email && emp.email.toLowerCase() === user.email.toLowerCase()
        );

        if (matchingEmployee) {
          try {
            // Update profile with employee_id
            const { error: profileError } = await supabase
              .from("profiles")
              .update({ employee_id: matchingEmployee.id })
              .eq("id", user.id);

            if (profileError) {
              errors.push(`${user.email}: ${profileError.message}`);
              continue;
            }

            // The trigger will automatically update employees.user_id
            matches.push({
              userId: user.id,
              employeeId: matchingEmployee.id,
              email: user.email,
            });
          } catch (error: any) {
            errors.push(`${user.email}: ${error.message}`);
          }
        }
      }

      return {
        matched: matches.length,
        matches,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      queryClient.invalidateQueries({ queryKey: ["available-employees"] });

      if (result.matched > 0) {
        toast.success(`${result.matched} kullanıcı çalışanla eşleştirildi.`);
      }
      // Eşleşme bulunamadığında toast gösterme

      if (result.errors && result.errors.length > 0) {
        toast.error(`Bazı hatalar oluştu: ${result.errors.slice(0, 3).join(", ")}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Otomatik eşleştirme yapılırken bir hata oluştu");
    },
  });
};

