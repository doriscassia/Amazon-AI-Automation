import { PublicationLogger } from '../loggers/PublicationLogger';

export class ErrorHandler {
    constructor(private logger: PublicationLogger) {}

    handleValidationErrors(sku: string, errors: string[]): void {
        this.logger.logError(sku, 'Validation failed before publishing.', { errors });
    }

    handlePublishingError(sku: string, error: any): boolean {
        this.logger.logError(sku, 'Error during Amazon API publication call.', error);
        
        // Determine if error is transient (can be retried) or fatal
        const errorMessage = error?.message?.toLowerCase() || '';
        const isTransient = errorMessage.includes('timeout') || errorMessage.includes('rate limit') || errorMessage.includes('503');
        
        return isTransient;
    }

    handleValidationError(sku: string, error: any): void {
        this.logger.logError(sku, 'Error while validating if listing was created on Amazon.', error);
    }
}
