
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ServiceActivityForm } from "../ServiceActivityForm";
import { ServiceActivitiesList } from "../ServiceActivitiesList";
import { WarrantyInfo } from "../WarrantyInfo";

interface ActivityDialogProps {
  isOpen: boolean;
  selectedRequest: string | null;
  isActivityFormOpen: boolean;
  onOpenChange: (open: boolean) => void;
  setActivityFormOpen: (open: boolean) => void;
  onActivitySuccess: () => void;
  serviceRequests: any[];
}

export function ActivityDialog({
  isOpen,
  selectedRequest,
  isActivityFormOpen,
  onOpenChange,
  setActivityFormOpen,
  onActivitySuccess,
  serviceRequests
}: ActivityDialogProps) {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isActivityFormOpen ? "Yeni Servis Aktivitesi" : "Servis Aktiviteleri"}
          </DialogTitle>
        </DialogHeader>
        
        {selectedRequest && (
          <>
            {serviceRequests?.find(r => r.id === selectedRequest)?.equipment_id && (
              <WarrantyInfo 
                equipmentId={serviceRequests.find(r => r.id === selectedRequest)?.equipment_id} 
              />
            )}
            
            {isActivityFormOpen ? (
              <ServiceActivityForm
                serviceRequestId={selectedRequest}
                onClose={() => onOpenChange(false)}
                onSuccess={onActivitySuccess}
              />
            ) : (
              <>
                <ServiceActivitiesList serviceRequestId={selectedRequest} />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => setActivityFormOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Aktivite Ekle
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
