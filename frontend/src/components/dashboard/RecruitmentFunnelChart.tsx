import { ChartDataPoint } from '@/services/dashboardApi';

interface RecruitmentFunnelChartProps {
  data: ChartDataPoint[];
}

export default function RecruitmentFunnelChart({ data }: RecruitmentFunnelChartProps) {
  // Helper to extract values by stage label
  const findVal = (labels: string[]) => {
    const found = data.find((d) => labels.includes(d.label));
    return found ? found.value : 0;
  };

  const cvSent = findVal(['CV Sent', 'CV sent']);
  const interview = findVal(['Interview', 'interview']);
  const offered = findVal(['Offered', 'Offer', 'offered']);
  const offerAccepted = findVal(['Offer Accepted', 'Offer accepted']);
  const onboarded = findVal(['Onboarded', 'onboarded']);

  // Calculate the maximum value to scale widths relative to the top of the funnel
  const maxVal = Math.max(cvSent, interview, offered, offerAccepted, onboarded) || 1;

  const pctFunnel = (val: number) => {
    return `${(val / maxVal) * 100}%`;
  };

  // Conversion rate (Onboarded / CV Sent)
  const conversionRate = cvSent > 0 ? ((onboarded / cvSent) * 100).toFixed(1) : '0.0';

  const stages = [
    { label: '# CV sent', value: cvSent, width: pctFunnel(cvSent) },
    { label: '# Interview', value: interview, width: pctFunnel(interview) },
    { label: '# Offered', value: offered, width: pctFunnel(offered) },
    { label: '# Offer accepted', value: offerAccepted, width: pctFunnel(offerAccepted) },
    { label: '# Onboarded', value: onboarded, width: pctFunnel(onboarded) },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full font-sans">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-800 shrink-0">
        <h4 className="text-xs font-black uppercase tracking-widest text-white">Recruitment Funnel</h4>
      </div>

      {/* Funnel Body */}
      <div className="flex-1 p-4 flex flex-col justify-between min-h-[220px]">
        {/* Stages list */}
        <div className="flex flex-col gap-2 relative">
          
          {/* Top 100% line */}
          <div className="flex items-center mb-1">
            <div className="w-1/4 shrink-0" /> {/* Spacer */}
            <div className="flex-1 flex flex-col items-center relative">
              <div className="w-full border-b border-slate-300 relative h-1.5">
                <div className="absolute left-0 top-0 h-2 border-l border-slate-300"></div>
                <div className="absolute right-0 top-0 h-2 border-r border-slate-300"></div>
              </div>
              <span className="text-[9px] text-slate-400 font-bold mt-0.5">100%</span>
            </div>
          </div>

          {stages.map((stage, idx) => (
            <div key={idx} className="flex items-center">
              {/* Left stage label */}
              <div className="w-1/4 text-xs font-semibold text-slate-500 pr-3 truncate text-right">
                {stage.label}
              </div>

              {/* Centered Funnel Bar */}
              <div className="flex-1 flex justify-center items-center h-8 relative">
                <div
                  style={{ width: stage.width }}
                  className="bg-emerald-500 hover:bg-emerald-600 transition-all rounded duration-500 flex items-center justify-center text-xs font-bold text-white shadow-sm h-full"
                >
                  {stage.value}
                </div>
              </div>
            </div>
          ))}

          {/* Bottom Conversion Rate line */}
          <div className="flex items-center mt-2">
            <div className="w-1/4 shrink-0" /> {/* Spacer */}
            <div className="flex-1 flex flex-col items-center relative">
              {/* Line width is equal to the bottom stage width */}
              <div style={{ width: stages[4].width }} className="relative">
                <div className="w-full border-t border-slate-300 h-1.5 relative">
                  <div className="absolute left-0 -top-1.5 h-2 border-l border-slate-300"></div>
                  <div className="absolute right-0 -top-1.5 h-2 border-r border-slate-300"></div>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-bold mt-0.5">{conversionRate}%</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
