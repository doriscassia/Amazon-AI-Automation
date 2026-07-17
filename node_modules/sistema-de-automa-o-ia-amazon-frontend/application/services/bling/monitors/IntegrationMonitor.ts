import { SyncLogger } from '../loggers/SyncLogger';

export class IntegrationMonitor {
    private successCount = 0;
    private errorCount = 0;

    constructor(private logger: SyncLogger) {}

    recordSuccess(sku: string): void {
        this.successCount++;
        this.logger.logInfo(sku, `Integration metrics updated. Successes: ${this.successCount}, Errors: ${this.errorCount}`);
    }

    recordError(sku: string): void {
        this.errorCount++;
        this.logger.logInfo(sku, `Integration metrics updated. Successes: ${this.successCount}, Errors: ${this.errorCount}`);
    }

    getMetrics() {
        return {
            successCount: this.successCount,
            errorCount: this.errorCount,
            totalProcessed: this.successCount + this.errorCount
        };
    }
}
