import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, ShoppingCart, Truck } from 'lucide-react';
import { CalendarEvent } from './types';
import { formatDate } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';

interface CalendarEventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarEventDialog = ({ event, isOpen, onClose }: CalendarEventDialogProps) => {
  const navigate = useNavigate();

  const handleNavigateToDetail = () => {
    if (!event) return;
    
    const { type, data } = event.resource;
    
    switch (type) {
      case 'activity':
        navigate(`/activities/${data.id}`);
        break;
      case 'order':
        navigate(`/orders/${data.id}`);
        break;
      case 'delivery':
        navigate(`/deliveries/${data.id}`);
        break;
      case 'proposal':
        navigate(`/proposals/${data.id}`);
        break;
      case 'sales_invoice':
        navigate(`/invoices/${data.id}`);
        break;
      case 'purchase_invoice':
        navigate(`/purchase/invoices/${data.id}`);
        break;
      case 'work_order':
        navigate(`/production/work-orders/${data.id}`);
        break;
      case 'service_request':
        navigate(`/services/${data.id}`);
        break;
      case 'opportunity':
        navigate(`/opportunities/${data.id}`);
        break;
      case 'payment':
        navigate(`/cashflow`);
        break;
      case 'expense':
        navigate(`/cashflow/expenses`);
        break;
      case 'check':
        navigate(`/cashflow/checks`);
        break;
      case 'purchase_order':
        navigate(`/purchase/orders/${data.id}`);
        break;
      case 'employee_leave':
        navigate(`/employees/${data.employee_id}`);
        break;
      case 'vehicle_maintenance':
      case 'vehicle_document':
      case 'vehicle_incident':
        navigate(`/vehicles/${data.vehicle_id || data.vehicle?.id}`);
        break;
      case 'event':
        navigate(`/dashboard`);
        break;
    }
    
    onClose();
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event.resource.type === 'activity' && <Activity className="h-5 w-5" />}
            {event.resource.type === 'order' && <ShoppingCart className="h-5 w-5" />}
            {event.resource.type === 'delivery' && <Truck className="h-5 w-5" />}
            {event.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {event.resource.type === 'activity' && (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Durum:</span>
                <Badge className="ml-2">{event.resource.data.status}</Badge>
              </div>
              {event.resource.data.description && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Açıklama:</span>
                  <p className="text-sm mt-1">{event.resource.data.description}</p>
                </div>
              )}
              {event.resource.data.assignee && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Atanan:</span>
                  <p className="text-sm mt-1">
                    {event.resource.data.assignee.first_name} {event.resource.data.assignee.last_name}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Tarih:</span>
                <p className="text-sm mt-1">{formatDate(event.start, 'dd MMM yyyy')}</p>
              </div>
            </div>
          )}

          {event.resource.type === 'order' && (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Sipariş No:</span>
                <p className="text-sm mt-1">{event.resource.data.order_number}</p>
              </div>
              {event.resource.data.customer && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Müşteri:</span>
                  <p className="text-sm mt-1">
                    {event.resource.data.customer.name || event.resource.data.customer.company}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Durum:</span>
                <Badge className="ml-2">{event.resource.data.status}</Badge>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Tarih:</span>
                <p className="text-sm mt-1">{formatDate(event.start, 'dd MMM yyyy')}</p>
              </div>
              {event.resource.data.total_amount && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tutar:</span>
                  <p className="text-sm mt-1">
                    {event.resource.data.total_amount.toLocaleString('tr-TR')} {event.resource.data.currency}
                  </p>
                </div>
              )}
            </div>
          )}

          {event.resource.type === 'delivery' && (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Teslimat No:</span>
                <p className="text-sm mt-1">{event.resource.data.delivery_number}</p>
              </div>
              {event.resource.data.customer && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Müşteri:</span>
                  <p className="text-sm mt-1">
                    {event.resource.data.customer.name || event.resource.data.customer.company}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Durum:</span>
                <Badge className="ml-2">{event.resource.data.status}</Badge>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Tarih:</span>
                <p className="text-sm mt-1">{formatDate(event.start, 'dd MMM yyyy')}</p>
              </div>
            </div>
          )}

          {/* Diğer event türleri için genel görünüm */}
          {!['activity', 'order', 'delivery'].includes(event.resource.type) && (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Tür:</span>
                <p className="text-sm mt-1">{event.resource.type}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Tarih:</span>
                <p className="text-sm mt-1">{formatDate(event.start, 'dd MMM yyyy')}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleNavigateToDetail} className="flex-1">
              Detayları Gör
            </Button>
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

