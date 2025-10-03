import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  isSubItem?: boolean;
}

const NavLink = ({ 
  to, 
  icon: Icon, 
  label, 
  isActive, 
  isCollapsed,
  isSubItem = false 
}: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center transition-all duration-200 rounded-lg group",
        isCollapsed ? "justify-center px-2 h-8" : "px-2 space-x-2",
        isSubItem ? "h-6 text-xs" : "h-8",
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
        <span className="text-xs font-medium">
          {label}
        </span>
      )}
    </Link>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(NavLink);
