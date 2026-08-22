import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  AlertOctagon, 
  Zap,
  ChevronRight
} from 'lucide-react';
import type { TransactionException, ExceptionStatus, Severity, ResolutionPolicy } from '../types';
import { ResolutionPolicyService } from '../services/policyService';

interface ExceptionQueueProps {
  exceptions: TransactionException[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  policy: ResolutionPolicy;
}

export const ExceptionQueue: React.FC<ExceptionQueueProps> = ({
  exceptions,
  selectedId,
  onSelect,
  policy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy] = useState<'confidence' | 'severity' | 'detectedAt' | 'amount'>('confidence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredExceptions = useMemo(() => {
    return exceptions
      .filter((item) => {
        // Search filter
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          item.transactionReference.toLowerCase().includes(query) ||
          item.vendor.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query);

        // Status filter
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

        // Severity filter
        const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter;

        // Type filter
        const matchesType = typeFilter === 'ALL' || item.exceptionType === typeFilter;

        return matchesSearch && matchesStatus && matchesSeverity && matchesType;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'confidence') {
          comp = a.confidence - b.confidence;
        } else if (sortBy === 'amount') {
          comp = a.transactionAmount - b.transactionAmount;
        } else if (sortBy === 'detectedAt') {
          comp = new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
        } else if (sortBy === 'severity') {
          const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
          comp = rank[a.severity] - rank[b.severity];
        }
        return sortOrder === 'desc' ? -comp : comp;
      });
  }, [exceptions, searchTerm, statusFilter, severityFilter, typeFilter, sortBy, sortOrder]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="bg-rose-950/80 text-rose-300 border border-rose-800 text-[11px] font-bold px-2 py-0.5 rounded">CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-orange-950/80 text-orange-300 border border-orange-800 text-[11px] font-semibold px-2 py-0.5 rounded">HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-amber-950/80 text-amber-300 border border-amber-800 text-[11px] font-medium px-2 py-0.5 rounded">MEDIUM</span>;
      case 'LOW':
        return <span className="bg-gray-800 text-gray-300 border border-gray-700 text-[11px] px-2 py-0.5 rounded">LOW</span>;
    }
  };

  const getStatusBadge = (status: ExceptionStatus, resolvedBy?: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-xs px-2 py-0.5 rounded font-medium">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            {resolvedBy?.toLowerCase().includes('auto') ? 'Auto-Resolved' : 'Resolved'}
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-950 text-purple-300 border border-purple-800 text-xs px-2 py-0.5 rounded font-medium">
            <AlertOctagon className="w-3 h-3 text-purple-400" /> Escalated
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-950 text-sky-300 border border-sky-800 text-xs px-2 py-0.5 rounded font-medium">
            <Clock className="w-3 h-3 text-sky-400" /> In Review
          </span>
        );
      case 'OPEN':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-950/60 text-amber-300 border border-amber-800 text-xs px-2 py-0.5 rounded font-medium">
            <ShieldAlert className="w-3 h-3 text-amber-400" /> Open
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header Toolbar */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight">Exception Queue</h2>
            <span className="bg-gray-800 text-gray-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-700">
              {filteredExceptions.length} items
            </span>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ref, vendor, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-md px-2.5 py-1 text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-md px-2.5 py-1 text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-md px-2.5 py-1 text-gray-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Exception Type: All</option>
            <option value="HIGH_AMOUNT_VARIANCE">High Variance</option>
            <option value="DUPLICATE_INVOICE">Duplicate Invoice</option>
            <option value="GEOGRAPHIC_ANOMALY">Geographic Anomaly</option>
            <option value="ACCOUNT_VELOCITY_SPIKE">Velocity Spike</option>
            <option value="TAX_REGION_MISMATCH">Tax Mismatch</option>
            <option value="UNAUTHORIZED_VENDOR">Unauthorized Vendor</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1 bg-gray-950 hover:bg-gray-800 border border-gray-800 px-2.5 py-1 rounded-md text-gray-400 hover:text-gray-200 transition cursor-pointer ml-auto"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>Sort: {sortBy} ({sortOrder})</span>
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="overflow-x-auto flex-1">
        {filteredExceptions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No exceptions found matching active filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950/80 text-gray-400 font-semibold border-b border-gray-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Ref / Vendor</th>
                <th className="py-3 px-3">Exception Type</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Severity</th>
                <th className="py-3 px-3 text-center">AI Confidence</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredExceptions.map((item) => {
                const isSelected = item.id === selectedId;
                const isAutoEligible = ResolutionPolicyService.isEligibleForAutoResolve(item);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`cursor-pointer transition hover:bg-gray-800/60 ${
                      isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : ''
                    } ${item.status === 'RESOLVED' ? 'opacity-75' : ''}`}
                  >
                    {/* Ref & Vendor */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-100 flex items-center gap-1.5">
                        {item.transactionReference}
                        <span className="text-[10px] font-mono text-gray-500">({item.id})</span>
                      </div>
                      <div className="text-gray-400 text-[11px] truncate max-w-[180px]">
                        {item.vendor}
                      </div>
                    </td>

                    {/* Exception Type */}
                    <td className="py-3 px-3 font-mono text-[11px] text-indigo-300">
                      {item.exceptionType.replace(/_/g, ' ')}
                    </td>

                    {/* Amount & Variance */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-semibold text-gray-100">{formatCurrency(item.transactionAmount)}</div>
                      {item.variancePercentage > 0 && (
                        <div className="text-[10px] text-amber-400">
                          {item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}% var
                        </div>
                      )}
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3 text-center">
                      {getSeverityBadge(item.severity)}
                    </td>

                    {/* AI Confidence Gauge */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-10 bg-gray-950 rounded-full h-1.5 overflow-hidden border border-gray-800">
                          <div
                            className={`h-full ${
                              item.confidence >= policy.autoResolveConfidenceThreshold
                                ? 'bg-emerald-400'
                                : item.confidence >= policy.suggestedResolutionConfidenceThreshold
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold ${
                          item.confidence >= policy.autoResolveConfidenceThreshold
                            ? 'text-emerald-400'
                            : item.confidence >= policy.suggestedResolutionConfidenceThreshold
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}>
                          {item.confidence}%
                        </span>
                        {isAutoEligible && item.status !== 'RESOLVED' && (
                          <span title="Eligible for Auto-Resolution">
                            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(item.status, item.resolvedBy)}
                    </td>

                    {/* Arrow Action indicator */}
                    <td className="py-3 px-2 text-right">
                      <ChevronRight className={`w-4 h-4 inline text-gray-500 transition ${isSelected ? 'text-indigo-400 transform translate-x-0.5' : ''}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
