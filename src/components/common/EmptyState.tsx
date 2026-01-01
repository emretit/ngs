import React from "react";
import { LucideIcon, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode | LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}) => {
  const sizeStyles = {
    sm: {
      container: "py-6",
      iconContainer: "w-10 h-10",
      iconSize: "w-5 h-5",
      title: "text-sm font-medium",
      description: "text-xs",
    },
    md: {
      container: "py-12",
      iconContainer: "w-14 h-14",
      iconSize: "w-7 h-7",
      title: "text-base font-semibold",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      iconContainer: "w-20 h-20",
      iconSize: "w-10 h-10",
      title: "text-lg font-bold",
      description: "text-base",
    },
  };

  const styles = sizeStyles[size];

  // Render icon - handle both ReactNode and LucideIcon
  const renderIcon = () => {
    if (!icon) {
      return <PackageOpen className={cn(styles.iconSize, "text-muted-foreground")} />;
    }

    // If it's a React element (JSX), render directly
    if (React.isValidElement(icon)) {
      return icon;
    }

    // If it's a component (like LucideIcon), render it
    const IconComponent = icon as LucideIcon;
    return <IconComponent className={cn(styles.iconSize, "text-muted-foreground")} />;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted/50 flex items-center justify-center mb-4",
          styles.iconContainer
        )}
      >
        {renderIcon()}
      </div>
      <h3 className={cn("text-foreground mb-1", styles.title)}>{title}</h3>
      {description && (
        <p className={cn("text-muted-foreground max-w-md", styles.description)}>
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          className="mt-4"
        >
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
