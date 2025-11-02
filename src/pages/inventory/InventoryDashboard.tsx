import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ArrowRightLeft, 
  Factory, 
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle
} from "lucide-react";

interface InventoryDashboardProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const InventoryDashboard = ({ isCollapsed, setIsCollapsed }: InventoryDashboardProps) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Ürünler",
      description: "Ürün listesi ve yönetimi",
      icon: Package,
      path: "/products",
      color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
    },
    {
      title: "Depo İşlemleri",
      description: "Stok giriş, çıkış, transfer",
      icon: ArrowRightLeft,
      path: "/inventory/transactions",
      color: "bg-green-500/10 text-green-600 hover:bg-green-500/20"
    },
    {
      title: "Üretim",
      description: "İş emirleri ve ürün reçeteleri",
      icon: Factory,
      path: "/production",
      color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stok Yönetimi</h1>
        <p className="text-muted-foreground">
          Ürünler, depo işlemleri, üretim ve stok raporlarını yönetin
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.path}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(action.path)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{action.title}</CardTitle>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {action.description}
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(action.path);
                }}
              >
                Git
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Stok Değeri</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺0.00</div>
            <p className="text-xs text-muted-foreground">
              Son güncelleme: Bugün
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Aktif ürünler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">
              Düşük stoklu ürünler
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen İşlemler</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Onay bekleyen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Henüz aktivite kaydı bulunmuyor</p>
            <p className="text-sm mt-2">Stok işlemleri burada görüntülenecek</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDashboard;
