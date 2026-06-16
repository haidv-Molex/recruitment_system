import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { ChartDataPoint } from '@/services/dashboardApi';

interface MonthlyHCChartProps {
  data: ChartDataPoint[];
}

export default function MonthlyHCChart({ data }: MonthlyHCChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-2.5 bg-excel-green-dark">
        <h4 className="text-xs font-black uppercase tracking-widest text-white">
          HC Requested By Expected Onboard Month
        </h4>
      </div>

      <div className="flex-1 p-3 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: '#f0fdf4' }}
              contentStyle={{
                fontSize: '11px',
                borderRadius: '8px',
                border: '1px solid #d1fae5',
                backgroundColor: '#fff',
              }}
              labelStyle={{ color: '#064e3b', fontWeight: 700 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill="var(--excel-green)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
