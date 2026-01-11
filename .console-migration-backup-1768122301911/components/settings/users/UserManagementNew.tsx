import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Search, Users, AlertCircle, Phone, Clock, UserCheck, UserX, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListTable } from "./UserListTable";
import { Badge } from "@/components/ui/badge";
import { InviteUserDialog } from "../InviteUserDialog";
import { useAutoMatchUsersEmployees } from "./useAutoMatchUsersEmployees";
import UsersFilterBar from "./UsersFilterBar";
import UsersBulkActions from "./UsersBulkActions";
import { toast } from "sonner";
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

export const UserManagementNew = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedEmployeeMatch, setSelectedEmployeeMatch] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const autoMatchMutation = useAutoMatchUsersEmployees();

  // Fetch users with their employees and roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-management'],
    queryFn: async () => {
      // Get current user's company_id
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      // Get all users in the company with all necessary fields
      // Use employee_id relationship (trigger will sync both directions)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          status,
          created_at,
          last_login,
          phone,
          avatar_url,
          employee_id,
          employees!profiles_employee_id_fkey (
            id,
            first_name,
            last_name,
            position,
            department
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('id, role')
            .eq('user_id', profile.id);

          // Handle employee data - it might be an array or single object
          const employee = Array.isArray(profile.employees) 
            ? profile.employees[0] || null
            : profile.employees || null;

          return {
            ...profile,
            employees: employee,
            user_roles: roles || []
          };
        })
      );

      return usersWithRoles as UserWithEmployee[];
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const errors: string[] = [];
      let successCount = 0;

      for (const userId of userIds) {
        try {
          // Delete user roles first
          const { error: rolesError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId);

          if (rolesError) {
            console.error('Error deleting user roles:', rolesError);
            errors.push(`Kullanıcı rolleri silinemedi: ${rolesError.message}`);
            continue;
          }

          // Delete user profile
          const { error, data } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)
            .select();

          if (error) {
            console.error('Error deleting profile:', error);
            errors.push(`Kullanıcı profilini silinemedi: ${error.message}`);
            continue;
          }

          // Check if any rows were actually deleted
          if (!data || data.length === 0) {
            errors.push('Kullanıcı silinemedi. Lütfen yetkilerinizi kontrol edin.');
            continue;
          }

          successCount++;
        } catch (err: any) {
          console.error('Error deleting user:', err);
          errors.push(err.message || 'Bilinmeyen hata');
        }
      }

      return { successCount, errors };
    },
    onSuccess: ({ successCount, errors }) => {
      if (successCount > 0) {
        toast.success(`${successCount} kullanıcı başarıyla silindi`);
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} kullanıcı silinirken hata oluştu`);
      }
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      console.error('Bulk delete error:', error);
      toast.error(error.message || "Kullanıcılar silinirken hata oluştu");
    },
  });

  // Auto-match on component mount (only once per session)
  useEffect(() => {
    if (isLoading) return; // Wait for data to load

    // Check if we should auto-match on mount
    // This will run once when component mounts, but allow manual re-trigger
    const autoMatchKey = `auto-match-${new Date().toDateString()}`;
    const shouldAutoMatch = sessionStorage.getItem(autoMatchKey) !== "true";

    if (shouldAutoMatch && users.length > 0) {
      // Auto-match silently in background after a short delay
      const timer = setTimeout(() => {
        autoMatchMutation.mutate(undefined, {
          onSuccess: (result) => {
            if (result.matched > 0) {
              sessionStorage.setItem(autoMatchKey, "true");
            }
          },
        });
      }, 1000); // Wait 1 second after page load

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, users.length]); // Run when users are loaded

  // Helper function to map owner/admin role to Admin for display
  const mapRoleForDisplay = (role: string): string => {
    const lowerRole = role.toLowerCase();
    if (lowerRole === 'owner' || lowerRole === 'admin') {
      return 'Admin';
    }
    return role;
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const fullName = user.full_name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const phone = user.phone?.toLowerCase() || '';
      const employeeName = user.employees
        ? `${user.employees.first_name} ${user.employees.last_name}`.toLowerCase()
        : '';
      const department = user.employees?.department?.toLowerCase() || '';
      const position = user.employees?.position?.toLowerCase() || '';

      const matchesSearch = fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchLower) ||
             employeeName.includes(searchLower) ||
             department.includes(searchLower) ||
             position.includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active' && user.status !== 'active') return false;
      if (selectedStatus === 'inactive' && user.status === 'active') return false;
    }

    // Role filter
    if (selectedRole !== 'all') {
      const userRole = mapRoleForDisplay(user.user_roles?.[0]?.role || '');
      if (userRole !== selectedRole) return false;
    }

    // Employee match filter
    if (selectedEmployeeMatch !== 'all') {
      if (selectedEmployeeMatch === 'matched' && !user.employees) return false;
      if (selectedEmployeeMatch === 'unmatched' && user.employees) return false;
    }

    return true;
  });

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    switch (action) {
      case 'activate':
        // Aktifleştir
        for (const userId of selectedUsers) {
          await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
        }
        toast.success(`${selectedUsers.length} kullanıcı aktifleştirildi`);
        setSelectedUsers([]);
        queryClient.invalidateQueries({ queryKey: ['users-management'] });
        break;
      case 'deactivate':
        // Pasifleştir
        for (const userId of selectedUsers) {
          await supabase.from('profiles').update({ status: 'inactive' }).eq('id', userId);
        }
        toast.success(`${selectedUsers.length} kullanıcı pasifleştirildi`);
        setSelectedUsers([]);
        queryClient.invalidateQueries({ queryKey: ['users-management'] });
        break;
      case 'delete':
        // Sil - Dialog aç
        setBulkDeleteDialogOpen(true);
        break;
      case 'export':
        // Excel export
        toast.info('Excel export özelliği yakında eklenecek');
        break;
      case 'assignRole':
        // Rol ata
        toast.info('Toplu rol atama özelliği yakında eklenecek');
        break;
    }
  };

  const handleBulkDeleteConfirm = async () => {
    await bulkDeleteMutation.mutateAsync(selectedUsers);
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
  };

  // Calculate statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status !== 'active' && u.status !== null).length,
    withEmployee: users.filter(u => u.employees).length,
    withoutEmployee: users.filter(u => !u.employees).length,
    recentLogins: users.filter(u => {
      if (!u.last_login) return false;
      const lastLogin = new Date(u.last_login);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return lastLogin >= sevenDaysAgo;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header - Çalışan yönetimi sayfasına benzer stil */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Kullanıcı Yönetimi
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Sistem kullanıcılarını yönetin, rol atayın ve izinleri kontrol edin
            </p>
          </div>
        </div>

        {/* Orta - İstatistik Kartları */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam kullanıcı sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
            <Users className="h-3 w-3" />
            <span className="font-bold">Toplam</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {stats.total}
            </span>
          </div>

          {/* Aktif kullanıcılar */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-800 border-green-200 transition-all duration-200 hover:shadow-sm">
            <UserCheck className="h-3 w-3" />
            <span className="font-medium">Aktif</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {stats.active}
            </span>
          </div>

          {/* Pasif kullanıcılar */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200 transition-all duration-200 hover:shadow-sm">
            <UserX className="h-3 w-3" />
            <span className="font-medium">Pasif</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {stats.inactive}
            </span>
          </div>

          {/* Çalışan eşleşmiş */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200 transition-all duration-200 hover:shadow-sm">
            <Users className="h-3 w-3" />
            <span className="font-medium">Çalışan</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {stats.withEmployee}
            </span>
          </div>

          {/* Çalışan eşleşmemiş */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-amber-100 text-amber-800 border-amber-200 transition-all duration-200 hover:shadow-sm">
            <AlertCircle className="h-3 w-3" />
            <span className="font-medium">Eşleşmemiş</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {stats.withoutEmployee}
            </span>
          </div>

          {/* Son 7 Gün Giriş */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-indigo-100 text-indigo-800 border-indigo-200 transition-all duration-200 hover:shadow-sm">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Son 7 Gün</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {stats.recentLogins}
            </span>
          </div>
        </div>

        {/* Sağ taraf - Butonlar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-2 border-primary/50 hover:bg-primary hover:text-white transition-all duration-300"
            onClick={() => navigate("/settings/roles")}
          >
            <Shield className="h-4 w-4" />
            <span>Roller</span>
          </Button>
          <InviteUserDialog />
        </div>
      </div>

      {/* Kullanıcılar Content */}
      <div className="space-y-4">
        {/* Filter Bar */}
        <UsersFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedEmployeeMatch={selectedEmployeeMatch}
          setSelectedEmployeeMatch={setSelectedEmployeeMatch}
        />

        {/* Bulk Actions */}
        <UsersBulkActions
          selectedUsers={selectedUsers}
          onClearSelection={() => setSelectedUsers([])}
          onBulkAction={handleBulkAction}
        />

        {/* Users Table */}
        <div className="rounded-md border bg-white overflow-hidden">
          <UserListTable
            users={filteredUsers}
            isLoading={isLoading}
            onUserUpdated={() => queryClient.invalidateQueries({ queryKey: ['users-management'] })}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
          />
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Toplu Kullanıcı Silme"
        description={`Seçili ${selectedUsers.length} kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={handleBulkDeleteCancel}
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  );
};
