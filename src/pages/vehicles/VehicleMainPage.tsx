import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Wrench, Fuel, FileText, AlertTriangle, DollarSign, FileContract } from "lucide-react";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";

// Import individual tab components
import VehicleListTab from "@/components/vehicles/VehicleListTab";
import VehicleMaintenanceTab from "@/components/vehicles/VehicleMaintenanceTab";
import VehicleFuelTab from "@/components/vehicles/VehicleFuelTab";
import VehicleDocumentsTab from "@/components/vehicles/VehicleDocumentsTab";
import VehicleIncidentsTab from "@/components/vehicles/VehicleIncidentsTab";
import VehicleCostsTab from "@/components/vehicles/VehicleCostsTab";
import VehicleContractsTab from "@/components/vehicles/VehicleContractsTab";

interface VehicleMainPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function VehicleMainPage({ isCollapsed, setIsCollapsed }: VehicleMainPageProps) {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-[60px]" : "ml-64"
      }`}>
        <TopBar />
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Araç Yönetimi</h1>
                <p className="text-muted-foreground">Şirket araçlarınızı ve süreçlerini yönetin</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Araç Listesi
                </TabsTrigger>
                <TabsTrigger value="contracts" className="flex items-center gap-2">
                  <FileContract className="h-4 w-4" />
                  Sözleşmeler
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Bakım & Servis
                </TabsTrigger>
                <TabsTrigger value="fuel" className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Yakıt & KM
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Belgeler
                </TabsTrigger>
                <TabsTrigger value="incidents" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Olaylar & Cezalar
                </TabsTrigger>
                <TabsTrigger value="costs" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Maliyetler
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                <VehicleListTab />
              </TabsContent>

              <TabsContent value="contracts" className="space-y-4">
                <VehicleContractsTab />
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <VehicleMaintenanceTab />
              </TabsContent>

              <TabsContent value="fuel" className="space-y-4">
                <VehicleFuelTab />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <VehicleDocumentsTab />
              </TabsContent>

              <TabsContent value="incidents" className="space-y-4">
                <VehicleIncidentsTab />
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                <VehicleCostsTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
