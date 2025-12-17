import React, { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RotateCcw,
  User,
  Package,
  Calendar,
  CreditCard,
  FileText,
  Truck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
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

interface ReturnDetailSheetProps {
  returnId: string | null;
  open: boolean;
  onClose: () => void;
}

const ReturnDetailSheet = ({ returnId, open, onClose }: ReturnDetailSheetProps) => {
  const { t } = useTranslation();
  const { data: returnData, isLoading } = useReturn(returnId || undefined);
  const updateStatus = useUpdateReturnStatus();
  const deleteReturn = useDeleteReturn();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    if (returnId) {
      updateStatus.mutate({ id: returnId, status: newStatus });
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

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            İade Detayı
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : returnData ? (
          <div className="space-y-6 mt-6">
            {/* Header Info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-600">
                  {returnData.return_number}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(returnData.request_date), "dd MMMM yyyy, HH:mm", { locale: tr })}
                </p>
              </div>
              <Badge className={getStatusColor(returnData.status)}>
                {returnStatusLabels[returnData.status]}
              </Badge>
            </div>

            <Separator />

            {/* Status Update */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durumu Güncelle</label>
              <Select
                value={returnData.status}
                onValueChange={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">⏳ Beklemede</SelectItem>
                  <SelectItem value="under_review">🔍 İnceleniyor</SelectItem>
                  <SelectItem value="approved">✅ Onaylandı</SelectItem>
                  <SelectItem value="rejected">❌ Reddedildi</SelectItem>
                  <SelectItem value="completed">✓ Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">🚫 İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Müşteri Bilgileri
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="font-medium">
                  {returnData.customer?.company || returnData.customer?.name}
                </p>
                {returnData.customer?.email && (
                  <p className="text-sm text-muted-foreground">{returnData.customer.email}</p>
                )}
                {(returnData.customer?.mobile_phone || returnData.customer?.office_phone) && (
                  <p className="text-sm text-muted-foreground">
                    {returnData.customer.mobile_phone || returnData.customer.office_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Return Type & Reason */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Package className="h-4 w-4" />
                  İade Türü
                </div>
                <Badge variant="outline" className="text-sm">
                  {returnTypeLabels[returnData.return_type]}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  İade Nedeni
                </div>
                <Badge variant="outline" className="text-sm">
                  {returnReasonLabels[returnData.return_reason]}
                </Badge>
              </div>
            </div>

            {returnData.reason_description && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Neden Açıklaması</p>
                <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                  {returnData.reason_description}
                </p>
              </div>
            )}

            {/* Related Order/Delivery */}
            {(returnData.order || returnData.delivery) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Truck className="h-4 w-4" />
                  İlişkili Kayıtlar
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {returnData.order && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sipariş:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {returnData.order.order_number}
                      </span>
                    </div>
                  )}
                  {returnData.delivery && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Teslimat:</span>
                      <span className="text-sm font-medium text-purple-600">
                        {returnData.delivery.delivery_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Refund Amount */}
            {returnData.refund_amount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4" />
                  İade Tutarı
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-lg font-semibold text-green-700">
                    {formatCurrency(returnData.refund_amount, returnData.currency)}
                  </p>
                  {returnData.refund_method && (
                    <p className="text-sm text-green-600 mt-1">
                      Ödeme Yöntemi: {returnData.refund_method}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Return Items */}
            {returnData.items && returnData.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Package className="h-4 w-4" />
                  İade Edilen Ürünler ({returnData.items.length})
                </div>
                <div className="space-y-2">
                  {returnData.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{item.product_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.return_quantity} {item.unit}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {itemStatusLabels[item.item_status as keyof typeof itemStatusLabels] || item.item_status}
                        </Badge>
                        {item.condition && (
                          <Badge variant="outline" className="text-xs">
                            {itemConditionLabels[item.condition as keyof typeof itemConditionLabels] || item.condition}
                          </Badge>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {returnData.notes && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Notlar
                </div>
                <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                  {returnData.notes}
                </p>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Tarihler
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
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

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="destructive" onClick={handleDeleteClick} disabled={deleteReturn.isPending}>
                {deleteReturn.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                İadeyi Sil
              </Button>
              <Button variant="outline" onClick={onClose}>
                Kapat
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">İade bulunamadı</p>
          </div>
        )}
      </SheetContent>

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
        onCancel={handleDeleteCancel}
        isLoading={deleteReturn.isPending}
      />
    </Sheet>
  );
};

export default ReturnDetailSheet;
