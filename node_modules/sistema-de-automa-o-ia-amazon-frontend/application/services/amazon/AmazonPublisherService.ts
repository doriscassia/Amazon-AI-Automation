import { ProcessedProductContext, IAmazonApiProvider } from './types';
import { ListingBuilder } from './builders/ListingBuilder';
import { ValidationEngine } from './validators/ValidationEngine';
import { PublicationValidator } from './validators/PublicationValidator';
import { ListingStatusMonitor } from './monitors/ListingStatusMonitor';
import { RetryManager } from './managers/RetryManager';
import { ErrorHandler } from './handlers/ErrorHandler';
import { PublicationLogger } from './loggers/PublicationLogger';
import { CategoryMapper } from './mappers/CategoryMapper';
import { AttributeMapper } from './mappers/AttributeMapper';

export class AmazonPublisherService {
    private logger: PublicationLogger;
    private errorHandler: ErrorHandler;
    private monitor: ListingStatusMonitor;
    private retryManager: RetryManager;
    private builder: ListingBuilder;
    private validationEngine: ValidationEngine;
    private publicationValidator: PublicationValidator;

    constructor(private apiProvider: IAmazonApiProvider) {
        this.logger = new PublicationLogger();
        this.errorHandler = new ErrorHandler(this.logger);
        this.monitor = new ListingStatusMonitor(this.logger);
        this.retryManager = new RetryManager(this.logger, this.errorHandler);
        
        const categoryMapper = new CategoryMapper();
        const attributeMapper = new AttributeMapper();
        this.builder = new ListingBuilder(categoryMapper, attributeMapper);
        
        this.validationEngine = new ValidationEngine();
        this.publicationValidator = new PublicationValidator(this.apiProvider, this.logger);
    }

    /**
     * MANDATORY FLOW:
     * 1. Receive processed product.
     * 2. Prepare fields.
     * 3. Create listing.
     * 4. Confirm creation.
     * 5. Mark as ready for Bling.
     */
    async publish(context: ProcessedProductContext): Promise<boolean> {
        const sku = context.product.sku;

        try {
            // 1. Receber o produto processado
            this.monitor.updateStatus(sku, 'PREPARING');

            // 2. Preparar todos os campos exigidos pela Amazon
            const payload = this.builder.build(context);
            const validationResult = this.validationEngine.validate(payload);

            if (!validationResult.isValid) {
                this.monitor.updateStatus(sku, 'ERROR');
                this.errorHandler.handleValidationErrors(sku, validationResult.errors);
                return false;
            }

            // 3. Criar o anúncio
            this.monitor.updateStatus(sku, 'PUBLISHING');
            const publishSuccess = await this.retryManager.executeWithRetry(sku, async () => {
                return await this.apiProvider.createListing(payload);
            });

            if (!publishSuccess) {
                this.monitor.updateStatus(sku, 'ERROR');
                return false;
            }

            // 4. Confirmar que o anúncio foi criado com sucesso
            this.monitor.updateStatus(sku, 'VALIDATING');
            const isConfirmed = await this.publicationValidator.confirmPublication(sku);

            if (!isConfirmed) {
                this.monitor.updateStatus(sku, 'AWAITING_INTERVENTION');
                return false;
            }

            // 5. Somente após a confirmação informar que o produto está apto para integração com o Bling
            this.monitor.updateStatus(sku, 'PUBLISHED');
            this.logger.logSuccess(sku, 'Product successfully published and validated. READY FOR BLING INTEGRATION.');

            return true;

        } catch (error: any) {
            this.monitor.updateStatus(sku, 'ERROR');
            this.logger.logError(sku, 'Unexpected critical error during publication flow.', error);
            return false;
        }
    }
}
