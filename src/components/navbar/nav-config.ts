
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
  Gauge
} from "lucide-react";

export const navItems = [
  {
    path: "/dashboard",
    icon: Home,
    label: "Gösterge Paneli",
  },
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
        path: "/activities",
        icon: ListTodo,
        label: "Aktiviteler",
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
  {
    path: "/contacts",
    icon: User,
    label: "Müşteriler",
  },
  {
    path: "/suppliers",
    icon: Building2,
    label: "Tedarikçiler",
  },
  {
    path: "/products",
    icon: Package,
    label: "Ürünler",
  },
  {
    path: "/employees",
    icon: Users,
    label: "Çalışanlar",
  },
  {
    path: "/cashflow",
    icon: CreditCard,
    label: "Nakit Akış",
  },
  {
    path: "/service",
    icon: Wrench,
    label: "Servis",
  },
  {
    category: "Araç Yönetimi",
    icon: Car,
    path: "/vehicles",
    items: [
      {
        path: "/vehicles/list",
        icon: Car,
        label: "Araç Listesi",
      },
      {
        path: "/vehicles/documents",
        icon: FileText,
        label: "Belgeler",
      },
      {
        path: "/vehicles/maintenance",
        icon: Wrench,
        label: "Bakım & Servis",
      },
      {
        path: "/vehicles/fuel",
        icon: Fuel,
        label: "Yakıt & KM",
      },
      {
        path: "/vehicles/incidents",
        icon: AlertTriangle,
        label: "Olaylar & Cezalar",
      },
      {
        path: "/vehicles/costs",
        icon: DollarSign,
        label: "Maliyetler",
      },
    ],
  },

];

export const settingsItem = {
  path: "/settings",
  icon: Settings,
  label: "Ayarlar",
};
