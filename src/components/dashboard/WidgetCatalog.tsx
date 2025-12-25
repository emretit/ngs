import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  Bot,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WidgetDefinition {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: typeof TrendingUp;
  category: 'financial' | 'crm' | 'hr' | 'operations' | 'ai' | 'analytics';
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
}

interface WidgetCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWidget: (widgetType: string) => void;
  availableWidgets: WidgetDefinition[];
}

const categoryColors = {
  financial: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  crm: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  hr: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  operations: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  ai: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  analytics: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

const categoryLabels = {
  financial: 'Finansal',
  crm: 'CRM & Satış',
  hr: 'İnsan Kaynakları',
  operations: 'Operasyon',
  ai: 'AI & Otomatik',
  analytics: 'Analitik',
};

export function WidgetCatalog({
  open,
  onOpenChange,
  onAddWidget,
  availableWidgets,
}: WidgetCatalogProps) {
  const groupedWidgets = availableWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetDefinition[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Widget Ekle</DialogTitle>
          <DialogDescription>
            Dashboard'unuza eklemek için bir widget seçin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedWidgets).map(([category, widgets]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </Badge>
                <span className="text-slate-400">({widgets.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {widgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => {
                      onAddWidget(widget.type);
                      onOpenChange(false);
                    }}
                    className={cn(
                      'p-4 border rounded-lg text-left transition-all',
                      'hover:border-blue-500 hover:shadow-md',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <widget.icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1 text-slate-900 dark:text-slate-100">
                          {widget.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {widget.description}
                        </p>
                        <div className="mt-2 flex gap-2 text-xs text-slate-400">
                          <span>{widget.defaultSize.w}x{widget.defaultSize.h}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
