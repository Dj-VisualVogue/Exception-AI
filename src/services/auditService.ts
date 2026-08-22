import type { AuditEvent, ExceptionStatus } from '../types';

const AUDIT_STORAGE_KEY = 'exception_ai_audit_logs';

export class AuditService {
  private static events: AuditEvent[] = this.loadAuditLogs();

  private static loadAuditLogs(): AuditEvent[] {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse audit logs from localStorage', e);
    }
    return [];
  }

  private static saveAuditLogs() {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.events));
    } catch (e) {
      console.error('Failed to save audit logs to localStorage', e);
    }
  }

  public static logEvent(params: {
    transactionId: string;
    transactionRef: string;
    action: AuditEvent['action'];
    actor: string;
    reason: string;
    previousStatus?: ExceptionStatus;
    newStatus?: ExceptionStatus;
    metadata?: Record<string, any>;
  }): AuditEvent {
    const event: AuditEvent = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...params,
    };

    this.events.unshift(event); // newest first
    this.saveAuditLogs();
    return event;
  }

  public static getEvents(transactionId?: string): AuditEvent[] {
    if (transactionId) {
      return this.events.filter((e) => e.transactionId === transactionId);
    }
    return [...this.events];
  }

  public static clearLogs() {
    this.events = [];
    localStorage.removeItem(AUDIT_STORAGE_KEY);
  }
}
