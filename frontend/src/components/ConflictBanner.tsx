import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { ClinicalConflict } from '../types/clinical';

interface ConflictBannerProps {
  conflicts: ClinicalConflict[];
  onDismissConflict?: (id: string) => void;
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({
  conflicts,
  onDismissConflict
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    conflicts.length > 0 ? conflicts[0].id : null
  );

  if (conflicts.length === 0) return null;

  return (
    <div className="space-y-3">
      {conflicts.map((conflict) => {
        const isCritical = conflict.severity === 'CRITICAL';
        const isExpanded = expandedId === conflict.id;

        return (
          <div
            key={conflict.id}
            className={`rounded-2xl border p-4 transition-all ${
              isCritical
                ? 'bg-rose-50/90 border-rose-300 shadow-sm shadow-rose-500/10'
                : 'bg-amber-50/90 border-amber-300 shadow-sm shadow-amber-500/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${
                        isCritical ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {conflict.severity} ALERT
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      MedLens Clinical Contradiction Radar
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {conflict.title}
                  </h2>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                    {conflict.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : conflict.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/5 text-xs font-medium flex items-center space-x-1"
                >
                  <span className="hidden sm:inline text-xs">
                    {isExpanded ? 'Hide Rationale' : 'Clinical Rationale'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

            </div>

            {/* Expandable Clinical Grounding & Rationale */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                
                <div className="md:col-span-2 space-y-1 bg-white/70 p-3 rounded-xl border border-slate-200/60">
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Evidence & Classification Basis</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {conflict.clinical_rationale}
                  </p>
                </div>

                <div className="space-y-1 bg-white/70 p-3 rounded-xl border border-slate-200/60">
                  <span className="font-semibold text-slate-700 block">Conflicting Entities:</span>
                  <div className="flex flex-wrap gap-1">
                    {conflict.items_involved.map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-rose-700 font-medium block mt-2">
                    Action: Immediate physician or pharmacist verification required.
                  </span>
                </div>

              </div>
            )}

          </div>
        );
      })}
    </div>
  );
};
