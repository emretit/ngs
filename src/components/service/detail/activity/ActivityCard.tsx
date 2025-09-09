
import React from "react";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle 
} from "@/components/ui/card";
import { ActivityMetadata } from "./ActivityMetadata";
import { ActivityMaterials } from "./ActivityMaterials";
import { 
  getActivityStatusColor, 
  getActivityStatusIcon, 
  getActivityStatusText 
} from "../../utils/activityUtils";

interface ServiceMaterial {
  name: string;
  quantity: number;
  unit: string;
}

interface ActivityCardProps {
  activity: {
    id: string;
    activity_type: string;
    description: string;
    location: string;
    labor_hours: number;
    materials_used: ServiceMaterial[];
    start_time: string;
    status: string;
    performed_by?: string;
    employees?: {
      first_name: string;
      last_name: string;
    };
  };
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  return (
    <Card key={activity.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">
              {activity.activity_type}
            </CardTitle>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getActivityStatusColor(activity.status)} flex items-center gap-1`}
          >
            {getActivityStatusIcon(activity.status)}
            {getActivityStatusText(activity.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 whitespace-pre-wrap">{activity.description}</p>
        
        <ActivityMetadata 
          startTime={activity.start_time}
          laborHours={activity.labor_hours}
          location={activity.location}
          employee={activity.employees}
        />

        <ActivityMaterials materials={activity.materials_used} />
      </CardContent>
    </Card>
  );
};
