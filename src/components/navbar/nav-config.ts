
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
  ClipboardCheck
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
    path: "/purchase",
    icon: PackageCheck,
    label: "Satın Alma",
    hasDropdown: true,
    items: [
      {
        path: "/purchasing",
        icon: LayoutDashboard,
        label: "Ana Sayfa",
      },
      {
        path: "/purchasing/vendors",
        icon: Building2,
        label: "Tedarikçiler",
      },
      {
        path: "/purchasing/requests",
        icon: FileText,
        label: "Talepler (PR)",
      },
      {
        path: "/purchasing/rfqs",
        icon: MessageSquare,
        label: "Teklif İst. (RFQ)",
      },
      {
        path: "/purchasing/orders",
        icon: ShoppingCart,
        label: "Siparişler (PO)",
      },
      {
        path: "/purchasing/grns",
        icon: ClipboardCheck,
        label: "Teslimatlar (GRN)",
      },
      {
        path: "/purchasing/invoices",
        icon: Receipt,
        label: "Faturalar (AP)",
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
        path: "/purchase/e-invoice",
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
        path: "/cashflow/opex-entry",
        icon: FileText,
        label: "OPEX Girişi",
      },
      {
        path: "/cashflow/expenses",
        icon: Receipt,
        label: "Giderler",
      },
      {
        path: "/cashflow/employee-costs",
        icon: Users2,
        label: "Çalışan Maliyetleri",
      },
      {
        path: "/cashflow/loans-and-checks",
        icon: Calculator,
        label: "Krediler ve Çekler",
      },
      {
        path: "/cashflow/invoices",
        icon: FileEdit,
        label: "Faturalar",
      },
      {
        path: "/cashflow/bank-accounts",
        icon: Building,
        label: "Hesaplar",
      },
    ],
  },
  // 9. Ürünler
  {
    path: "/products",
    icon: Package,
    label: "Ürünler",
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
    ],
  },
];

