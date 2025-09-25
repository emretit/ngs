
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
  CheckSquare
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
  // 4. Aktiviteler
  {
    path: "/activities",
    icon: ListTodo,
    label: "Aktiviteler",
  },
  // 5. Satış Yönetimi
  {
    category: "Satış Yönetimi",
    icon: TrendingUp,
    path: "/crm",
    items: [
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
  // 6. Satın Alma
  {
    category: "Satın Alma",
    icon: PackageCheck,
    path: "/purchase",
    items: [
      {
        path: "/purchase/requests",
        icon: FileText,
        label: "Talep Oluştur",
      },
      {
        path: "/orders/purchase",
        icon: PackageCheck,
        label: "Siparişler",
      },
    ],
  },
  // 7. Servis
  {
    path: "/service",
    icon: Wrench,
    label: "Servis",
  },
  // 8. Fatura Yönetimi
  {
    category: "Fatura Yönetimi",
    icon: Receipt,
    path: "/invoices",
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
  // 9. Nakit Akış
  {
    path: "/cashflow",
    icon: CreditCard,
    label: "Nakit Akış",
  },
  // 10. Ürünler
  {
    path: "/products",
    icon: Package,
    label: "Ürünler",
  },
  // 11. Çalışanlar
  {
    path: "/employees",
    icon: Users,
    label: "Çalışanlar",
  },
  // 12. Araç Yönetimi
  {
    path: "/vehicles",
    icon: Car,
    label: "Araç Yönetimi",
  },
  // 13. Raporlar
  {
    path: "/reports",
    icon: BarChart2,
    label: "Raporlar",
  },
];

export const settingsItem = {
  path: "/settings",
  icon: Settings,
  label: "Ayarlar",
};
