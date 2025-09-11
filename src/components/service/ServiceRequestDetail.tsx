
import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ServiceRequest, ServiceStatus, ServicePriority } from "@/hooks/useServiceRequests";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Import refactored components
import { RequestHeader } from "./detail/RequestHeader";
import { DetailContent } from "./detail/DetailContent";
import { ModernDetailContent } from "./detail/ModernDetailContent";

interface ServiceRequestDetailProps {
  serviceRequest: ServiceRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceRequestDetail({ serviceRequest, isOpen, onClose }: ServiceRequestDetailProps) {
  const [status, setStatus] = useState<ServiceStatus>("new");
  const [priority, setPriority] = useState<ServicePriority>("medium");
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (serviceRequest) {
      setStatus(serviceRequest.status as ServiceStatus);
      setPriority(serviceRequest.priority as ServicePriority);
      setAssignedTo(serviceRequest.assigned_to || '');
      setNotes(Array.isArray(serviceRequest.notes) ? serviceRequest.notes.join("\n") : serviceRequest.technician_notes || "");
    }
  }, [serviceRequest]);

  // Update service request
  const updateServiceRequest = useMutation({
    mutationFn: async () => {
      if (!serviceRequest) return;

      const notesArray = notes
        .split("\n")
        .filter(line => line.trim() !== "");

      const { error } = await supabase
        .from("service_requests")
        .update({
          status,
          priority,
          assigned_to: assignedTo,
          notes: notesArray
        })
        .eq("id", serviceRequest.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Servis talebi güncellendi",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error updating service request:", error);
      toast({
        title: "Hata",
        description: "Servis talebi güncellenemedi",
        variant: "destructive",
      });
    },
  });

  if (!serviceRequest) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[900px] overflow-y-auto">
        <ModernDetailContent 
          serviceRequest={serviceRequest}
          status={status}
          setStatus={setStatus}
          priority={priority}
          setPriority={setPriority}
          assignedTo={assignedTo}
          setAssignedTo={setAssignedTo}
          notes={notes}
          setNotes={setNotes}
          handleSave={() => updateServiceRequest.mutate()}
          isPending={updateServiceRequest.isPending}
          onClose={onClose}
        />
      </SheetContent>
    </Sheet>
  );
}
