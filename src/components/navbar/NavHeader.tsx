
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  onCloseMobile?: () => void;
}

const NavHeader = ({ isCollapsed, setIsCollapsed, onCloseMobile }: NavHeaderProps) => {
  return (
    <div className={cn(
      "flex h-20 items-center border-b border-white/10 px-6 transition-all duration-300",
      isCollapsed ? "justify-center" : "justify-between"
    )}>
      <div className="flex items-center">
        <img 
          src="/logo.svg" 
          alt="PAFTA Logo" 
          className={isCollapsed ? "h-10 w-auto" : "h-12 w-auto"}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile close button */}
        {onCloseMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCloseMobile}
            className="lg:hidden h-9 w-9 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-4 w-4" />
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
