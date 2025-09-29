import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Package, Users, Calendar, Activity } from 'lucide-react';
import * as icons from 'lucide-react';
import { Module } from '@/lib/useModuleData';
import { useNavigate } from 'react-router-dom';

interface RightDrawerProps {
  module: Module | null;
  open: boolean;
  onClose: () => void;
  breadcrumbs: Module[];
  childModules?: Module[];
}

export const RightDrawer: React.FC<RightDrawerProps> = ({
  module,
  open,
  onClose,
  breadcrumbs,
  childModules = []
}) => {
  const navigate = useNavigate();

  if (!module) return null;

  const Icon = module.icon && (icons as any)[module.icon] ? (icons as any)[module.icon] : Package;

  const handleNavigate = () => {
    if (module.href) {
      navigate(module.href);
      onClose();
    }
  };

  const getStatusColor = () => {
    if (!module.is_active) return 'bg-muted text-muted-foreground';
    if (module.kind === 'root') return 'bg-primary text-primary-foreground';
    if (module.kind === 'group') return 'bg-secondary text-secondary-foreground';
    return 'bg-success text-success-foreground';
  };

  const getStatusText = () => {
    if (!module.is_active) return 'Geliştirilecek';
    if (module.kind === 'root') return 'Ana Sistem';
    if (module.kind === 'group') return 'Ana Modül';
    return 'Aktif Modül';
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                {index > 0 && <span>/</span>}
                <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <SheetTitle className="text-xl">{module.name}</SheetTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor()}>
                  {getStatusText()}
                </Badge>
                {module.code && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {module.code}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {module.description && (
            <SheetDescription className="text-base">
              {module.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>KPI Sayısı</span>
              </div>
              <p className="text-2xl font-bold">{module.kpi_count}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Alt Modüller</span>
              </div>
              <p className="text-2xl font-bold">{childModules.length}</p>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          {module.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <span>Etiketler</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {module.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Child Modules */}
          {childModules.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Alt Modüller
              </h4>
              <div className="space-y-2">
                {childModules.map(child => {
                  const ChildIcon = child.icon && (icons as any)[child.icon] ? (icons as any)[child.icon] : Package;
                  return (
                    <div key={child.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <ChildIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{child.name}</p>
                        {child.code && (
                          <p className="text-xs text-muted-foreground font-mono">{child.code}</p>
                        )}
                      </div>
                      <Badge 
                        variant={child.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {child.is_active ? 'Aktif' : 'Geliştirilecek'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TODO: Add more sections like Recent Activity, Related Items, etc. */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Son Aktiviteler
            </h4>
            <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
              <p>Aktivite verisi henüz mevcut değil.</p>
              <p className="text-xs mt-1">// TODO: Implement activity tracking</p>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            {module.href && (
              <Button onClick={handleNavigate} className="w-full" size="lg">
                <ExternalLink className="h-4 w-4 mr-2" />
                Modüle Git
              </Button>
            )}
            
            {!module.href && module.is_active && (
              <Button variant="outline" className="w-full" size="lg" disabled>
                <Package className="h-4 w-4 mr-2" />
                Sayfa Henüz Hazır Değil
              </Button>
            )}

            {!module.is_active && (
              <Button variant="secondary" className="w-full" size="lg" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                Geliştirilecek
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};