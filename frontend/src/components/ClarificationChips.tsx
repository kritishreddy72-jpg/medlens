import React from 'react';
import { HelpCircle, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { ClarificationPrompt } from '../types/clinical';

interface ClarificationChipsProps {
  prompts: ClarificationPrompt[];
  onResolvePrompt: (promptId: string, selection: string) => void;
}

export const ClarificationChips: React.FC<ClarificationChipsProps> = ({
  prompts,
  onResolvePrompt
}) => {
  const unresolved = prompts.filter(p => !p.resolved);
  if (unresolved.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-center space-x-2 text-blue-900">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
        <h3 className="text-xs font-bold uppercase tracking-wider">
          Context-Aware Proactive Clarification
        </h3>
        <span className="text-[10px] font-semibold bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded-full">
          Ambiguity Detected
        </span>
      </div>

      <div className="space-y-3">
        {unresolved.map((p) => (
          <div
            key={p.id}
            className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-2 text-xs"
          >
            <p className="text-slate-800 font-medium leading-relaxed">
              {p.question}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {p.suggested_options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => onResolvePrompt(p.id, opt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 transition-all cursor-pointer text-left"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
