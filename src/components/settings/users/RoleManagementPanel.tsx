import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Shield, Users, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddRoleDialog } from "./AddRoleDialog";

interface UserWithEmployee {
  id: string;
  user_roles: Array<{
    id: string;
    role: string;
  }>;
}

interface RoleManagementPanelProps {
  users: UserWithEmployee[];
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[] | null;
}

export const RoleManagementPanel = ({ users }: RoleManagementPanelProps) => {
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);

  // Fetch roles
  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Calculate user count per role
  const getRoleUserCount = (roleName: string) => {
    return users.filter(u => u.user_roles?.some(r => r.role === roleName)).length;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 border rounded-lg">
            <Skeleton className="h-4 w-[120px] mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <>
        <div className="text-center py-12 px-4">
          <div className="p-4 bg-purple-100 rounded-full mb-4 w-fit mx-auto">
            <Shield className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz rol tanımlanmamış</h3>
          <p className="text-sm text-gray-500 mb-6">İlk rolünüzü ekleyerek başlayabilirsiniz</p>
          <Button
            onClick={() => setIsAddRoleDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
          >
            <Plus className="h-4 w-4" />
            İlk Rolü Ekle
          </Button>
        </div>
        <AddRoleDialog
          open={isAddRoleDialogOpen}
          onOpenChange={setIsAddRoleDialogOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Button
          onClick={() => setIsAddRoleDialogOpen(true)}
          className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Yeni Rol Ekle
        </Button>
      </div>

      <ScrollArea className="h-[530px] pr-4">
        <div className="space-y-3">
        {roles.map((role) => {
          const userCount = getRoleUserCount(role.name);
          const permissionsCount = role.permissions?.length || 0;

          return (
            <div
              key={role.id}
              className="group relative overflow-hidden bg-white border-2 border-purple-100 rounded-xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-purple-100 rounded-full -translate-y-12 translate-x-12"></div>

              <div className="relative p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-sm text-gray-900">{role.name}</h4>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-xs gap-1 font-semibold">
                    <Users className="h-3 w-3" />
                    {userCount}
                  </Badge>
                </div>

                {role.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {role.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs text-gray-500 font-medium">{permissionsCount} İzin</span>
                  </div>
                </div>

                {/* Permissions Preview */}
                {role.permissions && role.permissions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <Badge
                        key={`${role.id}-${permission}`}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 border-purple-200 text-purple-700"
                      >
                        {permission}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge
                        key={`${role.id}-more`}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 border-purple-200 text-purple-700 font-semibold"
                      >
                        +{role.permissions.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </ScrollArea>

      <AddRoleDialog
        open={isAddRoleDialogOpen}
        onOpenChange={setIsAddRoleDialogOpen}
      />
    </>
  );
};
