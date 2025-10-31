import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Shield } from "lucide-react";

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddRoleDialog = ({ open, onOpenChange }: AddRoleDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const createRoleMutation = useMutation({
    mutationFn: async () => {
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      // Create role
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: roleName,
          description: roleDescription || null,
          company_id: profile.company_id,
          permissions: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Rol başarıyla oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Rol oluşturulurken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setRoleName("");
    setRoleDescription("");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast({
        title: "Uyarı",
        description: "Rol adı gereklidir",
        variant: "destructive",
      });
      return;
    }
    createRoleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Yeni Rol Ekle</DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Kullanıcılara atanabilecek yeni bir rol oluşturun
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName" className="text-sm font-medium">
              Rol Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roleName"
              placeholder="Örn: Satış Müdürü, Muhasebeci, vb."
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={createRoleMutation.isPending}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleDescription" className="text-sm font-medium">
              Açıklama (İsteğe Bağlı)
            </Label>
            <Textarea
              id="roleDescription"
              placeholder="Bu rolün yetkilerini ve sorumluluklarını kısaca açıklayın..."
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              disabled={createRoleMutation.isPending}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createRoleMutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={createRoleMutation.isPending}
              className="gap-2"
            >
              {createRoleMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Rol Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
