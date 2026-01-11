// Re-export all dashboard widget hooks for backward compatibility
// This file maintains the original API while using the new modular hooks

import { useDashboardFinance } from "./dashboard/useDashboardFinance";
import { useDashboardPayments } from "./dashboard/useDashboardPayments";
import { useDashboardEInvoice } from "./dashboard/useDashboardEInvoice";
import { useDashboardSales } from "./dashboard/useDashboardSales";
import { useDashboardPurchasing } from "./dashboard/useDashboardPurchasing";
import { useDashboardInventory } from "./dashboard/useDashboardInventory";
import { useDashboardService } from "./dashboard/useDashboardService";
import { useDashboardMetrics } from "./dashboard/useDashboardMetrics";

export const useDashboardWidgets = () => {
  const finance = useDashboardFinance();
  const payments = useDashboardPayments();
  const einvoice = useDashboardEInvoice();
  const sales = useDashboardSales();
  const purchasing = useDashboardPurchasing();
  const inventory = useDashboardInventory();
  const service = useDashboardService();
  const metrics = useDashboardMetrics();

  return {
    // Finance
    monthlyTurnover: finance.monthlyTurnover,
    monthlyExpenses: finance.monthlyExpenses,
    stockValue: finance.stockValue,
    assets: finance.assets,
    liabilities: finance.liabilities,
    // Payments
    overdueReceivables: payments.overdueReceivables,
    upcomingChecks: payments.upcomingChecks,
    upcomingExpenses: payments.upcomingExpenses,
    // E-Invoice
    incomingEInvoices: einvoice.incomingEInvoices,
    // Sales (CRM + Sales)
    activeOpportunities: sales.activeOpportunities,
    pendingProposals: sales.pendingProposals,
    todaySales: sales.todaySales,
    pendingOrders: sales.pendingOrders,
    pendingDeliveries: sales.pendingDeliveries,
    topSellingProducts: sales.topSellingProducts,
    // Purchasing
    pendingPurchaseRequests: purchasing.pendingPurchaseRequests,
    pendingPurchaseOrders: purchasing.pendingPurchaseOrders,
    // Inventory
    lowStockItems: inventory.lowStockItems,
    // Service
    activeServiceRequests: service.activeServiceRequests,
    pendingWorkOrders: service.pendingWorkOrders,
    upcomingMaintenances: service.upcomingMaintenances,
    // Metrics
    totalCustomers: metrics.totalCustomers,
    activeCustomers: metrics.activeCustomers,
    previousMonthSales: metrics.previousMonthSales,
    totalReceivables: metrics.totalReceivables,
    opportunitiesValue: metrics.opportunitiesValue,
    opportunitiesCount: metrics.opportunitiesCount,
    // Loading states
    isAssetsLoading: finance.isAssetsLoading,
    isLiabilitiesLoading: finance.isLiabilitiesLoading,
    isLoading: finance.isLoading || payments.isLoading || einvoice.isLoading || 
                sales.isLoading || purchasing.isLoading || inventory.isLoading || 
                service.isLoading || metrics.isLoading,
  };
};

// Re-export individual hooks for direct usage
export { useDashboardFinance } from "./dashboard/useDashboardFinance";
export { useDashboardPayments } from "./dashboard/useDashboardPayments";
export { useDashboardEInvoice } from "./dashboard/useDashboardEInvoice";
export { useDashboardSales } from "./dashboard/useDashboardSales";
export { useDashboardPurchasing } from "./dashboard/useDashboardPurchasing";
export { useDashboardInventory } from "./dashboard/useDashboardInventory";
export { useDashboardService } from "./dashboard/useDashboardService";
export { useDashboardMetrics } from "./dashboard/useDashboardMetrics";
