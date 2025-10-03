import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserFilterBar } from "./UserFilterBar";
import { ModernUserList } from "./ModernUserList";
import { UserManagementHeader } from "./UserManagementHeader";
import { CompactRoleManagement } from "./CompactRoleManagement";
import { InviteUserDialog } from "./InviteUserDialog";
import { UserWithRoles } from "./types";
import { Button } from "@/components/ui/button";
import { Shield, Plus } from "lucide-react";

export const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const profilesChannel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('public:user_roles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            toast({
              title: "Rol Değişikliği",
              description: "Kullanıcı rolleri güncellendi",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [queryClient, toast]);

  // Fetch departments data
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .not('department', 'is', null)
        .order('department');
      
      if (error) throw error;
      
      // Unique departments
      const uniqueDepartments = Array.from(
        new Set(data?.map(emp => emp.department).filter(Boolean))
      ).map(dept => ({ id: dept, name: dept }));
      
      return uniqueDepartments;
    }
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'settings', 'employee-matching'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      // Önce kullanıcının company_id'sini al
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Kullanıcı giriş yapmamış');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.user.id)
        .single();
      
      if (!profile?.company_id) {
        throw new Error('Kullanıcının şirket bilgisi bulunamadı');
      }

      // Aynı company_id'deki tüm kullanıcıları çek
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          employees!profiles_employee_id_fkey (
            id,
            first_name,
            last_name,
            position,
            department
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: true });
      
      if (profilesError) throw profilesError;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', profile.id);
          
          if (rolesError) {
            console.error('Error fetching roles:', rolesError);
            return { ...profile, user_roles: [] };
          }

          return {
            ...profile,
            user_roles: roles || []
          };
        })
      );

      return usersWithRoles as UserWithRoles[];
    }
  });

  const filteredUsers = users?.filter(user => {
    const fullName = (user.full_name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const department = (user.employees?.department || '').toLowerCase();
    
    const matchesSearch = searchQuery === '' || 
                         fullName.includes(searchQuery.toLowerCase()) || 
                         email.includes(searchQuery.toLowerCase()) ||
                         department.includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || 
                       user.user_roles?.some(r => r.role === selectedRole);
    
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    const matchesDepartment = selectedDepartment === 'all' || 
                             user.employees?.department === selectedDepartment;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  // Roller - veritabanından çek (company_id filtresi ile)
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      // Önce kullanıcının company_id'sini al
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (!profile?.company_id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Roller - users ve rolesData tanımlandıktan sonra
  const roles = rolesData?.map(role => ({
    name: role.name,
    description: role.description,
    permissions: role.permissions || [],
    userCount: users?.filter(u => u.user_roles?.some(r => r.role === role.name)).length || 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <UserManagementHeader />

      {/* Main Content - Kullanıcılar ve Roller Yan Yana */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sol Taraf - Kullanıcılar (2/3) */}
        <div className="xl:col-span-2 space-y-4">
          {/* Filters */}
          <UserFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            departments={departments}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />

          {/* Kullanıcı Listesi */}
          <div className="bg-white rounded-lg border shadow-sm">
            {/* Tablo Header + Yeni Kullanıcı Butonu */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Kullanıcılar</h3>
                <span className="text-xs text-muted-foreground">({filteredUsers?.length || 0})</span>
              </div>
              <InviteUserDialog />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center space-y-4">
                  <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Kullanıcılar yükleniyor...</p>
                </div>
              </div>
            ) : (
              <ModernUserList users={filteredUsers || []} isLoading={isLoading} />
            )}
          </div>
        </div>

        {/* Sağ Taraf - Roller & İzinler (1/3) */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            {rolesLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Roller yükleniyor...</p>
                </div>
              </div>
            ) : (
              <CompactRoleManagement roles={roles} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};