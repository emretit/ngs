
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartDataPoint {
  period: string;
  Technical: number;
  Communication: number;
  Teamwork: number;
  Leadership: number;
  Overall: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="period" />
        <YAxis domain={[0, 5]} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Technical" fill="#8884d8" />
        <Bar dataKey="Communication" fill="#82ca9d" />
        <Bar dataKey="Teamwork" fill="#ffc658" />
        <Bar dataKey="Leadership" fill="#ff8042" />
        <Bar dataKey="Overall" fill="#0088fe" />
      </BarChart>
    </ResponsiveContainer>
  );
};
