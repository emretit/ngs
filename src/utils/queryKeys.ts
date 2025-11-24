/**
 * Centralized query key factory for React Query
 * This ensures consistent query key structure across the application
 */

export const queryKeys = {
  // Auth & User
  auth: {
    session: ['auth', 'session'] as const,
    user: (userId?: string) => ['auth', 'user', userId] as const,
    profile: (userId?: string) => ['auth', 'profile', userId] as const,
  },

  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (companyId?: string, filters?: Record<string, unknown>) => 
      [...queryKeys.orders.lists(), companyId, filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    stats: (companyId?: string) => [...queryKeys.orders.all, 'stats', companyId] as const,
  },

  // Proposals
  proposals: {
    all: ['proposals'] as const,
    lists: () => [...queryKeys.proposals.all, 'list'] as const,
    list: (companyId?: string, filters?: Record<string, unknown>) => 
      [...queryKeys.proposals.lists(), companyId, filters] as const,
    details: () => [...queryKeys.proposals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.proposals.details(), id] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    sales: {
      all: ['invoices', 'sales'] as const,
      lists: () => ['invoices', 'sales', 'list'] as const,
      list: (filters?: Record<string, unknown>) => 
        ['invoices', 'sales', 'list', filters] as const,
      detail: (id: string) => ['invoices', 'sales', 'detail', id] as const,
    },
    purchase: {
      all: ['invoices', 'purchase'] as const,
      lists: () => ['invoices', 'purchase', 'list'] as const,
      list: (filters?: Record<string, unknown>) => 
        ['invoices', 'purchase', 'list', filters] as const,
      detail: (id: string) => ['invoices', 'purchase', 'detail', id] as const,
    },
    analysis: (year?: number) => ['invoices', 'analysis', year] as const,
  },

  // Calendar
  calendar: {
    all: ['calendar'] as const,
    workOrders: (companyId?: string) => [...queryKeys.calendar.all, 'work-orders', companyId] as const,
    serviceRequests: (companyId?: string) => [...queryKeys.calendar.all, 'service-requests', companyId] as const,
    opportunities: (companyId?: string) => [...queryKeys.calendar.all, 'opportunities', companyId] as const,
    payments: (companyId?: string) => [...queryKeys.calendar.all, 'payments', companyId] as const,
    expenses: (companyId?: string) => [...queryKeys.calendar.all, 'expenses', companyId] as const,
    checks: (companyId?: string) => [...queryKeys.calendar.all, 'checks', companyId] as const,
  },

  // AI Insights
  aiInsights: {
    all: ['ai-insights'] as const,
    latest: (companyId?: string) => [...queryKeys.aiInsights.all, 'latest', companyId] as const,
    history: (companyId?: string) => [...queryKeys.aiInsights.all, 'history', companyId] as const,
  },

  // Service Requests
  serviceRequests: {
    all: ['service-requests'] as const,
    lists: () => [...queryKeys.serviceRequests.all, 'list'] as const,
    list: (companyId?: string) => [...queryKeys.serviceRequests.lists(), companyId] as const,
    detail: (id: string) => [...queryKeys.serviceRequests.all, 'detail', id] as const,
  },

  // Employees
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (companyId?: string, filters?: Record<string, unknown>) => 
      [...queryKeys.employees.lists(), companyId, filters] as const,
    detail: (id: string) => [...queryKeys.employees.all, 'detail', id] as const,
  },

  // Suppliers
  suppliers: {
    all: ['suppliers'] as const,
    lists: () => [...queryKeys.suppliers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.suppliers.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.suppliers.all, 'detail', id] as const,
  },

  // Exchange Rates
  exchangeRates: {
    all: ['exchange-rates'] as const,
    latest: () => [...queryKeys.exchangeRates.all, 'latest'] as const,
    history: (date?: string) => [...queryKeys.exchangeRates.all, 'history', date] as const,
  },
} as const;

