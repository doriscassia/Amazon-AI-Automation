import { BlingSyncState } from '../types';
import { SyncLogger } from '../loggers/SyncLogger';

export class StatusTracker {
    // In a real scenario, this would interact with a database repository
    private statusStore: Map<string, BlingSyncState> = new Map();

    constructor(private logger: SyncLogger) {}

    updateStatus(sku: string, status: BlingSyncState): void {
        this.statusStore.set(sku, status);
        this.logger.logInfo(sku, `Status updated to: ${status}`);
    }

    getStatus(sku: string): BlingSyncState {
        return this.statusStore.get(sku) || 'AWAITING';
    }
}
