import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  FileText, 
  Upload, 
  Printer, 
  History, 
  Sparkles, 
  AlertTriangle, 
  FileCheck,
  Download,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import { CLINICAL_PRESETS } from '../data/clinicalPresets';
import { ClinicalPreset } from '../types/clinical';

interface NavbarProps {
  selectedPreset: ClinicalPreset;
  onSelectPreset: (preset: ClinicalPreset) => void;
  onOpenUpload: () => void;
  onOpenBriefing: () => void;
  onOpenAudit: () => void;
  onExportPdf: () => void;
  onNewPatient: () => void;
  onOpenWhatsApp: () => void;
  auditCount: number;
  hasCriticalConflicts: boolean;
  unreviewedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedPreset,
  onSelectPreset,
  onOpenUpload,
  onOpenBriefing,
  onOpenAudit,
  onExportPdf,
  onNewPatient,
  onOpenWhatsApp,
  auditCount,
  hasCriticalConflicts,
  unreviewedCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">MedLens</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-blue-700 bg-blue-50 border border-blue-200/70 rounded-full uppercase">
                  Clinical Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Deterministic Range Engine • Ground-Truth Provenance
              </p>
            </div>
          </div>

          {/* Clinical Preset Switcher for 1-Click Evaluation */}
          <div className="hidden lg:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 px-2 uppercase tracking-wider">
              Cases:
            </span>
            {CLINICAL_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedPreset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  title={preset.subtitle}
                >
                  {preset.title.split(' ')[0]} {preset.title.includes('Allergy') ? 'Allergy' : preset.badge.split('/')[0]}
                </button>
              );
            })}
            
            <button
              onClick={onNewPatient}
              className="ml-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Start a new blank patient intake from scratch"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Patient</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Custom Document Upload */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Report</span>
            </button>

            {/* Audit Log Trigger */}
            <button
              onClick={onOpenAudit}
              className="relative inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="View Human-in-the-Loop Audit Trail"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Audit Log</span>
              {auditCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                  {auditCount}
                </span>
              )}
            </button>

            {/* Quick PDF Export */}
            <button
              onClick={onExportPdf}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer"
              title="Download Clinical Summary PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Export PDF</span>
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={onOpenWhatsApp}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
              title="Share Clinical Summary to WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            {/* Doctor SBAR Briefing Pack */}
            <button
              onClick={onOpenBriefing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Doctor Briefing</span>
            </button>

          </div>

        </div>

        {/* Mobile Preset Selector Bar */}
        <div className="lg:hidden flex items-center overflow-x-auto py-2 space-x-1 border-t border-slate-100 no-scrollbar">
          {CLINICAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                preset.id === selectedPreset.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {preset.title.split(' ')[0]} {preset.badge.split('/')[0]}
            </button>
          ))}
          <button
            onClick={onNewPatient}
            className="shrink-0 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1"
          >
            <UserPlus className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>

      </div>
    </header>
  );
};
