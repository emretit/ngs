import React, { useState } from "react";
import { 
  CustomTabs as Tabs,
  CustomTabsContent as TabsContent,
  CustomTabsList as TabsList,
  CustomTabsTrigger as TabsTrigger
} from "@/components/ui/custom-tabs";
import CashflowChecks from "./CashflowChecks";
import CashflowNotes from "./CashflowNotes";

const CashflowChecksAndNotes = () => {
  const [activeTab, setActiveTab] = useState("checks");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm flex flex-nowrap justify-start sm:justify-center">
        <TabsTrigger value="checks" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 font-medium">
          <span>📄</span>
          <span>Çekler</span>
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 font-medium">
          <span>📋</span>
          <span>Senetler</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="checks">
        <CashflowChecks />
      </TabsContent>

      <TabsContent value="notes">
        <CashflowNotes />
      </TabsContent>
    </Tabs>
  );
};

export default CashflowChecksAndNotes;
