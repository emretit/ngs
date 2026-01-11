import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Activity,
  FileText,
  Users,
  Package,
  Target,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ActivityLog {
  id: string;
  title: string;
  type: string;
  created_at: string;
}

const RecentActivitiesTimeline = () => {
  const navigate = useNavigate();
  const { userData, loading: userLoading } = useCurrentUser();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["dashboard-recent-activities", userData?.employee_id],
    queryFn: async () => {
      if (!userData?.company_id || !userData?.employee_id) return [];

      const { data, error } = await supabase
        .from("activities")
        .select("id, title, type, created_at")
        
        .eq("assignee_id", userData.employee_id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!userData?.company_id && !!userData?.employee_id && !userLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "call":
        return <Activity className="h-4 w-4" />;
      case "task":
        return <FileText className="h-4 w-4" />;
      case "proposal":
        return <Target className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400";
      case "call":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
      case "task":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400";
      case "proposal":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400";
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "meeting":
        return "Toplantı";
      case "call":
        return "Arama";
      case "task":
        return "Görev";
      case "proposal":
        return "Teklif";
      case "general":
        return "Genel";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-2">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="truncate">Son Aktiviteler</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 sm:h-8 gap-1 px-2 sm:px-3 shrink-0"
          onClick={() => navigate("/activities")}
        >
          <span className="hidden sm:inline">Tümünü Gör</span>
          <span className="sm:hidden">Tümü</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {isLoading || userLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 sm:h-14 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-px bg-border" />
            
            <div className="space-y-3 sm:space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="relative flex items-start gap-2 sm:gap-4 group cursor-pointer"
                  onClick={() => navigate(`/activities?id=${activity.id}`)}
                >
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0 ${getActivityColor(activity.type)}`}>
                    <div className="scale-75 sm:scale-100">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-medium line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors">
                        {activity.title}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs shrink-0 ml-1"
                      >
                        {getActivityLabel(activity.type)}
                      </Badge>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <Activity className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 opacity-20" />
            <p className="text-xs sm:text-sm">Henüz aktivite bulunmuyor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(RecentActivitiesTimeline);
