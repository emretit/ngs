
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

const NavHeader = ({ isCollapsed, setIsCollapsed, onCloseMobile, isMobile = false }: NavHeaderProps) => {
  return (
    <div className={cn(
      "flex h-20 items-center px-6 transition-all duration-300",
      isCollapsed ? "justify-center" : "justify-between",
      // Mobile: light border, Desktop: dark border
      isMobile 
        ? "border-b border-gray-200/30 lg:border-white/10" 
        : "border-b border-white/10"
    )}>
      <div className="flex items-center">
        <div className="relative">
          <img 
            src="/logo.svg" 
            alt="PAFTA Logo" 
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "h-10 w-auto" : "h-12 w-auto"
            )}
          />
          {/* Glow effect for mobile */}
          {isMobile && (
            <div className="absolute -inset-1 bg-red-100/50 rounded-full blur opacity-50 lg:hidden" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile close button */}
        {onCloseMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className={cn(
              "lg:hidden h-10 w-10 rounded-xl transition-all duration-200 group",
              isMobile 
                ? "text-gray-400 hover:text-red-700 hover:bg-red-50" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}
          >
            <X className="h-5 w-5 transition-transform group-hover:scale-110" />
          </Button>
        )}

        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex h-9 w-9 text-gray-300 hover:bg-gray-800 hover:text-white"
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
