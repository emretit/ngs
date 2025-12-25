import { ReactNode } from 'react';

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface DashboardGridProps {
  children: ReactNode;
  layout: LayoutItem[];
  onLayoutChange: (layout: LayoutItem[]) => void;
  isEditMode: boolean;
  cols?: number;
  rowHeight?: number;
}

// Simplified grid component - react-grid-layout has typing issues
// This is a placeholder that renders children in a simple grid
export function DashboardGrid({
  children,
  isEditMode,
}: DashboardGridProps) {
  return (
    <div className={`w-full ${isEditMode ? 'ring-2 ring-primary/20 rounded-lg' : ''}`}>
      {children}
    </div>
  );
}
