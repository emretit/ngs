import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CheckCircle, XCircle } from "lucide-react";
import { Heading } from "@/components/ui/heading";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, is_active, created_at');

      if (error) throw error;

      const total = companies?.length || 0;
      const active = companies?.filter(c => c.is_active).length || 0;
      const inactive = total - active;

      return { total, active, inactive, companies };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Heading title="Admin Dashboard" description="Sistem geneli istatistikler ve yönetim" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Şirket</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sistemde kayıtlı şirket sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Şirketler</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aktif olarak kullanılan şirketler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasif Şirketler</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.inactive || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pasif durumdaki şirketler
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Eklenen Şirketler</CardTitle>
          <CardDescription>En son sisteme eklenen 5 şirket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.companies
              ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((company: any) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{company.name || 'İsimsiz Şirket'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(company.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div>
                    {company.is_active ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Pasif
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
