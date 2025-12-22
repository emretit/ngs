/**
 * Satış Raporları Modüler Sistem - Type Definitions
 */

export type ReportCategory = 
  | 'sales' 
  | 'finance' 
  | 'hr' 
  | 'inventory' 
  | 'purchasing' 
  | 'service' 
  | 'vehicles';

export type ReportType = 
  | 'sales_performance'
  | 'sales_funnel'
  | 'sales_rep_performance'
  | 'proposal_analysis'
  | 'sales_forecast'
  | 'lost_sales'
  | 'customer_sales';

export type Currency = 'TRY' | 'USD' | 'EUR';

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface GlobalFilters {
  startDate?: string;
  endDate?: string;
  salesRepId?: string;
  customerId?: string;
  projectId?: string;
  salesStage?: string;
  currency?: Currency;
}

export interface ReportBlockConfig {
  id: string;
  reportType: ReportType;
  title: string;
  description: string;
  chartType: 'chart' | 'table' | 'mixed';
  filters?: Partial<GlobalFilters>; // Override filters for this block
  order: number;
  isVisible: boolean;
  isExpanded: boolean;
}

export interface SavedView {
  id: string;
  userId: string;
  companyId: string;
  viewName: string;
  reportType: ReportCategory;
  layoutConfig: {
    reportBlocks: ReportBlockConfig[];
  };
  filters: GlobalFilters;
  reportOrder: string[]; // Array of report block IDs in order
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Sales Performance Report Types
export interface SalesPerformanceData {
  totalSales: number;
  dealCount: number;
  winRate: number;
  avgDealSize: number;
  avgClosingTime: number; // days
  salesOverTime: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  trends: {
    totalSales: { current: number; previous: number; change: number };
    dealCount: { current: number; previous: number; change: number };
    winRate: { current: number; previous: number; change: number };
  };
}

// Sales Funnel Report Types
export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  value: number;
  conversionRate?: number; // Conversion from previous stage
  avgDaysInStage?: number; // Average days spent in this stage
  bottleneck?: boolean; // Whether this stage is a bottleneck
}

export interface SalesFunnelData {
  stages: FunnelStage[];
  totalPipelineValue: number;
  totalDeals: number;
  funnelOverTime?: Array<{
    date: string;
    stages: {
      stage: string;
      count: number;
      value: number;
    }[];
  }>;
}

// Sales Rep Performance Types
export interface SalesRepPerformance {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  wonDeals: number;
  lostDeals: number;
  avgDealSize: number;
  avgClosingDuration: number; // days
  winRate: number;
}

export interface SalesRepPerformanceData {
  reps: SalesRepPerformance[];
  totalReps: number;
}

// Proposal Analysis Types
export interface ProposalStatusData {
  status: 'accepted' | 'rejected' | 'pending' | 'draft' | 'sent';
  count: number;
  value: number;
}

export interface ProposalAnalysisData {
  totalProposals: number;
  accepted: number;
  rejected: number;
  pending: number;
  acceptanceRate: number;
  revisionCount: number;
  statusDistribution: ProposalStatusData[];
  volumeOverTime: Array<{
    date: string;
    count: number;
    accepted: number;
    rejected: number;
  }>;
}

// Sales Forecast Types
export interface ForecastData {
  openDeals: number;
  weightedForecastValue: number;
  expectedRevenue: {
    monthly: Array<{
      month: string;
      forecast: number;
      actual?: number;
    }>;
    quarterly: Array<{
      quarter: string;
      forecast: number;
      actual?: number;
    }>;
  };
  pipelineValue: Array<{
    stage: string;
    value: number;
    count: number;
  }>;
}

// Lost Sales Types
export type LossReason = 'price' | 'competitor' | 'timing' | 'scope' | 'other';

export interface LostSalesData {
  totalLostDeals: number;
  totalLostValue: number;
  reasons: Array<{
    reason: LossReason;
    label: string;
    count: number;
    value: number;
    percentage: number;
  }>;
}

// Customer Sales Types
export interface CustomerSalesData {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  dealCount: number;
  avgDealSize: number;
  lastTransactionDate: string;
}

export interface CustomerSalesReportData {
  customers: CustomerSalesData[];
  topCustomers: CustomerSalesData[]; // Top 10
  totalCustomers: number;
}

// Report Block Props
export interface ReportBlockProps {
  reportType: ReportType;
  config: ReportBlockConfig;
  filters: GlobalFilters;
  onExport?: (format: ExportFormat) => void;
  onFullscreen?: () => void;
  onDrillDown?: (data: any) => void;
  onFilterChange?: (filters: Partial<GlobalFilters>) => void;
}

// Drill Down Modal Data
export interface DrillDownData {
  reportType: ReportType;
  title: string;
  data: any;
  columns?: Array<{
    key: string;
    label: string;
    type?: 'string' | 'number' | 'date' | 'currency';
  }>;
}

