import type { TransactionException } from '../types';
import { getSeedExceptions } from '../data/seedExceptions';
import { AuditService } from './auditService';

const EXCEPTIONS_STORAGE_KEY = 'exception_ai_transactions_list';

export class StorageService {
  public static getExceptions(): TransactionException[] {
    try {
      const stored = localStorage.getItem(EXCEPTIONS_STORAGE_KEY);
      if (stored) {
        const parsed: TransactionException[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load exceptions from localStorage, re-seeding', e);
    }
    
    // Default seed
    const seeded = getSeedExceptions();
    this.saveExceptions(seeded);
    return seeded;
  }

  public static getExceptionById(id: string): TransactionException | undefined {
    const list = this.getExceptions();
    return list.find((item) => item.id === id);
  }

  public static saveException(updated: TransactionException): void {
    const list = this.getExceptions();
    const index = list.findIndex((item) => item.id === updated.id);
    if (index !== -1) {
      list[index] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveExceptions(list);
  }

  public static saveExceptions(list: TransactionException[]): void {
    try {
      localStorage.setItem(EXCEPTIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save exceptions to localStorage', e);
    }
  }

  public static resetToSeed(): TransactionException[] {
    const seeded = getSeedExceptions();
    this.saveExceptions(seeded);
    AuditService.logEvent({
      transactionId: 'ALL',
      transactionRef: 'SYSTEM',
      action: 'DATASET_RESET',
      actor: 'Reviewer (Human)',
      reason: 'Reset synthetic exception dataset back to default initial seed.',
    });
    return seeded;
  }
}
