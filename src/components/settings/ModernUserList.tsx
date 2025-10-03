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
import { Mail, Building2, Shield, Users as UsersIcon, UserPlus, Link2, CheckCircle2, Settings } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";

type ModernUserListProps = {
  users: UserWithRoles[];
  isLoading?: boolean;
};

export const ModernUserList = ({ users, isLoading }: ModernUserListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<{ [key: string]: string }>({});

  // Fetch all employees
  const { data: allEmployees = [] } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position, department')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    }
  });

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

  // Update employee matching
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ userId, employeeId }: { userId: string; employeeId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ employee_id: employeeId })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Başarılı",
        description: "Çalışan eşleştirmesi güncellendi",
      });
      setEditingUserId(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Eşleştirme güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleEmployeeMatch = (userId: string, employeeId: string) => {
    updateEmployeeMutation.mutate({ userId, employeeId });
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden">
        <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4" />
                      <span>Kullanıcı</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Rol</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-center">
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Çalışan Eşleştirme</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Durum</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Settings className="h-4 w-4" />
                      <span>İşlem</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="h-6">
                    <TableCell className="py-1 px-3"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell className="py-1 px-3"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell className="py-1 px-2"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell className="py-1 px-2"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell className="py-1 px-2"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell className="py-1 px-2"><div className="h-5 w-5 bg-gray-200 rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <UsersIcon className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">Kullanıcı bulunamadı</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Arama kriterlerinizi değiştirerek tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    <span>Kullanıcı</span>
                  </div>
                </TableHead>
                <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                </TableHead>
                <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Rol</span>
                  </div>
                </TableHead>
                <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-center">
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Çalışan Eşleştirme</span>
                  </div>
                </TableHead>
                <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Durum</span>
                  </div>
                </TableHead>
                <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Settings className="h-4 w-4" />
                    <span>İşlem</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const currentRole = user.user_roles?.[0]?.role || '';
                const isEditing = editingUserId === user.id;
                
                return (
                  <TableRow 
                    key={user.id} 
                    className="cursor-pointer hover:bg-blue-50 h-6"
                  >
                    {/* Kullanıcı */}
                    <TableCell className="py-1 px-3">
                      <UserAvatar user={user} size="sm" />
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-1 px-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </TableCell>

                    {/* Rol */}
                    <TableCell className="py-1 px-2 text-center">
                      <Select
                        value={currentRole}
                        onValueChange={(role) => handleRoleChange(user.id, role)}
                      >
                        <SelectTrigger className="h-5 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sistem Yöneticisi">🔐 Sistem Yöneticisi</SelectItem>
                          <SelectItem value="Yönetici">👑 Yönetici</SelectItem>
                          <SelectItem value="Satış Müdürü">👨‍💼 Satış Müdürü</SelectItem>
                          <SelectItem value="Satış Temsilcisi">💼 Satış Temsilcisi</SelectItem>
                          <SelectItem value="Muhasebe">💰 Muhasebe</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Çalışan Eşleştirme */}
                    <TableCell className="py-1 px-2 text-center">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <EmployeeSelector
                            value={user.employee_id || ''}
                            onValueChange={(employeeId) => handleEmployeeMatch(user.id, employeeId)}
                            className="h-5 text-xs flex-1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => setEditingUserId(null)}
                          >
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          {user.employees ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span className="truncate">
                                {user.employees.first_name} {user.employees.last_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Eşleştirilmedi</span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => setEditingUserId(user.id)}
                          >
                            <Link2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    {/* Durum */}
                    <TableCell className="py-1 px-2 text-center">
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
                    </TableCell>

                    {/* İşlem */}
                    <TableCell className="py-1 px-2 text-right">
                      <UserActions userId={user.id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
    </div>
  );
};

export default ModernUserList;
