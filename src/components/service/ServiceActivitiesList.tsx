
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ServiceActivity } from "@/components/service/types/serviceActivity";
import { ActivityCard } from "./detail/activity/ActivityCard";

interface ServiceActivitiesListProps {
  serviceRequestId: string;
}

export const ServiceActivitiesList: React.FC<ServiceActivitiesListProps> = ({ 
  serviceRequestId 
}) => {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["service-activities", serviceRequestId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("service_activities")
          .select(`
            *,
            materials_used,
            technician:employee_id (id, first_name, last_name, avatar_url),
            employees:employees(first_name, last_name)
          `)
          .eq("service_request_id", serviceRequestId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Type assertion with unknown in between to avoid type error
        return (data || []) as unknown as ServiceActivity[];
      } catch (error) {
        console.error("Error fetching service activities:", error);
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-red-500">Error loading activities: {(error as Error).message}</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-gray-500">No activities recorded for this service request yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
};
