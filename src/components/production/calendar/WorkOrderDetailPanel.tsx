import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkOrder } from "@/types/production";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Factory, Package, Calendar as CalendarIcon, Edit, X } from "lucide-react";

interface WorkOrderDetailPanelProps {
  workOrder: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (workOrder: WorkOrder) => void;
}

const WorkOrderDetailPanel = ({
  workOrder,
  isOpen,
  onClose,
  onEdit
}: WorkOrderDetailPanelProps) => {
  if (!workOrder) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">📅 Planlandı</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">⚙️ Üretimde</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700">✔️ Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-700">❌ İptal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              <span>İş Emri Detayları</span>
            </div>
            {getStatusBadge(workOrder.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* İş Emri Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">İş Emri No</label>
              <p className="text-sm font-semibold text-gray-900">
                #{workOrder.work_order_number || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Durum</label>
              <div className="mt-1">
                {getStatusBadge(workOrder.status)}
              </div>
            </div>
          </div>

          {/* Ürün Bilgileri */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-500">Ürün</label>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {workOrder.product_name || workOrder.product?.name || 'Ürün Adı Yok'}
            </p>
            {workOrder.product?.sku && (
              <p className="text-xs text-gray-500 mt-1">SKU: {workOrder.product.sku}</p>
            )}
          </div>

          {/* Miktar */}
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-500">Miktar</label>
            <p className="text-sm font-semibold text-gray-900">
              {workOrder.quantity} {workOrder.unit}
            </p>
          </div>

          {/* Ürün Reçetesi */}
          {workOrder.bom_name && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">Ürün Reçetesi</label>
              <p className="text-sm font-semibold text-gray-900">
                {workOrder.bom_name}
                {workOrder.bom?.version && (
                  <span className="text-xs text-gray-500 ml-2">v{workOrder.bom.version}</span>
                )}
              </p>
            </div>
          )}

          {/* Planlanan Tarihler */}
          {(workOrder.planned_start_date || workOrder.planned_end_date) && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-500">Planlanan Tarihler</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {workOrder.planned_start_date && (
                  <div>
                    <label className="text-xs text-gray-500">Başlangıç</label>
                    <p className="text-sm font-semibold text-blue-600">
                      {format(new Date(workOrder.planned_start_date), 'dd MMM yyyy', { locale: tr })}
                    </p>
                  </div>
                )}
                {workOrder.planned_end_date && (
                  <div>
                    <label className="text-xs text-gray-500">Bitiş</label>
                    <p className="text-sm font-semibold text-orange-600">
                      {format(new Date(workOrder.planned_end_date), 'dd MMM yyyy', { locale: tr })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gerçekleşen Tarihler */}
          {(workOrder.actual_start_date || workOrder.actual_end_date) && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-green-500" />
                <label className="text-sm font-medium text-gray-500">Gerçekleşen Tarihler</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {workOrder.actual_start_date && (
                  <div>
                    <label className="text-xs text-gray-500">Başlangıç</label>
                    <p className="text-sm font-semibold text-green-600">
                      {format(new Date(workOrder.actual_start_date), 'dd MMM yyyy', { locale: tr })}
                    </p>
                  </div>
                )}
                {workOrder.actual_end_date && (
                  <div>
                    <label className="text-xs text-gray-500">Bitiş</label>
                    <p className="text-sm font-semibold text-green-600">
                      {format(new Date(workOrder.actual_end_date), 'dd MMM yyyy', { locale: tr })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notlar */}
          {workOrder.notes && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-500">Notlar</label>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {workOrder.notes}
              </p>
            </div>
          )}

          {/* Oluşturulma Tarihi */}
          <div className="border-t pt-4">
            <label className="text-xs text-gray-500">Oluşturulma Tarihi</label>
            <p className="text-sm text-gray-600">
              {format(new Date(workOrder.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Kapat
          </Button>
          {onEdit && (
            <Button onClick={() => {
              onEdit(workOrder);
              onClose();
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkOrderDetailPanel;

