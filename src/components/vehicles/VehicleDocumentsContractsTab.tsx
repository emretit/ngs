import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, FileCheck } from "lucide-react";
import VehicleDocumentsTab from "./VehicleDocumentsTab";
import VehicleContractsTab from "./VehicleContractsTab";

export default function VehicleDocumentsContractsTab() {
  const [activeSubTab, setActiveSubTab] = useState("documents");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Belgeler & Sözleşmeler</h2>
          <p className="text-muted-foreground">Araç belgeleri ve sözleşme yönetimi</p>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Belgeler
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Sözleşmeler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <VehicleDocumentsTab />
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <VehicleContractsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
