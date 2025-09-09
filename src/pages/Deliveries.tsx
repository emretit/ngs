import { useState } from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { Package, Calendar, MapPin, CheckCircle } from "lucide-react";

interface DeliveriesProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Deliveries = ({ isCollapsed, setIsCollapsed }: DeliveriesProps) => {
  return (
    <DefaultLayout
      title="Teslimatlar"
      subtitle="Sipariş teslimatlarını takip edin ve yönetin"
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bekleyen Teslimatlar</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bugün Teslim Edilecek</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamamlanan Teslimatlar</p>
                <p className="text-2xl font-bold">48</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Son Teslimatlar</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">SIP-2024-001</p>
                    <p className="text-sm text-muted-foreground">ABC Teknoloji Ltd.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Teslimat Tarihi</p>
                    <p className="font-medium">15 Ocak 2024</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Teslim Edildi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Deliveries;