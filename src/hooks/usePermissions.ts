import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthContext";

export type ModulePermission = {
  access: boolean;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
};

export type ModulePermissions = {
  [module: string]: ModulePermission;
};

export const usePermissions = () => {
  const { user } = useAuth();

  const { data: permissions, isLoading, error } = useQuery({
    queryKey: ['userPermissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role_id, roles!inner(permissions, is_active)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user permissions:', error);
        return null;
      }

      // @ts-ignore - roles is from the join
      const role = data?.roles;
      if (!role || !role.is_active) {
        return null;
      }

      return (role.permissions?.modules || {}) as ModulePermissions;
    },
    enabled: !!user?.id,
  });

  const hasModuleAccess = (module: string): boolean => {
    return permissions?.[module]?.access === true;
  };

  const canCreate = (module: string): boolean => {
    return permissions?.[module]?.create === true;
  };

  const canRead = (module: string): boolean => {
    return permissions?.[module]?.read === true;
  };

  const canUpdate = (module: string): boolean => {
    return permissions?.[module]?.update === true;
  };

  const canDelete = (module: string): boolean => {
    return permissions?.[module]?.delete === true;
  };

  const canExport = (module: string): boolean => {
    return permissions?.[module]?.export === true;
  };

  const hasAnyPermission = (module: string, actions: Array<'create' | 'read' | 'update' | 'delete' | 'export'>): boolean => {
    if (!permissions?.[module]) return false;
    return actions.some(action => permissions[module][action] === true);
  };

  const hasAllPermissions = (module: string, actions: Array<'create' | 'read' | 'update' | 'delete' | 'export'>): boolean => {
    if (!permissions?.[module]) return false;
    return actions.every(action => permissions[module][action] === true);
  };

  return {
    permissions,
    isLoading,
    error,
    hasModuleAccess,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    hasAnyPermission,
    hasAllPermissions,
  };
};
