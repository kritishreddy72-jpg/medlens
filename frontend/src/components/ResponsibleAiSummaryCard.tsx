import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertCircle, RefreshCw, BookOpen, HeartPulse } from 'lucide-react';
import { BiomarkerReading, PatientProfile } from '../types/clinical';
import { generatePatientFriendlySummary } from '../services/geminiService';

interface ResponsibleAiSummaryCardProps {
  patient: PatientProfile;
  readings: BiomarkerReading[];
}

export const ResponsibleAiSummaryCard: React.FC<ResponsibleAiSummaryCardProps> = ({
  patient,
  readings
}) => {
  const abnormal = readings.filter(r => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL');
  const normal = readings.filter(r => r.status === 'NORMAL');

  const [customSummary, setCustomSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateLive = async () => {
    setLoading(true);
    try {
      const summary = await generatePatientFriendlySummary(patient.name, readings);
      setCustomSummary(summary);
    } catch (err: any) {
      alert(`Synthesis Error: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Patient-Friendly Clinical Synthesis</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Non-Diagnostic
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Plain-language translation of objective laboratory data for doctor discussion
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateLive}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          title="Regenerate dynamic summary via Gemini 2.5 Flash"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synthesizing...' : 'Live AI Refresh'}</span>
        </button>
      </div>

      {/* Summary Content */}
      <div className="text-xs leading-relaxed text-slate-300 space-y-3">
        {customSummary ? (
          <div className="whitespace-pre-line bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 font-sans">
            {customSummary}
          </div>
        ) : (
          <div className="space-y-3">
            <p>
              Hello <strong>{patient.name}</strong>. We reviewed your recent laboratory findings against the specific reference intervals established by the processing laboratory.
            </p>

            {abnormal.length > 0 ? (
              <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
                <span className="font-semibold text-amber-300 block">
                  Key Biomarkers Noted Outside Standard Lab Reference Intervals:
                </span>
                <ul className="space-y-1 pl-1">
                  {abnormal.map((a, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>
                        <strong className="text-white">{a.test_name}:</strong> Observed at{' '}
                        <span className="font-mono font-bold text-white">{a.value} {a.unit}</span> (Laboratory reference range is {a.reference_range.text_range}).
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/50 text-emerald-200">
                All {normal.length} tested clinical markers are currently within the reference ranges provided by your laboratory report.
              </div>
            )}

            <p className="text-slate-400 text-[11px]">
              <strong>Understanding Your Results:</strong> Biomarker readings can vary naturally based on fasting status, hydration, physical activity, and time of day. Your primary physician will interpret these numbers within your overall clinical context.
            </p>
          </div>
        )}
      </div>

      {/* Safety Guardrail Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strict Clinical Safety Guardrails: Zero Diagnostic Assertions</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          MedLens AI Engine v2.5
        </span>
      </div>

    </div>
  );
};
