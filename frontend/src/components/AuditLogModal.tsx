import React from 'react';
import { History, X, CheckCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { AuditEntry } from '../types/clinical';

interface AuditLogModalProps {
  entries: AuditEntry[];
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  entries,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Human-in-the-Loop Clinical Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Immutable record of clinician / patient overrides, OCR corrections, and approvals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No human modifications logged yet. Click any test's edit pencil to test the audit trail.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{entry.test_name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 text-blue-800">
                      Field: {entry.field}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-rose-600 line-through">
                    {String(entry.old_value)}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="text-emerald-600 font-bold">
                    {String(entry.new_value)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span><strong>Reason:</strong> {entry.reason}</span>
                  <span className="inline-flex items-center space-x-1 text-slate-600">
                    <UserCheck className="w-3 h-3 text-blue-600" />
                    <span>{entry.modified_by}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>Logged actions: <strong>{entries.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
