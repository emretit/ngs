import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Search, Users, AlertCircle } from "lucide-react";
import { UserListTable } from "./UserListTable";
import { RoleManagementPanel } from "./RoleManagementPanel";
import { Badge } from "@/components/ui/badge";

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

export const UserManagementNew = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

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

      // Get all users in the company
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          status,
          created_at,
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

          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );

      return usersWithRoles as UserWithEmployee[];
    }
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = user.full_name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const employeeName = user.employees
      ? `${user.employees.first_name} ${user.employees.last_name}`.toLowerCase()
      : '';

    return fullName.includes(searchLower) ||
           email.includes(searchLower) ||
           employeeName.includes(searchLower);
  });

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Kullanıcı Yönetimi
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Kullanıcıları görüntüleyin ve rollerini yönetin
            </p>
          </div>
        </div>

        {/* Orta - İstatistikler */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {/* Toplam kullanıcı sayısı */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-700 text-white border border-purple-600 shadow-sm">
            <Users className="h-3 w-3" />
            <span className="font-bold">Toplam Kullanıcı</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
              {users.length}
            </span>
          </div>

          {/* Aktif kullanıcılar */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-800 border-green-200 transition-all duration-200 hover:shadow-sm">
            <Shield className="h-3 w-3" />
            <span className="font-medium">Aktif</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {users.filter(u => u.status === 'active').length}
            </span>
          </div>

          {/* Çalışan eşleşmiş */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200 transition-all duration-200 hover:shadow-sm">
            <Users className="h-3 w-3" />
            <span className="font-medium">Çalışan Kaydı</span>
            <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {users.filter(u => u.employees).length}
            </span>
          </div>
        </div>

        {/* Sağ taraf - Bilgilendirme */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1.5 bg-blue-50 border-blue-200 text-blue-700">
            <AlertCircle className="h-3 w-3" />
            Çalışan eklerken otomatik oluşturulur
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
        {/* Left: Users List */}
        <div className="xl:col-span-2 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Kullanıcı ara (isim, email, çalışan adı)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 bg-white rounded-xl relative overflow-hidden">
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
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Rol Yönetimi</h3>
                  <p className="text-xs text-muted-foreground">Rolleri düzenleyin</p>
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
