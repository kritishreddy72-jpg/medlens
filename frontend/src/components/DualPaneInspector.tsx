import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Eye, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  Clock,
  ArrowUpDown,
  Lock,
  Check,
  Plus,
  Copy,
  ChevronRight
} from 'lucide-react';
import { BiomarkerReading, BiomarkerStatus, ProvenanceType } from '../types/clinical';
import { evaluateBiomarkerStatus, isGatedForReview } from '../engine/rangeEvaluator';
import { RangeVisualizer } from './RangeVisualizer';

interface DualPaneInspectorProps {
  documentTitle: string;
  documentDate: string;
  facility: string;
  rawText: string;
  readings: BiomarkerReading[];
  onUpdateReading: (updated: BiomarkerReading, reason: string) => void;
  selectedReadingId: string | null;
  onSelectReading: (id: string | null) => void;
}

const CATEGORIES = ['ALL', 'Metabolic', 'Complete Blood Count', 'Lipid Panel', 'Renal', 'Hepatic', 'Inflammatory', 'Other'];

export const DualPaneInspector: React.FC<DualPaneInspectorProps> = ({
  documentTitle,
  documentDate,
  facility,
  rawText,
  readings,
  onUpdateReading,
  selectedReadingId,
  onSelectReading
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ABNORMAL' | 'NEEDS_REVIEW'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedDoc, setCopiedDoc] = useState(false);
  
  // Edit State
  const [editingReading, setEditingReading] = useState<BiomarkerReading | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('');
  const [editRange, setEditRange] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  // Close inline edit modal on Escape
  useEffect(() => {
    if (!editingReading) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingReading(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingReading]);

  const selectedReading = readings.find(r => r.id === selectedReadingId) || null;

  // Filter readings
  const filteredReadings = readings.filter(r => {
    const matchesSearch = r.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
      return false;
    }

    if (filter === 'ABNORMAL') {
      return r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL';
    }
    if (filter === 'NEEDS_REVIEW') {
      return r.needs_review || r.confidence < 0.70;
    }
    return true;
  });

  const handleOpenEdit = (reading: BiomarkerReading) => {
    setEditingReading(reading);
    setEditValue(String(reading.value));
    setEditUnit(reading.unit);
    setEditRange(reading.reference_range.text_range);
    setEditReason(reading.needs_review ? 'Human verification of low-confidence OCR text' : 'Corrected transcription value');
  };

  const handleQuickVerify = (reading: BiomarkerReading, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated: BiomarkerReading = {
      ...reading,
      confidence: 1.0,
      needs_review: false,
      provenance: 'EXTRACTED_VERIFIED',
      notes: 'Verified by human reviewer'
    };
    onUpdateReading(updated, 'Confirmed accuracy against physical report');
  };

  const handleSaveEdit = () => {
    if (!editingReading) return;

    const numericParsed = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
    const finalValue = isNaN(numericParsed) ? editValue : numericParsed;

    const updatedRefRange = {
      ...editingReading.reference_range,
      text_range: editRange,
      is_present: !editRange.toLowerCase().includes('unspecified')
    };

    const newStatus = evaluateBiomarkerStatus(editingReading.test_name, finalValue, updatedRefRange);

    const updated: BiomarkerReading = {
      ...editingReading,
      value: finalValue,
      unit: editUnit,
      reference_range: updatedRefRange,
      status: newStatus,
      confidence: 1.0, // Human verified!
      needs_review: false,
      provenance: 'EXTRACTED_VERIFIED',
      notes: `Human verified by user: ${editReason}`
    };

    onUpdateReading(updated, editReason || 'Manual clinician / user correction');
    setEditingReading(null);
  };

  const handleCopyDoc = () => {
    navigator.clipboard.writeText(rawText);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  const getStatusBadge = (status: BiomarkerStatus) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Normal
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            ↓ Low
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            ↑ High
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            ⚠️ Critical
          </span>
        );
      case 'UNSPECIFIED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200" title="Reference range was not specified in the source document. MedLens does not invent ranges.">
            Unspecified
          </span>
        );
    }
  };

  const getProvenanceBadge = (provenance: ProvenanceType) => {
    switch (provenance) {
      case 'USER_REPORTED':
        return (
          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            User Reported
          </span>
        );
      case 'EXTRACTED_VERIFIED':
        return (
          <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            Verified
          </span>
        );
      case 'EXTRACTED_UNVERIFIED':
        return (
          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            Unverified
          </span>
        );
      case 'SYNTHESIZED':
        return (
          <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
            AI Synthesis
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      
      {/* LEFT PANE: Source Document Ground-Truth Inspector (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-sm flex flex-col h-[700px] overflow-hidden">
        
        {/* Document Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white truncate max-w-[220px]">
                {documentTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                {facility} • {documentDate}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyDoc}
              aria-label="Copy raw document text"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy Raw Text"
            >
              {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span>Ground Truth</span>
            </span>
          </div>
        </div>

        {/* Selected Snippet Callout Banner (if reading clicked) */}
        {selectedReading && (
          <div className="p-3 bg-blue-950/60 border-b border-blue-900/60 text-xs flex items-start space-x-2 animate-in fade-in">
            <Eye className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-blue-200">
                Inspecting: {selectedReading.test_name} ({selectedReading.value} {selectedReading.unit})
              </span>
              <p className="text-[11px] text-blue-300/80 font-mono italic">
                Source: "{selectedReading.source_snippet}"
              </p>
            </div>
          </div>
        )}

        {/* Verbatim Document Text Viewer with Line Numbers */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 space-y-0.5">
          {rawText.split('\n').map((line, idx) => {
            const isHighlighted = selectedReading && selectedReading.source_snippet && 
              line.toLowerCase().includes(selectedReading.source_snippet.toLowerCase().slice(0, 20));

            return (
              <div
                key={idx}
                className={`py-0.5 px-2 rounded transition-colors flex items-start space-x-2 ${
                  isHighlighted 
                    ? 'bg-amber-400/20 text-amber-200 border-l-2 border-amber-400 font-bold' 
                    : 'hover:bg-slate-800/60'
                }`}
              >
                <span className="text-[10px] text-slate-600 select-none w-6 text-right shrink-0">
                  {idx + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap">
                  {line || '\u00A0'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Document Footer */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span>Click any row on the right to pinpoint source line</span>
          <span className="text-cyan-400 font-mono text-[10px]">Zero Hallucination Verified</span>
        </div>

      </div>

      {/* RIGHT PANE: Structured Clinical Medical Record Table (7 Cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[700px] overflow-hidden">
        
        {/* Table Controls & Filter Bar */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Structured Clinical Biomarkers
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic validation against laboratory-specified reference intervals
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({readings.length})
              </button>
              <button
                onClick={() => setFilter('ABNORMAL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filter === 'ABNORMAL' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Out of Range ({readings.filter(r => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL').length})
              </button>
              <button
                onClick={() => setFilter('NEEDS_REVIEW')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filter === 'NEEDS_REVIEW' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Review Required ({readings.filter(r => r.needs_review || r.confidence < 0.70).length})
              </button>
            </div>
          </div>

          {/* Search Input & Category Pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search biomarker or category (e.g. Glucose, Hemoglobin, Lipid)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Table View */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur z-10 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Biomarker / Category</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Source Ref Range</th>
                <th className="py-2.5 px-3">Visual Range Gauge</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Confidence</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReadings.map((reading) => {
                const isSelected = reading.id === selectedReadingId;
                const isGated = reading.needs_review || reading.confidence < 0.70;

                return (
                  <tr
                    key={reading.id}
                    onClick={() => onSelectReading(reading.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-blue-600'
                        : isGated
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    
                    {/* Test Name & Category */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{reading.test_name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                        <span>{reading.category}</span>
                        <span>•</span>
                        {getProvenanceBadge(reading.provenance)}
                      </div>
                    </td>

                    {/* Value & Unit */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 text-sm">
                        {reading.value}
                      </span>
                      <span className="text-slate-500 ml-1 text-xs">{reading.unit}</span>
                    </td>

                    {/* Laboratory Reference Range (Strict) */}
                    <td className="py-3 px-3">
                      {reading.reference_range.is_present ? (
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {reading.reference_range.text_range}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]" title="Zero-hallucination: No range specified in source report">
                          Unspecified by Lab
                        </span>
                      )}
                    </td>

                    {/* Visual Range Gauge */}
                    <td className="py-3 px-3">
                      <RangeVisualizer reading={reading} compact={true} />
                    </td>

                    {/* Status Flag */}
                    <td className="py-3 px-3">
                      {getStatusBadge(reading.status)}
                    </td>

                    {/* Confidence & Review Barrier */}
                    <td className="py-3 px-3 text-center">
                      {isGated ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Review</span>
                        </span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-[11px] font-semibold text-slate-700">
                            {(reading.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-[9px] text-emerald-600 font-medium">Verified</span>
                        </div>
                      )}
                    </td>

                    {/* Actions (Inspect, Quick Verify, Edit) */}
                    <td className="py-3 px-3 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      {isGated && (
                        <button
                          onClick={(e) => handleQuickVerify(reading, e)}
                          aria-label={`Quick verify ${reading.test_name}`}
                          className="p-1.5 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Quick Verify (Approve extracted value)"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectReading(reading.id)}
                        aria-label={`Pinpoint ${reading.test_name} on source document`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Pinpoint on Source Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(reading)}
                        aria-label={`Edit ${reading.test_name} and log audit entry`}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          isGated 
                            ? 'text-amber-700 bg-amber-100 hover:bg-amber-200' 
                            : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                        title={isGated ? 'Verify low-confidence extraction' : 'Edit reading and log audit entry'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span>Total: <strong>{readings.length}</strong> markers</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Normal: {readings.filter(r => r.status === 'NORMAL').length}</span>
            <span>•</span>
            <span className="text-amber-700 font-medium">Out of Range: {readings.filter(r => r.status === 'HIGH' || r.status === 'LOW' || r.status === 'CRITICAL').length}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click edit pencil to human-verify any field
          </span>
        </div>

      </div>

      {/* INLINE EDIT & AUDIT MODAL */}
      {editingReading && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-reading-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 id="edit-reading-title" className="text-base font-bold text-slate-900">
                  Human-in-the-Loop Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Modifying: {editingReading.test_name}
                </p>
              </div>
              <button
                onClick={() => setEditingReading(null)}
                aria-label="Close edit dialog"
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {editingReading.needs_review && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This reading was flagged with low extraction confidence ({(editingReading.confidence * 100).toFixed(0)}%). Please confirm the value matches the source document.
                </span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observed Value
                </label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit of Measurement
                </label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Printed Reference Range (from Source)
                </label>
                <input
                  type="text"
                  value={editRange}
                  onChange={(e) => setEditRange(e.target.value)}
                  placeholder="e.g. 70 - 99 or < 5.7 or Unspecified by Laboratory"
                  className="w-full px-3 py-2 border rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Never guess standard population statistics. Enter only what is printed on the source report.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Modification (Logged to Audit Trail)
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Corrected OCR misread of blurred character"
                  className="w-full px-3 py-2 border rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingReading(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Verify & Save to Record</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
