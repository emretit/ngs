
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
  Tag
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
    path: "/customers",
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
        path: "/purchasing/requests",
        icon: FileText,
        label: "Talepler (PR)",
      },
      {
        path: "/purchasing/rfqs",
        icon: MessageSquare,
        label: "Teklif İstekleri (RFQ)",
      },
      {
        path: "/purchasing/orders",
        icon: ShoppingCart,
        label: "Siparişler (PO)",
      },
      {
        path: "/purchasing/grns",
        icon: ClipboardCheck,
        label: "Mal Kabul (GRN)",
      },
      {
        path: "/purchasing/settings",
        icon: Settings,
        label: "Ayarlar",
      },
    ],
  },
  // 6. Servis
  {
    path: "/service",
    icon: Wrench,
    label: "Servis",
    hasDropdown: true,
    items: [
      // Servis Yönetimi
      {
        path: "/service/management",
        icon: LayoutDashboard,
        label: "Servis Yönetimi",
      },
      // Harita
      {
        path: "/service/map",
        icon: MapPin,
        label: "Harita",
      },
      // Varlık Yönetimi (Cihaz, Garanti, Parça)
      {
        path: "/service/asset-management",
        icon: Package,
        label: "Varlık Yönetimi",
      },
      // Performans
      {
        path: "/service/performance",
        icon: BarChart3,
        label: "Teknisyen Performansı",
      },
    ],
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
  // 8. Sözleşme Yönetimi
  {
    path: "/contracts",
    icon: FileSignature,
    label: "Sözleşme Yönetimi",
    hasDropdown: true,
    items: [
      {
        path: "/contracts",
        icon: LayoutDashboard,
        label: "Genel Bakış",
      },
      {
        path: "/contracts/service",
        icon: Wrench,
        label: "Servis Sözleşmeleri",
      },
      {
        path: "/contracts/vehicle",
        icon: Car,
        label: "Araç Sözleşmeleri",
      },
      {
        path: "/contracts/customer",
        icon: User,
        label: "Müşteri Sözleşmeleri",
      },
    ],
  },
  // 9. Nakit Akış (eski 8)
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
        label: "Masraflar",
      },
      {
        path: "/cashflow/categories",
        icon: Tag,
        label: "Gelir-Gider Kategorileri",
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
        path: "/users",
        icon: Users,
        label: "Kullanıcı Yönetimi",
      },
      {
        path: "/subscription",
        icon: CreditCard,
        label: "Abonelik & Faturalama",
      },
      {
        path: "/nilvera",
        icon: Zap,
        label: "Nilvera E-Fatura",
      },
      {
        path: "/system",
        icon: Wrench,
        label: "Sistem Ayarları",
      },
      {
        path: "/pdf-templates",
        icon: FileText,
        label: "PDF Şablonları",
      },
      {
        path: "/audit-logs",
        icon: ClipboardList,
        label: "Denetim Günlüğü",
      },
    ],
  },
];

