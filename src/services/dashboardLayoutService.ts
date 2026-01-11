import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { Layout } from 'react-grid-layout';

export interface DashboardLayoutData {
  id: string;
  user_id: string;
  company_id: string;
  layout_name: string;
  layout_config: Layout[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Save dashboard layout to database
 */
export async function saveLayout(
  userId: string,
  companyId: string,
  layouts: Layout[],
  layoutName: string = 'default'
): Promise<{ data: DashboardLayoutData | null; error: Error | null }> {
  try {
    // Check if layout already exists
    const { data: existing } = await supabase
      .from('user_dashboard_layouts')
      .select('id')
      .eq('user_id', userId)
      
      .eq('layout_name', layoutName)
      .single();

    let result;

    if (existing) {
      // Update existing layout
      result = await supabase
        .from('user_dashboard_layouts')
        .update({
          layout_config: layouts,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new layout
      result = await supabase
        .from('user_dashboard_layouts')
        .insert({
          user_id: userId,
          company_id: companyId,
          layout_name: layoutName,
          layout_config: layouts,
          is_active: true,
        })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    return { data: result.data as DashboardLayoutData, error: null };
  } catch (error) {
    logger.error('Error saving dashboard layout:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Load dashboard layout from database
 */
export async function loadLayout(
  userId: string,
  companyId: string,
  layoutName: string = 'default'
): Promise<{ data: Layout[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_dashboard_layouts')
      .select('layout_config')
      .eq('user_id', userId)
      
      .eq('layout_name', layoutName)
      .eq('is_active', true)
      .single();

    if (error) {
      // If no layout found, return null (not an error)
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      throw error;
    }

    return { data: data.layout_config as Layout[], error: null };
  } catch (error) {
    logger.error('Error loading dashboard layout:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all layouts for a user
 */
export async function getAllLayouts(
  userId: string,
  companyId: string
): Promise<{ data: DashboardLayoutData[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_dashboard_layouts')
      .select('*')
      .eq('user_id', userId)
      
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data as DashboardLayoutData[], error: null };
  } catch (error) {
    logger.error('Error getting all layouts:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a layout
 */
export async function deleteLayout(
  layoutId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('user_dashboard_layouts')
      .delete()
      .eq('id', layoutId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error deleting layout:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Set layout as active
 */
export async function setActiveLayout(
  userId: string,
  companyId: string,
  layoutName: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // First, deactivate all layouts for this user
    await supabase
      .from('user_dashboard_layouts')
      .update({ is_active: false })
      .eq('user_id', userId)
      ;

    // Then activate the specified layout
    const { error } = await supabase
      .from('user_dashboard_layouts')
      .update({ is_active: true })
      .eq('user_id', userId)
      
      .eq('layout_name', layoutName);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error setting active layout:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Reset to default layout (delete user's custom layout)
 */
export async function resetToDefaultLayout(
  userId: string,
  companyId: string,
  layoutName: string = 'default'
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('user_dashboard_layouts')
      .delete()
      .eq('user_id', userId)
      
      .eq('layout_name', layoutName);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    logger.error('Error resetting layout:', error);
    return { success: false, error: error as Error };
  }
}
