// Route prefetch map - maps paths to their dynamic imports
const routePrefetchMap: Record<string, () => Promise<any>> = {
  // Dashboard routes
  '/dashboard': () => import('@/pages/Dashboard'),
  '/crm': () => import('@/pages/crm/CrmDashboard'),
  '/calendar': () => import('@/pages/GeneralCalendar'),
  '/reports': () => import('@/pages/Reports'),
  
  // Cashflow routes
  '/cashflow': () => import('@/pages/Cashflow'),
  '/cashflow/expenses': () => import('@/pages/CashflowExpenses'),
  '/cashflow/checks': () => import('@/pages/CashflowChecks'),
  '/cashflow/notes': () => import('@/pages/CashflowNotes'),
  '/cashflow/loans': () => import('@/pages/CashflowLoans'),
  '/cashflow/bank-accounts': () => import('@/pages/CashflowBankAccounts'),
  '/cashflow/budget-management': () => import('@/pages/budget/BudgetList'),
  '/budget': () => import('@/pages/budget/BudgetList'),
  '/budget/categories': () => import('@/pages/CashflowCategories'),
  
  // Finance routes
  '/financial-overview': () => import('@/pages/FinancialOverview'),
  '/purchase-invoices': () => import('@/pages/PurchaseInvoices'),
  '/sales-invoices': () => import('@/pages/SalesInvoices'),
  '/e-invoice': () => import('@/pages/EInvoices'),
  
  // Product routes
  '/products': () => import('@/pages/Products'),
  '/inventory': () => import('@/pages/inventory/InventoryDashboard'),
  
  // Customer/Supplier routes
  '/customers': () => import('@/pages/Contacts'),
  '/suppliers': () => import('@/pages/Suppliers'),
  
  // Employee routes
  '/employees': () => import('@/pages/Employees'),
  
  // Service routes
  '/service': () => import('@/pages/service/ServiceDashboard'),
  '/service/management': () => import('@/pages/service/ServiceManagement'),
  
  // Order routes
  '/orders': () => import('@/pages/Orders'),
  '/deliveries': () => import('@/pages/Deliveries'),
  
  // CRM routes
  '/crm/opportunities': () => import('@/pages/crm/Opportunities'),
  '/activities': () => import('@/pages/Activities'),
  
  // Purchase routes
  '/purchase-requests': () => import('@/pages/PurchaseRequests'),
  '/purchasing': () => import('@/pages/purchasing/index'),
  
  // Proposals
  '/proposals': () => import('@/pages/Proposals'),
  
  // Vehicles
  '/vehicles': () => import('@/pages/vehicles/VehicleList'),
  
  // Settings
  '/settings': () => import('@/pages/Settings'),
  '/profile': () => import('@/pages/Profile'),
};

// Cache for already prefetched routes
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's component on hover
 * Only prefetches once per route
 */
export const prefetchRoute = (path: string): void => {
  // Skip if already prefetched
  if (prefetchedRoutes.has(path)) return;
  
  // Find matching route in prefetch map
  const prefetchFn = routePrefetchMap[path];
  
  if (prefetchFn) {
    // Mark as prefetched immediately to prevent duplicate calls
    prefetchedRoutes.add(path);
    
    // Prefetch with low priority using requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetchFn().catch(() => {
          // Remove from cache on error so it can retry
          prefetchedRoutes.delete(path);
        });
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        prefetchFn().catch(() => {
          prefetchedRoutes.delete(path);
        });
      }, 100);
    }
  }
};

/**
 * Prefetch multiple routes at once (useful for dropdown items)
 */
export const prefetchRoutes = (paths: string[]): void => {
  paths.forEach(prefetchRoute);
};
