import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { prefetchRoute } from "@/utils/routePrefetch";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  isSubItem?: boolean;
  isPending?: boolean;
  isMobile?: boolean;
}

const NavLink = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive, 
  isCollapsed,
  isSubItem = false,
  isPending = false,
  isMobile = false
}: NavLinkProps) => {
  // Prefetch route on hover
  const handleMouseEnter = useCallback(() => {
    prefetchRoute(to);
  }, [to]);

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "flex items-center transition-all duration-200 rounded-xl group relative",
        isCollapsed ? "justify-center px-2 h-8" : "px-3 space-x-3",
        isSubItem ? "h-7 text-xs" : "h-10",
        // Active/Pending states - different styles for mobile vs desktop
        (isActive || isPending) && (
          isMobile 
            ? isSubItem 
              ? "bg-red-50/80 text-red-700 font-medium border-l-2 border-red-500 lg:bg-primary/20 lg:text-primary lg:border-primary" 
              : "bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 font-semibold lg:bg-primary/15 lg:text-primary"
            : isSubItem 
              ? "bg-primary/20 text-primary font-medium border-l-2 border-primary" 
              : "bg-primary/15 text-primary font-semibold shadow-sm"
        ),
        // Hover states - different styles for mobile vs desktop
        !(isActive || isPending) && (
          isMobile
            ? isSubItem
              ? "text-gray-500 hover:text-red-700 hover:bg-red-50/50 lg:text-gray-400 lg:hover:text-white lg:hover:bg-gray-800/50"
              : "text-gray-700 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 lg:text-gray-300 lg:hover:bg-gray-800/70 lg:hover:text-white"
            : isSubItem
              ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
              : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
        )
      )}
    >
      {/* Active indicator dot for mobile */}
      {isMobile && (isActive || isPending) && !isSubItem && (
        <div className="absolute left-0 w-1 h-6 bg-red-500 rounded-r-full lg:hidden" />
      )}
      <Icon className={cn(
        "flex-shrink-0 transition-colors",
        isSubItem ? "h-3.5 w-3.5" : "h-4 w-4"
      )} />
      {!isCollapsed && (
        <span className={cn(
          "font-medium",
          isSubItem ? "text-xs" : "text-sm"
        )}>
          {label}
        </span>
      )}
    </Link>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(NavLink);
