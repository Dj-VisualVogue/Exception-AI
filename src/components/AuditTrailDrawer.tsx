import React from 'react';
import { History, X, Bot, UserCheck, ShieldAlert, Sliders, RotateCcw, AlertOctagon } from 'lucide-react';
import type { AuditEvent } from '../types';

interface AuditTrailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: AuditEvent[];
}

export const AuditTrailDrawer: React.FC<AuditTrailDrawerProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  if (!isOpen) return null;

  const getActionBadge = (action: AuditEvent['action']) => {
    switch (action) {
      case 'AUTO_RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
            <Bot className="w-3 h-3 text-emerald-400" /> AUTO_RESOLVED
          </span>
        );
      case 'MANUALLY_RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-2 py-0.5 rounded font-bold">
            <UserCheck className="w-3 h-3 text-indigo-400" /> MANUALLY_RESOLVED
          </span>
        );
      case 'AUTO_RESOLVE_ATTEMPTED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-950 text-rose-300 border border-rose-800 text-[10px] px-2 py-0.5 rounded font-bold">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> POLICY_REJECTED
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-950 text-purple-300 border border-purple-800 text-[10px] px-2 py-0.5 rounded font-bold">
            <AlertOctagon className="w-3 h-3 text-purple-400" /> ESCALATED
          </span>
        );
      case 'POLICY_UPDATED':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">
            <Sliders className="w-3 h-3 text-amber-400" /> POLICY_UPDATED
          </span>
        );
      case 'DATASET_RESET':
        return (
          <span className="inline-flex items-center gap-1 bg-gray-800 text-gray-300 border border-gray-700 text-[10px] px-2 py-0.5 rounded font-bold">
            <RotateCcw className="w-3 h-3 text-gray-400" /> DATASET_RESET
          </span>
        );
      default:
        return (
          <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded font-mono">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-gray-900 border-l border-gray-800 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">System Audit Log</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Event Timeline */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
          {events.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No audit events recorded yet.</div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-gray-950 border border-gray-800 rounded-xl p-3 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  {getActionBadge(event.action)}
                  <span className="text-[10px] font-mono text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between font-semibold text-gray-200">
                  <span>Ref: {event.transactionRef}</span>
                  <span className="text-[11px] text-gray-400">Actor: <span className="text-gray-300">{event.actor}</span></span>
                </div>

                <p className="text-gray-400 bg-gray-900/80 p-2 rounded border border-gray-800/80 text-[11px]">
                  {event.reason}
                </p>

                {event.previousStatus && event.newStatus && (
                  <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                    <span>Status Transition:</span>
                    <span className="text-amber-400">{event.previousStatus}</span>
                    <span>→</span>
                    <span className="text-emerald-400">{event.newStatus}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
