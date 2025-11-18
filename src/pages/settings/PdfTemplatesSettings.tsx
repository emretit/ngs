import React from "react";
import PdfTemplates from "@/pages/PdfTemplates";

interface PdfTemplatesSettingsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const PdfTemplatesSettings = ({ isCollapsed, setIsCollapsed }: PdfTemplatesSettingsProps) => {
  return (
    <div className="space-y-2">
      {/* Content - Header is shown inside PdfTemplates when showHeader is true */}
      <PdfTemplates showHeader={true} />
    </div>
  );
};

export default PdfTemplatesSettings;
