
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Truck, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { PurchaseOrder, PurchaseOrderStatus } from "@/types/purchase";
import { formatMoney } from "../constants";
import { capitalizeFirstLetter } from "@/utils/formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PurchaseOrderInfoProps {
  order: PurchaseOrder & { items?: any[] };
  onStatusChange: (status: PurchaseOrderStatus) => void;
}

const statusActions = {
  draft: ['sent'],
  sent: ['confirmed', 'cancelled'],
  confirmed: ['received', 'partially_received', 'cancelled'],
  partially_received: ['received'],
  received: [],
  cancelled: ['draft'],
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: "Taslak",
  sent: "Gönderildi",
  confirmed: "Onaylandı",
  received: "Teslim Alındı",
  partially_received: "Kısmen Teslim Alındı",
  cancelled: "İptal Edildi",
};

const PurchaseOrderInfo: React.FC<PurchaseOrderInfoProps> = ({ order, onStatusChange }) => {
  const availableActions = statusActions[order.status] || [];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex justify-between items-center">
            <span>Tedarikçi Bilgileri</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={availableActions.length === 0}
                >
                  Durum: {statusLabels[order.status]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Durum Değiştir</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableActions.map((action) => (
                  <DropdownMenuItem
                    key={action}
                    onClick={() => onStatusChange(action as PurchaseOrderStatus)}
                  >
                    {statusLabels[action as PurchaseOrderStatus]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="font-medium">{order.supplier_id}</p>
            <p className="text-sm text-muted-foreground">
              İlgili Kişi: 
            </p>
            <p className="text-sm text-muted-foreground">
              Telefon: 
            </p>
            <p className="text-sm text-muted-foreground">
              E-posta: 
            </p>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sipariş No:</span>
              <span className="font-medium">{order.po_number}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sipariş Tarihi:</span>
              <span>{order.issued_date ? format(new Date(order.issued_date), "dd.MM.yyyy") : "-"}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Beklenen Teslim:</span>
              <span>{order.expected_delivery_date ? format(new Date(order.expected_delivery_date), "dd.MM.yyyy") : "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Ödeme ve Teslimat Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Ödeme Koşulları:</span>
              <p className="text-sm text-muted-foreground mt-1">
                {order.payment_terms || "Belirtilmemiş"}
              </p>
            </div>
            
            <Separator className="my-2" />
            
            <div>
              <span className="font-medium">Teslimat Adresi:</span>
              <p className="text-sm text-muted-foreground mt-1">
                {order.delivery_address || "Belirtilmemiş"}
              </p>
            </div>
            
            <div>
              <span className="font-medium">Teslimat Koşulları:</span>
              <p className="text-sm text-muted-foreground mt-1">
                {order.delivery_terms || "Belirtilmemiş"}
              </p>
            </div>
            
            <Separator className="my-2" />
            
            <div className="pt-2">
              <span className="font-medium">Sipariş Özeti:</span>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam:</span>
                  <span>{formatMoney(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">KDV:</span>
                  <span>{formatMoney(order.tax_amount, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Genel Toplam:</span>
                  <span>{formatMoney(order.total_amount, order.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderInfo;
