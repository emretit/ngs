import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, User, AlertCircle, CheckCircle, UserPlus, Edit, Plus, MessageSquare } from "lucide-react";
import { useServiceHistory, ServiceHistoryItem } from "@/hooks/service/useServiceHistory";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ServiceHistoryProps {
  serviceRequestId?: string;
}

const getActionIcon = (actionType: ServiceHistoryItem['action_type']) => {
  switch (actionType) {
    case 'created':
      return <Plus className="h-3 w-3 text-green-600" />;
    case 'status_changed':
      return <AlertCircle className="h-3 w-3 text-blue-600" />;
    case 'assigned':
      return <UserPlus className="h-3 w-3 text-purple-600" />;
    case 'updated':
      return <Edit className="h-3 w-3 text-orange-600" />;
    case 'comment_added':
      return <MessageSquare className="h-3 w-3 text-teal-600" />;
    default:
      return <Clock className="h-3 w-3 text-gray-600" />;
  }
};

const getActionColor = (actionType: ServiceHistoryItem['action_type']) => {
  switch (actionType) {
    case 'created':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'status_changed':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'assigned':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    case 'updated':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'comment_added':
      return 'bg-teal-50 border-teal-200 text-teal-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

const getActionTypeText = (actionType: ServiceHistoryItem['action_type']) => {
  switch (actionType) {
    case 'created':
      return 'Oluşturuldu';
    case 'status_changed':
      return 'Durum Değişti';
    case 'assigned':
      return 'Atandı';
    case 'updated':
      return 'Güncellendi';
    case 'comment_added':
      return 'Yorum Eklendi';
    default:
      return 'Bilinmeyen İşlem';
  }
};

export const ServiceHistory: React.FC<ServiceHistoryProps> = ({ serviceRequestId }) => {
  const { data: historyItems = [], isLoading, error } = useServiceHistory(serviceRequestId || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 animate-spin" />
          <span className="text-sm">Geçmiş yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Geçmiş yüklenirken hata oluştu</span>
        </div>
      </div>
    );
  }

  if (!serviceRequestId) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <div className="text-center">
          <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Geçmişi görüntülemek için bir servis seçin</p>
        </div>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground">
        <div className="text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Henüz geçmiş kaydı bulunmuyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/10 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          {historyItems.length} kayıt
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {historyItems.map((item, index) => (
          <div key={item.id} className="relative">
            {/* Timeline line */}
            {index < historyItems.length - 1 && (
              <div className="absolute left-2 top-6 w-0.5 h-8 bg-gray-200" />
            )}
            
            <div className="flex gap-2">
              {/* Icon */}
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center mt-0.5">
                {getActionIcon(item.action_type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1 py-0 h-4 ${getActionColor(item.action_type)}`}
                  >
                    {getActionTypeText(item.action_type)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { 
                      addSuffix: true,
                      locale: tr 
                    })}
                  </span>
                </div>
                
                <p className="text-xs text-gray-900 mb-1">
                  {item.description}
                </p>
                
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <User className="h-2 w-2" />
                  <span>{item.user_name}</span>
                  <span>•</span>
                  <span>{format(new Date(item.created_at), "dd MMM, HH:mm", { locale: tr })}</span>
                </div>
                    
                {/* Old/New values for updates - sadece gerektiğinde göster */}
                {(item.old_value || item.new_value) && (
                  <div className="mt-1 p-1 bg-gray-50 rounded text-[10px] max-w-full">
                    {item.new_value && (
                      <div className="text-green-700 truncate">
                        <span className="font-medium">Yeni:</span> {JSON.stringify(item.new_value).substring(0, 100)}...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};