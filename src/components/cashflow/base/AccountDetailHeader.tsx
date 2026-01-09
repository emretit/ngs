import { ArrowLeft, Pencil, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { AccountDetailHeaderProps, BaseAccount, StatBadge } from "./types";
import { getAccountTheme } from "./theme.config";

/**
 * Stat Badge Component
 * Displays a single statistic badge with icon, label, and value
 */
const StatBadgeComponent = ({
  badge,
  showBalances,
  currency,
}: {
  badge: StatBadge;
  showBalances: boolean;
  currency: string;
}) => {
  const Icon = badge.icon;

  // Determine gradient classes based on variant
  const variantClasses: Record<string, string> = {
    primary: 'from-blue-600 to-blue-700',
    secondary: 'from-purple-600 to-purple-700',
    success: 'from-green-600 to-green-700',
    warning: 'from-orange-600 to-orange-700',
    danger: 'from-red-600 to-red-700',
  };

  const gradientClass = variantClasses[badge.variant] || variantClasses.primary;

  // Format value
  const displayValue = () => {
    if (badge.showBalanceToggle && !showBalances) {
      return "••••••";
    }

    if (badge.isCurrency && typeof badge.value === 'number') {
      return formatCurrency(badge.value, currency);
    }

    return badge.value;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white shadow-lg transition-all duration-200 hover:shadow-xl",
        `bg-gradient-to-r ${gradientClass}`
      )}
    >
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-medium opacity-90">{badge.label}</span>
      </div>
      <span className="text-xs font-bold">{displayValue()}</span>
    </div>
  );
};

/**
 * Account Detail Header Component
 * Sticky header with breadcrumb, title, stat badges, and action buttons
 *
 * Reference: CreditCardDetail.tsx lines 272-359
 */
export function AccountDetailHeader<TAccount extends BaseAccount>({
  account,
  accountType,
  title,
  subtitle,
  statBadges,
  showBalances,
  onToggleBalances,
  onEdit,
  onBack,
}: AccountDetailHeaderProps<TAccount>) {
  const navigate = useNavigate();
  const theme = getAccountTheme(accountType);
  const Icon = theme.icon;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1); // Go back in browser history
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-white rounded-lg border border-gray-200 shadow-sm mb-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
        {/* Left Section: Breadcrumb + Icon + Title */}
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className={cn(
              "gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-sm",
              `hover:${theme.bgLight} hover:${theme.textDark} hover:${theme.borderLight}`
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium hidden sm:inline">Geri</span>
          </Button>

          {/* Account Icon */}
          <div
            className={cn(
              "p-2 rounded-lg text-white shadow-lg",
              `bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo}`
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          </div>
        </div>

        {/* Center Section: Stat Badges */}
        <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
          {statBadges.map((badge) => (
            <StatBadgeComponent
              key={badge.key}
              badge={badge}
              showBalances={showBalances}
              currency={account.currency}
            />
          ))}
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Toggle Balance Button */}
          <Button
            variant="outline"
            onClick={onToggleBalances}
            className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
          >
            {showBalances ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="font-medium hidden sm:inline">Gizle</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="font-medium hidden sm:inline">Göster</span>
              </>
            )}
          </Button>

          {/* Edit Button */}
          <Button
            onClick={onEdit}
            className={cn(
              "gap-2 px-6 py-2 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold",
              `bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo}`,
              `${theme.hoverFrom} ${theme.hoverTo}`
            )}
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Düzenle</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
