import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NavHeader from "./navbar/NavHeader";
import NavLink from "./navbar/NavLink";
import { navItems } from "./navbar/nav-config";
import { usePermissions } from "@/hooks/usePermissions";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";

interface NavbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Navbar = ({ isCollapsed, setIsCollapsed }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const { hasModuleAccess, isLoading: permissionsLoading } = usePermissions();
  const { isSuperAdmin, isLoading: superAdminLoading } = useSuperAdmin();
  
  
  
  // Load expanded menus from localStorage - but start with empty set for first load
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    // Always start with empty set to prevent auto-expanding dropdowns on first load
    return new Set<string>();
  });

  // Clear localStorage on first load to prevent auto-expanding dropdowns
  useEffect(() => {
    localStorage.removeItem("expandedMenus");
  }, []);

  // Auto-expand cashflow menu if on categories page
  useEffect(() => {
    if (location.pathname === '/cashflow/categories') {
      setExpandedMenus(prev => {
        const newExpanded = new Set(prev);
        newExpanded.add('/cashflow');
        return newExpanded;
      });
    }
  }, [location.pathname]);

  // Save expanded menus to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("expandedMenus", JSON.stringify(Array.from(expandedMenus)));
  }, [expandedMenus]);

  // Scroll pozisyonunu koru
  useEffect(() => {
    if (navRef.current) {
      const savedScrollTop = localStorage.getItem("sidebarScrollTop");
      if (savedScrollTop) {
        navRef.current.scrollTop = parseInt(savedScrollTop, 10);
      }
    }
  }, []);

  // Scroll pozisyonunu kaydet
  const handleScroll = () => {
    if (navRef.current) {
      localStorage.setItem("sidebarScrollTop", navRef.current.scrollTop.toString());
    }
  };

  const toggleMenu = useCallback((path: string) => {
    setExpandedMenus(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  }, []);

  const handleParentClick = useCallback((item: any) => {
    if (item.hasDropdown && item.items) {
      const isOnParentPage = location.pathname === item.path;
      const isOnRelatedChildPage = item.items?.some((subItem: any) => 
        location.pathname === subItem.path || 
        (subItem.path !== '/' && location.pathname.startsWith(subItem.path + '/')) ||
        // Special case: categories page is a child of expenses
        (subItem.path === '/cashflow/expenses' && location.pathname === '/cashflow/categories')
      );
      const isAlreadyExpanded = expandedMenus.has(item.path);
      
      // Always navigate to parent page first
      navigate(item.path);
      
      // Then handle dropdown state
      if (isAlreadyExpanded) {
        // If already expanded, collapse it
        startTransition(() => {
          setExpandedMenus(prev => {
            const newExpanded = new Set(prev);
            newExpanded.delete(item.path);
            return newExpanded;
          });
        });
      } else {
        // If not expanded, expand it
        startTransition(() => {
          setExpandedMenus(prev => new Set([...prev, item.path]));
        });
      }
    } else {
      // For regular nav items without dropdown, just navigate
      navigate(item.path);
    }
  }, [location.pathname, navigate, expandedMenus]);

  // Handle click for dropdown toggle button
  const handleToggleClick = useCallback((item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMenu(item.path);
  }, [toggleMenu]);

  // Memoize isActiveChild calculation
  const getSubItemActiveState = useCallback((subItem: any, item: any) => {
    // Exact match
    if (location.pathname === subItem.path) return true;
    // Check if current path starts with sub-item path (for detail pages)
    // But make sure it's not matching parent paths
    if (subItem.path !== '/' && subItem.path !== item.path && location.pathname.startsWith(subItem.path + '/')) return true;
    // Special case: cash-accounts detail pages should also match bank-accounts nav item
    if (subItem.path === '/cashflow/bank-accounts' && location.pathname.startsWith('/cashflow/cash-accounts/')) return true;
    if (subItem.path === '/cashflow/bank-accounts' && location.pathname.startsWith('/cashflow/credit-cards/')) return true;
    if (subItem.path === '/cashflow/bank-accounts' && location.pathname.startsWith('/cashflow/partner-accounts/')) return true;
    // Special case: proposal pages should match proposals nav item
    if (subItem.path === '/proposals' && location.pathname.startsWith('/proposal/')) return true;
    // Special case: categories page should match expenses nav item (Gelirler ve Giderler)
    if (subItem.path === '/cashflow/expenses' && location.pathname === '/cashflow/categories') return true;
    return false;
  }, [location.pathname]);

  const renderNavItem = useCallback((item: any) => {
    // Modül bazlı erişim kontrolü - path'ten modül adını çıkar
    const moduleKey = item.path.replace(/^\//, '').split('/')[0] || 'dashboard';
    
    // İzin yüklenirken menüyü göster
    if (permissionsLoading) {
      return null;
    }
    
    // İzin kontrolü - izin yoksa menüyü gösterme
    if (!hasModuleAccess(moduleKey)) {
      return null;
    }
    
    if (item.hasDropdown && item.items) {
      const isExpanded = expandedMenus.has(item.path);
      const isActive = location.pathname === item.path;
      const hasActiveChild = item.items.some((subItem: any) => 
        getSubItemActiveState(subItem, item)
      );
      
      return (
        <div key={item.path} className="space-y-0.5">
          {/* Parent item */}
          <div
            onClick={() => handleParentClick(item)}
            className={cn(
              "flex items-center justify-between transition-all duration-200 rounded-lg group cursor-pointer",
              isCollapsed ? "justify-center px-2 h-8" : "px-2 h-8",
              isActive || hasActiveChild
                ? "bg-primary/15 text-primary font-semibold shadow-sm"
                : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
            )}
          >
            <div className="flex items-center space-x-2">
              <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
              {!isCollapsed && <span className="text-xs font-medium">{item.label}</span>}
            </div>
            {!isCollapsed && (
              <div
                onClick={(e) => handleToggleClick(item, e)}
                className="p-1 hover:bg-gray-700/50 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            )}
          </div>
          
          {/* Sub-items */}
          {!isCollapsed && isExpanded && (
            <div className="ml-3 space-y-0.5 border-l border-gray-700 pl-3">
              {item.items.map((subItem: any) => (
                <NavLink
                  key={subItem.path}
                  to={subItem.path}
                  icon={subItem.icon}
                  label={subItem.label}
                  isActive={getSubItemActiveState(subItem, item)}
                  isCollapsed={false}
                  isSubItem={true}
                />
              ))}
            </div>
          )}
        </div>
      );
    } else {
      // Regular nav item
      return (
        <NavLink
          key={item.path}
          to={item.path}
          icon={item.icon}
          label={item.label}
          isActive={
            location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ||
            // Special case: product-form pages should match products nav item
            (item.path === '/products' && location.pathname.startsWith('/product-form'))
          }
          isCollapsed={isCollapsed}
        />
      );
    }
  }, [expandedMenus, location.pathname, isCollapsed, handleParentClick, handleToggleClick, getSubItemActiveState]);

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-[60px]" : "w-56"
    )}>
      <NavHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* Scrollable content area */}
      <nav 
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-hide"
      >
        {navItems.map(renderNavItem)}
        
        {/* Admin Panel Link - Only visible to super admins */}
        {!superAdminLoading && isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-gray-700">
            <NavLink
              to="/admin"
              icon={Shield}
              label="Admin Panel"
              isActive={location.pathname.startsWith('/admin')}
              isCollapsed={isCollapsed}
            />
          </div>
        )}
      </nav>
    </div>
  );
};

export default React.memo(Navbar, (prevProps, nextProps) => {
  return prevProps.isCollapsed === nextProps.isCollapsed;
});