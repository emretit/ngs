import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { ServiceRequestForm } from "@/components/service/ServiceRequestForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useServiceRequests } from "@/hooks/service/useServiceRequests";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ServiceRequestFormData, ServiceRequest } from "@/types/service";

interface ServiceRequestEditProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ServiceRequestEdit = ({ isCollapsed, setIsCollapsed }: ServiceRequestEditProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getServiceRequest } = useServiceRequests();
  const { userData, isLoading: userLoading } = useCurrentUser();
  const [serviceRequest, setServiceRequest] = useState<ServiceRequestFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceRequest = async () => {
      if (!id) {
        setError("Servis talebi ID'si bulunamadı");
        setLoading(false);
        return;
      }

      if (userLoading) {
        // User data hala yükleniyor, bekle
        return;
      }

      if (!userData?.company_id) {
        setError("Kullanıcı bilgileri yüklenemedi");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching service request with ID:", id);
        const request = await getServiceRequest(id);
        
        if (request) {
          console.log("Service request found:", request);
          // Convert ServiceRequest to ServiceRequestFormData
          const formData: ServiceRequestFormData = {
            id: request.id,
            title: request.service_title || "",
            description: request.service_request_description || "",
            priority: request.service_priority || "medium",
            status: request.service_status || "new", 
            location: request.service_location || "",
            scheduled_date: request.service_due_date ? new Date(request.service_due_date).toISOString() : undefined,
            customer_id: request.customer_id,
            assigned_technician_id: request.assigned_technician,
            service_result: request.service_result || "",
          };
          setServiceRequest(formData);
        } else {
          setError("Servis talebi bulunamadı");
        }
      } catch (error) {
        console.error("Error fetching service request:", error);
        setError("Servis talebi yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRequest();
  }, [id, userData?.company_id, userLoading]); // getServiceRequest'i dependency'den çıkardık

  const handleClose = () => {
    navigate("/service?view=list");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main
          className={`flex-1 transition-all duration-300 ${
            isCollapsed ? "ml-[60px]" : "ml-64"
          }`}
        >
          <TopBar />
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Servis talebi yükleniyor...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main
          className={`flex-1 transition-all duration-300 ${
            isCollapsed ? "ml-[60px]" : "ml-64"
          }`}
        >
          <TopBar />
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Hata Oluştu</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Servis Listesine Dön
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!serviceRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main
          className={`flex-1 transition-all duration-300 ${
            isCollapsed ? "ml-[60px]" : "ml-64"
          }`}
        >
          <TopBar />
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Servis Talebi Bulunamadı</h2>
              <p className="text-gray-600 mb-4">Aradığınız servis talebi bulunamadı veya silinmiş olabilir.</p>
              <Button onClick={handleClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Servis Listesine Dön
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
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
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Servis Talebini Düzenle</h1>
                <p className="text-lg text-gray-600">Mevcut servis talebi bilgilerini güncelleyin ve düzenleyin</p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <ServiceRequestForm 
                onClose={handleClose}
                initialData={serviceRequest}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceRequestEdit;
