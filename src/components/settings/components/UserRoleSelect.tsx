
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
  user: UserWithRoles;
  onRoleChange: (role: UserRole['role']) => void;
};

export const UserRoleSelect = ({ user, onRoleChange }: UserRoleSelectProps) => {
  return (
    <Select
      value={user.user_roles?.[0]?.role || "viewer"}
      onValueChange={onRoleChange}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          {user.user_roles?.[0]?.role ? (
            <Badge variant="secondary">
              {user.user_roles[0].role}
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
