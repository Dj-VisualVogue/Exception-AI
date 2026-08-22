import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { ExceptionQueue } from './components/ExceptionQueue';
import { ExceptionDetailPane } from './components/ExceptionDetailPane';
import { PolicyConfigModal } from './components/PolicyConfigModal';
import { AuditTrailDrawer } from './components/AuditTrailDrawer';
import { ManualResolveModal } from './components/ManualResolveModal';

import type { TransactionException, ResolutionPolicy, AuditEvent } from './types';
import { StorageService } from './services/storageService';
import { ResolutionPolicyService } from './services/policyService';
import { ResolutionService } from './services/resolutionService';
import { AuditService } from './services/auditService';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [exceptions, setExceptions] = useState<TransactionException[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [policy, setPolicy] = useState<ResolutionPolicy>(ResolutionPolicyService.getPolicy());
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  // Modals & Drawers state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);
  const [manualResolveTarget, setManualResolveTarget] = useState<TransactionException | null>(null);

  // Toast Notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const refreshData = () => {
    const list = StorageService.getExceptions();
    setExceptions(list);
    setPolicy(ResolutionPolicyService.getPolicy());
    setAuditEvents(AuditService.getEvents());

    // Auto-select first item if non selected or invalid
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const selectedException = exceptions.find((e) => e.id === selectedId) || null;

  // Auto-Resolution Trigger
  const handleAutoResolve = (id: string) => {
    try {
      const result = ResolutionService.autoResolveException(id, 'Reviewer (Human)');
      refreshData();
      showToast('success', result.message);
    } catch (err: any) {
      showToast('error', err.message || 'Auto-resolution rejected by policy engine.');
    }
  };

  // Manual Resolution Trigger
  const handleConfirmManualResolve = (id: string, reason: string) => {
    try {
      const result = ResolutionService.manuallyResolveException(id, 'Reviewer (Human)', reason);
      refreshData();
      showToast('success', result.message);
    } catch (err: any) {
      showToast('error', err.message || 'Manual resolution failed.');
    }
  };

  // Escalation Trigger
  const handleEscalate = (id: string, reason: string) => {
    try {
      const result = ResolutionService.escalateException(id, 'Reviewer (Human)', reason);
      refreshData();
      showToast('success', result.message);
    } catch (err: any) {
      showToast('error', err.message || 'Escalation failed.');
    }
  };

  // Update Policy
  const handleSavePolicy = (updated: Partial<ResolutionPolicy>) => {
    const newPolicy = ResolutionPolicyService.updatePolicy(updated);
    AuditService.logEvent({
      transactionId: 'SYSTEM',
      transactionRef: 'POLICY_CONFIG',
      action: 'POLICY_UPDATED',
      actor: 'Reviewer (Human)',
      reason: `Updated auto-resolve threshold to ${newPolicy.autoResolveConfidenceThreshold}%, suggested threshold to ${newPolicy.suggestedResolutionConfidenceThreshold}%.`,
    });
    setPolicy(newPolicy);
    refreshData();
    showToast('success', `Policy updated! Auto-resolution threshold set to ${newPolicy.autoResolveConfidenceThreshold}%.`);
  };

  // Reset Seed Dataset
  const handleResetSeed = () => {
    if (window.confirm('Are you sure you want to reset all synthetic transactions to initial seed state?')) {
      const seeded = StorageService.resetToSeed();
      setExceptions(seeded);
      if (seeded.length > 0) setSelectedId(seeded[0].id);
      refreshData();
      showToast('success', 'Synthetic exception dataset reset to default initial seed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
                : 'bg-rose-950 border-rose-800 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <Header
        policy={policy}
        onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
        onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
        onResetSeedData={handleResetSeed}
        auditCount={auditEvents.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* Dynamic Executive KPI Dashboard */}
        <DashboardMetrics exceptions={exceptions} />

        {/* Workbench Layout (Queue on Left, Deep Dive on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* Queue Column (7 cols) */}
          <div className="lg:col-span-7 h-[680px]">
            <ExceptionQueue
              exceptions={exceptions}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                ResolutionService.markUnderReview(id, 'Reviewer (Human)');
                setExceptions(StorageService.getExceptions());
              }}
              policy={policy}
            />
          </div>

          {/* Detail Pane Column (5 cols) */}
          <div className="lg:col-span-5 h-[680px]">
            <ExceptionDetailPane
              exception={selectedException}
              policy={policy}
              onAutoResolve={handleAutoResolve}
              onOpenManualResolveModal={(target) => setManualResolveTarget(target)}
              onEscalate={handleEscalate}
            />
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <PolicyConfigModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        policy={policy}
        onSavePolicy={handleSavePolicy}
      />

      <ManualResolveModal
        isOpen={!!manualResolveTarget}
        onClose={() => setManualResolveTarget(null)}
        exception={manualResolveTarget}
        onConfirm={handleConfirmManualResolve}
      />

      <AuditTrailDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        events={auditEvents}
      />
    </div>
  );
};

export default App;
