import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlobalSearchBar from "@/components/dashboard/GlobalSearchBar";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Target, 
  Users, 
  ChevronRight
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  // Refresh function for data refetch
  const refreshData = () => {
    // Re-trigger all queries
    window.location.reload();
  };

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
      {/* Modern Header Section - Diğer sayfalardaki gibi tutarlı yapı */}
      <DashboardHeader
        financialData={financialData}
        crmStats={crmStats}
        hrStats={hrStats}
        onRefresh={refreshData}
      />

      {/* Global Search Bar */}
      <GlobalSearchBar />

      {/* KPI Metrics Grid */}
      <MetricsGrid
        financialData={financialData}
        crmStats={crmStats}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activities Timeline */}
          <RecentActivitiesTimeline />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions />
          {/* CRM Quick Stats */}
          <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    CRM Özeti
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Güncel durum</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Aktif Fırsatlar</span>
                <span className="text-sm font-bold text-foreground">{crmStats?.opportunities || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Bekleyen Teklifler</span>
                <span className="text-sm font-bold text-foreground">{crmStats?.proposals || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Aktiviteler</span>
                <span className="text-sm font-bold text-foreground">{crmStats?.activities || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* HR Quick Stats */}
          <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    İK Özeti
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Personel durumu</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Toplam Çalışan</span>
                <span className="text-sm font-bold text-foreground">{hrStats?.totalEmployees || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">İzinli</span>
                <span className="text-sm font-bold text-foreground">{hrStats?.onLeave || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Aktif</span>
                <span className="text-sm font-bold text-foreground">
                  {(hrStats?.totalEmployees || 0) - (hrStats?.onLeave || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
