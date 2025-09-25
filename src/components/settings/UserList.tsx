
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
import { EmployeeMatchingDialog } from "./EmployeeMatchingDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Building2 } from "lucide-react";

type UserListProps = {
  users: UserWithRoles[];
  isLoading?: boolean;
};

export const UserList = ({ users, isLoading }: UserListProps) => {
  const { assignRoleMutation, resetPasswordMutation, deactivateUserMutation } = useUserMutations();
  const [selectedProfile, setSelectedProfile] = useState<UserWithRoles | null>(null);
  const [isMatchingDialogOpen, setIsMatchingDialogOpen] = useState(false);

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
            <TableHead>Çalışan Eşleştirme</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                    user={user}
                    onRoleChange={(role) => assignRoleMutation.mutate({ userId: user.id, role })}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {user.employee_id ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <Building2 className="h-3 w-3 mr-1" />
                        Eşleştirilmiş
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        Eşleştirilmemiş
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProfile(user);
                        setIsMatchingDialogOpen(true);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      {user.employee_id ? "Değiştir" : "Eşleştir"}
                    </Button>
                  </div>
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
      
      <EmployeeMatchingDialog
        isOpen={isMatchingDialogOpen}
        onClose={() => {
          setIsMatchingDialogOpen(false);
          setSelectedProfile(null);
        }}
        profile={selectedProfile}
      />
    </div>
  );
};
