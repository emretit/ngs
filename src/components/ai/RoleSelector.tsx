import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AIRole, getAIRoleConfig, getAllAIRoles } from '@/services/aiPersonalityService';

interface RoleSelectorProps {
  currentRole: AIRole;
  onRoleChange: (role: AIRole) => void;
  className?: string;
}

export function RoleSelector({ currentRole, onRoleChange, className }: RoleSelectorProps) {
  const currentRoleConfig = getAIRoleConfig(currentRole);
  const allRoles = getAllAIRoles();
  const CurrentIcon = currentRoleConfig.icon;

  // Color mapping for role badges
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
    gray: 'bg-gray-500 hover:bg-gray-600',
  };

  const badgeColorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 h-8 px-3", className)}
        >
          <div className={cn("p-1 rounded", colorClasses[currentRoleConfig.color])}>
            <CurrentIcon className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-medium">{currentRoleConfig.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-semibold">
          AI Rolü Seç
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {allRoles.map((role) => {
          const RoleIcon = role.icon;
          const isSelected = role.id === currentRole;

          return (
            <DropdownMenuItem
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className="gap-2 cursor-pointer"
            >
              <div className={cn("p-1.5 rounded", colorClasses[role.color])}>
                <RoleIcon className="h-3.5 w-3.5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{role.name}</span>
                  {isSelected && (
                    <Check className="h-3 w-3 text-green-600" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {role.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Role badge component for compact display
 */
interface RoleBadgeProps {
  role: AIRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const roleConfig = getAIRoleConfig(role);
  const RoleIcon = roleConfig.icon;

  const badgeColorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 h-5 px-2", badgeColorClasses[roleConfig.color], className)}
    >
      <RoleIcon className="h-3 w-3" />
      <span className="text-[10px] font-medium">{roleConfig.name}</span>
    </Badge>
  );
}
