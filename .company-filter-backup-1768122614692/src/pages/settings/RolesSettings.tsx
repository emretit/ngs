import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RoleManagementPanel } from "@/components/settings/users/RoleManagementPanel";
import { Shield, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface UserWithEmployee {
  id: string;
  email: string;
  full_name: string | null;
  status: string | null;
  created_at: string;
  last_login: string | null;
  phone: string | null;
  avatar_url: string | null;
  employee_id: string | null;
  employees: {
    id: string;
    first_name: string;
    last_name: string;
    position: string;
    department: string;
  } | null;
  user_roles: Array<{
    id: string;
    role: string;
  }>;
}

const RolesSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Fetch users with their employees and roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-management'],
    queryFn: async () => {
      // Get current user's company_id
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      // Get all users in the company with all necessary fields
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          status,
          created_at,
          last_login,
          phone,
          avatar_url,
          employee_id,
          employees!profiles_employee_id_fkey (
            id,
            first_name,
            last_name,
            position,
            department
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('id, role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );

      return usersWithRoles as UserWithEmployee[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/users")}
            className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary hover:border-primary/20 transition-all duration-200 hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">{t("common.back")}</span>
          </Button>
          <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t("settings.roleManagement")}
            </h1>
            <p className="text-xs text-muted-foreground/70">
              {t("settings.roleManagementDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Role Management Panel */}
      <Card className="border border-gray-200 shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <h3 className="text-base font-semibold text-foreground">{t("settings.rolePermissions")}</h3>
          </div>
        </div>
        <div className="p-4">
          {users && users.length > 0 ? (
            <RoleManagementPanel users={users} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("settings.noUsersFound")}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RolesSettings;

