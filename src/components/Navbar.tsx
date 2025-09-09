
import { useLocation, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import NavHeader from "./navbar/NavHeader";
import NavLink from "./navbar/NavLink";
import { navItems, settingsItem } from "./navbar/nav-config";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import UserMenu from "@/components/UserMenu";

interface NavbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

interface CategoryItem {
  category: string;
  icon: React.ElementType;
  path: string;
  items: NavItem[];
}

type NavItemOrCategory = NavItem | CategoryItem;

const isCategory = (item: NavItemOrCategory): item is CategoryItem => {
  return 'category' in item && 'items' in item;
};

const Navbar = ({ isCollapsed, setIsCollapsed }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  
  // Default olarak önemli kategorileri açık tutuyoruz ve localStorage'da saklıyoruz
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('expandedCategories');
    return saved ? JSON.parse(saved) : ["CRM & Satış", "İletişim", "Finans"];
  });

  const toggleCategory = (category: string, path?: string) => {
    // Kategori durumunu değiştir
    const newExpandedCategories = expandedCategories.includes(category) 
      ? expandedCategories.filter(c => c !== category)
      : [...expandedCategories, category];
    
    setExpandedCategories(newExpandedCategories);
    localStorage.setItem('expandedCategories', JSON.stringify(newExpandedCategories));
    
    // Eğer path varsa navigate et
    if (path) {
      navigate(path);
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-20 transition-all duration-300 border-r border-white/10 bg-gray-900 shadow-lg",
        isCollapsed ? "w-[60px]" : "w-64"
      )}
    >
      <nav className="flex h-full w-full flex-col">
        <NavHeader isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        
        {/* Ana navigasyon alanı */}
        <div className="flex-1 overflow-auto px-2 py-2">
          {navItems.map((item) => {
            if (isCategory(item)) {
              const isExpanded = expandedCategories.includes(item.category);
              const Icon = item.icon;
              return (
                <div key={item.category} className="mb-1">
                  <button
                    onClick={() => toggleCategory(item.category, item.path)}
                    className={cn(
                      "flex items-center w-full h-10 px-3 rounded-lg transition-all duration-200",
                      !isCollapsed && "justify-between",
                      isActive(item.path) 
                        ? "bg-primary/15 text-primary font-semibold shadow-sm" 
                        : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                    )}
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="ml-3 text-sm font-medium">{item.category}</span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <div className="transition-transform duration-200">
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </div>
                    )}
                  </button>
                  {isExpanded && !isCollapsed && (
                    <div className="ml-2 mt-1 space-y-0.5 border-l border-gray-700/50 pl-2">
                      {item.items.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          icon={subItem.icon}
                          label={subItem.label}
                          isActive={isActive(subItem.path)}
                          isCollapsed={isCollapsed}
                          isCrmButton={false}
                          isSubItem={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={item.path} className="mb-1">
                <NavLink
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive(item.path)}
                  isCollapsed={isCollapsed}
                  isCrmButton={false}
                />
              </div>
            );
          })}
        </div>

        <Separator className="bg-white/5" />
        
        {/* Ayarlar bölümü */}
        <div className="p-3">
          <NavLink
            to={settingsItem.path}
            icon={settingsItem.icon}
            label={settingsItem.label}
            isActive={isActive(settingsItem.path)}
            isCollapsed={isCollapsed}
            isCrmButton={false}
          />
        </div>
      </nav>

      {/* Kullanıcı menüsü */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-sm font-medium text-gray-300">Hesap</span>
          )}
          <UserMenu />
        </div>
      </div>
    </aside>
  );
};

export default Navbar;
