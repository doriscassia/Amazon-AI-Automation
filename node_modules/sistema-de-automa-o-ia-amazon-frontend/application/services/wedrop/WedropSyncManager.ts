import { 
    IProductRepository, 
    IQueueRepository, 
    IIntegrationRepository, 
    ILogRepository, 
    IListingRepository 
} from '../../../domain/repositories';
import { IWedropProvider, WedropProduct } from '../../../infrastructure/services/wedrop/types';

export class WedropSyncManager {
    private readonly PRICE_LIMIT = 200.00;
    private readonly BATCH_SIZE = 10;

    constructor(
        private productRepo: IProductRepository,
        private listingRepo: IListingRepository,
        private queueRepo: IQueueRepository,
        private integrationRepo: IIntegrationRepository,
        private logRepo: ILogRepository,
        private wedropProvider: IWedropProvider // Decoupled dependency
    ) {}

    async executeSync(): Promise<void> {
        try {
            const integration = await this.integrationRepo.findByName('WEDROP');
            
            if (!integration || integration.status !== 'ACTIVE') {
                await this.logRepo.create({ 
                    level: 'WARN', 
                    message: 'Wedrop integration is not active or not found. Sync aborted.', 
                    source: 'WedropSyncManager', 
                    context: null 
                });
                return;
            }

            const credentials = integration.credentials || {};
            let currentPage = credentials.lastPage || 1;
            let hasMore = true;

            await this.logRepo.create({ 
                level: 'INFO', 
                message: `Starting Wedrop sync from page ${currentPage}`, 
                source: 'WedropSyncManager', 
                context: null 
            });

            while (hasMore) {
                try {
                    // The wedropProvider handles session validation and auto-login internally
                    const response = await this.wedropProvider.getProducts(currentPage, 50);
                    const products = response.data;

                    if (!products || products.length === 0) {
                        hasMore = false;
                        await this.logRepo.create({ 
                            level: 'INFO', 
                            message: 'Wedrop sync completed. No more products found.', 
                            source: 'WedropSyncManager', 
                            context: { finalPage: currentPage } 
                        });
                        break;
                    }

                    // Filter products up to R$ 200,00
                    const filteredProducts = products.filter(p => p.price <= this.PRICE_LIMIT);

                    const unpublishedProducts: WedropProduct[] = [];

                    // Identify published vs unpublished products
                    for (const wp of filteredProducts) {
                        const existingProduct = await this.productRepo.findBySku(wp.sku);
                        
                        if (existingProduct) {
                            const listings = await this.listingRepo.findByProductId(existingProduct.id);
                            const isPublished = listings.some(l => l.status === 'ACTIVE');
                            
                            if (!isPublished) {
                                unpublishedProducts.push(wp);
                            }
                        } else {
                            // Product not even in our DB yet
                            unpublishedProducts.push(wp);
                        }
                    }

                    // Create automatic queue in batches of 10
                    for (let i = 0; i < unpublishedProducts.length; i += this.BATCH_SIZE) {
                        const batch = unpublishedProducts.slice(i, i + this.BATCH_SIZE);
                        
                        await this.queueRepo.create({
                            type: 'SYNC_WEDROP',
                            status: 'PENDING',
                            payload: { 
                                source: 'WEDROP', 
                                batchIndex: Math.floor(i / this.BATCH_SIZE) + 1,
                                items: batch 
                            },
                            attempts: 0,
                            maxAttempts: 3,
                            lastAttemptAt: null,
                            errorMessage: null
                        });
                    }

                    // Update cursor/state for monitoring and resuming
                    currentPage++;
                    await this.integrationRepo.update(integration.id, {
                        credentials: { ...credentials, lastPage: currentPage },
                        lastSyncAt: new Date()
                    });

                } catch (error: any) {
                    // Pause on error, do not increment page, break loop to resume later exactly where it stopped
                    await this.logRepo.create({
                        level: 'ERROR',
                        message: `Error syncing Wedrop page ${currentPage}. Pausing sync.`,
                        source: 'WedropSyncManager',
                        context: { error: error.message, stack: error.stack }
                    });
                    break; 
                }
            }
        } catch (error: any) {
            await this.logRepo.create({
                level: 'ERROR',
                message: `Critical error initializing Wedrop sync: ${error.message}`,
                source: 'WedropSyncManager',
                context: { error: error.message, stack: error.stack }
            });
        }
    }
}
