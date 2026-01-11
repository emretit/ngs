
import { useState } from "react";
import { logger } from '@/utils/logger';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const InviteUserDialog = () => {
  const [newUserEmail, setNewUserEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  // Default roles - Admin is always first
  const roles = [
    'Admin',
    'Yönetici',
    'Satış Müdürü',
    'Satış Temsilcisi',
    'Muhasebe',
    'İnsan Kaynakları'
  ];

  // Helper function to map Admin to admin for database
  const mapRoleForDatabase = (role: string): string => {
    if (role === 'Admin') {
      return 'admin';
    }
    return role;
  };

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!userData?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      // Map Admin to admin for database
      const dbRole = mapRoleForDatabase(role);

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          inviting_company_id: userData.company_id,
          role: dbRole
        }
      });

      if (error) {
        // Check if it's a FunctionsHttpError with response body
        if (error.message) {
          throw new Error(error.message);
        }
        throw error;
      }
      
      // Check if response contains an error
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      
      // Show appropriate success message
      const message = data?.message || "Şifre belirleme maili gönderildi";
      toast.success(message);
      
      setNewUserEmail("");
      setSelectedRole("Admin");
      setIsOpen(false);
    },
    onError: (error: any) => {
      logger.error('Invite error:', error);
      const message = error.message || "Davet gönderilirken bir hata oluştu";
      toast.error(message);
    },
  });

  return (
    <>
      <Button 
        className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg transition-all duration-300" 
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4" />
        <span>Yeni Kullanıcı Davet Et</span>
      </Button>
      
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
              E-posta adresi <span className="text-red-500">*</span>
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

          <div>
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              Rol <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={inviteUserMutation.isPending}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Kullanıcıya atanacak rolü seçin
            </p>
          </div>
          
          <UnifiedDialogFooter>
            <UnifiedDialogCancelButton 
              onClick={() => {
                setIsOpen(false);
                setNewUserEmail("");
                setSelectedRole("Admin");
              }} 
              disabled={inviteUserMutation.isPending} 
            />
            <UnifiedDialogActionButton
              onClick={() => inviteUserMutation.mutate({ 
                email: newUserEmail, 
                role: selectedRole 
              })}
              variant="primary"
              disabled={inviteUserMutation.isPending || !newUserEmail.trim() || !selectedRole}
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
