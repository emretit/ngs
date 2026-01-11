import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Package, ShoppingCart } from "lucide-react";

export interface ShortageItem {
  product_id: string;
  product_name: string;
  required_quantity: number;
  available_stock: number;
  shortage: number;
  unit: string;
}

interface StockShortageDialogProps {
  open: boolean;
  onClose: () => void;
  shortageItems: ShortageItem[];
  onCreatePurchaseRequest: () => void;
  onContinueAnyway: () => void;
  isCreating?: boolean;
}

export const StockShortageDialog = ({
  open,
  onClose,
  shortageItems,
  onCreatePurchaseRequest,
  onContinueAnyway,
  isCreating = false
}: StockShortageDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Stok Yetersizliği
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Aşağıdaki ürünlerde yetersiz stok bulunmaktadır. Satın alma talebi oluşturmak ister misiniz?
            </AlertDescription>
          </Alert>
          
          {/* Yetersiz Stok Listesi */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Ürün</th>
                  <th className="px-4 py-2 text-right">Gerekli</th>
                  <th className="px-4 py-2 text-right">Mevcut</th>
                  <th className="px-4 py-2 text-right">Eksik</th>
                </tr>
              </thead>
              <tbody>
                {shortageItems.map((item) => (
                  <tr key={item.product_id} className="border-t">
                    <td className="px-4 py-2">{item.product_name}</td>
                    <td className="px-4 py-2 text-right">
                      {item.required_quantity} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right text-orange-600">
                      {item.available_stock} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-red-600">
                      -{item.shortage} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onContinueAnyway}
            disabled={isCreating}
          >
            <Package className="h-4 w-4 mr-2" />
            Yine de Devam Et
          </Button>
          
          <Button
            onClick={onCreatePurchaseRequest}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isCreating}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isCreating ? "Oluşturuluyor..." : "Satın Alma Talebi Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
