import { CheckCircle, Clock, Truck, Package, FileText, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  currentStatus: string;
}

const steps = [
  { key: 'submitted', label: 'Sipariş Gönderildi', icon: FileText },
  { key: 'confirmed', label: 'Onaylandı', icon: CheckCircle },
  { key: 'shipped', label: 'Sevk Edildi', icon: Truck },
  { key: 'received', label: 'Teslim Alındı', icon: Package },
  { key: 'completed', label: 'Tamamlandı', icon: CheckCircle },
];

const statusOrder = ['submitted', 'confirmed', 'shipped', 'received', 'completed'];

export default function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center text-red-600">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <XCircle className="w-8 h-8" />
          </div>
          <span className="font-medium text-lg">Sipariş İptal Edildi</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {/* Connecting line */}
              {index > 0 && (
                <div 
                  className={cn(
                    'absolute top-5 right-1/2 w-full h-1 -z-10',
                    index <= currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                />
              )}
              
              {/* Icon circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                  isCompleted 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-200 text-slate-400',
                  isCurrent && 'ring-4 ring-emerald-100'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Label */}
              <span 
                className={cn(
                  'mt-2 text-xs text-center font-medium',
                  isCompleted ? 'text-emerald-600' : 'text-slate-400'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

