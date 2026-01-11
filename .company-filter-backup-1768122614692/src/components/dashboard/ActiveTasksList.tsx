import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Activity {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  type: string;
}

const ActiveTasksList = () => {
  const navigate = useNavigate();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["dashboard-active-tasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const companyId = user?.user_metadata?.company_id;

      if (!companyId) return [];

      const { data, error } = await supabase
        .from("activities")
        .select("id, title, status, priority, due_date, type")
        .eq("company_id", companyId)
        .in("status", ["todo", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);

      if (error) throw error;
      return data as Activity[];
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
      default:
        return priority;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Aktif Görevler
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={() => navigate("/activities")}
        >
          Tümünü Gör
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/activities?id=${activity.id}`)}
              >
                <div className="mt-0.5">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {activity.title}
                    </h4>
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${getPriorityColor(activity.priority)}`}
                    >
                      {getPriorityLabel(activity.priority)}
                    </Badge>
                  </div>
                  {activity.due_date && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(activity.due_date), "d MMM yyyy", { locale: tr })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aktif görev bulunmuyor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveTasksList;
