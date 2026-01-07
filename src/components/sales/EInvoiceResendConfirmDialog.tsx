import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EInvoiceResendConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: {
    stateCode: number;
    stateName: string;
    userFriendlyStatus: string;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EInvoiceResendConfirmDialog({
  open,
  onOpenChange,
  currentStatus,
  onConfirm,
  onCancel,
}: EInvoiceResendConfirmDialogProps) {
  const getMessage = () => {
    if (!currentStatus) {
      return "Bu faturayı göndermek istiyor musunuz?";
    }

    switch (currentStatus.stateCode) {
      case 1:
        return "Bu fatura taslak durumda. Göndermek istiyor musunuz?";
      case 2:
        return "Bu fatura imza bekliyor. Tekrar göndermek istiyor musunuz?";
      case 3:
        return "Bu fatura zaten işleme alınmış. Tekrar göndermek istiyor musunuz?";
      case 4:
        return "Bu fatura hatalı durumda. Yeniden göndermek istiyor musunuz?";
      default:
        return "Bu faturayı göndermek istiyor musunuz?";
    }
  };

  const getWarningColor = () => {
    if (!currentStatus) return "bg-blue-50 border-blue-200";
    
    switch (currentStatus.stateCode) {
      case 1:
        return "bg-gray-50 border-gray-200";
      case 2:
      case 3:
        return "bg-yellow-50 border-yellow-200";
      case 4:
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>E-Fatura Gönderme Onayı</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="text-sm text-gray-700">
              {getMessage()}
            </p>
            {currentStatus && (
              <div className={`p-3 border rounded ${getWarningColor()}`}>
                <p className="text-sm">
                  <strong>Mevcut Durum:</strong> {currentStatus.userFriendlyStatus}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ({currentStatus.stateName})
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Evet, Gönder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

