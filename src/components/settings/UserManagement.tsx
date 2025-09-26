import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserFilters } from "./UserFilters";
import { UserList } from "./UserList";
import { InviteUserDialog } from "./InviteUserDialog";
import { EmployeeManagement } from "./components/EmployeeManagement";
import { UserWithRoles } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCog } from "lucide-react";

export const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState("users");

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
        .order('created_at', { ascending: sortOrder === 'asc' });
      
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
    const matchesSearch = fullName.includes(filter.toLowerCase()) || 
                         (user.email || '').toLowerCase().includes(filter.toLowerCase());
    const matchesRole = !roleFilter || user.user_roles?.some(r => r.role === roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kullanıcı & Çalışan Yönetimi</h2>
          <p className="text-muted-foreground">Sistem kullanıcılarını ve çalışanları yönetin</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Çalışanlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-foreground">Kullanıcı Yönetimi</h3>
                <InviteUserDialog />
              </div>
              
              <UserFilters
                filter={filter}
                setFilter={setFilter}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
            </div>

            <UserList users={filteredUsers || []} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="employees" className="mt-6">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <EmployeeManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};