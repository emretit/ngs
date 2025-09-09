
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TableBody, Table } from "@/components/ui/table";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ServiceTableHeader from "./table/ServiceTableHeader";
import ServiceTableRow from "./table/ServiceTableRow";
import { EmptyState, LoadingState } from "./table/ServiceTableStates";
import { useTechnicianNames } from "./hooks/useTechnicianNames";
import { useServiceTableState } from "./hooks/useServiceTableState";

interface ServiceRequestTableProps {
  searchQuery: string;
  statusFilter: string | null;
  technicianFilter: string | null;
  onSelectRequest: (request: ServiceRequest) => void;
}

export function ServiceRequestTable({ 
  searchQuery, 
  statusFilter, 
  technicianFilter,
  onSelectRequest
}: ServiceRequestTableProps) {
  const { data: serviceRequests, isLoading } = useServiceRequests();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getTechnicianName } = useTechnicianNames();
  
  // Use the new hook for state management and filtering logic
  const { 
    filteredRequests, 
    sortField, 
    sortDirection, 
    handleSort 
  } = useServiceTableState({
    serviceRequests,
    searchQuery,
    statusFilter,
    technicianFilter
  });

  // Delete service request
  const deleteServiceRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_requests")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({
        title: "Servis talebi silindi",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error deleting service request:", error);
      toast({
        title: "Hata",
        description: "Servis talebi silinemedi",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!filteredRequests.length) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-md border overflow-hidden">
      <Table>
        <ServiceTableHeader 
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
        />
        <TableBody>
          {filteredRequests.map((request) => (
            <ServiceTableRow
              key={request.id}
              request={request}
              onSelectRequest={onSelectRequest}
              onDeleteRequest={(id) => deleteServiceRequest.mutate(id)}
              getTechnicianName={getTechnicianName}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
