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

interface DeptHCChartProps {
  data: ChartDataPoint[];
}

export default function DeptHCChart({ data }: DeptHCChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-2.5 bg-slate-800">
        <h4 className="text-xs font-black uppercase tracking-widest text-white">HC Requested by Dept.</h4>
      </div>

      <div className="flex-1 p-3 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
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
            <Bar dataKey="value" fill="#10b981" radius={[0, 3, 3, 0]}>
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: '9px', fill: '#475569', fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
