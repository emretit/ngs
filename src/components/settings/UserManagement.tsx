
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { UserFilters } from "./UserFilters";
import { UserList } from "./UserList";
import { InviteUserDialog } from "./InviteUserDialog";
import { UserWithRoles } from "./types";

export const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
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
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(filter.toLowerCase());
    const matchesRole = !roleFilter || user.user_roles?.some(r => r.role === roleFilter);
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Kullanıcı Yönetimi</h2>
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

      <UserList users={filteredUsers || []} />
    </div>
  );
};
