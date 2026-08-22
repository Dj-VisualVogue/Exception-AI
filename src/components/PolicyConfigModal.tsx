import React, { useState } from 'react';
import { Sliders, X, Check, Info, AlertTriangle } from 'lucide-react';
import type { ResolutionPolicy } from '../types';

interface PolicyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: ResolutionPolicy;
  onSavePolicy: (updated: Partial<ResolutionPolicy>) => void;
}

export const PolicyConfigModal: React.FC<PolicyConfigModalProps> = ({
  isOpen,
  onClose,
  policy,
  onSavePolicy,
}) => {
  const [autoThreshold, setAutoThreshold] = useState<number>(policy.autoResolveConfidenceThreshold);
  const [suggestedThreshold, setSuggestedThreshold] = useState<number>(policy.suggestedResolutionConfidenceThreshold);
  const [allowCritical, setAllowCritical] = useState<boolean>(policy.allowAutoResolveCritical);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePolicy({
      autoResolveConfidenceThreshold: autoThreshold,
      suggestedResolutionConfidenceThreshold: suggestedThreshold,
      allowAutoResolveCritical: allowCritical,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configure Resolution Policy</h3>
              <p className="text-xs text-gray-400">Define authoritative confidence thresholds & governance rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* Rule 1: Auto-Resolution Confidence Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-200 text-sm">
                Auto-Resolution Confidence Threshold
              </label>
              <span className="font-mono text-base font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                ≥ {autoThreshold}%
              </span>
            </div>
            <p className="text-gray-400">
              Transactions with AI confidence equal to or above this threshold are eligible for one-click Auto-Resolution.
            </p>
            <input
              type="range"
              min={60}
              max={98}
              value={autoThreshold}
              onChange={(e) => setAutoThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>60% (Permissive)</span>
              <span>85% (Balanced)</span>
              <span>95% (Strict - Default)</span>
            </div>
          </div>

          {/* Rule 2: Suggested Resolution Confidence Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-200 text-sm">
                Suggested Resolution Threshold
              </label>
              <span className="font-mono text-base font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                ≥ {suggestedThreshold}%
              </span>
            </div>
            <p className="text-gray-400">
              Transactions below auto-resolve but equal to or above this threshold present AI-guided resolution suggestions to the human reviewer.
            </p>
            <input
              type="range"
              min={40}
              max={autoThreshold - 5}
              value={suggestedThreshold}
              onChange={(e) => setSuggestedThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Rule 3: Allow Auto-Resolve on Critical Severity */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex items-center justify-between space-x-4">
            <div className="space-y-0.5">
              <div className="font-bold text-gray-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Allow Auto-Resolve on Critical Severity
              </div>
              <p className="text-gray-400 text-[11px]">
                By default, CRITICAL severity exceptions require mandatory human sign-off regardless of confidence score.
              </p>
            </div>
            <button
              onClick={() => setAllowCritical(!allowCritical)}
              className={`w-12 h-6 rounded-full transition p-1 cursor-pointer flex items-center ${
                allowCritical ? 'bg-indigo-600 justify-end' : 'bg-gray-800 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Live System Impact Alert */}
          <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-xl p-3 flex items-start space-x-2.5 text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Real-time Policy Propagation</span>
              <p className="text-[11px] mt-0.5 text-indigo-300/80">
                Saving updates <code className="font-mono text-indigo-200">ResolutionPolicyService</code> instantly. All transactions in the queue will be dynamically re-evaluated.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Active Policy
          </button>
        </div>
      </div>
    </div>
  );
};
