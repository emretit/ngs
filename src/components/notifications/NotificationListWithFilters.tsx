import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Info,
  AlertCircle,
  X,
  Clock,
  Bell,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data: any;
}

const NotificationListWithFilters = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      toast({
        title: "Bildirim silindi",
        description: "Bildirim başarıyla silindi",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      toast({
        title: "Tümü okundu olarak işaretlendi",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      toast({
        title: "Tüm bildirimler silindi",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const renderNotificationItem = (notification: Notification) => (
    <div
      key={notification.id}
      className={`group relative p-3 rounded-lg transition-colors cursor-pointer ${
        notification.is_read
          ? "hover:bg-accent/50"
          : "bg-primary/5 hover:bg-primary/10"
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium line-clamp-1">
              {notification.title}
            </h4>
            {!notification.is_read && (
              <Badge
                variant="default"
                className="h-2 w-2 p-0 rounded-full shrink-0"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            deleteNotificationMutation.mutate(notification.id);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">Bildirim bulunmuyor</p>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);
  const successNotifications = notifications.filter((n) => n.type === "success");
  const errorNotifications = notifications.filter((n) => n.type === "error");
  const warningNotifications = notifications.filter((n) => n.type === "warning");
  const infoNotifications = notifications.filter((n) => n.type === "info" || !n.type);

  return (
    <div className="p-2">
      {/* Action Buttons */}
      <div className="px-2 pb-2 mb-2 border-b flex items-center gap-2">
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => markAllAsReadMutation.mutate()}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Tümünü Okundu İşaretle
          </Button>
        )}
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => clearAllMutation.mutate()}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Tümünü Sil
          </Button>
        )}
      </div>

      {/* Filtered Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-5 mb-2">
          <TabsTrigger value="all" className="text-xs">
            Tümü
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs">
            Okunmamış
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="success" className="text-xs">
            Başarılı
            {successNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {successNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="error" className="text-xs">
            Hata
            {errorNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {errorNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs">
            Bilgi
            {infoNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {infoNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-1 mt-2">
          {notifications.map(renderNotificationItem)}
        </TabsContent>

        <TabsContent value="unread" className="space-y-1 mt-2">
          {unreadNotifications.length > 0 ? (
            unreadNotifications.map(renderNotificationItem)
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Okunmamış bildirim yok</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="success" className="space-y-1 mt-2">
          {successNotifications.length > 0 ? (
            successNotifications.map(renderNotificationItem)
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Başarı bildirimi yok</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="error" className="space-y-1 mt-2">
          {errorNotifications.length > 0 ? (
            errorNotifications.map(renderNotificationItem)
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Hata bildirimi yok</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-1 mt-2">
          {infoNotifications.length > 0 ? (
            infoNotifications.map(renderNotificationItem)
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Bilgi bildirimi yok</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationListWithFilters;
