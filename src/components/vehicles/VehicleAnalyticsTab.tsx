import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, BarChart3, TrendingUp } from "lucide-react";
import VehicleCostsTab from "./VehicleCostsTab";

export default function VehicleAnalyticsTab() {
  const [activeSubTab, setActiveSubTab] = useState("costs");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analiz & Raporlar</h2>
          <p className="text-muted-foreground">Araç maliyetleri ve performans analizi</p>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Maliyet Analizi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="space-y-4">
          <VehicleCostsTab />
        </TabsContent>
      </Tabs>

      {/* Future Analytics Components */}
      <div className="mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Yakında Gelecek Özellikler</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Yakıt tüketim trendleri</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Performans karşılaştırmaları</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Maliyet optimizasyon önerileri</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>ROI hesaplamaları</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
