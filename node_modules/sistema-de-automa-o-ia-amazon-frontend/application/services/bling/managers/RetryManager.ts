import { SyncLogger } from '../loggers/SyncLogger';
import { ErrorHandler } from '../handlers/ErrorHandler';

export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
}

export class RetryManager {
    constructor(
        private logger: SyncLogger,
        private errorHandler: ErrorHandler,
        private config: RetryConfig = { maxAttempts: 3, baseDelayMs: 2000 }
    ) {}

    async executeWithRetry<T>(sku: string, operation: () => Promise<T>): Promise<T | null> {
        let attempt = 1;

        while (attempt <= this.config.maxAttempts) {
            try {
                this.logger.logAttempt(sku, attempt, this.config.maxAttempts);
                return await operation();
            } catch (error: any) {
                const isTransient = this.errorHandler.handleSyncError(sku, error);
                
                if (!isTransient || attempt === this.config.maxAttempts) {
                    this.logger.logError(sku, `Operation failed permanently after ${attempt} attempts.`);
                    return null;
                }

                const delay = this.config.baseDelayMs * Math.pow(2, attempt - 1);
                this.logger.logInfo(sku, `Waiting ${delay}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                attempt++;
            }
        }

        return null;
    }
}
