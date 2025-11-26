import { Control, useWatch } from "react-hook-form";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Wrench, UserCheck, UserPlus, Link2, Unlink, Mail, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserEmailCheck } from "@/hooks/useUserEmailCheck";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

interface RoleSectionProps {
  control: Control<any>;
  userId?: string | null; // Employee's user_id from profiles table
  employeeId?: string; // For linking when inviting
  onUserLinkChange?: (userId: string | null, shouldLink: boolean) => void;
}

export const RoleSection = ({ control, userId, employeeId, onUserLinkChange }: RoleSectionProps) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  
  // Watch fields
  const department = useWatch({ control, name: "department" });
  const email = useWatch({ control, name: "email" });
  const isTechnical = department === "Teknik";
  const selectedRoles = useWatch({ control, name: "user_roles" }) || [];

  // User check hook
  const { checkResult, checkUserByEmail, resetCheck } = useUserEmailCheck();
  
  // State for linking
  const [shouldLinkUser, setShouldLinkUser] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  // Check user when email changes (debounced) - only for new employees
  useEffect(() => {
    // Skip if userId already exists (editing existing linked employee)
    if (userId) return;
    
    const timer = setTimeout(() => {
      if (email && email.includes("@")) {
        checkUserByEmail(email);
      } else {
        resetCheck();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [email, userId]); // Removed checkUserByEmail and resetCheck from deps
  
  // Reset shouldLinkUser when email changes
  useEffect(() => {
    setShouldLinkUser(false);
  }, [email]);
  
  // Notify parent when link state changes - use callback ref to avoid infinite loop
  useEffect(() => {
    if (!onUserLinkChange) return;
    
    if (checkResult.exists && checkResult.userId) {
      onUserLinkChange(checkResult.userId, shouldLinkUser);
    } else {
      onUserLinkChange(null, false);
    }
  }, [shouldLinkUser, checkResult.exists, checkResult.userId]); // Removed onUserLinkChange from deps

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!userData?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          inviting_company_id: userData.company_id,
          role: role === 'Admin' ? 'admin' : role,
          employee_id: employeeId // Pass employee_id for auto-linking
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Kullanıcı davet edildi! Şifre belirleme maili gönderildi.");
      setIsInviting(false);
    },
    onError: (error: any) => {
      toast.error("Davet gönderilirken hata oluştu: " + error.message);
      setIsInviting(false);
    },
  });

  // Handle invite
  const handleInviteUser = () => {
    if (!email) return;
    setIsInviting(true);
    inviteUserMutation.mutate({ email, role: 'Admin' });
  };

  // Fetch roles from database: Global (company_id = NULL) + Şirket rolleri
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) {
        return [];
      }

      // Global roller (company_id IS NULL) + Şirket rolleri
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
        .order('company_id', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: true });

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

        {/* Kullanıcı Hesabı Bağlantısı */}
        <div className="space-y-2">
          <FormLabel className="text-xs font-medium text-gray-700">Kullanıcı Hesabı</FormLabel>
          
          {/* Zaten bağlı ise */}
          {userId ? (
            <Alert className="border-green-200 bg-green-50">
              <UserCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-700 flex items-center justify-between">
                <span>
                  <strong>{email}</strong> kullanıcı hesabına bağlı
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onUserLinkChange?.(null, false)}
                >
                  <Unlink className="h-3 w-3 mr-1" />
                  Bağlantıyı Kaldır
                </Button>
              </AlertDescription>
            </Alert>
          ) : checkResult.isLoading ? (
            <Alert className="border-gray-200 bg-gray-50">
              <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
              <AlertDescription className="text-xs text-gray-600">
                Kullanıcı kontrol ediliyor...
              </AlertDescription>
            </Alert>
          ) : checkResult.exists && checkResult.userInfo ? (
            /* Kullanıcı bulundu - bağlama seçeneği */
            <Alert className="border-blue-200 bg-blue-50">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{checkResult.userInfo.email}</strong> ile kullanıcı hesabı bulundu
                    {checkResult.userInfo.full_name && (
                      <span className="text-blue-600"> ({checkResult.userInfo.full_name})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="link-user"
                    checked={shouldLinkUser}
                    onCheckedChange={(checked) => setShouldLinkUser(!!checked)}
                  />
                  <label htmlFor="link-user" className="text-xs cursor-pointer">
                    Bu kullanıcı hesabına bağla
                  </label>
                </div>
              </AlertDescription>
            </Alert>
          ) : email && email.includes("@") ? (
            /* Kullanıcı bulunamadı - davet seçeneği */
            <Alert className="border-amber-200 bg-amber-50">
              <Mail className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-700">
                <div className="flex items-center justify-between">
                  <span>Bu email ile kullanıcı hesabı bulunamadı</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={handleInviteUser}
                    disabled={isInviting || inviteUserMutation.isPending}
                  >
                    {isInviting || inviteUserMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3 mr-1" />
                    )}
                    Kullanıcı Oluştur ve Davet Gönder
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-gray-200 bg-gray-50">
              <Mail className="h-4 w-4 text-gray-400" />
              <AlertDescription className="text-xs text-gray-500">
                Kullanıcı hesabı kontrolü için email adresi girin
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Roller Dropdown - sadece mevcut bağlı kullanıcı varsa göster (yeni bağlama yapılıyorsa gösterme - mevcut kullanıcının zaten rolü var) */}
        {userId && !shouldLinkUser && (
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
                        value={role.id}
                        disabled={selectedRoles.includes(role.id)}
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
                    {selectedRoles.map((roleId: string) => {
                      const role = roles.find(r => r.id === roleId);
                    return (
                      <Badge
                          key={roleId}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 flex items-center gap-1"
                      >
                          <span>{role?.name || roleId}</span>
                        <button
                          type="button"
                          onClick={() => {
                              const newRoles = (field.value || []).filter((r: string) => r !== roleId);
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
        )}
      </CardContent>
    </Card>
  );
};
