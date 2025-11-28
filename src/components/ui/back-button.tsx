import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  onClick?: () => void;
  fallbackPath?: string;
  children?: React.ReactNode;
  variant?: "default" | "ghost" | "outline" | "minimal";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

const BackButton = ({ 
  onClick, 
  fallbackPath,
  children = "Geri", 
  variant = "default",
  size = "md",
  className,
  showIcon = true
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log("🔵 [BackButton] handleClick called", {
      hasOnClick: !!onClick,
      fallbackPath,
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString()
    });

    try {
      if (onClick) {
        console.log("🔵 [BackButton] Calling onClick prop");
        onClick();
        console.log("✅ [BackButton] onClick completed");
      } else if (fallbackPath) {
        console.log("🔵 [BackButton] Navigating to fallbackPath:", fallbackPath);
        navigate(fallbackPath);
        console.log("✅ [BackButton] navigate(fallbackPath) called");
      } else {
        console.log("🔵 [BackButton] Navigating back in history");
        navigate(-1);
        console.log("✅ [BackButton] navigate(-1) called");
      }
    } catch (error) {
      console.error("❌ [BackButton] Error in handleClick:", error);
      console.error("❌ [BackButton] Error stack:", error instanceof Error ? error.stack : 'No stack');
    }
  };
  const baseClasses = "group transition-all duration-200 font-medium";
  
  const variantClasses = {
    default: "gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:shadow-sm border border-transparent hover:border-border/50",
    ghost: "gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 hover:shadow-sm",
    outline: "gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted/30 hover:shadow-sm",
    minimal: "gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted/40 text-sm"
  };
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <ArrowLeft className={cn(
          "transition-transform duration-200 group-hover:-translate-x-0.5",
          size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"
        )} />
      )}
      <span>{children}</span>
    </Button>
  );
};

export default BackButton;
