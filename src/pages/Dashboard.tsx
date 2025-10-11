import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExchangeRateCard from "@/components/dashboard/ExchangeRateCard";
import GlobalSearchBar from "@/components/dashboard/GlobalSearchBar";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import QuickActions from "@/components/dashboard/QuickActions";
import ActiveTasksList from "@/components/dashboard/ActiveTasksList";
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
    <div className="max-w-[1800px] mx-auto space-y-6 animate-fade-in">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel</h1>
          <p className="text-sm text-muted-foreground">İşletme genel bakış</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <GlobalSearchBar />

      {/* Quick Actions */}
      <QuickActions />

      {/* KPI Metrics Grid */}
      <MetricsGrid 
        financialData={financialData}
        crmStats={crmStats}
        hrStats={hrStats}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks */}
        <div className="lg:col-span-2">
          <ActiveTasksList />
        </div>

        {/* Exchange Rates */}
        <ExchangeRateCard />
      </div>

      {/* Secondary Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CRM Stats */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/crm')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              CRM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fırsatlar</span>
              <span className="font-bold">{crmStats?.opportunities || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aktiviteler</span>
              <span className="font-bold">{crmStats?.activities || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Teklifler</span>
              <span className="font-bold">{crmStats?.proposals || 0}</span>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardContent>
        </Card>

        {/* HR Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              İnsan Kaynakları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Toplam Çalışan</span>
              <span className="font-bold">{hrStats?.totalEmployees || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">İzinli</span>
              <span className="font-bold">{hrStats?.onLeave || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
  );
};

export default Dashboard;
