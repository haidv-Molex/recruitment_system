import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartDataPoint } from '@/services/dashboardApi';
import DashboardCard from './DashboardCard';

interface CandidatesByDeptDonutChartProps {
  data: ChartDataPoint[];
}

const COLORS = [
  '#f43f5e', // Rose
  '#0ea5e9', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#64748b', // Slate
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
];

export default function CandidatesByDeptDonutChart({ data }: CandidatesByDeptDonutChartProps) {
  // Sort data descending by value
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const total = sortedData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <DashboardCard title="Recruitment Source">

      {/* Chart and Legend */}
      <div className="flex-1 p-4 flex flex-row items-center justify-between gap-4 min-h-[220px]">
        {/* Donut Chart */}
        <div className="w-[45%] h-full min-h-[160px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
            <PieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                nameKey="label"
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                separator=" - "
                formatter={(value: any, name: any) => [value, name]}
                contentStyle={{
                  fontSize: '11px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Total</span>
            <span className="text-xl font-extrabold text-slate-700 mt-1 leading-none">{total}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-[50%] max-h-[180px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar">
          {sortedData.map((item, index) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={item.label} className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-semibold truncate text-[11px]">{item.label}</span>
                </div>
                <span className="font-bold text-slate-700 shrink-0 pl-2 text-[11px]">
                  {item.value} <span className="text-[9px] font-normal text-slate-400">({pct}%)</span>
                </span>
              </div>
            );
          })}
          {sortedData.length === 0 && (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-6">
              No candidate data available
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
