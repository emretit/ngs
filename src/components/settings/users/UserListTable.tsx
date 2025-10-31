import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Building2, CheckCircle2, Users, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserWithEmployee {
  id: string;
  email: string;
  full_name: string | null;
  status: string | null;
  created_at: string;
  employee_id: string | null;
  employees: {
    id: string;
    first_name: string;
    last_name: string;
    position: string;
    department: string;
  } | null;
  user_roles: Array<{
    id: string;
    role: string;
  }>;
}

interface UserListTableProps {
  users: UserWithEmployee[];
  isLoading: boolean;
  onUserUpdated: () => void;
}

export const UserListTable = ({ users, isLoading, onUserUpdated }: UserListTableProps) => {
  const { toast } = useToast();

  // Default roles if no custom roles exist
  const defaultRoles = [
    'Admin',
    'Yönetici',
    'Satış Müdürü',
    'Satış Temsilcisi',
    'Muhasebe',
    'İnsan Kaynakları'
  ];

  // Fetch available roles
  const { data: customRoles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('roles')
        .select('name')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      return (data || []).map(r => r.name);
    }
  });

  // Combine custom roles with default roles, removing duplicates
  const roles = customRoles.length > 0
    ? [...new Set([...customRoles, ...defaultRoles])]
    : defaultRoles;

  // Update user role mutation
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
      toast({
        title: "Başarılı",
        description: "Kullanıcı rolü güncellendi",
      });
      onUserUpdated();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Rol güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-9 w-[150px]" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">Kullanıcı Bulunamadı</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Arama kriterlerinize uygun kullanıcı bulunamadı.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Çalışan Kaydı</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const currentRole = user.user_roles?.[0]?.role || '';
            const initials = user.full_name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || user.email[0].toUpperCase();

            return (
              <TableRow key={user.id} className="hover:bg-muted/50">
                {/* User Info */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {user.full_name || 'İsimsiz Kullanıcı'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Employee Match */}
                <TableCell>
                  {user.employees ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-medium">
                          {user.employees.first_name} {user.employees.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {user.employees.department} • {user.employees.position}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-amber-600">Çalışan kaydı yok</span>
                  )}
                </TableCell>

                {/* Role Select */}
                <TableCell>
                  <Select
                    value={currentRole}
                    onValueChange={(role) =>
                      updateRoleMutation.mutate({ userId: user.id, role })
                    }
                    disabled={updateRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-2">
                          Rol bulunamadı
                        </div>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    variant={user.status === 'active' ? 'default' : 'secondary'}
                    className={
                      user.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }
                  >
                    {user.status === 'active' ? 'Aktif' : 'Pasif'}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
