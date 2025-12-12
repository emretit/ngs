
import {
  Building2,
  Briefcase,
  CreditCard,
  FileText,
  Home,
  Settings,
  ShoppingCart,
  User,
  Users,
  Users2,
  Wrench,
  BarChart2,
  BarChart3,
  ListTodo,
  PackageCheck,
  Target,
  Quote,
  Truck,
  RotateCcw,
  TrendingUp,
  Package,
  Banknote,
  Receipt,
  Building,
  UserCheck,
  Calculator,
  Zap,
  Zap as ZapIcon,
  FileEdit,
  Car,
  Fuel,
  Calendar,
  AlertTriangle,
  DollarSign,
  MapPin,
  Gauge,
  Workflow,
  Plus,
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  ClipboardCheck,
  ArrowRightLeft,
  Factory,
  Warehouse,
  FileSignature,
  Tag,
  Cog,
  BarChart,
  CheckCircle,
  PieChart
} from "lucide-react";

export const navItems = [
  // 1. Gösterge Paneli
  {
    path: "/dashboard",
    icon: Home,
    label: "Gösterge Paneli",
    translationKey: "nav.dashboard",
  },
  // 2. Müşteriler
  {
    path: "/customers",
    icon: User,
    label: "Müşteriler",
    translationKey: "nav.customers",
  },
  // 3. Tedarikçiler
  {
    path: "/suppliers",
    icon: Building2,
    label: "Tedarikçiler",
    translationKey: "nav.suppliers",
  },
  // 4. Satış Yönetimi
  {
    path: "/crm",
    icon: TrendingUp,
    label: "Satış Yönetimi",
    translationKey: "nav.salesManagement",
    hasDropdown: true,
    items: [
      {
        path: "/activities",
        icon: ListTodo,
        label: "Aktiviteler",
        translationKey: "nav.activities",
      },
      {
        path: "/opportunities",
        icon: Target,
        label: "Fırsatlar",
        translationKey: "nav.opportunities",
      },
      {
        path: "/proposals",
        icon: Quote,
        label: "Teklifler",
        translationKey: "nav.proposals",
      },
      {
        path: "/orders/list",
        icon: ShoppingCart,
        label: "Siparişler",
        translationKey: "nav.orders",
      },
      {
        path: "/deliveries",
        icon: Truck,
        label: "Teslimatlar",
        translationKey: "nav.deliveries",
      },
      {
        path: "/returns",
        icon: RotateCcw,
        label: "İadeler",
        translationKey: "nav.returns",
      },
    ],
  },
  // 5. Satın Alma
  {
    path: "/purchasing",
    icon: PackageCheck,
    label: "Satın Alma",
    translationKey: "nav.purchasing",
    hasDropdown: true,
    items: [
      {
        path: "/purchasing/requests",
        icon: FileText,
        label: "Talepler (PR)",
        translationKey: "nav.purchaseRequests",
      },
      {
        path: "/purchasing/rfqs",
        icon: MessageSquare,
        label: "Teklif İstekleri (RFQ)",
        translationKey: "nav.purchaseRfqs",
      },
      {
        path: "/purchasing/orders",
        icon: ShoppingCart,
        label: "Siparişler (PO)",
        translationKey: "nav.purchaseOrders",
      },
      {
        path: "/purchasing/grns",
        icon: ClipboardCheck,
        label: "Mal Kabul (GRN)",
        translationKey: "nav.purchaseGrns",
      },
      {
        path: "/purchasing/settings",
        icon: Settings,
        label: "Ayarlar",
        translationKey: "nav.settings",
      },
    ],
  },
  // 6. Servis
  {
    path: "/service",
    icon: Wrench,
    label: "Servis",
    translationKey: "nav.service",
    hasDropdown: true,
    items: [
      // Servis Yönetimi
      {
        path: "/service/management",
        icon: LayoutDashboard,
        label: "Servis Yönetimi",
        translationKey: "nav.serviceManagement",
      },
      // Harita
      {
        path: "/service/map",
        icon: MapPin,
        label: "Harita",
        translationKey: "nav.map",
      },
      // Varlık Yönetimi (Cihaz, Garanti, Parça)
      {
        path: "/service/asset-management",
        icon: Package,
        label: "Varlık Yönetimi",
        translationKey: "nav.assetManagement",
      },
      // Performans
      {
        path: "/service/performance",
        icon: BarChart3,
        label: "Teknisyen Performansı",
        translationKey: "nav.technicianPerformance",
      },
    ],
  },
  // 7. Fatura Yönetimi
  {
    path: "/invoices",
    icon: Receipt,
    label: "Fatura Yönetimi",
    translationKey: "nav.invoiceManagement",
    hasDropdown: true,
    items: [
      {
        path: "/sales-invoices",
        icon: Receipt,
        label: "Satış Faturaları",
        translationKey: "nav.salesInvoices",
      },
      {
        path: "/purchase-invoices",
        icon: Receipt,
        label: "Alış Faturaları",
        translationKey: "nav.purchaseInvoices",
      },
      {
        path: "/e-invoice",
        icon: FileText,
        label: "E-Fatura",
        translationKey: "nav.eInvoice",
      },
      
    ],
  },
  // 8. Sözleşme Yönetimi
  {
    path: "/contracts",
    icon: FileSignature,
    label: "Sözleşme Yönetimi",
    translationKey: "nav.contractManagement",
    hasDropdown: true,
    items: [
      {
        path: "/contracts",
        icon: LayoutDashboard,
        label: "Genel Bakış",
        translationKey: "nav.overview",
      },
      {
        path: "/contracts/service",
        icon: Wrench,
        label: "Servis Sözleşmeleri",
        translationKey: "nav.serviceContracts",
      },
      {
        path: "/contracts/vehicle",
        icon: Car,
        label: "Araç Sözleşmeleri",
        translationKey: "nav.vehicleContracts",
      },
      {
        path: "/contracts/customer",
        icon: User,
        label: "Müşteri Sözleşmeleri",
        translationKey: "nav.customerContracts",
      },
    ],
  },
  // 9. Nakit Akış (eski 8)
  {
    path: "/cashflow",
    icon: CreditCard,
    label: "Nakit Akış",
    translationKey: "nav.cashflow",
    hasDropdown: true,
    items: [
      {
        path: "/cashflow/bank-accounts",
        icon: Building,
        label: "Hesaplar",
        translationKey: "nav.accounts",
      },
      {
        path: "/cashflow/expenses",
        icon: Receipt,
        label: "Masraflar",
        translationKey: "nav.expenses",
      },
      {
        path: "/cashflow/categories",
        icon: Tag,
        label: "Gelir-Gider Kategorileri",
        translationKey: "nav.incomeExpenseCategories",
      },
      {
        path: "/cashflow/budget-management",
        icon: FileText,
        label: "Bütçe Yönetimi",
        translationKey: "nav.budgetManagement",
      },
      {
        path: "/cashflow/checks-notes",
        icon: Receipt,
        label: "Çekler ve Senetler",
        translationKey: "nav.checksNotes",
      },
      {
        path: "/cashflow/loans",
        icon: Calculator,
        label: "Krediler",
        translationKey: "nav.loans",
      },
    ],
  },
  // 9. Bütçe Yönetimi
  {
    path: "/budget",
    icon: FileText,
    label: "Bütçe Yönetimi",
    translationKey: "nav.budgetManagement",
    hasDropdown: true,
    items: [
      {
        path: "/budget",
        icon: LayoutDashboard,
        label: "Dashboard",
        translationKey: "nav.budgetDashboard",
      },
      {
        path: "/budget/entry",
        icon: Plus,
        label: "Bütçe Girişi",
        translationKey: "nav.budgetEntry",
      },
      {
        path: "/budget/comparison",
        icon: BarChart,
        label: "Varyans Analizi",
        translationKey: "nav.budgetComparison",
      },
      {
        path: "/budget/approvals",
        icon: CheckCircle,
        label: "Onaylar",
        translationKey: "nav.budgetApprovals",
      },
      {
        path: "/budget/reports",
        icon: PieChart,
        label: "Raporlar",
        translationKey: "nav.budgetReports",
      },
    ],
  },
  // 9.5. Stok Yönetimi
  {
    path: "/inventory",
    icon: Package,
    label: "Stok Yönetimi",
    translationKey: "nav.inventory",
    hasDropdown: true,
    items: [
      {
        path: "/products",
        icon: Package,
        label: "Ürünler",
        translationKey: "nav.products",
      },
      {
        path: "/inventory/transactions",
        icon: ArrowRightLeft,
        label: "Stok Hareketleri",
        translationKey: "nav.inventoryTransactions",
      },
      {
        path: "/inventory/counts",
        icon: ClipboardList,
        label: "Stok Sayımları",
        translationKey: "nav.inventoryCounts",
      },
      {
        path: "/inventory/warehouses",
        icon: Warehouse,
        label: "Depolar",
        translationKey: "nav.warehouses",
      },
      {
        path: "/production",
        icon: Factory,
        label: "Üretim",
        translationKey: "nav.production",
      },
    ],
  },
  // 10. Çalışanlar
  {
    path: "/employees",
    icon: Users,
    label: "Çalışanlar",
    translationKey: "nav.employees",
  },
  // 11. Araç Yönetimi
  {
    path: "/vehicles",
    icon: Car,
    label: "Araç Yönetimi",
    translationKey: "nav.vehicleManagement",
  },
  // 12. Raporlar
  {
    path: "/reports",
    icon: BarChart2,
    label: "Raporlar",
    translationKey: "nav.reports",
    hasDropdown: true,
    items: [
      {
        path: "/reports",
        icon: BarChart3,
        label: "Genel Bakış",
        translationKey: "nav.reportsOverview",
      },
      {
        path: "/reports/sales",
        icon: TrendingUp,
        label: "Satış Raporları",
        translationKey: "nav.salesReports",
      },
      {
        path: "/reports/financial",
        icon: Banknote,
        label: "Finansal Raporlar",
        translationKey: "nav.financialReports",
      },
      {
        path: "/reports/service",
        icon: Wrench,
        label: "Servis Raporları",
        translationKey: "nav.serviceReports",
      },
      {
        path: "/reports/inventory",
        icon: Package,
        label: "Envanter Raporları",
        translationKey: "nav.inventoryReports",
      },
      {
        path: "/reports/purchasing",
        icon: ShoppingCart,
        label: "Satın Alma Raporları",
        translationKey: "nav.purchasingReports",
      },
      {
        path: "/reports/hr",
        icon: Briefcase,
        label: "İK Raporları",
        translationKey: "nav.hrReports",
      },
      {
        path: "/reports/vehicles",
        icon: Car,
        label: "Araç Filosu Raporları",
        translationKey: "nav.vehicleReports",
      },
    ],
  },
  // 13. Modül Ağacı
  {
    path: "/modules-tree",
    icon: Workflow,
    label: "Modül Ağacı",
    translationKey: "nav.moduleTree",
  },
  // 14. Ayarlar
  {
    path: "/settings",
    icon: Settings,
    label: "Ayarlar",
    translationKey: "nav.settings",
    hasDropdown: true,
    items: [
      {
        path: "/users",
        icon: Users,
        label: "Kullanıcı Yönetimi",
        translationKey: "nav.userManagement",
      },
      {
        path: "/subscription",
        icon: CreditCard,
        label: "Abonelik & Faturalama",
        translationKey: "nav.subscriptionBilling",
      },
      {
        path: "/settings/roles",
        icon: UserCheck,
        label: "Roller & İzinler",
        translationKey: "nav.rolesPermissions",
      },
      {
        path: "/integrator",
        icon: Zap,
        label: "E-Fatura Entegratörü",
        translationKey: "nav.eInvoiceIntegrator",
      },
      {
        path: "/system",
        icon: Wrench,
        label: "Sistem Ayarları",
        translationKey: "nav.systemSettings",
      },
      {
        path: "/system-parameters",
        icon: Cog,
        label: "Sistem Parametreleri",
        translationKey: "nav.systemParameters",
      },
      {
        path: "/pdf-templates",
        icon: FileText,
        label: "PDF Şablonları",
        translationKey: "nav.pdfTemplates",
      },
      {
        path: "/audit-logs",
        icon: ClipboardList,
        label: "Denetim Günlüğü",
        translationKey: "nav.auditLogs",
      },
    ],
  },
];

