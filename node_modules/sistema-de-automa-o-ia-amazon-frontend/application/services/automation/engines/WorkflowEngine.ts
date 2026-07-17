import { StateMachine } from '../core/StateMachine';
import { ProgressTracker } from '../monitoring/ProgressTracker';
import { RetryEngine } from '../core/RetryEngine';
import { GlobalState } from '../types';
import { WedropProduct } from '../../../../infrastructure/services/wedrop/types';
import { Product } from '../../../../domain/entities';

// Import all sub-module orchestrators
import { AIListingEngine } from '../../ai/AIListingEngine';
import { PricingEngine } from '../../pricing/PricingEngine';
import { ImageIntelligenceEngine } from '../../images/ImageIntelligenceEngine';
import { AmazonPublisherService } from '../../amazon/AmazonPublisherService';
import { BlingIntegrationService } from '../../bling/BlingIntegrationService';

export class WorkflowEngine {
    constructor(
        private stateMachine: StateMachine,
        private progressTracker: ProgressTracker,
        private retryEngine: RetryEngine,
        private aiEngine: AIListingEngine,
        private pricingEngine: PricingEngine,
        private imageEngine: ImageIntelligenceEngine,
        private amazonPublisher: AmazonPublisherService,
        private blingIntegration: BlingIntegrationService
    ) {}

    async processProduct(queueId: string, wedropProduct: WedropProduct, resumeFromStep: GlobalState = 'GENERATING_AI'): Promise<void> {
        let currentStep = resumeFromStep;
        
        // Shared context built up during the workflow
        const productEntity: Product = {
            id: `temp-${wedropProduct.sku}`,
            sku: wedropProduct.sku,
            title: wedropProduct.title,
            description: wedropProduct.description,
            cost: wedropProduct.price,
            stock: wedropProduct.stock,
            active: true,
            brand: wedropProduct.brand,
            category: wedropProduct.category,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        let aiListing: any = null;
        let pricingResult: any = null;
        let images: any[] = [];

        // Step 7: AI Listing
        if (this.shouldExecute('GENERATING_AI', currentStep)) {
            this.stateMachine.transitionTo('GENERATING_AI');
            await this.progressTracker.saveCheckpoint(queueId, 'GENERATING_AI', { wedropProduct });
            
            aiListing = await this.retryEngine.execute('AI Listing Generation', () => 
                this.aiEngine.processProduct(wedropProduct)
            );
            currentStep = 'CALCULATING_PRICE';
        }

        // Step 8: Pricing Intelligence
        if (this.shouldExecute('CALCULATING_PRICE', currentStep)) {
            this.stateMachine.transitionTo('CALCULATING_PRICE');
            await this.progressTracker.saveCheckpoint(queueId, 'CALCULATING_PRICE', { wedropProduct, aiListing });
            
            pricingResult = await this.retryEngine.execute('Pricing Calculation', () => 
                this.pricingEngine.calculateOptimalPricing(
                    wedropProduct.sku, 
                    null, 
                    wedropProduct.price, 
                    { category: wedropProduct.category, weight: wedropProduct.weight, dimensions: wedropProduct.dimensions, price: wedropProduct.price }
                )
            );
            currentStep = 'GENERATING_IMAGES';
        }

        // Step 9: Image Intelligence
        if (this.shouldExecute('GENERATING_IMAGES', currentStep)) {
            this.stateMachine.transitionTo('GENERATING_IMAGES');
            await this.progressTracker.saveCheckpoint(queueId, 'GENERATING_IMAGES', { wedropProduct, aiListing, pricingResult });
            
            images = await this.retryEngine.execute('Image Generation', () => 
                this.imageEngine.generateImageSet(wedropProduct)
            );
            currentStep = 'PUBLISHING';
        }

        // Step 10 & 11: Amazon Publisher & Validation
        if (this.shouldExecute('PUBLISHING', currentStep)) {
            this.stateMachine.transitionTo('PUBLISHING');
            await this.progressTracker.saveCheckpoint(queueId, 'PUBLISHING', { wedropProduct, aiListing, pricingResult, images });
            
            const publishSuccess = await this.retryEngine.execute('Amazon Publishing', () => 
                this.amazonPublisher.publish({
                    product: productEntity,
                    aiListing,
                    pricing: pricingResult,
                    images
                })
            );

            if (!publishSuccess) {
                throw new Error("Amazon publication failed or validation was not confirmed.");
            }
            currentStep = 'SYNCING';
        }

        // Step 12 & 13: Bling Integration & Validation
        if (this.shouldExecute('SYNCING', currentStep)) {
            this.stateMachine.transitionTo('SYNCING');
            await this.progressTracker.saveCheckpoint(queueId, 'SYNCING', { wedropProduct });
            
            const syncSuccess = await this.retryEngine.execute('Bling Integration', () => 
                this.blingIntegration.integrate({
                    sku: wedropProduct.sku,
                    originalWedropSku: wedropProduct.sku,
                    title: aiListing.title,
                    price: pricingResult.metrics.suggestedPrice,
                    stock: wedropProduct.stock,
                    isAmazonPublished: true // Guaranteed by previous step
                })
            );

            if (!syncSuccess) {
                throw new Error("Bling synchronization failed.");
            }
        }

        // Step 14: Register History & Complete
        this.stateMachine.transitionTo('COMPLETED');
    }

    private shouldExecute(targetStep: GlobalState, currentStep: GlobalState): boolean {
        const order: GlobalState[] = ['GENERATING_AI', 'CALCULATING_PRICE', 'GENERATING_IMAGES', 'PUBLISHING', 'SYNCING'];
        return order.indexOf(targetStep) >= order.indexOf(currentStep);
    }
}
