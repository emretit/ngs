
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavHeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const NavHeader = ({ isCollapsed, setIsCollapsed }: NavHeaderProps) => {
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

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="h-9 w-9 text-gray-300 hover:bg-gray-800 hover:text-white"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default NavHeader;
