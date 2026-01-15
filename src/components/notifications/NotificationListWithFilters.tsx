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
  Wrench,
  UserPlus,
  FileText,
  ShoppingCart,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { useState } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data: any;
  service_request_id?: string;
  technician_id?: string;
  customer_id?: string;
}

const NotificationListWithFilters = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);

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
      setIsDeleteDialogOpen(false);
      setNotificationToDelete(null);
    },
    onError: () => {
      setIsDeleteDialogOpen(false);
      setNotificationToDelete(null);
    },
  });

  const handleDeleteClick = (notification: Notification) => {
    setNotificationToDelete(notification);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (notificationToDelete) {
      deleteNotificationMutation.mutate(notificationToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

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
        description: "Tüm bildirimler okundu olarak işaretlendi",
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
        description: "Tüm bildirimler başarıyla silindi",
      });
    },
  });

  const getNotificationIcon = (type: string, data?: any) => {
    // Özel bildirim tipleri için özel iconlar
    if (type === "service_assignment") {
      return <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
    if (type === "customer_assigned" || type === "employee_assigned") {
      return <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
    }
    if (type === "proposal" || type === "invoice") {
      return <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    }
    if (type === "order" || type === "purchase") {
      return <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
    }
    if (type === "message" || type === "comment") {
      return <MessageSquare className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
    }

    // Genel tipler
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    if (type === "service_assignment") {
      return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20";
    }
    if (type === "success") {
      return "border-l-green-500 bg-green-50/50 dark:bg-green-950/20";
    }
    if (type === "error") {
      return "border-l-red-500 bg-red-50/50 dark:bg-red-950/20";
    }
    if (type === "warning") {
      return "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20";
    }
    return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20";
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Bildirim tipine göre yönlendirme
    if (notification.service_request_id) {
      navigate(`/service/detail/${notification.service_request_id}`);
    } else if (notification.data?.action === "open_service_request" && notification.data?.service_request_id) {
      navigate(`/service/detail/${notification.data.service_request_id}`);
    }
  };

  const renderNotificationItem = (notification: Notification, index: number) => (
    <div
      key={notification.id}
      className={cn(
        "group relative border-l-3 rounded-r-lg transition-all duration-200 cursor-pointer",
        "hover:shadow-sm",
        notification.is_read
          ? "bg-muted/30 hover:bg-muted/50 border-l-muted"
          : cn(
              "bg-background hover:bg-muted/30",
              getNotificationColor(notification.type)
            ),
        "animate-in fade-in-0 slide-in-from-right-2 duration-300"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start gap-2.5 p-3">
        <div className={cn(
          "mt-0.5 flex-shrink-0",
          !notification.is_read && "animate-pulse"
        )}>
          {getNotificationIcon(notification.type, notification.data)}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-xs font-semibold line-clamp-1",
              !notification.is_read && "text-foreground"
            )}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.is_read && (
                <Badge
                  variant="default"
                  className="h-1.5 w-1.5 p-0 rounded-full animate-pulse"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(notification);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
            {notification.body}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
            {notification.service_request_id && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                Servis
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="animate-pulse border-l-3 border-l-muted rounded-r-lg bg-muted/30 p-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="h-4 w-4 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2.5 bg-muted rounded w-full" />
                <div className="h-2.5 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <h4 className="font-semibold text-xs mb-1">Bildirim bulunmuyor</h4>
        <p className="text-[10px] text-muted-foreground">
          Yeni bildirimler burada görünecek
        </p>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="p-2.5">
      {/* Action Buttons */}
      {(unreadNotifications.length > 0 || notifications.length > 0) && (
        <div className="px-2 pb-2.5 mb-2.5 border-b flex items-center gap-1.5">
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[10px] h-7"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1.5" />
              Tümünü Okundu İşaretle
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-[10px] h-7 text-destructive hover:text-destructive"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Tümünü Sil
            </Button>
          )}
        </div>
      )}

      {/* Filtered Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-2.5 h-auto p-0.5 gap-0.5">
          <TabsTrigger 
            value="all" 
            className="text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 min-h-[32px]"
          >
            <span>Tümü</span>
            {notifications.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 leading-none shrink-0">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="unread" 
            className="text-xs px-2 py-1.5 flex items-center justify-center gap-1.5 min-h-[32px]"
          >
            <span>Okunmamış</span>
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 leading-none shrink-0">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-1.5 mt-0">
          {notifications.map((notification, index) => 
            renderNotificationItem(notification, index)
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-1.5 mt-0">
          {unreadNotifications.length > 0 ? (
            unreadNotifications.map((notification, index) => 
              renderNotificationItem(notification, index)
            )
          ) : (
            <EmptyState icon={CheckCircle2} message="Okunmamış bildirim yok" />
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Bildirimi Sil"
        description={
          notificationToDelete
            ? `"${notificationToDelete.title}" bildirimini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu bildirimi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteNotificationMutation.isPending}
      />
    </div>
  );
};

export default NotificationListWithFilters;
