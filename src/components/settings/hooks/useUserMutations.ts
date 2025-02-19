
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "../types";
import { Database } from "@/integrations/supabase/types";

export const useUserMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole['role'] }) => {
      const { error } = await supabase.rpc('assign_role', {
        target_user_id: userId,
        new_role: role
      });
      if (error) throw error;
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
      const updateData: Database['public']['Tables']['profiles']['Update'] = {
        is_active: false
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
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
