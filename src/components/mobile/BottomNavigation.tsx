import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  TrendingUp, 
  User, 
  Package, 
  Settings,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  onMenuClick: () => void;
}

const mainTabs = [
  {
    path: "/dashboard",
    icon: Home,
    label: "Ana Sayfa",
  },
  {
    path: "/crm",
    icon: TrendingUp,
    label: "Satış",
  },
  {
    path: "/contacts",
    icon: User,
    label: "Müşteriler",
  },
  {
    path: "/products",
    icon: Package,
    label: "Ürünler",
  },
];

const BottomNavigation = ({ onMenuClick }: BottomNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <Button
              key={tab.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center h-12 w-12 p-1 rounded-lg transition-colors",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium leading-none">
                {tab.label}
              </span>
            </Button>
          );
        })}
        
        {/* Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center h-12 w-12 p-1 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium leading-none">
            Menü
          </span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;
