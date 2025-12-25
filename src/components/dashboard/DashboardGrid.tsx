import { useState, useMemo } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';

interface DashboardGridProps {
  children: React.ReactNode;
  layout: Layout[];
  onLayoutChange: (layout: Layout[]) => void;
  isEditMode: boolean;
  cols?: number;
  rowHeight?: number;
}

export function DashboardGrid({
  children,
  layout,
  onLayoutChange,
  isEditMode,
  cols = 12,
  rowHeight = 100,
}: DashboardGridProps) {
  const [containerWidth, setContainerWidth] = useState(1200);

  // Responsive breakpoints
  const breakpoints = useMemo(() => ({
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  }), []);

  const responsiveCols = useMemo(() => ({
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2,
  }), []);

  return (
    <div className="w-full">
      <GridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        width={containerWidth}
        onLayoutChange={onLayoutChange}
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
