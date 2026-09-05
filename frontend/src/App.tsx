import React, { useState, useMemo, useEffect } from 'react';
import { CLINICAL_PRESETS } from './data/clinicalPresets';
import { 
  BiomarkerReading, 
  ClinicalConflict, 
  ClinicalPreset, 
  PatientProfile, 
  AuditEntry,
  ClarificationPrompt 
} from './types/clinical';
import { Navbar } from './components/Navbar';
import { PatientHeader } from './components/PatientHeader';
import { ConflictBanner } from './components/ConflictBanner';
import { DualPaneInspector } from './components/DualPaneInspector';
import { BiomarkerChronometerView } from './components/BiomarkerChronometerView';
import { ResponsibleAiSummaryCard } from './components/ResponsibleAiSummaryCard';
import { DoctorQuestionsCard } from './components/DoctorQuestionsCard';
import { DoctorBriefingModal } from './components/DoctorBriefingModal';
import { AuditLogModal } from './components/AuditLogModal';
import { UploadModal } from './components/UploadModal';
import { PatientIntakeModal } from './components/PatientIntakeModal';
import { ClarificationChips } from './components/ClarificationChips';
import { detectClinicalConflicts } from './engine/conflictRadar';
import { calculateLongitudinalTrends, BiomarkerTrend } from './engine/chronometer';
import { generateSbarReport, exportToFhirR4, SbarReport } from './engine/sbarGenerator';
import { generateClinicalSummaryPdf } from './services/pdfExportService';
import { ExtractionResult } from './services/geminiService';
import { 
  checkBackendHealth,
  evaluateConflictsWithBackend,
  calculateTrendsWithBackend,
  generateSbarWithBackend,
  exportFhirWithBackend 
} from './services/apiClient';
import { evaluateBiomarkerStatus } from './engine/rangeEvaluator';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { ShieldCheck, HeartPulse, Sparkles, AlertCircle, Database, FileText } from 'lucide-react';

export function App() {
  // Current active preset
  const [selectedPreset, setSelectedPreset] = useState<ClinicalPreset>(CLINICAL_PRESETS[0]);

  // Working state for active patient & clinical record
  const [patient, setPatient] = useState<PatientProfile>(CLINICAL_PRESETS[0].patient);
  const [documentInfo, setDocumentInfo] = useState(CLINICAL_PRESETS[0].document);
  const [readings, setReadings] = useState<BiomarkerReading[]>(CLINICAL_PRESETS[0].readings);
  const [historicalReadings, setHistoricalReadings] = useState<BiomarkerReading[]>(
    CLINICAL_PRESETS[0].historical_readings || []
  );
  const [clarifications, setClarifications] = useState<ClarificationPrompt[]>(
    CLINICAL_PRESETS[0].initial_clarifications || []
  );

  // Audit trail state
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  // Selection & Modal visibility states
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Switch preset handler
  const handleSelectPreset = (preset: ClinicalPreset) => {
    setSelectedPreset(preset);
    setPatient(preset.patient);
    setDocumentInfo(preset.document);
    setReadings(preset.readings);
    setHistoricalReadings(preset.historical_readings || []);
    setClarifications(preset.initial_clarifications || []);
    setSelectedReadingId(null);
  };

  // Start new blank patient from scratch
  const handleNewPatient = () => {
    const blankPatient: PatientProfile = {
      id: `pt-${Date.now().toString().slice(-4)}`,
      name: 'Jane Doe',
      age: 46,
      sex: 'Female',
      blood_group: 'A+',
      vitals: {
        blood_pressure: '124/80 mmHg',
        heart_rate: 76,
        spo2: 99,
        temperature: 98.6,
        bmi: 23.5
      },
      symptoms: ['Mild fatigue after work', 'Occasional morning stiffness'],
      conditions: ['Mild Osteopenia'],
      medications: [
        { name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Once daily' }
      ],
      allergies: [
        { substance: 'Sulfa Drugs', reaction: 'Mild skin rash', severity: 'Mild' }
      ],
      provenance: 'USER_REPORTED'
    };

    setPatient(blankPatient);
    setDocumentInfo({
      title: 'Awaiting Document Upload',
      date: new Date().toISOString().split('T')[0],
      facility: 'Select or paste a medical report to start intake',
      raw_text: `================================================================================
NEW PATIENT INTAKE - MEDICAL RECORD AWAITING DOCUMENTATION
Patient: Jane Doe | DOB: 1980-03-14 | Sex: F | Age: 46
================================================================================
Click "Upload Report" in the navigation bar to parse a lab report (PDF/Image/Text).
Alternatively, click "Update Intake Info & Vitals" above to edit patient details.
================================================================================`,
      report_type: 'Pending Upload'
    });
    setReadings([]);
    setHistoricalReadings([]);
    setClarifications([]);
    setSelectedReadingId(null);
    setIsIntakeOpen(true);
  };

  // Export Clinical Summary PDF
  const handleExportPdf = () => {
    generateClinicalSummaryPdf(patient, readings, conflicts, documentInfo.title);
  };

  // Human-in-the-loop update handler
  const handleUpdateReading = (updated: BiomarkerReading, reason: string) => {
    const existing = readings.find(r => r.id === updated.id);
    if (!existing) return;

    // Record audit entry
    const entry: AuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      test_id: updated.id,
      test_name: updated.test_name,
      field: 'Value / Reference Range',
      old_value: `${existing.value} ${existing.unit} [${existing.reference_range.text_range}]`,
      new_value: `${updated.value} ${updated.unit} [${updated.reference_range.text_range}]`,
      modified_by: 'Human Clinician / Reviewer',
      reason
    };

    setAuditEntries(prev => [entry, ...prev]);
    setReadings(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  // Clarification resolver handler
  const handleResolveClarification = (promptId: string, selection: string) => {
    setClarifications(prev => prev.map(p => p.id === promptId ? { ...p, resolved: true, user_selection: selection } : p));

    // If it was the ESR smudge in Case 2
    if (selection.includes('46')) {
      const target = readings.find(r => r.test_name.toLowerCase().includes('esr'));
      if (target) {
        const updated: BiomarkerReading = {
          ...target,
          value: 46,
          confidence: 1.0,
          needs_review: false,
          provenance: 'EXTRACTED_VERIFIED',
          notes: 'Clarification resolved: Human verified ESR as 46 mm/hr'
        };
        handleUpdateReading(updated, 'Resolved OCR ambiguity via smart clarification chip');
      }
    }
  };

  // Live or local extraction complete handler
  const handleExtractionComplete = (
    result: ExtractionResult,
    rawTextPreview: string,
    docTitle: string
  ) => {
    setDocumentInfo({
      title: docTitle,
      date: result.extracted_patient_info?.collection_date || new Date().toISOString().split('T')[0],
      facility: 'Ingested & Verified Clinical Document',
      raw_text: rawTextPreview,
      report_type: 'Structured Laboratory & Clinical Record'
    });

    if (result.extracted_patient_info?.name) {
      setPatient(prev => ({
        ...prev,
        name: result.extracted_patient_info?.name || prev.name,
        age: result.extracted_patient_info?.age || prev.age,
        sex: (result.extracted_patient_info?.sex as any) || prev.sex
      }));
    }

    setReadings(result.readings);
    setHistoricalReadings([]);
    setSelectedReadingId(null);
  };

  // Backend sync state
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [backendConflicts, setBackendConflicts] = useState<ClinicalConflict[] | null>(null);
  const [backendTrends, setBackendTrends] = useState<BiomarkerTrend[] | null>(null);
  const [backendSbar, setBackendSbar] = useState<SbarReport | null>(null);
  const [backendFhir, setBackendFhir] = useState<any | null>(null);

  // Monitor backend health
  useEffect(() => {
    let timer: any;
    const check = async () => {
      const res = await checkBackendHealth();
      setBackendStatus(res.online ? 'connected' : 'offline');
    };
    check();
    timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute local fallback values
  const localConflicts = useMemo(() => {
    const detected = detectClinicalConflicts(patient, readings);
    const combined = [...(selectedPreset.initial_conflicts || []), ...detected];
    const uniqueMap = new Map<string, ClinicalConflict>();
    for (const c of combined) {
      uniqueMap.set(c.id, c);
    }
    return Array.from(uniqueMap.values());
  }, [patient, readings, selectedPreset]);

  const localTrends = useMemo(() => {
    return calculateLongitudinalTrends(readings, historicalReadings);
  }, [readings, historicalReadings]);

  // Request backend evaluations asynchronously
  useEffect(() => {
    let active = true;
    evaluateConflictsWithBackend(patient, readings)
      .then(res => {
        if (active) {
          const combined = [...(selectedPreset.initial_conflicts || []), ...res];
          const uniqueMap = new Map<string, ClinicalConflict>();
          for (const c of combined) {
            uniqueMap.set(c.id, c);
          }
          setBackendConflicts(Array.from(uniqueMap.values()));
        }
      })
      .catch(err => {
        console.warn('Backend conflicts fallback to local:', err);
      });

    calculateTrendsWithBackend(readings, historicalReadings)
      .then(res => {
        if (active) setBackendTrends(res);
      })
      .catch(err => {
        console.warn('Backend trends fallback to local:', err);
      });

    return () => { active = false; };
  }, [patient, readings, historicalReadings, selectedPreset]);

  // Active conflicts and trends (backend result prioritized, local as instant fallback)
  const conflicts = backendConflicts ?? localConflicts;
  const trends = backendTrends ?? localTrends;

  // Local Sbar & Fhir fallbacks
  const localSbar = useMemo(() => {
    return generateSbarReport(patient, readings, conflicts, trends);
  }, [patient, readings, conflicts, trends]);

  const localFhir = useMemo(() => {
    return exportToFhirR4(patient, readings, documentInfo.title);
  }, [patient, readings, documentInfo]);

  // Sync SBAR and FHIR from backend
  useEffect(() => {
    let active = true;
    generateSbarWithBackend(patient, readings, conflicts, trends)
      .then(res => {
        if (active) setBackendSbar(res);
      })
      .catch(err => {
        console.warn('Backend SBAR fallback to local:', err);
      });

    exportFhirWithBackend(patient, readings, documentInfo.title)
      .then(res => {
        if (active) setBackendFhir(res);
      })
      .catch(err => {
        console.warn('Backend FHIR fallback to local:', err);
      });

    return () => { active = false; };
  }, [patient, readings, conflicts, trends, documentInfo.title]);

  const sbar = backendSbar ?? localSbar;
  const fhirJson = backendFhir ?? localFhir;

  const unreviewedCount = readings.filter(r => r.needs_review || r.confidence < 0.70).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onExportPdf={handleExportPdf}
        onNewPatient={handleNewPatient}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        auditCount={auditEntries.length}
        hasCriticalConflicts={conflicts.some(c => c.severity === 'CRITICAL')}
        unreviewedCount={unreviewedCount}
        backendStatus={backendStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Patient Intake Header */}
        <PatientHeader
          patient={patient}
          onEditPatient={() => setIsIntakeOpen(true)}
        />

        {/* Proactive Clarification Chips (if any ambiguity detected) */}
        <ClarificationChips
          prompts={clarifications}
          onResolvePrompt={handleResolveClarification}
        />

        {/* Clinical Contradiction Radar Alert Banner */}
        <ConflictBanner
          conflicts={conflicts}
        />

        {/* Showpiece: Dual-Pane Ground-Truth Inspector */}
        <DualPaneInspector
          documentTitle={documentInfo.title}
          documentDate={documentInfo.date}
          facility={documentInfo.facility}
          rawText={documentInfo.raw_text}
          readings={readings}
          onUpdateReading={handleUpdateReading}
          selectedReadingId={selectedReadingId}
          onSelectReading={setSelectedReadingId}
        />

        {/* Biomarker Chronometer (Longitudinal Trajectory Sparklines) */}
        <BiomarkerChronometerView
          trends={trends}
        />

        {/* Responsible AI Patient-Friendly Synthesis Card */}
        <ResponsibleAiSummaryCard
          patient={patient}
          readings={readings}
        />

        {/* Doctor Consultation Questions Card (Patient Empowerment) */}
        <DoctorQuestionsCard
          patient={patient}
          readings={readings}
          trends={trends}
          onShareWhatsApp={() => setIsWhatsAppOpen(true)}
        />

      </main>

      {/* Application Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">MedLens</span>
            <span>•</span>
            <span>AI-Powered Clinical Information Intelligence</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Zero-Hallucination Deterministic Engine</span>
          </div>
          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Designed for Clinical Intelligence Evaluation • Strict Non-Diagnostic & HITL Auditable Architecture
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* Doctor-Visit SBAR Briefing Modal */}
      {isBriefingOpen && (
        <DoctorBriefingModal
          sbar={sbar}
          fhirJson={fhirJson}
          onShareWhatsApp={() => {
            setIsBriefingOpen(false);
            setIsWhatsAppOpen(true);
          }}
          onClose={() => setIsBriefingOpen(false)}
        />
      )}

      {/* Human-in-the-Loop Audit Trail Modal */}
      {isAuditOpen && (
        <AuditLogModal
          entries={auditEntries}
          onClose={() => setIsAuditOpen(false)}
        />
      )}

      {/* Live Gemini Multimodal / Local Upload Modal */}
      {isUploadOpen && (
        <UploadModal
          onExtractionComplete={handleExtractionComplete}
          onClose={() => setIsUploadOpen(false)}
        />
      )}

      {/* Patient Intake Editing Modal */}
      {isIntakeOpen && (
        <PatientIntakeModal
          patient={patient}
          onSave={setPatient}
          onClose={() => setIsIntakeOpen(false)}
        />
      )}

      {/* WhatsApp Share Modal */}
      {isWhatsAppOpen && (
        <WhatsAppShareModal
          patient={patient}
          readings={readings}
          conflicts={conflicts}
          trends={trends}
          documentTitle={documentInfo.title}
          onClose={() => setIsWhatsAppOpen(false)}
        />
      )}

    </div>
  );
}

export default App;
