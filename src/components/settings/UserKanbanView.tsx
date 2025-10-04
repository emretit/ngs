import { UserWithRoles } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserActions } from "./components/UserActions";
import { UserRoleSelect } from "./components/UserRoleSelect";
import { UserAvatar } from "./components/UserAvatar";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

type UserKanbanViewProps = {
  users: UserWithRoles[];
  isLoading?: boolean;
};

const UserKanbanView = ({ users, isLoading }: UserKanbanViewProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <Card key={cardIndex} className="p-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Kullanıcıları durumlarına göre grupla
  const groupedUsers = {
    active: users.filter(user => user.status === 'active'),
    inactive: users.filter(user => user.status === 'inactive'),
    pending: users.filter(user => user.status === 'pending'),
    admin: users.filter(user => user.user_roles?.some(role => role.role === 'admin'))
  };

  const columns = [
    {
      id: 'active',
      title: 'Aktif Kullanıcılar',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      users: groupedUsers.active
    },
    {
      id: 'inactive',
      title: 'Pasif Kullanıcılar',
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      users: groupedUsers.inactive
    },
    {
      id: 'pending',
      title: 'Beklemede',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      users: groupedUsers.pending
    },
    {
      id: 'admin',
      title: 'Yöneticiler',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      users: groupedUsers.admin
    }
  ];

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const Icon = column.icon;
        return (
          <div key={column.id} className="space-y-4">
            {/* Kolon başlığı */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${column.bgColor}`}>
              <Icon className={`h-5 w-5 ${column.color}`} />
              <h3 className="font-medium text-foreground">{column.title}</h3>
              <Badge variant="secondary" className="ml-auto">
                {column.users.length}
              </Badge>
            </div>

            {/* Kullanıcı kartları */}
            <div className="space-y-3">
              {column.users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <UserAvatar user={user} size="sm" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {user.full_name || 'İsimsiz Kullanıcı'}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <UserActions userId={user.id} />
                    </div>

                    {/* Roller */}
                    <div className="space-y-2">
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
                      <div className="mt-2 text-xs text-muted-foreground">
                        {user.employees.department || 'Departman yok'}
                      </div>
                    )}

                    {/* Rol değiştirme */}
                    <div className="mt-3 pt-2 border-t">
                      <UserRoleSelect 
                        userId={user.id}
                        className="text-xs w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { UserKanbanView };
export default UserKanbanView;
