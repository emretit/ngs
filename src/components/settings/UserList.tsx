
import { UserWithRoles } from "./types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserMutations } from "./hooks/useUserMutations";
import { UserAvatar } from "./components/UserAvatar";
import { UserRoleSelect } from "./components/UserRoleSelect";
import { UserActions } from "./components/UserActions";

type UserListProps = {
  users: UserWithRoles[];
};

export const UserList = ({ users }: UserListProps) => {
  const { assignRoleMutation, resetPasswordMutation, deactivateUserMutation } = useUserMutations();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kullanıcı</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Kayıt Tarihi</TableHead>
          <TableHead className="text-right">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <UserAvatar user={user} />
            </TableCell>
            <TableCell>
              <UserRoleSelect 
                user={user}
                onRoleChange={(role) => assignRoleMutation.mutate({ userId: user.id, role })}
              />
            </TableCell>
            <TableCell>
              <Badge>{user.is_active !== false ? "Aktif" : "Devre Dışı"}</Badge>
            </TableCell>
            <TableCell>
              {user.created_at && new Date(user.created_at).toLocaleDateString('tr-TR')}
            </TableCell>
            <TableCell className="text-right">
              <UserActions 
                user={user}
                onResetPassword={() => resetPasswordMutation.mutate(user.email || '')}
                onDeactivate={() => deactivateUserMutation.mutate(user.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
