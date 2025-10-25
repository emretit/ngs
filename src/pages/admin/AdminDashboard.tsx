import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CheckCircle, XCircle, FileText, TrendingUp, Activity, Shield, Plus, Search, AlertTriangle } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays } from "date-fns";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      // Companies data
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, is_active, created_at');

      if (companiesError) throw companiesError;

      // Users data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at, company_id');

      if (usersError) throw usersError;

      // Employees data
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, is_active');

      if (employeesError) throw employeesError;

      // Invoices data
      const { data: salesInvoices, error: salesError } = await supabase
        .from('sales_invoices')
        .select('id, total_amount, created_at');

      if (salesError) throw salesError;

      // Audit logs
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (auditError) throw auditError;

      // Calculate stats
      const totalCompanies = companies?.length || 0;
      const activeCompanies = companies?.filter(c => c.is_active).length || 0;
      const inactiveCompanies = totalCompanies - activeCompanies;
      const totalUsers = users?.length || 0;
      const activeEmployees = employees?.filter(e => e.is_active).length || 0;
      const totalInvoices = salesInvoices?.length || 0;
      const totalRevenue = salesInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Last 7 days user trend
      const sevenDaysAgo = subDays(new Date(), 7);
      const newUsersLast7Days = users?.filter(u => new Date(u.created_at) >= sevenDaysAgo).length || 0;

      // Last 30 days company registration trend
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const count = companies?.filter(c => 
          format(new Date(c.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ).length || 0;
        return {
          date: format(date, 'dd MMM'),
          count
        };
      });

      // User distribution by company (top 5)
      const usersByCompany = companies?.map(company => ({
        name: company.name || 'İsimsiz',
        users: users?.filter(u => u.company_id === company.id).length || 0
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 5) || [];

      // Active/Inactive ratio for pie chart
      const companyStatusData = [
        { name: 'Aktif', value: activeCompanies, color: '#22c55e' },
        { name: 'Pasif', value: inactiveCompanies, color: '#ef4444' }
      ];

      return {
        totalCompanies,
        activeCompanies,
        inactiveCompanies,
        totalUsers,
        activeEmployees,
        totalInvoices,
        totalRevenue,
        newUsersLast7Days,
        companies,
        auditLogs,
        last30Days,
        usersByCompany,
        companyStatusData,
        recentUsers: users?.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 5)
      };
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

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Şirket</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.activeCompanies || 0} aktif, {stats?.inactiveCompanies || 0} pasif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Son 7 gün: +{stats?.newUsersLast7Days || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Çalışan</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeEmployees || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Toplam kayıtlı çalışan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Fatura</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₺{(stats?.totalRevenue || 0).toLocaleString('tr-TR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/admin/companies">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Yeni Şirket</p>
                <p className="text-xs text-muted-foreground">Şirket ekle</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/audit-logs">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Audit Logs</p>
                <p className="text-xs text-muted-foreground">Sistem logları</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/security">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium">Güvenlik</p>
                <p className="text-xs text-muted-foreground">Security logs</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Sistem Durumu</p>
              <p className="text-xs text-green-600">Tümü Normal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Registration Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Son 30 Gün Şirket Kayıt Trendi</CardTitle>
            <CardDescription>Günlük yeni şirket kayıtları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.last30Days || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Yeni Şirketler" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Şirketlere Göre Kullanıcı Dağılımı</CardTitle>
            <CardDescription>En çok kullanıcıya sahip 5 şirket</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.usersByCompany || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="hsl(var(--primary))" name="Kullanıcı Sayısı" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Company Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Aktif/Pasif Şirket Oranı</CardTitle>
            <CardDescription>Şirket durumu dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.companyStatusData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats?.companyStatusData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Son 10 audit log kaydı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats?.auditLogs?.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-2 border-b last:border-0">
                  <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.entity_type} - {format(new Date(log.created_at), 'dd MMM HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Companies and Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Son Eklenen Kullanıcılar</CardTitle>
            <CardDescription>En son kayıt olan 5 kullanıcı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentUsers?.map((user: any) => (
                <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.email || 'Email yok'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
