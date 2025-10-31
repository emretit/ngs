import { UserWithRoles } from "./types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "./components/UserAvatar";
import { UserActions } from "./components/UserActions";
import { Mail, Building2, Users as UsersIcon, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ModernUserListProps = {
  users: UserWithRoles[];
  isLoading?: boolean;
};

export const ModernUserList = ({ users, isLoading }: ModernUserListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Delete existing roles
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı rolü güncellendi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Rol güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <UsersIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-foreground">Kullanıcı bulunamadı</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Arama kriterlerinize uygun kullanıcı bulunamadı. Filtreleri değiştirerek tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {users.map((user) => {
        const currentRole = user.user_roles?.[0]?.role || '';
        
        return (
          <div 
            key={user.id} 
            className="p-4 hover:bg-blue-50/50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              {/* Avatar & Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <UserAvatar user={user} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {user.full_name || 'İsimsiz Kullanıcı'}
                    </h4>
                    <Badge 
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                      className={`text-xs ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {user.status === 'active' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                  {user.employees && (
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {user.employees.department} • {user.employees.position}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Role Select */}
              <div className="w-[180px]">
                <Select
                  value={currentRole}
                  onValueChange={(role) => handleRoleChange(user.id, role)}
                >
                  <SelectTrigger className="h-9 text-xs border-gray-200">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sistem Yöneticisi">🔐 Sistem Yöneticisi</SelectItem>
                    <SelectItem value="Yönetici">👑 Yönetici</SelectItem>
                    <SelectItem value="Satış Müdürü">👨‍💼 Satış Müdürü</SelectItem>
                    <SelectItem value="Satış Temsilcisi">💼 Satış Temsilcisi</SelectItem>
                    <SelectItem value="Muhasebe">💰 Muhasebe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Match - Read-only display */}
              <div className="w-[200px]">
                <div className="flex items-center gap-2">
                  {user.employees ? (
                    <div className="flex items-center gap-1.5 text-xs flex-1 min-w-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      <span className="truncate text-muted-foreground">
                        {user.employees.first_name} {user.employees.last_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 flex-1">Çalışan kaydı yok</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <UserActions userId={user.id} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModernUserList;
