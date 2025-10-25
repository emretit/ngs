import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ArrowLeft, User, Mail, Phone, Building, Calendar, Shield, Activity, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          companies (
            id,
            name
          ),
          user_roles (
            role,
            is_super_admin
          ),
          employees (
            id,
            first_name,
            last_name,
            position,
            department
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: userLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['user-logs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ role }: { role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', id] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı rolü güncellendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Rol güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error('Email not found');
      
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şifre sıfırlama linki kullanıcının email adresine gönderildi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Şifre sıfırlama linki gönderilirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  if (userLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Heading 
          title="Kullanıcı Detayları"
          description={user?.email || 'Kullanıcı bilgileri'}
        />
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="" 
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold">
                  {user?.first_name || user?.last_name 
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'İsimsiz Kullanıcı'
                  }
                </h3>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {user?.user_roles?.map((role: any, idx: number) => (
                    <Badge key={idx} variant={role.is_super_admin ? "destructive" : "default"}>
                      {role.is_super_admin ? 'Super Admin' : role.role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user?.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{user?.companies?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Kayıt: {format(new Date(user?.created_at), 'dd MMMM yyyy')}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Rol Değiştir</Label>
              <Select 
                defaultValue={user?.user_roles?.[0]?.role || 'user'}
                onValueChange={(role) => updateRoleMutation.mutate({ role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => sendPasswordResetMutation.mutate()}
              disabled={sendPasswordResetMutation.isPending}
            >
              <Key className="h-4 w-4 mr-2" />
              Şifre Sıfırlama Linki Gönder
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Çalışan Bilgileri</CardTitle>
            <CardDescription>
              {user?.employee_id ? 'Çalışan bağlantısı mevcut' : 'Çalışan bağlantısı yok'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.employees?.[0] ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Ad Soyad</Label>
                    <p className="font-medium mt-1">
                      {user.employees[0].first_name} {user.employees[0].last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Pozisyon</Label>
                    <p className="font-medium mt-1">{user.employees[0].position || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Departman</Label>
                    <p className="font-medium mt-1">{user.employees[0].department || '-'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Bu kullanıcı herhangi bir çalışana bağlı değil</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Kullanıcı Aktiviteleri
          </CardTitle>
          <CardDescription>Son 50 işlem kaydı</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İşlem</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userLogs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.entity_type}</TableCell>
                  <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                  <TableCell>
                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
              {userLogs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Henüz aktivite kaydı yok
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetail;
