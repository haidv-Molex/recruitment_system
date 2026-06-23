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
import DashboardCard from './DashboardCard';

interface MonthlyHCChartProps {
  data: ChartDataPoint[];
}

export default function MonthlyHCChart({ data }: MonthlyHCChartProps) {
  return (
    <DashboardCard title="HC Requested By Expected Onboard Month">
      <div className="flex-1 p-3 h-[200px] min-w-0">
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
    </DashboardCard>
  );
}
