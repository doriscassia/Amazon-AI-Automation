import { SyncLogger } from '../loggers/SyncLogger';

export class ErrorHandler {
    constructor(private logger: SyncLogger) {}

    handleValidationError(sku: string, message: string): void {
        this.logger.logError(sku, `Validation failed: ${message}`);
    }

    handleSyncError(sku: string, error: any): boolean {
        this.logger.logError(sku, 'Error during Bling API synchronization.', error);
        
        // Determine if error is transient (can be retried) or fatal
        const errorMessage = error?.message?.toLowerCase() || '';
        const isTransient = errorMessage.includes('timeout') || errorMessage.includes('rate limit') || errorMessage.includes('503');
        
        return isTransient;
    }
}
