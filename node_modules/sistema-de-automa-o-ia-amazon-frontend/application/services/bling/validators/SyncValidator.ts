import { IBlingApiProvider } from '../types';
import { SyncLogger } from '../loggers/SyncLogger';

export class SyncValidator {
    constructor(
        private apiProvider: IBlingApiProvider,
        private logger: SyncLogger
    ) {}

    /**
     * Confirms that Bling successfully pushed the product/stock to Amazon.
     */
    async confirmAmazonSync(sku: string): Promise<boolean> {
        try {
            this.logger.logInfo(sku, 'Validating Bling -> Amazon sync status...');
            
            const status = await this.apiProvider.checkSyncStatus(sku);

            if (status.isSynced) {
                this.logger.logSuccess(sku, `Bling -> Amazon sync confirmed. Status: ${status.status}`);
                return true;
            } else {
                this.logger.logError(sku, `Bling -> Amazon sync not complete. Current status: ${status.status}`);
                return false;
            }
        } catch (error: any) {
            this.logger.logError(sku, 'Failed to validate Bling -> Amazon sync status.', error);
            return false;
        }
    }
}
