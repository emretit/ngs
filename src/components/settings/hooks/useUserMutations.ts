
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "../types";
import { Database } from "@/integrations/supabase/types";

export const useUserMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      // First, check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role_id: role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role_id: role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı rolü güncellendi",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Rol güncellenirken bir hata oluştu: " + error.message,
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.rpc('request_password_reset', {
        email: email
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şifre sıfırlama bağlantısı gönderildi",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şifre sıfırlama işlemi başarısız: " + error.message,
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);
      
      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('audit_logs')
        .insert({
          action: 'user_deactivated',
          entity_type: 'user',
          entity_id: userId,
          changes: { is_active: false }
        });

      if (logError) throw logError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı devre dışı bırakıldı",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kullanıcı devre dışı bırakılırken bir hata oluştu: " + error.message,
      });
    },
  });

  return {
    assignRoleMutation,
    resetPasswordMutation,
    deactivateUserMutation
  };
};
