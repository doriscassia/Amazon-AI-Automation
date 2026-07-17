import { PublicationState } from '../types';
import { PublicationLogger } from '../loggers/PublicationLogger';

export class ListingStatusMonitor {
    // In a real scenario, this would interact with a database repository
    private statusStore: Map<string, PublicationState> = new Map();

    constructor(private logger: PublicationLogger) {}

    updateStatus(sku: string, status: PublicationState): void {
        this.statusStore.set(sku, status);
        this.logger.logInfo(sku, `Status updated to: ${status}`);
    }

    getStatus(sku: string): PublicationState {
        return this.statusStore.get(sku) || 'AWAITING';
    }
}
