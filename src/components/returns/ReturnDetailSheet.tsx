import { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Package, Calendar, Phone, Wrench, FileText, Clock, AlertTriangle, MapPin, CreditCard } from "lucide-react";
import { useReturn, useUpdateReturnStatus, useDeleteReturn } from "@/hooks/useReturnMutations";
import {
  Return,
  ReturnStatus,
  returnStatusLabels,
  returnTypeLabels,
  returnReasonLabels,
  itemStatusLabels,
  itemConditionLabels,
} from "@/types/returns";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { EditableDetailSheet, FieldConfig } from "@/components/common/EditableDetailSheet";

interface ReturnDetailSheetProps {
  returnId: string | null;
  open: boolean;
  onClose: () => void;
}

// Validation schema
const returnSchema = z.object({
  status: z.string(),
});

type ReturnFormData = z.infer<typeof returnSchema>;

// Status options
const statusOptions = [
  { value: 'pending', label: '⏳ Beklemede' },
  { value: 'under_review', label: '🔍 İnceleniyor' },
  { value: 'approved', label: '✅ Onaylandı' },
  { value: 'rejected', label: '❌ Reddedildi' },
  { value: 'completed', label: '✓ Tamamlandı' },
  { value: 'cancelled', label: '🚫 İptal Edildi' },
];

const ReturnDetailSheet = ({ returnId, open, onClose }: ReturnDetailSheetProps) => {
  const { t } = useTranslation();
  const { data: returnData, isLoading } = useReturn(returnId || undefined);
  const updateStatus = useUpdateReturnStatus();
  const deleteReturn = useDeleteReturn();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSave = async (values: ReturnFormData) => {
    if (returnId && values.status !== returnData?.status) {
      await updateStatus.mutateAsync({ id: returnId, status: values.status });
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (returnId) {
      deleteReturn.mutate(returnId, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          onClose();
        },
      });
    }
  };

  const getStatusColor = (status: ReturnStatus) => {
    const colors: Record<ReturnStatus, string> = {
      pending: "border-orange-500 text-orange-700 bg-orange-50",
      under_review: "border-blue-500 text-blue-700 bg-blue-50",
      approved: "border-green-500 text-green-700 bg-green-50",
      rejected: "border-red-500 text-red-700 bg-red-50",
      completed: "border-emerald-500 text-emerald-700 bg-emerald-50",
      cancelled: "border-gray-500 text-gray-700 bg-gray-50",
    };
    return colors[status] || "";
  };

  const formatCurrency = (amount: number, currency: string = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Form fields - only status
  const fields: FieldConfig<ReturnFormData>[] = [
    {
      name: 'status',
      label: 'Durum',
      type: 'select',
      options: statusOptions,
      gridColumn: 'col-span-full',
    },
  ];

  // Render return details
  const renderDetails = () => {
    if (!returnData) return null;

    return (
      <div className="space-y-3">
        {/* Header Info */}
        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-sm font-semibold text-orange-600">
              {returnData.return_number}
            </h3>
            <p className="text-xs text-muted-foreground">
              {format(new Date(returnData.request_date), "dd MMMM yyyy, HH:mm", { locale: tr })}
            </p>
          </div>
          <Badge className={getStatusColor(returnData.status) + " text-xs px-2 py-0.5"}>
            {returnStatusLabels[returnData.status]}
          </Badge>
        </div>

        <Separator />

        {/* Customer Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <User className="h-3.5 w-3.5" />
            Müşteri Bilgileri
          </div>
          <div className="bg-gray-50 rounded-md p-2.5 space-y-0.5">
            <p className="font-medium text-sm">
              {returnData.customer?.company || returnData.customer?.name}
            </p>
            {returnData.customer?.email && (
              <p className="text-xs text-muted-foreground">{returnData.customer.email}</p>
            )}
            {(returnData.customer?.mobile_phone || returnData.customer?.office_phone) && (
              <p className="text-xs text-muted-foreground">
                {returnData.customer.mobile_phone || returnData.customer.office_phone}
              </p>
            )}
          </div>
        </div>

        {/* Return Type & Reason */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Package className="h-3.5 w-3.5" />
              İade Türü
            </div>
            <Badge variant="outline" className="text-xs">
              {returnTypeLabels[returnData.return_type]}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              İade Nedeni
            </div>
            <Badge variant="outline" className="text-xs">
              {returnReasonLabels[returnData.return_reason]}
            </Badge>
          </div>
        </div>

        {returnData.reason_description && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">Neden Açıklaması</p>
            <p className="text-xs text-muted-foreground bg-gray-50 rounded-md p-2.5">
              {returnData.reason_description}
            </p>
          </div>
        )}

        {/* Related Records */}
        {(returnData.order || returnData.delivery) && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <FileText className="h-3.5 w-3.5" />
              İlişkili Kayıtlar
            </div>
            <div className="bg-gray-50 rounded-md p-2.5 space-y-1.5">
              {returnData.order && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Sipariş:</span>
                  <span className="text-xs font-medium text-blue-600">
                    {returnData.order.order_number}
                  </span>
                </div>
              )}
              {returnData.delivery && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Teslimat:</span>
                  <span className="text-xs font-medium text-purple-600">
                    {returnData.delivery.delivery_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Refund Amount */}
        {returnData.refund_amount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <CreditCard className="h-3.5 w-3.5" />
              İade Tutarı
            </div>
            <div className="bg-green-50 rounded-md p-2.5">
              <p className="text-base font-semibold text-green-700">
                {formatCurrency(returnData.refund_amount, returnData.currency)}
              </p>
              {returnData.refund_method && (
                <p className="text-xs text-green-600 mt-0.5">
                  Ödeme Yöntemi: {returnData.refund_method}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Return Items */}
        {returnData.items && returnData.items.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Package className="h-3.5 w-3.5" />
              İade Edilen Ürünler ({returnData.items.length})
            </div>
            <div className="space-y-1.5">
              {returnData.items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-md p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs">{item.product_name}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                      {item.return_quantity} {item.unit}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {itemStatusLabels[item.item_status as keyof typeof itemStatusLabels] || item.item_status}
                    </Badge>
                    {item.condition && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {itemConditionLabels[item.condition as keyof typeof itemConditionLabels] || item.condition}
                      </Badge>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[10px] text-muted-foreground">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {returnData.notes && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <FileText className="h-3.5 w-3.5" />
              Notlar
            </div>
            <p className="text-xs text-muted-foreground bg-gray-50 rounded-md p-2.5">
              {returnData.notes}
            </p>
          </div>
        )}

        {/* Dates */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Calendar className="h-3.5 w-3.5" />
            Tarihler
          </div>
          <div className="bg-gray-50 rounded-md p-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Talep Tarihi:</span>
              <span>{format(new Date(returnData.request_date), "dd MMM yyyy", { locale: tr })}</span>
            </div>
            {returnData.review_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">İnceleme Tarihi:</span>
                <span>{format(new Date(returnData.review_date), "dd MMM yyyy", { locale: tr })}</span>
              </div>
            )}
            {returnData.completion_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tamamlanma Tarihi:</span>
                <span>{format(new Date(returnData.completion_date), "dd MMM yyyy", { locale: tr })}</span>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-0" />

        {/* Delete Button */}
        <div className="flex justify-end pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            disabled={deleteReturn.isPending}
            className="h-8 px-3 text-xs"
          >
            {deleteReturn.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            İadeyi Sil
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <EditableDetailSheet
        isOpen={open}
        onClose={onClose}
        title="İade Detayı"
        subtitle={returnData?.return_number}
        data={returnData as ReturnFormData}
        isLoading={isLoading}
        fields={fields}
        schema={returnSchema}
        onSave={handleSave}
        isSaving={updateStatus.isPending}
        renderActions={renderDetails}
        saveButtonText="Kaydet"
        cancelButtonText="Kapat"
        size="lg"
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="İadeyi Sil"
        description={`"${returnData?.return_number || 'Bu iade'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz. İade kaydı ve tüm ilişkili ürün bilgileri kalıcı olarak silinecektir.`}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isLoading={deleteReturn.isPending}
      />
    </>
  );
};

export default ReturnDetailSheet;
