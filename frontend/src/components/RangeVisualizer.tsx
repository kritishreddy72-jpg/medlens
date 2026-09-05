import React from 'react';
import { BiomarkerReading, BiomarkerStatus, ReferenceRange } from '../types/clinical';
import { ShieldCheck, HelpCircle } from 'lucide-react';

interface RangeVisualizerProps {
  reading: BiomarkerReading;
  compact?: boolean;
}

export const RangeVisualizer: React.FC<RangeVisualizerProps> = ({ reading, compact = false }) => {
  const { value, reference_range, status } = reading;
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));

  // If no reference range was provided in the source report
  if (!reference_range.is_present || isNaN(numVal)) {
    return (
      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 italic">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
        <span>Not specified in source</span>
      </div>
    );
  }

  const { low, high, operator } = reference_range;

  // Case 1: Standard Bounded Interval (low and high exist)
  if (low !== undefined && high !== undefined && high > low) {
    const rangeSpan = high - low;
    const minDisplay = Math.max(0, low - rangeSpan * 0.4);
    const maxDisplay = high + rangeSpan * 0.4;
    const totalSpan = maxDisplay - minDisplay;

    const clampedVal = Math.min(Math.max(numVal, minDisplay), maxDisplay);
    const valuePct = Math.min(100, Math.max(0, ((clampedVal - minDisplay) / totalSpan) * 100));
    const lowPct = ((low - minDisplay) / totalSpan) * 100;
    const highPct = ((high - minDisplay) / totalSpan) * 100;

    const markerColor =
      status === 'NORMAL'
        ? 'bg-emerald-500 border-emerald-600'
        : status === 'LOW'
        ? 'bg-blue-500 border-blue-600'
        : status === 'CRITICAL'
        ? 'bg-rose-600 border-rose-700'
        : 'bg-amber-500 border-amber-600';

    if (compact) {
      return (
        <div className="w-28 space-y-1">
          <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {/* Low Zone */}
            <div style={{ width: `${lowPct}%` }} className="bg-blue-100 h-full" />
            {/* Normal Zone */}
            <div style={{ width: `${highPct - lowPct}%` }} className="bg-emerald-100 h-full" />
            {/* High Zone */}
            <div style={{ width: `${100 - highPct}%` }} className="bg-amber-100 h-full" />
            {/* Indicator pin */}
            <div
              className={`absolute top-0 bottom-0 w-1.5 rounded-full ${markerColor} shadow-xs`}
              style={{ left: `calc(${valuePct}% - 3px)` }}
              title={`Result: ${numVal} (Ref: ${low} - ${high})`}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono px-0.5">
            <span>{low}</span>
            <span>{high}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5 w-full max-w-xs">
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Low: {low}</span>
          <span className="font-semibold text-slate-700">Ref: {reference_range.text_range}</span>
          <span>High: {high}</span>
        </div>
        <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-visible flex">
          {/* Low sub-range */}
          <div style={{ width: `${lowPct}%` }} className="bg-blue-100/90 h-full rounded-l-full" />
          {/* Normal target range */}
          <div style={{ width: `${highPct - lowPct}%` }} className="bg-emerald-200 h-full" />
          {/* High sub-range */}
          <div style={{ width: `${100 - highPct}%` }} className="bg-amber-100/90 h-full rounded-r-full" />

          {/* Marker pin */}
          <div
            className={`absolute -top-1 w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center ${markerColor} transition-all`}
            style={{ left: `calc(${valuePct}% - 8px)` }}
            title={`Patient Result: ${numVal} ${reading.unit}`}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Upper Bound Only (e.g. < 5.7 or < 100)
  if (high !== undefined && (operator === '<' || operator === '<=')) {
    const maxDisplay = high * 1.6;
    const valuePct = Math.min(100, (numVal / maxDisplay) * 100);
    const thresholdPct = (high / maxDisplay) * 100;

    const isExceeded = numVal >= high;
    const markerColor = isExceeded ? 'bg-amber-500 border-amber-600' : 'bg-emerald-500 border-emerald-600';

    return (
      <div className="w-28 space-y-1">
        <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${thresholdPct}%` }} className="bg-emerald-100 h-full" />
          <div style={{ width: `${100 - thresholdPct}%` }} className="bg-amber-100 h-full" />
          <div
            className={`absolute top-0 bottom-0 w-1.5 rounded-full ${markerColor} shadow-xs`}
            style={{ left: `calc(${valuePct}% - 3px)` }}
            title={`Result: ${numVal} (Ref: ${reference_range.text_range})`}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 font-mono px-0.5">
          <span>0</span>
          <span>Target: {reference_range.text_range}</span>
        </div>
      </div>
    );
  }

  // Case 3: Lower Bound Only (e.g. > 60 or > 40)
  if (low !== undefined && (operator === '>' || operator === '>=')) {
    const maxDisplay = low * 2.2;
    const valuePct = Math.min(100, (numVal / maxDisplay) * 100);
    const thresholdPct = (low / maxDisplay) * 100;

    const isBelow = numVal <= low;
    const markerColor = isBelow ? 'bg-blue-500 border-blue-600' : 'bg-emerald-500 border-emerald-600';

    return (
      <div className="w-28 space-y-1">
        <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${thresholdPct}%` }} className="bg-blue-100 h-full" />
          <div style={{ width: `${100 - thresholdPct}%` }} className="bg-emerald-100 h-full" />
          <div
            className={`absolute top-0 bottom-0 w-1.5 rounded-full ${markerColor} shadow-xs`}
            style={{ left: `calc(${valuePct}% - 3px)` }}
            title={`Result: ${numVal} (Ref: ${reference_range.text_range})`}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 font-mono px-0.5">
          <span>Target: {reference_range.text_range}</span>
        </div>
      </div>
    );
  }

  // Fallback text
  return (
    <span className="text-[11px] font-mono text-slate-600">
      {reference_range.text_range}
    </span>
  );
};
