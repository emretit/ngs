import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface UnifiedDialogProps {
  isOpen: boolean;
  onClose: ((open: boolean) => void) | (() => void);
  title: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  headerColor?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  showCloseButton?: boolean;
  className?: string;
  zIndex?: number;
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

// Custom overlay component that works with modal={false}
const UnifiedDialogOverlay = React.forwardRef<
  HTMLDivElement,
  { isOpen: boolean; onOverlayClick?: () => void; style?: React.CSSProperties }
>(({ isOpen, onOverlayClick, style }, ref) => {
  const [canClose, setCanClose] = React.useState(false);

  // Dialog açıldıktan kısa bir süre sonra kapatmaya izin ver
  // Bu, popover kapanırken oluşan click event'lerini engeller
  React.useEffect(() => {
    if (isOpen) {
      setCanClose(false);
      const timer = setTimeout(() => setCanClose(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClick = (e: React.MouseEvent) => {
    // Sadece doğrudan overlay'e tıklandığında ve canClose true ise kapat
    if (e.target === e.currentTarget && canClose && onOverlayClick) {
      onOverlayClick();
    }
  };

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
      onClick={handleClick}
      style={{ pointerEvents: 'auto', ...style }}
    />
  );
});
UnifiedDialogOverlay.displayName = "UnifiedDialogOverlay";

export const UnifiedDialog: React.FC<UnifiedDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  headerColor = "blue",
  showCloseButton = true,
  className,
  zIndex = 50
}) => {
  const handleOpenChange = (open: boolean) => {
    if (onClose.length === 0) {
      // Eski kullanım: () => void
      (onClose as () => void)();
    } else {
      // Yeni kullanım: (open: boolean) => void
      (onClose as (open: boolean) => void)(open);
  }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <UnifiedDialogOverlay
          isOpen={isOpen}
          onOverlayClick={() => handleOpenChange(false)}
          style={{ zIndex: zIndex - 10 }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-[50%] top-[50%] w-full translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden p-0 pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            maxWidthClasses[maxWidth],
            className
          )}
          style={{ zIndex }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onEscapeKeyDown={() => handleOpenChange(false)}
          onPointerDownOutside={(e) => {
            // modal={false} olduğu için dış tıklamaları tamamen engelle
            // Overlay zaten kapatma işlemini yönetiyor
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // modal={false} olduğu için dış etkileşimleri tamamen engelle
            e.preventDefault();
          }}
        >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b bg-gradient-to-r flex-shrink-0",
          headerColorClasses[headerColor]
        )}>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColorClasses[headerColor])}></div>
            <DialogPrimitive.Title className="text-lg font-semibold text-gray-900 truncate">{title}</DialogPrimitive.Title>
          </div>
          {showCloseButton && (
              <DialogPrimitive.Close
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
                <span className="sr-only">Kapat</span>
              </DialogPrimitive.Close>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
          {children}
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
    <div className={cn("flex justify-end space-x-2 pt-3 border-t flex-shrink-0 mt-auto", className)}>
      {children}
    </div>
  );
};

// Dialog Action Button Component
interface UnifiedDialogActionButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "destructive";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export const UnifiedDialogActionButton: React.FC<UnifiedDialogActionButtonProps> = ({
  onClick,
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  className,
  type = "button"
}) => {
  const baseClasses = "px-6 py-2 text-sm font-medium rounded-lg transition-colors";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300",
    destructive: "bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
  };

  return (
    <button
      type={type}
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
      <Label className="text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <EnhancedDatePicker
        date={date}
        onSelect={onSelect}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-10"
      />
    </div>
  );
};

export default UnifiedDialog;
