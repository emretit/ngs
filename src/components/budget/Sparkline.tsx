import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

const Sparkline = ({ data, width = 100, height = 30 }: SparklineProps) => {
  const path = useMemo(() => {
    if (data.length === 0) return "";

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={path}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { Sparkline };

