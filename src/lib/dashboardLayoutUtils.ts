const STORAGE_KEY = 'dashboard-layout';

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DashboardLayout {
  layouts: LayoutItem[];
  version: number;
  lastUpdated: string;
}

// Default layout configuration
export const DEFAULT_LAYOUT: LayoutItem[] = [
  // Metrics KPI - Full width at top
  { i: 'metrics-kpi', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },

  // AI Panel - Full width
  { i: 'ai-panel', x: 0, y: 2, w: 12, h: 4, minW: 6, minH: 3 },

  // Recent Activities - Left column
  { i: 'recent-activities', x: 0, y: 6, w: 8, h: 4, minW: 4, minH: 3 },

  // CRM Summary - Right column
  { i: 'crm-summary', x: 8, y: 6, w: 4, h: 3, minW: 4, minH: 3 },

  // HR Summary - Right column
  { i: 'hr-summary', x: 8, y: 9, w: 4, h: 3, minW: 4, minH: 3 },

  // Cash Flow - Left bottom
  { i: 'cash-flow', x: 0, y: 10, w: 4, h: 3, minW: 4, minH: 3 },

  // Calendar - Middle bottom
  { i: 'calendar-widget', x: 4, y: 10, w: 4, h: 3, minW: 4, minH: 3 },
];

/**
 * Save layout to localStorage
 */
export function saveLayoutToLocalStorage(layouts: LayoutItem[]): void {
  try {
    const layoutData: DashboardLayout = {
      layouts,
      version: 1,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutData));
  } catch (error) {
    console.error('Failed to save layout to localStorage:', error);
  }
}

/**
 * Load layout from localStorage
 */
export function loadLayoutFromLocalStorage(): LayoutItem[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const layoutData: DashboardLayout = JSON.parse(stored);
    return layoutData.layouts;
  } catch (error) {
    console.error('Failed to load layout from localStorage:', error);
    return null;
  }
}

/**
 * Clear layout from localStorage
 */
export function clearLayoutFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear layout from localStorage:', error);
  }
}

/**
 * Check if layouts are equal
 */
export function areLayoutsEqual(layout1: LayoutItem[], layout2: LayoutItem[]): boolean {
  if (layout1.length !== layout2.length) return false;

  return layout1.every((item1) => {
    const item2 = layout2.find((i) => i.i === item1.i);
    if (!item2) return false;

    return (
      item1.x === item2.x &&
      item1.y === item2.y &&
      item1.w === item2.w &&
      item1.h === item2.h
    );
  });
}

/**
 * Merge layouts - add new widgets, keep positions for existing ones
 */
export function mergeLayouts(currentLayout: LayoutItem[], newWidgets: string[]): LayoutItem[] {
  const merged = [...currentLayout];

  newWidgets.forEach((widgetId) => {
    if (!merged.find((item) => item.i === widgetId)) {
      // Find available position
      const maxY = Math.max(...merged.map((item) => item.y + item.h), 0);
      merged.push({
        i: widgetId,
        x: 0,
        y: maxY,
        w: 6,
        h: 3,
        minW: 4,
        minH: 3,
      });
    }
  });

  return merged;
}

/**
 * Remove widget from layout
 */
export function removeWidgetFromLayout(layout: LayoutItem[], widgetId: string): LayoutItem[] {
  return layout.filter((item) => item.i !== widgetId);
}

/**
 * Validate layout integrity
 */
export function validateLayout(layout: LayoutItem[]): boolean {
  // Check for duplicate widget IDs
  const ids = layout.map((item) => item.i);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    console.error('Duplicate widget IDs found in layout');
    return false;
  }

  // Check for valid dimensions
  const invalid = layout.some(
    (item) =>
      item.w <= 0 ||
      item.h <= 0 ||
      item.x < 0 ||
      item.y < 0 ||
      (item.minW && item.w < item.minW) ||
      (item.minH && item.h < item.minH)
  );

  if (invalid) {
    console.error('Invalid dimensions found in layout');
    return false;
  }

  return true;
}
