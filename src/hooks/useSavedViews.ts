/**
 * useSavedViews Hook
 * Saved report views CRUD işlemleri
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthContext";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import type { SavedView, ReportCategory, GlobalFilters, ReportBlockConfig } from "@/types/salesReports";
import { toast } from "sonner";

/**
 * List saved views for a report type
 */
export function useSavedViews(reportType: ReportCategory) {
  const { user } = useAuth();
  const { companyId } = useCurrentCompany();
  const queryClient = useQueryClient();

  const { data: views, isLoading } = useQuery({
    queryKey: ['saved-views', reportType, user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return [];

      const { data, error } = await supabase
        .from('saved_report_views')
        .select('*')
        .eq('user_id', user.id)
        
        .eq('report_type', reportType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SavedView[];
    },
    enabled: !!user?.id && !!companyId,
  });

  const saveViewMutation = useMutation({
    mutationFn: async (viewData: {
      viewName: string;
      layoutConfig: { reportBlocks: ReportBlockConfig[] };
      filters: GlobalFilters;
      reportOrder: string[];
      isDefault?: boolean;
    }) => {
      if (!user?.id || !companyId) throw new Error('User or company not found');

      // If this is set as default, unset other defaults
      if (viewData.isDefault) {
        await supabase
          .from('saved_report_views')
          .update({ is_default: false })
          .eq('user_id', user.id)
          
          .eq('report_type', reportType);
      }

      const { data, error } = await supabase
        .from('saved_report_views')
        .insert({
          user_id: user.id,
          company_id: companyId,
          view_name: viewData.viewName,
          report_type: reportType,
          layout_config: viewData.layoutConfig,
          filters: viewData.filters,
          report_order: viewData.reportOrder,
          is_default: viewData.isDefault || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SavedView;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', reportType] });
      toast.success('Görünüm kaydedildi');
    },
    onError: (error: any) => {
      toast.error('Görünüm kaydedilemedi: ' + (error.message || 'Bilinmeyen hata'));
    },
  });

  const updateViewMutation = useMutation({
    mutationFn: async ({
      viewId,
      updates,
    }: {
      viewId: string;
      updates: Partial<{
        viewName: string;
        layoutConfig: { reportBlocks: ReportBlockConfig[] };
        filters: GlobalFilters;
        reportOrder: string[];
        isDefault: boolean;
      }>;
    }) => {
      if (!user?.id) throw new Error('User not found');

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        await supabase
          .from('saved_report_views')
          .update({ is_default: false })
          .eq('user_id', user.id)
          
          .eq('report_type', reportType)
          .neq('id', viewId);
      }

      const updateData: any = {};
      if (updates.viewName !== undefined) updateData.view_name = updates.viewName;
      if (updates.layoutConfig !== undefined) updateData.layout_config = updates.layoutConfig;
      if (updates.filters !== undefined) updateData.filters = updates.filters;
      if (updates.reportOrder !== undefined) updateData.report_order = updates.reportOrder;
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

      const { data, error } = await supabase
        .from('saved_report_views')
        .update(updateData)
        .eq('id', viewId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as SavedView;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', reportType] });
      toast.success('Görünüm güncellendi');
    },
    onError: (error: any) => {
      toast.error('Görünüm güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    },
  });

  const deleteViewMutation = useMutation({
    mutationFn: async (viewId: string) => {
      if (!user?.id) throw new Error('User not found');

      const { error } = await supabase
        .from('saved_report_views')
        .delete()
        .eq('id', viewId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', reportType] });
      toast.success('Görünüm silindi');
    },
    onError: (error: any) => {
      toast.error('Görünüm silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    },
  });

  const loadView = async (viewId: string): Promise<SavedView | null> => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('saved_report_views')
      .select('*')
      .eq('id', viewId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      toast.error('Görünüm yüklenemedi');
      return null;
    }

    return data as SavedView;
  };

  const getDefaultView = (): SavedView | undefined => {
    return views?.find(v => v.isDefault);
  };

  return {
    views: views || [],
    isLoading,
    saveView: saveViewMutation.mutate,
    updateView: updateViewMutation.mutate,
    deleteView: deleteViewMutation.mutate,
    loadView,
    getDefaultView,
    isSaving: saveViewMutation.isPending,
    isUpdating: updateViewMutation.isPending,
    isDeleting: deleteViewMutation.isPending,
  };
}

