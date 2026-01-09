import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import type { AccountListHeaderProps } from "./types";
import { getAccountTheme } from "./theme.config";

/**
 * Account List Header Badge Component
 * Displays a single total badge with icon, label, and value
 */
interface HeaderBadge {
  key: string;
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'success' | 'info';
  showBalanceToggle?: boolean;
}

const HeaderBadgeComponent = ({
  badge,
  showBalances,
  theme
}: {
  badge: HeaderBadge;
  showBalances: boolean;
  theme: ReturnType<typeof getAccountTheme>;
}) => {
  const Icon = badge.icon;

  // Build border class for primary variant
  const primaryBorderClass = theme.primaryColor === 'purple' ? 'border-purple-600' :
                             theme.primaryColor === 'green' ? 'border-green-600' :
                             theme.primaryColor === 'orange' ? 'border-orange-600' :
                             theme.primaryColor === 'blue' ? 'border-blue-600' : 'border-gray-600';

  // Variant styles
  const variantStyles = {
    primary: `bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} text-white ${primaryBorderClass}`,
    secondary: `${theme.bgLight} ${theme.textDark} ${theme.borderLight}`,
    success: 'bg-green-100 text-green-800 border-green-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const isPrimary = badge.variant === 'primary';
  const shouldHide = badge.showBalanceToggle && !showBalances;

  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-md text-xs border transition-all duration-200 hover:shadow-sm",
      isPrimary ? "px-3 py-1.5 font-bold shadow-sm" : "px-2 py-1 font-medium",
      variantStyles[badge.variant]
    )}>
      <Icon className="h-3 w-3" />
      <span className={isPrimary ? "font-bold" : "font-medium"}>{badge.label}</span>
      <span className={cn(
        "px-2 py-0.5 rounded-full text-xs font-bold",
        isPrimary ? "bg-white/20" : "bg-white/50"
      )}>
        {shouldHide ? "••••••" : badge.value}
      </span>
    </div>
  );
};

/**
 * Account List Header Base Component
 * Displays currency totals and "Add New" button
 */
export function AccountListHeaderBase({
  accountType,
  badges,
  showBalances,
  onAddNew,
  addButtonLabel = "Yeni",
}: AccountListHeaderProps & { badges: HeaderBadge[] }) {
  const theme = getAccountTheme(accountType);
  const Icon = theme.icon;

  return (
    <div className="flex flex-wrap gap-2 items-center justify-between">
      {/* Left: Total badges */}
      <div className="flex flex-wrap gap-2 items-center">
        {badges.map((badge) => (
          <HeaderBadgeComponent
            key={badge.key}
            badge={badge}
            showBalances={showBalances}
            theme={theme}
          />
        ))}
      </div>

      {/* Right: Add New button */}
      <Button
        size="sm"
        className={cn(
          `bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo}`,
          `${theme.hoverFrom} ${theme.hoverTo}`,
          "text-white text-xs px-3 py-1.5 h-auto shadow-sm"
        )}
        onClick={onAddNew}
      >
        <Plus className="h-3 w-3 mr-1" />
        {addButtonLabel}
      </Button>
    </div>
  );
}
