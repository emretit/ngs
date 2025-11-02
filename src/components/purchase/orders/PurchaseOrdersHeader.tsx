import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock, CheckCircle2, XCircle, Truck, PackageCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PurchaseOrder } from "@/hooks/usePurchaseOrders";

interface PurchaseOrdersHeaderProps {
  orders?: PurchaseOrder[];
}

const PurchaseOrdersHeader = ({ orders = [] }: PurchaseOrdersHeaderProps) => {
  const navigate = useNavigate();

  // Status kartları için veri
  const statusCards = [
    {
      status: 'draft',
      icon: FileText,
      label: 'Taslak',
      color: 'bg-gray-100 text-gray-800',
      count: orders.filter(o => o.status === 'draft').length
    },
    {
      status: 'submitted',
      icon: Clock,
      label: 'Onayda',
      color: 'bg-yellow-100 text-yellow-800',
      count: orders.filter(o => o.status === 'submitted').length
    },
    {
      status: 'confirmed',
      icon: CheckCircle2,
      label: 'Onaylandı',
      color: 'bg-green-100 text-green-800',
      count: orders.filter(o => o.status === 'confirmed').length
    },
    {
      status: 'partial_received',
      icon: Truck,
      label: 'Kısmi Teslim',
      color: 'bg-blue-100 text-blue-800',
      count: orders.filter(o => o.status === 'partial_received').length
    },
    {
      status: 'received',
      icon: PackageCheck,
      label: 'Teslim Alındı',
      color: 'bg-emerald-100 text-emerald-800',
      count: orders.filter(o => o.status === 'received').length
    },
    {
      status: 'cancelled',
      icon: XCircle,
      label: 'İptal',
      color: 'bg-red-100 text-red-800',
      count: orders.filter(o => o.status === 'cancelled').length
    },
  ];

  // Toplam sipariş değeri hesapla
  const totalValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Satın Alma Siparişleri
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Siparişleri yönetin ve takip edin
          </p>
        </div>
      </div>

      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam sipariş sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-indigo-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {orders.length}
          </span>
        </div>

        {/* Toplam tutar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border border-emerald-600 shadow-sm">
          <span className="font-bold">Toplam Değer</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </span>
        </div>

        {/* Durum kartları */}
        {statusCards.map(({ status, icon: Icon, label, color, count }) => {
          if (count === 0) return null; // Sıfır olanları gösterme

          return (
            <div
              key={status}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color} border-gray-200`}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sağ taraf - Yeni Sipariş Butonu */}
      <div className="flex items-center gap-2">
        <Button
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300"
          onClick={() => navigate("/purchase-orders/new")}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Sipariş</span>
        </Button>
      </div>
    </div>
  );
};

export default React.memo(PurchaseOrdersHeader);
