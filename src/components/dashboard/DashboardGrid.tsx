import { useState } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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
  children: React.ReactNode;
  layout: LayoutItem[];
  onLayoutChange: (layout: LayoutItem[]) => void;
  isEditMode: boolean;
  cols?: number;
  rowHeight?: number;
}

export function DashboardGrid({
  children,
  layout,
  onLayoutChange,
  isEditMode,
  rowHeight = 100,
}: DashboardGridProps) {
  const [containerWidth] = useState(1200);

  return (
    <div className="w-full">
      <GridLayout
        className="layout"
        layout={layout}
        width={containerWidth}
        onLayoutChange={(newLayout: any) => onLayoutChange(newLayout)}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        draggableHandle=".widget-drag-handle"
      >
        {children}
      </GridLayout>
    </div>
  );
}