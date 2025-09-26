import { useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import NavHeader from "./navbar/NavHeader";
import NavLink from "./navbar/NavLink";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  TrendingUp,
  Wallet,
  Car,
  Package,
  UserPlus,
  Calculator,
  PieChart,
  BarChart3,
  DollarSign,
  CreditCard,
  Receipt,
  Target,
  Briefcase,
  TrendingDown,
  Activity,
  FileBarChart,
  Building,
  UserCheck,
  Truck,
  Calendar,
  MessageSquare,
  Bell,
  HelpCircle
} from "lucide-react";

interface NavbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Navbar = ({ isCollapsed, setIsCollapsed }: NavbarProps) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isExpanded = (section: string) => expandedSections.includes(section);

  const navItems = [
    {
      section: "dashboard",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/crm", icon: Users, label: "CRM Dashboard" }
      ]
    },
    {
      section: "contacts",
      items: [
        { to: "/contacts", icon: Users, label: "Müşteriler" },
        { to: "/employees", icon: UserCheck, label: "Çalışanlar" },
        { to: "/suppliers", icon: Building, label: "Tedarikçiler" }
      ]
    },
    {
      section: "cashflow",
      items: [
        { to: "/cashflow", icon: TrendingUp, label: "Nakit Akış" },
        { to: "/cashflow/bank-accounts", icon: Building2, label: "Hesaplar" },
        { to: "/cashflow/categories", icon: Target, label: "Kategoriler" },
        { to: "/cashflow/expenses", icon: TrendingDown, label: "Giderler" },
        { to: "/cashflow/invoices", icon: Receipt, label: "Faturalar" },
        { to: "/cashflow/employee-costs", icon: UserPlus, label: "Personel Maliyetleri" },
        { to: "/cashflow/loans-and-checks", icon: CreditCard, label: "Krediler ve Çekler" },
        { to: "/cashflow/opex-entry", icon: Calculator, label: "OPEX Girişi" }
      ]
    },
    {
      section: "finance",
      items: [
        { to: "/finance", icon: Wallet, label: "Finans" },
        { to: "/income-management", icon: DollarSign, label: "Gelir Yönetimi" },
        { to: "/expense-management", icon: TrendingDown, label: "Gider Yönetimi" },
        { to: "/investment-management", icon: TrendingUp, label: "Yatırım Yönetimi" },
        { to: "/financing-management", icon: CreditCard, label: "Finansman Yönetimi" },
        { to: "/other-activities", icon: Activity, label: "Diğer Faaliyetler" }
      ]
    },
    {
      section: "vehicles",
      items: [
        { to: "/vehicles", icon: Car, label: "Araçlar" }
      ]
    },
    {
      section: "products",
      items: [
        { to: "/products", icon: Package, label: "Ürünler" }
      ]
    },
    {
      section: "reports",
      items: [
        { to: "/reports", icon: FileBarChart, label: "Raporlar" }
      ]
    },
    {
      section: "settings",
      items: [
        { to: "/settings", icon: Settings, label: "Ayarlar" }
      ]
    }
  ];

  return (
    <nav className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 transition-all duration-300",
      isCollapsed ? "w-[60px]" : "w-64"
    )}>
      <NavHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {navItems.map(({ section, items }) => (
          <div key={section} className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.to)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;