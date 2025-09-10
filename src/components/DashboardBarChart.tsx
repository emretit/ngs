import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Q1", deals: 42, revenue: 145 },
  { name: "Q2", deals: 38, revenue: 132 },
  { name: "Q3", deals: 55, revenue: 187 },
  { name: "Q4", deals: 47, revenue: 166 },
];

const DashboardBarChart = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Quarterly Performance</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="dealsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000000" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#000000" stopOpacity={0.4}/>
              </linearGradient>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#64748b" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#f0f0f0" 
              vertical={false} 
              opacity={0.5}
            />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666666', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666666', fontSize: 12 }}
              dx={-10}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
              contentStyle={{ 
                background: 'white',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                padding: '8px 12px'
              }}
              labelStyle={{
                color: '#666666',
                fontWeight: 500,
                marginBottom: '4px'
              }}
            />
            <Bar 
              dataKey="deals" 
              fill="url(#dealsGradient)"
              radius={[4, 4, 0, 0]}
              barSize={24}
              name="Deals"
            />
            <Bar 
              dataKey="revenue" 
              fill="url(#revenueGradient)"
              radius={[4, 4, 0, 0]}
              barSize={24}
              name="Revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-black opacity-80" />
          <span>Deals</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-500 opacity-80" />
          <span>Revenue</span>
        </div>
      </div>
    </Card>
  );
};

export default DashboardBarChart;