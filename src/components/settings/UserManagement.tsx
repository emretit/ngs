import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserFilterBar } from "./UserFilterBar";
import { ModernUserList } from "./ModernUserList";
import { UserManagementHeader } from "./UserManagementHeader";
import { CompactRoleManagement } from "./CompactRoleManagement";
import { UserWithRoles } from "./types";
import { Shield, Users } from "lucide-react";

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
      ).map(dept => ({ id: dept as string, name: dept as string }));
      
      return uniqueDepartments;
    }
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'settings', 'employee-matching'],
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable cache
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false, // No auto-refetch
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
      // Her çalışan zaten bir kullanıcı olduğu için user_id üzerinden employee bilgilerini al
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          employees!employees_user_id_fkey (
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
            {/* Tablo Header + Stats */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Kullanıcı Listesi</h3>
                  <p className="text-xs text-muted-foreground">
                    Toplam <span className="font-medium text-blue-600">{filteredUsers?.length || 0}</span> kullanıcı
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                Kullanıcılar çalışan eklenirken otomatik oluşturulur
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Kullanıcılar yükleniyor...</p>
                    <p className="text-xs text-muted-foreground">Lütfen bekleyin</p>
                  </div>
                </div>
              </div>
            ) : (
              <ModernUserList users={filteredUsers || []} isLoading={isLoading} />
            )}
          </div>
        </div>

        {/* Sağ Taraf - Roller & İzinler (1/3) */}
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
            {rolesLoading ? (
              <div className="flex items-center justify-center h-[300px] p-5">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Roller yükleniyor...</p>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <CompactRoleManagement roles={roles} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};