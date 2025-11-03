
import { UserWithRoles } from "./types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  isLoading?: boolean;
};

export const UserList = ({ users, isLoading }: UserListProps) => {
  const { assignRoleMutation, resetPasswordMutation, deactivateUserMutation } = useUserMutations();

  if (isLoading) {
    return (
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Kullanıcı bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow 
                key={user.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell>
                  <UserAvatar user={user} />
                </TableCell>
                <TableCell>
                  <UserRoleSelect 
                    userId={user.id}
                    onRoleChange={(roleId) => assignRoleMutation.mutate({ userId: user.id, role: roleId })}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active !== false ? "default" : "secondary"}>
                    {user.is_active !== false ? "Aktif" : "Devre Dışı"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
