import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Phone, Mail, FileText, TestTube, PenTool } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActivityStats {
  total: number;
  meeting: number;
  analysis: number;
  planning: number;
  documentation: number;
  testing: number;
  general: number;
  todo: number;
  in_progress: number;
  completed: number;
}

const ActivitiesSummary = () => {
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    total: 0,
    meeting: 0,
    analysis: 0,
    planning: 0,
    documentation: 0,
    testing: 0,
    general: 0,
    todo: 0,
    in_progress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityStats = async () => {
      try {
        setLoading(true);
        
        const { data: activities, error } = await supabase
          .from('activities')
          .select('type, status, priority');
          
        if (error) throw error;
        
        if (activities) {
          const stats: ActivityStats = {
            total: activities.length,
            meeting: 0,
            analysis: 0,
            planning: 0,
            documentation: 0,
            testing: 0,
            general: 0,
            todo: 0,
            in_progress: 0,
            completed: 0
          };
          
          activities.forEach(activity => {
            // Count by type
            if (stats.hasOwnProperty(activity.type)) {
              stats[activity.type as keyof ActivityStats]++;
            }
            
            // Count by status
            if (stats.hasOwnProperty(activity.status)) {
              stats[activity.status as keyof ActivityStats]++;
            }
          });
          
          setActivityStats(stats);
        }
      } catch (error) {
        console.error('Error fetching activity stats:', error);
        toast.error('Aktivite bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        <div className="h-6 bg-muted animate-pulse rounded"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted/60 animate-pulse rounded"></div>
          <div className="h-4 bg-muted/60 animate-pulse rounded"></div>
          <div className="h-4 bg-muted/60 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  // Veri yoksa da kartları göster

  return (
    <div className="space-y-4">
      {/* Main Metric - Sade */}
      <div className="text-center bg-gray-50 rounded-lg p-4">
        <div className="text-2xl font-bold text-gray-900">
          {activityStats.total}
        </div>
        <div className="text-sm text-gray-600 font-medium">Toplam Aktivite</div>
      </div>
      
      {/* Activity Status Grid - Gerçek Durumlar */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-700">Yapılacak</span>
          </div>
          <div className="text-lg font-bold text-red-600">{activityStats.todo}</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-yellow-700">Devam Ediyor</span>
          </div>
          <div className="text-lg font-bold text-yellow-600">{activityStats.in_progress}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">Tamamlandı</span>
          </div>
          <div className="text-lg font-bold text-green-600">{activityStats.completed}</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="font-medium text-gray-700">Ertelendi</span>
          </div>
          <div className="text-lg font-bold text-gray-600">{activityStats.postponed || 0}</div>
        </div>
      </div>
      
      {/* Progress Indicator - Sade */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="font-medium text-gray-700">Tamamlanma Oranı</span>
          <span className="font-bold text-lg text-gray-900">
            {activityStats.total > 0 ? Math.round((activityStats.completed / activityStats.total) * 100) : 0}%
          </span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-2">
          <div 
            className="absolute top-0 left-0 h-2 rounded-full bg-blue-500 transition-all duration-1000 ease-out"
            style={{ width: `${activityStats.total > 0 ? (activityStats.completed / activityStats.total) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Başlangıç</span>
          <span>Hedef</span>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesSummary;