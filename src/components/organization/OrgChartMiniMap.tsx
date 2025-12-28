import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OrgChartMiniMapProps {
  containerRef: React.RefObject<HTMLDivElement>;
  contentWidth: number;
  contentHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  onNavigate: (pan: { x: number; y: number }) => void;
}

export const OrgChartMiniMap: React.FC<OrgChartMiniMapProps> = ({
  containerRef,
  contentWidth,
  contentHeight,
  zoom,
  pan,
  onNavigate,
}) => {
  const miniMapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Mini map dimensions
  const miniMapWidth = 180;
  const miniMapHeight = 120;
  
  // Calculate scale to fit content in mini map
  const scaleX = miniMapWidth / contentWidth;
  const scaleY = miniMapHeight / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1);
  
  // Calculate viewport rectangle
  const containerWidth = containerRef.current?.clientWidth || 800;
  const containerHeight = containerRef.current?.clientHeight || 600;
  
  const viewportWidth = (containerWidth / zoom) * scale;
  const viewportHeight = (containerHeight / zoom) * scale;
  const viewportX = (-pan.x / zoom) * scale;
  const viewportY = (-pan.y / zoom) * scale;

  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!miniMapRef.current) return;
    
    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert mini map coordinates to content coordinates
    const newPanX = -(clickX / scale - containerWidth / zoom / 2) * zoom;
    const newPanY = -(clickY / scale - containerHeight / zoom / 2) * zoom;
    
    onNavigate({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    handleMiniMapClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMiniMapClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div
      className={cn(
        "absolute top-4 left-4 z-20",
        "bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border border-border",
        "overflow-hidden"
      )}
      style={{ width: miniMapWidth + 16, height: miniMapHeight + 32 }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-border bg-muted/50">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Genel Bakış
        </span>
      </div>
      
      {/* Mini Map Content */}
      <div
        ref={miniMapRef}
        className="relative cursor-crosshair m-2 bg-accent/20 rounded"
        style={{ 
          width: miniMapWidth, 
          height: miniMapHeight,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Content representation (simplified dots for nodes) */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(circle at 50% 10%, hsl(var(--primary)) 2px, transparent 2px),
              radial-gradient(circle at 30% 30%, hsl(var(--primary)) 1.5px, transparent 1.5px),
              radial-gradient(circle at 70% 30%, hsl(var(--primary)) 1.5px, transparent 1.5px),
              radial-gradient(circle at 20% 50%, hsl(var(--primary)) 1px, transparent 1px),
              radial-gradient(circle at 40% 50%, hsl(var(--primary)) 1px, transparent 1px),
              radial-gradient(circle at 60% 50%, hsl(var(--primary)) 1px, transparent 1px),
              radial-gradient(circle at 80% 50%, hsl(var(--primary)) 1px, transparent 1px)
            `,
          }}
        />
        
        {/* Viewport indicator */}
        <div
          className={cn(
            "absolute border-2 border-primary bg-primary/10 rounded",
            "transition-all duration-75 ease-out",
            isDragging && "border-primary/80"
          )}
          style={{
            left: Math.max(0, Math.min(viewportX, miniMapWidth - viewportWidth)),
            top: Math.max(0, Math.min(viewportY, miniMapHeight - viewportHeight)),
            width: Math.min(viewportWidth, miniMapWidth),
            height: Math.min(viewportHeight, miniMapHeight),
          }}
        />
      </div>
    </div>
  );
};

export default OrgChartMiniMap;
