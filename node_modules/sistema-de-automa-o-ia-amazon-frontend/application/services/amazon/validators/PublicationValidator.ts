import { IAmazonApiProvider } from '../types';
import { PublicationLogger } from '../loggers/PublicationLogger';

export class PublicationValidator {
    constructor(
        private apiProvider: IAmazonApiProvider,
        private logger: PublicationLogger
    ) {}

    /**
     * Checks with Amazon if the listing is active and available.
     * This is the mandatory step before allowing Bling integration.
     */
    async confirmPublication(sku: string): Promise<boolean> {
        try {
            this.logger.logInfo(sku, 'Validating publication status on Amazon...');
            
            // Amazon processing can take time. In a real scenario, this might involve polling.
            // For this architecture, we simulate a single check.
            const status = await this.apiProvider.checkListingStatus(sku);

            if (status.exists && status.status === 'ACTIVE') {
                this.logger.logSuccess(sku, `Publication confirmed. ASIN: ${status.asin}`);
                return true;
            } else {
                this.logger.logError(sku, `Publication not active yet. Current status: ${status.status}`);
                return false;
            }
        } catch (error: any) {
            this.logger.logError(sku, 'Failed to validate publication status.', error);
            return false;
        }
    }
}
