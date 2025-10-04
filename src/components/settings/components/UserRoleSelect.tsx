
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRoleSelectProps = {
  userId: string;
  onRoleChange?: (roleId: string) => void;
  className?: string;
};

export const UserRoleSelect = ({ userId, onRoleChange, className }: UserRoleSelectProps) => {
  const { data: userRole } = useQuery({
    queryKey: ['userRole', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role_id, roles(id, name)')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
  });

  const { data: availableRoles } = useQuery({
    queryKey: ['availableRoles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('roles')
        .select('id, name')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      return data || [];
    },
  });
  
  return (
    <Select
      value={userRole?.role_id || ""}
      onValueChange={onRoleChange}
    >
      <SelectTrigger className={className || "w-[140px]"}>
        <SelectValue>
          {userRole?.roles ? (
            <Badge variant="secondary">
              {userRole.roles.name}
            </Badge>
          ) : (
            "Rol seç"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableRoles?.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
