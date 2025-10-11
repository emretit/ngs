import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExchangeRateCard from "@/components/dashboard/ExchangeRateCard";
import GlobalSearchBar from "@/components/dashboard/GlobalSearchBar";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import QuickActions from "@/components/dashboard/QuickActions";
import ActiveTasksList from "@/components/dashboard/ActiveTasksList";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Target, 
  Users, 
  ChevronRight
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch real financial data
  const { data: financialData } = useQuery({
    queryKey: ['dashboard-financial'],
    queryFn: async () => {
      // Get bank accounts balance
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('current_balance');
      
      // Get cash accounts balance
      const { data: cashAccounts } = await supabase
        .from('cash_accounts')
        .select('current_balance');

      // Get customers balance (receivables)
      const { data: customers } = await supabase
        .from('customers')
        .select('balance');

      // Get suppliers data for payables (using einvoices)
      const { data: invoices } = await supabase
        .from('einvoices')
        .select('remaining_amount');

      const totalBankBalance = bankAccounts?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;
      const totalCashBalance = cashAccounts?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;
      const totalReceivables = customers?.reduce((sum, c) => sum + (Number(c.balance) || 0), 0) || 0;
      const totalPayables = invoices?.reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0) || 0;

      return {
        cashFlow: totalBankBalance + totalCashBalance,
        receivables: totalReceivables,
        payables: totalPayables,
        netWorth: totalBankBalance + totalCashBalance + totalReceivables - totalPayables
      };
    }
  });

  // Fetch CRM stats
  const { data: crmStats } = useQuery({
    queryKey: ['dashboard-crm'],
    queryFn: async () => {
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('id')
        .in('status', ['open', 'in_progress']);

      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .in('status', ['todo', 'in_progress']);

      const { data: proposals } = await supabase
        .from('proposals')
        .select('id')
        .eq('status', 'draft');

      return {
        opportunities: opportunities?.length || 0,
        activities: activities?.length || 0,
        proposals: proposals?.length || 0
      };
    }
  });

  // Fetch HR stats
  const { data: hrStats } = useQuery({
    queryKey: ['dashboard-hr'],
    queryFn: async () => {
      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .eq('status', 'aktif');

      const { data: leaves } = await supabase
        .from('employee_leaves')
        .select('id')
        .eq('status', 'approved')
        .gte('end_date', new Date().toISOString());

      return {
        totalEmployees: employees?.length || 0,
        onLeave: leaves?.length || 0
      };
    }
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Modern Header Section - CRM Dashboard tarzı */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Gösterge Paneli
            </h1>
            <p className="text-muted-foreground mt-1">
              İş süreçlerinizi takip edin ve yönetin
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Güncel</span>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <GlobalSearchBar />

      {/* KPI Metrics Grid */}
      <MetricsGrid 
        financialData={financialData}
        crmStats={crmStats}
        hrStats={hrStats}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Tasks - Takes 2 columns */}
        <div className="xl:col-span-2">
          <ActiveTasksList />
        </div>

        {/* Recent Activities Timeline */}
        <RecentActivitiesTimeline />
      </div>

      {/* Secondary Content - Full width Exchange Rates */}
      <ExchangeRateCard />

      {/* Bottom Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CRM Stats Card */}
        <Card 
          className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20 cursor-pointer"
          onClick={() => navigate('/crm')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    CRM Özeti
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Müşteri ilişkileri yönetimi</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium text-muted-foreground">Aktif Fırsatlar</span>
              <span className="text-lg font-bold text-foreground">{crmStats?.opportunities || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium text-muted-foreground">Devam Eden Aktiviteler</span>
              <span className="text-lg font-bold text-foreground">{crmStats?.activities || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium text-muted-foreground">Bekleyen Teklifler</span>
              <span className="text-lg font-bold text-foreground">{crmStats?.proposals || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* HR Stats Card */}
        <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  İnsan Kaynakları
                </CardTitle>
                <p className="text-sm text-muted-foreground">Personel durumu</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium text-muted-foreground">Toplam Çalışan</span>
              <span className="text-lg font-bold text-foreground">{hrStats?.totalEmployees || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium text-muted-foreground">İzinli Çalışan</span>
              <span className="text-lg font-bold text-foreground">{hrStats?.onLeave || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium text-muted-foreground">Aktif Çalışan</span>
              <span className="text-lg font-bold text-foreground">
                {(hrStats?.totalEmployees || 0) - (hrStats?.onLeave || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
