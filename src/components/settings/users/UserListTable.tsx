import { useMutation } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Mail, Building2, CheckCircle2, Users, Loader2, Phone, Clock, AlertCircle, UserCheck, Link2, Trash2 } from "lucide-react";
import { DateDisplay } from "@/components/ui/date-display";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmployeeUserMatchDialog } from "./EmployeeUserMatchDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface UserWithEmployee {
  id: string;
  email: string;
  full_name: string | null;
  status: string | null;
  created_at: string;
  last_login: string | null;
  phone: string | null;
  avatar_url: string | null;
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
  selectedUsers?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const UserListTable = ({ 
  users, 
  isLoading, 
  onUserUpdated,
  selectedUsers = [],
  onSelectionChange
}: UserListTableProps) => {
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithEmployee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithEmployee | null>(null);
  const { userData } = useCurrentUser();

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? users.map(u => u.id) : []);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedUsers, userId]);
      } else {
        onSelectionChange(selectedUsers.filter(id => id !== userId));
      }
    }
  };

  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  // Helper function to map owner/admin role to Admin for display
  const mapRoleForDisplay = (role: string): string => {
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'owner' || lowerRole === 'admin') {
      return 'Admin';
    }
    return role;
  };

  // Helper function to map Admin to admin for database
  const mapRoleForDatabase = (role: string): string => {
    if (role === 'Admin') {
      return 'admin';
    }
    return role;
  };

  // Default roles - Admin is always first
  const roles = [
    'Admin',
    'Yönetici',
    'Satış Müdürü',
    'Satış Temsilcisi',
    'Muhasebe',
    'İnsan Kaynakları'
  ];

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!userData?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      // Delete existing roles
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // Map Admin back to owner for database
      const dbRole = mapRoleForDatabase(role);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: dbRole,
          company_id: userData.company_id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kullanıcı rolü güncellendi");
      onUserUpdated();
    },
    onError: () => {
      toast.error("Rol güncellenirken hata oluştu");
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete user roles first
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (rolesError) {
        logger.error('Error deleting user roles:', rolesError);
        throw new Error('Kullanıcı rollerini silerken hata oluştu: ' + rolesError.message);
      }
      
      // Delete user profile (this will cascade to auth.users if configured)
      const { error, data } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select();

      if (error) {
        logger.error('Error deleting profile:', error);
        throw new Error('Kullanıcı profilini silerken hata oluştu: ' + error.message);
      }

      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        throw new Error('Kullanıcı silinemedi. Lütfen yetkilerinizi kontrol edin.');
      }
    },
    onSuccess: () => {
      toast.success("Kullanıcı başarıyla silindi");
      onUserUpdated();
    },
    onError: (error: any) => {
      logger.error('Delete user error:', error);
      toast.error(error.message || "Kullanıcı silinirken hata oluştu");
    },
  });

  const handleDeleteClick = (user: UserWithEmployee) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    await deleteUserMutation.mutateAsync(userToDelete.id);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-semibold text-gray-700">Kullanıcı</TableHead>
              <TableHead className="font-semibold text-gray-700">İletişim</TableHead>
              <TableHead className="font-semibold text-gray-700">Çalışan Kaydı</TableHead>
              <TableHead className="font-semibold text-gray-700">Rol</TableHead>
              <TableHead className="font-semibold text-gray-700">Durum</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="border-b border-gray-100">
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[180px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-[120px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-6 w-[140px]" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-9 w-[180px] rounded-md" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-6 w-[70px] rounded-full" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-8 w-[100px] rounded-md mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <Users className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Kullanıcı Bulunamadı</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Arama kriterlerinize uygun kullanıcı bulunamadı.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              {onSelectionChange && (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className={someSelected ? "data-[state=checked]:bg-blue-500" : ""}
                />
              )}
            </TableHead>
            <TableHead className="font-semibold text-gray-700">Kullanıcı</TableHead>
            <TableHead className="font-semibold text-gray-700">İletişim</TableHead>
            <TableHead className="font-semibold text-gray-700">Çalışan Kaydı</TableHead>
            <TableHead className="font-semibold text-gray-700">Rol</TableHead>
            <TableHead className="font-semibold text-gray-700">Durum</TableHead>
            <TableHead className="text-center font-semibold text-gray-700">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            // Map owner role to Admin for display
            const rawRole = user.user_roles?.[0]?.role || '';
            const currentRole = mapRoleForDisplay(rawRole);
            const initials = user.full_name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase() || user.email[0].toUpperCase();

            const handleOpenMatchDialog = () => {
              setSelectedUser(user);
              setMatchDialogOpen(true);
            };

            return (
              <TableRow 
                key={user.id} 
                className={`hover:bg-blue-50/50 transition-all duration-200 group border-b border-gray-100 ${
                  selectedUsers.includes(user.id) ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Checkbox */}
                <TableCell className="py-4">
                  {onSelectionChange && (
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  )}
                </TableCell>

                {/* User Info */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-11 w-11 ring-2 ring-white shadow-sm">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {user.status === 'active' && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-gray-900 truncate mb-0.5">
                        {user.full_name || 'İsimsiz Kullanıcı'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                        <Mail className="h-3 w-3 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.last_login && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="h-3 w-3 flex-shrink-0 text-gray-400" />
                          <span className="truncate">
                            {formatDistanceToNow(new Date(user.last_login), { 
                              addSuffix: true, 
                              locale: tr 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Contact Info */}
                <TableCell className="py-4">
                  <div className="space-y-1.5">
                    {user.phone ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">{user.phone}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                    {user.created_at && (
                      <DateDisplay date={user.created_at} className="text-xs" />
                    )}
                  </div>
                </TableCell>

                {/* Employee Match */}
                <TableCell className="py-4">
                  {user.employees ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-green-100 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {user.employees.first_name} {user.employees.last_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 pl-6">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <span className="truncate">
                          {user.employees.department} • {user.employees.position}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-amber-100 rounded-full">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <span className="text-sm text-amber-700 font-medium">Eşleşmemiş</span>
                    </div>
                  )}
                </TableCell>

                {/* Role Select */}
                <TableCell className="py-4">
                  <Select
                    value={currentRole || undefined}
                    onValueChange={(role) =>
                      updateRoleMutation.mutate({ userId: user.id, role })
                    }
                    disabled={updateRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-[180px] h-9 border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-500/20">
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
                <TableCell className="py-4">
                  <Badge
                    variant={user.status === 'active' ? 'default' : 'secondary'}
                    className={
                      user.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200 font-medium shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 font-medium'
                    }
                  >
                    {user.status === 'active' ? 'Aktif' : 'Pasif'}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenMatchDialog}
                      className="h-8 w-8"
                      title={user.employees ? 'Eşleştirmeyi Değiştir' : 'Çalışan ile Eşleştir'}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(user)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      title="Kullanıcıyı Sil"
                      disabled={deleteUserMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Match Dialog */}
      {selectedUser && (
        <EmployeeUserMatchDialog
          open={matchDialogOpen}
          onOpenChange={setMatchDialogOpen}
          user={{
            id: selectedUser.id,
            email: selectedUser.email,
            full_name: selectedUser.full_name,
            employee_id: selectedUser.employee_id,
          }}
          onSuccess={() => {
            onUserUpdated();
            setSelectedUser(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Kullanıcıyı Sil"
        description={`"${userToDelete?.full_name || userToDelete?.email || 'Bu kullanıcı'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
};
