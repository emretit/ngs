import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Edit, Trash2, Users } from "lucide-react";

interface RoleCardProps {
  role: {
    name: string;
    description: string;
    permissions: string[];
    userCount?: number;
  };
}

export const RoleCard = ({ role }: RoleCardProps) => {
  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'manager':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'sales':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'viewer':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-purple-600 bg-purple-50 border-purple-200';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return '👑';
      case 'manager':
        return '👨‍💼';
      case 'sales':
        return '💼';
      case 'viewer':
        return '👁️';
      default:
        return '🔐';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${getRoleColor(role.name)}`}>
              <span className="text-2xl">{getRoleIcon(role.name)}</span>
            </div>
            <div>
              <CardTitle className="text-lg capitalize">{role.name}</CardTitle>
              <CardDescription className="text-xs">{role.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Kullanıcı sayısı */}
        {role.userCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
            <Users className="h-4 w-4" />
            <span>{role.userCount} kullanıcı</span>
          </div>
        )}

        {/* İzinler */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="h-3 w-3" />
            İzinler
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {role.permissions.map((permission, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleCard;
