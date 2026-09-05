import React, { useState, useMemo } from 'react';
import { HelpCircle, Stethoscope, Copy, Check, ChevronDown, ChevronUp, Share2, Sparkles, MessageSquare } from 'lucide-react';
import { BiomarkerReading, PatientProfile } from '../types/clinical';
import { TrendAnalysis } from '../engine/chronometer';

interface DoctorQuestionsCardProps {
  patient: PatientProfile;
  readings: BiomarkerReading[];
  trends?: TrendAnalysis[];
  onShareWhatsApp?: () => void;
}

export const DoctorQuestionsCard: React.FC<DoctorQuestionsCardProps> = ({
  patient,
  readings,
  trends = [],
  onShareWhatsApp
}) => {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Generate context-aware questions
  const generatedQuestions = useMemo(() => {
    const qs: { id: string; topic: string; question: string; rationale: string }[] = [];

    // 1. Glucose / HbA1c
    const glucose = readings.find(r => r.test_name.toLowerCase().includes('glucose') && (r.status === 'HIGH' || r.status === 'CRITICAL'));
    const hba1c = readings.find(r => r.test_name.toLowerCase().includes('a1c') && (r.status === 'HIGH' || r.status === 'CRITICAL'));
    if (glucose || hba1c) {
      qs.push({
        id: 'q-glucose',
        topic: 'Glycemic Optimization',
        question: `My ${hba1c ? `HbA1c was ${hba1c.value}%` : ''} ${glucose ? `and Fasting Blood Glucose was ${glucose.value} ${glucose.unit}` : ''}, which are higher than the laboratory range. What diet, exercise, or medication adjustments do you suggest to help bring these closer to our target?`,
        rationale: 'Addresses out-of-range blood sugar metrics with focus on physician guidance.'
      });
    }

    // 2. Kidney / eGFR / Creatinine / Microalbumin
    const egfr = readings.find(r => r.test_name.toLowerCase().includes('egfr') && (r.status === 'LOW' || r.status === 'CRITICAL'));
    const uacr = readings.find(r => r.test_name.toLowerCase().includes('albumin/creatinine') && (r.status === 'HIGH' || r.status === 'CRITICAL'));
    if (egfr || uacr) {
      qs.push({
        id: 'q-renal',
        topic: 'Kidney Health & Protection',
        question: `My report shows ${uacr ? `microalbuminuria (${uacr.value} ${uacr.unit})` : ''} ${egfr ? `and eGFR at ${egfr.value} mL/min` : ''}. Are there renal-protective measures, blood pressure targets, or follow-up tests we should plan?`,
        rationale: 'Focuses on early kidney preservation without asserting medical diagnoses.'
      });
    }

    // 3. Lipids (LDL / Total Cholesterol / Triglycerides)
    const ldl = readings.find(r => r.test_name.toLowerCase().includes('ldl') && (r.status === 'HIGH' || r.status === 'CRITICAL'));
    if (ldl) {
      qs.push({
        id: 'q-lipids',
        topic: 'Cardiovascular Risk & Lipids',
        question: `My LDL cholesterol was observed at ${ldl.value} ${ldl.unit} (reference range ${ldl.reference_range.text_range}). Based on my overall cardiovascular profile, what is our personalized target level?`,
        rationale: 'Empowers discussion of individual cardiovascular risk profile.'
      });
    }

    // 4. Hematology / Anemia (Hemoglobin / Hematocrit / WBC)
    const hgb = readings.find(r => r.test_name.toLowerCase().includes('hemoglobin') && !r.test_name.toLowerCase().includes('a1c') && r.status === 'LOW');
    const wbc = readings.find(r => r.test_name.toLowerCase().includes('wbc') || r.test_name.toLowerCase().includes('white blood'));
    if (hgb) {
      qs.push({
        id: 'q-anemia',
        topic: 'Blood Counts & Vitality',
        question: `My hemoglobin was slightly low at ${hgb.value} ${hgb.unit}. Should we investigate potential causes such as iron levels, ferritin, or vitamin absorption?`,
        rationale: 'Encourages diagnostic workup for low hemoglobin.'
      });
    }
    if (wbc && (wbc.status === 'HIGH' || wbc.status === 'CRITICAL')) {
      qs.push({
        id: 'q-wbc',
        topic: 'Immune & Inflammatory Marker',
        question: `My white blood cell count was elevated at ${wbc.value} ${wbc.unit}. Could this be related to my recent symptoms, or should we recheck after symptoms resolve?`,
        rationale: 'Clarifies infection vs temporary stress elevation.'
      });
    }

    // 5. Longitudinal worsening trends
    const worseningTrend = trends.find(t => t.clinical_trend === 'worsening');
    if (worseningTrend) {
      qs.push({
        id: 'q-trend',
        topic: 'Biomarker Trajectory Over Time',
        question: `Compared to my previous test, my ${worseningTrend.test_name} shifted from ${worseningTrend.previous_value} to ${worseningTrend.current_value} (${worseningTrend.delta_pct > 0 ? '+' : ''}${worseningTrend.delta_pct}%). What factors might explain this direction?`,
        rationale: 'Explores longitudinal trajectory identified by the Biomarker Chronometer.'
      });
    }

    // 6. Medication review
    if (patient.medications.length > 0) {
      qs.push({
        id: 'q-meds',
        topic: 'Medication Regimen Review',
        question: `Given these latest test results, are my current medications (${patient.medications.map(m => m.name).join(', ')}) still optimal, or are any dose timing or interactions worth reviewing?`,
        rationale: 'Ensures routine medication reconciliation during doctor appointment.'
      });
    }

    // Fallback if everything is normal
    if (qs.length === 0) {
      qs.push({
        id: 'q-general',
        topic: 'Preventive Health Maintenance',
        question: 'All my current test results appear within laboratory reference ranges. What routine preventive screenings or lifestyle habits should we focus on over the next 12 months?',
        rationale: 'Proactive wellness and preventive medicine discussion.'
      });
    }

    return qs;
  }, [patient, readings, trends]);

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyAll = () => {
    const text = generatedQuestions
      .map((q, idx) => `${idx + 1}. [${q.topic}] ${q.question}`)
      .join('\n\n');
    navigator.clipboard.writeText(`Questions for My Doctor — ${patient.name}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>Questions to Ask Your Doctor</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                Patient Advocacy
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Personalized, non-prescriptive talking points derived from your objective test results
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onShareWhatsApp && (
            <button
              onClick={onShareWhatsApp}
              aria-label="Share questions for doctor to WhatsApp"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
              title="Share these questions to WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Share to WhatsApp</span>
            </button>
          )}
          <button
            onClick={handleCopyAll}
            aria-label="Copy all generated questions to clipboard"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy All'}</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2.5" role="list" aria-label="Questions for your doctor">
        {generatedQuestions.map((q) => {
          const isChecked = checkedIds.has(q.id);

          return (
            <div
              key={q.id}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={0}
              onClick={() => toggleCheck(q.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleCheck(q.id);
                }
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                isChecked
                  ? 'bg-teal-50/50 border-teal-200 text-teal-950 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}}
                aria-label={`Select question: ${q.topic}`}
                className="mt-1 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />

              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {q.topic}
                  </span>
                  <span className="text-[10px] text-slate-400 italic">
                    {q.rationale}
                  </span>
                </div>
                <p className={`text-xs font-medium leading-relaxed ${isChecked ? 'text-teal-950 font-semibold' : 'text-slate-800'}`}>
                  "{q.question}"
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
        <span>Check off questions you plan to bring to your appointment.</span>
        <span className="font-mono text-[10px]">MedLens Clinical Advocacy v2.5</span>
      </div>

    </div>
  );
};
