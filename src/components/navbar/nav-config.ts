
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
  CheckSquare,
  Workflow,
  Plus,
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  ClipboardCheck,
  ArrowRightLeft,
  Factory,
  Warehouse
} from "lucide-react";

export const navItems = [
  // 1. Gösterge Paneli
  {
    path: "/dashboard",
    icon: Home,
    label: "Gösterge Paneli",
  },
  // 2. Müşteriler
  {
    path: "/contacts",
    icon: User,
    label: "Müşteriler",
  },
  // 3. Tedarikçiler
  {
    path: "/suppliers",
    icon: Building2,
    label: "Tedarikçiler",
  },
  // 4. Satış Yönetimi
  {
    path: "/crm",
    icon: TrendingUp,
    label: "Satış Yönetimi",
    hasDropdown: true,
    items: [
      {
        path: "/activities",
        icon: ListTodo,
        label: "Aktiviteler",
      },
      {
        path: "/opportunities",
        icon: Target,
        label: "Fırsatlar",
      },
      {
        path: "/proposals",
        icon: Quote,
        label: "Teklifler",
      },
      {
        path: "/orders/list",
        icon: ShoppingCart,
        label: "Siparişler",
      },
      {
        path: "/deliveries",
        icon: Truck,
        label: "Teslimatlar",
      },
      {
        path: "/returns",
        icon: RotateCcw,
        label: "İadeler",
      },
    ],
  },
  // 5. Satın Alma
  {
    path: "/purchasing",
    icon: PackageCheck,
    label: "Satın Alma",
    hasDropdown: true,
    items: [
      {
        path: "/purchase-requests",
        icon: FileText,
        label: "Talepler",
      },
      {
        path: "/purchase-rfqs",
        icon: MessageSquare,
        label: "Teklif İst.",
      },
      {
        path: "/purchase-orders",
        icon: ShoppingCart,
        label: "Siparişler",
      },
      {
        path: "/purchase-grns",
        icon: ClipboardCheck,
        label: "Teslimatlar",
      },
      {
        path: "/vendor-invoices",
        icon: Receipt,
        label: "Faturalar",
      },
    ],
  },
  // 6. Servis
  {
    path: "/service",
    icon: Wrench,
    label: "Servis",
  },
  // 7. Fatura Yönetimi
  {
    path: "/invoices",
    icon: Receipt,
    label: "Fatura Yönetimi",
    hasDropdown: true,
    items: [
      {
        path: "/sales-invoices",
        icon: Receipt,
        label: "Satış Faturaları",
      },
      {
        path: "/purchase-invoices",
        icon: Receipt,
        label: "Alış Faturaları",
      },
      {
        path: "/e-invoice",
        icon: FileText,
        label: "E-Fatura",
      },
      
    ],
  },
  // 8. Nakit Akış
  {
    path: "/cashflow",
    icon: CreditCard,
    label: "Nakit Akış",
    hasDropdown: true,
    items: [
      {
        path: "/cashflow/bank-accounts",
        icon: Building,
        label: "Hesaplar",
      },
      {
        path: "/cashflow/expenses",
        icon: Receipt,
        label: "Gelirler ve Giderler",
      },
      {
        path: "/cashflow/budget-management",
        icon: FileText,
        label: "Bütçe Yönetimi",
      },
      {
        path: "/cashflow/checks-notes",
        icon: Receipt,
        label: "Çekler ve Senetler",
      },
      {
        path: "/cashflow/loans",
        icon: Calculator,
        label: "Krediler",
      },
    ],
  },
  // 9. Stok Yönetimi
  {
    path: "/inventory",
    icon: Package,
    label: "Stok Yönetimi",
    hasDropdown: true,
    items: [
      {
        path: "/products",
        icon: Package,
        label: "Ürünler",
      },
      {
        path: "/inventory/transactions",
        icon: ArrowRightLeft,
        label: "Stok Hareketleri",
      },
      {
        path: "/inventory/counts",
        icon: ClipboardList,
        label: "Stok Sayımları",
      },
      {
        path: "/inventory/warehouses",
        icon: Warehouse,
        label: "Depolar",
      },
      {
        path: "/production",
        icon: Factory,
        label: "Üretim",
      },
    ],
  },
  // 10. Çalışanlar
  {
    path: "/employees",
    icon: Users,
    label: "Çalışanlar",
  },
  // 11. Araç Yönetimi
  {
    path: "/vehicles",
    icon: Car,
    label: "Araç Yönetimi",
  },
  // 12. Raporlar
  {
    path: "/reports",
    icon: BarChart2,
    label: "Raporlar",
  },
  // 13. Modül Ağacı
  {
    path: "/modules-tree",
    icon: Workflow,
    label: "Modül Ağacı",
  },
  // 14. Ayarlar
  {
    path: "/settings",
    icon: Settings,
    label: "Ayarlar",
    hasDropdown: true,
    items: [
      {
        path: "/settings/users",
        icon: Users,
        label: "Kullanıcı Yönetimi",
      },
      {
        path: "/settings/subscription",
        icon: CreditCard,
        label: "Abonelik & Faturalama",
      },
      {
        path: "/settings/nilvera",
        icon: Zap,
        label: "Nilvera E-Fatura",
      },
      {
        path: "/settings/system",
        icon: Wrench,
        label: "Sistem Ayarları",
      },
      {
        path: "/settings/pdf-templates",
        icon: FileText,
        label: "PDF Şablonları",
      },
      {
        path: "/settings/audit-logs",
        icon: ClipboardList,
        label: "Denetim Günlüğü",
      },
    ],
  },
];

