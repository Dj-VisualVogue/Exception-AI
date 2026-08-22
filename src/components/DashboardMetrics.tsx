import React from 'react';
import { AlertTriangle, CheckCircle2, Bot, ShieldAlert, Gauge } from 'lucide-react';
import type { TransactionException } from '../types';

interface DashboardMetricsProps {
  exceptions: TransactionException[];
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ exceptions }) => {
  const openCount = exceptions.filter((e) => e.status === 'OPEN' || e.status === 'UNDER_REVIEW').length;
  const criticalHighCount = exceptions.filter(
    (e) => (e.status === 'OPEN' || e.status === 'UNDER_REVIEW') && (e.severity === 'HIGH' || e.severity === 'CRITICAL')
  ).length;
  const resolvedCount = exceptions.filter((e) => e.status === 'RESOLVED').length;
  const autoResolvedCount = exceptions.filter(
    (e) => e.status === 'RESOLVED' && e.resolvedBy?.toLowerCase().includes('auto')
  ).length;

  const openItems = exceptions.filter((e) => e.status === 'OPEN' || e.status === 'UNDER_REVIEW');
  const avgConfidence = openItems.length > 0
    ? Math.round(openItems.reduce((acc, curr) => acc + curr.confidence, 0) / openItems.length)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {/* Metric 1: Open Queue */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Open Exceptions</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white">{openCount}</span>
          <span className="text-xs text-amber-400 font-medium">Pending Review</span>
        </div>
      </div>

      {/* Metric 2: High/Critical */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">High / Critical</span>
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-rose-400">{criticalHighCount}</span>
          <span className="text-xs text-rose-300/80 font-medium">Requires Escalation</span>
        </div>
      </div>

      {/* Metric 3: Resolved Total */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Resolved Total</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-400">{resolvedCount}</span>
          <span className="text-xs text-emerald-500/80 font-medium">Reflected in Queue</span>
        </div>
      </div>

      {/* Metric 4: Auto-Resolved */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Auto-Resolved</span>
          <Bot className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-indigo-400">{autoResolvedCount}</span>
          <span className="text-xs text-indigo-300/80 font-medium">Threshold Passed</span>
        </div>
      </div>

      {/* Metric 5: Avg Confidence */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Avg Confidence</span>
          <Gauge className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-sky-400">{avgConfidence}%</span>
          <span className="text-xs text-sky-300/80 font-medium">Active Queue</span>
        </div>
      </div>
    </div>
  );
};
