
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const InviteUserDialog = () => {
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  const inviteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!userData?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          inviting_company_id: userData.company_id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Başarılı",
        description: "Şifre belirleme maili gönderildi",
      });
      setNewUserEmail("");
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Davet gönderilirken bir hata oluştu: " + error.message,
      });
    },
  });

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Yeni Kullanıcı Davet Et</Button>
      
      <UnifiedDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Şirkete Kullanıcı Davet Et"
        maxWidth="md"
        headerColor="green"
      >
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">Davet edilen kullanıcıya Supabase üzerinden şifre belirleme e-postası gönderilir.</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-posta adresi
            </Label>
            <Input
              id="email"
              placeholder="kullanici@example.com"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              disabled={inviteUserMutation.isPending}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bu kullanıcıya şifre belirleme maili gönderilecek
            </p>
          </div>
          
          <UnifiedDialogFooter>
            <UnifiedDialogCancelButton onClick={() => setIsOpen(false)} disabled={inviteUserMutation.isPending} />
            <UnifiedDialogActionButton
              onClick={() => inviteUserMutation.mutate(newUserEmail)}
              variant="primary"
              disabled={inviteUserMutation.isPending || !newUserEmail.trim()}
              loading={inviteUserMutation.isPending}
            >
              Davet Gönder
            </UnifiedDialogActionButton>
          </UnifiedDialogFooter>
        </div>
      </UnifiedDialog>
    </>
  );
};
