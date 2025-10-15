import React, { useState } from "react";
import { FileText } from "lucide-react";
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Çekler ve Senetler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Çek ve senet işlemlerinizi yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
        <div className="p-6">
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

            <TabsContent value="checks" className="space-y-6">
              <CashflowChecks />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <CashflowNotes />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CashflowChecksAndNotes;
