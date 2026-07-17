import { supabaseClient } from '../database/SupabaseClient';
import { ProductRepository } from '../repositories/ProductRepository';
import { 
    ListingRepository, QueueRepository, IntegrationRepository, LogRepository 
} from '../repositories/SupabaseRepositories';

// Proxies (Frontend -> Backend Communication)
import { GeminiProviderProxy } from '../services/ai/GeminiProviderProxy';
import { GeminiImageProviderProxy } from '../services/images/GeminiImageProviderProxy';
import { WedropProviderProxy } from '../services/wedrop/providers/WedropProviderProxy';
import { AmazonProviderProxy } from '../services/amazon/AmazonProviderProxy';
import { BlingProviderProxy } from '../services/bling/BlingProviderProxy';

// Interfaces
import { IWedropProvider } from '../services/wedrop/types';

// Managers & Engines
import { WedropSyncManager } from '../../application/services/wedrop/WedropSyncManager';
import { AIListingEngine } from '../../application/services/ai/AIListingEngine';
import { SEOModule } from '../../application/services/ai/modules/SEOModule';
import { CopywritingModule } from '../../application/services/ai/modules/CopywritingModule';
import { ConversionModule } from '../../application/services/ai/modules/ConversionModule';
import { AmazonStructureModule } from '../../application/services/ai/modules/AmazonStructureModule';
import { QualityScorerModule } from '../../application/services/ai/modules/QualityScorerModule';
import { PricingEngine } from '../../application/services/pricing/PricingEngine';
import { ImageIntelligenceEngine } from '../../application/services/images/ImageIntelligenceEngine';
import { AmazonPublisherService } from '../../application/services/amazon/AmazonPublisherService';
import { BlingIntegrationService } from '../../application/services/bling/BlingIntegrationService';
import { AutomationOrchestrator } from '../../application/services/automation/AutomationOrchestrator';
import { IIntegrationRepository } from '../../domain/repositories';

export class DependencyInjectionContainer {
    private static instance: DependencyInjectionContainer;
    
    public readonly orchestrator: AutomationOrchestrator;
    public readonly wedropSyncManager: WedropSyncManager;
    public readonly integrationRepo: IIntegrationRepository;
    public readonly wedropProvider: IWedropProvider;

    private constructor() {
        // 1. Real Supabase Repositories (Frontend still reads/writes to DB for UI state)
        const productRepo = new ProductRepository(supabaseClient);
        const listingRepo = new ListingRepository(supabaseClient);
        const queueRepo = new QueueRepository(supabaseClient);
        this.integrationRepo = new IntegrationRepository(supabaseClient);
        const logRepo = new LogRepository(supabaseClient);

        // 2. Proxies (Execution moved to Backend)
        this.wedropProvider = new WedropProviderProxy();
        const aiProvider = new GeminiProviderProxy();
        const imageProvider = new GeminiImageProviderProxy();
        const amazonProvider = new AmazonProviderProxy();
        const blingProvider = new BlingProviderProxy();

        // 3. Application Services & Engines
        this.wedropSyncManager = new WedropSyncManager(
            productRepo, 
            listingRepo, 
            queueRepo, 
            this.integrationRepo, 
            logRepo,
            this.wedropProvider
        );
        
        const aiListingEngine = new AIListingEngine(
            aiProvider,
            new SEOModule(),
            new CopywritingModule(),
            new ConversionModule(),
            new AmazonStructureModule(),
            new QualityScorerModule()
        );

        const pricingEngine = new PricingEngine();
        
        const imageEngine = new ImageIntelligenceEngine(imageProvider);
        
        const amazonPublisher = new AmazonPublisherService(amazonProvider);
        
        const blingIntegration = new BlingIntegrationService(blingProvider);

        // 4. The Brain: Autonomous Engine Orchestrator
        this.orchestrator = new AutomationOrchestrator(
            queueRepo,
            logRepo,
            this.wedropSyncManager,
            aiListingEngine,
            pricingEngine,
            imageEngine,
            amazonPublisher,
            blingIntegration
        );
    }

    public static getInstance(): DependencyInjectionContainer {
        if (!DependencyInjectionContainer.instance) {
            DependencyInjectionContainer.instance = new DependencyInjectionContainer();
        }
        return DependencyInjectionContainer.instance;
    }
}
