import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PackageCheck } from "lucide-react";

interface PurchaseManagementProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const PurchaseManagement = ({ isCollapsed, setIsCollapsed }: PurchaseManagementProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleGoToNewModule = () => {
    navigate("/purchasing");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Panele Dön
        </Button>
      </div>

      {/* Migration Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <PackageCheck className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Satın Alma Modülü Güncellendi
            </h2>
            <p className="text-blue-700 mb-4">
              Eski satın alma sayfası kaldırıldı. Yeni ve gelişmiş satın alma modülünü kullanın.
            </p>
            <Button 
              onClick={handleGoToNewModule}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PackageCheck className="h-4 w-4 mr-2" />
              Yeni Satın Alma Modülüne Git
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PurchaseManagement;
