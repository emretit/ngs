import React from "react";
import PdfTemplates from "@/pages/PdfTemplates";
import { Settings2, FileText } from "lucide-react";
interface PdfTemplatesSettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}
const PdfTemplatesSettings = ({ isCollapsed, setIsCollapsed }: PdfTemplatesSettingsProps) => {
  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                PDF Şablonları
              </h1>
              <p className="text-xs text-muted-foreground/70">
                PDF şablonlarını yönetin ve düzenleyin.
              </p>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
          <div className="p-6">
            <PdfTemplates />
          </div>
        </div>
      </div>
  );
};
export default PdfTemplatesSettings;
