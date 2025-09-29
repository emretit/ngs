import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as icons from 'lucide-react';
import { Module } from '@/lib/useModuleData';

interface ModuleNodeData extends Module {
  depth: number;
}

export const ModuleNode: React.FC<NodeProps<ModuleNodeData>> = ({ data, selected }) => {
  const Icon = data.icon && (icons as any)[data.icon] ? (icons as any)[data.icon] : icons.Package;

  const getNodeStyles = () => {
    const baseStyles = "relative px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer min-w-[160px] max-w-[200px]";
    
    if (data.kind === 'root') {
      return `${baseStyles} bg-gradient-to-br from-primary/20 via-primary/30 to-primary/40 border-primary shadow-xl text-primary-foreground font-bold`;
    }
    
    if (data.kind === 'group') {
      return `${baseStyles} bg-gradient-to-br from-muted via-muted/90 to-muted/80 border-muted-foreground/30 shadow-lg hover:shadow-xl`;
    }
    
    // Leaf nodes
    const activeStyles = data.is_active 
      ? "bg-gradient-to-br from-card via-card/95 to-card/90 border-border shadow-lg hover:shadow-xl hover:border-primary/50"
      : "bg-gradient-to-br from-muted/50 via-muted/40 to-muted/30 border-muted-foreground/20 opacity-60";
    
    return `${baseStyles} ${activeStyles}`;
  };

  const getSelectedStyles = () => {
    return selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : "";
  };

  const getTextColor = () => {
    if (data.kind === 'root') return 'text-primary-foreground';
    if (!data.is_active) return 'text-muted-foreground';
    return 'text-foreground';
  };

  const getSubtitle = () => {
    if (data.kind === 'root') return 'İş Yönetim Sistemi';
    if (data.kind === 'group') return 'Ana Modül';
    return data.is_active ? 'Aktif Modül' : 'Geliştirilecek';
  };

  const breadcrumbs = React.useMemo(() => {
    // Simple breadcrumb generation based on hierarchy
    const parts = [];
    if (data.kind !== 'root') {
      parts.push('Pafta.app');
      if (data.kind === 'leaf' && data.parent) {
        // Find parent name - simplified for now
        parts.push(data.parent.toUpperCase());
      }
      parts.push(data.name);
    } else {
      parts.push(data.name);
    }
    return parts.join(' / ');
  }, [data]);

  return (
    <TooltipProvider>
      <div className={`${getNodeStyles()} ${getSelectedStyles()}`}>
        {/* Input handle for non-root nodes */}
        {data.kind !== 'root' && (
          <Handle 
            id={`${data.id}-target`}
            type="target" 
            position={Position.Top} 
            className="!w-2 !h-2 !bg-primary !border-2 !border-background"
          />
        )}
        
        {/* Node content */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 p-1.5 rounded-lg ${data.kind === 'root' ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
            <Icon className={`h-4 w-4 ${data.kind === 'root' ? 'text-primary-foreground' : 'text-primary'}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium text-sm leading-tight ${getTextColor()}`}>
                {data.name}
              </h4>
              {data.kpi_count > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                  {data.kpi_count}
                </Badge>
              )}
            </div>
            
            <p className={`text-xs ${data.kind === 'root' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {getSubtitle()}
            </p>
            
            {data.code && (
              <p className={`text-xs mt-1 font-mono ${data.kind === 'root' ? 'text-primary-foreground/60' : 'text-muted-foreground/80'}`}>
                {data.code}
              </p>
            )}
          </div>
        </div>

        {/* Output handle for nodes that have children or can be sources */}
        {(data.kind !== 'leaf' || data.id === 'crm-customers' || data.id === 'crm-proposals' || data.id === 'hr-employees') && (
          <Handle 
            id={`${data.id}-source`}
            type="source" 
            position={Position.Bottom} 
            className="!w-2 !h-2 !bg-primary !border-2 !border-background"
          />
        )}

        {/* Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute inset-0" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <div>
                <p className="font-semibold">{data.name}</p>
                <p className="text-xs text-muted-foreground">{breadcrumbs}</p>
              </div>
              
              {data.description && (
                <p className="text-sm">{data.description}</p>
              )}
              
              {data.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">Etiketler:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};