import { BlingIntegrationContext, IBlingApiProvider } from './types';
import { SyncLogger } from './loggers/SyncLogger';
import { ErrorHandler } from './handlers/ErrorHandler';
import { RetryManager } from './managers/RetryManager';
import { StatusTracker } from './trackers/StatusTracker';
import { IntegrationMonitor } from './monitors/IntegrationMonitor';
import { SKUValidator } from './validators/SKUValidator';
import { SyncValidator } from './validators/SyncValidator';
import { ProductSyncEngine } from './engines/ProductSyncEngine';

export class BlingIntegrationService {
    private logger: SyncLogger;
    private errorHandler: ErrorHandler;
    private retryManager: RetryManager;
    private tracker: StatusTracker;
    private monitor: IntegrationMonitor;
    private skuValidator: SKUValidator;
    private syncValidator: SyncValidator;
    private engine: ProductSyncEngine;

    constructor(private apiProvider: IBlingApiProvider) {
        this.logger = new SyncLogger();
        this.errorHandler = new ErrorHandler(this.logger);
        this.retryManager = new RetryManager(this.logger, this.errorHandler);
        this.tracker = new StatusTracker(this.logger);
        this.monitor = new IntegrationMonitor(this.logger);
        this.skuValidator = new SKUValidator();
        this.syncValidator = new SyncValidator(this.apiProvider, this.logger);
        this.engine = new ProductSyncEngine(this.apiProvider);
    }

    /**
     * MANDATORY FLOW:
     * 1. Validate Amazon publication (Must be true).
     * 2. Validate SKU (Must match Wedrop).
     * 3. Integrate product into Bling.
     * 4. Trigger Bling -> Amazon sync.
     * 5. Final validation.
     */
    async integrate(context: BlingIntegrationContext): Promise<boolean> {
        const sku = context.sku;

        try {
            this.tracker.updateStatus(sku, 'AWAITING');

            // 1. CRITICAL RULE: Never integrate before Amazon publication is confirmed
            if (!context.isAmazonPublished) {
                this.errorHandler.handleValidationError(sku, 'Cannot integrate to Bling. Amazon publication is not confirmed.');
                this.tracker.updateStatus(sku, 'ERROR');
                this.monitor.recordError(sku);
                return false;
            }

            // 2. CRITICAL RULE: SKU must match Wedrop exactly
            const skuValidation = this.skuValidator.validate(context);
            if (!skuValidation.isValid) {
                this.errorHandler.handleValidationError(sku, skuValidation.error || 'Invalid SKU');
                this.tracker.updateStatus(sku, 'ERROR');
                this.monitor.recordError(sku);
                return false;
            }

            // 3. Integrate product into Bling
            this.tracker.updateStatus(sku, 'SYNCING');
            const createSuccess = await this.retryManager.executeWithRetry(sku, async () => {
                return await this.engine.createProductInBling(context);
            });

            if (!createSuccess) {
                this.tracker.updateStatus(sku, 'ERROR');
                this.monitor.recordError(sku);
                return false;
            }

            this.tracker.updateStatus(sku, 'SYNCED');

            // 4. Trigger Bling -> Amazon sync
            const triggerSuccess = await this.retryManager.executeWithRetry(sku, async () => {
                return await this.engine.triggerAmazonSync(sku);
            });

            if (!triggerSuccess) {
                this.tracker.updateStatus(sku, 'ERROR');
                this.monitor.recordError(sku);
                return false;
            }

            // 5. Final validation
            this.tracker.updateStatus(sku, 'VALIDATING');
            const isConfirmed = await this.syncValidator.confirmAmazonSync(sku);

            if (!isConfirmed) {
                this.tracker.updateStatus(sku, 'AWAITING_INTERVENTION');
                this.monitor.recordError(sku);
                return false;
            }

            this.tracker.updateStatus(sku, 'COMPLETED');
            this.logger.logSuccess(sku, 'Product successfully integrated with Bling and synced to Amazon.');
            this.monitor.recordSuccess(sku);

            return true;

        } catch (error: any) {
            this.tracker.updateStatus(sku, 'ERROR');
            this.logger.logError(sku, 'Unexpected critical error during Bling integration flow.', error);
            this.monitor.recordError(sku);
            return false;
        }
    }
}
