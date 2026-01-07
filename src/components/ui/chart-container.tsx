import { ReactNode, useEffect, useState, useRef } from 'react';

interface ChartContainerProps {
  children: ReactNode;
  height?: number | string;
  minHeight?: number;
  className?: string;
}

/**
 * Wrapper component for Recharts to prevent "width/height should be greater than 0" warnings
 * Ensures the container is properly sized before rendering charts
 */
export const ChartContainer = ({ 
  children, 
  height = 300, 
  minHeight = 200,
  className = '' 
}: ChartContainerProps) => {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay to ensure container is mounted and sized
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const { width, height: containerHeight } = containerRef.current.getBoundingClientRect();
        if (width > 0 && containerHeight > 0) {
          setIsReady(true);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const heightValue = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ 
        height: heightValue,
        minHeight: minHeight,
        width: '100%'
      }}
    >
      {isReady ? children : (
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-muted-foreground">Grafik yükleniyor...</div>
        </div>
      )}
    </div>
  );
};

