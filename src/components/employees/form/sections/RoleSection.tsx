import { Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface RoleSectionProps {
  control: Control<any>;
}

export const RoleSection = ({ control }: RoleSectionProps) => {
  // Fetch roles from database
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      // Get current user's company_id
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

  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50/50 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <Shield className="h-4 w-4 text-purple-600" />
          </div>
          <CardTitle className="text-base font-semibold">Kullanıcı Yetkileri</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Bu çalışan için kullanıcı hesabı oluşturulacak ve seçtiğiniz yetkiler atanacaktır
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Roller yükleniyor...</div>
        ) : roles.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Henüz rol tanımlanmamış. Lütfen önce ayarlardan rol oluşturun.
          </div>
        ) : (
          <FormField
            control={control}
            name="user_roles"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Roller</FormLabel>
                <div className="space-y-2 mt-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(role.name)}
                          onCheckedChange={(checked) => {
                            const currentRoles = field.value || [];
                            if (checked) {
                              field.onChange([...currentRoles, role.name]);
                            } else {
                              field.onChange(
                                currentRoles.filter((r: string) => r !== role.name)
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{role.name}</span>
                          {role.name === 'Admin' && (
                            <Badge variant="destructive" className="text-xs">
                              Yönetici
                            </Badge>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
};
