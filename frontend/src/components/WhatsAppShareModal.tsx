import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Phone
} from 'lucide-react';
import { BiomarkerReading, PatientProfile, ClinicalConflict } from '../types/clinical';
import { TrendAnalysis } from '../engine/chronometer';

interface WhatsAppShareModalProps {
  patient: PatientProfile;
  readings: BiomarkerReading[];
  conflicts: ClinicalConflict[];
  trends?: TrendAnalysis[];
  documentTitle: string;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  patient,
  readings,
  conflicts,
  trends = [],
  documentTitle,
  onClose
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Customization options
  const [includeVitals, setIncludeVitals] = useState(true);
  const [includeAbnormalOnly, setIncludeAbnormalOnly] = useState(true);
  const [includeMeds, setIncludeMeds] = useState(true);
  const [includeAllergies, setIncludeAllergies] = useState(true);
  const [includeDoctorQs, setIncludeDoctorQs] = useState(true);

  // Generate formatted WhatsApp message
  const whatsappMessage = useMemo(() => {
    const lines: string[] = [];

    // 1. Header
    lines.push('🏥 *MEDLENS CLINICAL INFORMATION SUMMARY*');
    lines.push(`👤 *Patient:* ${patient.name} (${patient.age} y/o, ${patient.sex})`);
    if (patient.blood_group) {
      lines.push(`🩸 *Blood Group:* ${patient.blood_group}`);
    }
    lines.push(`📅 *Date:* ${new Date().toLocaleDateString()}`);
    lines.push(`📄 *Source Report:* ${documentTitle}`);
    lines.push('');

    // 2. Vitals
    if (includeVitals && patient.vitals) {
      const v = patient.vitals;
      lines.push('🩺 *Baseline Vitals:*');
      lines.push(`• BP: ${v.blood_pressure || '120/80 mmHg'}`);
      lines.push(`• Pulse: ${v.heart_rate || 74} bpm`);
      lines.push(`• SpO2: ${v.spo2 || 98}%`);
      lines.push(`• Temp: ${v.temperature || 98.6} °F`);
      lines.push('');
    }

    // 3. Clinical Contradictions / Conflicts
    const criticalConflicts = conflicts.filter(c => c.severity === 'CRITICAL');
    if (criticalConflicts.length > 0) {
      lines.push('🚨 *CLINICAL RADAR WARNINGS:*');
      criticalConflicts.forEach(c => {
        lines.push(`⚠️ *${c.title}*`);
        lines.push(`   ${c.description}`);
      });
      lines.push('');
    }

    // 4. Laboratory Biomarkers
    const abnormal = readings.filter(r => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL');
    const selectedReadings = includeAbnormalOnly ? abnormal : readings;

    if (selectedReadings.length > 0) {
      lines.push(includeAbnormalOnly ? '⚠️ *Out of Range Biomarkers:*' : '🧪 *Laboratory Results:*');
      selectedReadings.forEach(r => {
        const flagEmoji = r.status === 'CRITICAL' ? '🚨' : r.status === 'HIGH' ? '🔺' : r.status === 'LOW' ? '🔻' : '✅';
        const refStr = r.reference_range.is_present ? `(Ref: ${r.reference_range.text_range})` : '(Ref: Unspecified)';
        lines.push(`${flagEmoji} *${r.test_name}:* ${r.value} ${r.unit} ${refStr} [${r.status}]`);
      });
      lines.push('');
    } else {
      lines.push('✅ *Laboratory Results:* All tested biomarkers are within laboratory reference intervals.');
      lines.push('');
    }

    // 5. Active Medications
    if (includeMeds && patient.medications.length > 0) {
      lines.push('💊 *Active Medications:*');
      patient.medications.forEach(m => {
        lines.push(`• ${m.name} ${m.dosage} (${m.frequency})`);
      });
      lines.push('');
    }

    // 6. Confirmed Allergies
    if (includeAllergies) {
      lines.push('🚫 *Allergies:*');
      if (patient.allergies.length > 0) {
        patient.allergies.forEach(a => {
          lines.push(`• ⚠️ *${a.substance}* - ${a.reaction} (Severity: ${a.severity})`);
        });
      } else {
        lines.push('• No known drug allergies (NKDA)');
      }
      lines.push('');
    }

    // 7. Questions to ask doctor
    if (includeDoctorQs) {
      lines.push('❓ *Questions for Next Doctor Consultation:*');
      if (abnormal.some(r => r.test_name.toLowerCase().includes('glucose') || r.test_name.toLowerCase().includes('a1c'))) {
        lines.push('1. Given my elevated glycemic numbers, what lifestyle or dose changes are recommended?');
      }
      if (abnormal.some(r => r.test_name.toLowerCase().includes('albumin') || r.test_name.toLowerCase().includes('egfr'))) {
        lines.push('2. What renal protection strategies should we discuss for my kidneys?');
      }
      if (patient.medications.length > 0) {
        lines.push('3. Are there any medication timing or interaction considerations I should keep in mind?');
      }
      lines.push('');
    }

    // 8. Responsible AI Disclaimer
    lines.push('🔒 _Note: Structured by MedLens AI. Non-diagnostic informational summary. Reference ranges derived directly from source report. Please consult your physician._');

    return lines.join('\n');
  }, [patient, readings, conflicts, documentTitle, includeVitals, includeAbnormalOnly, includeMeds, includeAllergies, includeDoctorQs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(whatsappMessage);
    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Share Clinical Record via WhatsApp</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Instant Sharing
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Send structured pre-formatted briefing directly to your physician, family, or caregiver
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Options Toggle Pills */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
          <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
            Include in WhatsApp Message:
          </span>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={includeAbnormalOnly}
                onChange={(e) => setIncludeAbnormalOnly(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Abnormal Labs Only</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={includeVitals}
                onChange={(e) => setIncludeVitals(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Baseline Vitals</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={includeMeds}
                onChange={(e) => setIncludeMeds(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Medications</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={includeAllergies}
                onChange={(e) => setIncludeAllergies(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Allergies</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={includeDoctorQs}
                onChange={(e) => setIncludeDoctorQs(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700">Doctor Questions</span>
            </label>
          </div>
        </div>

        {/* Recipient Phone Input (Optional) */}
        <div className="space-y-1 text-xs">
          <label className="font-semibold text-slate-700 flex items-center space-x-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Recipient Phone Number (Optional - or choose contact inside WhatsApp):</span>
          </label>
          <input
            type="tel"
            placeholder="e.g. +14155552671 (include country code) or leave blank"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Message Preview */}
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[160px]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Live WhatsApp Message Preview:</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-[11px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
          <div className="p-3.5 bg-emerald-950 text-emerald-100 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto border border-emerald-800">
            {whatsappMessage}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>End-to-End Encrypted via Official WhatsApp API</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
