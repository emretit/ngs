
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserWithRoles, UserRole } from "../types";

type UserRoleSelectProps = {
  user?: UserWithRoles;
  userId?: string;
  currentRoles?: UserRole[];
  onRoleChange?: (role: UserRole['role']) => void;
  className?: string;
};

export const UserRoleSelect = ({ user, userId, currentRoles, onRoleChange, className }: UserRoleSelectProps) => {
  const roles = currentRoles || user?.user_roles || [];
  
  return (
    <Select
      value={roles?.[0]?.role || "viewer"}
      onValueChange={onRoleChange}
    >
      <SelectTrigger className={className || "w-[140px]"}>
        <SelectValue>
          {roles?.[0]?.role ? (
            <Badge variant="secondary">
              {roles[0].role}
            </Badge>
          ) : (
            "Rol seç"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="sales">Satış</SelectItem>
        <SelectItem value="manager">Yönetici</SelectItem>
        <SelectItem value="viewer">Görüntüleyici</SelectItem>
      </SelectContent>
    </Select>
  );
};
