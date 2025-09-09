import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  ShoppingCart, 
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Truck,
  Archive,
  Bell,
  ArrowRight
} from "lucide-react";

interface StatusCardProps {
  title: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
  action?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  count,
  total,
  color,
  icon,
  action
}) => {
  const percentage = (count / total) * 100;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`h-8 w-8 ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-2">
          {count}/{total}
        </div>
        <Progress value={percentage} className="h-2 mb-3" />
        {action && (
          <Button variant="outline" size="sm" className="w-full text-xs">
            {action} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

interface RecentTransactionProps {
  type: "invoice" | "purchase" | "payment";
  title: string;
  amount: string;
  status: "pending" | "completed" | "cancelled";
  time: string;
  customer?: string;
}

const RecentTransaction: React.FC<RecentTransactionProps> = ({
  type,
  title,
  amount,
  status,
  time,
  customer
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case "invoice":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "purchase":
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-purple-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600">Beklemede</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-600">Tamamlandı</Badge>;
      case "cancelled":
        return <Badge variant="destructive">İptal</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        {getTypeIcon()}
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          {customer && <div className="text-sm text-gray-600">{customer}</div>}
          <div className="text-xs text-gray-500">{time}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-gray-900">{amount}</div>
        <div className="mt-1">{getStatusBadge()}</div>
      </div>
    </div>
  );
};

export const OperationsOverview: React.FC = () => {
  const operationalStats = [
    {
      title: "Faturalar",
      count: 45,
      total: 60,
      color: "text-blue-600",
      icon: <FileText className="h-4 w-4" />,
      action: "Faturaları Görüntüle"
    },
    {
      title: "Satın Alma",
      count: 23,
      total: 30,
      color: "text-green-600",
      icon: <ShoppingCart className="h-4 w-4" />,
      action: "Siparişleri İncele"
    },
    {
      title: "Stok Takibi",
      count: 187,
      total: 250,
      color: "text-purple-600",
      icon: <Package className="h-4 w-4" />,
      action: "Stoku Yönet"
    },
    {
      title: "Teslimatlar",
      count: 38,
      total: 45,
      color: "text-orange-600",
      icon: <Truck className="h-4 w-4" />,
      action: "Sevkiyatları Takip Et"
    }
  ];

  const pendingApprovals = [
    { type: "invoice", title: "Fatura #2024-0145", requester: "Ahmet Yılmaz", amount: "₺ 15,600" },
    { type: "purchase", title: "Satın Alma Talebi", requester: "Fatma Kaya", amount: "₺ 8,900" },
    { type: "expense", title: "Gider Raporu", requester: "Mehmet Demir", amount: "₺ 3,200" },
    { type: "vacation", title: "İzin Talebi", requester: "Ayşe Şahin", amount: "5 gün" }
  ];

  const recentTransactions = [
    {
      type: "invoice" as const,
      title: "Fatura #2024-0144",
      amount: "₺ 45,200",
      status: "completed" as const,
      time: "2 saat önce",
      customer: "ABC Teknoloji"
    },
    {
      type: "purchase" as const,
      title: "Ofis Malzemeleri",
      amount: "₺ 12,800",
      status: "pending" as const,
      time: "4 saat önce",
      customer: "DEF Tedarik"
    },
    {
      type: "payment" as const,
      title: "Bordro Ödemesi",
      amount: "₺ 156,000",
      status: "completed" as const,
      time: "1 gün önce",
      customer: "İç Transfer"
    },
    {
      type: "invoice" as const,
      title: "Fatura #2024-0143",
      amount: "₺ 28,700",
      status: "cancelled" as const,
      time: "2 gün önce",
      customer: "XYZ Holding"
    }
  ];

  const inventoryAlerts = [
    { item: "A4 Kağıt", currentStock: 45, minStock: 50, status: "low" },
    { item: "Toner Kartuş", currentStock: 8, minStock: 15, status: "critical" },
    { item: "Ofis Kalemi Seti", currentStock: 23, minStock: 20, status: "normal" },
    { item: "Temizlik Malzemesi", currentStock: 3, minStock: 10, status: "critical" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Operasyon Genel Bakışı</h2>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Aktif İşlemler: 156
        </Badge>
      </div>

      {/* Operational Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {operationalStats.map((stat, index) => (
          <StatusCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Onay Bekleyen İşlemler
              <Badge variant="destructive" className="ml-auto">
                {pendingApprovals.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.requester}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{item.amount}</div>
                  <Button size="sm" variant="outline" className="mt-1 text-xs">
                    Onayla
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Stok Uyarıları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventoryAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Archive className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{alert.item}</div>
                    <div className="text-sm text-gray-600">
                      Mevcut: {alert.currentStock} / Min: {alert.minStock}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={
                    alert.status === "critical" ? "destructive" : 
                    alert.status === "low" ? "outline" : "default"
                  }
                  className="text-xs"
                >
                  {alert.status === "critical" ? "Kritik" : 
                   alert.status === "low" ? "Düşük" : "Normal"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Son İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTransactions.map((transaction, index) => (
            <RecentTransaction key={index} {...transaction} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationsOverview;
