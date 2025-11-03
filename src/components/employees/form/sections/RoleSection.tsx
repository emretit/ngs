import { Control, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RoleSectionProps {
  control: Control<any>;
}

export const RoleSection = ({ control }: RoleSectionProps) => {
  // Watch department field to sync with technical toggle
  const department = useWatch({ control, name: "department" });
  const isTechnical = department === "Teknik";
  const selectedRoles = useWatch({ control, name: "user_roles" }) || [];

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
    <Card className="shadow-md border border-border/40 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
            <Shield className="h-3.5 w-3.5 text-purple-600" />
          </div>
          Kullanıcı Yetkileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        {/* Teknik Personel Toggle */}
        <FormField
          control={control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between p-2 rounded-lg border border-gray-200/50 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Wrench className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <FormLabel className="text-xs font-medium text-gray-700 cursor-pointer">
                      Teknik Personel
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Servis takviminde teknisyen olarak görünecek
                    </p>
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={isTechnical}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange("Teknik");
                      } else {
                        if (field.value === "Teknik") {
                          field.onChange("");
                        }
                      }
                    }}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Roller Dropdown */}
        <FormField
          control={control}
          name="user_roles"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">Kullanıcı Rolleri</FormLabel>
              <Select
                value=""
                onValueChange={(value) => {
                  const currentRoles = field.value || [];
                  if (value && !currentRoles.includes(value)) {
                    field.onChange([...currentRoles, value]);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder={isLoading ? "Yükleniyor..." : roles.length === 0 ? "Rol bulunamadı" : "Rol seçin"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem 
                      key={role.id} 
                      value={role.name}
                      disabled={selectedRoles.includes(role.name)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{role.name}</span>
                        {role.name === 'Admin' && (
                          <Badge variant="destructive" className="text-xs h-4 px-1">
                            Yönetici
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Seçili Roller */}
              {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedRoles.map((roleName: string) => {
                    const role = roles.find(r => r.name === roleName);
                    return (
                      <Badge
                        key={roleName}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 flex items-center gap-1"
                      >
                        <span>{roleName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newRoles = (field.value || []).filter((r: string) => r !== roleName);
                            field.onChange(newRoles);
                          }}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {isLoading && (
                <p className="text-xs text-muted-foreground mt-1">Roller yükleniyor...</p>
              )}
              {!isLoading && roles.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Henüz rol tanımlanmamış. Lütfen önce ayarlardan rol oluşturun.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
