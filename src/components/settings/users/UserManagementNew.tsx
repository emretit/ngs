import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Search, Users, AlertCircle, Phone, Clock, UserCheck, UserX, Link2, Sparkles } from "lucide-react";
import { UserListTable } from "./UserListTable";
import { RoleManagementPanel } from "./RoleManagementPanel";
import { Badge } from "@/components/ui/badge";
import { InviteUserDialog } from "../InviteUserDialog";
import { useAutoMatchUsersEmployees } from "./useAutoMatchUsersEmployees";
import { Button } from "@/components/ui/button";

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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter users based on search (includes phone, department, position)
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const fullName = user.full_name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const phone = user.phone?.toLowerCase() || '';
    const employeeName = user.employees
      ? `${user.employees.first_name} ${user.employees.last_name}`.toLowerCase()
      : '';
    const department = user.employees?.department?.toLowerCase() || '';
    const position = user.employees?.position?.toLowerCase() || '';

    return fullName.includes(searchLower) ||
           email.includes(searchLower) ||
           phone.includes(searchLower) ||
           employeeName.includes(searchLower) ||
           department.includes(searchLower) ||
           position.includes(searchLower);
  });

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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Sol taraf - Başlık */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Kullanıcı Yönetimi
                </h1>
                <p className="text-sm text-blue-100">
                  Sistem kullanıcılarını yönetin, rol atayın ve izinleri kontrol edin
                </p>
              </div>
            </div>

            {/* Sağ taraf - Yeni Kullanıcı Davet Et butonu */}
            <div className="flex items-center gap-3">
              <InviteUserDialog />
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Toplam Kullanıcı */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Toplam</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats.total}</p>
            </div>

            {/* Aktif Kullanıcılar */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Aktif</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>

            {/* Pasif Kullanıcılar */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="h-4 w-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Pasif</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>

            {/* Çalışan Eşleşmiş */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Çalışan</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.withEmployee}</p>
            </div>

            {/* Çalışan Eşleşmemiş */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Eşleşmemiş</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{stats.withoutEmployee}</p>
            </div>

            {/* Son 7 Gün Giriş */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-700">Son 7 Gün</span>
              </div>
              <p className="text-2xl font-bold text-indigo-900">{stats.recentLogins}</p>
            </div>
          </div>

          {/* Auto-Match Button */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => autoMatchMutation.mutate()}
              disabled={autoMatchMutation.isPending}
              variant="outline"
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {autoMatchMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Eşleştiriliyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Email ile Otomatik Eşleştir
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Users List */}
        <div className="xl:col-span-2 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Kullanıcı ara (isim, email, telefon, departman, pozisyon)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">{filteredUsers.length}</span> kullanıcı bulundu
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="p-6 relative overflow-hidden">
              <div className="relative z-10">
                <UserListTable
                  users={filteredUsers}
                  isLoading={isLoading}
                  onUserUpdated={() => queryClient.invalidateQueries({ queryKey: ['users-management'] })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Role Management */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Rol Yönetimi</h3>
                  <p className="text-xs text-muted-foreground">İzinleri düzenleyin</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <RoleManagementPanel users={users} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
