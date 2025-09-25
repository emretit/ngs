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
    <div className="space-y-4">
      {/* Main Metric with Animation */}
      <div className="text-center bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-lg p-4 backdrop-blur-sm">
        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
          {activityStats.total}
        </div>
        <div className="text-sm text-muted-foreground/80 font-medium">Toplam Aktivite</div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-3 border border-blue-200/20 dark:border-blue-800/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-blue-700 dark:text-blue-300">Toplantı</span>
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{activityStats.meeting}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/40 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-3 border border-purple-200/20 dark:border-purple-800/20 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <PenTool className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-purple-700 dark:text-purple-300">Analiz</span>
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{activityStats.analysis}</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50/80 to-yellow-100/40 dark:from-amber-950/30 dark:to-yellow-900/20 rounded-lg p-3 border border-amber-200/20 dark:border-amber-800/20 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-lg animate-pulse"></div>
            <span className="font-medium text-amber-700 dark:text-amber-300">Yapılacak</span>
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{activityStats.todo}</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50/80 to-emerald-100/40 dark:from-green-950/30 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200/20 dark:border-green-800/20 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-lg"></div>
            <span className="font-medium text-green-700 dark:text-green-300">Tamamlanan</span>
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{activityStats.completed}</div>
        </div>
      </div>
      
      {/* Enhanced Progress Indicator */}
      <div className="bg-gradient-to-r from-slate-50/50 to-gray-50/30 dark:from-slate-950/30 dark:to-gray-950/20 rounded-lg p-4 border border-slate-200/20 dark:border-slate-800/20">
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="font-medium text-muted-foreground">Tamamlanma Oranı</span>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {activityStats.total > 0 ? Math.round((activityStats.completed / activityStats.total) * 100) : 0}%
          </span>
        </div>
        <div className="relative w-full bg-muted/40 rounded-full h-3 shadow-inner">
          <div 
            className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 shadow-lg transition-all duration-1000 ease-out"
            style={{ width: `${activityStats.total > 0 ? (activityStats.completed / activityStats.total) * 100 : 0}%` }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 to-transparent"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md opacity-80"></div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
          <span>Başlangıç</span>
          <span>Hedef</span>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesSummary;