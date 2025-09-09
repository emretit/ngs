
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Yeni Kullanıcı Davet Et</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şirkete Kullanıcı Davet Et</DialogTitle>
          <DialogDescription>
            Davet edilen kullanıcıya Supabase üzerinden şifre belirleme e-postası gönderilir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              E-posta adresi
            </label>
            <Input
              placeholder="kullanici@example.com"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              disabled={inviteUserMutation.isPending}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Bu kullanıcıya şifre belirleme maili gönderilecek
            </p>
          </div>
          <Button 
            onClick={() => inviteUserMutation.mutate(newUserEmail)}
            disabled={inviteUserMutation.isPending || !newUserEmail.trim()}
            className="w-full"
          >
            {inviteUserMutation.isPending ? "Gönderiliyor..." : "Davet Gönder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
