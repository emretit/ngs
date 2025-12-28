import React from "react";
import { useManagerChain } from "@/hooks/useManagerChain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Mail, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManagerChainViewProps {
  employeeId: string | null | undefined;
  className?: string;
}

export const ManagerChainView: React.FC<ManagerChainViewProps> = ({ 
  employeeId, 
  className 
}) => {
  const { data: managerChain = [], isLoading } = useManagerChain(employeeId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Yönetici Zinciri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  if (managerChain.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Yönetici Zinciri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Yönetici hiyerarşisi tanımlı değil
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Yönetici Zinciri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {managerChain.map((manager, index) => (
            <div
              key={manager.employee_id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border",
                index === 0 && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {manager.employee_name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Seviye {manager.level}
                  </Badge>
                  {manager.is_department_head && (
                    <Badge variant="secondary" className="text-xs">
                      Departman Şefi
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  {manager.employee_position && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      <span>{manager.employee_position}</span>
                    </div>
                  )}
                  {manager.department && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>{manager.department}</span>
                    </div>
                  )}
                  {manager.employee_email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{manager.employee_email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

