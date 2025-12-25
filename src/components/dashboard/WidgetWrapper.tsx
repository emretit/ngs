import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WidgetWrapperProps {
  id: string;
  title: string;
  children: ReactNode;
  isEditMode: boolean;
  onRemove?: () => void;
  onExpand?: () => void;
  isExpanded?: boolean;
  className?: string;
  headerClassName?: string;
}

export function WidgetWrapper({
  id,
  title,
  children,
  isEditMode,
  onRemove,
  onExpand,
  isExpanded = false,
  className,
  headerClassName,
}: WidgetWrapperProps) {
  return (
    <Card className={cn('h-full flex flex-col overflow-hidden', className)}>
      {/* Header with drag handle */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
          headerClassName
        )}
      >
        <div className="flex items-center gap-2 flex-1">
          {isEditMode && (
            <div className="widget-drag-handle cursor-move hover:bg-slate-200 dark:hover:bg-slate-700 p-1 rounded">
              <GripVertical className="h-4 w-4 text-slate-500" />
            </div>
          )}
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className="h-7 w-7 p-0"
            >
              {isExpanded ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          {isEditMode && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </Card>
  );
}
