import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { ServiceRequestForm } from "@/components/service/ServiceRequestForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ServiceRequestNewProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ServiceRequestNew = ({ isCollapsed, setIsCollapsed }: ServiceRequestNewProps) => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/service?view=list");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-64"
        }`}
      >
        <TopBar />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="w-full">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="flex items-center gap-2 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Geri Dön
                </Button>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">Yeni Servis Talebi</h1>
                <p className="text-sm text-gray-600">Yeni bir servis talebi oluşturun ve detaylarını belirleyin</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <ServiceRequestForm 
                onClose={handleClose}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceRequestNew;
