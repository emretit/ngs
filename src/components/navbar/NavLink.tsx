
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  isCrmButton?: boolean;
  isSubItem?: boolean;
}

const NavLink = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive, 
  isCollapsed,
  isCrmButton = false,
  isSubItem = false 
}: NavLinkProps) => {
  const handleClick = (e: React.MouseEvent) => {
    console.log('NavLink clicked:', to);
    // Let Link handle the navigation
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        "flex items-center transition-all duration-200 rounded-lg group",
        isCollapsed ? "justify-center px-3 h-10" : "px-3 space-x-3",
        isSubItem ? "h-8 text-xs" : "h-10",
        isActive 
          ? isSubItem 
            ? "bg-primary/20 text-primary font-medium border-l-2 border-primary" 
            : "bg-primary/15 text-primary font-semibold shadow-sm"
          : isSubItem
            ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
            : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
      )}
    >
      <Icon className={cn(
        "flex-shrink-0",
        isSubItem ? "h-3 w-3" : "h-4 w-4"
      )} />
      {!isCollapsed && (
        <span className={cn(
          isSubItem ? "text-xs font-medium" : "text-sm font-medium"
        )}>
          {label}
        </span>
      )}
    </Link>
  );
};

export default NavLink;
