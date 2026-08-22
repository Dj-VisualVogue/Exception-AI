import type { TransactionException, ExceptionStatus } from '../types';
import { StorageService } from './storageService';
import { ResolutionPolicyService } from './policyService';
import { AuditService } from './auditService';

export interface ResolutionResponse {
  success: boolean;
  exception: TransactionException;
  message: string;
}

export class ResolutionService {
  /**
   * Enforces backend/service-level verification for auto-resolving an exception.
   * Throws an error if any policy or eligibility condition fails.
   */
  public static autoResolveException(
    id: string,
    actor: string = 'Human Reviewer',
    customReason?: string
  ): ResolutionResponse {
    const exception = StorageService.getExceptionById(id);

    if (!exception) {
      throw new Error(`Transaction exception ${id} not found.`);
    }

    if (exception.status === 'RESOLVED') {
      throw new Error(`Transaction ${exception.transactionReference} is already resolved.`);
    }

    // Evaluate authoritative policy service
    const policyEval = ResolutionPolicyService.evaluatePolicy(exception);

    if (!policyEval.eligible) {
      // Record rejected attempt in audit log
      AuditService.logEvent({
        transactionId: exception.id,
        transactionRef: exception.transactionReference,
        action: 'AUTO_RESOLVE_ATTEMPTED',
        actor,
        reason: `Auto-resolution rejected by policy engine: ${policyEval.reason}`,
        previousStatus: exception.status,
      });

      throw new Error(`Auto-resolution rejected: ${policyEval.reason}`);
    }

    const previousStatus: ExceptionStatus = exception.status;
    const resolutionReason =
      customReason ||
      `Auto-resolved by ${actor} under policy threshold rule (Confidence: ${exception.confidence}% >= ${policyEval.thresholdRequired}%).`;

    const updatedException: TransactionException = {
      ...exception,
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolvedBy: actor,
      resolutionReason,
    };

    StorageService.saveException(updatedException);

    AuditService.logEvent({
      transactionId: updatedException.id,
      transactionRef: updatedException.transactionReference,
      action: 'AUTO_RESOLVED',
      actor,
      reason: resolutionReason,
      previousStatus,
      newStatus: 'RESOLVED',
      metadata: {
        confidence: updatedException.confidence,
        threshold: policyEval.thresholdRequired,
      },
    });

    return {
      success: true,
      exception: updatedException,
      message: `Transaction ${updatedException.transactionReference} successfully auto-resolved.`,
    };
  }

  /**
   * Executes manual resolution by a human reviewer with mandatory reasoning.
   */
  public static manuallyResolveException(
    id: string,
    actor: string,
    reason: string
  ): ResolutionResponse {
    const exception = StorageService.getExceptionById(id);

    if (!exception) {
      throw new Error(`Transaction exception ${id} not found.`);
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed resolution reason (min 5 characters) is required for manual resolution.');
    }

    const previousStatus = exception.status;
    const updatedException: TransactionException = {
      ...exception,
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolvedBy: actor,
      resolutionReason: reason,
    };

    StorageService.saveException(updatedException);

    AuditService.logEvent({
      transactionId: updatedException.id,
      transactionRef: updatedException.transactionReference,
      action: 'MANUALLY_RESOLVED',
      actor,
      reason,
      previousStatus,
      newStatus: 'RESOLVED',
      metadata: {
        confidence: updatedException.confidence,
      },
    });

    return {
      success: true,
      exception: updatedException,
      message: `Transaction ${updatedException.transactionReference} manually resolved by ${actor}.`,
    };
  }

  /**
   * Escalates an exception to senior management or compliance team.
   */
  public static escalateException(
    id: string,
    actor: string,
    reason: string
  ): ResolutionResponse {
    const exception = StorageService.getExceptionById(id);

    if (!exception) {
      throw new Error(`Transaction exception ${id} not found.`);
    }

    const previousStatus = exception.status;
    const updatedException: TransactionException = {
      ...exception,
      status: 'ESCALATED',
      resolutionReason: `Escalated by ${actor}: ${reason}`,
    };

    StorageService.saveException(updatedException);

    AuditService.logEvent({
      transactionId: updatedException.id,
      transactionRef: updatedException.transactionReference,
      action: 'ESCALATED',
      actor,
      reason,
      previousStatus,
      newStatus: 'ESCALATED',
    });

    return {
      success: true,
      exception: updatedException,
      message: `Transaction ${updatedException.transactionReference} escalated to Compliance/Finance Team.`,
    };
  }

  /**
   * Marks an exception as under active review when selected by human reviewer.
   */
  public static markUnderReview(id: string, _actor: string = 'Human Reviewer'): TransactionException | null {
    const exception = StorageService.getExceptionById(id);
    if (!exception || exception.status !== 'OPEN') return exception || null;

    const updatedException: TransactionException = {
      ...exception,
      status: 'UNDER_REVIEW',
    };

    StorageService.saveException(updatedException);
    return updatedException;
  }
}
