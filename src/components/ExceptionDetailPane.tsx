import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Bot, 
  HelpCircle, 
  FileText, 
  Zap, 
  AlertOctagon, 
  UserCheck, 
  Loader2
} from 'lucide-react';
import type { TransactionException, ResolutionPolicy, AIExplanationResult } from '../types';
import { ResolutionPolicyService } from '../services/policyService';
import { AIExplanationService } from '../services/aiExplanationService';
import { AuditService } from '../services/auditService';

interface ExceptionDetailPaneProps {
  exception: TransactionException | null;
  policy: ResolutionPolicy;
  onAutoResolve: (id: string) => void;
  onOpenManualResolveModal: (exception: TransactionException) => void;
  onEscalate: (id: string, reason: string) => void;
}

export const ExceptionDetailPane: React.FC<ExceptionDetailPaneProps> = ({
  exception,
  policy,
  onAutoResolve,
  onOpenManualResolveModal,
  onEscalate,
}) => {
  const [aiState, setAiState] = useState<AIExplanationResult | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'ai_assistant'>('evidence');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([]);

  useEffect(() => {
    // Reset AI state when selected transaction changes
    if (exception) {
      setAiState(null);
      // Auto-load grounded explanation
      const grounded = AIExplanationService.generateDeterministicExplanation(exception);
      setAiState(grounded);
      setChatMessages([
        {
          sender: 'ai',
          text: `Hello! I am your AI Employee assistant for exception ${exception.transactionReference}. I have calculated the mathematical variance and evidence. How can I assist your review?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [exception?.id]);

  if (!exception) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 h-full flex flex-col items-center justify-center">
        <FileText className="w-12 h-12 text-gray-700 mb-3" />
        <h3 className="text-base font-semibold text-gray-300">No Exception Selected</h3>
        <p className="text-xs text-gray-500 max-w-xs mt-1">
          Select an exception item from the queue to view grounded transaction evidence, policy evaluation, and AI resolution options.
        </p>
      </div>
    );
  }

  const policyEval = ResolutionPolicyService.evaluatePolicy(exception);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleRequestAiExplanation = async () => {
    setLoadingAi(true);
    AuditService.logEvent({
      transactionId: exception.id,
      transactionRef: exception.transactionReference,
      action: 'EXPLANATION_REQUESTED',
      actor: 'Reviewer (Human)',
      reason: 'Human reviewer requested detailed AI explanation & evidence breakdown.',
    });

    const result = await AIExplanationService.explainAndSuggest(exception);
    setAiState(result);
    setLoadingAi(false);
    setActiveTab('ai_assistant');

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: 'Explain why this transaction was flagged and summarize evidence.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        sender: 'ai',
        text: result.explanation,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleRequestSuggestedResolution = async () => {
    setLoadingAi(true);
    AuditService.logEvent({
      transactionId: exception.id,
      transactionRef: exception.transactionReference,
      action: 'RESOLUTION_SUGGESTED',
      actor: 'Reviewer (Human)',
      reason: 'Human reviewer requested AI suggested resolution plan.',
    });

    const result = await AIExplanationService.explainAndSuggest(exception);
    setAiState(result);
    setLoadingAi(false);
    setActiveTab('ai_assistant');

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: 'What is the recommended resolution for this item?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        sender: 'ai',
        text: `RECOMMENDED ACTION: ${result.suggestedAction}\n\n${result.suggestedResolutionText}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header Banner */}
      <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-indigo-400 font-bold">{exception.id}</span>
            <span className="text-xs text-gray-500">•</span>
            <h2 className="text-base font-bold text-white">{exception.transactionReference}</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{exception.vendor} — <span className="text-gray-300">{exception.category}</span></p>
        </div>

        {/* Confidence & Policy Badge */}
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-400">Confidence Score</div>
          <div className="flex items-center space-x-1.5 justify-end">
            <span className={`text-base font-bold font-mono ${
              exception.confidence >= policy.autoResolveConfidenceThreshold
                ? 'text-emerald-400'
                : exception.confidence >= policy.suggestedResolutionConfidenceThreshold
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}>
              {exception.confidence}%
            </span>
            <span className="text-[10px] text-gray-500 font-mono">(Req: ≥{policy.autoResolveConfidenceThreshold}%)</span>
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1">
        {/* Status Alert Banner if already resolved */}
        {exception.status === 'RESOLVED' && (
          <div className="bg-emerald-950/60 border border-emerald-800 rounded-lg p-3 flex items-start space-x-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-200">Transaction Resolved</div>
              <p className="mt-0.5">{exception.resolutionReason}</p>
              <div className="text-[10px] text-emerald-400/70 mt-1">
                Resolved by: <span className="font-semibold">{exception.resolvedBy}</span> at{' '}
                {exception.resolvedAt ? new Date(exception.resolvedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Overview Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-gray-950/60 border border-gray-800/80 rounded-xl p-3">
          <div>
            <span className="text-gray-400">Transaction Amount</span>
            <div className="text-sm font-bold text-white mt-0.5">{formatCurrency(exception.transactionAmount)}</div>
          </div>
          <div>
            <span className="text-gray-400">Expected PO Baseline</span>
            <div className="text-sm font-bold text-gray-300 mt-0.5">{formatCurrency(exception.expectedAmount)}</div>
          </div>
          <div>
            <span className="text-gray-400">Variance Amount</span>
            <div className={`text-sm font-bold mt-0.5 ${exception.varianceAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {exception.varianceAmount > 0 ? '+' : ''}{formatCurrency(exception.varianceAmount)}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Variance Percentage</span>
            <div className={`text-sm font-bold mt-0.5 ${exception.variancePercentage > 20 ? 'text-rose-400' : 'text-amber-400'}`}>
              {exception.variancePercentage.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Tab Navigation: Evidence vs AI Employee Assistant */}
        <div className="border-b border-gray-800 flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`pb-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'evidence'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Grounded Evidence
            </button>
            <button
              onClick={() => setActiveTab('ai_assistant')}
              className={`pb-2 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ai_assistant'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Assistant Chat
            </button>
          </div>

          <span className="text-[10px] text-gray-500 font-mono">Rule: {exception.evidence.ruleTriggered.split(':')[0]}</span>
        </div>

        {/* Tab Content: Grounded Evidence */}
        {activeTab === 'evidence' && (
          <div className="space-y-3 text-xs">
            {/* Rule Triggered Card */}
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-gray-400 font-semibold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Flag Reason & Triggered Rule
              </div>
              <p className="text-gray-200">{exception.description}</p>
              <div className="mt-2 text-[11px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-900/50">
                {exception.evidence.ruleTriggered}
              </div>
            </div>

            {/* Evidence Parameters List */}
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 space-y-2">
              <div className="font-semibold text-gray-300">Audited Evidence Factors</div>
              <ul className="space-y-1 text-gray-400">
                <li className="flex items-center justify-between border-b border-gray-900 pb-1">
                  <span>Vendor Master Trust Score</span>
                  <span className="font-bold text-gray-200">{exception.evidence.historicalVendorTrustScore} / 100</span>
                </li>
                <li className="flex items-center justify-between border-b border-gray-900 pb-1">
                  <span>Integration Source System</span>
                  <span className="font-mono text-gray-300">{exception.source}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Risk Severity Score</span>
                  <span className="font-bold text-gray-200">{exception.severity}</span>
                </li>
              </ul>
            </div>

            {/* Policy Evaluation Card */}
            <div className={`p-3 rounded-lg border text-xs ${
              policyEval.eligible
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800 text-amber-300'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {policyEval.eligible ? <Zap className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                Policy Enforcement Status
              </div>
              <p>{policyEval.reason}</p>
            </div>
          </div>
        )}

        {/* Tab Content: AI Assistant Chat */}
        {activeTab === 'ai_assistant' && (
          <div className="space-y-3">
            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRequestAiExplanation}
                disabled={loadingAi}
                className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                Explain Flag Details
              </button>

              <button
                onClick={handleRequestSuggestedResolution}
                disabled={loadingAi}
                className="bg-violet-950/80 hover:bg-violet-900 text-violet-300 border border-violet-800 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                Suggest Resolution Plan
              </button>
            </div>

            {/* Chat Log Stream */}
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 space-y-3 min-h-[160px] max-h-[260px] overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1">
                    {msg.sender === 'ai' ? <Bot className="w-3 h-3 text-indigo-400" /> : <UserCheck className="w-3 h-3 text-emerald-400" />}
                    <span>{msg.sender === 'ai' ? 'AI Employee' : 'Reviewer'}</span> • <span>{msg.time}</span>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg text-xs max-w-[85%] whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-gray-900 border border-gray-800 text-gray-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Grounded Provider Footer */}
            {aiState && (
              <div className="text-[10px] text-gray-500 flex items-center justify-between px-1">
                <span>Grounded Engine: <span className="text-gray-400 font-semibold">{aiState.provider}</span></span>
                <span>Confidence: <span className="text-indigo-400 font-mono">{aiState.confidenceScore}%</span></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Desk Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-950 space-y-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Human-in-Command Action Desk</span>
          <span className="text-gray-500 font-normal">Active Policy Enforcement</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Action 1: Auto Resolve */}
          <button
            onClick={() => onAutoResolve(exception.id)}
            disabled={!policyEval.eligible || exception.status === 'RESOLVED'}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              policyEval.eligible && exception.status !== 'RESOLVED'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-gray-800/80 border border-gray-700 text-gray-500 cursor-not-allowed opacity-60'
            }`}
            title={policyEval.reason}
          >
            {policyEval.eligible ? <Zap className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200" /> : <Lock className="w-3.5 h-3.5 text-gray-500" />}
            <span>Auto Resolve</span>
          </button>

          {/* Action 2: Manual Resolve */}
          <button
            onClick={() => onOpenManualResolveModal(exception)}
            disabled={exception.status === 'RESOLVED'}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:opacity-50 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manual Resolve</span>
          </button>

          {/* Action 3: Escalate */}
          <button
            onClick={() => onEscalate(exception.id, 'High variance / compliance review requested by human reviewer.')}
            disabled={exception.status === 'RESOLVED' || exception.status === 'ESCALATED'}
            className="bg-rose-950/80 hover:bg-rose-900 disabled:bg-gray-800 disabled:opacity-50 text-rose-300 border border-rose-800/80 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Escalate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
