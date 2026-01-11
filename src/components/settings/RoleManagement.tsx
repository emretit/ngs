
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { RoleCard } from "./RoleCard";
import { RoleDialog } from "./RoleDialog";
import { Shield, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const RoleManagement = () => {
  const { userData } = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles', userData?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          user_roles(count)
        `)
        .order('priority', { ascending: false })
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id,
  });

  const handleNewRole = () => {
    setSelectedRoleId(undefined);
    setDialogOpen(true);
  };

  const handleEditRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const systemRoles = roles?.filter(r => r.role_type === 'system') || [];
  const customRoles = roles?.filter(r => r.role_type === 'custom') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">Rol & İzin Yönetimi</h2>
            <p className="text-sm text-muted-foreground">
              Kullanıcı rollerini ve izinlerini yönetin
            </p>
          </div>
        </div>
        <Button onClick={handleNewRole} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Rol Ekle
        </Button>
      </div>

      {systemRoles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">Sistem Rolleri</h3>
            <Badge variant="secondary">Düzenlenemez</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={{
                  name: role.name,
                  description: role.description || '',
                  permissions: role.permissions?.modules || {},
                  // @ts-ignore
                  userCount: role.user_roles?.[0]?.count || 0,
                }}
                onEdit={() => {}}
                onDelete={() => {}}
                isSystem={true}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Özel Roller</h3>
        {customRoles.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz özel rol yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              İhtiyaçlarınıza göre özelleştirilmiş roller oluşturun
            </p>
            <Button onClick={handleNewRole} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              İlk Rolü Oluştur
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={{
                  name: role.name,
                  description: role.description || '',
                  permissions: role.permissions?.modules || {},
                  // @ts-ignore
                  userCount: role.user_roles?.[0]?.count || 0,
                }}
                onEdit={() => handleEditRole(role.id)}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        roleId={selectedRoleId}
      />
    </div>
  );
};
