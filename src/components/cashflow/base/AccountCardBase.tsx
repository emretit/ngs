import { Edit, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { AccountCardBaseProps, BaseAccount, CardStatBadge, CardField } from "./types";
import { getAccountTheme } from "./theme.config";

/**
 * Account Card Base Component
 * Generic card component for account lists
 * Displays account info with title, subtitle, stats, and action buttons
 */
export function AccountCardBase<TAccount extends BaseAccount>({
  account,
  accountType,
  showBalances,
  title,
  subtitle,
  statBadges,
  fields,
  onClick,
  onEdit,
  onDelete,
}: AccountCardBaseProps<TAccount>) {
  const theme = getAccountTheme(accountType);
  const Icon = theme.icon;

  // Build className strings from theme
  const cardBgClass = theme.bgLight; // e.g., "bg-purple-50"
  const cardBorderClass = theme.borderLight; // e.g., "border-purple-100"
  const iconBgClass = theme.primaryColor === 'purple' ? 'bg-purple-500' :
                       theme.primaryColor === 'green' ? 'bg-green-500' :
                       theme.primaryColor === 'orange' ? 'bg-orange-500' :
                       theme.primaryColor === 'blue' ? 'bg-blue-500' : 'bg-gray-500';
  const hoverBgClass = theme.primaryColor === 'purple' ? 'hover:bg-purple-100' :
                       theme.primaryColor === 'green' ? 'hover:bg-green-100' :
                       theme.primaryColor === 'orange' ? 'hover:bg-orange-100' :
                       theme.primaryColor === 'blue' ? 'hover:bg-blue-100' : 'hover:bg-gray-100';

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded-lg border transition-colors duration-200 cursor-pointer group",
        cardBgClass,
        cardBorderClass,
        hoverBgClass
      )}
      onClick={onClick}
    >
      {/* Left Section: Icon + Title + Fields */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Icon */}
        <div className={cn(
          "p-1.5 rounded-lg text-white flex-shrink-0",
          iconBgClass
        )}>
          <Icon className="h-3 w-3" />
        </div>

        {/* Title + Fields */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="font-medium text-xs text-gray-900 truncate">
            {title}
          </div>

          {/* Subtitle / Fields */}
          {subtitle && (
            <div className="text-xs text-gray-600 truncate">
              {subtitle}
            </div>
          )}

          {/* Additional fields (if provided) */}
          {fields.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              {fields.map((field) => {
                if (field.type === 'badge') {
                  return (
                    <Badge
                      key={field.key}
                      className={cn(
                        "text-xs h-4 px-1",
                        field.badgeVariant || "bg-gray-100 text-gray-800"
                      )}
                    >
                      {field.value}
                    </Badge>
                  );
                }
                if (field.type === 'custom') {
                  return <div key={field.key}>{field.value}</div>;
                }
                return (
                  <span key={field.key} className="text-xs text-gray-500">
                    {field.label}: <span className="font-medium">{field.value}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Stat Badges + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Stat Badges */}
        {statBadges.length > 0 && (
          <div className="text-right">
            {statBadges.map((badge, index) => {
              const shouldHide = badge.showBalanceToggle && !showBalances;
              const displayValue = shouldHide ? "••••••" : (
                badge.isCurrency && typeof badge.value === 'number'
                  ? formatCurrency(badge.value, account.currency)
                  : badge.value
              );

              return (
                <div key={badge.key} className={cn(
                  index === 0 ? "font-mono font-bold text-xs text-gray-900" : "text-xs text-gray-500"
                )}>
                  {badge.label && index > 0 ? `${badge.label}: ` : ''}
                  {displayValue}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              theme.primaryColor === 'purple' ? 'hover:bg-purple-200' :
              theme.primaryColor === 'green' ? 'hover:bg-green-200' :
              theme.primaryColor === 'orange' ? 'hover:bg-orange-200' :
              theme.primaryColor === 'blue' ? 'hover:bg-blue-200' : 'hover:bg-gray-200'
            )}
            onClick={onEdit}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
    </div>
  );
}
