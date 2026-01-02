import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, MoreHorizontal, Edit, Trash2, FileText, User, ShoppingCart, Receipt, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Order } from "@/types/orders";
import { formatCurrency } from "@/utils/formatters";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface OrderCardProps {
  order: Order;
  index: number;
  onClick: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onConvertToInvoice?: (order: Order) => void;
  onConvertToService?: (order: Order) => void;
  onPrint?: (order: Order) => void;
}

const OrderCard = ({ 
  order, 
  index, 
  onClick, 
  onSelect, 
  isSelected = false,
  onEdit,
  onDelete,
  onConvertToInvoice,
  onConvertToService,
  onPrint
}: OrderCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(order.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "completed":
        return "bg-teal-100 text-teal-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "confirmed":
        return "Onaylandı";
      case "processing":
        return "İşleniyor";
      case "shipped":
        return "Kargoda";
      case "delivered":
        return "Teslim Edildi";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  return (
    <>
      <Draggable draggableId={order.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-3 ${snapshot.isDragging ? "opacity-75" : ""}`}
          >
            <Card 
              className={`${isSelected ? "border-primary border-2" : "border-gray-200"} 
                        hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer bg-white`}
              onClick={onClick}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold text-sm text-gray-900">#{order.order_number}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 line-clamp-1 text-sm">
                      {shortenText(order.title, 30)}
                    </h3>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onEdit && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEdit(order);
                        }}>
                          <Edit className="mr-2 h-3 w-3" />
                          Düzenle
                        </DropdownMenuItem>
                      )}
                      {onConvertToInvoice && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onConvertToInvoice(order);
                        }}>
                          <Receipt className="mr-2 h-3 w-3" />
                          Faturaya Geçir
                        </DropdownMenuItem>
                      )}
                      {onConvertToService && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onConvertToService(order);
                        }}>
                          <FileText className="mr-2 h-3 w-3" />
                          Servise Çevir
                        </DropdownMenuItem>
                      )}
                      {onPrint && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onPrint(order);
                        }}>
                          <FileText className="mr-2 h-3 w-3" />
                          Yazdır
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={handleDeleteClick}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Sil
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {order.customer && (
                  <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
                    <User className="h-3 w-3" />
                    <span className="truncate">{shortenText(order.customer.name, 25)}</span>
                  </div>
                )}

                {/* Teslimat Bilgileri */}
                {(order.delivery_address || order.delivery_contact_name || order.delivery_contact_phone || order.expected_delivery_date) && (
                  <div className="mb-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                    <div className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Teslimat Bilgileri
                    </div>
                    <div className="space-y-1">
                      {order.expected_delivery_date && (
                        <div className="flex items-center text-xs text-amber-600">
                          <CalendarIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">İstenen Tarih: {format(new Date(order.expected_delivery_date), 'dd MMM yyyy', { locale: tr })}</span>
                        </div>
                      )}
                      {order.delivery_address && (
                        <div className="flex items-start text-xs text-gray-600">
                          <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{shortenText(order.delivery_address, 35)}</span>
                        </div>
                      )}
                      {order.delivery_contact_name && (
                        <div className="flex items-center text-xs text-gray-600">
                          <User className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{shortenText(order.delivery_contact_name, 30)}</span>
                        </div>
                      )}
                      {order.delivery_contact_phone && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{order.delivery_contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {formatCurrency(order.total_amount, order.currency)}
                  </Badge>
                </div>

                {order.order_date && (
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span>Sipariş Tarihi: {format(new Date(order.order_date), 'dd MMM yyyy', { locale: tr })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>

      {/* Confirmation Dialog */}
      {onDelete && (
        <ConfirmationDialogComponent
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Siparişi Sil"
          description={`"${order.order_number}" numaralı siparişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </>
  );
};

export default OrderCard;

