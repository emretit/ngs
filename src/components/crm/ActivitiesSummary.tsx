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

  if (activityStats.total === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Henüz aktivite yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Metric */}
      <div className="text-center">
        <div className="text-2xl font-bold text-foreground">{activityStats.total}</div>
        <div className="text-xs text-muted-foreground">Toplam</div>
      </div>
      
      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-3 w-3" />
            <span>Toplantı</span>
          </div>
          <div className="font-semibold">{activityStats.meeting}</div>
        </div>
        
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <PenTool className="h-3 w-3" />
            <span>Analiz</span>
          </div>
          <div className="font-semibold">{activityStats.analysis}</div>
        </div>
        
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span>Yapılacak</span>
          </div>
          <div className="font-semibold">{activityStats.todo}</div>
        </div>
        
        <div className="bg-muted/30 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Bitti</span>
          </div>
          <div className="font-semibold">{activityStats.completed}</div>
        </div>
      </div>
      
      {/* Progress Indicator */}
      <div className="bg-muted/30 rounded p-2">
        <div className="flex justify-between text-xs mb-1">
          <span>Tamamlanma</span>
          <span className="font-semibold">{activityStats.total > 0 ? Math.round((activityStats.completed / activityStats.total) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${activityStats.total > 0 ? (activityStats.completed / activityStats.total) * 100 : 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesSummary;