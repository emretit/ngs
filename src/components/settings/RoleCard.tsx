import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Shield, Users, Check } from "lucide-react";
import { useState } from "react";

interface RoleCardProps {
  role: {
    name: string;
    description: string;
    permissions: Record<string, any>;
    userCount?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  isSystem?: boolean;
}

export const RoleCard = ({ role, onEdit, onDelete, isSystem = false }: RoleCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const enabledModules = Object.entries(role.permissions || {})
    .filter(([_, perms]: [string, any]) => perms?.access === true);

  const totalModules = Object.keys(role.permissions || {}).length;
  const moduleAccessCount = enabledModules.length;

  const getRoleColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('admin') || lowerName.includes('yönetici') || lowerName.includes('sistem')) 
      return 'text-red-600 bg-red-50 border-red-200';
    if (lowerName.includes('manager') || lowerName.includes('müdür') || lowerName.includes('satış')) 
      return 'text-blue-600 bg-blue-50 border-blue-200';
    if (lowerName.includes('muhasebe') || lowerName.includes('finans')) 
      return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const colorClass = getRoleColor(role.name);

  return (
    <Card className={`p-5 hover:shadow-lg transition-all border-2 ${colorClass}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{role.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{role.description}</p>
          </div>
        </div>
        {!isSystem && (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{role.userCount || 0}</span>
          <span className="text-muted-foreground">kullanıcı</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{moduleAccessCount}/{totalModules}</span>
          <span className="text-muted-foreground">modül</span>
        </div>
      </div>

      {enabledModules.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Erişilebilir Modüller</p>
            {enabledModules.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Daha az' : `+${enabledModules.length - 3} daha`}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {(showDetails ? enabledModules : enabledModules.slice(0, 3)).map(([module, perms]: [string, any]) => {
              const activePerms = Object.entries(perms)
                .filter(([key, value]) => key !== 'access' && value === true)
                .map(([key]) => key[0].toUpperCase());

              return (
                <Badge 
                  key={module} 
                  variant="secondary" 
                  className="text-xs flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  {module}
                  {activePerms.length > 0 && (
                    <span className="text-[10px] opacity-70">({activePerms.join('')})</span>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default RoleCard;
