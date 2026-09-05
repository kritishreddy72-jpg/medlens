import React, { useEffect } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  X,
  Stethoscope,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { SbarReport } from '../engine/sbarGenerator';

interface DoctorBriefingModalProps {
  sbar: SbarReport;
  fhirJson: any;
  onShareWhatsApp?: () => void;
  onClose: () => void;
}

export const DoctorBriefingModal: React.FC<DoctorBriefingModalProps> = ({
  sbar,
  fhirJson,
  onShareWhatsApp,
  onClose
}) => {
  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFhir = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fhirJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `medlens-fhir-record-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header (Hidden during print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between no-print bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 id="briefing-modal-title" className="text-base font-bold text-slate-900">
                Doctor-Visit Briefing Pack (SBAR Clinical Standard)
              </h2>
              <p className="text-xs text-slate-500">
                1-Page printable consultation brief with FHIR R4 interoperable export
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadFhir}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Download FHIR R4 JSON Bundle"
            >
              <Download className="w-3.5 h-3.5" />
              <span>FHIR R4 JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            {onShareWhatsApp && (
              <button
                onClick={onShareWhatsApp}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
                title="Share this clinical briefing to WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close briefing dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable SBAR Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-slate-800 text-xs leading-relaxed" id="printable-briefing">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <span>MEDLENS CLINICAL CONSULTATION BRIEF</span>
              </div>
              <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                Structured Pre-Consultation Summary for Attending Physician
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-mono">
              Generated: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* S - SITUATION */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 font-black text-slate-900 uppercase tracking-wider text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">S</span>
              <span>Situation</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p><strong>Patient:</strong> {sbar.situation.patient_header}</p>
              <p><strong>Presenting Symptoms:</strong> {sbar.situation.primary_symptoms}</p>
              <p><strong>Objective:</strong> {sbar.situation.visit_objective}</p>
            </div>
          </div>

          {/* B - BACKGROUND */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 font-black text-slate-900 uppercase tracking-wider text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">B</span>
              <span>Background</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Chronic Conditions:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {sbar.background.chronic_conditions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Confirmed Allergies:</span>
                <ul className="list-disc list-inside text-rose-700 font-semibold space-y-0.5">
                  {sbar.background.confirmed_allergies.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Active Regimen:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {sbar.background.current_medications.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* A - ASSESSMENT */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 font-black text-slate-900 uppercase tracking-wider text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">A</span>
              <span>Assessment & Laboratory Findings</span>
            </div>

            {/* Abnormal findings table */}
            {sbar.assessment.abnormal_biomarkers.length > 0 ? (
              <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                  <tr>
                    <th className="p-2 border-b border-slate-200">Biomarker</th>
                    <th className="p-2 border-b border-slate-200">Result</th>
                    <th className="p-2 border-b border-slate-200">Lab Reference Range</th>
                    <th className="p-2 border-b border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {sbar.assessment.abnormal_biomarkers.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 font-sans font-semibold text-slate-900">{b.name}</td>
                      <td className="p-2 font-bold text-slate-900">{b.value} {b.unit}</td>
                      <td className="p-2 text-slate-600">{b.reference_range}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.direction}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic">All evaluated laboratory markers are within reported reference ranges.</p>
            )}

            {/* Contradiction Radar Highlights */}
            {sbar.assessment.contradictions.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="font-bold text-rose-800 block">Identified Clinical Contradictions:</span>
                {sbar.assessment.contradictions.map((c, i) => (
                  <p key={i} className="text-rose-700 text-[11px]">{c}</p>
                ))}
              </div>
            )}
          </div>

          {/* R - RECOMMENDATION / QUESTIONS FOR PHYSICIAN */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 font-black text-slate-900 uppercase tracking-wider text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">R</span>
              <span>Recommended Discussion Points with Attending Physician</span>
            </div>
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2">
              <span className="font-bold text-blue-950 block">Patient Agenda Questions:</span>
              <ul className="space-y-1.5">
                {sbar.recommendations.suggested_physician_questions.map((q, i) => (
                  <li key={i} className="flex items-start space-x-2 text-blue-900">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Responsible AI Disclaimer */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center leading-relaxed">
            <p><strong>RESPONSIBLE CLINICAL AI NOTICE:</strong> {sbar.responsible_ai_notice}</p>
            <p className="mt-1">MedLens does not practice medicine. Reference ranges verified against source laboratory documentation.</p>
          </div>

        </div>

      </div>
    </div>
  );
};
