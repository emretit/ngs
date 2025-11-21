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
            onClick={() => autoMatchMutation.mutate()}
            disabled={autoMatchMutation.isPending}
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
          >
            {autoMatchMutation.isPending ? (
              <>
                <Clock className="h-3 w-3 animate-spin" />
                Eşleştiriliyor...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Otomatik Eşleştir
              </>
            )}
          </Button>
          <InviteUserDialog />
        </div>
      </div>

      {/* Search - Çalışan yönetimi sayfasına benzer stil */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kullanıcı ara (isim, email, telefon, departman, pozisyon)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        {searchQuery && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{filteredUsers.length}</span> kullanıcı bulundu
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Users List */}
        <div className="xl:col-span-2">
          {/* Users Table - Çalışan yönetimi sayfasına benzer stil */}
          <div className="rounded-md border bg-white overflow-hidden">
            <UserListTable
              users={filteredUsers}
              isLoading={isLoading}
              onUserUpdated={() => queryClient.invalidateQueries({ queryKey: ['users-management'] })}
            />
          </div>
        </div>

        {/* Right: Role Management */}
        <div>
          <div className="rounded-md border bg-white overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-foreground">Rol Yönetimi</h3>
              </div>
            </div>
            <div className="p-4">
              <RoleManagementPanel users={users} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
