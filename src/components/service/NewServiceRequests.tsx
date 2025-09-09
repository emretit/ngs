
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import { AlertCircle, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTechnicianNames } from "./hooks/useTechnicianNames";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface NewServiceRequestsProps {
  onSelectRequest: (request: ServiceRequest) => void;
}

export const NewServiceRequests: React.FC<NewServiceRequestsProps> = ({ onSelectRequest }) => {
  const { data: serviceRequests, isLoading } = useServiceRequests();
  const { getTechnicianName } = useTechnicianNames();

  // Filter only "new" service requests
  const newRequests = React.useMemo(() => {
    if (!serviceRequests) return [];
    return serviceRequests
      .filter(request => request.status === "new")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [serviceRequests]);

  // Format time ago
  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-purple-500" />
            Yeni Servis Talepleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 border rounded-md">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (newRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-purple-500" />
            Yeni Servis Talepleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <p>Yeni servis talebi bulunmamaktadır.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <AlertCircle className="h-5 w-5 mr-2 text-purple-500" />
          Yeni Servis Talepleri
          <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium rounded-full px-2 py-0.5">
            {newRequests.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {newRequests.map(request => (
          <div 
            key={request.id}
            className="p-3 border border-gray-200 rounded-md hover:border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer"
            onClick={() => onSelectRequest(request)}
          >
            <h3 className="font-medium text-sm line-clamp-1">{request.title}</h3>
            
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatTimeAgo(request.created_at)}</span>
            </div>
            
            {request.assigned_to && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <User className="h-3 w-3 mr-1" />
                <span>{getTechnicianName(request.assigned_to)}</span>
              </div>
            )}
            
            <div className="mt-3 flex justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRequest(request);
                }}
              >
                Detaylar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
