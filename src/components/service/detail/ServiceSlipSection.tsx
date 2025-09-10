import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { ServiceSlipData } from "@/types/service-slip";
import { ServiceSlipForm } from "../ServiceSlipForm";
import { FileText, Plus, Loader2 } from "lucide-react";

interface ServiceSlipSectionProps {
  serviceRequest: ServiceRequest;
  serviceSlip: ServiceSlipData | null;
  loadingSlip: boolean;
  onSlipUpdated: () => void;
}

export const ServiceSlipSection: React.FC<ServiceSlipSectionProps> = ({
  serviceRequest,
  serviceSlip,
  loadingSlip,
  onSlipUpdated
}) => {
  const [showServiceSlipForm, setShowServiceSlipForm] = useState(false);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Servis Fişi</Label>
          <div className="flex gap-2">
            {serviceSlip ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowServiceSlipForm(true)}
                disabled={loadingSlip}
              >
                <FileText className="h-4 w-4 mr-2" />
                Fişi Düzenle
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowServiceSlipForm(true)}
                disabled={loadingSlip}
              >
                {loadingSlip ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Servis Fişi Oluştur
              </Button>
            )}
          </div>
        </div>
        
        {serviceSlip && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Fiş No: {serviceSlip.slip_number}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                serviceSlip.status === 'completed' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                  : serviceSlip.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                {serviceSlip.status === 'completed' ? 'Tamamlandı' : 
                 serviceSlip.status === 'draft' ? 'Taslak' : 'İmzalandı'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Teknisyen: {serviceSlip.technician_name}
            </p>
            {serviceSlip.completion_date && (
              <p className="text-sm text-muted-foreground">
                Tamamlanma: {new Date(serviceSlip.completion_date).toLocaleDateString('tr-TR')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Service Slip Form */}
      <ServiceSlipForm
        serviceRequestId={serviceRequest.id}
        isOpen={showServiceSlipForm}
        onClose={() => {
          setShowServiceSlipForm(false);
          onSlipUpdated();
        }}
        existingSlip={serviceSlip}
      />
    </>
  );
};