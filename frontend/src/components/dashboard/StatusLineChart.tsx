import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ChartDataPoint } from '@/services/dashboardApi';
import { useMemo } from 'react';

interface StatusLineChartProps {
  inProgressData: ChartDataPoint[];
  offeredData: ChartDataPoint[];
  onboardedData: ChartDataPoint[];
  overdueData: ChartDataPoint[];
}

// Status config: color and label
const STATUS_CONFIG = [
  { key: 'In progress', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { key: 'Offered',     color: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { key: 'Onboarded',  color: '#059669', bg: 'bg-excel-green/10', text: 'text-excel-green-dark', border: 'border-excel-green/20' },
  { key: 'Overdue',    color: '#ef4444', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
];

type DataMap = Record<string, Record<string, number>>;

export default function StatusLineChart({
  inProgressData,
  offeredData,
  onboardedData,
  overdueData,
}: StatusLineChartProps) {
  // Merge all 4 series into a single array keyed by label (month)
  const mergedData = useMemo(() => {
    const map: DataMap = {};

    const addSeries = (series: ChartDataPoint[], statusKey: string) => {
      for (const pt of series) {
        if (!map[pt.label]) map[pt.label] = {};
        map[pt.label][statusKey] = pt.value;
      }
    };

    addSeries(inProgressData, 'In progress');
    addSeries(offeredData, 'Offered');
    addSeries(onboardedData, 'Onboarded');
    addSeries(overdueData, 'Overdue');

    // Sort chronologically by label
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, values]) => ({ label, ...values }));
  }, [inProgressData, offeredData, onboardedData, overdueData]);

  // Totals for each status
  const totals = useMemo(() => ({
    'In progress': inProgressData.reduce((s, d) => s + d.value, 0),
    Offered:  offeredData.reduce((s, d) => s + d.value, 0),
    Onboarded: onboardedData.reduce((s, d) => s + d.value, 0),
    Overdue: overdueData.reduce((s, d) => s + d.value, 0),
  }), [inProgressData, offeredData, onboardedData, overdueData]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-800">
        <h4 className="text-xs font-black uppercase tracking-widest text-white">
          HC Requested By Status &amp; Expected Onboard Month
        </h4>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 px-4 pt-3">
        {STATUS_CONFIG.map(({ key, bg, text, border }) => (
          <div
            key={key}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${bg} ${text} border ${border}`}
          >
            <span>{key}</span>
            <span className="font-black">{totals[key as keyof typeof totals]}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 px-3 pb-3 pt-2 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
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
              contentStyle={{
                fontSize: '11px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
            />
            {STATUS_CONFIG.map(({ key, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
