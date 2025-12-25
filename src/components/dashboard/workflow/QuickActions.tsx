import { 
  Plus, 
  FileText, 
  UserPlus, 
  Package, 
  Receipt, 
  Calendar,
  Phone,
  Mail,
  Target,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  path?: string;
  onClick?: () => void;
}

const defaultActions: QuickAction[] = [
  {
    id: 'new-opportunity',
    label: 'Yeni Fırsat',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    path: '/crm/opportunities?action=new'
  },
  {
    id: 'new-proposal',
    label: 'Yeni Teklif',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    path: '/proposals/new'
  },
  {
    id: 'new-order',
    label: 'Yeni Sipariş',
    icon: Package,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    path: '/sales/orders/new'
  },
  {
    id: 'new-invoice',
    label: 'Yeni Fatura',
    icon: Receipt,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    path: '/sales/invoices/new'
  },
  {
    id: 'new-customer',
    label: 'Yeni Müşteri',
    icon: UserPlus,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
    path: '/crm/customers?action=new'
  },
  {
    id: 'new-task',
    label: 'Yeni Görev',
    icon: Calendar,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    path: '/activities?action=new'
  },
  {
    id: 'new-delivery',
    label: 'Yeni Teslimat',
    icon: Truck,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    path: '/sales/deliveries/new'
  },
  {
    id: 'quick-call',
    label: 'Arama Kaydı',
    icon: Phone,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    path: '/activities?action=call'
  }
];

interface QuickActionsProps {
  actions?: QuickAction[];
  compact?: boolean;
}

export function QuickActions({ actions = defaultActions, compact = false }: QuickActionsProps) {
  const navigate = useNavigate();

  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {actions.slice(0, 4).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                action.bgColor,
                action.color
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <Plus className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Hızlı İşlemler</h3>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 hover:scale-105",
                action.bgColor
              )}
            >
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-white shadow-sm", action.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn("text-xs font-medium text-center", action.color)}>
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
