import React, { useState } from 'react';
import { UserCheck, X, Check } from 'lucide-react';
import type { TransactionException } from '../types';

interface ManualResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  exception: TransactionException | null;
  onConfirm: (id: string, reason: string) => void;
}

export const ManualResolveModal: React.FC<ManualResolveModalProps> = ({
  isOpen,
  onClose,
  exception,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !exception) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setError('Please provide a descriptive resolution rationale (minimum 5 characters).');
      return;
    }
    setError('');
    onConfirm(exception.id, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Manual Resolution Sign-Off</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 space-y-1">
            <div className="text-gray-400 font-semibold">Transaction Reference</div>
            <div className="text-sm font-bold text-white">{exception.transactionReference} — {exception.vendor}</div>
            <div className="text-[11px] text-indigo-400 font-mono">Amount: ₹{exception.transactionAmount.toLocaleString('en-IN')} (Variance: {exception.variancePercentage}%)</div>
          </div>

          <div>
            <label className="block font-bold text-gray-300 mb-1">
              Resolution Reason / Reviewer Note <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verified vendor credit note #8891 with Procurement. Approved ₹100 variance."
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {error && <p className="text-rose-400 font-semibold mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Check className="w-4 h-4" /> Confirm Resolution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
