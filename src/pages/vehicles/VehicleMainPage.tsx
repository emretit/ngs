import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Settings, FileText, BarChart3 } from "lucide-react";

// Import individual tab components
import VehicleListTab from "@/components/vehicles/VehicleListTab";
import VehicleOperationsTab from "@/components/vehicles/VehicleOperationsTab";
import VehicleDocumentsContractsTab from "@/components/vehicles/VehicleDocumentsContractsTab";
import VehicleAnalyticsTab from "@/components/vehicles/VehicleAnalyticsTab";

export default function VehicleMainPage() {
  const [activeTab, setActiveTab] = useState("vehicles");

  return (
    <div className="space-y-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Araç Yönetimi</h1>
                <p className="text-muted-foreground">Şirket araçlarınızı ve süreçlerini yönetin</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="vehicles" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Araçlar
                </TabsTrigger>
                <TabsTrigger value="operations" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Operasyonlar
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Belgeler & Sözleşmeler
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analiz & Raporlar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vehicles" className="space-y-4">
                <VehicleListTab />
              </TabsContent>

              <TabsContent value="operations" className="space-y-4">
                <VehicleOperationsTab />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <VehicleDocumentsContractsTab />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <VehicleAnalyticsTab />
              </TabsContent>
            </Tabs>
          </div>
    </div>
  );
}
