import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AccountDetailSidebarProps, BaseAccount, SidebarField, QuickAction } from "./types";
import { getAccountTheme } from "./theme.config";
import { quickActionVariantClasses } from "./theme.config";

/**
 * Sidebar Field Component
 * Renders a single info field with label and value
 */
const SidebarFieldComponent = ({ field }: { field: SidebarField }) => {
  return (
    <div>
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        {field.label}
      </label>
      {field.type === 'badge' && typeof field.value === 'string' ? (
        <div className="mt-0.5">
          <Badge className={cn("text-[10px] h-4 px-1.5", field.badgeVariant)}>
            {field.value}
          </Badge>
        </div>
      ) : field.type === 'custom' ? (
        <div className="mt-0.5">{field.value}</div>
      ) : (
        <p className="text-xs font-semibold truncate mt-0.5 text-foreground">
          {field.value}
        </p>
      )}
    </div>
  );
};

/**
 * Quick Action Button Component
 * Renders a single quick action button
 */
const QuickActionButton = ({ action }: { action: QuickAction }) => {
  const Icon = action.icon;
  const buttonClass = action.className || quickActionVariantClasses[action.variant];

  return (
    <Button
      onClick={action.onClick}
      className={cn(
        "w-full justify-start gap-2 px-3 py-2 h-auto rounded-lg text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium text-xs",
        buttonClass
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{action.label}</span>
    </Button>
  );
};

/**
 * Account Detail Sidebar Component
 * Displays account information and quick action buttons
 *
 * Reference: CreditCardDetail.tsx lines 388-459
 */
export function AccountDetailSidebar<TAccount extends BaseAccount>({
  account,
  accountType,
  fields,
  quickActions,
  onEdit,
}: AccountDetailSidebarProps<TAccount>) {
  const theme = getAccountTheme(accountType);
  const Icon = theme.icon;

  return (
    <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl">
      <CardContent className="px-3 py-3 space-y-3">
        {/* Account Info Section Header */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <div
            className={cn(
              "p-1.5 rounded-md text-white",
              `bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo}`
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Hesap Bilgileri</h3>
        </div>

        {/* Account Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          {fields.map((field) => (
            <SidebarFieldComponent key={field.key} field={field} />
          ))}
        </div>

        {/* Quick Actions Section */}
        {quickActions.length > 0 && (
          <div className="border-t pt-2 space-y-2">
            <h4 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              Hızlı İşlemler
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              {quickActions.map((action) => (
                <QuickActionButton key={action.key} action={action} />
              ))}
            </div>
          </div>
        )}

        {/* Optional Edit Button */}
        {onEdit && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              onClick={onEdit}
              className="w-full text-xs hover:bg-gray-50"
            >
              Hesabı Düzenle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
