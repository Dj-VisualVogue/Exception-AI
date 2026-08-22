import React from 'react';
import { Sliders, RotateCcw, History, Sparkles, Cpu } from 'lucide-react';
import type { ResolutionPolicy } from '../types';

interface HeaderProps {
  policy: ResolutionPolicy;
  onOpenPolicyModal: () => void;
  onOpenAuditDrawer: () => void;
  onResetSeedData: () => void;
  auditCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  policy,
  onOpenPolicyModal,
  onOpenAuditDrawer,
  onResetSeedData,
  auditCount,
}) => {
  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">ExceptionAI</h1>
              <span className="bg-indigo-950 text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-800/50 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> FDE Workbench
              </span>
            </div>
            <p className="text-xs text-gray-400">Real-Time Exception Resolution & Governance</p>
          </div>
        </div>

        {/* Live Policy Pill & Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Active Threshold Indicator */}
          <button
            onClick={onOpenPolicyModal}
            className="hidden md:flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700/80 transition cursor-pointer"
            title="Click to configure resolution confidence policy"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Policy: </span>
            <span className="font-semibold text-emerald-400">Auto ≥ {policy.autoResolveConfidenceThreshold}%</span>
            <span className="text-gray-500">|</span>
            <span className="text-amber-400">Suggest ≥ {policy.suggestedResolutionConfidenceThreshold}%</span>
          </button>

          {/* Audit Log Button */}
          <button
            onClick={onOpenAuditDrawer}
            className="flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-gray-700 transition cursor-pointer relative"
          >
            <History className="w-3.5 h-3.5 text-gray-400" />
            <span>Audit Trail</span>
            {auditCount > 0 && (
              <span className="ml-1 bg-indigo-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                {auditCount}
              </span>
            )}
          </button>

          {/* Reset Seed Button */}
          <button
            onClick={onResetSeedData}
            className="flex items-center space-x-1.5 bg-gray-800/60 hover:bg-rose-950/40 hover:border-rose-700 text-gray-400 hover:text-rose-300 text-xs px-3 py-1.5 rounded-lg border border-gray-700 transition cursor-pointer"
            title="Reset dataset back to seed state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Seed</span>
          </button>
        </div>
      </div>
    </header>
  );
};
