import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface NavHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

const NavHeader = ({ isCollapsed, setIsCollapsed, onCloseMobile, isMobile = false }: NavHeaderProps) => {
  return (
    <div className={cn(
      "flex items-center px-6 transition-all duration-300",
      isCollapsed ? "justify-center h-20" : "justify-between",
      // Mobile: different height and styling
      isMobile 
        ? "h-auto py-6 mb-2 pb-6 border-b border-gray-200/30 lg:h-20 lg:py-0 lg:mb-0 lg:pb-0 lg:border-white/10" 
        : "h-20 border-b border-white/10"
    )}>
      {/* Logo section */}
      <Link to="/dashboard" className="flex items-center gap-3 group">
        <div className="relative">
          <img 
            src="/logo.svg" 
            alt="PAFTA Logo" 
            className={cn(
              "transition-all duration-300 group-hover:scale-105",
              isCollapsed ? "h-10 w-auto" : "h-10 w-auto"
            )}
          />
          {/* Glow effect for mobile */}
          {isMobile && (
            <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 lg:hidden" />
          )}
        </div>
        {/* Beta badge - only show on mobile when not collapsed */}
        {isMobile && !isCollapsed && (
          <div className="flex items-center px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 lg:hidden">
            <span className="text-[10px] font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">Beta</span>
          </div>
        )}
      </Link>

      <div className="flex items-center gap-2">
        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className={cn(
              "lg:hidden p-3 rounded-xl transition-all duration-200 group",
              isMobile 
                ? "text-gray-400 hover:text-red-700 hover:bg-red-50" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}
          >
            <X className="h-6 w-6 transition-transform group-hover:scale-110" />
          </button>
        )}

        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex h-9 w-9 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default NavHeader;