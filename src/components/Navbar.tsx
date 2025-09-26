import React from "react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Car,
  Calculator,
  PieChart,
  TrendingUp,
  CreditCard,
  Banknote,
  Receipt,
  Users2,
  Briefcase,
  Target,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Navbar = ({ isCollapsed, setIsCollapsed }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Müşteriler", path: "/customers" },
    { icon: Users2, label: "Tedarikçiler", path: "/suppliers" },
    { icon: Package, label: "Ürünler", path: "/products" },
    { icon: FileText, label: "Faturalar", path: "/invoices" },
    { icon: DollarSign, label: "Finans", path: "/finance" },
    { icon: Calculator, label: "Nakit Akışı", path: "/cashflow" },
    { icon: Briefcase, label: "Çalışanlar", path: "/employees" },
    { icon: Car, label: "Araçlar", path: "/vehicles" },
    { icon: Building2, label: "Şirket", path: "/company" },
    { icon: Settings, label: "Ayarlar", path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        isCollapsed ? "w-[60px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Panel</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                isCollapsed && "justify-center px-2",
                isActive(item.path) && "bg-primary text-primary-foreground"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Navbar;