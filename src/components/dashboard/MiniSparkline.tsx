import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniSparklineProps {
  data: number[];
  trend?: "up" | "down" | "neutral";
}

const MiniSparkline = ({ data, trend = "neutral" }: MiniSparklineProps) => {
  // Transform data to recharts format
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  const getStrokeColor = () => {
    if (trend === "up") return "#10b981"; // green
    if (trend === "down") return "#ef4444"; // red
    return "#6b7280"; // gray
  };

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={getStrokeColor()}
          strokeWidth={2}
          dot={false}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MiniSparkline;
