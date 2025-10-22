import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface UnifiedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  headerColor?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  showCloseButton?: boolean;
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl"
};

const headerColorClasses = {
  blue: "from-blue-50 to-indigo-50",
  green: "from-green-50 to-emerald-50", 
  red: "from-red-50 to-rose-50",
  yellow: "from-yellow-50 to-amber-50",
  purple: "from-purple-50 to-violet-50",
  gray: "from-gray-50 to-slate-50"
};

const dotColorClasses = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500", 
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  gray: "bg-gray-500"
};

export const UnifiedDialog: React.FC<UnifiedDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  headerColor = "blue",
  showCloseButton = true,
  className
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-white rounded-xl shadow-2xl w-full mx-auto max-h-[95vh] overflow-hidden",
        maxWidthClasses[maxWidth],
        className
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b bg-gradient-to-r",
          headerColorClasses[headerColor]
        )}>
          <div className="flex items-center space-x-2">
            <div className={cn("w-2 h-2 rounded-full", dotColorClasses[headerColor])}></div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Dialog Footer Component
interface UnifiedDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const UnifiedDialogFooter: React.FC<UnifiedDialogFooterProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn("flex justify-end space-x-2 pt-4 border-t", className)}>
      {children}
    </div>
  );
};

// Dialog Action Button Component
interface UnifiedDialogActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "destructive";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const UnifiedDialogActionButton: React.FC<UnifiedDialogActionButtonProps> = ({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  className
}) => {
  const baseClasses = "px-6 py-2 text-sm font-medium rounded-lg transition-colors";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300",
    destructive: "bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>İşleniyor...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Dialog Cancel Button Component
interface UnifiedDialogCancelButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const UnifiedDialogCancelButton: React.FC<UnifiedDialogCancelButtonProps> = ({
  onClick,
  children = "İptal",
  disabled = false,
  className
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400",
        className
      )}
    >
      {children}
    </button>
  );
};

// Unified Date Picker Component
interface UnifiedDatePickerProps {
  label: string;
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean | ((date: Date) => boolean);
  className?: string;
}

export const UnifiedDatePicker: React.FC<UnifiedDatePickerProps> = ({
  label,
  date,
  onSelect,
  placeholder = "Tarih seçin",
  required = false,
  disabled = false,
  className
}) => {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <EnhancedDatePicker
        date={date}
        onSelect={onSelect}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
};

export default UnifiedDialog;
