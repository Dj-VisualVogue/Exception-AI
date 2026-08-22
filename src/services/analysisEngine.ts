import type { TransactionException, ExceptionType, Severity, Evidence } from '../types';
import { ResolutionPolicyService } from './policyService';

export interface RawTransactionInput {
  id: string;
  transactionReference: string;
  vendor: string;
  category: string;
  transactionAmount: number;
  expectedAmount: number;
  exceptionType: ExceptionType;
  detectedAt: string;
  description: string;
  source: string;
  vendorTrustScore: number; // 0-100
  flaggedFactors: string[];
}

export class AnalysisEngine {
  /**
   * Calculates mathematical variance and percentage.
   */
  public static calculateVariance(transactionAmount: number, expectedAmount: number) {
    const varianceAmount = Number((transactionAmount - expectedAmount).toFixed(2));
    const rawPercentage = expectedAmount > 0 
      ? Math.abs(varianceAmount / expectedAmount) * 100 
      : 100;
    const variancePercentage = Number(rawPercentage.toFixed(2));
    return { varianceAmount, variancePercentage };
  }

  /**
   * Deterministically evaluates severity based on variance %, absolute amount, and exception type.
   */
  public static calculateSeverity(
    variancePercentage: number,
    transactionAmount: number,
    exceptionType: ExceptionType
  ): Severity {
    if (exceptionType === 'GEOGRAPHIC_ANOMALY' || exceptionType === 'UNAUTHORIZED_VENDOR') {
      if (transactionAmount > 10000) return 'CRITICAL';
      return 'HIGH';
    }

    if (variancePercentage > 50 || transactionAmount > 50000) {
      return 'CRITICAL';
    } else if (variancePercentage > 25 || transactionAmount > 20000) {
      return 'HIGH';
    } else if (variancePercentage > 10 || transactionAmount > 5000) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Deterministically calculates AI confidence score (0 - 100) based on domain parameters.
   */
  public static calculateConfidence(
    variancePercentage: number,
    vendorTrustScore: number,
    flaggedFactorsCount: number,
    exceptionType: ExceptionType
  ): number {
    let score = 95;

    // Variance penalty
    if (variancePercentage > 50) {
      score -= 35;
    } else if (variancePercentage > 25) {
      score -= 20;
    } else if (variancePercentage > 10) {
      score -= 10;
    }

    // Trust score bonus/penalty
    if (vendorTrustScore >= 90) {
      score += 10;
    } else if (vendorTrustScore < 50) {
      score -= 25;
    }

    // Multiple flags penalty
    score -= (flaggedFactorsCount - 1) * 8;

    // Exception type base risks
    if (exceptionType === 'DUPLICATE_INVOICE') {
      // High algorithmic certainty if amounts match exactly
      score += 5;
    } else if (exceptionType === 'GEOGRAPHIC_ANOMALY') {
      score -= 15;
    } else if (exceptionType === 'UNAUTHORIZED_VENDOR') {
      score -= 30;
    }

    // Clamp score between 10 and 99
    return Math.min(99, Math.max(10, Math.round(score)));
  }

  /**
   * Analyzes raw transaction and returns a fully calculated TransactionException domain object.
   */
  public static analyzeTransaction(input: RawTransactionInput): TransactionException {
    const { varianceAmount, variancePercentage } = this.calculateVariance(
      input.transactionAmount,
      input.expectedAmount
    );

    const severity = this.calculateSeverity(
      variancePercentage,
      input.transactionAmount,
      input.exceptionType
    );

    const confidence = this.calculateConfidence(
      variancePercentage,
      input.vendorTrustScore,
      input.flaggedFactors.length,
      input.exceptionType
    );

    const ruleTriggered = this.getRuleTriggeredName(input.exceptionType, variancePercentage);

    const evidence: Evidence = {
      transactionAmount: input.transactionAmount,
      expectedAmount: input.expectedAmount,
      varianceAmount,
      variancePercentage,
      ruleTriggered,
      historicalVendorTrustScore: input.vendorTrustScore,
      flaggedFactors: input.flaggedFactors,
    };

    const recommendedAction = ResolutionPolicyService.getResolutionAction(confidence, severity);

    return {
      id: input.id,
      transactionReference: input.transactionReference,
      vendor: input.vendor,
      category: input.category,
      transactionAmount: input.transactionAmount,
      expectedAmount: input.expectedAmount,
      varianceAmount,
      variancePercentage,
      exceptionType: input.exceptionType,
      severity,
      confidence,
      status: 'OPEN',
      detectedAt: input.detectedAt,
      description: input.description,
      source: input.source,
      recommendedAction,
      evidence,
    };
  }

  private static getRuleTriggeredName(type: ExceptionType, variancePct: number): string {
    switch (type) {
      case 'DUPLICATE_INVOICE':
        return 'RULE-101: Duplicate Invoice Reference & Amount Matching';
      case 'HIGH_AMOUNT_VARIANCE':
        return `RULE-102: Amount Variance > ${variancePct.toFixed(1)}% Threshold`;
      case 'GEOGRAPHIC_ANOMALY':
        return 'RULE-103: Impossible Physical Velocity / Location Jump';
      case 'ACCOUNT_VELOCITY_SPIKE':
        return 'RULE-104: Rapid Transaction Frequency Burst';
      case 'TAX_REGION_MISMATCH':
        return 'RULE-105: Cross-Border Tax Region Inconsistency';
      case 'UNAUTHORIZED_VENDOR':
        return 'RULE-106: Unapproved Vendor Master Record ID';
    }
  }
}
