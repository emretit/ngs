import { UserWithRoles } from "./types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserActions } from "./components/UserActions";
import { UserRoleSelect } from "./components/UserRoleSelect";
import { UserAvatar } from "./components/UserAvatar";
import { MoreHorizontal, Mail, Building2, Calendar, Users, User } from "lucide-react";

type UserGridViewProps = {
  users: UserWithRoles[];
  isLoading?: boolean;
};

const UserGridView = ({ users, isLoading }: UserGridViewProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">Kullanıcı bulunamadı</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Arama kriterlerinizi değiştirerek tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {users.map((user) => (
        <Card key={user.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserAvatar user={user} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {user.full_name || 'İsimsiz Kullanıcı'}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <UserActions userId={user.id} />
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 space-y-3">
            {/* Roller */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Roller:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.user_roles && user.user_roles.length > 0 ? (
                  user.user_roles.map((role, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {role.role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Rol yok
                  </Badge>
                )}
              </div>
            </div>

            {/* Departman */}
            {user.employees && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span>{user.employees.department || 'Departman yok'}</span>
              </div>
            )}

            {/* Pozisyon */}
            {user.employees && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{user.employees.position || 'Pozisyon yok'}</span>
              </div>
            )}

            {/* Kayıt tarihi */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Tarih yok'}
              </span>
            </div>

            {/* Durum */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge 
                variant={user.status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {user.status === 'active' ? 'Aktif' : 'Pasif'}
              </Badge>
              
              {/* Rol değiştirme */}
              <UserRoleSelect 
                userId={user.id} 
                currentRoles={user.user_roles || []}
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { UserGridView };
export default UserGridView;
