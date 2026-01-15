import { Bell, BellRing } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import NotificationListWithFilters from "./NotificationListWithFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { cn } from "@/lib/utils";

const NotificationCenter = () => {
  // Setup realtime notifications
  useRealtimeNotifications();
  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    refetchInterval: false, // Use realtime subscriptions instead
  });

  const hasUnread = unreadCount && unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative transition-all duration-200",
            hasUnread && "hover:bg-primary/10"
          )}
        >
          {hasUnread ? (
            <BellRing className="h-5 w-5 animate-pulse text-primary" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {hasUnread && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold",
                "animate-in zoom-in-50 fade-in-0 duration-200",
                "ring-2 ring-background"
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] p-0 shadow-lg border-2" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center gap-2">
            <div className="relative">
              {hasUnread ? (
                <BellRing className="h-4 w-4 text-primary" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </div>
            <h3 className="font-semibold text-sm">Bildirimler</h3>
          </div>
          {hasUnread && (
            <Badge 
              variant="destructive" 
              className="text-xs h-5 px-1.5 animate-in fade-in-0 zoom-in-95 duration-200"
            >
              {unreadCount} okunmamış
            </Badge>
          )}
        </div>
        
        {/* Content */}
        <ScrollArea className="h-[500px]">
          <NotificationListWithFilters />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
