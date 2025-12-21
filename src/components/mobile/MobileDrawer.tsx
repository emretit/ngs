import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems, settingsItem } from "@/components/navbar/nav-config";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import UserMenu from "@/components/UserMenu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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

const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string, path?: string) => {
    const newExpandedCategories = expandedCategories.includes(category) 
      ? expandedCategories.filter(c => c !== category)
      : [...expandedCategories, category];
    
    setExpandedCategories(newExpandedCategories);
    
    if (path) {
      navigate(path);
      onClose();
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-gray-900 text-white">
        <SheetHeader className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white text-lg font-semibold">
              PAFTA
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {/* Ana navigasyon alanı */}
          <div className="flex-1 overflow-auto px-4 py-4">
            {navItems.map((item) => {
              if (isCategory(item)) {
                const isExpanded = expandedCategories.includes(item.category);
                const Icon = item.icon;
                return (
                  <div key={item.category} className="mb-2">
                    <button
                      onClick={() => toggleCategory(item.category, item.path)}
                      className={cn(
                        "flex items-center justify-between w-full h-12 px-3 rounded-lg transition-all duration-200",
                        isActive(item.path) 
                          ? "bg-primary/15 text-primary font-semibold" 
                          : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                      )}
                    >
                      <div className="flex items-center">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3 text-sm font-medium">{item.category}</span>
                      </div>
                      <div className="transition-transform duration-200">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-2 space-y-1 border-l border-gray-700/50 pl-3">
                        {item.items.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <button
                              key={subItem.path}
                              onClick={() => handleNavigation(subItem.path)}
                              className={cn(
                                "flex items-center w-full h-10 px-3 rounded-lg transition-all duration-200 text-left",
                                isActive(subItem.path)
                                  ? "bg-primary/15 text-primary font-medium"
                                  : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                              )}
                            >
                              <SubIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="ml-3 text-sm">{subItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              const Icon = item.icon;
              return (
                <div key={item.path} className="mb-2">
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "flex items-center w-full h-12 px-3 rounded-lg transition-all duration-200",
                      isActive(item.path)
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>

          <Separator className="bg-white/10" />
          
          {/* Ayarlar bölümü */}
          <div className="p-4">
            <button
              onClick={() => handleNavigation(settingsItem.path)}
              className={cn(
                "flex items-center w-full h-12 px-3 rounded-lg transition-all duration-200",
                isActive(settingsItem.path)
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
              )}
            >
              <settingsItem.icon className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3 text-sm font-medium">{settingsItem.label}</span>
            </button>
          </div>

          {/* Kullanıcı menüsü */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Hesap</span>
              <UserMenu />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileDrawer;
