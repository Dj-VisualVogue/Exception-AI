import type { ResolutionPolicy, ResolutionAction, TransactionException, Severity, PolicyEvaluationResult } from '../types';

const DEFAULT_POLICY: ResolutionPolicy = {
  autoResolveConfidenceThreshold: 90,
  suggestedResolutionConfidenceThreshold: 70,
  variancePercentageTolerance: 5.0,
  allowAutoResolveCritical: false,
};

const POLICY_STORAGE_KEY = 'exception_ai_policy_config';

export class ResolutionPolicyService {
  private static activePolicy: ResolutionPolicy = this.loadPolicy();

  private static loadPolicy(): ResolutionPolicy {
    try {
      const saved = localStorage.getItem(POLICY_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_POLICY, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load saved resolution policy, using defaults', e);
    }
    return { ...DEFAULT_POLICY };
  }

  public static getPolicy(): ResolutionPolicy {
    return { ...this.activePolicy };
  }

  public static updatePolicy(newPolicy: Partial<ResolutionPolicy>): ResolutionPolicy {
    this.activePolicy = {
      ...this.activePolicy,
      ...newPolicy,
    };
    try {
      localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(this.activePolicy));
    } catch (e) {
      console.error('Failed to save policy to localStorage', e);
    }
    return this.getPolicy();
  }

  public static resetPolicy(): ResolutionPolicy {
    this.activePolicy = { ...DEFAULT_POLICY };
    localStorage.removeItem(POLICY_STORAGE_KEY);
    return this.getPolicy();
  }

  /**
   * Central authoritative determination of resolution action based on confidence & severity.
   */
  public static getResolutionAction(confidence: number, severity?: Severity): ResolutionAction {
    const policy = this.getPolicy();

    // Critical severity exceptions force HUMAN_REVIEW unless explicitly permitted
    if (severity === 'CRITICAL' && !policy.allowAutoResolveCritical) {
      if (confidence >= policy.suggestedResolutionConfidenceThreshold) {
        return 'SUGGEST_RESOLUTION';
      }
      return 'HUMAN_REVIEW';
    }

    if (confidence >= policy.autoResolveConfidenceThreshold) {
      return 'AUTO_RESOLVE';
    } else if (confidence >= policy.suggestedResolutionConfidenceThreshold) {
      return 'SUGGEST_RESOLUTION';
    } else {
      return 'HUMAN_REVIEW';
    }
  }

  /**
   * Evaluates auto-resolution eligibility with exact policy rationale.
   */
  public static evaluatePolicy(exception: TransactionException): PolicyEvaluationResult {
    const policy = this.getPolicy();
    const action = this.getResolutionAction(exception.confidence, exception.severity);

    if (exception.status === 'RESOLVED') {
      return {
        eligible: false,
        action,
        reason: 'Transaction is already resolved.',
        confidence: exception.confidence,
        thresholdRequired: policy.autoResolveConfidenceThreshold,
      };
    }

    if (exception.severity === 'CRITICAL' && !policy.allowAutoResolveCritical) {
      return {
        eligible: false,
        action: 'HUMAN_REVIEW',
        reason: `CRITICAL severity exception requires mandatory human sign-off per security policy.`,
        confidence: exception.confidence,
        thresholdRequired: policy.autoResolveConfidenceThreshold,
      };
    }

    if (exception.confidence < policy.autoResolveConfidenceThreshold) {
      return {
        eligible: false,
        action,
        reason: `Confidence score (${exception.confidence}%) is below the configured auto-resolution threshold (${policy.autoResolveConfidenceThreshold}%). Requires human review.`,
        confidence: exception.confidence,
        thresholdRequired: policy.autoResolveConfidenceThreshold,
      };
    }

    return {
      eligible: true,
      action: 'AUTO_RESOLVE',
      reason: `Confidence score (${exception.confidence}%) satisfies auto-resolution threshold (${policy.autoResolveConfidenceThreshold}%). Eligible for reviewer sign-off.`,
      confidence: exception.confidence,
      thresholdRequired: policy.autoResolveConfidenceThreshold,
    };
  }

  public static isEligibleForAutoResolve(exception: TransactionException): boolean {
    return this.evaluatePolicy(exception).eligible;
  }
}
