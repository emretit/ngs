import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Fuel, AlertTriangle } from "lucide-react";
import VehicleMaintenanceTab from "./VehicleMaintenanceTab";
import VehicleFuelTab from "./VehicleFuelTab";
import VehicleIncidentsTab from "./VehicleIncidentsTab";

export default function VehicleOperationsTab() {
  const [activeSubTab, setActiveSubTab] = useState("maintenance");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Operasyonlar</h2>
          <p className="text-muted-foreground">Araç bakım, yakıt ve olay yönetimi</p>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Bakım & Servis
          </TabsTrigger>
          <TabsTrigger value="fuel" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Yakıt & KM
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Olaylar & Cezalar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <VehicleMaintenanceTab />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4">
          <VehicleFuelTab />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <VehicleIncidentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
