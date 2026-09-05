import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Clock, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { TrendAnalysis } from '../engine/chronometer';

interface BiomarkerChronometerViewProps {
  trends: TrendAnalysis[];
}

export const BiomarkerChronometerView: React.FC<BiomarkerChronometerViewProps> = ({
  trends
}) => {
  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
        <Clock className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">No Multi-Date Comparison Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The Biomarker Chronometer automatically activates when sequential reports are detected to compute biomarker trajectories and delta percentages.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Biomarker Chronometer (Longitudinal Trajectory)
            </h2>
            <p className="text-xs text-slate-500">
              Tracking multi-report biomarker trajectories, percentage shifts, and response to therapy
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
          {trends.length} Sequential Markers
        </span>
      </div>

      {/* Grid of Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((trend, idx) => {
          const isImproving = trend.clinical_trend === 'improving';
          const isWorsening = trend.clinical_trend === 'worsening';
          const sign = trend.delta_pct > 0 ? '+' : '';

          return (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all space-y-3"
            >
              
              {/* Card Header: Name & Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{trend.test_name}</h3>
                  <span className="text-[11px] text-slate-500">Unit: {trend.unit}</span>
                </div>
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isImproving
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isWorsening
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {isImproving ? (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      <span>Favorable Shift</span>
                    </>
                  ) : isWorsening ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      <span>Adverse Shift</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-3 h-3" />
                      <span>Stable</span>
                    </>
                  )}
                </span>
              </div>

              {/* Numerical Progression & Sparkline */}
              <div className="flex items-center justify-between pt-1">
                
                {/* Before / After */}
                <div className="flex items-baseline space-x-2">
                  <span className="text-xs text-slate-400 font-mono line-through">
                    {trend.previous_value}
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {trend.current_value}
                  </span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      isImproving ? 'text-emerald-600' : isWorsening ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    ({sign}{trend.delta_pct}%)
                  </span>
                </div>

                {/* Micro Sparkline SVG */}
                <div className="w-20 h-7">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 80 24">
                    <path
                      d={trend.sparkline_svg_path}
                      fill="none"
                      stroke={isImproving ? '#10b981' : isWorsening ? '#f43f5e' : '#64748b'}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Pulsing endpoint on current reading */}
                    <circle
                      cx="80"
                      cy="12"
                      r="3"
                      fill={isImproving ? '#10b981' : isWorsening ? '#f43f5e' : '#64748b'}
                    />
                  </svg>
                </div>

              </div>

              {/* Plain Language Clinical Interpretation */}
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 leading-tight">
                {trend.summary_text}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
