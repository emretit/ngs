
import React from 'react';
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string | React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral" | "custom";
  customColors?: {
    bg: string;
    text: string;
  };
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = "default",
  customColors,
  size = "md",
}: StatusBadgeProps) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const variantClasses = {
    default: "bg-primary/20 text-primary",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    custom: customColors ? `${customColors.bg} ${customColors.text}` : "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses[size],
        variantClasses[variant]
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
