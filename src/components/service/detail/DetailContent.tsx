
import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { ServiceSlipData } from "@/types/service-slip";
import { ServiceSlipService } from "@/services/serviceSlipService";
import { ServiceRequestAttachment } from "@/hooks/service/types";

// Import refactored components
import { StatusPrioritySection } from "./StatusPrioritySection";
import { TechnicianAssignment } from "./TechnicianAssignment";
import { RequestDates } from "./RequestDates";
import { RequestMetadata } from "./RequestMetadata";
import { RequestDescription } from "./RequestDescription";
import { RequestLocation } from "./RequestLocation";
import { CustomerInfo } from "./CustomerInfo";
import { EquipmentInfo } from "./EquipmentInfo";
import { ServiceActivitiesSection } from "./ServiceActivitiesSection";
import { RequestAttachments } from "./RequestAttachments";
import { NotesSection } from "./NotesSection";
import { DetailActions } from "./DetailActions";
import { ServiceSlipSection } from "./ServiceSlipSection";

interface DetailContentProps {
  serviceRequest: ServiceRequest;
  status: string;
  setStatus: (status: any) => void;
  priority: string;
  setPriority: (priority: any) => void;
  assignedTo: string | undefined;
  setAssignedTo: (id: string | undefined) => void;
  notes: string;
  setNotes: (notes: string) => void;
  handleSave: () => void;
  isPending: boolean;
  onClose: () => void;
}

export const DetailContent: React.FC<DetailContentProps> = ({
  serviceRequest,
  status,
  setStatus,
  priority,
  setPriority,
  assignedTo,
  setAssignedTo,
  notes,
  setNotes,
  handleSave,
  isPending,
  onClose
}) => {
  const [serviceSlip, setServiceSlip] = useState<ServiceSlipData | null>(null);
  const [loadingSlip, setLoadingSlip] = useState(false);

  // Load existing service slip
  useEffect(() => {
    const loadServiceSlip = async () => {
      try {
        setLoadingSlip(true);
        const slip = await ServiceSlipService.getServiceSlipByRequestId(serviceRequest.id);
        setServiceSlip(slip);
      } catch (error) {
        console.error('Error loading service slip:', error);
      } finally {
        setLoadingSlip(false);
      }
    };

    if (serviceRequest.id) {
      loadServiceSlip();
    }
  }, [serviceRequest.id]);

  const refreshServiceSlip = async () => {
    try {
      const slip = await ServiceSlipService.getServiceSlipByRequestId(serviceRequest.id);
      setServiceSlip(slip);
    } catch (error) {
      console.error('Error refreshing service slip:', error);
    }
  };
  return (
    <div className="space-y-4">
      {/* Üst Kısım - Durum ve Kontroller */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <StatusPrioritySection 
            status={status as any}
            setStatus={setStatus}
            priority={priority as any}
            setPriority={setPriority}
          />
        </div>
        <div>
          <TechnicianAssignment 
            assignedTo={assignedTo} 
            setAssignedTo={setAssignedTo} 
          />
        </div>
      </div>

      {/* Tarih ve Metadata Kompakt */}
      <div className="grid grid-cols-2 gap-3">
        <RequestDates 
          createdAt={serviceRequest.created_at} 
          dueDate={serviceRequest.due_date}
        />
        <RequestMetadata 
          priority={serviceRequest.priority} 
          status={serviceRequest.status}
        />
      </div>

      <Separator className="my-3" />

      {/* Ana İçerik Bölümü */}
      <div className="space-y-3">
        <RequestDescription description={serviceRequest.description} />
        
        <div className="grid grid-cols-2 gap-3">
          <RequestLocation location={serviceRequest.location} />
          <CustomerInfo customerId={serviceRequest.customer_id} />
        </div>
        
        {serviceRequest.equipment_id && (
          <EquipmentInfo equipmentId={serviceRequest.equipment_id} />
        )}
      </div>

      <Separator className="my-3" />

      {/* Service Slip Section */}
      <ServiceSlipSection 
        serviceRequest={serviceRequest}
        serviceSlip={serviceSlip}
        loadingSlip={loadingSlip}
        onSlipUpdated={refreshServiceSlip}
      />

      <Separator className="my-3" />

      {/* Notlar ve Geçmiş */}
      <div className="space-y-3">
        <NotesSection notes={notes} setNotes={setNotes} />
        <ServiceActivitiesSection serviceRequestId={serviceRequest.id} />
      </div>

      {serviceRequest.attachments && Array.isArray(serviceRequest.attachments) && serviceRequest.attachments.length > 0 && (
        <>
          <Separator className="my-3" />
          <RequestAttachments attachments={serviceRequest.attachments as unknown as ServiceRequestAttachment[]} />
        </>
      )}

      <Separator className="my-3" />
      
      <DetailActions 
        isPending={isPending}
        onSave={handleSave}
        onClose={onClose}
      />
    </div>
  );
};
