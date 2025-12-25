import { memo } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import MonthlyTurnoverWidget from "@/components/dashboard/widgets/MonthlyTurnoverWidget";
import MonthlyExpensesWidget from "@/components/dashboard/widgets/MonthlyExpensesWidget";
import StockValueWidget from "@/components/dashboard/widgets/StockValueWidget";
import CompactAssetsWidget from "@/components/dashboard/widgets/CompactAssetsWidget";
import CompactLiabilitiesWidget from "@/components/dashboard/widgets/CompactLiabilitiesWidget";
import OverdueReceivablesWidget from "@/components/dashboard/widgets/OverdueReceivablesWidget";
import UpcomingChecksWidget from "@/components/dashboard/widgets/UpcomingChecksWidget";
import IncomingEInvoicesWidget from "@/components/dashboard/widgets/IncomingEInvoicesWidget";
import UpcomingExpensesWidget from "@/components/dashboard/widgets/UpcomingExpensesWidget";
import AIAssistantWidget from "@/components/dashboard/widgets/AIAssistantWidget";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// CRM Widgets
import { ActiveOpportunitiesWidget } from "@/components/dashboard/widgets/ActiveOpportunitiesWidget";
import { PendingProposalsWidget } from "@/components/dashboard/widgets/PendingProposalsWidget";
// Satış Widgets
import { TodaySalesWidget } from "@/components/dashboard/widgets/TodaySalesWidget";
import { PendingOrdersWidget } from "@/components/dashboard/widgets/PendingOrdersWidget";
import { PendingDeliveriesWidget } from "@/components/dashboard/widgets/PendingDeliveriesWidget";
import TotalCustomersWidget from "@/components/dashboard/widgets/TotalCustomersWidget";
import MonthlySalesTrendWidget from "@/components/dashboard/widgets/MonthlySalesTrendWidget";
import TotalReceivablesWidget from "@/components/dashboard/widgets/TotalReceivablesWidget";
import OpportunitiesValueWidget from "@/components/dashboard/widgets/OpportunitiesValueWidget";
import TopSellingProductsWidget from "@/components/dashboard/widgets/TopSellingProductsWidget";
// Satın Alma Widgets
import { PendingPurchaseRequestsWidget } from "@/components/dashboard/widgets/PendingPurchaseRequestsWidget";
import { PendingPurchaseOrdersWidget } from "@/components/dashboard/widgets/PendingPurchaseOrdersWidget";
// Stok Widgets
import { LowStockItemsWidget } from "@/components/dashboard/widgets/LowStockItemsWidget";
// Servis Widgets
import { ActiveServiceRequestsWidget } from "@/components/dashboard/widgets/ActiveServiceRequestsWidget";
import { PendingWorkOrdersWidget } from "@/components/dashboard/widgets/PendingWorkOrdersWidget";
// Araç Widgets
import { UpcomingMaintenancesWidget } from "@/components/dashboard/widgets/UpcomingMaintenancesWidget";

const Dashboard = () => {
  const {
    monthlyTurnover,
    monthlyExpenses,
    stockValue,
    assets,
    liabilities,
    overdueReceivables,
    upcomingChecks,
    incomingEInvoices,
    upcomingExpenses,
    // CRM
    activeOpportunities,
    pendingProposals,
    // Satış
    todaySales,
    pendingOrders,
    pendingDeliveries,
    // Satın Alma
    pendingPurchaseRequests,
    pendingPurchaseOrders,
    // Stok
    lowStockItems,
    // Servis
    activeServiceRequests,
    pendingWorkOrders,
    // Araç
    upcomingMaintenances,
    // Yeni Satış Metrikleri
    totalCustomers,
    activeCustomers,
    previousMonthSales,
    totalReceivables,
    opportunitiesValue,
    opportunitiesCount,
    topSellingProducts,
    isLoading
  } = useDashboardWidgets();

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader />

      {/* Ana Satış Metrikleri - 6 Büyük Kart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MonthlyTurnoverWidget 
          value={monthlyTurnover || 0} 
          isLoading={isLoading} 
        />
        <TodaySalesWidget 
          value={todaySales || 0} 
          isLoading={isLoading} 
        />
        <MonthlySalesTrendWidget 
          currentMonth={monthlyTurnover || 0}
          previousMonth={previousMonthSales || 0}
          isLoading={isLoading} 
        />
        <TotalCustomersWidget 
          totalCustomers={totalCustomers || 0}
          activeCustomers={activeCustomers || 0}
          isLoading={isLoading} 
        />
        <TotalReceivablesWidget 
          totalReceivables={totalReceivables || 0}
          isLoading={isLoading} 
        />
        <OpportunitiesValueWidget 
          totalValue={opportunitiesValue || 0}
          count={opportunitiesCount || 0}
          isLoading={isLoading} 
        />
      </div>

      {/* Finansal Özet - Kompakt Varlıklar ve Borçlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CompactAssetsWidget 
          totalAssets={assets?.total || 0} 
          isLoading={isLoading} 
        />
        <CompactLiabilitiesWidget 
          totalLiabilities={liabilities?.total || 0} 
          isLoading={isLoading} 
        />
        <MonthlyExpensesWidget 
          value={monthlyExpenses || 0} 
          isLoading={isLoading} 
        />
        <StockValueWidget 
          value={stockValue || 0} 
          isLoading={isLoading} 
        />
      </div>

      {/* Satış Odaklı Widget'lar - 4 Kolon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Kolon - Satış Performansı */}
        <div className="lg:col-span-1 space-y-6">
          <TopSellingProductsWidget 
            products={topSellingProducts || []} 
            isLoading={isLoading} 
          />
          <PendingOrdersWidget 
            orders={pendingOrders || []} 
            isLoading={isLoading} 
          />
        </div>

        {/* 2. Kolon - Satış İşlemleri */}
        <div className="lg:col-span-1 space-y-6">
          <PendingDeliveriesWidget 
            deliveries={pendingDeliveries || []} 
            isLoading={isLoading} 
          />
          <OverdueReceivablesWidget 
            receivables={overdueReceivables || []} 
            isLoading={isLoading} 
          />
        </div>

        {/* 3. Kolon - CRM */}
        <div className="lg:col-span-1 space-y-6">
          <ActiveOpportunitiesWidget 
            opportunities={activeOpportunities || []} 
            isLoading={isLoading} 
          />
          <PendingProposalsWidget 
            proposals={pendingProposals || []} 
            isLoading={isLoading} 
          />
        </div>

        {/* 4. Kolon - Diğer Modüller */}
        <div className="lg:col-span-1 space-y-6">
          <PendingPurchaseRequestsWidget 
            requests={pendingPurchaseRequests || []} 
            isLoading={isLoading} 
          />
          <LowStockItemsWidget 
            items={lowStockItems || []} 
            isLoading={isLoading} 
          />
          <ActiveServiceRequestsWidget 
            requests={activeServiceRequests || []} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      {/* Finansal ve Diğer Widget'lar - 4 Kolon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Kolon - AI Asistan */}
        <div className="lg:col-span-1">
          <AIAssistantWidget />
        </div>

        {/* 2. Kolon - Yaklaşan Ödemeler */}
        <div className="lg:col-span-1 space-y-6">
          <UpcomingChecksWidget 
            checks={upcomingChecks || []} 
            isLoading={isLoading} 
          />
          <UpcomingExpensesWidget 
            expenses={upcomingExpenses || []} 
            isLoading={isLoading} 
          />
        </div>

        {/* 3. Kolon - Gelen E-Faturalar ve Satın Alma */}
        <div className="lg:col-span-1 space-y-6">
          <IncomingEInvoicesWidget 
            invoices={incomingEInvoices || []} 
            isLoading={isLoading} 
          />
          <PendingPurchaseOrdersWidget 
            orders={pendingPurchaseOrders || []} 
            isLoading={isLoading} 
          />
        </div>

        {/* 4. Kolon - Servis ve Son Aktiviteler */}
        <div className="lg:col-span-1 space-y-6">
          <PendingWorkOrdersWidget 
            workOrders={pendingWorkOrders || []} 
            isLoading={isLoading} 
          />
          <UpcomingMaintenancesWidget 
            maintenances={upcomingMaintenances || []} 
            isLoading={isLoading} 
          />
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivitiesTimeline />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default memo(Dashboard);
