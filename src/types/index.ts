export type ExceptionStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ResolutionAction = 'AUTO_RESOLVE' | 'SUGGEST_RESOLUTION' | 'HUMAN_REVIEW' | 'ESCALATE';

export type ExceptionType = 
  | 'DUPLICATE_INVOICE'
  | 'HIGH_AMOUNT_VARIANCE'
  | 'GEOGRAPHIC_ANOMALY'
  | 'ACCOUNT_VELOCITY_SPIKE'
  | 'TAX_REGION_MISMATCH'
  | 'UNAUTHORIZED_VENDOR';

export interface Evidence {
  transactionAmount: number;
  expectedAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  ruleTriggered: string;
  historicalVendorTrustScore: number; // 0 to 100
  flaggedFactors: string[];
}

export interface TransactionException {
  id: string;
  transactionReference: string;
  vendor: string;
  category: string;
  transactionAmount: number;
  expectedAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  exceptionType: ExceptionType;
  severity: Severity;
  confidence: number; // 0 - 100 scale (e.g. 94 = 94%)
  status: ExceptionStatus;
  detectedAt: string;
  description: string;
  source: string;
  recommendedAction: ResolutionAction;
  evidence: Evidence;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionReason?: string;
}

export interface ResolutionPolicy {
  autoResolveConfidenceThreshold: number; // e.g. 90%
  suggestedResolutionConfidenceThreshold: number; // e.g. 70%
  variancePercentageTolerance: number; // e.g. 5%
  allowAutoResolveCritical: boolean; // default false
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  transactionId: string;
  transactionRef: string;
  action: 
    | 'EXPLANATION_REQUESTED' 
    | 'RESOLUTION_SUGGESTED' 
    | 'AUTO_RESOLVE_ATTEMPTED' 
    | 'AUTO_RESOLVED' 
    | 'MANUALLY_RESOLVED' 
    | 'ESCALATED' 
    | 'POLICY_UPDATED' 
    | 'DATASET_RESET';
  actor: string;
  reason: string;
  previousStatus?: ExceptionStatus;
  newStatus?: ExceptionStatus;
  metadata?: Record<string, any>;
}

export interface AIExplanationResult {
  explanation: string;
  evidenceSummary: string[];
  suggestedAction: ResolutionAction;
  suggestedResolutionText: string;
  confidenceScore: number;
  isFallback: boolean;
  provider: string;
}

export interface PolicyEvaluationResult {
  eligible: boolean;
  action: ResolutionAction;
  reason: string;
  confidence: number;
  thresholdRequired: number;
}
