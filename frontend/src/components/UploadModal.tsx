import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, Sparkles, Loader2, Cpu } from 'lucide-react';
import { extractMedicalReportWithGemini, ExtractionResult } from '../services/geminiService';
import { parseClinicalTextOffline } from '../engine/offlineClinicalParser';

interface UploadModalProps {
  onExtractionComplete: (result: ExtractionResult, rawTextPreview: string, docTitle: string) => void;
  onClose: () => void;
}

const SAMPLE_REPORTS = [
  {
    title: 'Comprehensive Metabolic & Lipid (Quest)',
    badge: 'Metabolic & Lipid',
    text: `QUEST DIAGNOSTICS - CLINICAL PATHOLOGY
Patient: David Miller | DOB: 1978-05-12 | Age: 48 | Sex: M
Specimen: Venous Blood | Collected: 2026-09-04

TEST NAME                        VALUE      UNIT       REFERENCE RANGE   FLAG
-----------------------------------------------------------------------------
Fasting Blood Glucose            142        mg/dL      70 - 99           HIGH
Hemoglobin A1c                   7.6        %          < 5.7             HIGH
Total Cholesterol                224        mg/dL      < 200             HIGH
HDL Cholesterol                  38         mg/dL      > 40              LOW
LDL Cholesterol (Calculated)     151        mg/dL      < 100             HIGH
Triglycerides                    175        mg/dL      < 150             HIGH
Serum Creatinine                 1.18       mg/dL      0.70 - 1.30       NORMAL
eGFR (CKD-EPI)                   74         mL/min     > 60              NORMAL
Serum Potassium                  5.4        mEq/L      3.5 - 5.0         HIGH
Serum Sodium                     141        mEq/L      135 - 145         NORMAL
Alkaline Phosphatase             68         U/L        Unspecified       --`
  },
  {
    title: 'Complete Blood Count & Inflammatory (LabCorp)',
    badge: 'CBC & Smear',
    text: `LABCORP CLINICAL LABORATORIES
Patient: Angela Gomez | DOB: 1989-11-20 | Age: 36 | Sex: F
Specimen: Whole Blood EDTA | Collected: 2026-09-03

TEST NAME                        VALUE      UNIT          REFERENCE RANGE   FLAG
--------------------------------------------------------------------------------
White Blood Cells (WBC)          13.2       x10^3/uL      4.5 - 11.0        HIGH
Red Blood Cells (RBC)            3.75       x10^6/uL      4.00 - 5.20       LOW
Hemoglobin                       10.8       g/dL          12.0 - 15.5       LOW
Hematocrit                       33.4       %             36.0 - 46.0       LOW
Platelet Count                   230        x10^3/uL      150 - 450         NORMAL
Neutrophils, Absolute            10.1       x10^3/uL      1.8 - 7.7         HIGH
Lymphocytes, Absolute            1.9        x10^3/uL      1.0 - 4.8         NORMAL
Erythrocyte Sedimentation Rate   38         mm/hr         0 - 20            HIGH
C-Reactive Protein (CRP)         8.4        mg/L          < 3.0             HIGH`
  },
  {
    title: 'Urgent Care Prescription & Vitals (CityCare)',
    badge: 'Rx & Allergy Alert',
    text: `CITYCARE WALK-IN CLINIC
Patient: Thomas Reed | Age: 45 | Sex: M | Date: 2026-09-05
Diagnosis: Acute Sinusitis
Vitals: Temp 100.2 F | Pulse 88 bpm | SpO2 98%

Rx:
Augmentin 875 mg / 125 mg
SIG: Take 1 tablet orally twice daily for 10 days
Dispense: 20 tablets`
  }
];

export const UploadModal: React.FC<UploadModalProps> = ({
  onExtractionComplete,
  onClose
}) => {
  const [mode, setMode] = useState<'LOCAL' | 'GEMINI'>('LOCAL');
  const [file, setFile] = useState<File | null>(null);
  const [rawTextFallback, setRawTextFallback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);

      // If text file, read text directly into the fallback area
      if (selected.type.includes('text') || selected.name.endsWith('.txt') || selected.name.endsWith('.csv')) {
        const textReader = new FileReader();
        textReader.onload = () => {
          setRawTextFallback(textReader.result as string);
        };
        textReader.readAsText(selected);
      }
    }
  };

  const handleLoadSample = (sample: typeof SAMPLE_REPORTS[0]) => {
    setRawTextFallback(sample.text);
    setFile(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!file && !rawTextFallback.trim()) {
      setError('Please select a report file or paste/load the clinical report text.');
      return;
    }

    setLoading(true);
    setError(null);

    // If Gemini mode is selected (runs through secure backend proxy)
    if (mode === 'GEMINI') {
      try {
        if (file && !rawTextFallback.trim()) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const mimeType = file.type || 'image/png';

            try {
              const result = await extractMedicalReportWithGemini({
                base64: base64Data,
                mimeType
              });
              onExtractionComplete(
                result,
                `Uploaded Document: ${file.name}\nExtracted via Secure Backend Gemini 2.5 Flash Multimodal Vision.\n\nSummary:\n${result.document_summary}`,
                file.name
              );
              onClose();
            } catch (err: any) {
              setError(`Gemini Extraction Error: ${err.message || String(err)}`);
              setLoading(false);
            }
          };
          reader.readAsDataURL(file);
        } else {
          const base64Data = btoa(unescape(encodeURIComponent(rawTextFallback)));
          const result = await extractMedicalReportWithGemini({
            base64: base64Data,
            mimeType: 'text/plain'
          });
          onExtractionComplete(result, rawTextFallback, file?.name || 'Uploaded Clinical Document');
          onClose();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to process document with Gemini');
        setLoading(false);
      }
      return;
    }

    // Default: Intelligent Local Clinical Parser (Zero API Key required)
    try {
      const textToParse = rawTextFallback.trim();
      const localResult = parseClinicalTextOffline(textToParse);

      const extractionResult: ExtractionResult = {
        readings: localResult.readings,
        document_summary: localResult.document_summary,
        extracted_patient_info: localResult.extracted_patient_info
      };

      onExtractionComplete(
        extractionResult,
        textToParse,
        file?.name || 'Local Extracted Medical Record'
      );
      onClose();
    } catch (err: any) {
      setError(`Local Parser Error: ${err.message || String(err)}`);
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 id="upload-modal-title" className="text-base font-bold text-slate-900">
                Medical Report Processing & Intake
              </h2>
              <p className="text-xs text-slate-500">
                Extracts test names, values, units, reference ranges, and source provenance
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close upload dialog"
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('LOCAL')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              mode === 'LOCAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>Local Clinical Engine (Offline)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('GEMINI')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              mode === 'GEMINI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Gemini 2.5 Flash (Backend API)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
          
          {/* If Gemini Mode, Show Secure Server Notice */}
          {mode === 'GEMINI' && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-slate-700 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold text-slate-900 block">Server-Side Gemini 2.5 Flash Multimodal Intake</span>
                Document payload is processed via the MedLens Express backend. The Gemini API key is kept secure in server environment variables (<code className="font-mono bg-blue-100/70 px-1 py-0.5 rounded text-blue-800">GEMINI_API_KEY</code>) and never exposed in browser localStorage.
              </div>
            </div>
          )}

          {/* Quick Preloaded Report Templates */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-700 block">
              1-Click Realistic Clinical Report Templates:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_REPORTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-800 truncate">{sample.badge}</span>
                    <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{sample.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* File Drag and Drop / Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              Upload Report Document (PDF, Image, or Text)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                accept="image/*,application/pdf,text/*,.csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-1.5">
                <FileText className="w-8 h-8 text-blue-500 mx-auto" />
                <span className="text-xs font-semibold text-slate-700 block">
                  {file ? file.name : 'Click to browse and select medical file'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Accepts PDF lab reports, photos of lab printouts, or text export files
                </span>
              </label>
            </div>
          </div>

          {/* Raw Text Input / Fallback */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-700">
                Medical Report Text / Verbatim OCR Content:
              </label>
              {rawTextFallback && (
                <button
                  type="button"
                  onClick={() => setRawTextFallback('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Clear text
                </button>
              )}
            </div>
            <textarea
              rows={5}
              placeholder="Paste raw laboratory report text here, or choose one of the templates above..."
              value={rawTextFallback}
              onChange={(e) => setRawTextFallback(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-between border-t border-slate-100">
          <div className="text-[10px] text-slate-400">
            Strict Zero-Hallucination & Reference Range Compliance
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract & Structure Record</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
