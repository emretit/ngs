import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ArrowLeft, User, Mail, Phone, Building, Download, Key, UserCog, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
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

const CompanyUsers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['companyUsers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role,
            is_super_admin
          ),
          employees (
            id,
            first_name,
            last_name,
            position
          )
        `)
        
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şifre sıfırlama linki gönderildi",
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

  const exportToExcel = () => {
    if (!users || users.length === 0) return;

    const exportData = users.map(user => ({
      'Ad': user.first_name || '',
      'Soyad': user.last_name || '',
      'Email': user.email || '',
      'Telefon': user.phone || '',
      'Roller': user.user_roles?.map((r: any) => r.is_super_admin ? 'Super Admin' : r.role).join(', ') || '',
      'Çalışan': user.employees?.[0] ? `${user.employees[0].first_name} ${user.employees[0].last_name}` : '',
      'Pozisyon': user.employees?.[0]?.position || '',
      'Kayıt Tarihi': new Date(user.created_at).toLocaleDateString('tr-TR')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kullanıcılar");
    XLSX.writeFile(wb, `${company?.name || 'company'}-users-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (companyLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/companies')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Heading 
            title={`${company?.name || 'Şirket'} - Kullanıcılar`}
            description={`Toplam ${users?.length || 0} kullanıcı`}
          />
        </div>
        <Button onClick={exportToExcel} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Excel Export
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Kullanıcılar</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.user_roles?.some((r: any) => r.role === 'admin')).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Çalışan Bağlantılı</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.employee_id).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İsim</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Çalışan</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-center">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span>{user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'İsimsiz'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {user.email || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {user.phone || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.user_roles?.map((role: any, idx: number) => (
                        <Badge key={idx} variant={role.is_super_admin ? "destructive" : "default"}>
                          {role.is_super_admin ? 'Super Admin' : role.role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.employees?.[0] ? (
                      <div className="text-sm">
                        {user.employees[0].first_name} {user.employees[0].last_name}
                        {user.employees[0].position && (
                          <div className="text-xs text-muted-foreground">{user.employees[0].position}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Link to={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Detayları Görüntüle">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => user.email && sendPasswordResetMutation.mutate(user.email)}
                        disabled={sendPasswordResetMutation.isPending}
                        className="h-8 w-8"
                        title="Şifre Sıfırla"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyUsers;
