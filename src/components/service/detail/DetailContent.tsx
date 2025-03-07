
import React from "react";
import { Separator } from "@/components/ui/separator";
import { ServiceRequest } from "@/hooks/useServiceRequests";

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
  return (
    <div className="space-y-6">
      <StatusPrioritySection 
        status={status as any}
        setStatus={setStatus}
        priority={priority as any}
        setPriority={setPriority}
      />

      <TechnicianAssignment 
        assignedTo={assignedTo} 
        setAssignedTo={setAssignedTo} 
      />

      <RequestDates 
        createdAt={serviceRequest.created_at} 
        dueDate={serviceRequest.due_date}
      />

      <RequestMetadata 
        priority={serviceRequest.priority} 
        serviceType={serviceRequest.service_type}
      />

      <Separator />

      <RequestDescription description={serviceRequest.description} />
      
      <RequestLocation location={serviceRequest.location} />
      
      <CustomerInfo customerId={serviceRequest.customer_id} />
      
      <EquipmentInfo equipmentId={serviceRequest.equipment_id} />

      <Separator />

      <NotesSection notes={notes} setNotes={setNotes} />

      <ServiceActivitiesSection serviceRequestId={serviceRequest.id} />

      {serviceRequest.attachments && serviceRequest.attachments.length > 0 && (
        <>
          <Separator />
          <RequestAttachments attachments={serviceRequest.attachments} />
        </>
      )}

      <DetailActions 
        isPending={isPending}
        onSave={handleSave}
        onClose={onClose}
      />
    </div>
  );
};
