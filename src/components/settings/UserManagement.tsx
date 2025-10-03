import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserFilterBar } from "./UserFilterBar";
import { UserList } from "./UserList";
import { UserGridView } from "./UserGridView";
import { UserKanbanView } from "./UserKanbanView";
import { UserManagementHeader } from "./UserManagementHeader";
import { UserViewType } from "./UserViewToggle";
import { InviteUserDialog } from "./InviteUserDialog";
import { RoleManagement } from "./RoleManagement";
import { UserWithRoles } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield } from "lucide-react";

export const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [activeView, setActiveView] = useState<UserViewType>("list");
  const [activeTab, setActiveTab] = useState("users");
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

  // İstatistikler
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(user => user.status === 'active').length || 0;
  const inactiveUsers = users?.filter(user => user.status === 'inactive').length || 0;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-2 h-8 w-auto border-none bg-transparent p-0">
            <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs px-4 py-1 rounded-md border border-gray-200 bg-white data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary">
              <Users className="h-3 w-3" />
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-1.5 text-xs px-4 py-1 rounded-md border border-gray-200 bg-white data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary">
              <Shield className="h-3 w-3" />
              Roller & İzinler
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="mt-6 space-y-6">
          {/* Header */}
          <UserManagementHeader
            activeView={activeView}
            setActiveView={setActiveView}
            totalUsers={totalUsers}
            activeUsers={activeUsers}
            inactiveUsers={inactiveUsers}
          />

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

          {/* Content */}
          <div className="bg-white rounded-lg border shadow-sm">
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Kullanıcılar yükleniyor...</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {activeView === "list" && (
                  <UserList users={filteredUsers || []} isLoading={isLoading} />
                )}
                {activeView === "grid" && (
                  <UserGridView users={filteredUsers || []} isLoading={isLoading} />
                )}
                {activeView === "kanban" && (
                  <UserKanbanView users={filteredUsers || []} isLoading={isLoading} />
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <RoleManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};