import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { ChartDataPoint } from '@/services/dashboardApi';
import DashboardCard from './DashboardCard';

interface DeptHCChartProps {
  data: ChartDataPoint[];
}

export default function DeptHCChart({ data }: DeptHCChartProps) {
  return (
    <DashboardCard title="HC Requested by Dept.">
      <div className="flex-1 p-3 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="label"
              type="category"
              tick={{ fontSize: 9, fill: '#475569', fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                fontSize: '11px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            />
            <Bar dataKey="value" fill="var(--excel-green)" radius={[0, 3, 3, 0]}>
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: '9px', fill: '#475569', fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
